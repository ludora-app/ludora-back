import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ReportReason } from 'generated/prisma/enums';

export class CreateUserBanDto {
  @ApiProperty({
    enum: ReportReason,
    required: false,
    description: 'The reason for the ban',
  })
  @IsEnum(ReportReason)
  @IsOptional()
  banReason?: ReportReason;

  @ApiProperty({
    required: true,
    description: 'The uid of the user to ban',
  })
  @IsString()
  @IsNotEmpty()
  userUid: string;
}

export class CreateUserBanParamDto extends OmitType(CreateUserBanDto, ['userUid']) {}
