'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { ChefHat, Check } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
const ITEMS_PER_PAGE = 8;

interface CategoryData {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

interface CategoryResponse {
  items: CategoryData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CategoryCardProps {
  category: CategoryData;
  isSelected: boolean;
  onSelect: () => void;
}

function CategoryCard({ category, isSelected, onSelect }: CategoryCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`group relative overflow-hidden rounded-2xl text-left transition-all duration-300 flex-shrink-0 ${
        isSelected
          ? 'ring-2 ring-orange-500 shadow-xl shadow-orange-200/50 -translate-y-1'
          : 'hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1'
      }`}
    >
      <div
        className={`absolute inset-0 ${
          isSelected ? 'bg-gradient-to-br from-orange-50 to-red-50' : 'bg-gradient-to-br from-white to-slate-50'
        } border border-slate-200/50`}
      />

      {category.imageUrl ? (
        <div className="relative w-44 h-32 overflow-hidden">
          <Image
            src={category.imageUrl}
            alt={category.name}
            fill
            sizes="176px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white drop-shadow-lg truncate">{category.name}</h3>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Check className="w-3 h-3 text-white" aria-hidden="true" />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative w-44 h-32 p-4 flex flex-col justify-center">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-lg ${
              isSelected ? 'bg-orange-500' : 'bg-gradient-to-br from-orange-500 to-red-500'
            }`}
          >
            <ChefHat className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3
                className={`font-bold text-base ${
                  isSelected ? 'text-orange-600' : 'text-slate-900'
                } group-hover:text-orange-600 transition-colors truncate`}
              >
                {category.name}
              </h3>
            </div>
            {isSelected && (
              <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center shadow-lg flex-shrink-0">
                <Check className="w-3 h-3 text-white" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>
      )}
    </button>
  );
}

interface CategoryListProps {
  selectedCategoryId?: string;
  onSelectCategory?: (id: string) => void;
  onClearCategory?: () => void;
}

function useIntersectionObserver(onIntersect: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onIntersect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [onIntersect, enabled]);

  return ref;
}

export function CategoryList({
  selectedCategoryId,
  onSelectCategory,
  onClearCategory,
}: CategoryListProps) {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isInitialLoading,
  } = useInfiniteQuery<CategoryResponse>({
    queryKey: ['categories'],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.append('page', String(pageParam || 1));
      params.append('limit', String(ITEMS_PER_PAGE));

      const url = `${API_BASE}/categories?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1;
      return nextPage <= lastPage.totalPages ? nextPage : undefined;
    },
  });

  const loadMoreRef = useIntersectionObserver(
    useCallback(() => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]),
    hasNextPage && !isFetchingNextPage
  );

  const categories = data?.pages.flatMap((page) => page.items) ?? [];

  const handleSelect = (categoryId: string) => {
    if (selectedCategoryId === categoryId) {
      onClearCategory?.();
    } else {
      onSelectCategory?.(categoryId);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-44 h-32 rounded-2xl bg-slate-100 animate-pulse flex-shrink-0" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 rounded-2xl bg-red-50 border border-red-100">
        <p className="text-red-600">Failed to load categories: {error.message}</p>
      </div>
    );
  }

  if (!categories.length) {
    return (
      <div className="text-center p-8 rounded-2xl bg-slate-50 border border-slate-100">
        <p className="text-slate-500">No categories available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          {categories.map((category, index) => (
            <div key={category.id} className="snap-start" ref={index === categories.length - 1 ? loadMoreRef : undefined}>
              <CategoryCard
                category={category}
                isSelected={selectedCategoryId === category.id}
                onSelect={() => handleSelect(category.id)}
              />
            </div>
          ))}
        </div>
        
        <div className="absolute right-0 top-0 bottom-6 w-8 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none" />
      </div>



      {selectedCategoryId && (
        <div className="flex items-center justify-center gap-3 py-3 px-4 bg-orange-50 rounded-xl border border-orange-200">
          <span className="text-orange-700">
            <span className="font-medium">
              {categories.find((c) => c.id === selectedCategoryId)?.name}
            </span>{' '}
            selected
          </span>
          <button
            onClick={onClearCategory}
            className="text-sm text-orange-600 hover:text-orange-800 font-medium underline underline-offset-2"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
