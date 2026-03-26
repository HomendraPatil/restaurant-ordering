import { useQuery } from '@tanstack/react-query';
import type { Category, MenuItem } from '@restaurant/types';

const API_BASE = 'http://localhost:3000/api/v1';

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      console.log('[useCategories] Fetching categories...');
      const response = await fetch(`${API_BASE}/categories`);
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const result = await response.json();
      console.log('[useCategories] Got', result?.length, 'categories');
      return result;
    },
    staleTime: 60 * 1000,
    retry: 1,
  });
}

export interface MenuFilters {
  categoryId?: string;
  search?: string;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export function useMenuItems(filters?: MenuFilters) {
  const params = new URLSearchParams();

  if (filters?.categoryId) params.append('categoryId', filters.categoryId);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.isVegetarian) params.append('isVegetarian', 'true');
  if (filters?.isVegan) params.append('isVegan', 'true');
  if (filters?.isGlutenFree) params.append('isGlutenFree', 'true');
  if (filters?.minPrice) params.append('minPrice', String(filters.minPrice));
  if (filters?.maxPrice) params.append('maxPrice', String(filters.maxPrice));

  const queryString = params.toString();

  return useQuery<MenuItem[]>({
    queryKey: ['menuItems', filters],
    queryFn: async () => {
      console.log('[useMenuItems] Fetching menu items with filters:', filters);
      const response = await fetch(`${API_BASE}/menu${queryString ? `?${queryString}` : ''}`);
      if (!response.ok) {
        throw new Error('Failed to fetch menu items');
      }
      const result = await response.json();
      console.log('[useMenuItems] Got', result?.length, 'menu items');
      return result;
    },
    staleTime: 60 * 1000,
    retry: 1,
  });
}

export function useMenuItem(slug: string) {
  return useQuery<MenuItem>({
    queryKey: ['menuItem', slug],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/menu/${slug}`);
      if (!response.ok) {
        throw new Error('Failed to fetch menu item');
      }
      return response.json();
    },
    enabled: !!slug,
    staleTime: 60 * 1000,
  });
}
