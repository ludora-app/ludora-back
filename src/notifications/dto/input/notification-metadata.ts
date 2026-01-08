export interface NotificationMetadata {
  // Données communes
  imageUrl?: string;
  actionUrl?: string;

  // Pour FRIEND_REQUEST / FRIEND_ACCEPTED
  senderUid?: string;
  senderAvatar?: string;

  // Pour SESSION_*
  sessionUid?: string;
  sessionDate?: string;
  inviterName?: string;
  sessionTitle?: string;

  // Pour NEW_MESSAGE
  senderName?: string;
  messagePreview?: string;
  conversationUid?: string;

  // Extensible for other types
  [key: string]: any;
}

export interface FriendNotificationMetaData
  extends Pick<
    NotificationMetadata,
    'imageUrl' | 'actionUrl' | 'senderUid' | 'senderName' | 'senderAvatar'
  > {}

export interface SessionNotificationMetaData
  extends Pick<
    NotificationMetadata,
    'imageUrl' | 'actionUrl' | 'sessionUid' | 'sessionTitle' | 'sessionDate' | 'inviterName'
  > {}

export interface MessageNotificationMetaData
  extends Pick<
    NotificationMetadata,
    'imageUrl' | 'actionUrl' | 'senderName' | 'messagePreview' | 'conversationUid'
  > {}
