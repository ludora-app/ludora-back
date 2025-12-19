import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { SessionScope, Sport } from 'src/shared/constants/constants';
import { SortOrder } from 'generated/prisma/internal/prismaNamespace';

export enum SessionOwnnership {
  CREATOR = 'CREATOR',
  PLAYER = 'PLAYER',
}

/**
 * @description DTO for filtering the sessions of the current user
 */
export class MySessionFilterDto {
  @IsOptional()
  @IsEnum(SessionOwnnership)
  @ApiProperty({
    description: 'Filter sessions by whether they are owned by the current user or just joined',
    enum: SessionOwnnership,
    example: SessionOwnnership.CREATOR,
    required: false,
  })
  ownership?: SessionOwnnership;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @ApiProperty({
    description: 'Minimum start date',
    example: '2022-01-01T00:00:00.000Z',
    required: false,
    type: Date,
  })
  minStart?: Date;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @ApiProperty({
    description: 'Maximum start date',
    example: '2022-01-01T00:00:00.000Z',
    required: false,
    type: Date,
  })
  maxStart?: Date;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @ApiProperty({
    description: 'End date of the session',
    example: '2022-01-01T00:00:00.000Z',
    required: false,
    type: Date,
  })
  endDate?: Date;

  @IsOptional()
  @IsEnum(SortOrder)
  @ApiProperty({
    description: 'Sort order of the sessions by creation date',
    enum: SortOrder,
    example: SortOrder.desc,
    required: false,
  })
  createdAtSortOrder?: SortOrder;

  @IsOptional()
  @IsEnum(SortOrder)
  @ApiProperty({
    description: 'Sort order of the sessions by start date',
    enum: SortOrder,
    example: SortOrder.desc,
    required: false,
  })
  startDateSortOrder?: SortOrder;

  @IsOptional()
  @IsEnum(SessionScope)
  @ApiProperty({
    description: `Filter sessions by whether they are past or upcoming, used to filter my sessions`,
    enum: SessionScope,
    example: SessionScope.UPCOMING,
    required: false,
  })
  scope?: SessionScope;

  @IsOptional()
  @Transform(({ value }) => {
    // ? If it's already an array, return it as is
    if (Array.isArray(value)) return value;
    // ? If it's a string, put it in an array
    return [value];
  })
  @IsEnum(Sport, { each: true })
  @ApiProperty({
    description: 'Sports of the sessions',
    enum: Sport,
    example: [Sport.BASKETBALL, Sport.FOOTBALL],
    isArray: true,
    required: false,
  })
  sports?: Sport[];
}
