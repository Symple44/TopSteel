import { Injectable } from '@nestjs/common'
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import type { Server, Socket } from 'socket.io'

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server

  private readonly connectedClients = new Map<string, Socket>()

  handleConnection(_client: Socket) {}

  handleDisconnect(client: Socket) {
    for (const [userId, socket] of this.connectedClients.entries()) {
      if (socket.id === client.id) {
        this.connectedClients.delete(userId)
        break
      }
    }
  }

  @SubscribeMessage('join')
  handleJoin(@MessageBody() data: { userId: string }, @ConnectedSocket() client: Socket) {
    this.connectedClients.set(data.userId, client)
  }

  sendToUser(userId: string, event: string, data: Record<string, unknown>) {
    const socket = this.connectedClients.get(userId)
    if (socket) {
      socket.emit(event, data)
    }
  }

  sendToProjet(projetId: string, event: string, data: Record<string, unknown>) {
    this.server.emit(event, { projetId, ...data })
  }

  broadcast(event: string, data: Record<string, unknown>) {
    this.server.emit(event, data)
  }
}
