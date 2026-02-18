/**
 * @description Every event type that can be emitted by the application
 */
export enum EventTypes {
  FRIEND_REQUEST = 'friend.request.sent',
  FRIEND_ACCEPTED = 'friend.accepted.sent',
  SESSION_INVITATION = 'session.invitation.sent',
  SESSION_UPDATED = 'session.updated.sent',
  SESSION_CANCELLED = 'session.cancelled.sent',
  SESSION_REMINDER = 'session.reminder.sent',
  NEW_MESSAGE = 'new.message.sent',
  EMAIL_VERIFIED = 'email.verified',
  NOTIFICATION_SEND = 'notification.send',
  NOTIFICATION_BROADCAST = 'notification.broadcast',
  NOTIFICATION_SEND_TO_MULTIPLE = 'notification.sendToMultiple',
  MARK_MESSAGES_AS_READ = 'mark.messages.as.read',
  SESSION_PLAYER_ADDED = 'session.player.added',
}
