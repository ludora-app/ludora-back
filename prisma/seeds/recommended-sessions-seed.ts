/**
 * Dev seed: many upcoming sessions over the next 14 days, to test the recommendations
 * (GET /sessions/recommended-list/collection) and the session suggestions.
 * Every session is tagged with SEED_TITLE_PREFIX, so `--clean` removes exactly what this seed created.
 * Each run removes the previous seed sessions first. Never runs in production.
 *
 * Run (inside the local API container, with the Vault env):
 *   make local-sh
 *   pnpm seed:recommended
 *   pnpm seed:recommended:clean
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import {
  ConversationType,
  GameModes,
  PrismaClient,
  SessionVisibility,
  TeamLabels,
  UserType,
} from '../../generated/prisma/client';

const SEED_TITLE_PREFIX = '[SEED-RECO]';
const TIME_ZONE = 'Europe/Paris';
const DAYS = 14;
const DURATION_MINUTES = 90;
// Local (Paris) start times: one per hour preference period (morning 9-12, afternoon 12-17, evening 17-22)
const START_TIMES = [
  { hour: 10, minute: 0 },
  { hour: 15, minute: 0 },
  { hour: 19, minute: 30 },
];
const SPORTS: { gameModes: GameModes[]; sport: string }[] = [
  { gameModes: [GameModes.FIVE_V_FIVE, GameModes.SEVEN_V_SEVEN], sport: 'FOOTBALL' },
  { gameModes: [GameModes.THREE_V_THREE, GameModes.FIVE_V_FIVE], sport: 'BASKETBALL' },
  { gameModes: [GameModes.ONE_V_ONE, GameModes.TWO_V_TWO], sport: 'TENNIS' },
  { gameModes: [GameModes.TWO_V_TWO, GameModes.ONE_V_ONE], sport: 'PADEL' },
];
// 0 = open to every level
const LEVELS = [0, 1, 2, 3];
const PLAYERS_PER_TEAM: Partial<Record<GameModes, number>> = {
  [GameModes.ONE_V_ONE]: 1,
  [GameModes.TWO_V_TWO]: 2,
  [GameModes.THREE_V_THREE]: 3,
  [GameModes.FIVE_V_FIVE]: 5,
  [GameModes.SEVEN_V_SEVEN]: 7,
};

const pool = new Pool({ connectionString: `${process.env.DATABASE_URL}` });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/** Offset of Europe/Paris from UTC at the given instant, in minutes (60 or 120). */
function getTimeZoneOffsetMinutes(date: Date): number {
  const local = new Date(date.toLocaleString('en-US', { timeZone: TIME_ZONE }));
  const utc = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  return (local.getTime() - utc.getTime()) / 60_000;
}

/** UTC instant of `hour:minute` in Paris, `dayOffset` days from today (Paris calendar). */
function getParisDate(dayOffset: number, hour: number, minute: number): Date {
  const today = new Date(new Date().toLocaleString('en-US', { timeZone: TIME_ZONE }));
  const guess = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + dayOffset, hour, minute),
  );
  return new Date(guess.getTime() - getTimeZoneOffsetMinutes(guess) * 60_000);
}

async function clean() {
  const sessions = await prisma.sessions.findMany({
    select: { uid: true },
    where: { title: { startsWith: SEED_TITLE_PREFIX } },
  });
  const sessionUids = sessions.map((session) => session.uid);
  const conversations = await prisma.conversations.findMany({
    select: { uid: true },
    where: { sessionUid: { in: sessionUids } },
  });
  const conversationUids = conversations.map((conversation) => conversation.uid);

  await prisma.$transaction([
    prisma.messages.deleteMany({ where: { conversationUid: { in: conversationUids } } }),
    prisma.conversationMembers.deleteMany({ where: { conversationUid: { in: conversationUids } } }),
    prisma.conversations.deleteMany({ where: { uid: { in: conversationUids } } }),
    prisma.sessions.deleteMany({ where: { uid: { in: sessionUids } } }),
  ]);
  console.log(`🧹 ${sessionUids.length} seed sessions deleted`);
}

