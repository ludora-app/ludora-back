import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { FieldType } from 'generated/prisma/client';
import { Sport } from 'src/shared/constants/constants';
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

  @ApiPropertyOptional({ description: 'price of the field slot', example: 25 })
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

  @ApiProperty({
    description: 'sports of the field',
    enum: Sport,
    example: [Sport.BASKETBALL, Sport.FOOTBALL],
    isArray: true,
  })
  readonly sports: Sport[];

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
    description: 'distance (in meters) between the user and the field',
    example: 1200,
  })
  readonly userDistance?: number;
}

export class PublicFieldResponseData extends OmitType(FieldResponseDto, [
  'availabilities',
  'userDistance',
  'type',
]) {}

export const PaginatedFieldResponse = toPaginationResponseType(FieldResponseDto);

export const PaginatedPublicFieldResponse = toPaginationResponseType(PublicFieldResponseData);
