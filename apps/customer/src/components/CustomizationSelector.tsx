'use client';

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
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

interface CustomizationSelectorProps {
  menuItem: MenuItem;
  customizations?: CustomizationGroup[];
  onCustomizationChange: (selectedOptions: Record<string, string[]>, totalPrice: number) => void;
}

export function CustomizationSelector({ menuItem, customizations = [], onCustomizationChange }: CustomizationSelectorProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [textInputs, setTextInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    const defaults: Record<string, string[]> = {};
    const texts: Record<string, string> = {};
    customizations.forEach(group => {
      if (group.type === 'TEXT') {
        texts[group.id] = '';
      } else {
        const defaultOption = group.options.find(opt => opt.isDefault);
        if (defaultOption) {
          defaults[group.id] = [defaultOption.id];
        }
      }
    });
    setSelectedOptions(defaults);
    setTextInputs(texts);
  }, [customizations]);

  useEffect(() => {
    if (!customizations.length) return;

    let totalPrice = Number(menuItem.price);
    
    customizations.forEach(group => {
      if (group.type === 'TEXT') return;
      const selected = selectedOptions[group.id] || [];
      selected.forEach(optionId => {
        const option = group.options.find(opt => opt.id === optionId);
        if (option) {
          totalPrice += Number(option.priceModifier);
        }
      });
    });

    onCustomizationChange(selectedOptions, totalPrice);
  }, [selectedOptions, textInputs, customizations, menuItem.price]);

  const handleOptionToggle = (groupId: string, optionId: string) => {
    setSelectedOptions(prev => {
      const group = customizations.find(g => g.id === groupId);
      if (!group || group.type === 'TEXT') return prev;

      const current = prev[groupId] || [];

      if (group.type === 'SIZE') {
        return { ...prev, [groupId]: [optionId] };
      } else {
        if (current.includes(optionId)) {
          return { ...prev, [groupId]: current.filter(id => id !== optionId) };
        } else {
          return { ...prev, [groupId]: [...current, optionId] };
        }
      }
    });
  };

  const handleTextChange = (groupId: string, value: string) => {
    setTextInputs(prev => ({ ...prev, [groupId]: value }));
    setSelectedOptions(prev => ({ ...prev, [groupId]: [value] }));
  };

  const isValid = customizations.every(group => {
    if (group.type === 'TEXT') return true;
    const selected = selectedOptions[group.id] || [];
    return selected.length >= group.minSelections && selected.length <= group.maxSelections;
  });

  if (!customizations.length) return null;

  return (
    <div className="space-y-4">
      {customizations.map(group => {
        const selected = selectedOptions[group.id] || [];
        const isRequired = group.isRequired;

        if (group.type === 'TEXT') {
          return (
            <div key={group.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-slate-900">{group.name}</h4>
                {!isRequired && (
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Optional</span>
                )}
              </div>
              <textarea
                value={textInputs[group.id] || ''}
                onChange={(e) => handleTextChange(group.id, e.target.value)}
                placeholder="Add special instructions..."
                className="w-full p-3 border border-slate-200 rounded-lg resize-none text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                rows={2}
              />
            </div>
          );
        }

        return (
          <div key={group.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-slate-900">{group.name}</h4>
              {isRequired && (
                <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded">Required</span>
              )}
              {group.type === 'ADDON' && !isRequired && (
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Optional</span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {group.options.map(option => {
                const isSelected = selected.includes(option.id);
                const priceChange = Number(option.priceModifier);
                const priceLabel = priceChange > 0 ? `+₹${priceChange}` : priceChange < 0 ? `-₹${Math.abs(priceChange)}` : '';

                return (
                  <button
                    key={option.id}
                    onClick={() => handleOptionToggle(group.id, option.id)}
                    className={`
                      flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left
                      ${isSelected 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'border-slate-200 hover:border-slate-300'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${isSelected ? 'border-orange-500 bg-orange-500' : 'border-slate-300'}
                      `}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`font-medium ${isSelected ? 'text-orange-900' : 'text-slate-700'}`}>
                        {option.name}
                      </span>
                    </div>
                    {priceLabel && (
                      <span className={`text-sm font-medium ${priceChange > 0 ? 'text-green-600' : 'text-slate-500'}`}>
                        {priceLabel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}