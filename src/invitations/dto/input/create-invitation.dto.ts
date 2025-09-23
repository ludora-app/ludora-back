import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateInvitationDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Id de la session',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    readOnly: true,
    type: String,
  })
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: "Id de l'utilisateur",
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    readOnly: true,
    type: String,
  })
  userId: string;
}
