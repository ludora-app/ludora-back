import { Sport } from 'src/shared/constants/constants';
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
  _count: { messages: number };
  conversationMembers?: {
    user: {
      uid: string;
      firstname: string;
      lastname: string;
      imageUrl: string;
    };
  }[];
  session?: {
    sport: string;
    sessionImages: {
      url: string;
    }[];
    sessionTeams: {
      teamName: string;
      teamLabel: string;
    }[];
  } | null;
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
    sport: string;
    sessionTeams: {
      teamLabel: string;
      teamName: string;
    }[];
  } | null;
  conversationMembers?: {
    isArchived: boolean;
    isMuted: boolean;
    userUid: string;
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
    userUid: string,
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
      lastMessage: firstMessage ? MessageMapper.toLastMessageDto(firstMessage, userUid) : null,
      name:
        conversation.type === ConversationType.PRIVATE && otherUser
          ? `${otherUser.firstname} ${otherUser.lastname}`
          : conversation.name,
      receiver:
        conversation.type === ConversationType.PRIVATE && otherUser
          ? {
              firstname: otherUser.firstname,
              lastname: otherUser.lastname,
            }
          : null,
      sender: firstMessage?.sender || null,
      sessionData: {
        sessionUid: conversation.sessionUid || null,
        sport: (conversation.session?.sport as Sport) ?? null,
        teamLabel: conversation.session?.sessionTeams?.[0]?.teamLabel ?? null,
        teamName: conversation.session?.sessionTeams?.[0]?.teamName ?? null,
      },

      type: conversation.type,
      uid: conversation.uid,
      unreadMessagesCount: conversation._count?.messages ?? 0,
    };
  }

  static toFindOneDto(
    conversation: RawFindOneConversation,
    userUid: string,
  ): FindOneConversationResponseData {
    const currentMember = conversation.conversationMembers?.find((m) => m.userUid === userUid);
    const otherMember = conversation.conversationMembers?.find((m) => m.userUid !== userUid);
    const otherUser = otherMember?.user;
    const firstSessionImage = conversation.session?.sessionImages?.[0];

    let signedImageUrl: string | null = null;

    if (conversation.type === ConversationType.PRIVATE && otherUser?.imageUrl) {
      signedImageUrl = otherUser.imageUrl;
    } else if (conversation.type === ConversationType.SESSION && firstSessionImage?.url) {
      signedImageUrl = firstSessionImage.url;
    }

    return {
      imageUrl: signedImageUrl,
      messages: conversation.messages.map((message) =>
        MessageMapper.toLastMessageDto(message, userUid),
      ),
      name:
        conversation.type === ConversationType.PRIVATE && otherUser
          ? `${otherUser.firstname} ${otherUser.lastname}`
          : conversation.name,
      receiver:
        conversation.type === ConversationType.PRIVATE && otherUser
          ? {
              firstname: otherUser.firstname,
              lastname: otherUser.lastname,
            }
          : null,
      sender: otherUser || null,
      sessionData: {
        sessionUid: conversation.sessionUid || null,
        sport: (conversation.session?.sport as Sport) ?? null,
        teamLabel: conversation.session?.sessionTeams?.[0]?.teamLabel ?? null,
        teamName: conversation.session?.sessionTeams?.[0]?.teamName ?? null,
      },
      settings: {
        isArchived: currentMember?.isArchived ?? false,
        isMuted: currentMember?.isMuted ?? false,
      },
      type: conversation.type,
      uid: conversation.uid,
    };
  }
}
