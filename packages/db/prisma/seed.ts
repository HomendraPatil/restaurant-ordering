import { PrismaClient, Role, CustomizationType } from '@prisma/client';
import { hash } from 'bcrypt';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const prisma = new PrismaClient();

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.S3_BUCKET || 'restaurant-images';

const CATEGORIES = [
  {
    name: 'Starters',
    description: 'Delicious appetizers to begin your meal',
    imageUrl: 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=800',
    slug: 'starters',
    sortOrder: 1,
  },
  {
    name: 'Main Course',
    description: 'Hearty main dishes that satisfy',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    slug: 'main-course',
    sortOrder: 2,
  },
  {
    name: 'Biryani & Rice',
    description: 'Flavorful rice dishes and biryanis',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800',
    slug: 'biryani-rice',
    sortOrder: 3,
  },
  {
    name: 'Breads',
    description: 'Freshly baked Indian breads',
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800',
    slug: 'breads',
    sortOrder: 4,
  },
  {
    name: 'Desserts',
    description: 'Sweet endings to your meal',
    imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800',
    slug: 'desserts',
    sortOrder: 5,
  },
  {
    name: 'Beverages',
    description: 'Refreshing drinks and beverages',
    imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800',
    slug: 'beverages',
    sortOrder: 6,
  },
  {
    name: 'Salads & Sides',
    description: 'Fresh salads and tasty sides',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    slug: 'salads-sides',
    sortOrder: 7,
  },
  {
    name: 'South Indian',
    description: 'Authentic South Indian delicacies',
    imageUrl: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=800',
    slug: 'south-indian',
    sortOrder: 8,
  },
];

