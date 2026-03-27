'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Leaf, Heart, WheatOff, Clock, Star, Loader2 } from 'lucide-react';
import { CategoryList } from '@/components/CategoryList';
import { CartDrawer } from '@/components/CartDrawer';
import { Header } from '@/components/Header';
import { useCart, useAddToCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/AuthModal';
import { AddToCartButton } from '@/components/AddToCartButton';
import { CustomizationModal } from '@/components/CustomizationModal';
import type { MenuItem } from '@restaurant/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
const ITEMS_PER_PAGE = 12;

interface MenuItemResponse {
  items: MenuItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface MenuItemFilters {
  categoryId?: string;
  search?: string;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

function useInfiniteScroll(onLoadMore: () => void) {
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [onLoadMore]);

  return observerRef;
}

function DietaryBadge({
  type,
  active,
  onClick,
}: {
  type: 'vegetarian' | 'vegan' | 'glutenFree';
  active: boolean;
  onClick: () => void;
}) {
  const config = {
    vegetarian: {
      icon: Leaf,
      label: 'Vegetarian',
      bgActive: 'bg-green-500',
      bgInactive: 'bg-green-50',
      textActive: 'text-white',
      textInactive: 'text-green-700',
    },
    vegan: {
      icon: Heart,
      label: 'Vegan',
      bgActive: 'bg-emerald-500',
      bgInactive: 'bg-emerald-50',
      textActive: 'text-white',
      textInactive: 'text-emerald-700',
    },
    glutenFree: {
      icon: WheatOff,
      label: 'Gluten-free',
      bgActive: 'bg-amber-500',
      bgInactive: 'bg-amber-50',
      textActive: 'text-white',
      textInactive: 'text-amber-700',
    },
  };

  const { icon: Icon, label, bgActive, bgInactive, textActive, textInactive } = config[type];

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
        active
          ? `${bgActive} ${textActive} shadow-md`
          : `${bgInactive} ${textInactive} hover:shadow-sm`
      }`}
      aria-pressed={active}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

function DietaryFilters({
  filters,
  onChange,
}: {
  filters: Record<string, boolean | undefined>;
  onChange: (filters: Record<string, boolean | undefined>) => void;
}) {
  const toggleFilter = (key: 'isVegetarian' | 'isVegan' | 'isGlutenFree') => {
    const newFilters = { ...filters };
    if (newFilters[key] === true) {
      delete newFilters[key];
    } else {
      newFilters[key] = true;
    }
    onChange(newFilters);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <DietaryBadge
        type="vegetarian"
        active={filters.isVegetarian === true}
        onClick={() => toggleFilter('isVegetarian')}
      />
      <DietaryBadge
        type="vegan"
        active={filters.isVegan === true}
        onClick={() => toggleFilter('isVegan')}
      />
      <DietaryBadge
        type="glutenFree"
        active={filters.isGlutenFree === true}
        onClick={() => toggleFilter('isGlutenFree')}
      />
    </div>
  );
}

function PriceRangeFilter({
  filters,
  onChange,
}: {
  filters: { minPrice?: number; maxPrice?: number };
  onChange: (filters: { minPrice?: number; maxPrice?: number }) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
        <input
          type="number"
          placeholder="Min"
          value={filters.minPrice ?? ''}
          onChange={(e) =>
            onChange({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined })
          }
          className="w-28 pl-7 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 transition-all"
          aria-label="Minimum price"
        />
      </div>
      <span className="text-slate-400">—</span>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
        <input
          type="number"
          placeholder="Max"
          value={filters.maxPrice ?? ''}
          onChange={(e) =>
            onChange({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined })
          }
          className="w-28 pl-7 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 transition-all"
          aria-label="Maximum price"
        />
      </div>
    </div>
  );
}

function MenuItemCard({ item, onOpenCart }: { item: MenuItem; onOpenCart: () => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: cart } = useCart();
  const addToCart = useAddToCart();
  
  const customizations = item.customizations as Array<{
    id: string;
    name: string;
    type: 'SIZE' | 'ADDON' | 'TEXT';
    isRequired: boolean;
    options: Array<{ id: string; name: string; priceModifier: number }>;
  }> | undefined;
  const hasCustomizations = customizations && customizations.length > 0;

  const cartItem = cart?.items.find(i => i.menuItemId === item.id);
  const previousSelections = cartItem && cartItem.selectedOptions && cartItem.selectedOptions.length > 0
    ? cartItem.selectedOptions.reduce((acc: Record<string, string[]>, opt: string) => {
        const group = customizations?.find(g => g.options.some(o => o.id === opt));
        if (group) {
          if (!acc[group.id]) acc[group.id] = [];
          acc[group.id].push(opt);
        }
        return acc;
      }, {} as Record<string, string[]>)
    : undefined;

  const handleAddToCart = async (selectedOptions: Record<string, string[]>, customizationPrice: number, unitPrice: number) => {
    try {
      await addToCart.mutateAsync({
        menuItemId: item.id,
        quantity: 1,
        unitPrice: unitPrice,
        customizationPrice,
        selectedOptions: Object.values(selectedOptions).flat(),
      });
      onOpenCart();
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
        <Link href={`/menu/${item.slug}`}>
          <div className="relative h-48 overflow-hidden">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-slate-300 flex items-center justify-center">
                  <span className="text-2xl font-bold text-slate-500">{item.name.charAt(0)}</span>
                </div>
              </div>
            )}
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
              <Star className="w-4 h-4 text-amber-500 fill-current" aria-hidden="true" />
              <span className="text-sm font-semibold text-slate-700">4.5</span>
            </div>
          </div>
        </Link>

        <div className="p-5">
          <Link href={`/menu/${item.slug}`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-slate-900 group-hover:text-orange-600 transition-colors">
                {item.name}
              </h3>
            </div>

            {item.description && (
              <p className="text-sm text-slate-500 mb-3 line-clamp-2">{item.description}</p>
            )}

            <div className="flex flex-wrap gap-1.5 mb-4">
              {item.isVegetarian && (
                <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md">
                  <Leaf className="w-3 h-3" aria-hidden="true" /> Veg
                </span>
              )}
              {item.isVegan && (
                <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md">
                  <Heart className="w-3 h-3" aria-hidden="true" /> Vegan
                </span>
              )}
              {item.isGlutenFree && (
                <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-md">
                  <WheatOff className="w-3 h-3" aria-hidden="true" /> GF
                </span>
              )}
            </div>
          </Link>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span>{item.preparationTime} min</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900">₹{item.price}</span>
              <AddToCartButton 
                menuItem={item} 
                className="text-sm py-1.5 px-3"
                onOpenModal={hasCustomizations ? () => setIsModalOpen(true) : undefined}
              />
            </div>
          </div>
        </div>
      </div>

      <CustomizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        menuItem={item}
        onAddToCart={handleAddToCart}
        previousSelections={previousSelections}
      />
    </>
  );
}

interface MenuItemFilters {
  categoryId?: string;
  search?: string;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

function MenuItemList({ filters, onOpenCart }: { filters: MenuItemFilters; onOpenCart: () => void }) {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isInitialLoading,
  } = useInfiniteQuery<MenuItemResponse>({
    queryKey: ['menu-items', filters],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.append('page', String(pageParam || 1));
      params.append('limit', String(ITEMS_PER_PAGE));
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.search) params.append('search', filters.search);
      if (filters.isVegetarian) params.append('isVegetarian', 'true');
      if (filters.isVegan) params.append('isVegan', 'true');
      if (filters.isGlutenFree) params.append('isGlutenFree', 'true');
      if (filters.minPrice) params.append('minPrice', String(filters.minPrice));
      if (filters.maxPrice) params.append('maxPrice', String(filters.maxPrice));

      const url = `${API_BASE}/menu?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch menu items');
      return res.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1;
      return nextPage <= lastPage.totalPages ? nextPage : undefined;
    },
  });

  const menuItems = data?.pages.flatMap((page) => page.items) ?? [];

  const loadMoreRef = useInfiniteScroll(useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]));

  if (isInitialLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-80 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-12 rounded-2xl bg-red-50 border border-red-100">
        <p className="text-red-600">Failed to load menu items: {error.message}</p>
      </div>
    );
  }

  if (!menuItems.length) {
    return (
      <div className="text-center p-12 rounded-2xl bg-slate-50 border border-slate-100">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
          <Search className="w-8 h-8 text-slate-400" aria-hidden="true" />
        </div>
        <p className="text-slate-600 font-medium">No items found</p>
        <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <MenuItemCard key={item.id} item={item} onOpenCart={onOpenCart} />
        ))}
      </div>
      
      <div ref={loadMoreRef} className="flex justify-center py-4">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading more...</span>
          </div>
        )}
        {!hasNextPage && menuItems.length > 0 && (
          <p className="text-sm text-slate-400">
            Showing {menuItems.length} of {data?.pages[0]?.total ?? 0} items
          </p>
        )}
      </div>
    </div>
  );
}

