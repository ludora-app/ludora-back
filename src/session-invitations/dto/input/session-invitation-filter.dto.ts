import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Invitation_status } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class SessionInvitationFilterDto {
  @IsString()
  @IsOptional()
  sessionId: string;

  @IsString()
  @IsOptional()
  userId: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty({
    description: 'Limit of session invitations to return',
    example: 10,
    required: false,
    type: Number,
  })
  limit?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Cursor ID for pagination',
    example: 'fcacfaca3c2a323bhf',
    required: false,
    type: String,
  })
  cursor?: string;

  @IsOptional()
  @IsEnum(Invitation_status)
  @ApiProperty({
    description: `filtre les sessions en fonction de s'ils sont passés ou à venir, sert pour filtrer mes sessions`,
    enum: Invitation_status,
    example: Invitation_status.PENDING,
    required: false,
  })
  scope?: string;
}
