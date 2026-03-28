export enum Role {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  RECEIVED = 'RECEIVED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum CustomizationType {
  SIZE = 'SIZE',
  ADDON = 'ADDON',
  TEXT = 'TEXT',
}

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor?: string;
}

export const ROLE_DISPLAY: Record<Role, StatusConfig> = {
  [Role.ADMIN]: {
    label: 'Admin',
    color: 'purple',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-200',
  },
  [Role.CUSTOMER]: {
    label: 'Customer',
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200',
  },
};

export const ORDER_STATUS_DISPLAY: Record<OrderStatus, StatusConfig> = {
  [OrderStatus.PENDING]: {
    label: 'Pending',
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-600',
    borderColor: 'border-yellow-200',
  },
  [OrderStatus.RECEIVED]: {
    label: 'Received',
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200',
  },
  [OrderStatus.PREPARING]: {
    label: 'Preparing',
    color: 'orange',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-200',
  },
  [OrderStatus.READY]: {
    label: 'Ready',
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
    borderColor: 'border-green-200',
  },
  [OrderStatus.COMPLETED]: {
    label: 'Completed',
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
    borderColor: 'border-green-200',
  },
  [OrderStatus.CANCELLED]: {
    label: 'Cancelled',
    color: 'red',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600',
    borderColor: 'border-red-200',
  },
  [OrderStatus.PAYMENT_FAILED]: {
    label: 'Payment Failed',
    color: 'red',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600',
    borderColor: 'border-red-200',
  },
};

export const PAYMENT_STATUS_DISPLAY: Record<PaymentStatus, StatusConfig> = {
  [PaymentStatus.PENDING]: {
    label: 'Pending',
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-600',
    borderColor: 'border-yellow-200',
  },
  [PaymentStatus.SUCCESS]: {
    label: 'Success',
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
    borderColor: 'border-green-200',
  },
  [PaymentStatus.FAILED]: {
    label: 'Failed',
    color: 'red',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600',
    borderColor: 'border-red-200',
  },
};

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
  createdAt: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number | string;
  preparationTime: number;
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  stockQuantity: number;
  isLimited: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;
  category?: Category;
  customizations?: ItemCustomizationGroupWithOptions[];
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

export interface ItemCustomizationGroupWithOptions extends Omit<ItemCustomizationGroup, 'type'> {
  type: 'SIZE' | 'ADDON' | 'TEXT';
  options: CustomizationOption[];
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
  selectedOptions?: string[];
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
