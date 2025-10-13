import { ApiProperty } from '@nestjs/swagger';
import { Invitation_status } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class UpdateSessionInvitationDto {
  @IsEnum(Invitation_status)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Status of the session invitation',
    enum: Invitation_status,
    example: Invitation_status.PENDING,
    required: true,
  })
  status: Invitation_status;

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
