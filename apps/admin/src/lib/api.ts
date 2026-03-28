import { Role } from '@restaurant/types';

export const USER_ROLES = {
  CUSTOMER: Role.CUSTOMER,
  ADMIN: Role.ADMIN,
} as const;

const ADMIN_API_URL = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : 'http://localhost:3000/api/v1';

interface FetchOptions extends RequestInit {
  token?: string;
}

const handleUnauthorized = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/login';
  }
};

class AdminApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { token, ...fetchOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (response.status === 401) {
      handleUnauthorized();
      throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  get<T>(endpoint: string, token?: string): Promise<T> {
    return this.fetch<T>(endpoint, { method: 'GET', token });
  }

  post<T>(endpoint: string, data?: unknown, token?: string): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  }

  patch<T>(endpoint: string, data?: unknown, token?: string): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    });
  }

  delete<T>(endpoint: string, token?: string): Promise<T> {
    return this.fetch<T>(endpoint, { method: 'DELETE', token });
  }
}

export const adminApi = new AdminApiClient(ADMIN_API_URL);

export const menuApi = {
  getCategories: (token?: string) => 
    adminApi.get<any>('/categories?limit=100&includeInactive=true', token),
  
  getCategory: (id: string, token?: string) => 
    adminApi.get<Category>(`/categories/${id}`, token),
  
  createCategory: (data: Partial<Category>, token?: string) => {
    const payload = {
      name: data.name,
      description: data.description,
      slug: data.slug || data.name?.toLowerCase().replace(/\s+/g, '-'),
      imageUrl: data.imageUrl,
      sortOrder: (data as any).sortOrder ?? 0,
      isActive: (data as any).isActive ?? true,
    };
    return adminApi.post<Category>('/categories', payload, token);
  },
  
  updateCategory: (id: string, data: Partial<Category>, token?: string) => {
    const payload: any = {
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl,
    };
    if ((data as any).sortOrder !== undefined) {
      payload.sortOrder = (data as any).sortOrder;
    }
    if ((data as any).isActive !== undefined) {
      payload.isActive = (data as any).isActive;
    }
    return adminApi.patch<Category>(`/categories/${id}`, payload, token);
  },
  
  deleteCategory: (id: string, token?: string) => 
    adminApi.delete<void>(`/categories/${id}`, token),

  getMenuItems: (token?: string, page = 1, limit = 100) => 
    adminApi.get<any>(`/menu/admin/all?page=${page}&limit=${limit}`, token),
  
  getMenuItem: (id: string, token?: string) => 
    adminApi.get<MenuItem>(`/menu/${id}`, token),
  
  createMenuItem: (data: Partial<MenuItem>, token?: string) => {
    const payload = {
      name: data.name,
      description: data.description,
      slug: data.name?.toLowerCase().replace(/\s+/g, '-'),
      price: Number(data.price) || 0,
      category: { connect: { id: data.categoryId } },
      imageUrl: data.imageUrl,
      isAvailable: data.isAvailable ?? true,
      isVegetarian: data.isVegetarian ?? false,
      isVegan: data.isVegan ?? false,
      isGlutenFree: data.isGlutenFree ?? false,
      stockQuantity: data.stockQuantity ?? 0,
      preparationTime: data.preparationTime ?? 15,
    };
    return adminApi.post<MenuItem>('/menu', payload, token);
  },
  
  updateMenuItem: (id: string, data: Partial<MenuItem>, token?: string) => {
    const payload: any = {
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl,
    };
    if (data.price !== undefined) payload.price = Number(data.price);
    if (data.categoryId) payload.category = { connect: { id: data.categoryId } };
    if (data.isAvailable !== undefined) payload.isAvailable = data.isAvailable;
    if (data.isLimited !== undefined) payload.isLimited = data.isLimited;
    if (data.isVegetarian !== undefined) payload.isVegetarian = data.isVegetarian;
    if (data.isVegan !== undefined) payload.isVegan = data.isVegan;
    if (data.isGlutenFree !== undefined) payload.isGlutenFree = data.isGlutenFree;
    if (data.stockQuantity !== undefined) payload.stockQuantity = data.stockQuantity;
    if (data.preparationTime !== undefined) payload.preparationTime = data.preparationTime;
    return adminApi.patch<MenuItem>(`/menu/${id}`, payload, token);
  },
  
  deleteMenuItem: (id: string, token?: string) => 
    adminApi.delete<void>(`/menu/${id}`, token),

  getCustomizationGroups: (menuItemId: string, token?: string) => 
    adminApi.get<CustomizationGroup[]>(`/menu/${menuItemId}/customization-groups`, token),
  
  createCustomizationGroup: (menuItemId: string, data: Partial<CustomizationGroup>, token?: string) => 
    adminApi.post<CustomizationGroup>(`/menu/${menuItemId}/customization-groups`, data, token),
  
  updateCustomizationGroup: (id: string, data: Partial<CustomizationGroup>, token?: string) => 
    adminApi.patch<CustomizationGroup>(`/menu/customization-groups/${id}`, data, token),
  
  deleteCustomizationGroup: (id: string, token?: string) => 
    adminApi.delete<void>(`/menu/customization-groups/${id}`, token),

  createCustomizationOption: (groupId: string, data: Partial<CustomizationOption>, token?: string) => 
    adminApi.post<CustomizationOption>(`/menu/customization-groups/${groupId}/options`, data, token),
  
  updateCustomizationOption: (id: string, data: Partial<CustomizationOption>, token?: string) => 
    adminApi.patch<CustomizationOption>(`/menu/customization-options/${id}`, data, token),
  
  deleteCustomizationOption: (id: string, token?: string) => 
    adminApi.delete<void>(`/menu/customization-options/${id}`, token),

  getPresignedUrl: (fileName: string, contentType: string, token?: string, type: 'menu-item' | 'category' = 'menu-item') => 
    adminApi.post<PresignedUrlResponse>('/upload/presigned-url', { fileName, contentType, type }, token),

  uploadFile: async (file: File, token?: string, type: 'menu-item' | 'category' = 'menu-item'): Promise<{ fileUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    const response = await fetch(`${ADMIN_API_URL}/upload/direct`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });
    
    if (response.status === 401) {
      handleUnauthorized();
      throw new Error('Session expired. Please login again.');
    }
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    return response.json();
  },
};

