import { GameModes } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

import { UpdateFieldDto } from './update-field.dto';

/* The class UpdatePrivateFieldDto extends UpdateFieldDto and includes readonly properties entryFee and
gameMode with specified examples and readOnly settings. */
export class UpdatePrivateFieldDto extends UpdateFieldDto {
  @ApiProperty({ example: 10, readOnly: true })
  readonly entryFee?: number;

  @ApiProperty({ example: GameModes.THREE_V_THREE, readOnly: true })
  readonly gameMode?: GameModes;
}
