import { FlattenedSessionPlayer } from '../dto/output/session-team-response';

/**
 * @description Raw player data retrieved from the team relation with prisma
 */
export type RawPlayer = {
  userUid: string;
  teamUid: string;
  user: {
    firstname: string;
    lastname: string;
    imageUrl: string | null;
    bio?: string | null;
  };
  sessionsCount?: number;
};

export class SessionPlayerMapper {
  static toDto(player: RawPlayer): FlattenedSessionPlayer {
    return {
      bio: player.user.bio,
      firstname: player.user.firstname,
      imageUrl: player.user.imageUrl,
      lastname: player.user.lastname,
      sessionsCount: player.sessionsCount,
      teamUid: player.teamUid,
      userUid: player.userUid,
    };
  }

  static toDtoList(players: RawPlayer[]): FlattenedSessionPlayer[] {
    return players.map((player) => this.toDto(player));
  }
}
