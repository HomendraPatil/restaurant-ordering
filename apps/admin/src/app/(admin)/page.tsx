'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Utensils,
  ShoppingCart,
  Loader2,
  ArrowRight,
  Bell,
  Wifi,
  WifiOff
} from 'lucide-react';
import { adminApi, OrdersResponse } from '@/lib/api';
import { useAdminSocket } from '@/hooks/useAdminSocket';
import { OrderStatus, ORDER_STATUS_DISPLAY } from '@restaurant/types';

const formatStatus = (status: string) => {
  return ORDER_STATUS_DISPLAY[status as OrderStatus]?.label || status;
};

function StatCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  iconBg, 
  iconColor 
}: { 
  title: string; 
  value: string | number; 
  change?: string; 
  changeType?: 'up' | 'down';
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${changeType === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {changeType === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

function RecentOrdersWidget({ orders }: { orders: any[] }) {
  const recentOrders = orders.slice(0, 5);
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
        <Link href="/orders" className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      {recentOrders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
          <Package className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No orders yet</p>
          <p className="text-sm text-gray-400 mt-1">Orders will appear here when customers place them</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentOrders.map((order) => (
            <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white font-medium">
                  {order.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{order.user.name}</p>
                  <p className="text-sm text-gray-500">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''} • {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">₹{Number(order.totalAmount).toFixed(0)}</p>
                {(() => {
                  const statusConfig = ORDER_STATUS_DISPLAY[order.status as OrderStatus] || ORDER_STATUS_DISPLAY[OrderStatus.PENDING];
                  return (
                    <span className={`text-xs px-2 py-1 rounded-full ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                      {formatStatus(order.status)}
                    </span>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuickActions() {
  const actions = [
    { label: 'Add Menu Item', href: '/menu', icon: Utensils, color: 'bg-orange-500' },
    { label: 'View Orders', href: '/orders', icon: ShoppingCart, color: 'bg-blue-500' },
    { label: 'Manage Users', href: '/users', icon: Users, color: 'bg-purple-500' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
              <action.icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function OrdersByStatus({ orders }: { orders: any[] }) {
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = orders.length || 1;
  const getStatusColor = (status: string) => {
    const config = ORDER_STATUS_DISPLAY[status as OrderStatus];
    return config ? config.color : 'gray';
  };

  const statusEntries = Object.entries(statusCounts) as [string, number][];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders by Status</h3>
      {statusEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Clock className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No order data</p>
          <p className="text-sm text-gray-400 mt-1">Order status distribution will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {statusEntries.map(([status, count]) => (
            <div key={status}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">{formatStatus(status)}</span>
                <span className="font-medium">{count}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-${getStatusColor(status)}-500 rounded-full`}
                  style={{ width: `${(count / total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TopSellingItems({ orders }: { orders: any[] }) {
  const itemCounts: Record<string, { count: number; name: string; revenue: number }> = {};
  
  orders.forEach(order => {
    order.items.forEach((item: any) => {
      if (!itemCounts[item.menuItem.name]) {
        itemCounts[item.menuItem.name] = { count: 0, name: item.menuItem.name, revenue: 0 };
      }
      itemCounts[item.menuItem.name].count += item.quantity;
      itemCounts[item.menuItem.name].revenue += Number(item.unitPrice) * item.quantity;
    });
  });

  const topItems = Object.values(itemCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items</h3>
      {topItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Utensils className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No items yet</p>
          <p className="text-sm text-gray-400 mt-1">Top selling items will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topItems.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="font-medium text-gray-900">{item.name}</span>
              </div>
              <div className="text-right">
                <p className="font-semibold">{item.count} sold</p>
                <p className="text-sm text-gray-500">₹{item.revenue.toFixed(0)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminDashboard() {
  const queryClient = useQueryClient();
  const [showNewOrderToast, setShowNewOrderToast] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : undefined;

  const { isConnected, newOrder, statusUpdate, clearNewOrder, clearStatusUpdate } = useAdminSocket({ enabled: true });

  const { data: ordersData, isLoading } = useQuery<OrdersResponse>({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      return adminApi.get('/admin/orders?page=1&limit=100', token ?? undefined);
    },
  });

  useEffect(() => {
    if (newOrder) {
      setShowNewOrderToast(true);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      const timer = setTimeout(() => {
        setShowNewOrderToast(false);
        clearNewOrder();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [newOrder, queryClient, clearNewOrder]);

  useEffect(() => {
    if (statusUpdate) {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      clearStatusUpdate();
    }
  }, [statusUpdate, queryClient, clearStatusUpdate]);

  const orders = ordersData?.orders || [];
  
  const stats = {
    totalOrders: ordersData?.total || 0,
    pendingOrders: orders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.RECEIVED).length,
    preparingOrders: orders.filter(o => o.status === OrderStatus.PREPARING).length,
    readyOrders: orders.filter(o => o.status === OrderStatus.READY).length,
    completedOrders: orders.filter(o => o.status === OrderStatus.COMPLETED).length,
    totalRevenue: orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
    avgOrderValue: orders.length ? orders.reduce((sum, o) => sum + Number(o.totalAmount), 0) / orders.length : 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Real-time Toast */}
      {showNewOrderToast && newOrder && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
          <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">New Order Received!</p>
              <p className="text-sm opacity-90">{newOrder.userName} - ₹{Number(newOrder.totalAmount).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status */}
      <div className="fixed bottom-4 left-4 z-50">
        <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 ${
          isConnected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isConnected ? 'Live' : 'Disconnected'}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          icon={DollarSign}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={Package}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon={Clock}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
        />
        <StatCard
          title="Avg Order Value"
          value={`₹${stats.avgOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          icon={TrendingUp}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <RecentOrdersWidget orders={orders} />
        </div>
        <div className="lg:col-span-1">
          <QuickActions />
        </div>
      </div>

      {/* Secondary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrdersByStatus orders={orders} />
        <TopSellingItems orders={orders} />
      </div>
    </div>
  );
}

export default function DashboardWithLayout() {
  return <AdminDashboard />;
}
