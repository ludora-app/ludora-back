import { GameModes, PrismaClient, Sex, TeamLabel, UserType } from '../generated/prisma/client';
import * as argon2 from 'argon2';
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = `${process.env.DATABASE_URL}`;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
      latitude: 48.83436030000001,
      longitude: 2.5689833,
      phone: '01 85 78 44 44',
      email: 'contact@theoneball.fr',
    },
    {
      name: 'Stadium Thias Orly',
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.75098440000001,
      longitude: 2.3718412,
      phone: '01 46 87 64 24',
      email: 'stadium.thiais@gmail.com',
    },
    {
      name: 'Forrest Hill la Défense',
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.88837789999999,
      longitude: 2.2083152,
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
    await prisma.partnerSports.create({
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
      isVerified: true,
    },
    {
      partnerUid: createdPartners[0].uid,
      sport: createdSports[1].name,
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      latitude: 48.9047454,
      longitude: 2.3789354,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
      isVerified: true,
    },
    {
      partnerUid: createdPartners[0].uid,
      sport: createdSports[1].name,
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      latitude: 48.9047454,
      longitude: 2.3789354,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
      isVerified: true,
    },
    {
      partnerUid: createdPartners[0].uid,
      sport: createdSports[1].name,
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      latitude: 48.9047454,
      longitude: 2.3789354,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
      isVerified: true,
    },
    {
      partnerUid: createdPartners[0].uid,
      sport: createdSports[1].name,
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      latitude: 48.9047454,
      longitude: 2.3789354,
      gameMode: 'THREE_V_THREE',
      entryFee: 0,
      isVerified: true,
    },
    {
      partnerUid: createdPartners[0].uid,
      sport: createdSports[1].name,
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      latitude: 48.9047454,
      longitude: 2.3789354,
      gameMode: 'THREE_V_THREE',
      entryFee: 0,
      isVerified: true,
    },
    // ? THE ONE BALL
    {
      partnerUid: createdPartners[1].uid,
      sport: createdSports[1].name,
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      latitude: 48.83436030000001,
      longitude: 2.5689833,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
      isVerified: true,
    },
    {
      partnerUid: createdPartners[1].uid,
      sport: createdSports[1].name,
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      latitude: 48.83436030000001,
      longitude: 2.5689833,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
      isVerified: true,
    },
    {
      partnerUid: createdPartners[1].uid,
      sport: createdSports[1].name,
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      latitude: 48.83436030000001,
      longitude: 2.5689833,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
      isVerified: true,
    },
    {
      partnerUid: createdPartners[1].uid,
      sport: createdSports[1].name,
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      latitude: 48.83436030000001,
      longitude: 2.5689833,
      gameMode: 'THREE_V_THREE',
      entryFee: 0,
      isVerified: true,
    },
    {
      partnerUid: createdPartners[1].uid,
      sport: createdSports[1].name,
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      latitude: 48.83436030000001,
      longitude: 2.5689833,
      gameMode: 'THREE_V_THREE',
      entryFee: 0,
      isVerified: true,
    },
    {
      partnerUid: createdPartners[1].uid,
      sport: createdSports[1].name,
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      latitude: 48.83436030000001,
      longitude: 2.5689833,
      gameMode: 'THREE_V_THREE',
      entryFee: 0,
      isVerified: true,
    },
    // ? STADIUM THIAS ORLY
    {
      partnerUid: createdPartners[2].uid,
      sport: createdSports[1].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.75098440000001,
      longitude: 2.3718412,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
      isVerified: true,
    },
    {
      partnerUid: createdPartners[2].uid,
      sport: createdSports[1].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.75098440000001,
      longitude: 2.3718412,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
      isVerified: true,
    },
    {
      partnerUid: createdPartners[2].uid,
      sport: createdSports[1].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.75098440000001,
      longitude: 2.3718412,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
      isVerified: true,
    },
    {
      partnerUid: createdPartners[2].uid,
      sport: createdSports[4].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.75098440000001,
      longitude: 2.3718412,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
      isVerified: true,
    },
    {
      partnerUid: createdPartners[2].uid,
      sport: createdSports[4].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.75098440000001,
      longitude: 2.3718412,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
      isVerified: true,
    },
    {
      partnerUid: createdPartners[2].uid,
      sport: createdSports[4].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.75098440000001,
      longitude: 2.3718412,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
      isVerified: true,
    },
    {
      partnerUid: createdPartners[2].uid,
      sport: createdSports[4].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.75098440000001,
      longitude: 2.3718412,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
      isVerified: true,
    },
    {
      partnerUid: createdPartners[2].uid,
      sport: createdSports[4].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.75098440000001,
      longitude: 2.3718412,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
      isVerified: true,
    },
    // here
    {
      partnerUid: createdPartners[2].uid,
      sport: createdSports[0].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.75098440000001,
      longitude: 2.3718412,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
      isVerified: true,
    },
    {
      partnerUid: createdPartners[2].uid,
      sport: createdSports[0].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.75098440000001,
      longitude: 2.3718412,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
      isVerified: true,
    },
    {
      partnerUid: createdPartners[2].uid,
      sport: createdSports[0].name,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.75098440000001,
      longitude: 2.3718412,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
      isVerified: true,
    },
    {
      partnerUid: createdPartners[3].uid,
      sport: createdSports[4].name,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.88837789999999,
      longitude: 2.2083152,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
      isVerified: true,
    },
    {
      partnerUid: createdPartners[3].uid,
      sport: createdSports[4].name,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.88837789999999,
      longitude: 2.2083152,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
      isVerified: true,
    },
    {
      partnerUid: createdPartners[3].uid,
      sport: createdSports[4].name,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.88837789999999,
      longitude: 2.2083152,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
      isVerified: true,
    },
    {
      partnerUid: createdPartners[3].uid,
      sport: createdSports[2].name,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.88837789999999,
      longitude: 2.2083152,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
      isVerified: true,
    },
    {
      partnerUid: createdPartners[3].uid,
      sport: createdSports[2].name,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.88837789999999,
      longitude: 2.2083152,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
      isVerified: true,
    },
    {
      partnerUid: createdPartners[3].uid,
      sport: createdSports[5].name,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.88837789999999,
      longitude: 2.2083152,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
      isVerified: true,
    },
    {
      partnerUid: createdPartners[3].uid,
      sport: createdSports[5].name,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.88837789999999,
      longitude: 2.2083152,
      gameMode: 'FIVE_V_FIVE',
      entryFee: 0,
      isVerified: true,
    },
  ];

  const createdFields: { uid: string; sport: string; partnerUid: string; gameMode: string }[] = [];
  for (const field of fields) {
    const createdField = await prisma.fields.create({
      data: {
        partner: { connect: { uid: field.partnerUid } },
        sportRelation: { connect: { name: field.sport } },
        address: field.address,
        latitude: field.latitude,
        longitude: field.longitude,
        gameMode: field.gameMode as GameModes,
        entryFee: field.entryFee,
        isVerified: field.isVerified,
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
    await prisma.partnerOpeningHours.create({
      data: {
        partner: { connect: { uid: hours.partnerUid } },
        dayOfWeek: hours.dayOfWeek,
        openTime: hours.opening_time,
        closeTime: hours.closing_time,
      },
    });
  }
  console.log('Opening hours populated');

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

  // Generate 150 sessions: 30 past + 120 upcoming
  const allGameModes = [
    GameModes.TWO_V_TWO,
    GameModes.THREE_V_THREE,
    GameModes.FOUR_V_FOUR,
    GameModes.FIVE_V_FIVE,
    GameModes.SIX_V_SIX,
    GameModes.SEVEN_V_SEVEN,
    GameModes.EIGHT_V_EIGHT,
    GameModes.TEN_V_TEN,
    GameModes.ELEVEN_V_ELEVEN,
  ];

  const today = new Date();
  const createdSessions = [];

  // Generate 30 past sessions
  console.log('Creating 30 past sessions...');
  for (let i = 0; i < 30; i++) {
    const daysAgo = Math.floor(Math.random() * 30) + 1; // 1-30 days ago
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysAgo);
    startDate.setHours(10 + Math.floor(Math.random() * 10), 0, 0, 0); // 10h-20h

    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 1 + Math.floor(Math.random() * 2)); // +1 to +3 hours

    const createdAt = new Date(startDate);
    createdAt.setDate(startDate.getDate() - Math.floor(Math.random() * 7) - 1); // created 1-7 days before

    const field = createdFields[i % createdFields.length];
    const creator = createdUsers[i % createdUsers.length];
    const gameMode = allGameModes[i % allGameModes.length];

    const createdSession = await prisma.sessions.create({
      data: {
        creatorUid: creator.uid,
        fieldUid: field.uid,
        sport: field.sport,
        gameMode: gameMode,
        startDate: startDate,
        endDate: endDate,
        title: `Session passée ${i + 1}`,
        maxPlayersPerTeam: 5,
        minPlayersPerTeam: 3,
        teamsPerGame: 2,
        description: `Session de ${field.sport} terminée`,
        createdAt: createdAt,
      },
    });
    createdSessions.push(createdSession);
  }

  // Generate 120 upcoming sessions
  console.log('Creating 120 upcoming sessions...');
  for (let i = 0; i < 120; i++) {
    const daysAhead = Math.floor(Math.random() * 90) + 1; // 1-90 days ahead
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + daysAhead);
    startDate.setHours(10 + Math.floor(Math.random() * 10), 0, 0, 0); // 10h-20h

    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 1 + Math.floor(Math.random() * 2)); // +1 to +3 hours

    const field = createdFields[i % createdFields.length];
    const creator = createdUsers[i % createdUsers.length];
    const gameMode = allGameModes[i % allGameModes.length];

    const createdSession = await prisma.sessions.create({
      data: {
        creatorUid: creator.uid,
        fieldUid: field.uid,
        sport: field.sport,
        gameMode: gameMode,
        startDate: startDate,
        endDate: endDate,
        title: `Session à venir ${i + 1}`,
        maxPlayersPerTeam: 5,
        minPlayersPerTeam: 3,
        teamsPerGame: 2,
        description: `Session de ${field.sport} prévue`,
      },
    });
    createdSessions.push(createdSession);
  }
  console.log(`${createdSessions.length} sessions created (30 past + 120 upcoming)`);

  const partnerUsers = [
    {
      email: partners[0].email,
      password: await hashPassword('Hoopsfactory398!'),
      firstname: 'Hoopsfactory',
      lastname: 'Hoopsfactory',
      birthdate: new Date('1998-01-31T00:00:00Z'),
      sex: Sex.MALE,
      bio: 'Hoopsfactory',
      type: UserType.PARTNER,
    },
    {
      email: partners[1].email,
      password: await hashPassword('Theoneball398!'),
      firstname: 'Theoneball',
      lastname: 'Theoneball',
      birthdate: new Date('1998-01-31T00:00:00Z'),
      sex: Sex.MALE,
      bio: 'Theoneball',
      type: UserType.PARTNER,
    },
    {
      email: partners[2].email,
      password: await hashPassword('Stadiumthiais398!'),
      firstname: 'Stadiumthiais',
      lastname: 'Stadiumthiais',
      birthdate: new Date('1998-01-31T00:00:00Z'),
      sex: Sex.MALE,
      bio: 'Stadiumthiais',
      type: UserType.PARTNER,
    },
    {
      email: partners[3].email,
      password: await hashPassword('Foresthill398!'),
      firstname: 'Foresthill',
      lastname: 'Foresthill',
      birthdate: new Date('1998-01-31T00:00:00Z'),
      sex: Sex.MALE,
      bio: 'Foresthill',
      type: UserType.PARTNER,
    },
  ];

  const createdPartnerUsers: { uid: string }[] = [];
  for (const partnerUser of partnerUsers) {
    const createdPartnerUser = await prisma.users.upsert({
      where: { email: partnerUser.email },
      update: {},
      create: partnerUser,
    });
    createdPartnerUsers.push({ uid: createdPartnerUser.uid });
    console.log(`Created partner user: ${partnerUser.email}`);
  }

  // 2 teams for each session (Team A and Team B)
  console.log('Creating teams for all sessions...');
  const createdTeams: { uid: string; sessionUid: string; teamLabel: TeamLabel }[] = [];
  for (let i = 0; i < createdSessions.length; i++) {
    const session = createdSessions[i];

    // Team A
    const teamA = await prisma.sessionTeams.upsert({
      where: {
        sessionUid_teamLabel: {
          sessionUid: session.uid,
          teamLabel: TeamLabel.A,
        },
      },
      update: {},
      create: {
        sessionUid: session.uid,
        teamLabel: TeamLabel.A,
        teamName: 'Team A',
      },
    });
    createdTeams.push({ uid: teamA.uid, sessionUid: session.uid, teamLabel: TeamLabel.A });

    // Team B
    const teamB = await prisma.sessionTeams.upsert({
      where: {
        sessionUid_teamLabel: {
          sessionUid: session.uid,
          teamLabel: TeamLabel.B,
        },
      },
      update: {},
      create: {
        sessionUid: session.uid,
        teamLabel: TeamLabel.B,
        teamName: 'Team B',
      },
    });
    createdTeams.push({ uid: teamB.uid, sessionUid: session.uid, teamLabel: TeamLabel.B });

    if ((i + 1) % 30 === 0) {
      console.log(`Created teams for ${i + 1}/${createdSessions.length} sessions`);
    }
  }
  console.log(`${createdTeams.length} teams created `);

  // Add some players to random teams (optional, just for demo purposes)
  console.log('Adding sample players to some teams...');
  const createdPlayers: { sessionUid: string; teamUid: string; userUid: string }[] = [];

  // Add a few players to the first 20 sessions
  for (let i = 0; i < 20; i++) {
    const session = createdSessions[i];
    // Get teams for this session
    const sessionTeams = createdTeams.filter((t) => t.sessionUid === session.uid);

    // Add 2-3 random users to each team
    for (const team of sessionTeams) {
      const numPlayers = 2 + Math.floor(Math.random() * 2); // 2-3 players
      for (let j = 0; j < numPlayers; j++) {
        const user = createdUsers[(i * 2 + j) % createdUsers.length];
        try {
          const createdPlayer = await prisma.sessionPlayers.upsert({
            where: {
              sessionUid_teamUid_userUid: {
                sessionUid: session.uid,
                teamUid: team.uid,
                userUid: user.uid,
              },
            },
            update: {},
            create: {
              sessionUid: session.uid,
              teamUid: team.uid,
              userUid: user.uid,
            },
          });
          createdPlayers.push({
            sessionUid: createdPlayer.sessionUid,
            teamUid: createdPlayer.teamUid,
            userUid: createdPlayer.userUid,
          });
        } catch (e) {
          // Skip if duplicate
        }
      }
    }
  }

  console.log(`${createdPlayers.length} players added to sessions`);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
