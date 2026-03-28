'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, Package, ChefHat, UtensilsCrossed, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/AuthModal';
import { Header } from '@/components/Header';
import { OrderStatus, ORDER_STATUS_DISPLAY } from '@restaurant/types';
import Link from 'next/link';

interface OrderItem {
  id: string;
  quantity: number;
  menuItem: {
    name: string;
  };
}

interface Order {
  id: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  PENDING: { color: 'text-orange-600', bg: 'bg-orange-50', icon: <Clock className="w-4 h-4" /> },
  RECEIVED: { color: 'text-blue-600', bg: 'bg-blue-50', icon: <CheckCircle className="w-4 h-4" /> },
  PREPARING: { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: <ChefHat className="w-4 h-4" /> },
  READY: { color: 'text-green-600', bg: 'bg-green-50', icon: <UtensilsCrossed className="w-4 h-4" /> },
  COMPLETED: { color: 'text-gray-600', bg: 'bg-gray-50', icon: <Package className="w-4 h-4" /> },
  CANCELLED: { color: 'text-red-600', bg: 'bg-red-50', icon: <XCircle className="w-4 h-4" /> },
  PAYMENT_FAILED: { color: 'text-red-600', bg: 'bg-red-50', icon: <XCircle className="w-4 h-4" /> },
};

function OrderCard({ order }: { order: Order }) {
  const router = useRouter();
  const config = ORDER_STATUS_DISPLAY[order.status as OrderStatus] || ORDER_STATUS_DISPLAY[OrderStatus.PENDING];
  const legacyConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
  const isActive = [OrderStatus.PENDING, OrderStatus.RECEIVED, OrderStatus.PREPARING, OrderStatus.READY].includes(order.status as OrderStatus);
  const isPending = order.status === 'PENDING';

  const itemNames = order.items.slice(0, 2).map(i => i.menuItem.name).join(', ');
  const moreItems = order.items.length > 2 ? ` +${order.items.length - 2} more` : '';

  const navigateTo = isPending ? `/payment?orderId=${order.id}` : `/order/${order.id}/tracking`;

  return (
    <Link href={navigateTo} className="block">
      <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer h-full">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-mono text-sm text-gray-500">#{order.id.slice(0, 8)}</p>
            <p className="font-medium text-gray-900">{itemNames}{moreItems}</p>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${legacyConfig.color} ${legacyConfig.bg}`}>
            {legacyConfig.icon}
            <span>{config.label}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <p className="font-semibold">₹{Number(order.totalAmount).toFixed(2)}</p>
        </div>

        {isPending && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-sm text-green-600 font-medium">
              Pay Now →
            </span>
          </div>
        )}

        {isActive && !isPending && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-sm text-orange-600 font-medium">
              Track Order →
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      return api.get('/orders/my-orders', token ?? undefined);
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user');
      if (!token || !userData) {
        setShowAuthModal(true);
      }
    }
  }, [authLoading, isAuthenticated]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (showAuthModal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            router.push('/');
          }}
          redirectTo="/orders"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Your Orders</h1>

        {orders && orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">You haven't placed any orders yet</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600"
            >
              Browse Menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}