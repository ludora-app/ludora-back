import { ApiProperty } from '@nestjs/swagger';
import { GameModes } from 'generated/prisma/enums';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';

export class FieldSlotResponseData {
  @ApiProperty({ description: 'The unique identifier of the field slot' })
  readonly uid: string;
  @ApiProperty({ description: 'The start time of the field slot' })
  readonly startTime: Date;
  @ApiProperty({ description: 'The end time of the field slot' })
  readonly endTime: Date;
  @ApiProperty({ description: 'The game mode of the field slot' })
  readonly gameMode: GameModes;
  @ApiProperty({ description: 'The price of the field slot' })
  readonly price: number;
  @ApiProperty({ description: 'The reservation status of the field slot' })
  readonly isReserved: boolean;
  @ApiProperty({ description: 'The creation date of the field slot' })
  readonly createdAt: Date;
  @ApiProperty({ description: 'The update date of the field slot' })
  readonly updatedAt: Date;
}

export class FieldSlotResponseDto extends ResponseTypeDto<FieldSlotResponseData> {
  @ApiProperty({ type: FieldSlotResponseData })
  readonly data: FieldSlotResponseData;
}
