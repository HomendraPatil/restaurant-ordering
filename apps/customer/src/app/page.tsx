'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Leaf, Heart, WheatOff, Clock, Star, ShoppingCart } from 'lucide-react';
import { CategoryList } from '@/components/CategoryList';
import { useMenuItems, MenuFilters } from '@/hooks/useMenu';
import type { MenuItem } from '@restaurant/types';

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
  filters: MenuFilters;
  onChange: (filters: MenuFilters) => void;
}) {
  const toggleFilter = (key: keyof MenuFilters) => {
    const newFilters: MenuFilters = { ...filters };
    if ((newFilters as Record<string, unknown>)[key] === true) {
      delete (newFilters as Record<string, unknown>)[key];
    } else {
      (newFilters as Record<string, unknown>)[key] = true;
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
  filters: MenuFilters;
  onChange: (filters: MenuFilters) => void;
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

function MenuItemCard({ item }: { item: MenuItem }) {
  return (
    <Link
      href={`/menu/${item.slug}`}
      className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative h-40 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
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

      <div className="p-5">
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

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <Clock className="w-4 h-4" aria-hidden="true" />
            <span>{item.preparationTime} min</span>
          </div>
          <span className="text-xl font-bold text-slate-900">₹{item.price}</span>
        </div>
      </div>
    </Link>
  );
}

function MenuItemList({ filters }: { filters: MenuFilters }) {
  const { data: menuItems, isLoading, error } = useMenuItems(filters);

  if (isLoading) {
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
        <p className="text-red-600">Failed to load menu items</p>
      </div>
    );
  }

  if (!menuItems?.length) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {menuItems.map((item: MenuItem) => (
        <MenuItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function SearchSection({
  selectedCategoryId,
}: {
  selectedCategoryId?: string;
}) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<MenuFilters>({});

  const combinedFilters = useMemo(() => {
    const result = { ...filters };
    if (search) result.search = search;
    if (selectedCategoryId) result.categoryId = selectedCategoryId;
    return result;
  }, [search, filters, selectedCategoryId]);

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
        <DietaryFilters filters={filters} onChange={setFilters} />
        <PriceRangeFilter filters={filters} onChange={setFilters} />
      </div>

      <MenuItemList filters={combinedFilters} />
    </section>
  );
}

export default function HomePage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="bg-white border-b border-slate-200/50 sticky top-0 z-10 backdrop-blur-lg bg-white/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Savory
            </h1>
            <nav className="flex items-center gap-4">
              <Link
                href="/cart"
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors relative"
              >
                <span className="sr-only">Cart</span>
                <ShoppingCart className="w-6 h-6 text-slate-600" />
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">
                  0
                </div>
              </Link>
            </nav>
          </div>
        </div>
      </header>

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
          <SearchSection
            selectedCategoryId={selectedCategoryId}
          />
        </section>
      </div>
    </main>
  );
}
