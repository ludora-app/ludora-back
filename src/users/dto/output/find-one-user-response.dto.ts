import { ApiProperty } from '@nestjs/swagger';
import { Sex, UserType } from 'generated/prisma/client';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { SportPreferenceResponseData } from 'src/user-preferences/dto/output/sport-preference.response.dto';

export class FindOneUserResponseData {
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

  @ApiProperty({
    example: [{ sport: 'BASKETBALL' }],
    isArray: true,
    nullable: true,
    readOnly: true,
  })
  readonly sportPreferences?: SportPreferenceResponseData[];

  @ApiProperty({ example: 42, readOnly: true })
  readonly friendsCount?: number;

  @ApiProperty({ example: 12, readOnly: true })
  readonly matchesCount?: number;
}

export class FindMeUserResponseData extends FindOneUserResponseData {
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

  @ApiProperty({ enum: UserType, example: 'USER', nullable: true, readOnly: true })
  readonly type: UserType;

  @ApiProperty({ example: null, nullable: true, readOnly: true })
  readonly stripeAccountId?: string;

  @ApiProperty({ example: true, nullable: false, readOnly: true, required: false })
  readonly isEmailVerified?: boolean;

  @ApiProperty({ example: 'INCOMPLETE', nullable: false, readOnly: true })
  readonly profileStatus: 'COMPLETE' | 'INCOMPLETE';
}

export class FindMeUserResponseDto extends ResponseTypeDto<FindMeUserResponseData> {
  @ApiProperty({ type: FindMeUserResponseData })
  readonly data: FindMeUserResponseData;
}

export class FindOneUserResponseDto extends ResponseTypeDto<FindOneUserResponseData> {
  @ApiProperty({ type: FindOneUserResponseData })
  readonly data: FindOneUserResponseData;
}
