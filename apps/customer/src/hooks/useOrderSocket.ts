'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface OrderStatusUpdate {
  orderId: string;
  status: string;
  previousStatus: string;
  estimatedTime?: number;
  timestamp: string;
}

interface UseOrderSocketOptions {
  orderId: string;
  enabled?: boolean;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
}

interface UseOrderSocketReturn {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  statusUpdate: OrderStatusUpdate | null;
  reconnect: () => void;
  disconnect: () => void;
}

export function useOrderSocket({
  orderId,
  enabled = true,
  autoReconnect = true,
  maxReconnectAttempts = 5,
}: UseOrderSocketOptions): UseOrderSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [statusUpdate, setStatusUpdate] = useState<OrderStatusUpdate | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
  }, []);

  const connect = useCallback(() => {
    if (!orderId || !enabled) return;

    setConnectionStatus('connecting');

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';
    
    socketRef.current = io(`${wsUrl}/orders`, {
      transports: ['websocket'],
      reconnection: autoReconnect,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      reconnectAttemptsRef.current = 0;
      
      socket.emit('joinOrder', orderId);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', () => {
      setConnectionStatus('error');
    });

    socket.on('orderStatusUpdate', (data: OrderStatusUpdate) => {
      setStatusUpdate(data);
    });

    socket.on('reconnect', () => {
      socket.emit('joinOrder', orderId);
    });

    return () => {
      socket.emit('leaveOrder', orderId);
      socket.disconnect();
    };
  }, [orderId, enabled, autoReconnect, maxReconnectAttempts]);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [disconnect, connect]);

  useEffect(() => {
    if (enabled && orderId) {
      const cleanup = connect();
      return () => {
        if (cleanup) cleanup();
        disconnect();
      };
    }
  }, [orderId, enabled, connect, disconnect]);

  return {
    isConnected,
    connectionStatus,
    statusUpdate,
    reconnect,
    disconnect,
  };
}