export interface AdminOrder {
  id: string;
  status: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  specialInstructions?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  address: {
    addressLine: string;
    city: string;
    pincode: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: string;
    specialInstructions?: string;
    menuItem: {
      id: string;
      name: string;
      imageUrl?: string;
    };
  }>;
  payment?: {
    status: string;
    razorpayPaymentId?: string;
  };
  statusHistory?: Array<{
    id: string;
    oldStatus?: string;
    newStatus: string;
    changedAt: string;
    changedBy?: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

export interface OrdersResponse {
  orders: AdminOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderHistory {
  id: string;
  orderId: string;
  oldStatus?: string;
  newStatus: string;
  changedAt: string;
  changedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: string;
  categoryId: string;
  category?: Category;
  imageUrl?: string;
  isAvailable: boolean;
  isLimited: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  stockQuantity: number;
  preparationTime: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuItemsResponse {
  items: MenuItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomizationGroup {
  id: string;
  name: string;
  menuItemId: string;
  type: 'SINGLE' | 'MULTIPLE';
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  sortOrder: number;
  options: CustomizationOption[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomizationOption {
  id: string;
  name: string;
  priceModifier: number;
  isDefault: boolean;
  sortOrder: number;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const usersApi = {
  getUsers: (token?: string) =>
    adminApi.get<UsersResponse>('/users', token),

  getUser: (id: string, token?: string) =>
    adminApi.get<AdminUser>(`/users/${id}`, token),
};
