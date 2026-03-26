import Image from 'next/image';
import { useCategories } from '@/hooks/useMenu';
import { ChefHat, Check } from 'lucide-react';
import type { Category } from '@restaurant/types';

interface CategoryCardProps {
  category: Category;
  isSelected: boolean;
  onSelect: () => void;
}

function CategoryCard({ category, isSelected, onSelect }: CategoryCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`group relative overflow-hidden rounded-2xl w-full text-left transition-all duration-300 ${
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
        <div className="relative h-28 overflow-hidden">
          <Image
            src={category.imageUrl}
            alt={category.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-white drop-shadow-lg">{category.name}</h3>
              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
                  <Check className="w-4 h-4 text-white" aria-hidden="true" />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative p-6">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-lg ${
              isSelected ? 'bg-orange-500' : 'bg-gradient-to-br from-orange-500 to-red-500'
            }`}
          >
            <ChefHat className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3
                className={`font-bold text-lg ${
                  isSelected ? 'text-orange-600' : 'text-slate-900'
                } group-hover:text-orange-600 transition-colors`}
              >
                {category.name}
              </h3>
              {category.description && (
                <p className="text-sm text-slate-500 mt-1 line-clamp-1">{category.description}</p>
              )}
            </div>
            {isSelected && (
              <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
                <Check className="w-4 h-4 text-white" aria-hidden="true" />
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

export function CategoryList({
  selectedCategoryId,
  onSelectCategory,
  onClearCategory,
}: CategoryListProps) {
  const { data: categories, isLoading, error } = useCategories();

  const handleSelect = (categoryId: string) => {
    if (selectedCategoryId === categoryId) {
      onClearCategory?.();
    } else {
      onSelectCategory?.(categoryId);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 rounded-2xl bg-red-50 border border-red-100">
        <p className="text-red-600">Failed to load categories</p>
      </div>
    );
  }

  if (!categories?.length) {
    return (
      <div className="text-center p-8 rounded-2xl bg-slate-50 border border-slate-100">
        <p className="text-slate-500">No categories available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            isSelected={selectedCategoryId === category.id}
            onSelect={() => handleSelect(category.id)}
          />
        ))}
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
