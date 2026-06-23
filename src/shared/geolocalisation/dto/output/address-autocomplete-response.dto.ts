import { PickType } from '@nestjs/swagger';
import { FindOneFieldResponseData } from 'src/fields/dto/output/find-one-field-response.dto';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';

export class AddressAutocompleteResponseData extends PickType(FindOneFieldResponseData, [
  'address',
  'latitude',
  'longitude',
  'shortAddress',
]) {}

export const AddressAutocompleteResponseDto = toPaginationResponseType(
  AddressAutocompleteResponseData,
);
