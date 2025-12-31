import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { InvitationStatus } from 'generated/prisma/enums';

export class UpdateFriendDto {
  @IsEnum(InvitationStatus)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Status to apply to the friend request',
    enum: InvitationStatus,
    example: InvitationStatus.ACCEPTED,
    required: true,
  })
  readonly status: InvitationStatus;
}
