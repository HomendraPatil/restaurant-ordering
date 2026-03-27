"use client";

import { useState, useMemo } from "react";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import {
  useCart,
  useUpdateCartItem,
  useRemoveFromCart,
  useAddToCart,
} from "@/hooks/useCart";
import type { CartItemWithDetails } from "@/hooks/useCart";
import { CustomizationModal } from "@/components/CustomizationModal";
import Link from "next/link";
import type { MenuItem } from "@restaurant/types";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart?: {
    items: CartItemWithDetails[];
    subtotal: number;
    taxAmount: number;
    total: number;
  };
}

export function CartDrawer({ isOpen, onClose, cart }: CartDrawerProps) {
  const { data: fetchedCart, isLoading } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveFromCart();
  const addToCart = useAddToCart();

  const displayCart = cart || fetchedCart;

  const [editingItem, setEditingItem] = useState<{
    menuItem: MenuItem;
    cartItem: CartItemWithDetails;
    customizations: Array<{
      id: string;
      name: string;
      type: "SIZE" | "ADDON" | "TEXT";
      isRequired: boolean;
      minSelections: number;
      maxSelections: number;
      options: Array<{
        id: string;
        name: string;
        priceModifier: number;
        isDefault: boolean;
      }>;
    }>;
    previousSelections: Record<string, string[]>;
  } | null>(null);

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateItem.mutate({ id, quantity: newQuantity });
  };

  const handleRemoveItem = (id: string) => {
    removeItem.mutate(id);
  };

  const handleIncreaseWithCustomization = (item: CartItemWithDetails) => {
    const customizations = item.menuItem.customizations as Array<{
      id: string;
      name: string;
      type: 'SIZE' | 'ADDON' | 'TEXT';
      isRequired: boolean;
      minSelections: number;
      maxSelections: number;
      options: Array<{ id: string; name: string; priceModifier: number; isDefault: boolean }>;
    }> | undefined;

    if (!customizations || customizations.length === 0) {
      handleUpdateQuantity(item.id, item.quantity + 1);
      return;
    }

    const previousSelections: Record<string, string[]> = {};
    
    if (item.customizations && item.customizations.length > 0) {
      item.customizations.forEach((cust) => {
        const optId = cust.optionId;
        const group = customizations.find(g => g.options.some(o => o.id === optId));
        if (group) {
          if (!previousSelections[group.id]) previousSelections[group.id] = [];
          previousSelections[group.id].push(optId);
        }
      });
    }

    setEditingItem({
      menuItem: item.menuItem as MenuItem,
      cartItem: item,
      customizations: customizations,
      previousSelections,
    });
  };

  const handleAddFromModal = async (
    selectedOptions: Record<string, string[]>,
    customizationPrice: number,
    unitPrice: number
  ) => {
    if (!editingItem) return;

    try {
      await addToCart.mutateAsync({
        menuItemId: editingItem.menuItem.id,
        quantity: 1,
        unitPrice: unitPrice,
        customizationPrice,
        selectedOptions: Object.values(selectedOptions).flat(),
      });
      setEditingItem(null);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Your Cart
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          </div>
        ) : !displayCart?.items?.length ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <ShoppingBag className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">Your cart is empty</p>
            <p className="text-sm mt-1">Add some delicious items!</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {displayCart.items.map((item) => {
                const itemCustomizations = item.menuItem.customizations as Array<{
                  id: string;
                  name: string;
                  type: "SIZE" | "ADDON" | "TEXT";
                }>
                | undefined;
                const hasCustomizations =
                  itemCustomizations && itemCustomizations.length > 0;

                const itemTotal =
                  (Number(item.unitPrice) + Number(item.customizationPrice)) *
                  item.quantity;

                return (
                  <div
                    key={item.id}
                    className="flex gap-3 bg-gray-50 rounded-lg p-3"
                  >
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                      {item.menuItem.imageUrl && (
                        <img
                          src={item.menuItem.imageUrl}
                          alt={item.menuItem.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">
                        {item.menuItem.name}
                      </h3>
                      {item.specialInstructions && (
                        <p className="text-xs text-gray-500 truncate">
                          Note: {item.specialInstructions}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                            className="p-1 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-medium w-6 text-center">
                            {item.quantity}
                          </span>
                          {hasCustomizations ? (
                            <button
                              onClick={() =>
                                handleIncreaseWithCustomization(item)
                              }
                              className="p-1 rounded-full hover:bg-gray-200"
                              aria-label="Increase quantity with customization"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleUpdateQuantity(item.id, item.quantity + 1)
                              }
                              className="p-1 rounded-full hover:bg-gray-200"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-full"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{itemTotal.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        ₹{Number(item.unitPrice).toFixed(2)} each
                        {Number(item.customizationPrice) > 0 && (
                          <> + ₹{Number(item.customizationPrice).toFixed(2)}</>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t p-4 space-y-3 bg-white">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{displayCart.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (18%)</span>
                  <span>₹{displayCart.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-2 border-t">
                  <span>Total</span>
                  <span>₹{displayCart.total.toFixed(2)}</span>
                </div>
              </div>
              <Link
                href="/checkout"
                className="block w-full py-3 bg-orange-500 text-white text-center font-semibold rounded-lg hover:bg-orange-600 transition-colors"
                onClick={onClose}
              >
                Proceed to Checkout
              </Link>
            </div>
          </>
        )}
      </div>

      {editingItem && (
        <CustomizationModal
          isOpen={true}
          onClose={() => setEditingItem(null)}
          menuItem={editingItem.menuItem}
          onAddToCart={handleAddFromModal}
          previousSelections={editingItem.previousSelections}
        />
      )}
    </>
  );
}
