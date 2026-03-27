'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Leaf, Heart, WheatOff, Clock, Star, ShoppingCart, Flame, ChefHat } from 'lucide-react';
import { useMenuItem } from '@/hooks/useMenu';
import { AddToCartButton } from '@/components/AddToCartButton';
import { CustomizationSelector } from '@/components/CustomizationSelector';
import { useCart } from '@/hooks/useCart';
import type { MenuItem } from '@restaurant/types';
import type { ItemCustomizationGroupWithOptions } from '@restaurant/types';

export default function MenuItemPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';
  const { data: item, isLoading, error } = useMenuItem(slug);
  const { data: cart } = useCart();
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [totalPrice, setTotalPrice] = useState<number>(0);

  const handleCustomizationChange = (options: Record<string, string[]>, price: number) => {
    setSelectedOptions(options);
    setTotalPrice(price);
  };

  const customizations = (item?.customizations as ItemCustomizationGroupWithOptions[]) || [];

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-80 rounded-2xl bg-slate-200" />
            <div className="h-10 w-3/4 bg-slate-200 rounded" />
            <div className="h-6 w-full bg-slate-200 rounded" />
            <div className="h-6 w-2/3 bg-slate-200 rounded" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-orange-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Menu</span>
            </Link>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center py-16">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <ChefHat className="w-12 h-12 text-slate-300" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Item Not Found</h2>
          <p className="text-slate-500 mb-6">The menu item you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/"
            className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            Browse Menu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-orange-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </Link>
            <Link
              href="/cart"
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors relative"
            >
              <ShoppingCart className="w-6 h-6 text-slate-700" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="relative h-72 sm:h-96">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                <span className="text-8xl font-bold text-orange-200">{item.name.charAt(0)}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{item.name}</h1>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{item.preparationTime} min</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4" />
                    <span>{item.preparationTime * 5} cal</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-orange-600">
                  {customizations.length > 0 && totalPrice > 0 ? `₹${totalPrice}` : `₹${item.price}`}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {item.isVegetarian && (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium bg-green-50 text-green-700 px-3 py-1.5 rounded-full">
                  <Leaf className="w-4 h-4" /> Vegetarian
                </span>
              )}
              {item.isVegan && (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full">
                  <Heart className="w-4 h-4" /> Vegan
                </span>
              )}
              {item.isGlutenFree && (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full">
                  <WheatOff className="w-4 h-4" /> Gluten-free
                </span>
              )}
            </div>

            {item.description && (
              <p className="text-slate-600 text-base leading-relaxed mb-8">
                {item.description}
              </p>
            )}

            {item.category && (
              <div className="flex items-center gap-2 mb-6 text-sm text-slate-500">
                <span className="px-3 py-1 bg-slate-100 rounded-full font-medium">
                  {item.category.name}
                </span>
              </div>
            )}

            {customizations.length > 0 && (
              <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                <CustomizationSelector
                  menuItem={item as MenuItem}
                  customizations={customizations}
                  onCustomizationChange={handleCustomizationChange}
                />
              </div>
            )}

            <div className="pt-6 border-t border-slate-100">
              <AddToCartButton 
                menuItem={item as MenuItem} 
                className="w-full py-4 text-lg font-semibold rounded-xl"
                selectedOptions={selectedOptions}
                customizationPrice={customizations.length > 0 ? totalPrice - Number(item.price) : 0}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}