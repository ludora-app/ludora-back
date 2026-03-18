import { MessageStatus, MessageType } from 'generated/prisma/enums';
import { MessageDto } from '../dto/output/basic-conversation-response.dto';
import { MessageCollectionItemDto } from '../dto/output/message-collection-response.dto';
import { RawMessage } from './conversation.mapper';

export interface RawMessageCollectionItem {
  uid: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  type: MessageType;
  globalStatus: MessageStatus;
  messageReceipts: {
    status: MessageStatus;
    userUid: string;
  }[];
  sender: {
    uid: string;
    firstname: string;
    lastname: string;
    imageUrl: string;
  };
}

export class MessageMapper {
  static toLastMessageDto(message: RawMessage, connectedUserUid: string): MessageDto {
    return {
      content: message.content,
      createdAt: message.createdAt,
      globalStatus: message.globalStatus,
      isSender: message.sender.uid === connectedUserUid,
      type: message.type,
      uid: message.uid,
    };
  }

  static toCollectionItemDto(
    message: RawMessageCollectionItem,
    connectedUserUid: string,
  ): MessageCollectionItemDto {
    return {
      content: message.content,
      createdAt: message.createdAt,
      globalStatus: message.globalStatus,
      hasAnyRead: MessageMapper.calculateGlobalStatus(message.messageReceipts).hasAnyRead,
      hasEveryoneRead: MessageMapper.calculateGlobalStatus(message.messageReceipts).hasEveryoneRead,
      isSender: message.sender.uid === connectedUserUid,
      sender: {
        firstname: message.sender.firstname,
        imageUrl: message.sender.imageUrl,
        lastname: message.sender.lastname,
        uid: message.sender.uid,
      },
      type: message.type,
      uid: message.uid,
    };
  }

  private static calculateGlobalStatus(
    messageReceipts: RawMessageCollectionItem['messageReceipts'],
  ) {
    if (messageReceipts.length === 0) {
      return { hasAnyRead: false, hasEveryoneRead: false };
    }

    const hasAnyRead = messageReceipts.some((r) => r.status === MessageStatus.READ);

    //? -1 because the sender's receipt is not included in the count
    const hasEveryoneRead =
      messageReceipts.length - 1 ===
      messageReceipts.filter((r) => r.status === MessageStatus.READ).length;
    return { hasAnyRead, hasEveryoneRead };
  }
}
