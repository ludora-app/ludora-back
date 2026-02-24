import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { OnBoardingStatus, Sex } from 'generated/prisma/client';
import { IsDateString, IsEnum, IsIn, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The firstname of the user',
    example: 'John',
    required: false,
    type: String,
  })
  firstname?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The lastname of the user',
    example: 'Doe',
    required: false,
    type: String,
  })
  lastname?: string;

  @IsDateString()
  @IsOptional()
  @ApiProperty({
    description: 'The birthdate of the user',
    example: '01/01/2000',
    required: false,
    type: String,
  })
  birthdate?: string;

  @IsEnum(Sex, { message: 'Unknown Sex' })
  @IsOptional()
  @ApiProperty({
    description: 'The sex of the user',
    enum: Sex,
    example: ['MALE', 'FEMALE', 'OTHER'],
    required: false,
  })
  sex?: Sex;

  @IsPhoneNumber('FR')
  @IsOptional()
  @ApiProperty({
    description: 'The phone number of the user',
    example: '+33612345678',
    required: false,
    type: String,
  })
  phone?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The biography of the user',
    example: 'Je suis un bousilleur',
    required: false,
    type: String,
  })
  bio?: string;

  @ApiProperty({
    description: 'File image (avatar)',
    format: 'binary',
    required: false,
    type: 'string',
  })
  file?: any;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The city of the user',
    example: 'Paris',
    required: false,
    type: String,
  })
  city?: string;

  @IsIn([OnBoardingStatus.COMPLETE], {
    message: 'onBoardingStatus must be COMPLETE',
  })
  @IsOptional()
  @ApiProperty({
    description: 'The onboarding status of the user (only COMPLETE is accepted)',
    enum: [OnBoardingStatus.COMPLETE],
    example: OnBoardingStatus.COMPLETE,
    required: false,
  })
  onBoardingStatus?: OnBoardingStatus;
}

export class UpdateUserEmailDto extends PickType(CreateUserDto, ['email']) {}
