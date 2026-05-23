import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddressAutocompleteDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '2 Rue du General Leclerc',
    description: 'The address to search for',
  })
  address: string;
}
