'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Minus, Plus, MapPin, PlusCircle, ChevronRight } from 'lucide-react';
import { useCart, useRemoveFromCart, useUpdateCartItem, useClearCart } from '@/hooks/useCart';
import { api } from '@/lib/api';

interface Address {
  id: string;
  addressLine: string;
  city: string;
  state?: string;
  pincode: string;
  isDefault: boolean;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

interface OrderItem {
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  customizationPrice: number;
  specialInstructions?: string;
  selectedOptions?: Array<{ groupId: string; optionId: string; name: string; priceModifier: number }>;
}

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: cart, isLoading: cartLoading } = useCart();
  const removeItem = useRemoveFromCart();
  const updateItem = useUpdateCartItem();
  const clearCart = useClearCart();

  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const token = getToken();

  const { data: addresses, isLoading: addressesLoading } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: async () => {
      const _token = getToken();
      if (!_token) return [];
      return api.get('/user/addresses', _token);
    },
    enabled: !!token,
  });

  const defaultAddress = addresses?.find((a) => a.isDefault) ?? addresses?.[0];
  const initialAddressId = defaultAddress?.id ?? '';
  const [selectedAddressId, setSelectedAddressId] = useState<string>(initialAddressId);

  const createAddressMutation = useMutation({
    mutationFn: async (data: typeof newAddress): Promise<Address> => {
      const token = getToken();
      return api.post('/user/addresses', data, token ?? undefined) as Promise<Address>;
    },
    onSuccess: (newAddr: Address) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setSelectedAddressId(newAddr.id);
      setShowNewAddressForm(false);
      setNewAddress({ addressLine: '', city: '', state: '', pincode: '' });
    },
  });

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const token = getToken();
      if (!token) {
        throw new Error('Please login to place order');
      }

      const items: OrderItem[] = cart?.items.map((item) => {
        const menuItemCustomizations = item.menuItem.customizations as Array<{
          id: string;
          type: 'SIZE' | 'ADDON' | 'TEXT';
          options: Array<{ id: string; name: string; priceModifier: number }>;
        }> | undefined;

        const selectedOptions: Array<{ groupId: string; optionId: string; name: string; priceModifier: number }> = [];

        if (item.customizations && item.customizations.length > 0 && menuItemCustomizations) {
          item.customizations.forEach((cust) => {
            const group = menuItemCustomizations?.find((g) => g.options.some((o) => o.id === cust.optionId));
            if (group) {
              const option = group.options.find((o) => o.id === cust.optionId);
              if (option) {
                selectedOptions.push({
                  groupId: group.id,
                  optionId: cust.optionId,
                  name: option.name,
                  priceModifier: option.priceModifier,
                });
              }
            }
          });
        }

        return {
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          customizationPrice: Number(item.customizationPrice),
          specialInstructions: item.specialInstructions,
          selectedOptions,
        };
      }) || [];

      return api.post(
        '/orders',
        {
          addressId: selectedAddressId,
          specialInstructions,
          items,
        },
        token
      );
    },
    onSuccess: () => {
      clearCart.mutate();
      router.push('/order-success');
    },
    onError: (error) => {
      console.error('Failed to place order:', error);
      alert('Failed to place order. Please try again.');
    },
  });

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem.mutate(id);
    } else {
      updateItem.mutate({ id, quantity: newQuantity });
    }
  };

  const handleAddNewAddress = () => {
    if (newAddress.addressLine && newAddress.city && newAddress.pincode) {
      createAddressMutation.mutate(newAddress);
    }
  };

  const handlePlaceOrder = () => {
    if (!token) {
      router.push('/login?redirect=/checkout');
      return;
    }
    if (!selectedAddressId) {
      alert('Please select a delivery address');
      return;
    }
    setIsPlacingOrder(true);
    placeOrderMutation.mutate();
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-500">
        <p className="text-lg font-medium">Your cart is empty</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Delivery Address
            </h2>

            {!token ? (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-4">Please login to select delivery address</p>
                <button
                  onClick={() => router.push('/login?redirect=/checkout')}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Login
                </button>
              </div>
            ) : addressesLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
              </div>
            ) : (
              <div className="space-y-3">
                {addresses?.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedAddressId === addr.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{addr.addressLine}</p>
                      <p className="text-sm text-gray-500">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      {addr.isDefault && (
                        <span className="text-xs text-orange-600 font-medium">Default</span>
                      )}
                    </div>
                  </label>
                ))}

                {showNewAddressForm ? (
                  <div className="p-4 border border-gray-200 rounded-lg space-y-3">
                    <input
                      type="text"
                      placeholder="Address Line"
                      value={newAddress.addressLine}
                      onChange={(e) => setNewAddress({ ...newAddress, addressLine: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="City"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="p-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={newAddress.pincode}
                      onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddNewAddress}
                        disabled={createAddressMutation.isPending}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                      >
                        {createAddressMutation.isPending ? 'Saving...' : 'Save Address'}
                      </button>
                      <button
                        onClick={() => {
                          setShowNewAddressForm(false);
                          setNewAddress({ addressLine: '', city: '', state: '', pincode: '' });
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewAddressForm(true)}
                    className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium"
                  >
                    <PlusCircle className="w-5 h-5" />
                    Add new address
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-4">
              {cart.items.map((item) => {
                const itemTotal =
                  (Number(item.unitPrice) + Number(item.customizationPrice)) * item.quantity;

                const menuItemCustomizations = item.menuItem.customizations as Array<{
                  id: string;
                  name: string;
                  type: string;
                  options: Array<{ id: string; name: string; priceModifier: number }>;
                }> | undefined;

                return (
                  <div key={item.id} className="flex gap-4 border-b pb-4 last:border-0">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                      {item.menuItem.imageUrl && (
                        <img
                          src={item.menuItem.imageUrl}
                          alt={item.menuItem.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{item.menuItem.name}</h3>
                        <span className="font-semibold">₹{itemTotal.toFixed(2)}</span>
                      </div>
                      {item.customizations && item.customizations.length > 0 && menuItemCustomizations && (
                        <p className="text-sm text-gray-500">
                          {item.customizations
                            .map((c) => {
                              const option = menuItemCustomizations
                                ?.flatMap((g) => g.options)
                                .find((o) => o.id === c.optionId);
                              return option?.name;
                            })
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        ₹{Number(item.unitPrice).toFixed(2)}
                        {Number(item.customizationPrice) > 0 && (
                          <> + ₹{Number(item.customizationPrice).toFixed(2)}</>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          className="p-1 rounded-full hover:bg-gray-200"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-medium w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="p-1 rounded-full hover:bg-gray-200"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4">Special Instructions</h2>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any special instructions for your order..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={3}
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4">Bill Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>₹{cart.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (18%)</span>
                <span>₹{cart.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-2 border-t">
                <span>Total</span>
                <span>₹{cart.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder || !token || !selectedAddressId}
            className="w-full py-4 bg-orange-500 text-white text-lg font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPlacingOrder ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                Place Order <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}