import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'orders',
})
export class OrderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, Set<string>> = new Map();

  handleConnection(client: Socket) {
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.forEach((orderIds, clientId) => {
      if (clientId === client.id) {
        orderIds.forEach((orderId) => this.leaveOrderRoom(client, orderId));
      }
    });
  }

  @SubscribeMessage('joinOrder')
  handleJoinOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() orderId: string,
  ) {
    client.join(`order:${orderId}`);
    
    if (!this.connectedClients.has(client.id)) {
      this.connectedClients.set(client.id, new Set());
    }
    this.connectedClients.get(client.id)?.add(orderId);
    
    return { event: 'joined', data: { orderId } };
  }

  @SubscribeMessage('leaveOrder')
  handleLeaveOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() orderId: string,
  ) {
    this.leaveOrderRoom(client, orderId);
    return { event: 'left', data: { orderId } };
  }

  @SubscribeMessage('joinAdminRoom')
  handleJoinAdminRoom(@ConnectedSocket() client: Socket) {
    client.join('admin');
    return { event: 'joined', data: { room: 'admin' } };
  }

  @SubscribeMessage('leaveAdminRoom')
  handleLeaveAdminRoom(@ConnectedSocket() client: Socket) {
    client.leave('admin');
    return { event: 'left', data: { room: 'admin' } };
  }

  private leaveOrderRoom(client: Socket, orderId: string) {
    client.leave(`order:${orderId}`);
    this.connectedClients.get(client.id)?.delete(orderId);
  }

  emitOrderStatusUpdate(
    orderId: string,
    status: string,
    previousStatus: string,
    estimatedTime?: number,
  ) {
    const eventData = {
      orderId,
      status,
      previousStatus,
      estimatedTime,
      timestamp: new Date().toISOString(),
    };
    
    this.server.to(`order:${orderId}`).emit('orderStatusUpdate', eventData);
    this.server.to('admin').emit('orderStatusUpdate', eventData);
  }

  emitNewOrder(order: any) {
    const eventData = {
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      userName: order.user?.name || 'Guest',
      itemCount: order.items?.length || 0,
      createdAt: order.createdAt,
      timestamp: new Date().toISOString(),
    };
    
    this.server.to('admin').emit('newOrder', eventData);
  }

  getConnectedClientsCount(orderId: string): number {
    const room = this.server.sockets.adapter.rooms.get(`order:${orderId}`);
    return room ? room.size : 0;
  }
}