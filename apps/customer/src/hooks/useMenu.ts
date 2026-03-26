import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Category, MenuItem } from '@restaurant/types';

const ISR_REVALIDATE_SECONDS = 60;

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories', undefined, ISR_REVALIDATE_SECONDS),
    staleTime: ISR_REVALIDATE_SECONDS * 1000,
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
  const endpoint = `/menu${queryString ? `?${queryString}` : ''}`;

  return useQuery<MenuItem[]>({
    queryKey: ['menuItems', filters],
    queryFn: () => api.get<MenuItem[]>(endpoint, undefined, ISR_REVALIDATE_SECONDS),
    staleTime: ISR_REVALIDATE_SECONDS * 1000,
  });
}

export function useMenuItem(slug: string) {
  return useQuery<MenuItem>({
    queryKey: ['menuItem', slug],
    queryFn: () => api.get<MenuItem>(`/menu/${slug}`, undefined, ISR_REVALIDATE_SECONDS),
    enabled: !!slug,
    staleTime: ISR_REVALIDATE_SECONDS * 1000,
  });
}
