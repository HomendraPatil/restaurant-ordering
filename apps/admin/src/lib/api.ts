const ADMIN_API_URL = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : 'http://localhost:3000/api/v1';

interface FetchOptions extends RequestInit {
  token?: string;
}

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
