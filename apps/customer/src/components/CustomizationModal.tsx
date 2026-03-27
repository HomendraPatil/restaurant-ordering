'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Check, Minus, Plus, RotateCcw } from 'lucide-react';
import type { MenuItem } from '@restaurant/types';

interface CustomizationOption {
  id: string;
  name: string;
  priceModifier: number;
  isDefault: boolean;
}

interface CustomizationGroup {
  id: string;
  name: string;
  type: 'SIZE' | 'ADDON' | 'TEXT';
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  options: CustomizationOption[];
}

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: MenuItem;
  onAddToCart: (selectedOptions: Record<string, string[]>, customizationPrice: number, unitPrice: number) => void;
  previousSelections?: Record<string, string[]>;
}

export function CustomizationModal({ 
  isOpen, 
  onClose, 
  menuItem, 
  onAddToCart,
  previousSelections 
}: CustomizationModalProps) {
  const customizations = useMemo(() => {
    return (menuItem.customizations as CustomizationGroup[] | undefined) || [];
  }, [menuItem.customizations]);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [showRepeat, setShowRepeat] = useState(false);
  const [totalPrice, setTotalPrice] = useState(Number(menuItem.price));

  useEffect(() => {
    if (!isOpen) return;
    
    if (previousSelections && Object.keys(previousSelections).length > 0) {
      setShowRepeat(true);
      setSelectedOptions(previousSelections);
      calculatePrice(previousSelections);
    } else {
      const defaults: Record<string, string[]> = {};
      customizations.forEach(group => {
        if (group.type === 'SIZE') {
          const defaultOption = group.options.find(opt => opt.isDefault);
          if (defaultOption) {
            defaults[group.id] = [defaultOption.id];
          } else if (group.options.length > 0) {
            defaults[group.id] = [group.options[0].id];
          }
        } else if (group.type === 'ADDON') {
          defaults[group.id] = [];
        }
      });
      setSelectedOptions(defaults);
      calculatePrice(defaults);
      setShowRepeat(false);
    }
  }, [isOpen, previousSelections, customizations]);

  const calculatePrice = (selections: Record<string, string[]>) => {
    let price = Number(menuItem.price);
    customizations.forEach(group => {
      if (group.type === 'TEXT') return;
      const selected = selections[group.id] || [];
      selected.forEach(optionId => {
        const option = group.options.find(opt => opt.id === optionId);
        if (option) {
          price += Number(option.priceModifier);
        }
      });
    });
    setTotalPrice(price);
  };

  const handleOptionToggle = (groupId: string, optionId: string) => {
    setSelectedOptions(prev => {
      const group = customizations.find(g => g.id === groupId);
      if (!group || group.type === 'TEXT') return prev;

      const current = prev[groupId] || [];
      let newSelection: string[];

      if (group.type === 'SIZE' || group.maxSelections === 1) {
        newSelection = [optionId];
      } else {
        if (current.includes(optionId)) {
          newSelection = current.filter(id => id !== optionId);
        } else {
          if (current.length >= group.maxSelections) {
            return prev;
          }
          newSelection = [...current, optionId];
        }
      }

      const newOptions = { ...prev, [groupId]: newSelection };
      calculatePrice(newOptions);
      return newOptions;
    });
  };

  const handleRepeat = () => {
    if (previousSelections) {
      setSelectedOptions(previousSelections);
      calculatePrice(previousSelections);
    }
    setShowRepeat(false);
  };

  const handleChooseAgain = () => {
    setShowRepeat(false);
  };

  const handleAddToCart = () => {
    const customizationPrice = totalPrice - Number(menuItem.price);
    onAddToCart(selectedOptions, customizationPrice, Number(menuItem.price));
    onClose();
  };

  const isValid = customizations.every(group => {
    if (group.type === 'TEXT') return true;
    const selected = selectedOptions[group.id] || [];
    return selected.length >= group.minSelections && selected.length <= group.maxSelections;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl max-h-[90vh] overflow-hidden animate-slide-up">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors z-10"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6 pb-4">
            <div className="flex items-center gap-4 mb-4">
              {menuItem.imageUrl ? (
                <img 
                  src={menuItem.imageUrl} 
                  alt={menuItem.name}
                  className="w-20 h-20 rounded-xl object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-slate-200 flex items-center justify-center">
                  <span className="text-3xl font-bold text-slate-400">{menuItem.name.charAt(0)}</span>
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-slate-900">{menuItem.name}</h2>
                <p className="text-lg font-semibold text-orange-600">₹{totalPrice}</p>
              </div>
            </div>

            {showRepeat && previousSelections && (
              <div className="mb-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-orange-900">Added previously</p>
                    <p className="text-sm text-orange-700">
                      {customizations.map(group => {
                        const selected = previousSelections[group.id] || [];
                        return selected.map(id => {
                          const opt = group.options.find(o => o.id === id);
                          return opt?.name;
                        }).filter(Boolean).join(', ');
                      }).filter(Boolean).join(' • ')}
                    </p>
                  </div>
                  <button
                    onClick={handleRepeat}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Repeat
                  </button>
                </div>
                <button
                  onClick={handleChooseAgain}
                  className="mt-2 text-sm text-orange-700 hover:underline"
                >
                  I&apos;ll choose instead
                </button>
              </div>
            )}

            {customizations.map(group => {
              if (group.type === 'TEXT') return null;
              
              const selected = selectedOptions[group.id] || [];
              const isRequired = group.isRequired;

              return (
                <div key={group.id} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="font-semibold text-slate-900">{group.name}</h4>
                    {isRequired && (
                      <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded">Required</span>
                    )}
                    {!isRequired && group.type === 'ADDON' && (
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Optional</span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {group.options.map(option => {
                      const isSelected = selected.includes(option.id);
                      const priceChange = Number(option.priceModifier);
                      const priceLabel = priceChange > 0 ? `+₹${priceChange}` : '';

                      return (
                        <button
                          key={option.id}
                          onClick={() => handleOptionToggle(group.id, option.id)}
                          className={`
                            w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left
                            ${isSelected 
                              ? 'border-orange-500 bg-orange-50' 
                              : 'border-slate-200 hover:border-slate-300'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`
                              w-6 h-6 rounded-full border-2 flex items-center justify-center
                              ${isSelected ? 'border-orange-500 bg-orange-500' : 'border-slate-300'}
                            `}>
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <span className={`font-medium ${isSelected ? 'text-orange-900' : 'text-slate-700'}`}>
                              {option.name}
                            </span>
                          </div>
                          {priceLabel && (
                            <span className="text-sm font-medium text-green-600">{priceLabel}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-white">
          <button
            onClick={handleAddToCart}
            disabled={!isValid}
            className={`
              w-full py-4 rounded-xl text-lg font-semibold transition-all
              ${isValid 
                ? 'bg-orange-500 text-white hover:bg-orange-600' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            Add to Cart • ₹{totalPrice}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}