import { Game_modes, PrismaClient, Sex } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

/**
 * @description Seeds the infrastructure & sessions schema
 */
async function seed() {
  const sports = [
    { name: 'FOOTBALL' },
    { name: 'BASKETBALL' },
    { name: 'TENNIS' },
    { name: 'VOLLEYBALL' },
    { name: 'PADDEL' },
    { name: 'BADMINTON' },
    { name: 'PING-PONG' },
  ];

  const createdSports: { uid: string; name: string }[] = [];
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

  const createdPartners: { uid: string; name: string }[] = [];
  for (const p of partners) {
    const createdPartner = await prisma.partners.create({
      data: p,
    });
    console.log(`Partner ${createdPartner.name} has been created`);
    createdPartners.push(createdPartner);
  }

  const partner_sport = [
    {
      partnerUid: createdPartners[0].uid,
      sport: createdSports[1].name,
    },
    {
      partnerUid: createdPartners[1].uid,
      sport: createdSports[1].name,
    },
    {
      partnerUid: createdPartners[2].uid,
      sport: createdSports[0].name,
    },
    {
      partnerUid: createdPartners[2].uid,
      sport: createdSports[1].name,
    },
    {
      partnerUid: createdPartners[2].uid,
      sport: createdSports[4].name,
    },
    {
      partnerUid: createdPartners[2].uid,
      sport: createdSports[5].name,
    },
    {
      partnerUid: createdPartners[2].uid,
      sport: createdSports[6].name,
    },
    {
      partnerUid: createdPartners[3].uid,
      sport: createdSports[2].name,
    },
    {
      partnerUid: createdPartners[3].uid,
      sport: createdSports[3].name,
    },
    {
      partnerUid: createdPartners[3].uid,
      sport: createdSports[4].name,
    },
    {
      partnerUid: createdPartners[3].uid,
      sport: createdSports[5].name,
    },
    {
      partnerUid: createdPartners[3].uid,
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
      partnerUid: createdPartners[0].uid,
      sport: createdSports[1].name,
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      latitude: 48.9047454,
      longitude: 2.3789354,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
    },
    {
      partnerUid: createdPartners[0].uid,
      sport: createdSports[1].name,
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      latitude: 48.9047454,
      longitude: 2.3789354,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
    },
    {
      partnerUid: createdPartners[0].uid,
      sport: createdSports[1].name,
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      latitude: 48.9047454,
      longitude: 2.3789354,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
    },
    {
      partnerUid: createdPartners[0].uid,
      sport: createdSports[1].name,
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      latitude: 48.9047454,
      longitude: 2.3789354,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
    },
    {
      partnerUid: createdPartners[0].uid,
      sport: createdSports[1].name,
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      latitude: 48.9047454,
      longitude: 2.3789354,
      gameMode: 'THREE_V_THREE',
      entryFee: 0,
    },
    {
      partnerUid: createdPartners[0].uid,
      sport: createdSports[1].name,
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      latitude: 48.9047454,
      longitude: 2.3789354,
      gameMode: 'THREE_V_THREE',
      entryFee: 0,
    },
    // ? THE ONE BALL
    {
      partnerUid: createdPartners[1].uid,
      sport: createdSports[1].name,
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      latitude: 48.8499,
      longitude: 2.5667,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
    },
    {
      partnerUid: createdPartners[1].uid,
      sport: createdSports[1].name,
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      latitude: 48.8499,
      longitude: 2.5667,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
    },
    {
      partnerUid: createdPartners[1].uid,
      sport: createdSports[1].name,
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      latitude: 48.8499,
      longitude: 2.5667,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
    },
    {
      partnerUid: createdPartners[1].uid,
      sport: createdSports[1].name,
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      latitude: 48.8499,
      longitude: 2.5667,
      gameMode: 'THREE_V_THREE',
      entryFee: 0,
    },
    {
      partnerUid: createdPartners[1].uid,
      sport: createdSports[1].name,
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      latitude: 48.8499,
      longitude: 2.5667,
      gameMode: 'THREE_V_THREE',
      entryFee: 0,
    },
    {
      partnerUid: createdPartners[1].uid,
      sport: createdSports[1].name,
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      latitude: 48.8499,
      longitude: 2.5667,
      gameMode: 'THREE_V_THREE',
      entryFee: 0,
    },
    // ? STADIUM THIAS ORLY
    {
      partnerUid: createdPartners[2].uid,
      sport: createdSports[1].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
    },
    {
      partnerUid: createdPartners[2].uid,
      sport: createdSports[1].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
    },
    {
      partnerUid: createdPartners[2].uid,
      sport: createdSports[1].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
    },
    {
      partnerUid: createdPartners[2].uid,
      sport: createdSports[4].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
    },
    {
      partnerUid: createdPartners[2].uid,
      sport: createdSports[4].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
    },
    {
      partnerUid: createdPartners[2].uid,
      sport: createdSports[4].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
    },
    {
      partnerUid: createdPartners[2].uid,
      sport: createdSports[4].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
    },
    {
      partnerUid: createdPartners[2].uid,
      sport: createdSports[4].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
    },
    // here
    {
      partnerUid: createdPartners[2].uid,
      sport: createdSports[0].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
    },
    {
      partnerUid: createdPartners[2].uid,
      sport: createdSports[0].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
    },
    {
      partnerUid: createdPartners[2].uid,
      sport: createdSports[0].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
    },
    {
      partnerUid: createdPartners[3].uid,
      sport: createdSports[4].name,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.892,
      longitude: 2.236,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
    },
    {
      partnerUid: createdPartners[3].uid,
      sport: createdSports[4].name,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.892,
      longitude: 2.236,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
    },
    {
      partnerUid: createdPartners[3].uid,
      sport: createdSports[4].name,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.892,
      longitude: 2.236,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
    },
    {
      partnerUid: createdPartners[3].uid,
      sport: createdSports[2].name,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.892,
      longitude: 2.236,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
    },
    {
      partnerUid: createdPartners[3].uid,
      sport: createdSports[2].name,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.892,
      longitude: 2.236,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
    },
    {
      partnerUid: createdPartners[3].uid,
      sport: createdSports[5].name,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.892,
      longitude: 2.236,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
    },
    {
      partnerUid: createdPartners[3].uid,
      sport: createdSports[5].name,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.892,
      longitude: 2.236,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
    },
  ];

  const createdFields: { uid: string; sport: string; partnerUid: string; gameMode: string }[] = [];
  for (const field of fields) {
    const createdField = await prisma.fields.create({
      data: {
        partner: { connect: { uid: field.partnerUid } },
        sport_relation: { connect: { name: field.sport } },
        address: field.address,
        latitude: field.latitude,
        longitude: field.longitude,
        gameMode: field.gameMode as Game_modes,
        entryFee: field.entryFee,
      },
    });
    console.log(`Field ${createdField.uid} has been created`);
    createdFields.push(createdField);
  }

  const partners_openingHours = [
    // ? HOOPFACTORY
    {
      partnerUid: createdPartners[0].uid,
      dayOfWeek: 1,
      opening_time: '10:00',
      closing_time: '12:00',
    },
    {
      partnerUid: createdPartners[0].uid,
      dayOfWeek: 2,
      opening_time: '10:00',
      closing_time: '12:00',
    },
    {
      partnerUid: createdPartners[0].uid,
      dayOfWeek: 3,
      opening_time: '10:00',
      closing_time: '12:00',
    },
    {
      partnerUid: createdPartners[0].uid,
      dayOfWeek: 4,
      opening_time: '10:00',
      closing_time: '12:00',
    },
    {
      partnerUid: createdPartners[0].uid,
      dayOfWeek: 5,
      opening_time: '10:00',
      closing_time: '12:00',
    },
    {
      partnerUid: createdPartners[0].uid,
      dayOfWeek: 6,
      opening_time: '10:00',
      closing_time: '22:00',
    },
    {
      partnerUid: createdPartners[0].uid,
      dayOfWeek: 0,
      opening_time: '10:00',
      closing_time: '22:00',
    },
    // ? THE ONE BALL
    {
      partnerUid: createdPartners[1].uid,
      dayOfWeek: 1,
      opening_time: '11:00',
      closing_time: '23:00',
    },
    {
      partnerUid: createdPartners[1].uid,
      dayOfWeek: 2,
      opening_time: '11:00',
      closing_time: '23:00',
    },
    {
      partnerUid: createdPartners[1].uid,
      dayOfWeek: 3,
      opening_time: '11:00',
      closing_time: '23:00',
    },
    {
      partnerUid: createdPartners[1].uid,
      dayOfWeek: 4,
      opening_time: '11:00',
      closing_time: '23:00',
    },
    {
      partnerUid: createdPartners[1].uid,
      dayOfWeek: 5,
      opening_time: '11:00',
      closing_time: '23:00',
    },
    {
      partnerUid: createdPartners[1].uid,
      dayOfWeek: 6,
      opening_time: '09:00',
      closing_time: '20:00',
    },
    {
      partnerUid: createdPartners[1].uid,
      dayOfWeek: 0,
      opening_time: '09:00',
      closing_time: '23:00',
    },
    // ? STADIUM THIAS ORLY
    {
      partnerUid: createdPartners[2].uid,
      dayOfWeek: 1,
      opening_time: '10:00',
      closing_time: '22:00',
    },
    {
      partnerUid: createdPartners[2].uid,
      dayOfWeek: 2,
      opening_time: '10:00',
      closing_time: '22:00',
    },
    {
      partnerUid: createdPartners[2].uid,
      dayOfWeek: 3,
      opening_time: '10:00',
      closing_time: '22:00',
    },
    {
      partnerUid: createdPartners[2].uid,
      dayOfWeek: 4,
      opening_time: '10:00',
      closing_time: '22:00',
    },

    {
      partnerUid: createdPartners[2].uid,
      dayOfWeek: 5,
      opening_time: '10:00',
      closing_time: '22:00',
    },
    {
      partnerUid: createdPartners[2].uid,
      dayOfWeek: 6,
      opening_time: '10:00',
      closing_time: '22:00',
    },
    {
      partnerUid: createdPartners[2].uid,
      dayOfWeek: 0,
      opening_time: '10:00',
      closing_time: '22:00',
    },
    // ? FOREST HILL LA DEFENSE
    {
      partnerUid: createdPartners[3].uid,
      dayOfWeek: 1,
      opening_time: '07:00',
      closing_time: '23:00',
    },
    {
      partnerUid: createdPartners[3].uid,
      dayOfWeek: 2,
      opening_time: '07:00',
      closing_time: '23:00',
    },
    {
      partnerUid: createdPartners[3].uid,
      dayOfWeek: 3,
      opening_time: '07:00',
      closing_time: '23:00',
    },
    {
      partnerUid: createdPartners[3].uid,
      dayOfWeek: 4,
      opening_time: '07:00',
      closing_time: '23:00',
    },
    {
      partnerUid: createdPartners[3].uid,
      dayOfWeek: 5,
      opening_time: '07:00',
      closing_time: '23:00',
    },
    {
      partnerUid: createdPartners[3].uid,
      dayOfWeek: 6,
      opening_time: '07:00',
      closing_time: '22:00',
    },
    {
      partnerUid: createdPartners[3].uid,
      dayOfWeek: 0,
      opening_time: '07:00',
      closing_time: '22:00',
    },
  ];

  for (const hours of partners_openingHours) {
    await prisma.partner_opening_hours.create({
      data: {
        partner: { connect: { uid: hours.partnerUid } },
        dayOfWeek: hours.dayOfWeek,
        openTime: hours.opening_time,
        closeTime: hours.closing_time,
      },
    });
  }
  console.log('Opening hours populated');

  const sessions = [
    {
      fieldUid: createdFields[21].uid,
      startDate: new Date('2025-01-01T10:00:00'),
      endDate: new Date('2025-01-01T11:00:00'),
      sport: createdSports[0].name,
      gameMode: Game_modes.FIVE_V_FIVE,
    },
    {
      fieldUid: createdFields[1].uid,
      startDate: new Date('2025-01-02T11:00:00'),
      endDate: new Date('2025-01-02T13:00:00'),
      sport: createdSports[1].name,
      gameMode: Game_modes.THREE_V_THREE,
    },
    {
      fieldUid: createdFields[2].uid,
      startDate: new Date('2025-01-03T14:00:00'),
      endDate: new Date('2025-01-03T15:00:00'),
      sport: createdSports[2].name,
      gameMode: Game_modes.TWO_V_TWO,
    },
    {
      fieldUid: createdFields[3].uid,
      startDate: new Date('2025-01-04T15:00:00'),
      endDate: new Date('2025-01-04T17:00:00'),
      sport: createdSports[3].name,
      gameMode: Game_modes.FOUR_V_FOUR,
    },
    {
      fieldUid: createdFields[4].uid,
      startDate: new Date('2025-01-05T16:00:00'),
      endDate: new Date('2025-01-05T18:00:00'),
      sport: createdSports[4].name,
      gameMode: Game_modes.FOUR_V_FOUR,
    },
    {
      fieldUid: createdFields[5].uid,
      startDate: new Date('2025-01-06T10:00:00'),
      endDate: new Date('2025-01-06T12:00:00'),
      sport: createdSports[5].name,
      gameMode: Game_modes.TWO_V_TWO,
    },
    {
      fieldUid: createdFields[6].uid,
      startDate: new Date('2025-01-07T13:00:00'),
      endDate: new Date('2025-01-07T14:00:00'),
      sport: createdSports[6].name,
      gameMode: Game_modes.TWO_V_TWO,
    },
    {
      fieldUid: createdFields[0].uid,
      startDate: new Date('2025-12-01T11:00:00'),
      endDate: new Date('2025-12-01T12:00:00'),
      sport: createdSports[0].name,
      gameMode: Game_modes.ELEVEN_V_ELEVEN,
    },
    {
      fieldUid: createdFields[1].uid,
      startDate: new Date('2025-12-02T14:00:00'),
      endDate: new Date('2025-12-02T15:00:00'),
      sport: createdSports[1].name,
      gameMode: Game_modes.FIVE_V_FIVE,
    },
    {
      fieldUid: createdFields[2].uid,
      startDate: new Date('2025-12-03T17:00:00'),
      endDate: new Date('2025-12-03T18:00:00'),
      sport: createdSports[2].name,
      gameMode: Game_modes.TWO_V_TWO,
    },
  ];

  const createdSessions = [];
  for (const session of sessions) {
    const createdSession = await prisma.sessions.create({
      data: {
        fieldUid: session.fieldUid,
        sport: session.sport,
        gameMode: session.gameMode,
        startDate: session.startDate,
        endDate: session.endDate,
        title: `Session ${createdSessions.length + 1}`,
        maxPlayersPerTeam: 5,
        minPlayersPerTeam: 3,
        teamsPerGame: 2,
        description: 'Test session',
      },
    });
    createdSessions.push(createdSession);
  }
  console.log('Sessions populated');

  const users = [
    {
      email: 'seto.kaiba@hotmail.fr',
      password: await hashPassword('Seto398!'),
      firstname: 'Seto',
      lastname: 'Kaiba',
      birthdate: new Date('1998-01-31T00:00:00Z'),
      sex: Sex.MALE,
      bio: 'AAAAAAAAAAAAAAAAAAAAAAAA',
      phone: '+33609032663',
      imageUrl: '1738433236109explore2.png',
    },
    {
      email: 'yugi.muto@hotmail.fr',
      password: await hashPassword('Yugi398!'),
      firstname: 'Yugi',
      lastname: 'Muto',
      birthdate: new Date('1999-06-04T00:00:00Z'),
      sex: Sex.MALE,
      bio: 'Le roi des duels',
      phone: '+33609032664',
      imageUrl: '1738433236109explore2.png',
    },
    {
      email: 'joey.wheeler@hotmail.fr',
      password: await hashPassword('Joey398!'),
      firstname: 'Joey',
      lastname: 'Wheeler',
      birthdate: new Date('1999-01-25T00:00:00Z'),
      sex: Sex.MALE,
      bio: 'Duelliste passionné',
      phone: '+33609032665',
      imageUrl: '1738433236109explore2.png',
    },
    {
      email: 'marik.ishtar@hotmail.fr',
      password: await hashPassword('Marik398!'),
      firstname: 'Marik',
      lastname: 'Ishtar',
      birthdate: new Date('1999-01-25T00:00:00Z'),
      sex: Sex.MALE,
      bio: 'Protecteur du pharaon',
      phone: '+33609032658',
      imageUrl: '1738433236109explore2.png',
    },
    {
      email: 'yuji.itadori@hotmail.fr',
      password: await hashPassword('Yuji398!'),
      firstname: 'Yuji',
      lastname: 'Itadori',
      birthdate: new Date('2001-03-20T00:00:00Z'),
      sex: Sex.MALE,
      bio: 'Exorciste à la force surhumaine et hôte de Sukuna',
      phone: '+33609032663',
      imageUrl: '1738433236109explore2.png',
    },
    {
      email: 'megumi.fushiguro@hotmail.fr',
      password: await hashPassword('Megumi398!'),
      firstname: 'Megumi',
      lastname: 'Fushiguro',
      birthdate: new Date('2001-07-22T00:00:00Z'),
      sex: Sex.MALE,
      bio: 'Maître des shikigamis et élève de l’école d’exorcisme',
      phone: '+33609032664',
      imageUrl: '1738433236109explore2.png',
    },
    {
      email: 'nobara.kugisaki@hotmail.fr',
      password: await hashPassword('Nobara398!'),
      firstname: 'Nobara',
      lastname: 'Kugisaki',
      birthdate: new Date('2001-08-07T00:00:00Z'),
      sex: Sex.FEMALE,
      bio: 'Exorciste au caractère explosif et style de combat unique',
      phone: '+33609032665',
      imageUrl: '1738433236109explore2.png',
    },
    {
      email: 'satoru.gojo@hotmail.fr',
      password: await hashPassword('Gojo398!'),
      firstname: 'Satoru',
      lastname: 'Gojo',
      birthdate: new Date('1989-12-07T00:00:00Z'),
      sex: Sex.MALE,
      bio: 'L’exorciste le plus puissant avec les Six Yeux',
      phone: '+33609032666',
      imageUrl: '1738433236109explore2.png',
    },
    {
      email: 'yuta.okkotsu@hotmail.fr',
      password: await hashPassword('Yuta398!'),
      firstname: 'Yuta',
      lastname: 'Okkotsu',
      birthdate: new Date('2001-04-18T00:00:00Z'),
      sex: Sex.MALE,
      bio: 'Exorciste de classe spéciale lié à Rika Orimoto',
      phone: '+33609032667',
      imageUrl: '1738433236109explore2.png',
    },
    {
      email: 'eren.yeager@hotmail.fr',
      password: await hashPassword('Eren398!'),
      firstname: 'Eren',
      lastname: 'Yeager',
      birthdate: new Date('2003-03-30T00:00:00Z'),
      sex: Sex.MALE,
      bio: 'Ancien héros devenu une légende sombre',
      phone: '+33609032668',
      imageUrl: '1738433236109explore2.png',
    },
    {
      email: 'tanjiro.kamado@hotmail.fr',
      password: await hashPassword('Tanjiro398!'),
      firstname: 'Tanjiro',
      lastname: 'Kamado',
      birthdate: new Date('2002-07-14T00:00:00Z'),
      sex: Sex.MALE,
      bio: 'Pourfendeur de démons au cœur pur',
      phone: '+33609032670',
      imageUrl: '1738433236109explore2.png',
    },
    {
      email: 'ryomen.sukuna@hotmail.fr',
      password: await hashPassword('Sukuna398!'),
      firstname: 'Ryomen',
      lastname: 'Sukuna',
      birthdate: new Date('1000-01-01T00:00:00Z'),
      sex: Sex.MALE,
      bio: 'Roi des Fléaux, tyran au sourire glaçant',
      phone: '+33609032660',
      imageUrl: '1738433236109explore2.png',
    },
    {
      email: 'hinata.hyuga@hotmail.fr',
      password: await hashPassword('Hinata398!'),
      firstname: 'Hinata',
      lastname: 'Hyuga',
      birthdate: new Date('1997-12-27T00:00:00Z'),
      sex: Sex.FEMALE,
      bio: 'Princesse du clan Hyuga et experte du Byakugan',
      phone: '+33609032672',
      imageUrl: '1738433236109explore2.png',
    },
    {
      email: 'tsunade.senju@hotmail.fr',
      password: await hashPassword('Tsunade398!'),
      firstname: 'Tsunade',
      lastname: 'Senju',
      birthdate: new Date('1968-08-02T00:00:00Z'),
      sex: Sex.FEMALE,
      bio: 'Sannin légendaire et experte en médecine',
      phone: '+33609032673',
      imageUrl: '1738433236109explore2.png',
    },
    {
      email: 'maki.zenin@hotmail.fr',
      password: await hashPassword('Maki398!'),
      firstname: 'Maki',
      lastname: 'Zenin',
      birthdate: new Date('2001-09-25T00:00:00Z'),
      sex: Sex.FEMALE,
      bio: 'Combattante talentueuse rejetée par le clan Zenin',
      phone: '+33609032671',
      imageUrl: '1738433236109explore2.png',
    },
    {
      email: 'nami.swan@hotmail.fr',
      password: await hashPassword('Nami398!'),
      firstname: 'Nami',
      lastname: 'Swan',
      birthdate: new Date('2001-07-03T00:00:00Z'),
      sex: Sex.FEMALE,
      bio: 'Navigatrice des Pirates au Chapeau de Paille',
      phone: '+33609032666',
      imageUrl: '1738433236109explore2.png',
    },
    {
      email: 'robin.nico@hotmail.fr',
      password: await hashPassword('Robin398!'),
      firstname: 'Robin',
      lastname: 'Nico',
      birthdate: new Date('1998-02-06T00:00:00Z'),
      sex: Sex.FEMALE,
      bio: 'Archéologue des Pirates au Chapeau de Paille',
      phone: '+33609032667',
      imageUrl: '1738433236109explore2.png',
    },
  ];

  const createdUsers: { uid: string }[] = [];
  for (const user of users) {
    const createdUser = await prisma.users.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
    createdUsers.push({ uid: createdUser.uid });
    console.log(`Created user: ${user.email}`);
  }
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
