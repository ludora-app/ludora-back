import { createEnumErrorDto } from 'src/shared/dto/errors/enum-error.dto';

export enum FindOneSessionResponseErrorTypes {
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
}

export const FindOneSessionResponseErrorDto = createEnumErrorDto(
  'FindOneSessionResponseErrorDto',
  FindOneSessionResponseErrorTypes,
);
