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
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
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
    
    console.log(`Client ${client.id} joined order room: ${orderId}`);
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
    console.log(`Client ${client.id} joined admin room`);
    return { event: 'joined', data: { room: 'admin' } };
  }

  @SubscribeMessage('leaveAdminRoom')
  handleLeaveAdminRoom(@ConnectedSocket() client: Socket) {
    client.leave('admin');
    console.log(`Client ${client.id} left admin room`);
    return { event: 'left', data: { room: 'admin' } };
  }

  private leaveOrderRoom(client: Socket, orderId: string) {
    client.leave(`order:${orderId}`);
    this.connectedClients.get(client.id)?.delete(orderId);
    console.log(`Client ${client.id} left order room: ${orderId}`);
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
    console.log(`Emitted status update for order ${orderId}: ${status}`);
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
    console.log(`Emitted new order: ${order.id}`);
  }

  getConnectedClientsCount(orderId: string): number {
    const room = this.server.sockets.adapter.rooms.get(`order:${orderId}`);
    return room ? room.size : 0;
  }
}