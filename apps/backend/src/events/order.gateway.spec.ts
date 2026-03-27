import { Test, TestingModule } from '@nestjs/testing';
import { OrderGateway } from './order.gateway';
import { Server, Socket } from 'socket.io';

describe('OrderGateway', () => {
  let gateway: OrderGateway;
  let mockServer: Partial<Server>;
  let mockClient: Partial<Socket>;

  beforeEach(async () => {
    mockServer = {
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
      sockets: {
        adapter: {
          rooms: new Map(),
        },
      },
    } as unknown as Server;

    mockClient = {
      id: 'client-123',
      join: jest.fn(),
      leave: jest.fn(),
    } as unknown as Socket;

    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderGateway],
    }).compile();

    gateway = module.get<OrderGateway>(OrderGateway);
    (gateway as any).server = mockServer;
  });

  describe('handleConnection', () => {
    it('should log client connection', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      gateway.handleConnection(mockClient as Socket);
      expect(consoleSpy).toHaveBeenCalledWith('Client connected: client-123');
      consoleSpy.mockRestore();
    });
  });

  describe('handleDisconnect', () => {
    it('should log client disconnection', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      gateway.handleDisconnect(mockClient as Socket);
      expect(consoleSpy).toHaveBeenCalledWith('Client disconnected: client-123');
      consoleSpy.mockRestore();
    });

    it('should remove client orders from connectedClients', () => {
      (gateway as any).connectedClients.set('client-123', new Set(['order-1', 'order-2']));
      gateway.handleDisconnect(mockClient as Socket);
      const clientOrders = (gateway as any).connectedClients.get('client-123');
      expect(clientOrders?.size).toBe(0);
    });
  });

  describe('joinOrder', () => {
    it('should add client to order room', () => {
      const result = gateway.handleJoinOrder(mockClient as Socket, 'order-123');
      expect(mockClient.join).toHaveBeenCalledWith('order:order-123');
      expect(result).toEqual({ event: 'joined', data: { orderId: 'order-123' } });
    });

    it('should track connected clients', () => {
      gateway.handleJoinOrder(mockClient as Socket, 'order-456');
      const clients = (gateway as any).connectedClients.get('client-123');
      expect(clients).toContain('order-456');
    });

    it('should handle multiple order joins for same client', () => {
      gateway.handleJoinOrder(mockClient as Socket, 'order-1');
      gateway.handleJoinOrder(mockClient as Socket, 'order-2');
      const clients = (gateway as any).connectedClients.get('client-123');
      expect(clients?.size).toBe(2);
    });
  });

  describe('leaveOrder', () => {
    it('should remove client from order room', () => {
      (gateway as any).connectedClients.set('client-123', new Set(['order-789']));
      const result = gateway.handleLeaveOrder(mockClient as Socket, 'order-789');
      expect(mockClient.leave).toHaveBeenCalledWith('order:order-789');
      expect(result).toEqual({ event: 'left', data: { orderId: 'order-789' } });
    });

    it('should remove order from connectedClients', () => {
      (gateway as any).connectedClients.set('client-123', new Set(['order-789']));
      gateway.handleLeaveOrder(mockClient as Socket, 'order-789');
      const clients = (gateway as any).connectedClients.get('client-123');
      expect(clients?.has('order-789')).toBe(false);
    });
  });

  describe('emitOrderStatusUpdate', () => {
    it('should emit status update to order room', () => {
      const emitSpy = jest.fn();
      (mockServer.to as jest.Mock).mockReturnValue({ emit: emitSpy });

      gateway.emitOrderStatusUpdate('order-123', 'PREPARING', 'RECEIVED', 15);

      expect(mockServer.to).toHaveBeenCalledWith('order:order-123');
      expect(emitSpy).toHaveBeenCalledWith('orderStatusUpdate', expect.objectContaining({
        orderId: 'order-123',
        status: 'PREPARING',
        previousStatus: 'RECEIVED',
        estimatedTime: 15,
        timestamp: expect.any(String),
      }));
    });

    it('should work without estimatedTime', () => {
      const emitSpy = jest.fn();
      (mockServer.to as jest.Mock).mockReturnValue({ emit: emitSpy });

      gateway.emitOrderStatusUpdate('order-123', 'COMPLETED', 'READY');

      expect(emitSpy).toHaveBeenCalledWith('orderStatusUpdate', expect.objectContaining({
        orderId: 'order-123',
        status: 'COMPLETED',
        previousStatus: 'READY',
        estimatedTime: undefined,
      }));
    });
  });

  describe('getConnectedClientsCount', () => {
    it('should return 0 for non-existent room', () => {
      const count = gateway.getConnectedClientsCount('non-existent');
      expect(count).toBe(0);
    });

    it('should return correct count for existing room', () => {
      const mockRoom = new Set(['client-1', 'client-2', 'client-3']);
      (mockServer as any).sockets.adapter.rooms.set('order:order-123', mockRoom);
      const count = gateway.getConnectedClientsCount('order-123');
      expect(count).toBe(3);
    });
  });
});
