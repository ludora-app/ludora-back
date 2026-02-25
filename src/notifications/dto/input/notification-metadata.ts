export interface NotificationMetadata {
  imageUrl?: string;
  actionUrl?: string;

  senderUid?: string;
  [key: string]: any;

  sessionUid?: string;
  senderName?: string;
  sessionDate?: string;

  senderAvatar?: string;
  sessionTitle?: string;
  messagePreview?: string;

  conversationUid?: string;
}

export interface FriendNotificationMetaData extends Pick<
  NotificationMetadata,
  'imageUrl' | 'actionUrl' | 'senderUid' | 'senderName' | 'senderAvatar'
> {}

export interface SessionNotificationMetaData extends Pick<
  NotificationMetadata,
  'imageUrl' | 'actionUrl' | 'sessionUid' | 'sessionTitle' | 'sessionDate' | 'senderName'
> {}

export interface MessageNotificationMetaData extends Pick<
  NotificationMetadata,
  'imageUrl' | 'actionUrl' | 'senderName' | 'messagePreview' | 'conversationUid'
> {}
