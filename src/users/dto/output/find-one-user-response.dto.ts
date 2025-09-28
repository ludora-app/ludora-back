import { ApiProperty } from '@nestjs/swagger';
import { Sex, User_type } from '@prisma/client';
import { ResponseTypeDto } from 'src/interfaces/response-type';

export class FindOneUserResponseDataDto {
  @ApiProperty({ example: 'cm7hvgonx0000to0mh5maqajc', readOnly: true })
  readonly uid: string;

  @ApiProperty({ example: 'Toto', readOnly: true })
  readonly firstname: string;

  @ApiProperty({ example: 'Lolo', readOnly: true })
  readonly lastname: string;

  @ApiProperty({ example: null, nullable: true, readOnly: true })
  readonly name?: string;

  @ApiProperty({ example: 'I am a good person', nullable: true, readOnly: true })
  readonly bio?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', nullable: true, readOnly: true })
  readonly imageUrl?: string;
}

export class FindMeUserResponseDataDto {
  @ApiProperty({ example: 'cm7hvgonx0000to0mh5maqajc', readOnly: true })
  readonly uid: string;

  @ApiProperty({ example: 'Toto', readOnly: true })
  readonly firstname: string;

  @ApiProperty({ example: 'Lolo', readOnly: true })
  readonly lastname: string;

  @ApiProperty({ example: null, nullable: true, readOnly: true })
  readonly name?: string;

  @ApiProperty({ example: 'I am a good person', nullable: true, readOnly: true })
  readonly bio?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', nullable: true, readOnly: true })
  readonly imageUrl?: string;

  @ApiProperty({ example: 'toto@gmail.com', nullable: true, readOnly: true })
  readonly email?: string;

  @ApiProperty({ example: '+33609032663', nullable: true, readOnly: true })
  readonly phone?: string;

  @ApiProperty({ example: '1998-01-31T00:00:00.000Z', nullable: true, readOnly: true })
  readonly birthdate?: Date;

  @ApiProperty({ enum: Sex, example: 'MALE', nullable: true, readOnly: true })
  readonly sex?: Sex;

  @ApiProperty({ example: true, nullable: true, readOnly: true })
  readonly active?: boolean;

  @ApiProperty({ enum: User_type, example: 'USER', nullable: true, readOnly: true })
  readonly type: User_type;

  @ApiProperty({ example: null, nullable: true, readOnly: true })
  readonly stripe_account_uid?: string;
}

export class FindMeUserResponseDto extends ResponseTypeDto<FindMeUserResponseDataDto> {
  @ApiProperty({ type: FindMeUserResponseDataDto })
  readonly data: FindMeUserResponseDataDto;
}

export class FindOneUserResponseDto extends ResponseTypeDto<FindOneUserResponseDataDto> {
  @ApiProperty({ type: FindOneUserResponseDataDto })
  readonly data: FindOneUserResponseDataDto;
}
