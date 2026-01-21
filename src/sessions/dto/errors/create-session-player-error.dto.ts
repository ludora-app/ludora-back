import { createEnumErrorDto } from 'src/shared/dto/errors/enum-error.dto';

export enum JoinSessionErrorTypes {
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  TEAM_NOT_FOUND = 'TEAM_NOT_FOUND',
  SESSION_FULL = 'SESSION_FULL',
  SESSION_ALREADY_JOINED = 'SESSION_ALREADY_JOINED',
  INVALID_SESSION_DATE = 'INVALID_SESSION_DATE',
  SESSION_AND_TEAM_DO_NOT_MATCH = 'SESSION_AND_TEAM_DO_NOT_MATCH',
}

export const JoinSessionErrorDto = createEnumErrorDto('JoinSessionErrorDto', JoinSessionErrorTypes);
