'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Leaf, Heart, WheatOff, Clock, Star, ShoppingCart } from 'lucide-react';
import { useMenuItem } from '@/hooks/useMenu';

export default function MenuItemPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: item, isLoading, error } = useMenuItem(slug);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <header className="bg-white border-b border-slate-200/50 sticky top-0 z-10 backdrop-blur-lg bg-white/80">
          <div className="container mx-auto px-4 py-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-orange-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Menu</span>
            </Link>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-80 rounded-2xl bg-slate-200 mb-8" />
            <div className="h-8 w-64 bg-slate-200 rounded mb-4" />
            <div className="h-4 w-96 bg-slate-200 rounded mb-6" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <header className="bg-white border-b border-slate-200/50 sticky top-0 z-10 backdrop-blur-lg bg-white/80">
          <div className="container mx-auto px-4 py-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-orange-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Menu</span>
            </Link>
          </div>
        </header>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Item Not Found</h1>
          <p className="text-slate-500">The menu item you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="bg-white border-b border-slate-200/50 sticky top-0 z-10 backdrop-blur-lg bg-white/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-orange-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Menu</span>
            </Link>
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
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden bg-slate-100">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl font-bold text-slate-300">{item.name.charAt(0)}</span>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">{item.name}</h1>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-current" />
                    <span>4.5</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{item.preparationTime} min</span>
                  </div>
                </div>
              </div>
              <span className="text-4xl font-bold text-orange-600">₹{item.price}</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {item.isVegetarian && (
                <span className="inline-flex items-center gap-1 text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded-full">
                  <Leaf className="w-4 h-4" /> Vegetarian
                </span>
              )}
              {item.isVegan && (
                <span className="inline-flex items-center gap-1 text-sm bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full">
                  <Heart className="w-4 h-4" /> Vegan
                </span>
              )}
              {item.isGlutenFree && (
                <span className="inline-flex items-center gap-1 text-sm bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full">
                  <WheatOff className="w-4 h-4" /> Gluten-free
                </span>
              )}
            </div>

            {item.description && (
              <p className="text-slate-600 text-lg leading-relaxed mb-8">{item.description}</p>
            )}

            <div className="border-t border-slate-200 pt-6">
              <button className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all active:scale-95">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
