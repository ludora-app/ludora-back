import { ApiProperty } from '@nestjs/swagger';
import { IsString, Validate } from 'class-validator';
import { IsStrongPassword } from 'src/users/password.validator';

export class UpdatePasswordDto {
  @IsString()
  @Validate(IsStrongPassword)
  @ApiProperty({
    description: "Ancien mot de passe de l'utilisateur",
    example: 'password',
    required: true,
    type: String,
  })
  oldPassword: string;

  @IsString()
  @Validate(IsStrongPassword)
  @ApiProperty({
    description: "Nouveau mot de passe de l'utilisateur",
    example: 'password',
    required: true,
    type: String,
  })
  newPassword: string;
}
