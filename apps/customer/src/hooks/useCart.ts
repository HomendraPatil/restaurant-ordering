import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CartItem, MenuItem } from '@restaurant/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export interface CartItemWithDetails {
  id: string;
  sessionId?: string;
  userId?: string;
  menuItemId: string;
  quantity: number;
  unitPrice: string;
  customizationPrice: string;
  selectedOptions?: string[];
  specialInstructions?: string;
  menuItem: MenuItem;
  customizations: Array<{
    id: string;
    optionId: string;
    option: { id: string; name: string; priceModifier: string };
  }>;
}

export interface CartData {
  items: CartItemWithDetails[];
  subtotal: number;
  taxAmount: number;
  total: number;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sessionId = localStorage.getItem('cart_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('cart_session_id', sessionId);
  }
  return sessionId;
}

export function useCart() {
  return useQuery<CartData>({
    queryKey: ['cart'],
    queryFn: async () => {
      const sessionId = getSessionId();
      const response = await fetch(`${API_BASE}/cart`, {
        headers: {
          'x-session-id': sessionId,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }
      return response.json();
    },
    staleTime: 30 * 1000,
  });
}

export interface AddToCartParams {
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  customizationPrice?: number;
  specialInstructions?: string;
  selectedOptions?: string[];
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AddToCartParams) => {
      const sessionId = getSessionId();
      const response = await fetch(`${API_BASE}/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        throw new Error('Failed to add item to cart');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export interface UpdateCartItemParams {
  quantity?: number;
  specialInstructions?: string;
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...params }: UpdateCartItemParams & { id: string }) => {
      const response = await fetch(`${API_BASE}/cart/items/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        throw new Error('Failed to update cart item');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/cart/items/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to remove item from cart');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const sessionId = getSessionId();
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-session-id': sessionId,
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE}/cart`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) {
        throw new Error('Failed to clear cart');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}
