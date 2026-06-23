import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';
import { FindMeUserResponseData } from './find-one-user-response.dto';

export class FindAllReportedUsersResponseData extends PickType(FindMeUserResponseData, [
  'uid',
  'firstname',
  'lastname',
  'imageUrl',
  'isEmailVerified',
  'email',
  'sex',
]) {
  @IsInt()
  @IsNotEmpty()
  @ApiProperty({ description: 'number of reports on this user', readOnly: true })
  reportCount: number;
}

export const FindAllReportedUsersResponseDto = toPaginationResponseType(
  FindAllReportedUsersResponseData,
);
