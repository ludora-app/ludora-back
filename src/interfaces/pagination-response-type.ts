import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export interface PaginationResponseTypeDto<T = unknown> {
  status?: number;
  message?: string;
  data: {
    items: T[];
    nextCursor: string;
    totalCount: number;
  };
}

export function PaginationDataDto<T>(itemType: Type<T>) {
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

export function PaginationResponseDto<T>(itemType: Type<T>) {
  const PaginationData = PaginationDataDto(itemType);

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
