import { ApiProperty } from '@nestjs/swagger';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';

import { RegisterResponseDataDto } from './register-response.dto';

export class CreateOrConnectGoogleResponseDto extends ResponseTypeDto<CreateOrConnectGoogleResponseDataDto> {
  @ApiProperty({
    example: 'User created or connected successfully',
    readOnly: true,
    type: String,
  })
  message: string;
}

export class CreateOrConnectGoogleResponseDataDto extends RegisterResponseDataDto {
  @ApiProperty({
    description:
      'True if the user was just created, false if the user already existed and was connected to the Google account',
    example: true,
    readOnly: true,
    type: Boolean,
  })
  isNewUser: boolean;
}
