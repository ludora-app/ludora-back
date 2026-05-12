import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
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

export class AdminFindOneFieldResponseData extends FindOneFieldResponseData {
  @ApiProperty({
    description: 'creator of the field',
    type: CreatorDto,
  })
  @IsOptional()
  readonly creator: CreatorDto;
}

export class AdminFindOneFieldResponseDto extends ResponseTypeDto<AdminFindOneFieldResponseData> {
  @ApiProperty({
    description: 'data of the field',
    type: AdminFindOneFieldResponseData,
  })
  readonly data: AdminFindOneFieldResponseData;
}
