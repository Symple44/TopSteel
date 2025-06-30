// apps/api/src/modules/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notifications.entity';
import { NotificationsGateway } from './notifications.gateway';

// Interface pour typer le produit
interface StockProduit {
  id: string;
  designation: string;
  reference: string;
  quantiteStock?: number;
  quantiteMin?: number;
}

export interface NotificationInterface {
  id?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: unknown;
  userId?: string;
  projetId?: string;
  createdAt?: Date;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) // ← Nom corrigé
    private notificationsRepository: Repository<Notification>, // ← Type corrigé
    private gateway: NotificationsGateway
  ) {}

  async findAll(): Promise<Notification[]> {
    return this.notificationsRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string): Promise<Notification | null> {
    return this.notificationsRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Notification>): Promise<Notification> {
    const entity = this.notificationsRepository.create(data);
    return this.notificationsRepository.save(entity);
  }

  async update(id: string, data: Partial<Notification>): Promise<Notification | null> {
    await this.notificationsRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.notificationsRepository.delete(id);
  }

  // Notification à un utilisateur spécifique
  async notifyUser(userId: string, notification: NotificationInterface) {
    const savedNotification = await this.create({
      ...notification,
      userId,
      createdAt: new Date(),
    });

    // Convertir l'entité en objet plain pour le gateway
    const notificationData = this.entityToPlainObject(savedNotification);
    this.gateway.sendToUser(userId, 'notification', notificationData);
    return savedNotification;
  }

  // Notification à tous les membres d'un projet
  async notifyProjet(projetId: string, notification: NotificationInterface) {
    const savedNotification = await this.create({
      ...notification,
      projetId,
      createdAt: new Date(),
    });

    // Convertir l'entité en objet plain pour le gateway
    const notificationData = this.entityToPlainObject(savedNotification);
    this.gateway.sendToProjet(projetId, 'projet-notification', notificationData);
    return savedNotification;
  }

  // Notification broadcast
  async broadcast(notification: NotificationInterface) {
    const savedNotification = await this.create({
      ...notification,
      createdAt: new Date(),
    });

    // Convertir l'entité en objet plain pour le gateway
    const notificationData = this.entityToPlainObject(savedNotification);
    this.gateway.broadcast('broadcast-notification', notificationData);
    return savedNotification;
  }

  // Notifications spécifiques
  async notifyProjetStatusChange(projetId: string, oldStatus: string, newStatus: string, userId: string) {
    return await this.notifyProjet(projetId, {
      type: NotificationType.PROJET_UPDATE,
      title: 'Changement de statut',
      message: `Le statut du projet est passé de ${oldStatus} à ${newStatus}`,
      data: { oldStatus, newStatus, userId },
    });
  }

  async notifyStockAlert(produit: StockProduit, stockActuel: number, stockMinimal: number) {
    return await this.broadcast({
      type: NotificationType.STOCK_ALERT,
      title: 'Alerte stock',
      message: `Stock critique pour ${produit.designation}: ${stockActuel}/${stockMinimal}`,
      data: { produit, stockActuel, stockMinimal },
    });
  }

  async markAsRead(id: string): Promise<Notification | null> {
    await this.notificationsRepository.update(id, {
      isRead: true,
      readAt: new Date(),
    });
    return this.findOne(id);
  }

  async findByUser(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  async findUnreadByUser(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' }
    });
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convertit une entité Notification en objet plain pour le gateway
   */
  private entityToPlainObject(entity: Notification): Record<string, unknown> {
    return {
      id: entity.id,
      type: entity.type,
      title: entity.title,
      message: entity.message,
      data: entity.data,
      userId: entity.userId,
      projetId: entity.projetId,
      isRead: entity.isRead,
      readAt: entity.readAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}