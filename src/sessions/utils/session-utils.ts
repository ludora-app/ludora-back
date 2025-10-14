export type FlattenedPlayer = {
  userUid: string;
  teamUid: string;
  firstname: string;
  lastname: string;
  imageUrl: string | null;
};

export type SessionTeamWithPlayers = {
  sessionPlayers: {
    userUid: string;
    teamUid: string;
    user: {
      firstname: string;
      lastname: string;
      imageUrl: string | null;
    };
  }[];
};

export class SessionUtils {
  /**
   * Flattens the sessionPlayers array to include the user details at the root level
   * @param sessionTeam - A session team with nested player data
   * @returns A session team with flattened player data
   */
  public static formatSessionPlayers<T extends SessionTeamWithPlayers>(
    sessionTeam: T,
  ): Omit<T, 'sessionPlayers'> & { sessionPlayers: FlattenedPlayer[] } {
    const { sessionPlayers, ...rest } = sessionTeam;
    return {
      ...rest,
      sessionPlayers: (sessionPlayers || []).map((player) => ({
        firstname: player.user.firstname,
        imageUrl: player.user.imageUrl,
        lastname: player.user.lastname,
        teamUid: player.teamUid,
        userUid: player.userUid,
      })),
    };
  }
}
