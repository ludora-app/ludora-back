import { MessageType } from 'generated/prisma/enums';
import { StorageFolderName } from 'src/shared/constants/constants';
import { StorageService } from 'src/shared/storage/storage.service';

import { RawMessage } from './conversation.mapper';
import { MessageDto } from '../dto/output/basic-conversation-response.dto';

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
}
