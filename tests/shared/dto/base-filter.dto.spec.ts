import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ConversationFilterDto } from 'src/conversations/dto/input/conversation-filter.dto';
import { FieldFilterDto } from 'src/fields/dto/input/field-filter.dto';
import { FriendFilterDto } from 'src/friends/dto/input/friend-filter.dto';
import { NotificationFilterDto } from 'src/notifications/dto/input/notification-filter.dto';
import { BaseFilterDto } from 'src/shared/dto/input/base-filter.dto';

type FilterClass = new () => BaseFilterDto | FieldFilterDto;

const validateQuery = async (cls: FilterClass, query: Record<string, unknown>) => {
  const dto = plainToInstance(cls, query);
  const errors = await validate(dto);
  return { dto, properties: errors.map((error) => error.property) };
};

describe('BaseFilterDto inheritance', () => {
  it.each([
    ['NotificationFilterDto', NotificationFilterDto],
    ['ConversationFilterDto', ConversationFilterDto],
    ['FriendFilterDto', FriendFilterDto],
  ])('%s should inherit limit and cursor from BaseFilterDto', async (_name, cls) => {
    const { dto, properties } = await validateQuery(cls, { cursor: 'abc', limit: '20' });

    expect(properties).toEqual([]);
    expect(dto.limit).toBe(20);
    expect(dto.cursor).toBe('abc');
  });

  it('should reject a limit above 50', async () => {
    const { properties } = await validateQuery(NotificationFilterDto, { limit: '51' });

    expect(properties).toContain('limit');
  });

  it('should reject a limit below 1', async () => {
    const { properties } = await validateQuery(ConversationFilterDto, { limit: '0' });

    expect(properties).toContain('limit');
  });

  it('should reject a non-string cursor', async () => {
    const { properties } = await validateQuery(NotificationFilterDto, { cursor: 12 });

    expect(properties).toContain('cursor');
  });

  describe('FieldFilterDto', () => {
    it('should keep its own limit of 100', async () => {
      const { dto, properties } = await validateQuery(FieldFilterDto, { limit: '100' });

      expect(properties).toEqual([]);
      expect(dto.limit).toBe(100);
    });

    it('should reject a limit above 100', async () => {
      const { properties } = await validateQuery(FieldFilterDto, { limit: '101' });

      expect(properties).toContain('limit');
    });

    it('should inherit cursor validation', async () => {
      const { properties } = await validateQuery(FieldFilterDto, { cursor: 12 });

      expect(properties).toContain('cursor');
    });
  });
});
