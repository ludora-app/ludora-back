import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { VerificationStatus } from 'generated/prisma/enums';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { UserSimpleDisplayWithUidData } from 'src/users/dto';
import { FindOneFieldResponseData } from './find-one-field-response.dto';

export class CreatorDto extends PartialType(UserSimpleDisplayWithUidData) {
  @ApiProperty({
    description: 'did the user verify his email account',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  readonly isEmailVerified: boolean;
}

export class ImageFieldAdminDto {
  @ApiProperty({
    description: 'Image url',
    example: 'https://example.com/image.jpg',
  })
  @IsString()
  readonly url: string;

  @ApiProperty({
    description: 'The uid of the image if it is already saved',
    readOnly: true,
  })
  @IsString()
  @IsOptional()
  readonly uid?: string;

  @ApiProperty({
    description: 'Display order of the image',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  @Max(4)
  @IsOptional()
  readonly order?: number;

  @ApiProperty({
    description: 'The verification status of the image',
    enum: VerificationStatus,
    readOnly: true,
  })
  @IsEnum(VerificationStatus)
  @IsOptional()
  readonly status?: VerificationStatus;
}

export class AdminFindOneFieldResponseData extends OmitType(FindOneFieldResponseData, [
  'fieldImages',
]) {
  @ApiProperty({
    description: 'creator of the field',
    type: CreatorDto,
  })
  @IsOptional()
  readonly creator: CreatorDto;

  @ApiProperty({
    description: 'images of the field',
    type: [ImageFieldAdminDto],
  })
  @Type(() => ImageFieldAdminDto)
  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  readonly fieldImages: ImageFieldAdminDto[];
}

export class AdminFindOneFieldResponseDto extends ResponseTypeDto<AdminFindOneFieldResponseData> {
  @ApiProperty({
    description: 'data of the field',
    type: AdminFindOneFieldResponseData,
  })
  readonly data: AdminFindOneFieldResponseData;
}
