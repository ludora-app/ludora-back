import { ConversationType, MessageStatus, MessageType } from 'generated/prisma/enums';

import { MessageMapper } from './message.mapper';
import { FindOneConversationResponseData } from '../dto/output/find-one-conversation-response.dto';
import { ConversationCollectionResponseData } from '../dto/output/conversation-collection-response.dto';

export interface RawConversationCollectionItem {
  uid: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  type: ConversationType;
  messages: RawMessage[];
  sessionUid?: string | null;
  session?: {
    sessionImages: {
      url: string;
    }[];
  } | null;
  conversationMembers?: {
    user: {
      uid: string;
      firstname: string;
      lastname: string;
      imageUrl: string;
    };
  }[];
}

export interface RawFindOneConversation {
  uid: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  type: ConversationType;
  messages: RawMessage[];
  sessionUid?: string | null;
  session?: {
    sessionImages: {
      url: string;
    }[];
  } | null;
  conversationMembers?: {
    user: {
      uid: string;
      firstname: string;
      lastname: string;
      imageUrl: string;
    };
  }[];
}

export interface RawMessage {
  uid: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  type: MessageType;
  globalStatus: MessageStatus;
  sender: {
    uid: string;
    firstname: string;
    lastname: string;
    imageUrl: string;
  };
}

export class ConversationMapper {
  static toCollectionDto(
    conversation: RawConversationCollectionItem,
  ): ConversationCollectionResponseData {
    const firstMessage = conversation.messages?.[0];
    const firstSessionImage = conversation.session?.sessionImages?.[0];
    const otherUser = conversation.conversationMembers?.[0]?.user;

    let signedImageUrl: string | null = null;

    if (conversation.type === ConversationType.PRIVATE && otherUser?.imageUrl) {
      signedImageUrl = otherUser.imageUrl;
    } else if (conversation.type === ConversationType.SESSION && firstSessionImage?.url) {
      signedImageUrl = firstSessionImage.url;
    }

    return {
      imageUrl: signedImageUrl,
      lastMessage: firstMessage ? MessageMapper.toLastMessageDto(firstMessage) : null,
      name:
        conversation.type === ConversationType.PRIVATE && otherUser
          ? `${otherUser.firstname} ${otherUser.lastname}`
          : conversation.name,
      sender: firstMessage?.sender || null,
      sessionUid: conversation.sessionUid || null,
      type: conversation.type,
      uid: conversation.uid,
    };
  }

  static toFindOneDto(conversation: RawFindOneConversation): FindOneConversationResponseData {
    const otherUser = conversation.conversationMembers?.[0]?.user;
    return {
      imageUrl: conversation.session?.sessionImages?.[0]?.url || null,
      messages: conversation.messages.map((message) => MessageMapper.toLastMessageDto(message)),

      name:
        conversation.type === ConversationType.PRIVATE && otherUser
          ? `${otherUser.firstname} ${otherUser.lastname}`
          : conversation.name,
      sender: conversation.conversationMembers?.[0]?.user || null,
      sessionUid: conversation.sessionUid || null,
      type: conversation.type,
      uid: conversation.uid,
    };
  }
}
