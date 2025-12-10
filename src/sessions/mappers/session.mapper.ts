import { Sessions } from 'generated/prisma/client';
import { Sport } from 'src/shared/constants/constants';

import { SessionResponse } from '../dto/output/session.response';

/**
 * @description Mapper for the Session entity
 * Allows the response to return a session.sport as Sport enum instead of a string
 * without having to cast it in the controller nor change the prisma schemas
 */
export class SessionMapper {
  static toSessionResponse(session: Sessions): SessionResponse {
    return {
      ...session,
      sport: session.sport as Sport,
    };
  }

  static toSessionResponses(sessions: Sessions[]): SessionResponse[] {
    return sessions.map(SessionMapper.toSessionResponse);
  }
}
