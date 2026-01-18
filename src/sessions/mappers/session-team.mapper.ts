import { TeamLabels } from 'generated/prisma/enums';

import { RawPlayer, SessionPlayerMapper } from './session-player.mapper';
import { SessionTeamResponseData } from '../dto/output/session-team-response';

export type SessionTeamWithPlayers = {
  teamName: string;
  teamLabel: TeamLabels;
  sessionPlayers: RawPlayer[];
  uid: string;
};

export type SessionTeamWithPlayersAndNumberOfPlayers = SessionTeamWithPlayers & {
  numberOfPlayers: number;
  uid: string;
};

export class SessionTeamMapper {
  static toDto(sessionTeam: SessionTeamWithPlayers): SessionTeamResponseData {
    return {
      numberOfPlayers: sessionTeam.sessionPlayers.length,
      sessionPlayers: SessionPlayerMapper.toDtoList(sessionTeam.sessionPlayers),
      teamLabel: sessionTeam.teamLabel,
      teamName: sessionTeam.teamName,
      teamUid: sessionTeam.uid,
    };
  }

  static toDtoList(sessionTeams: SessionTeamWithPlayers[]): SessionTeamResponseData[] {
    return sessionTeams.map((team) => this.toDto(team));
  }
}
