'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, CheckCircle, ChefHat, UtensilsCrossed, Package, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useOrderSocket } from '@/hooks/useOrderSocket';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/AuthModal';
import { Header } from '@/components/Header';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: string;
  menuItem: {
    name: string;
    imageUrl?: string;
  };
}

interface Order {
  id: string;
  status: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  createdAt: string;
  items: OrderItem[];
  address: {
    addressLine: string;
    city: string;
    pincode: string;
  };
}

type OrderStatus = 'PENDING' | 'RECEIVED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'PAYMENT_FAILED';

interface StatusStep {
  key: OrderStatus;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const STATUS_STEPS: StatusStep[] = [
  { key: 'RECEIVED', label: 'Order Received', description: 'Your order has been placed', icon: <CheckCircle className="w-6 h-6" /> },
  { key: 'PREPARING', label: 'Preparing', description: 'Chef is preparing your food', icon: <ChefHat className="w-6 h-6" /> },
  { key: 'READY', label: 'Ready', description: 'Your order is ready for pickup', icon: <UtensilsCrossed className="w-6 h-6" /> },
  { key: 'COMPLETED', label: 'Completed', description: 'Order picked up', icon: <Package className="w-6 h-6" /> },
];

function StatusTimeline({ currentStatus, estimatedTime }: { currentStatus: string; estimatedTime?: number }) {
  const currentIndex = STATUS_STEPS.findIndex(s => s.key === currentStatus);
  const isPreparingOrLater = currentIndex >= 1;
  const isReadyOrLater = currentIndex >= 2;
  const isCompleted = currentIndex >= 3;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Order Status</h2>
        {estimatedTime && currentStatus !== 'COMPLETED' && currentStatus !== 'READY' && (
          <div className="flex items-center gap-2 text-orange-600">
            <Clock className="w-5 h-5" />
            <span className="font-medium">ETA: {estimatedTime} mins</span>
          </div>
        )}
      </div>

      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />
        
        {STATUS_STEPS.map((step, index) => {
          const isCompletedStep = index <= currentIndex;
          const isCurrentStep = index === currentIndex;
          
          return (
            <div key={step.key} className="flex items-start gap-4 pb-6 last:pb-0">
              <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                isCompletedStep 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {isCompletedStep ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  step.icon
                )}
              </div>
              <div className="flex-1 pt-2">
                <p className={`font-semibold ${
                  isCompletedStep ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {step.label}
                </p>
                <p className={`text-sm ${
                  isCompletedStep ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConnectionStatus({ status }: { status: 'connecting' | 'connected' | 'disconnected' | 'error' }) {
  return (
    <div className={`flex items-center gap-2 text-sm ${
      status === 'connected' ? 'text-green-600' : 
      status === 'error' ? 'text-red-600' : 'text-gray-500'
    }`}>
      {status === 'connected' ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>Live updates</span>
        </>
      ) : status === 'connecting' ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { data: order, isLoading, refetch } = useQuery<Order>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      return api.get(`/orders/${orderId}`, token ?? undefined);
    },
    enabled: !!orderId && isAuthenticated,
    refetchInterval: 30000,
  });

  const { connectionStatus, statusUpdate } = useOrderSocket({
    orderId,
    enabled: !!orderId && isAuthenticated,
  });

  const currentStatus = statusUpdate?.status || order?.status || 'PENDING';
  const estimatedTime = statusUpdate?.estimatedTime;

  useEffect(() => {
    if (statusUpdate) {
      refetch();
    }
  }, [statusUpdate, refetch]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      setShowAuthModal(true);
    }
  }, []);

  if (showAuthModal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            router.push('/');
          }}
          redirectTo={`/order/${orderId}/tracking`}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-500">Order not found</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Track Your Order</h1>
          <ConnectionStatus status={connectionStatus} />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="font-mono font-medium">{order.id.slice(0, 8)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total</p>
              <p className="font-semibold">₹{Number(order.totalAmount).toFixed(2)}</p>
            </div>
          </div>
        </div>

        <StatusTimeline currentStatus={currentStatus} estimatedTime={estimatedTime} />

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="text-gray-600">
                  {item.quantity}x {item.menuItem.name}
                </span>
                <span className="font-medium">
                  ₹{Number(item.unitPrice) * item.quantity}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>₹{Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span>₹{Number(order.taxAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg pt-2 border-t">
              <span>Total</span>
              <span>₹{Number(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Delivery Address</h2>
          <p className="text-gray-600">
            {order.address.addressLine}, {order.address.city} - {order.address.pincode}
          </p>
        </div>
      </div>
    </div>
  );
}