import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { InvitationStatus } from 'generated/prisma/client';
import { BaseFilterDto } from 'src/shared/dto/input/base-filter.dto';

export class SessionInvitationFilterDto extends BaseFilterDto {
  @IsString()
  @IsOptional()
  sessionUid: string;

  @IsString()
  @IsOptional()
  userId: string;

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
