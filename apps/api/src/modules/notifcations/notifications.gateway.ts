// apps/api/src/modules/notifications/notifications.gateway.ts
import { UseGuards } from '@nestjs/common';
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
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { NotificationsService } from './notifications.service';
  
  @WebSocketGateway({
    cors: {
      origin: '*',
    },
    namespace: 'notifications',
  })
  export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
  
    private connectedClients = new Map<string, Socket>();
  
    constructor(private notificationsService: NotificationsService) {}
  
    async handleConnection(client: Socket) {
      try {
        const userId = await this.getUserIdFromToken(client);
        if (userId) {
          this.connectedClients.set(userId, client);
          client.join(`user:${userId}`);
          console.log(`Client connected: ${userId}`);
        } else {
          client.disconnect();
        }
      } catch (error) {
        client.disconnect();
      }
    }
  
    handleDisconnect(client: Socket) {
      const userId = this.getUserIdFromSocket(client);
      if (userId) {
        this.connectedClients.delete(userId);
        console.log(`Client disconnected: ${userId}`);
      }
    }
  
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('subscribe-projet')
    handleSubscribeProjet(
      @MessageBody() projetId: string,
      @ConnectedSocket() client: Socket,
    ) {
      client.join(`projet:${projetId}`);
      return { event: 'subscribed', data: { projetId } };
    }
  
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('unsubscribe-projet')
    handleUnsubscribeProjet(
      @MessageBody() projetId: string,
      @ConnectedSocket() client: Socket,
    ) {
      client.leave(`projet:${projetId}`);
      return { event: 'unsubscribed', data: { projetId } };
    }
  
    // Méthodes pour envoyer des notifications
    sendToUser(userId: string, event: string, data: any) {
      this.server.to(`user:${userId}`).emit(event, data);
    }
  
    sendToProjet(projetId: string, event: string, data: any) {
      this.server.to(`projet:${projetId}`).emit(event, data);
    }
  
    broadcast(event: string, data: any) {
      this.server.emit(event, data);
    }
  
    private async getUserIdFromToken(client: Socket): Promise<string | null> {
      const token = client.handshake.auth.token;
      // Implémenter la vérification du token JWT
      // et retourner l'ID de l'utilisateur
      return null;
    }
  
    private getUserIdFromSocket(client: Socket): string | null {
      // Récupérer l'ID utilisateur associé au socket
      for (const [userId, socket] of this.connectedClients.entries()) {
        if (socket.id === client.id) {
          return userId;
        }
      }
      return null;
    }
  }