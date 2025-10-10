import { ApiProperty } from '@nestjs/swagger';
import { SuccessTypeDto } from 'src/interfaces/success-type';

export class LogoutResponseDto extends SuccessTypeDto {
  @ApiProperty({
    description: 'Logout success message',
    example: 'Logged out successfully',
    type: String,
  })
  message: string;
}