const MENU_ITEMS: Record<string, Array<{
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  preparationTime: number;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isLimited?: boolean;
  stockQuantity?: number;
  customizations?: Array<{
    name: string;
    type: CustomizationType;
    isRequired?: boolean;
    minSelections?: number;
    maxSelections?: number;
    options: Array<{ name: string; priceModifier: number; isDefault?: boolean }>;
  }>;
}>> = {
  starters: [
    { name: 'Paneer Tikka', description: 'Cottage cheese cubes marinated in spices and grilled to perfection', imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600', price: 299, preparationTime: 15, isVegetarian: true, isGlutenFree: true, customizations: [{ name: 'Spice Level', type: CustomizationType.ADDON, isRequired: false, options: [{ name: 'Mild', priceModifier: 0 }, { name: 'Medium', priceModifier: 0 }, { name: 'Hot', priceModifier: 0 }] }] },
    { name: 'Hara Bhara Kebab', description: 'Spinach and pea patties with aromatic spices', imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600', price: 249, preparationTime: 12, isVegetarian: true },
    { name: 'Crispy Corn', description: 'Golden fried corn kernels with spicy seasoning', imageUrl: 'https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=600', price: 199, preparationTime: 10, isVegetarian: true },
    { name: 'Crispy Veggie Platter', description: 'Assorted crispy vegetables with mint chutney', imageUrl: 'https://images.unsplash.com/photo-1540914124281-342587941389?w=600', price: 279, preparationTime: 15, isVegetarian: true },
    { name: 'Mushroom Chilli', description: 'Button mushrooms in spicy Indo-Chinese sauce', imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600', price: 279, preparationTime: 12, isVegetarian: true, isVegan: true },
    { name: 'Aloo Tikki Chaat', description: 'Golden potato patties topped with chutneys and yogurt', imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600', price: 179, preparationTime: 10, isVegetarian: true },
    { name: 'Pav Bhaji', description: 'Spiced mashed vegetables served with buttered buns', imageUrl: 'https://images.unsplash.com/photo-1608835291093-394b0c943a75?w=600', price: 229, preparationTime: 15, isVegetarian: true },
    { name: 'Dahi Ke Kebab', description: 'Soft kebabs made with hung curd and spices', imageUrl: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=600', price: 259, preparationTime: 12, isVegetarian: true },
    { name: 'Spring Roll (6 pcs)', description: 'Crispy rolls filled with vegetables', imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600', price: 199, preparationTime: 10, isVegetarian: true, isVegan: true },
    { name: 'Garlic Mushroom', description: 'Sauteed mushrooms with garlic and herbs', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600', price: 269, preparationTime: 12, isVegetarian: true },
    { name: 'Chilli Paneer Dry', description: 'Paneer cubes in spicy chilli sauce', imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600', price: 289, preparationTime: 12, isVegetarian: true, isGlutenFree: true },
    { name: 'Samosa (2 pcs)', description: 'Crispy pastry filled with spiced potatoes', imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600', price: 99, preparationTime: 8, isVegetarian: true, isVegan: true },
  ],
  'main-course': [
    { name: 'Paneer Butter Masala', description: 'Creamy tomato gravy with soft paneer cubes', imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600', price: 349, preparationTime: 20, isVegetarian: true, isGlutenFree: true },
    { name: 'Dal Makhani', description: 'Slow-cooked black lentils in butter and cream', imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600', price: 279, preparationTime: 15, isVegetarian: true, isGlutenFree: true },
    { name: 'Shahi Paneer', description: 'Rich and creamy paneer in a royal cashew gravy', imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600', price: 369, preparationTime: 20, isVegetarian: true, isGlutenFree: true },
    { name: 'Malai Kofta', description: 'Soft cottage cheese dumplings in creamy gravy', imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600', price: 359, preparationTime: 20, isVegetarian: true, isGlutenFree: true },
    { name: 'Mix Veg Curry', description: 'Assorted vegetables in a aromatic spiced gravy', imageUrl: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600', price: 269, preparationTime: 15, isVegetarian: true, isGlutenFree: true },
    { name: 'Chole Masala', description: 'Spiced chickpeas in a tangy tomato gravy', imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600', price: 259, preparationTime: 15, isVegetarian: true, isVegan: true, isGlutenFree: true },
    { name: 'Mushroom Masala', description: 'Button mushrooms in a rich onion-tomato gravy', imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600', price: 299, preparationTime: 18, isVegetarian: true },
    { name: 'Aloo Gobi', description: 'Potato and cauliflower in traditional spices', imageUrl: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=600', price: 249, preparationTime: 15, isVegetarian: true, isVegan: true },
    { name: 'Baingan Bharta', description: 'Roasted eggplant mashed with onions and spices', imageUrl: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=600', price: 239, preparationTime: 15, isVegetarian: true, isVegan: true, isGlutenFree: true },
    { name: 'Kadai Paneer', description: 'Paneer cooked with bell peppers in kadai masala', imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600', price: 339, preparationTime: 18, isVegetarian: true, isGlutenFree: true },
    { name: 'Palak Paneer', description: 'Cottage cheese in creamy spinach gravy', imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600', price: 329, preparationTime: 18, isVegetarian: true, isGlutenFree: true },
    { name: 'Methi Malai Mutter', description: 'Fenugreek leaves with green peas in cream', imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600', price: 279, preparationTime: 15, isVegetarian: true, isGlutenFree: true },
  ],
  'biryani-rice': [
    { name: 'Veg Biryani', description: 'Fragrant basmati rice layered with vegetables and spices', imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600', price: 299, preparationTime: 25, isVegetarian: true, isVegan: true, customizations: [{ name: 'Spice Level', type: CustomizationType.ADDON, isRequired: false, options: [{ name: 'Mild', priceModifier: 0 }, { name: 'Medium', priceModifier: 0 }, { name: 'Spicy', priceModifier: 0 }] }] },
    { name: 'Paneer Biryani', description: 'Aromatic biryani with marinated paneer cubes', imageUrl: 'https://images.unsplash.com/photo-1642821373181-696a54913e93?w=600', price: 349, preparationTime: 25, isVegetarian: true, customizations: [{ name: 'Portion', type: CustomizationType.SIZE, isRequired: true, minSelections: 1, maxSelections: 1, options: [{ name: 'Half', priceModifier: -100 }, { name: 'Full', priceModifier: 0 }] }] },
    { name: 'Jeera Rice', description: 'Basmati rice tempered with cumin seeds', imageUrl: 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=600', price: 149, preparationTime: 10, isVegetarian: true, isVegan: true, isGlutenFree: true },
    { name: 'Steamed Rice', description: 'Plain steamed basmati rice', imageUrl: 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=600', price: 129, preparationTime: 10, isVegetarian: true, isVegan: true, isGlutenFree: true },
    { name: 'Veg Pulao', description: 'Flavored rice with mixed vegetables', imageUrl: 'https://images.unsplash.com/photo-1642821373181-696a54913e93?w=600', price: 199, preparationTime: 15, isVegetarian: true, isVegan: true },
    { name: 'Kashmiri Pulao', description: 'Sweet rice with dry fruits and saffron', imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600', price: 279, preparationTime: 18, isVegetarian: true, isGlutenFree: true },
    { name: 'Mushroom Biryani', description: 'Fragrant biryani with sauteed mushrooms', imageUrl: 'https://images.unsplash.com/photo-1642821373181-696a54913e93?w=600', price: 329, preparationTime: 25, isVegetarian: true },
    { name: 'Dal Khichdi', description: 'Comforting rice and lentil dish', imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600', price: 199, preparationTime: 20, isVegetarian: true, isVegan: true, isGlutenFree: true },
    { name: 'Lemon Rice', description: 'Tangy rice with fresh lemon and peanuts', imageUrl: 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=600', price: 169, preparationTime: 12, isVegetarian: true, isVegan: true },
    { name: 'Curd Rice', description: 'Cool rice mixed with fresh yogurt and herbs', imageUrl: 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=600', price: 149, preparationTime: 8, isVegetarian: true, isGlutenFree: true },
  ],
  breads: [
    { name: 'Butter Naan', description: 'Soft leavened bread brushed with butter', imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600', price: 59, preparationTime: 8, isVegetarian: true, customizations: [{ name: 'Quantity', type: CustomizationType.SIZE, isRequired: true, options: [{ name: '1 Piece', priceModifier: 0 }, { name: '2 Pieces', priceModifier: 59, isDefault: true }, { name: '4 Pieces', priceModifier: 177 }] }] },
    { name: 'Garlic Naan', description: 'Naan topped with garlic and butter', imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600', price: 79, preparationTime: 8, isVegetarian: true },
    { name: 'Tandoori Roti', description: 'Whole wheat bread from clay oven', imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600', price: 39, preparationTime: 6, isVegetarian: true, isVegan: true, isGlutenFree: true },
    { name: 'Butter Kulcha', description: 'Soft bread with butter on top', imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600', price: 69, preparationTime: 8, isVegetarian: true },
    { name: 'Aloo Paratha', description: 'Stuffed bread with spiced potato filling', imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600', price: 89, preparationTime: 10, isVegetarian: true, isVegan: true },
    { name: 'Gobhi Paratha', description: 'Stuffed bread with cauliflower filling', imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600', price: 89, preparationTime: 10, isVegetarian: true, isVegan: true },
    { name: 'Paneer Paratha', description: 'Stuffed bread with paneer filling', imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600', price: 99, preparationTime: 10, isVegetarian: true },
    { name: 'Laccha Paratha', description: 'Layered flaky bread', imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600', price: 79, preparationTime: 8, isVegetarian: true },
    { name: 'Missi Roti', description: 'Gram flour bread with spices', imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600', price: 49, preparationTime: 8, isVegetarian: true, isVegan: true, isGlutenFree: true },
    { name: 'Rumali Roti', description: 'Thin soft flatbread', imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600', price: 39, preparationTime: 5, isVegetarian: true, isVegan: true },
  ],
  desserts: [
    { name: 'Gulab Jamun (2 pcs)', description: 'Deep-fried milk balls soaked in sugar syrup', imageUrl: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=600', price: 99, preparationTime: 5, isVegetarian: true, isGlutenFree: true },
    { name: 'Rasmalai (2 pcs)', description: 'Soft cheese patties in sweet saffron milk', imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600', price: 129, preparationTime: 5, isVegetarian: true, isGlutenFree: true },
    { name: 'Gajar Ka Halwa', description: 'Warm carrot pudding with nuts', imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600', price: 149, preparationTime: 8, isVegetarian: true, isGlutenFree: true },
    { name: 'Moong Dal Halwa', description: 'Rich halwa made from lentils and ghee', imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600', price: 159, preparationTime: 10, isVegetarian: true, isGlutenFree: true },
    { name: 'Ice Cream (Scoop)', description: 'Creamy ice cream in various flavors', imageUrl: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600', price: 89, preparationTime: 3, isVegetarian: true, isGlutenFree: true, customizations: [{ name: 'Flavor', type: CustomizationType.SIZE, isRequired: true, options: [{ name: 'Vanilla', priceModifier: 0 }, { name: 'Chocolate', priceModifier: 0 }, { name: 'Mango', priceModifier: 0 }, { name: 'Pista', priceModifier: 20 }] }] },
    { name: 'Kheer', description: 'Traditional rice pudding with cardamom', imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600', price: 119, preparationTime: 5, isVegetarian: true, isGlutenFree: true },
    { name: 'Rasgulla (2 pcs)', description: 'Spongy cottage cheese balls in syrup', imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600', price: 89, preparationTime: 3, isVegetarian: true, isGlutenFree: true },
    { name: 'Jalebi (4 pcs)', description: 'Crispy spirals soaked in sugar syrup', imageUrl: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=600', price: 79, preparationTime: 8, isVegetarian: true, isVegan: true },
    { name: 'Kulfi', description: 'Traditional Indian ice cream with pistachios', imageUrl: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600', price: 109, preparationTime: 3, isVegetarian: true, isGlutenFree: true },
    { name: 'Phirni', description: 'Rice flour pudding with nuts', imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600', price: 119, preparationTime: 5, isVegetarian: true, isGlutenFree: true },
  ],
  beverages: [
    { name: 'Masala Chai', description: 'Spiced Indian tea with milk', imageUrl: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=600', price: 49, preparationTime: 5, isVegetarian: true, isVegan: false },
    { name: 'Filter Coffee', description: 'Strong South Indian coffee', imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600', price: 59, preparationTime: 5, isVegetarian: true },
    { name: 'Sweet Lassi', description: 'Creamy yogurt drink with sugar', imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600', price: 99, preparationTime: 5, isVegetarian: true, isGlutenFree: true },
    { name: 'Mango Lassi', description: 'Yogurt smoothie with mango', imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600', price: 119, preparationTime: 5, isVegetarian: true, isGlutenFree: true },
    { name: 'Buttermilk (Chaas)', description: 'Refreshing spiced buttermilk', imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600', price: 59, preparationTime: 3, isVegetarian: true, isVegan: true, isGlutenFree: true },
    { name: 'Fresh Lime Soda', description: 'Lime juice with soda water', imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600', price: 79, preparationTime: 3, isVegetarian: true, isVegan: true, isGlutenFree: true, customizations: [{ name: 'Style', type: CustomizationType.ADDON, isRequired: false, options: [{ name: 'Sweet', priceModifier: 0 }, { name: 'Salt', priceModifier: 0 }, { name: 'Mint', priceModifier: 20 }] }] },
    { name: 'Cold Coffee', description: 'Chilled coffee with ice cream', imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600', price: 149, preparationTime: 5, isVegetarian: true },
    { name: 'Rose Sharbat', description: 'Traditional rose drink with sabja seeds', imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600', price: 89, preparationTime: 3, isVegetarian: true, isVegan: true, isGlutenFree: true },
    { name: 'Aam Panna', description: 'Raw mango drink with spices', imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600', price: 99, preparationTime: 5, isVegetarian: true, isVegan: true, isGlutenFree: true },
    { name: 'Mineral Water', description: 'Packaged drinking water', imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600', price: 29, preparationTime: 1, isVegetarian: true, isVegan: true, isGlutenFree: true },
  ],
  'salads-sides': [
    { name: 'Green Salad', description: 'Fresh mixed greens with vinaigrette', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600', price: 99, preparationTime: 5, isVegetarian: true, isVegan: true, isGlutenFree: true },
    { name: 'Raita (Bowl)', description: 'Yogurt with cucumber and spices', imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600', price: 79, preparationTime: 5, isVegetarian: true, isGlutenFree: true, customizations: [{ name: 'Type', type: CustomizationType.ADDON, isRequired: false, options: [{ name: 'Plain', priceModifier: 0 }, { name: 'Boondi', priceModifier: 20 }, { name: 'Mixed Veg', priceModifier: 20 }] }] },
    { name: 'Onion Salad', description: 'Fresh onion rings with green chutney', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600', price: 49, preparationTime: 3, isVegetarian: true, isVegan: true, isGlutenFree: true },
    { name: 'Papad (2 pcs)', description: 'Crispy lentil wafers', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600', price: 39, preparationTime: 3, isVegetarian: true, isVegan: true },
    { name: 'Chutneys (Pack)', description: 'Assorted mint and tamarind chutneys', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600', price: 49, preparationTime: 2, isVegetarian: true, isVegan: true, isGlutenFree: true },
    { name: 'Kheer (Small)', description: 'Sweet rice pudding serving', imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600', price: 89, preparationTime: 3, isVegetarian: true, isGlutenFree: true },
    { name: 'Chips & Salsa', description: 'Potato chips with tomato salsa', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600', price: 99, preparationTime: 3, isVegetarian: true, isVegan: true },
  ],
  'south-indian': [
    { name: 'Masala Dosa', description: 'Crispy crepe with spiced potato filling', imageUrl: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=600', price: 149, preparationTime: 15, isVegetarian: true, isVegan: true, customizations: [{ name: 'Size', type: CustomizationType.SIZE, isRequired: true, options: [{ name: 'Regular', priceModifier: 0, isDefault: true }, { name: 'Paper (Crispy)', priceModifier: 30 }] }] },
    { name: 'Mysore Masala Dosa', description: 'Dosa with spicy red chutney and potato', imageUrl: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=600', price: 179, preparationTime: 15, isVegetarian: true, isVegan: true },
    { name: 'Rava Dosa', description: 'Semolina crepe with cumin and pepper', imageUrl: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=600', price: 139, preparationTime: 12, isVegetarian: true, isVegan: true },
    { name: 'Idli (2 pcs)', description: 'Steamed rice cakes with sambar', imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600', price: 89, preparationTime: 10, isVegetarian: true, isVegan: true, isGlutenFree: true },
    { name: 'Medu Vada (2 pcs)', description: 'Crispy lentil fritters with sambar', imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600', price: 99, preparationTime: 10, isVegetarian: true, isVegan: true, isGlutenFree: true },
    { name: 'Uttapam', description: 'Thick pancake topped with vegetables', imageUrl: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=600', price: 129, preparationTime: 12, isVegetarian: true, isVegan: true },
    { name: 'Pongal', description: 'Rice and lentil dish with ghee', imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600', price: 119, preparationTime: 10, isVegetarian: true, isGlutenFree: true },
    { name: 'Appam (2 pcs)', description: 'Lacy rice pancakes with coconut', imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600', price: 109, preparationTime: 12, isVegetarian: true, isGlutenFree: true },
    { name: 'Upma', description: 'Semolina savory porridge', imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600', price: 99, preparationTime: 10, isVegetarian: true, isVegan: true },
    { name: 'Poha', description: 'Flattened rice with vegetables', imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600', price: 99, preparationTime: 10, isVegetarian: true, isVegan: true },
  ],
};

async function downloadAndUploadImage(imageUrl: string, key: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: Buffer.from(buffer),
      ContentType: contentType,
      ACL: 'public-read',
    }));

    const baseUrl = `${process.env.S3_ENDPOINT || 'http://localhost:9000'}/${BUCKET_NAME}`;
    return `${baseUrl}/${key}`;
  } catch (error) {
    console.error(`Failed to upload image: ${imageUrl}`, error);
    return imageUrl;
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function main() {
  console.log('🌱 Starting database seed...');

  console.log('\n👤 Creating users...');
  const adminPasswordHash = await hash('admin123', 12);
  const customerPasswordHash = await hash('customer123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@restaurant.com' },
    update: {},
    create: {
      email: 'admin@restaurant.com',
      passwordHash: adminPasswordHash,
      name: 'Admin User',
      phone: '+919876543210',
      role: Role.ADMIN,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      email: 'customer@test.com',
      passwordHash: customerPasswordHash,
      name: 'Test Customer',
      phone: '+919876543211',
      role: Role.CUSTOMER,
    },
  });

  console.log('✅ Users created');

  console.log('\n📦 Creating categories and menu items...');

  for (const category of CATEGORIES) {
    const imageKey = `categories/${slugify(category.slug)}.jpg`;
    const imageUrl = await downloadAndUploadImage(category.imageUrl, imageKey);

    const createdCategory = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { imageUrl },
      create: {
        name: category.name,
        description: category.description,
        slug: category.slug,
        sortOrder: category.sortOrder,
        imageUrl,
      },
    });

    const menuItemsForCategory = MENU_ITEMS[category.slug] || [];

    for (let i = 0; i < menuItemsForCategory.length; i++) {
      const item = menuItemsForCategory[i];
      const menuSlug = slugify(`${category.slug}-${item.name}-${i}`);

      const imageKey = `menu-items/${menuSlug}.jpg`;
      const imageUrl = await downloadAndUploadImage(item.imageUrl, imageKey);

      const createdMenuItem = await prisma.menuItem.upsert({
        where: { slug: menuSlug },
        update: { imageUrl },
        create: {
          categoryId: createdCategory.id,
          slug: menuSlug,
          name: item.name,
          description: item.description,
          imageUrl,
          price: item.price,
          preparationTime: item.preparationTime,
          isVegetarian: item.isVegetarian ?? true,
          isVegan: item.isVegan ?? false,
          isGlutenFree: item.isGlutenFree ?? false,
          isLimited: item.isLimited ?? false,
          stockQuantity: item.stockQuantity ?? 100,
          isAvailable: true,
        },
      });

      if (item.customizations) {
        for (const group of item.customizations) {
          const createdGroup = await prisma.itemCustomizationGroup.upsert({
            where: {
              id: `${createdMenuItem.id}-${slugify(group.name)}`,
            },
            update: {},
            create: {
              id: `${createdMenuItem.id}-${slugify(group.name)}`,
              menuItemId: createdMenuItem.id,
              type: group.type,
              name: group.name,
              isRequired: group.isRequired ?? false,
              minSelections: group.minSelections ?? 0,
              maxSelections: group.maxSelections ?? 1,
              sortOrder: 0,
            },
          });

          for (const option of group.options) {
            await prisma.customizationOption.upsert({
              where: { id: `${createdGroup.id}-${slugify(option.name)}` },
              update: {},
              create: {
                id: `${createdGroup.id}-${slugify(option.name)}`,
                groupId: createdGroup.id,
                name: option.name,
                priceModifier: option.priceModifier,
                isDefault: option.isDefault ?? false,
                sortOrder: 0,
              },
            });
          }
        }
      }
    }

    console.log(`  ✅ ${category.name}: ${menuItemsForCategory.length} items`);
  }

  console.log('\n📍 Creating sample address...');
  await prisma.address.upsert({
    where: { id: `${customer.id}-default` },
    update: {},
    create: {
      id: `${customer.id}-default`,
      userId: customer.id,
      addressLine: '123 Test Street, Near City Mall',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      isDefault: true,
    },
  });

  console.log('\n✨ Seed completed successfully!');
  console.log('\n📋 Login credentials:');
  console.log('   Admin: admin@restaurant.com / admin123');
  console.log('   Customer: customer@test.com / customer123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
