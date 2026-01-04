import { Sport } from 'src/shared/constants/constants';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FieldType, VerificationStatus } from 'generated/prisma/client';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';

export class FieldImageResponseDto {
  @ApiProperty({ example: 0, readOnly: true })
  readonly order: number;

  @ApiProperty({ example: 'https://example.com/image.jpg', readOnly: true })
  readonly url: string;
}

export class PartnerDto {
  @ApiProperty({ description: 'uid of the partner', example: 'cmjzyy8j300084jt3dc8pswsu' })
  readonly uid: string;

  @ApiProperty({ description: 'rank of the partner', example: 0 })
  readonly rank: number;
}
export class FieldAvailabilityDto {
  @ApiProperty({ description: 'uid of the availability', example: 'cm7hvgonx0000to0mh5maqajc' })
  readonly uid: string;

  @ApiProperty({ description: 'start time of the availability', example: '2025-12-28T18:00:00Z' })
  readonly startTime: Date;

  @ApiProperty({ description: 'end time of the availability', example: '2025-12-28T19:00:00Z' })
  readonly endTime: Date;

  @ApiProperty({
    description: 'type of the availability',
    enum: ['RESERVATION', 'MATCH_TO_JOIN'],
    example: 'RESERVATION',
  })
  readonly type: 'RESERVATION' | 'MATCH_TO_JOIN';

  @ApiPropertyOptional({ description: 'price of the availability', example: 25 })
  readonly price?: number;

  @ApiPropertyOptional({ description: 'price per player of the availability', example: 10 })
  readonly pricePerPlayer?: number;
}

export class FieldResponseDto {
  @ApiProperty({ description: 'uid of the field', example: 'cm7hvgonx0000to0mh5maqajc' })
  readonly uid: string;

  @ApiProperty({ description: 'type of the field', enum: FieldType, example: FieldType.PRIVATE })
  readonly type: FieldType;

  @ApiPropertyOptional({ description: 'name of the field', example: 'Hoopsfactory - Court 2' })
  readonly name?: string;

  @ApiProperty({ description: 'sport of the field', example: Sport.BASKETBALL })
  readonly sport: Sport;

  @ApiProperty({
    description: 'short address of the field',
    example: '38 Rue du Ballon, Noisy-le-Grand',
  })
  readonly shortAddress: string;

  @ApiProperty({ description: 'latitude of the field', example: 48.8588443 })
  readonly latitude: number;

  @ApiProperty({ description: 'longitude of the field', example: 2.2943506 })
  readonly longitude: number;

  @ApiPropertyOptional({
    description: 'images of the field',
    type: () => [FieldImageResponseDto],
  })
  readonly fieldImages?: FieldImageResponseDto[];

  @ApiPropertyOptional({
    description: 'availabilities of the field',
    type: [FieldAvailabilityDto],
  })
  readonly availabilities?: FieldAvailabilityDto[];

  @ApiPropertyOptional({
    description: 'distance to the field in meters',
    example: 1200,
  })
  readonly userDistance?: number;
}

export class FindOneFieldResponseDto {
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

  @ApiProperty({ description: 'sport of the field', example: Sport.BASKETBALL })
  readonly sport: Sport;

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

export const PaginatedFieldResponse = toPaginationResponseType(FieldResponseDto);
