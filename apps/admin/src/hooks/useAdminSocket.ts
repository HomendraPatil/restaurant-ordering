'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface NewOrderEvent {
  id: string;
  status: string;
  totalAmount: string;
  userName: string;
  itemCount: number;
  createdAt: string;
  timestamp: string;
}

interface StatusUpdateEvent {
  orderId: string;
  status: string;
  previousStatus: string;
  estimatedTime?: number;
  timestamp: string;
}

interface UseAdminSocketOptions {
  enabled?: boolean;
}

export function useAdminSocket({ enabled = true }: UseAdminSocketOptions = {}) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newOrder, setNewOrder] = useState<NewOrderEvent | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<StatusUpdateEvent | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';
    
    const newSocket = io(`${wsUrl}/orders`, {
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('Admin socket connected');
      setIsConnected(true);
      newSocket.emit('joinAdminRoom');
    });

    newSocket.on('disconnect', () => {
      console.log('Admin socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('newOrder', (data: NewOrderEvent) => {
      console.log('New order received:', data);
      setNewOrder(data);
    });

    newSocket.on('orderStatusUpdate', (data: StatusUpdateEvent) => {
      console.log('Order status update received:', data);
      setStatusUpdate(data);
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(newSocket);

    return () => {
      newSocket.emit('leaveAdminRoom');
      newSocket.disconnect();
    };
  }, [enabled]);

  const clearNewOrder = useCallback(() => {
    setNewOrder(null);
  }, []);

  const clearStatusUpdate = useCallback(() => {
    setStatusUpdate(null);
  }, []);

  return {
    socket,
    isConnected,
    newOrder,
    statusUpdate,
    clearNewOrder,
    clearStatusUpdate,
  };
}
