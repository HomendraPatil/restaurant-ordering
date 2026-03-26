'use client';

import { ShoppingCart, Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import { useAddToCart, useUpdateCartItem, useRemoveFromCart, useCart } from '@/hooks/useCart';
import type { MenuItem } from '@restaurant/types';

interface AddToCartButtonProps {
  menuItem: MenuItem;
  quantity?: number;
  className?: string;
}

export function AddToCartButton({ menuItem, quantity = 1, className = '' }: AddToCartButtonProps) {
  const addToCart = useAddToCart();
  const updateCartItem = useUpdateCartItem();
  const removeFromCart = useRemoveFromCart();
  const { data: cart } = useCart();

  const cartItem = cart?.items.find(item => item.menuItemId === menuItem.id);
  const isInCart = !!cartItem;

  const handleAddToCart = async () => {
    try {
      if (isInCart && cartItem) {
        await updateCartItem.mutateAsync({
          id: cartItem.id,
          quantity: cartItem.quantity + quantity,
        });
      } else {
        await addToCart.mutateAsync({
          menuItemId: menuItem.id,
          quantity,
          unitPrice: Number(menuItem.price),
        });
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const handleIncrease = async () => {
    if (!cartItem) return;
    try {
      await updateCartItem.mutateAsync({
        id: cartItem.id,
        quantity: cartItem.quantity + 1,
      });
    } catch (error) {
      console.error('Failed to increase quantity:', error);
    }
  };

  const handleDecrease = async () => {
    if (!cartItem) return;
    try {
      if (cartItem.quantity <= 1) {
        await removeFromCart.mutateAsync(cartItem.id);
      } else {
        await updateCartItem.mutateAsync({
          id: cartItem.id,
          quantity: cartItem.quantity - 1,
        });
      }
    } catch (error) {
      console.error('Failed to decrease quantity:', error);
    }
  };

  const isLoading = addToCart.isPending || updateCartItem.isPending || removeFromCart.isPending;

  if (isInCart && cartItem) {
    return (
      <div
        className={`
          flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg bg-orange-500 text-white h-11
          ${className}
        `}
      >
        <button
          onClick={handleDecrease}
          disabled={isLoading}
          className="p-1.5 hover:bg-orange-600 rounded transition-colors disabled:opacity-50"
        >
          {cartItem.quantity <= 1 ? (
            <Trash2 className="w-4 h-4" />
          ) : (
            <Minus className="w-4 h-4" />
          )}
        </button>
        <span className="font-medium min-w-[24px] text-center">{cartItem.quantity}</span>
        <button
          onClick={handleIncrease}
          disabled={isLoading}
          className="p-1.5 hover:bg-orange-600 rounded transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={isLoading}
      className={`
        flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all h-11
        bg-orange-500 text-white hover:bg-orange-600
        disabled:opacity-70 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </>
      )}
    </button>
  );
}