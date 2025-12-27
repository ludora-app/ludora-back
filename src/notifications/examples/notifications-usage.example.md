/**
 * EXEMPLES D'UTILISATION DES NOTIFICATIONS
 *
 * Ce fichier contient des exemples de comment émettre des notifications
 * depuis n'importe quel service de votre application.
 *
 * ⚠️ Ce fichier est fourni à titre d'exemple uniquement.
 * Il ne doit PAS être importé ou exécuté directement.
 */

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { NotificationType } from '../dto/notification-event.dto';

/**
 * Exemple 1: Service de gestion des amis
 */
@Injectable()
export class FriendsServiceExample {
  constructor(private eventEmitter: EventEmitter2) {}

  async sendFriendRequest(senderId: string, recipientId: string): Promise<void> {
    // 1. Logique métier (créer la demande en DB, etc.)
    // ...

    // 2. Émettre une notification
    this.eventEmitter.emit('friend.request.sent', {
      recipientId,
      requestId: 'friend-request-uuid',
      senderId,
      senderName: 'John Doe', // Récupéré depuis la DB
    });
  }

  async acceptFriendRequest(requestId: string, acceptorId: string): Promise<void> {
    // 1. Logique métier
    // ...

    // 2. Notifier l'émetteur de la demande
    this.eventEmitter.emit('notification.send', {
      data: { acceptorId, requestId },
      message: 'John Doe accepted your friend request!',
      title: 'Friend Request Accepted',
      type: NotificationType.FRIEND_ACCEPTED,
      userId: 'sender-user-id',
    });
  }
}

/**
 * Exemple 2: Service de gestion des sessions
 */
@Injectable()
export class SessionsServiceExample {
  constructor(private eventEmitter: EventEmitter2) {}

  async inviteUserToSession(
    sessionId: string,
    sessionName: string,
    invitedUserId: string,
    inviterId: string,
  ): Promise<void> {
    // 1. Logique métier
    // ...

    // 2. Envoyer notification d'invitation
    this.eventEmitter.emit('session.invitation.sent', {
      invitedBy: 'Jane Smith', // Nom de l'inviteur
      recipientId: invitedUserId,
      sessionId,
      sessionName,
    });
  }

  async updateSession(sessionId: string, participantIds: string[]): Promise<void> {
    // 1. Logique métier
    // ...

    // 2. Notifier tous les participants
    this.eventEmitter.emit('notification.sendToMultiple', {
      data: { sessionId },
      message: 'The session details have been updated',
      title: 'Session Updated',
      type: NotificationType.SESSION_UPDATED,
      userIds: participantIds,
    });
  }

  async cancelSession(sessionId: string, participantIds: string[]): Promise<void> {
    // 1. Logique métier
    // ...

    // 2. Notifier tous les participants de l'annulation
    this.eventEmitter.emit('notification.sendToMultiple', {
      data: { sessionId },
      message: 'The session has been cancelled',
      title: 'Session Cancelled',
      type: NotificationType.SESSION_CANCELLED,
      userIds: participantIds,
    });
  }

  async sendSessionReminder(sessionId: string, participantIds: string[]): Promise<void> {
    // Appeler cette méthode via un CRON job ou scheduler
    this.eventEmitter.emit('notification.sendToMultiple', {
      data: { sessionId },
      message: 'Your session starts in 30 minutes',
      title: 'Session Starting Soon',
      type: NotificationType.SESSION_REMINDER,
      userIds: participantIds,
    });
  }
}

/**
 * Exemple 3: Service de chat (intégration avec ChatGateway)
 */
@Injectable()
export class ChatIntegrationExample {
  constructor(private eventEmitter: EventEmitter2) {}

  /**
   * Envoyer une notification lorsqu'un utilisateur reçoit un message
   * alors qu'il n'est pas connecté au chat ou que l'app est en arrière-plan
   */
  async notifyNewMessage(
    recipientId: string,
    senderName: string,
    conversationId: string,
  ): Promise<void> {
    this.eventEmitter.emit('notification.send', {
      data: {
        action: 'open_chat',
        conversationId,
      },
      message: `${senderName} sent you a message`,
      title: 'New Message',
      type: NotificationType.NEW_MESSAGE,
      userId: recipientId,
    });
  }
}

/**
 * Exemple 4: Service d'administration (broadcast)
 */
@Injectable()
export class AdminServiceExample {
  constructor(private eventEmitter: EventEmitter2) {}

  async sendMaintenanceNotification(message: string, scheduledAt: Date): Promise<void> {
    // Broadcast à tous les utilisateurs connectés
    this.eventEmitter.emit('notification.broadcast', {
      data: {
        priority: 'high',
        scheduledAt: scheduledAt.toISOString(),
      },
      message,
      title: 'System Maintenance',
      type: NotificationType.GENERAL,
    });
  }

  async sendAnnouncementToAll(title: string, message: string): Promise<void> {
    this.eventEmitter.emit('notification.broadcast', {
      data: {
        timestamp: new Date().toISOString(),
      },
      message,
      title,
      type: NotificationType.GENERAL,
    });
  }
}

/**
 * Exemple 5: Utilisation avec CRON jobs (@nestjs/schedule)
 */
@Injectable()
export class ScheduledNotificationsExample {
  constructor(private eventEmitter: EventEmitter2) {}

  // @Cron('0 */30 * * * *') // Toutes les 30 minutes
  async checkUpcomingSessions(): Promise<void> {
    // 1. Récupérer les sessions qui commencent dans 30 minutes
    const upcomingSessions = []; // await this.getUpcomingSessions();

    // 2. Envoyer des rappels
    for (const session of upcomingSessions) {
      this.eventEmitter.emit('notification.sendToMultiple', {
        data: {
          sessionId: session.id,
          startTime: session.startTime,
        },
        message: `Your session "${session.name}" starts in 30 minutes`,
        title: 'Session Starting Soon',
        type: NotificationType.SESSION_REMINDER,
        userIds: session.participantIds,
      });
    }
  }
}

/**
 * Exemple 6: Événements personnalisés
 *
 * Vous pouvez créer vos propres événements en ajoutant des listeners
 * dans NotificationsGateway avec @OnEvent('votre.evenement.custom')
 */
@Injectable()
export class CustomEventsExample {
  constructor(private eventEmitter: EventEmitter2) {}

  async triggerCustomEvent(userId: string, data: any): Promise<void> {
    // Émettre un événement personnalisé
    // (nécessite d'ajouter un @OnEvent listener dans NotificationsGateway)
    this.eventEmitter.emit('custom.event.name', {
      userId,
      ...data,
    });
  }
}

/**
 * INTÉGRATION DANS VOS SERVICES EXISTANTS
 *
 * Pour utiliser les notifications dans vos services existants:
 *
 * 1. Injecter EventEmitter2 dans le constructeur:
 *    constructor(private eventEmitter: EventEmitter2) {}
 *
 * 2. Assurez-vous que EventEmitterModule est importé (déjà fait dans AppModule)
 *
 * 3. Émettre des événements aux moments appropriés:
 *    this.eventEmitter.emit('notification.send', {...});
 *
 * 4. Les notifications seront automatiquement envoyées aux clients connectés
 *    via le NotificationsGateway
 */
