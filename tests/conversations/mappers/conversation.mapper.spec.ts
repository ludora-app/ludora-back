import { ConversationType, MessageStatus, MessageType } from 'generated/prisma/enums';
import { ConversationMapper } from 'src/conversations/mappers/conversation.mapper';
import { DEFAULT_USER_DATA } from 'src/users/constants/users.constants';

describe('ConversationMapper', () => {
  const userUid = 'user-me';

  describe('toFindOneDto', () => {
    it('should correctly map sender and receiver when other user is deleted but current user sent the last message', () => {
      const mockRawConversation: any = {
        uid: 'conv-123',
        type: ConversationType.PRIVATE,
        conversationMembers: [
          {
            userUid: userUid,
            user: {
              uid: userUid,
              firstname: 'Me',
              lastname: 'Myself',
              imageUrl: 'me.jpg',
            },
          },
          // Other user is deleted, so they are not in conversationMembers anymore (Cascade delete)
        ],
        messages: [
          {
            uid: 'msg-1',
            content: 'Hello',
            createdAt: new Date(),
            updatedAt: new Date(),
            type: MessageType.TEXT,
            globalStatus: MessageStatus.SENT,
            sender: {
              uid: userUid,
              firstname: 'Me',
              lastname: 'Myself',
              imageUrl: 'me.jpg',
            },
          },
        ],
      };

      const result = ConversationMapper.toFindOneDto(mockRawConversation, userUid);

      // Receiver should be the deleted user (default data)
      expect(result.receiver).toEqual({
        firstname: DEFAULT_USER_DATA.FIRSTNAME,
        lastname: DEFAULT_USER_DATA.LASTNAME,
        userUid: '',
      });

      // Sender should be the last message sender (Me)
      expect(result.sender).toEqual({
        uid: userUid,
        firstname: 'Me',
        lastname: 'Myself',
        imageUrl: 'me.jpg',
      });
    });

    it('should correctly map sender and receiver when other user is deleted and they sent the last message', () => {
      const mockRawConversation: any = {
        uid: 'conv-123',
        type: ConversationType.PRIVATE,
        conversationMembers: [
          {
            userUid: userUid,
            user: {
              uid: userUid,
              firstname: 'Me',
              lastname: 'Myself',
              imageUrl: 'me.jpg',
            },
          },
        ],
        messages: [
          {
            uid: 'msg-1',
            content: 'Bye',
            createdAt: new Date(),
            updatedAt: new Date(),
            type: MessageType.TEXT,
            globalStatus: MessageStatus.SENT,
            sender: null, // Sender is deleted
          },
        ],
      };

      const result = ConversationMapper.toFindOneDto(mockRawConversation, userUid);

      // Receiver should be the deleted user (default data)
      expect(result.receiver).toEqual({
        firstname: DEFAULT_USER_DATA.FIRSTNAME,
        lastname: DEFAULT_USER_DATA.LASTNAME,
        userUid: '',
      });

      // Sender should be the deleted user (default data)
      expect(result.sender).toEqual({
        uid: '',
        firstname: DEFAULT_USER_DATA.FIRSTNAME,
        lastname: DEFAULT_USER_DATA.LASTNAME,
        imageUrl: '',
      });
    });
  });
});
