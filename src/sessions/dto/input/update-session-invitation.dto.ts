import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { InvitationStatus } from 'generated/prisma/client';

export class UpdateSessionInvitationDto {
  @IsEnum(InvitationStatus)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Status of the session invitation',
    enum: InvitationStatus,
    example: InvitationStatus.PENDING,
    required: true,
  })
  status: InvitationStatus;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User ID of either the sender or the receiver',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    required: true,
  })
  userUid: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Session ID',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    required: true,
  })
  sessionUid: string;
}
