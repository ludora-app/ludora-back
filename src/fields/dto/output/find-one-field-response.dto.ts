import { Sport } from 'src/shared/constants/constants';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FieldType, VerificationStatus } from 'generated/prisma/enums';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';

import { FieldImageResponseDto, PartnerDto } from './field-response.dto';

export class FindOneFieldResponseData {
  @ApiProperty({ description: 'uid of the field', example: 'cmjzyy8k1000e4jt31vpr30yv' })
  readonly uid: string;

  @ApiProperty({ description: 'type of the field', enum: FieldType, example: FieldType.PRIVATE })
  readonly type: FieldType;

  @ApiProperty({
    description: 'status of the field',
    enum: VerificationStatus,
    example: VerificationStatus.APPROVED,
  })
  readonly status: VerificationStatus;

  @ApiProperty({
    description: 'sports of the field',
    enum: Sport,
    example: [Sport.BASKETBALL, Sport.FOOTBALL],
    isArray: true,
  })
  readonly sports: Sport[];

  @ApiPropertyOptional({ description: 'uid of the partner', example: 'cmjzyy8j300084jt3dc8pswsu' })
  readonly partnerUid?: string;

  @ApiPropertyOptional({ description: 'name of the field', example: 'The One Ball - Court 2' })
  readonly name?: string;

  @ApiProperty({
    description: 'address of the field',
    example: '38 Rue du Ballon, 93160 Noisy-le-Grand',
  })
  readonly address: string;

  @ApiProperty({
    description: 'short address of the field',
    example: '38 Rue du Ballon, 93160 Noisy-le-Grand',
  })
  readonly shortAddress: string;

  @ApiProperty({ description: 'latitude of the field', example: 48.83436030000001 })
  readonly latitude: number;

  @ApiProperty({ description: 'longitude of the field', example: 2.5689833 })
  readonly longitude: number;

  @ApiPropertyOptional({
    description: 'images of the field',
    type: () => [FieldImageResponseDto],
  })
  readonly fieldImages?: FieldImageResponseDto[];

  @ApiPropertyOptional({
    description: 'partner of the field',
    type: () => PartnerDto,
  })
  readonly partner?: PartnerDto;
}

export class FindOneFieldResponseDto extends ResponseTypeDto<FindOneFieldResponseData> {
  @ApiProperty({ type: FindOneFieldResponseData })
  readonly data: FindOneFieldResponseData;
}
