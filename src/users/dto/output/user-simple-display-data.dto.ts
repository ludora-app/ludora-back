import { ApiProperty } from '@nestjs/swagger';

export class UserSimpleDisplayData {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  firstname: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  lastname: string;

  @ApiProperty({
    description: 'User profile image URL',
    example: '1738433236109explore2.png',
    nullable: true,
  })
  imageUrl: string | null;
}

export class UserSimpleDisplayWithUidData extends UserSimpleDisplayData {
  @ApiProperty({
    description: 'User ID',
    example: 'cmkpi7ca502t45imrn5ss4zki',
  })
  uid: string;
}
