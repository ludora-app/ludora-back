import { ApiProperty } from '@nestjs/swagger';
import { Sport } from 'src/shared/constants/constants';
import { ConversationType, MessageStatus, MessageType } from 'generated/prisma/enums';

export class MessageDto {
  @ApiProperty({
    description: 'Message ID',
    example: 'cmkpi7ca902t95imr968rwws0',
    readOnly: true,
  })
  uid: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Cool ! On pourrait faire ça samedi prochain',
    readOnly: true,
  })
  content: string;

  @ApiProperty({
    description: 'Message creation date',
    example: '2026-01-10T14:24:46.830Z',
    readOnly: true,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Message global status',
    enum: MessageStatus,
    example: MessageStatus.READ,
    readOnly: true,
  })
  globalStatus: MessageStatus;

  @ApiProperty({
    description: 'Message type',
    enum: MessageType,
    example: MessageType.TEXT,
    readOnly: true,
  })
  type: MessageType;
}

export class SenderDto {
  @ApiProperty({
    description: 'User ID',
    example: 'cmkpi7ca502t45imrn5ss4zki',
    readOnly: true,
  })
  uid: string;

  @ApiProperty({
    description: 'User firstname',
    example: 'John',
    readOnly: true,
  })
  firstname: string;

  @ApiProperty({
    description: 'User lastname',
    example: 'Doe',
    readOnly: true,
  })
  lastname: string;
}

export class SessionData {
  @ApiProperty({
    description: 'Team label of the connected user in the conversation',
    example: 'A',
    readOnly: true,
  })
  teamLabel: string;

  @ApiProperty({
    description: 'Team name of the connected user in the conversation',
    example: 'Team A',
    readOnly: true,
  })
  teamName: string;

  @ApiProperty({
    description: 'Session ID of the conversation',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    nullable: true,
    readOnly: true,
    type: String,
  })
  sessionUid: string | null;

  @ApiProperty({
    description: 'Session sport',
    enum: Sport,
    example: Sport.FOOTBALL,
    readOnly: true,
  })
  sport: Sport;
}

export class BasicConversationResponseData {
  @ApiProperty({
    description: 'Conversation ID',
    example: 'cmkpi7ca502t45imrn5ss4zki',
    readOnly: true,
    type: String,
  })
  uid: string;

  @ApiProperty({
    description: 'Session data',
    nullable: true,
    readOnly: true,
    type: SessionData,
  })
  sessionData: SessionData | null;

  @ApiProperty({
    description: 'Conversation name',
    example: 'Conversation 1',
    nullable: true,
    readOnly: true,
  })
  name: string | null;

  @ApiProperty({
    description: 'Conversation type: PRIVATE, GROUP, SESSION',
    enum: ConversationType,
    example: ConversationType.PRIVATE,
    readOnly: true,
  })
  type: ConversationType;

  @ApiProperty({
    description: 'Sender information',
    nullable: true,
    readOnly: true,
    type: SenderDto,
  })
  sender: SenderDto | null;

  @ApiProperty({
    description: 'Conversation image URL, can either be the user image or the session image',
    example: 'https://example.com/image.jpg',
    nullable: true,
    readOnly: true,
  })
  imageUrl: string | null;

  @ApiProperty({
    description: 'Conversation last update date',
    example: '2026-01-10T14:24:46.830Z',
    readOnly: true,
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Conversation creation date',
    example: '2026-01-10T14:24:46.830Z',
    readOnly: true,
  })
  createdAt: Date;
}
