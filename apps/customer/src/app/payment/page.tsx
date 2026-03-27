'use client';

import { Suspense, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CreditCard, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';

interface OrderDetails {
  id: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: string;
    menuItem: { name: string; imageUrl?: string };
  }>;
  address: {
    addressLine: string;
    city: string;
    pincode: string;
  };
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay'));
    document.body.appendChild(script);
  });
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { isAuthenticated } = useAuth();

  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');
  const [error, setError] = useState('');

  const { data: order, isLoading } = useQuery<OrderDetails>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      return api.get(`/orders/${orderId}`, token ?? undefined);
    },
    enabled: !!orderId && isAuthenticated,
  });

  const amountInPaise = useMemo(() => {
    if (!order?.totalAmount) return 0;
    return Math.round(order.totalAmount * 100);
  }, [order?.totalAmount]);

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('access_token');
      return api.post(`/payments/create/${orderId}`, { amount: amountInPaise }, token ?? undefined);
    },
  });

  const handlePayment = async () => {
    try {
      setPaymentStatus('processing');
      setError('');

      await loadRazorpayScript();

      const razorpayOrder = await createPaymentMutation.mutateAsync() as { id: string; amount: number; currency: string };

      const options: any = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_SWA2DC7cumxfx9',
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || 'INR',
        name: 'Savory Restaurant',
        description: `Order #${orderId?.slice(0, 8)}`,
        order_id: razorpayOrder.id,
        handler: async (response: any) => {
          // Payment successful - verify and confirm
          try {
            const token = localStorage.getItem('access_token');
            await api.post(
              '/payments/verify',
              {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
              token ?? undefined
            );
            setPaymentStatus('success');
          } catch (err) {
            setPaymentStatus('failed');
            setError('Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentStatus('pending');
          },
        },
        theme: {
          color: '#f97316',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      setPaymentStatus('failed');
      setError(err.message || 'Payment failed');
    }
  };

  if (!isAuthenticated) {
    router.push('/login?redirect=/payment?orderId=' + orderId);
    return null;
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

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-20 h-20 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Your order has been placed and payment is confirmed.
          </p>
          <div className="space-y-3">
            {orderId && (
              <button
                onClick={() => router.push(`/order/${orderId}/tracking`)}
                className="block w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600"
              >
                Track Order
              </button>
            )}
            <button
              onClick={() => router.push('/')}
              className="block w-full py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <XCircle className="w-20 h-20 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
          <p className="text-gray-600 mb-2">{error || 'Something went wrong'}</p>
          <p className="text-sm text-gray-500 mb-6">Please try again.</p>
          <button
            onClick={() => setPaymentStatus('pending')}
            className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600"
          >
            Try Again
          </button>
        </div>
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

        <h1 className="text-2xl font-bold mb-6">Complete Payment</h1>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-3 mb-4">
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
          <div className="border-t pt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>₹{Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax (18%)</span>
              <span>₹{Number(order.taxAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg pt-2 border-t">
              <span>Total</span>
              <span>₹{Number(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Delivery Address</h2>
          <p className="text-gray-600">
            {order.address.addressLine}, {order.address.city} - {order.address.pincode}
          </p>
        </div>

        <button
          onClick={handlePayment}
          disabled={paymentStatus === 'processing'}
          className="w-full py-4 bg-orange-500 text-white text-lg font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {paymentStatus === 'processing' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Pay ₹{Number(order.totalAmount).toFixed(2)}
            </>
          )}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          Secure payment powered by Razorpay
        </p>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}