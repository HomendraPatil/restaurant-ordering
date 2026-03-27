'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
      <div className="flex justify-center mb-6">
        <CheckCircle className="w-20 h-20 text-green-500" />
      </div>
      
      <h1 className="text-2xl font-bold mb-2">Order Placed Successfully!</h1>
      
      <p className="text-gray-600 mb-4">
        Thank you for your order. Your order has been received and is being processed.
      </p>

      {orderId && (
        <p className="text-sm text-gray-500 mb-6">
          Order ID: <span className="font-mono font-medium">{orderId}</span>
        </p>
      )}

      <div className="space-y-3">
        <Link
          href="/"
          className="block w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
        >
          Continue Shopping
        </Link>
        
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center gap-2 w-full py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Redirecting to home in {countdown} seconds...
      </p>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
      <div className="flex justify-center mb-6">
        <Loader2 className="w-20 h-20 text-orange-500 animate-spin" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Processing...</h1>
      <p className="text-gray-600">Please wait while we confirm your order.</p>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Suspense fallback={<LoadingFallback />}>
        <OrderSuccessContent />
      </Suspense>
    </div>
  );
}