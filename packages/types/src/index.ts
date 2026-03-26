export enum Role {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
}

export enum OrderStatus {
  RECEIVED = 'RECEIVED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum CustomizationType {
  SIZE = 'SIZE',
  ADDON = 'ADDON',
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  preparationTime: number;
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  stockQuantity: number;
  isLimited: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  category?: Category;
}

export interface ItemCustomizationGroup {
  id: string;
  menuItemId: string;
  type: CustomizationType;
  name: string;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  sortOrder: number;
}

export interface CustomizationOption {
  id: string;
  groupId: string;
  name: string;
  priceModifier: number;
  isDefault: boolean;
  sortOrder: number;
}

export interface Address {
  id: string;
  userId: string;
  addressLine: string;
  city: string;
  state?: string;
  pincode: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Session {
  id: string;
  sessionToken: string;
  userId?: string;
  refreshToken?: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface CartItem {
  id: string;
  sessionId?: string;
  userId?: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  customizationPrice: number;
  specialInstructions?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CartItemCustomization {
  id: string;
  cartItemId: string;
  optionId: string;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  addressId: string;
  razorpayPaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  customizationPrice: number;
  specialInstructions?: string;
  selectedOptions?: SelectedOption[];
}

export interface Payment {
  id: string;
  orderId: string;
  razorpayPaymentId?: string;
  amount: number;
  status: PaymentStatus;
  createdAt: Date;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  oldStatus?: OrderStatus;
  newStatus: OrderStatus;
  changedById?: string;
  changedAt: Date;
}

export interface SelectedOption {
  groupId: string;
  optionId: string;
  name: string;
  priceModifier: number;
}

export interface MenuItemWithDetails extends MenuItem {
  category: Category;
  customizations: (ItemCustomizationGroup & {
    options: CustomizationOption[];
  })[];
}

export interface CartItemWithDetails extends CartItem {
  menuItem: MenuItem;
  customizations: {
    option: CustomizationOption;
  }[];
}

export interface CartWithTotals {
  items: CartItemWithDetails[];
  subtotal: number;
  taxAmount: number;
  total: number;
}

export interface OrderWithDetails extends Order {
  items: OrderItem[];
  payment?: Payment;
  address: Address;
  user: Omit<User, 'createdAt' | 'updatedAt'>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  tokens: AuthTokens;
  user: Omit<User, 'createdAt' | 'updatedAt'>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MenuFilters {
  categoryId?: string;
  search?: string;
  vegetarian?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface OrderFilters {
  userId?: string;
  status?: OrderStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}
