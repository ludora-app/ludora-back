import { TeamLabels } from 'generated/prisma/enums';

import { RawPlayer, SessionPlayerMapper } from './session-player.mapper';
import { SessionTeamResponseData } from '../dto/output/session-team-response';

export type SessionTeamWithPlayers = {
  teamName: string;
  teamLabel: TeamLabels;
  sessionPlayers: RawPlayer[];
  uid: string;
  isJoined?: boolean;
};

export type SessionTeamWithPlayersAndNumberOfPlayers = SessionTeamWithPlayers & {
  numberOfPlayers: number;
  uid: string;
};

export class SessionTeamMapper {
  static toDto(
    sessionTeam: SessionTeamWithPlayers,
    maxPlayersPerTeam?: number,
  ): SessionTeamResponseData {
    const numberOfPlayers = sessionTeam.sessionPlayers.length;
    const dto: SessionTeamResponseData = {
      numberOfPlayers,
      sessionPlayers: SessionPlayerMapper.toDtoList(sessionTeam.sessionPlayers.slice(0, 3)),
      teamLabel: sessionTeam.teamLabel,
      teamName: sessionTeam.teamName,
      teamUid: sessionTeam.uid,
    };

    if (maxPlayersPerTeam !== undefined) {
      dto.isComplete = numberOfPlayers >= maxPlayersPerTeam;
    }

    if (sessionTeam.isJoined !== undefined) {
      dto.isJoined = sessionTeam.isJoined;
    }

    return dto;
  }

  static toDtoList(
    sessionTeams: SessionTeamWithPlayers[],
    maxPlayersPerTeam?: number,
  ): SessionTeamResponseData[] {
    return sessionTeams.map((team) => this.toDto(team, maxPlayersPerTeam));
  }
}
