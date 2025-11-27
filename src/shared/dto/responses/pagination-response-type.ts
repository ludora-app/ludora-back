import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

/**
 * This interface is used to define the response type for pagination responses in the controllers
 */
export interface PaginationResponseTypeDto<T = unknown> {
  message?: string;
  data: PaginatedDataDto<T[]>;
}

/**
 * This interface is used to define the data type for pagination responses in the services
 */
export interface PaginatedDataDto<T = unknown> {
  items: T[];
  totalCount?: number | undefined;
  nextCursor?: string | null | undefined;
}

/**
 * This function is used to define the data type for pagination responses in the swagger documentation
 */
export function toPaginatedDataDto<T>(itemType: Type<T>) {
  class PaginationDataDtoClass {
    @ApiProperty({ isArray: true, readOnly: true, type: itemType })
    readonly items: T[];

    @ApiProperty({ nullable: true, readOnly: true, type: String })
    readonly nextCursor: string | null;

    @ApiProperty({ readOnly: true, type: Number })
    readonly totalCount?: number;
  }

  Object.defineProperty(PaginationDataDtoClass, 'name', {
    value: `PaginationData${itemType.name}`,
  });

  return PaginationDataDtoClass;
}

/**
 * This function is used to define the response type for pagination responses in the swagger documentation
 */
export function toPaginationResponseType<T>(itemType: Type<T>) {
  const PaginationData = toPaginatedDataDto(itemType);

  class PaginationResponseDtoClass {
    @ApiProperty({ readOnly: true, required: false })
    readonly message?: string;

    @ApiProperty({ readOnly: true, type: () => PaginationData })
    readonly data: InstanceType<typeof PaginationData>;

    @ApiProperty({ example: 200, readOnly: true, required: false, type: Number })
    readonly status?: number;
  }

  Object.defineProperty(PaginationResponseDtoClass, 'name', {
    value: `PaginationResponse${itemType.name}`,
  });

  return PaginationResponseDtoClass;
}
