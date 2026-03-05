import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { ReportReason } from 'generated/prisma/enums';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The uid of the user to report',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
  })
  reportedUid: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The reason for the report',
    enum: ReportReason,
    example: ReportReason.SPAM,
  })
  reason: ReportReason;

  @ValidateIf((o) => o.reason === ReportReason.OTHER)
  @IsString()
  @IsNotEmpty({ message: 'description is required when reason is OTHER' })
  @ApiProperty({
    description: 'Required when reason is OTHER. The description of the report.',
    example: 'This user is spamming the chat',
    required: false,
  })
  description?: string;
}
