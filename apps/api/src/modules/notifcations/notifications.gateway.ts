import { Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly connectedClients = new Map<string, Socket>();

  handleConnection(client: Socket) {
    console.info('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.info('Client disconnected:', client.id);
    for (const [userId, socket] of this.connectedClients.entries()) {
      if (socket.id === client.id) {
        this.connectedClients.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('join')
  handleJoin(@MessageBody() data: { userId: string }, @ConnectedSocket() client: Socket) {
    this.connectedClients.set(data.userId, client);
  }

  sendToUser(userId: string, event: string, data: Record<string, unknown>) {
    const socket = this.connectedClients.get(userId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  sendToProjet(projetId: string, event: string, data: Record<string, unknown>) {
    this.server.emit(event, { projetId, ...data });
  }

  broadcast(event: string, data: Record<string, unknown>) {
    this.server.emit(event, data);
  }

  private async getUserIdFromToken(client: Socket): Promise<string | null> {
    try {
      const token = client.handshake.auth.token;
      if (!token) return null;
      // Example: decode JWT token to extract userId (replace with your actual logic)
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return payload.userId ?? null;
    } catch {
      return null;
    }
  }

  private getUserIdFromSocket(client: Socket): string | null {
    for (const [userId, socket] of this.connectedClients.entries()) {
      if (socket.id === client.id) {
        return userId;
      }
    }
    return null;
  }
}