function SearchSection({
  selectedCategoryId,
  onOpenCart,
}: {
  selectedCategoryId?: string;
  onOpenCart: () => void;
}) {
  const [search, setSearch] = useState('');
  const [dietaryFilters, setDietaryFilters] = useState<Record<string, boolean | undefined>>({});
  const [priceFilters, setPriceFilters] = useState<{ minPrice?: number; maxPrice?: number }>({});

  const filters: MenuItemFilters = {
    ...dietaryFilters,
    ...priceFilters,
    ...(search && { search }),
    ...(selectedCategoryId && { categoryId: selectedCategoryId }),
  };

  return (
    <section>
      <div className="relative mb-6">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder="Search for dishes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-slate-200 text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 transition-all"
          aria-label="Search menu items"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
        <DietaryFilters filters={dietaryFilters} onChange={setDietaryFilters} />
        <PriceRangeFilter filters={priceFilters} onChange={setPriceFilters} />
      </div>

      <MenuItemList filters={filters} onOpenCart={onOpenCart} />
    </section>
  );
}

export default function HomePage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Categories</h2>
          </div>
          <CategoryList
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            onClearCategory={() => setSelectedCategoryId(undefined)}
          />
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Menu</h2>
          </div>
          <SearchSection selectedCategoryId={selectedCategoryId} onOpenCart={() => setIsCartOpen(true)} />
        </section>
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </main>
  );
}
