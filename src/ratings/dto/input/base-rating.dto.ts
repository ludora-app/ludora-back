import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, Min } from 'class-validator';
import { UserRatings } from 'generated/prisma/client';

export interface RatingEntity
  extends Pick<
    UserRatings,
    'sessionUid' | 'evaluatedUid' | 'note1' | 'note2' | 'note3' | 'sport' | 'evaluatorUid'
  > {}

export class CreateBaseRatingDto {
  @ApiProperty({ example: 'session-uid', description: 'The uid of the session' })
  @IsString()
  readonly sessionUid: string;

  @ApiProperty({ example: 'evaluated-uid', description: 'The uid of the evaluated user' })
  @IsString()
  readonly evaluatedUid: string;

  @ApiProperty({
    minimum: 1,
    maximum: 5,
    example: 5,
    description: 'The shoot rating to attribute to the user',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  readonly shoot: number;

  @ApiProperty({
    minimum: 1,
    maximum: 5,
    example: 5,
    description: 'The defense rating to attribute to the user',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  readonly defense: number;

  @ApiProperty({
    minimum: 1,
    maximum: 5,
    example: 5,
    description: 'The dribble rating to attribute to the user',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  readonly dribble: number;

  @ApiProperty({
    minimum: 1,
    maximum: 5,
    example: 5,
    description: 'The passing rating to attribute to the user',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  readonly passing: number;

  @ApiProperty({
    minimum: 1,
    maximum: 5,
    example: 5,
    description: 'The smash rating to attribute to the user',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  readonly smash: number;

  @ApiProperty({
    minimum: 1,
    maximum: 5,
    example: 5,
    description: 'The volley rating to attribute to the user',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  readonly volley: number;

  @ApiProperty({
    minimum: 1,
    maximum: 5,
    example: 5,
    description: 'The placement rating to attribute to the user',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  readonly placement: number;

  @ApiProperty({
    minimum: 1,
    maximum: 5,
    example: 5,
    description: 'The serve rating to attribute to the user',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  readonly serve: number;

  @ApiProperty({
    minimum: 1,
    maximum: 5,
    example: 5,
    description: 'The spike rating to attribute to the user',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  readonly spike: number;

  @ApiProperty({
    minimum: 1,
    maximum: 5,
    example: 5,
    description: 'The reception rating to attribute to the user',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  readonly reception: number;

  @ApiProperty({
    minimum: 1,
    maximum: 5,
    example: 5,
    description: 'The foreHand rating to attribute to the user',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  readonly forehand: number;

  @ApiProperty({
    minimum: 1,
    maximum: 5,
    example: 5,
    description: 'The attack rating to attribute to the user',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  readonly attack: number;
}
