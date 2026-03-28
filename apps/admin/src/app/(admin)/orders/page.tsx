'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  RefreshCw,
  MapPin,
  Phone,
  CreditCard,
  Bell,
  Wifi,
  WifiOff
} from 'lucide-react';
import { adminApi, AdminOrder, OrdersResponse } from '@/lib/api';
import { useAdminSocket } from '@/hooks/useAdminSocket';
import { OrderStatus, ORDER_STATUS_DISPLAY, PaymentStatus, PAYMENT_STATUS_DISPLAY } from '@restaurant/types';

const NEXT_STATUS: Record<string, string> = {
  [OrderStatus.PENDING]: OrderStatus.RECEIVED,
  [OrderStatus.RECEIVED]: OrderStatus.PREPARING,
  [OrderStatus.PREPARING]: OrderStatus.READY,
  [OrderStatus.READY]: OrderStatus.COMPLETED,
};

interface OrderModalProps {
  order: AdminOrder | null;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
}

function OrderModal({ order, isOpen, isLoading, onClose }: OrderModalProps) {
  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      </div>
    );
  }

  if (!order) return null;

  const config = ORDER_STATUS_DISPLAY[order.status as OrderStatus] || ORDER_STATUS_DISPLAY[OrderStatus.PENDING];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-sm text-gray-500">Order #{order.id.slice(0, 8)}</p>
              <h2 className="text-xl font-bold text-gray-900">{order.user.name}</h2>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.textColor} ${config.bgColor}`}>
              <span>{config.label}</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Customer Details</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{order.user.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{order.address.addressLine}, {order.address.city} - {order.address.pincode}</span>
              </div>
            </div>
          </div>

          {/* Order Special Instructions */}
          {order.specialInstructions && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Order Notes</h3>
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">{order.specialInstructions}</p>
              </div>
            </div>
          )}

          {/* Items */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Order Items</h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                      {item.quantity}x
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.menuItem.name}</p>
                      <p className="text-sm text-gray-500">₹{Number(item.unitPrice).toFixed(2)} each</p>
                      {item.specialInstructions && (
                        <p className="text-sm text-orange-600 mt-1 italic">
                          Note: {item.specialInstructions}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="font-medium">₹{(Number(item.unitPrice) * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment */}
          {order.payment && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment</h3>
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{order.payment.razorpayPaymentId || 'N/A'}</span>
                {(() => {
                  const paymentConfig = PAYMENT_STATUS_DISPLAY[order.payment.status as PaymentStatus] || PAYMENT_STATUS_DISPLAY[PaymentStatus.PENDING];
                  return (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${paymentConfig.bgColor} ${paymentConfig.textColor}`}>
                      {paymentConfig.label}
                    </span>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Status History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Status History</h3>
              <div className="relative">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />
                <div className="space-y-4">
                  {order.statusHistory.map((history) => {
                    const statusConfig = ORDER_STATUS_DISPLAY[history.newStatus as OrderStatus] || ORDER_STATUS_DISPLAY[OrderStatus.PENDING];
                    return (
                      <div key={history.id} className="relative flex items-start gap-3 pl-6">
                        <div className={`absolute left-0 w-4 h-4 rounded-full border-2 border-white ${statusConfig.bgColor} ${statusConfig.textColor.replace('text-', 'bg-')}`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${statusConfig.textColor}`}>
                              {statusConfig.label}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(history.changedAt).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {history.oldStatus && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Changed from {ORDER_STATUS_DISPLAY[history.oldStatus as OrderStatus]?.label || history.oldStatus}
                            </p>
                          )}
                          {history.changedBy && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              by {history.changedBy.name}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="border-t border-gray-100 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>₹{Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span>₹{Number(order.taxAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-orange-600">₹{Number(order.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface OrderCardProps {
  order: AdminOrder;
  onStatusUpdate: (orderId: string, status: string) => void;
  onViewDetails: (order: AdminOrder) => void;
}

function OrderCard({ order, onStatusUpdate, onViewDetails }: OrderCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const config = ORDER_STATUS_DISPLAY[order.status as OrderStatus] || ORDER_STATUS_DISPLAY[OrderStatus.PENDING];
  const nextStatus = NEXT_STATUS[order.status];

  const handleStatusUpdate = async (status: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!status) return;
    setIsUpdating(true);
    try {
      await onStatusUpdate(order.id, status);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdating(true);
    try {
      await onStatusUpdate(order.id, 'CANCELLED');
    } finally {
      setIsUpdating(false);
    }
  };

  const itemNames = order.items.slice(0, 2).map(i => i.menuItem.name).join(', ');
  const moreItems = order.items.length > 2 ? ` +${order.items.length - 2} more` : '';

  return (
    <div 
      onClick={() => onViewDetails(order)}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-mono text-sm text-gray-500">#{order.id.slice(0, 8)}</p>
          <p className="font-semibold text-gray-900">{order.user.name}</p>
          <p className="text-sm text-gray-500">{order.user.email}</p>
        </div>
        <div 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.textColor} ${config.bgColor}`}
          onClick={(e) => e.stopPropagation()}
        >
          <span>{config.label}</span>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm text-gray-600">
          {itemNames}{moreItems}
        </p>
      </div>

      <div className="flex items-center justify-between text-sm mb-4">
        <p className="text-gray-500">
          {new Date(order.createdAt).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
        <p className="font-bold text-lg">₹{Number(order.totalAmount).toFixed(2)}</p>
      </div>

      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        {nextStatus && (
          <button
            onClick={(e) => handleStatusUpdate(nextStatus, e)}
            disabled={isUpdating}
            className="flex-1 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUpdating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            {ORDER_STATUS_DISPLAY[nextStatus as OrderStatus]?.label || 'Update'}
          </button>
        )}
        {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
          <button
            onClick={handleCancel}
            disabled={isUpdating}
            className="px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onViewDetails(order); }}
          className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
        >
          Details
        </button>
      </div>
    </div>
  );
}

function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showNewOrderToast, setShowNewOrderToast] = useState(false);

  const { isConnected, newOrder, statusUpdate, clearNewOrder, clearStatusUpdate } = useAdminSocket({ enabled: true });

  const { data: selectedOrderData, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['admin-order', selectedOrderId],
    queryFn: async (): Promise<AdminOrder> => {
      const token = localStorage.getItem('admin_token');
      return adminApi.get(`/admin/orders/${selectedOrderId}`, token ?? undefined);
    },
    enabled: !!selectedOrderId,
  });

  const selectedOrder = selectedOrderId ? (selectedOrderData ?? null) : null;

  const handleViewDetails = (order: AdminOrder) => {
    setSelectedOrderId(order.id);
  };

  const handleCloseModal = () => {
    setSelectedOrderId(null);
    queryClient.invalidateQueries({ queryKey: ['admin-order'] });
  };

  useEffect(() => {
    if (newOrder) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const { data, isLoading, refetch, isRefetching } = useQuery<OrdersResponse>({
    queryKey: ['admin-orders', statusFilter],
    queryFn: async () => {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '50');
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      return adminApi.get(`/admin/orders?${params}`, token ?? undefined);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const token = localStorage.getItem('admin_token');
      return adminApi.patch(`/admin/orders/${orderId}/status`, { status }, token ?? undefined);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order', variables.orderId] });
    },
  });

  const handleStatusUpdate = (orderId: string, status: string) => {
    updateStatusMutation.mutate({ orderId, status });
  };

  const stats = {
    total: data?.total || 0,
    pending: data?.orders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.RECEIVED).length || 0,
    preparing: data?.orders.filter(o => o.status === OrderStatus.PREPARING).length || 0,
    ready: data?.orders.filter(o => o.status === OrderStatus.READY).length || 0,
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 mt-1">Manage and track customer orders</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Preparing</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.preparing}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ready</p>
              <p className="text-2xl font-bold text-green-600">{stats.ready}</p>
            </div>
          </div>
        </div>
      </div>

      {/* New Order Toast */}
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

      {/* Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
          >
            <option value="">All Status</option>
            <option value="RECEIVED">Received</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY">Ready</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 bg-white"
          >
            <RefreshCw className={`w-5 h-5 ${isRefetching ? 'animate-spin' : 'text-gray-600'}`} />
          </button>
        </div>
        <p className="text-sm text-gray-500">
          Showing {data?.orders.length || 0} of {data?.total || 0} orders
        </p>
      </div>

      {/* Orders Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : data?.orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No orders found</p>
          <p className="text-sm text-gray-400 mt-1">Orders will appear here when customers place them</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data?.orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusUpdate={handleStatusUpdate}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      <OrderModal
        order={selectedOrder}
        isOpen={!!selectedOrderId}
        isLoading={isLoadingOrder}
        onClose={handleCloseModal}
      />
    </div>
  );
}

export default function DashboardWithLayout() {
  return <AdminOrdersPage />;
}
