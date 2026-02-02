import { StorageFolderName } from 'src/shared/constants/constants';
import { MessageStatus, MessageType } from 'generated/prisma/enums';
import { StorageService } from 'src/shared/storage/storage.service';

import { RawMessage } from './conversation.mapper';
import { MessageDto } from '../dto/output/basic-conversation-response.dto';
import { MessageCollectionItemDto } from '../dto/output/message-collection-response.dto';

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
  static async toLastMessageDto(
    message: RawMessage,
    storageService: StorageService,
  ): Promise<MessageDto> {
    return {
      content:
        message.type !== MessageType.TEXT
          ? await storageService.getSignedUrl(StorageFolderName.CONVERSATIONS, message.content)
          : message.content,
      createdAt: message.createdAt,
      globalStatus: message.globalStatus,
      type: message.type,
      uid: message.uid,
    };
  }

  static async toCollectionItemDto(
    message: RawMessageCollectionItem,
    storageService: StorageService,
  ): Promise<MessageCollectionItemDto> {
    return {
      content:
        message.type !== MessageType.TEXT
          ? await storageService.getSignedUrl(StorageFolderName.CONVERSATIONS, message.content)
          : message.content,
      createdAt: message.createdAt,
      globalStatus: message.globalStatus,
      hasAnyRead: this.calculateGlobalStatus(message.messageReceipts).hasAnyRead,
      hasEveryoneRead: this.calculateGlobalStatus(message.messageReceipts).hasEveryoneRead,
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

    const hasEveryoneRead = messageReceipts.every((r) => r.status === MessageStatus.READ);

    return { hasAnyRead, hasEveryoneRead };
  }
}