async function seed() {
  const users = await prisma.users.findMany({
    orderBy: { createdAt: 'asc' },
    select: { uid: true },
    take: 30,
    where: { deletedAt: null, type: UserType.USER },
  });
  if (users.length < 2) {
    throw new Error('At least 2 users are needed (run the local seed first)');
  }
  console.log(`👥 ${users.length} users available as creators and players`);

  let index = 0;
  let created = 0;
  for (const { gameModes, sport } of SPORTS) {
    // Public fields first, any field of the sport otherwise (no public padel field locally)
    const fields = await prisma.fields.findMany({
      orderBy: { type: 'asc' },
      select: { uid: true },
      take: 5,
      where: { fieldSports: { some: { sport } } },
    });
    if (fields.length === 0) {
      console.log(`⚠️  No field for ${sport}, skipped`);
      continue;
    }

    for (let dayOffset = 1; dayOffset <= DAYS; dayOffset++) {
      for (const { hour, minute } of START_TIMES) {
        index++;
        const gameMode = gameModes[index % gameModes.length];
        const maxPlayersPerTeam = PLAYERS_PER_TEAM[gameMode] ?? 1;
        const capacity = Math.min(maxPlayersPerTeam * 2, users.length);
        // Every 7th session is full, every 9th is private: both must be excluded by the route
        const isFull = index % 7 === 0;
        const isPrivate = index % 9 === 0;
        const numberOfPlayers = isFull ? capacity : 1 + (index % Math.max(capacity - 1, 1));
        const creator = users[index % users.length];
        const players = [
          creator,
          ...users.filter((user) => user.uid !== creator.uid).slice(0, numberOfPlayers - 1),
        ];

        const startDate = getParisDate(dayOffset, hour, minute);
        const endDate = new Date(startDate.getTime() + DURATION_MINUTES * 60_000);

        const session = await prisma.sessions.create({
          data: {
            creatorUid: creator.uid,
            description: 'Temporary session for the recommendations tests',
            endDate,
            fieldUid: fields[index % fields.length].uid,
            gameMode,
            level: LEVELS[index % LEVELS.length],
            maxPlayersPerTeam,
            minPlayersPerTeam: 1,
            sessionTeams: {
              create: [
                { teamLabel: TeamLabels.A, teamName: 'Team A' },
                { teamLabel: TeamLabels.B, teamName: 'Team B' },
              ],
            },
            sport,
            startDate,
            teamsPerGame: 2,
            title: `${SEED_TITLE_PREFIX} ${sport} ${gameMode}`,
            visibility: isPrivate ? SessionVisibility.PRIVATE : SessionVisibility.PUBLIC,
          },
          select: { sessionTeams: { select: { teamLabel: true, uid: true } }, uid: true },
        });

        const teamA = session.sessionTeams.find((team) => team.teamLabel === TeamLabels.A);
        const teamB = session.sessionTeams.find((team) => team.teamLabel === TeamLabels.B);
        if (!teamA || !teamB) throw new Error(`Teams missing for session ${session.uid}`);

        await prisma.sessionPlayers.createMany({
          data: players.map((player, playerIndex) => ({
            sessionUid: session.uid,
            teamUid: playerIndex % 2 === 0 ? teamA.uid : teamB.uid,
            userUid: player.uid,
          })),
        });

        await prisma.conversations.create({
          data: {
            conversationMembers: {
              create: players.map((player) => ({
                isAdmin: player.uid === creator.uid,
                userUid: player.uid,
              })),
            },
            name: `Session ${sport}`,
            sessionUid: session.uid,
            type: ConversationType.SESSION,
          },
        });
        created++;
      }
    }
    console.log(`✅ ${sport}: ${DAYS * START_TIMES.length} sessions`);
  }
  console.log(`🎉 ${created} seed sessions created (1/7 full, 1/9 private, levels 0-3)`);
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('The recommended sessions seed must not run in production');
  }
  const isClean = process.argv.includes('--clean');
  try {
    await clean();
    if (!isClean) await seed();
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
