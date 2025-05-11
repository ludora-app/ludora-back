import { PrismaClient, Game_modes, Day_of_week } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @description Seeds the infrastructure & sessions schema
 */
async function seed() {
  //***************** */
  //** INFRASTRUCTURE */
  //***************** */
  const sports = [
    { name: 'FOOTBALL' },
    { name: 'BASKETBALL' },
    { name: 'TENNIS' },
    { name: 'VOLLEYBALL' },
    { name: 'PADDEL' },
    { name: 'BADMINTON' },
    { name: 'PING-PONG' },
  ];

  const createdSports: { id: string; name: string }[] = [];
  for (const sport of sports) {
    const createdSport = await prisma.sports.create({
      data: sport,
    });
    createdSports.push(createdSport);
  }

  const partners = [
    {
      name: 'HOOPSFACTORY',
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      latitude: 48.9047454,
      longitude: 2.3789354,
      phone: '01 72 59 88 99',
      email: 'contact@hoopsfactory.fr',
    },
    {
      name: 'The One Ball',
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      latitude: 48.8499,
      longitude: 2.5667,
      phone: '01 85 78 44 44',
      email: 'contact@theoneball.fr',
    },
    {
      name: 'Stadium Thias Orly',
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      phone: '01 46 87 64 24',
      email: 'stadium.thiais@gmail.com',
    },
    {
      name: 'Forrest Hill la Défense',
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.892,
      longitude: 2.236,
      phone: '01 47 24 67 67',
      email: 'contact@forest-hill.com',
    },
  ];

  const createdPartners: { id: string; name: string }[] = [];
  for (const p of partners) {
    const createdPartner = await prisma.partners.create({
      data: p,
    });
    console.log(`Partner ${createdPartner.name} has been created`);
    createdPartners.push(createdPartner);
  }

  const partner_sport = [
    {
      partner_id: createdPartners[0].id,
      sport: createdSports[1].name,
    },
    {
      partner_id: createdPartners[1].id,
      sport: createdSports[1].name,
    },
    {
      partner_id: createdPartners[2].id,
      sport: createdSports[0].name,
    },
    {
      partner_id: createdPartners[2].id,
      sport: createdSports[1].name,
    },
    {
      partner_id: createdPartners[2].id,
      sport: createdSports[4].name,
    },
    {
      partner_id: createdPartners[2].id,
      sport: createdSports[5].name,
    },
    {
      partner_id: createdPartners[2].id,
      sport: createdSports[6].name,
    },
    {
      partner_id: createdPartners[3].id,
      sport: createdSports[2].name,
    },
    {
      partner_id: createdPartners[3].id,
      sport: createdSports[3].name,
    },
    {
      partner_id: createdPartners[3].id,
      sport: createdSports[4].name,
    },
    {
      partner_id: createdPartners[3].id,
      sport: createdSports[5].name,
    },
    {
      partner_id: createdPartners[3].id,
      sport: createdSports[6].name,
    },
  ];

  for (const relation of partner_sport) {
    await prisma.partner_sports.create({
      data: relation,
    });
  }
  console.log('Partner sports relations populated');

  const fields = [
    // ? HOOPFACTORY
    {
      partner_id: createdPartners[0].id,
      sport: createdSports[1].name,
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      latitude: 48.9047454,
      longitude: 2.3789354,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[0].id,
      sport: createdSports[1].name,
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      latitude: 48.9047454,
      longitude: 2.3789354,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[0].id,
      sport: createdSports[1].name,
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      latitude: 48.9047454,
      longitude: 2.3789354,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[0].id,
      sport: createdSports[1].name,
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      latitude: 48.9047454,
      longitude: 2.3789354,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[0].id,
      sport: createdSports[1].name,
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      latitude: 48.9047454,
      longitude: 2.3789354,
      game_mode: 'THREE_V_THREE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[0].id,
      sport: createdSports[1].name,
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      latitude: 48.9047454,
      longitude: 2.3789354,
      game_mode: 'THREE_V_THREE',
      entry_fee: 0,
    },
    // ? THE ONE BALL
    {
      partner_id: createdPartners[1].id,
      sport: createdSports[1].name,
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      latitude: 48.8499,
      longitude: 2.5667,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[1].id,
      sport: createdSports[1].name,
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      latitude: 48.8499,
      longitude: 2.5667,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[1].id,
      sport: createdSports[1].name,
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      latitude: 48.8499,
      longitude: 2.5667,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[1].id,
      sport: createdSports[1].name,
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      latitude: 48.8499,
      longitude: 2.5667,
      game_mode: 'THREE_V_THREE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[1].id,
      sport: createdSports[1].name,
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      latitude: 48.8499,
      longitude: 2.5667,
      game_mode: 'THREE_V_THREE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[1].id,
      sport: createdSports[1].name,
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      latitude: 48.8499,
      longitude: 2.5667,
      game_mode: 'THREE_V_THREE',
      entry_fee: 0,
    },
    // ? STADIUM THIAS ORLY
    {
      partner_id: createdPartners[2].id,
      sport: createdSports[1].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[2].id,
      sport: createdSports[1].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[2].id,
      sport: createdSports[1].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[2].id,
      sport: createdSports[4].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[2].id,
      sport: createdSports[4].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[2].id,
      sport: createdSports[4].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[2].id,
      sport: createdSports[4].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[2].id,
      sport: createdSports[4].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    // here
    {
      partner_id: createdPartners[2].id,
      sport: createdSports[0].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[2].id,
      sport: createdSports[0].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[2].id,
      sport: createdSports[0].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[3].id,
      sport: createdSports[4].name,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.892,
      longitude: 2.236,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[3].id,
      sport: createdSports[4].name,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.892,
      longitude: 2.236,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[3].id,
      sport: createdSports[4].name,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.892,
      longitude: 2.236,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[3].id,
      sport: createdSports[2].name,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.892,
      longitude: 2.236,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[3].id,
      sport: createdSports[2].name,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.892,
      longitude: 2.236,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[3].id,
      sport: createdSports[5].name,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.892,
      longitude: 2.236,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[3].id,
      sport: createdSports[5].name,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.892,
      longitude: 2.236,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
  ];

  const createdFields: { id: string; sport: string; partner_id: string; game_mode: string }[] = [];
  for (const field of fields) {
    const createdField = await prisma.fields.create({
      data: {
        partner: { connect: { id: field.partner_id } },
        sport_relation: { connect: { name: field.sport } },
        address: field.address,
        latitude: field.latitude,
        longitude: field.longitude,
        game_mode: field.game_mode as Game_modes,
        entry_fee: field.entry_fee,
      },
    });
    console.log(`Field ${createdField.id} has been created`);
    createdFields.push(createdField);
  }

  const partners_openingHours = [
    // ? HOOPFACTORY
    {
      partner_id: createdPartners[0].id,
      day_of_week: Day_of_week.MONDAY,
      opening_time: '10:00',
      closing_time: '12:00',
    },
    {
      partner_id: createdPartners[0].id,
      day_of_week: Day_of_week.TUESDAY,
      opening_time: '10:00',
      closing_time: '12:00',
    },
    {
      partner_id: createdPartners[0].id,
      day_of_week: Day_of_week.WEDNESDAY,
      opening_time: '10:00',
      closing_time: '12:00',
    },
    {
      partner_id: createdPartners[0].id,
      day_of_week: Day_of_week.THURSDAY,
      opening_time: '10:00',
      closing_time: '12:00',
    },
    {
      partner_id: createdPartners[0].id,
      day_of_week: Day_of_week.FRIDAY,
      opening_time: '10:00',
      closing_time: '12:00',
    },
    {
      partner_id: createdPartners[0].id,
      day_of_week: Day_of_week.SATURDAY,
      opening_time: '10:00',
      closing_time: '22:00',
    },
    {
      partner_id: createdPartners[0].id,
      day_of_week: Day_of_week.SUNDAY,
      opening_time: '10:00',
      closing_time: '22:00',
    },
    // ? THE ONE BALL
    {
      partner_id: createdPartners[1].id,
      day_of_week: Day_of_week.MONDAY,
      opening_time: '11:00',
      closing_time: '23:00',
    },
    {
      partner_id: createdPartners[1].id,
      day_of_week: Day_of_week.TUESDAY,
      opening_time: '11:00',
      closing_time: '23:00',
    },
    {
      partner_id: createdPartners[1].id,
      day_of_week: Day_of_week.WEDNESDAY,
      opening_time: '11:00',
      closing_time: '23:00',
    },
    {
      partner_id: createdPartners[1].id,
      day_of_week: Day_of_week.THURSDAY,
      opening_time: '11:00',
      closing_time: '23:00',
    },
    {
      partner_id: createdPartners[1].id,
      day_of_week: Day_of_week.FRIDAY,
      opening_time: '11:00',
      closing_time: '23:00',
    },
    {
      partner_id: createdPartners[1].id,
      day_of_week: Day_of_week.SATURDAY,
      opening_time: '09:00',
      closing_time: '20:00',
    },
    {
      partner_id: createdPartners[1].id,
      day_of_week: Day_of_week.SUNDAY,
      opening_time: '09:00',
      closing_time: '23:00',
    },
    // ? STADIUM THIAS ORLY
    {
      partner_id: createdPartners[2].id,
      day_of_week: Day_of_week.MONDAY,
      opening_time: '10:00',
      closing_time: '22:00',
    },
    {
      partner_id: createdPartners[2].id,
      day_of_week: Day_of_week.TUESDAY,
      opening_time: '10:00',
      closing_time: '22:00',
    },
    {
      partner_id: createdPartners[2].id,
      day_of_week: Day_of_week.WEDNESDAY,
      opening_time: '10:00',
      closing_time: '22:00',
    },
    {
      partner_id: createdPartners[2].id,
      day_of_week: Day_of_week.THURSDAY,
      opening_time: '10:00',
      closing_time: '22:00',
    },

    {
      partner_id: createdPartners[2].id,
      day_of_week: Day_of_week.FRIDAY,
      opening_time: '10:00',
      closing_time: '22:00',
    },
    {
      partner_id: createdPartners[2].id,
      day_of_week: Day_of_week.SATURDAY,
      opening_time: '10:00',
      closing_time: '22:00',
    },
    {
      partner_id: createdPartners[2].id,
      day_of_week: Day_of_week.SUNDAY,
      opening_time: '10:00',
      closing_time: '22:00',
    },
    // ? FOREST HILL LA DEFENSE
    {
      partner_id: createdPartners[3].id,
      day_of_week: Day_of_week.MONDAY,
      opening_time: '07:00',
      closing_time: '23:00',
    },
    {
      partner_id: createdPartners[3].id,
      day_of_week: Day_of_week.TUESDAY,
      opening_time: '07:00',
      closing_time: '23:00',
    },
    {
      partner_id: createdPartners[3].id,
      day_of_week: Day_of_week.WEDNESDAY,
      opening_time: '07:00',
      closing_time: '23:00',
    },
    {
      partner_id: createdPartners[3].id,
      day_of_week: Day_of_week.THURSDAY,
      opening_time: '07:00',
      closing_time: '23:00',
    },
    {
      partner_id: createdPartners[3].id,
      day_of_week: Day_of_week.FRIDAY,
      opening_time: '07:00',
      closing_time: '23:00',
    },
    {
      partner_id: createdPartners[3].id,
      day_of_week: Day_of_week.SATURDAY,
      opening_time: '07:00',
      closing_time: '22:00',
    },
    {
      partner_id: createdPartners[3].id,
      day_of_week: Day_of_week.SUNDAY,
      opening_time: '07:00',
      closing_time: '22:00',
    },
  ];

  for (const hours of partners_openingHours) {
    await prisma.partner_opening_hours.create({
      data: {
        partner: { connect: { id: hours.partner_id } },
        day_of_week: hours.day_of_week,
        open_time: hours.opening_time,
        close_time: hours.closing_time,
      },
    });
  }
  console.log('Opening hours populated');
  //***************** */
  //****** USERS ******/
  //***************** */

  //***************** */
  //***** SESSIONS ****/
  //***************** */
  const sessions = [
    {
      field_id: createdFields[21].id,
      start_date: new Date('2025-01-01T10:00:00'),
      end_date: new Date('2025-01-01T11:00:00'),
      sport: createdSports[0].name,
      game_mode: Game_modes.FIVE_V_FIVE,
    },
    {
      field_id: createdFields[1].id,
      start_date: new Date('2025-01-02T11:00:00'),
      end_date: new Date('2025-01-02T13:00:00'),
      sport: createdSports[1].name,
      game_mode: Game_modes.THREE_V_THREE,
    },
    {
      field_id: createdFields[2].id,
      start_date: new Date('2025-01-03T14:00:00'),
      end_date: new Date('2025-01-03T15:00:00'),
      sport: createdSports[2].name,
      game_mode: Game_modes.TWO_V_TWO,
    },
    {
      field_id: createdFields[3].id,
      start_date: new Date('2025-01-04T15:00:00'),
      end_date: new Date('2025-01-04T17:00:00'),
      sport: createdSports[3].name,
      game_mode: Game_modes.FOUR_V_FOUR,
    },
    {
      field_id: createdFields[4].id,
      start_date: new Date('2025-01-05T16:00:00'),
      end_date: new Date('2025-01-05T18:00:00'),
      sport: createdSports[4].name,
      game_mode: Game_modes.FOUR_V_FOUR,
    },
    {
      field_id: createdFields[5].id,
      start_date: new Date('2025-01-06T10:00:00'),
      end_date: new Date('2025-01-06T12:00:00'),
      sport: createdSports[5].name,
      game_mode: Game_modes.TWO_V_TWO,
    },
    {
      field_id: createdFields[6].id,
      start_date: new Date('2025-01-07T13:00:00'),
      end_date: new Date('2025-01-07T14:00:00'),
      sport: createdSports[6].name,
      game_mode: Game_modes.TWO_V_TWO,
    },
    {
      field_id: createdFields[0].id,
      start_date: new Date('2025-12-01T11:00:00'),
      end_date: new Date('2025-12-01T12:00:00'),
      sport: createdSports[0].name,
      game_mode: Game_modes.ELEVEN_V_ELEVEN,
    },
    {
      field_id: createdFields[1].id,
      start_date: new Date('2025-12-02T14:00:00'),
      end_date: new Date('2025-12-02T15:00:00'),
      sport: createdSports[1].name,
      game_mode: Game_modes.FIVE_V_FIVE,
    },
    {
      field_id: createdFields[2].id,
      start_date: new Date('2025-12-03T17:00:00'),
      end_date: new Date('2025-12-03T18:00:00'),
      sport: createdSports[2].name,
      game_mode: Game_modes.TWO_V_TWO,
    },
  ];

  const createdSessions = [];
  for (const session of sessions) {
    const createdSession = await prisma.sessions.create({
      data: {
        field_id: session.field_id,
        sport: session.sport,
        game_mode: session.game_mode,
        start_date: session.start_date,
        end_date: session.end_date,
        title: `Session ${createdSessions.length + 1}`,
        max_players_per_team: 5,
        max_teams_per_game: 2,
        min_players_per_team: 3,
        min_teams_per_game: 2,
        description: 'Test session',
      },
    });
    createdSessions.push(createdSession);
  }
  console.log('Sessions populated');
  //***************** */
  //** CONVERSATIONS */
  //***************** */
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
