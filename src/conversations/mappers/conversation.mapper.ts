import { StorageFolderName } from 'src/shared/constants/constants';
import { StorageService } from 'src/shared/storage/storage.service';
import { ConversationType, MessageStatus, MessageType } from 'generated/prisma/enums';

import { MessageDto } from '../dto/output/basic-conversation-response.dto';
import { FindOneConversationResponseData } from '../dto/output/find-one-conversation-response.dto';
import { ConversationCollectionResponseData } from '../dto/output/conversation-collection-response.dto';

export interface RawConversationCollectionItem {
  uid: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
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
  lastMessageAt: Date;
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
  static async toCollectionDto(
    conversation: RawConversationCollectionItem,
    storageService: StorageService,
  ): Promise<ConversationCollectionResponseData> {
    const firstMessage = conversation.messages?.[0];
    const firstSessionImage = conversation.session?.sessionImages?.[0];
    const otherUser = conversation.conversationMembers?.[0]?.user;

    let signedImageUrl: string | null = null;

    if (conversation.type === ConversationType.PRIVATE && otherUser?.imageUrl) {
      signedImageUrl = await storageService.getSignedUrl(
        StorageFolderName.USERS,
        otherUser.imageUrl,
      );
    } else if (conversation.type === ConversationType.SESSION && firstSessionImage?.url) {
      signedImageUrl = await storageService.getSignedUrl(
        StorageFolderName.SESSIONS,
        firstSessionImage.url,
      );
    }

    return {
      imageUrl: signedImageUrl,
      lastMessage: firstMessage ? this.toLastMessageDto(firstMessage) : null,
      lastMessageAt: conversation.lastMessageAt,
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
      lastMessageAt: conversation.lastMessageAt,
      messages: conversation.messages.map((message) => this.toLastMessageDto(message)),
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

  private static toLastMessageDto(message: RawMessage): MessageDto {
    return {
      content: message.content,
      createdAt: message.createdAt,
      globalStatus: message.globalStatus,
      type: message.type,
      uid: message.uid,
    };
  }
}
