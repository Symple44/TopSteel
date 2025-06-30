// apps/api/src/modules/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';

export interface Notification {
  id?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: unknown;
  userId?: string;
  projetId?: string;
  createdAt?: Date;
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  PROJET_UPDATE = 'projet_update',
  STOCK_ALERT = 'stock_alert',
  TASK_ASSIGNED = 'task_assigned',
}

@Injectable()
export class NotificationsService {
  constructor(private gateway: NotificationsGateway) {}

  // Notification à un utilisateur spécifique
  async notifyUser(userId: string, notification: Notification) {
    this.gateway.sendToUser(userId, 'notification', {
      ...notification,
      id: this.generateId(),
      createdAt: new Date(),
    });
  }

  // Notification à tous les membres d'un projet
  async notifyProjet(projetId: string, notification: Notification) {
    this.gateway.sendToProjet(projetId, 'projet-notification', {
      ...notification,
      id: this.generateId(),
      projetId,
      createdAt: new Date(),
    });
  }

  // Notification broadcast
  async broadcast(notification: Notification) {
    this.gateway.broadcast('broadcast-notification', {
      ...notification,
      id: this.generateId(),
      createdAt: new Date(),
    });
  }

  // Notifications spécifiques
  async notifyProjetStatusChange(projetId: string, oldStatus: string, newStatus: string, userId: string) {
    await this.notifyProjet(projetId, {
      type: NotificationType.PROJET_UPDATE,
      title: 'Changement de statut',
      message: `Le statut du projet est passé de ${oldStatus} à ${newStatus}`,
      data: { oldStatus, newStatus, userId },
    });
  }

  async notifyStockAlert(produit: unknown, stockActuel: number, stockMinimal: number) {
    await this.broadcast({
      type: NotificationType.STOCK_ALERT,
      title: 'Alerte stock',
      message: `Stock critique pour ${produit.designation}: ${stockActuel}/${stockMinimal}`,
      data: { produit, stockActuel, stockMinimal },
    });
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
