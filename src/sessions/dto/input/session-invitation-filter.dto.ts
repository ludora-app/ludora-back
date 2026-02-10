import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { InvitationStatus } from 'generated/prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SessionInvitationFilterDto {
  @IsString()
  @IsOptional()
  sessionUid: string;

  @IsString()
  @IsOptional()
  userId: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
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
  @IsEnum(InvitationStatus)
  @ApiProperty({
    description: `filtre les sessions en fonction de s'ils sont passés ou à venir, sert pour filtrer mes sessions`,
    enum: InvitationStatus,
    example: InvitationStatus.PENDING,
    required: false,
  })
  scope?: string;
}
