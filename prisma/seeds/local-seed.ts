import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import { Pool } from 'pg';
import {
  ConversationType,
  FieldType,
  GameModes,
  InvitationStatus,
  MessageStatus,
  MessageType,
  NotificationType,
  PrismaClient,
  Sex,
  TeamLabels,
  TimePeriod,
  UserHourPreferenceType,
  UserType,
  VerificationStatus,
} from '../../generated/prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

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
    const createdSport = await prisma.sports.upsert({
      create: sport,
      update: {},
      where: { name: sport.name },
    });
    createdSports.push(createdSport);
  }

  const partners = [
    {
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      city: 'Aubervilliers',
      country: 'FR',
      department: '93',
      email: 'contact@hoopsfactory.fr',
      latitude: 48.9047454,
      longitude: 2.3789354,
      name: 'HOOPSFACTORY',
      phone: '01 72 59 88 99',
      zipCode: '93300',
    },
    {
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      city: 'Noisy-le-Grand',
      country: 'FR',
      department: '93',
      email: 'contact@theoneball.fr',
      latitude: 48.83436030000001,
      longitude: 2.5689833,
      name: 'The One Ball',
      phone: '01 85 78 44 44',
      zipCode: '93160',
    },
    {
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      city: 'Thiais',
      country: 'FR',
      department: '94',
      email: 'stadium.thiais@gmail.com',
      latitude: 48.75098440000001,
      longitude: 2.3718412,
      name: 'Stadium Thias Orly',
      phone: '01 46 87 64 24',
      zipCode: '94320',
    },
    {
      address: '19 avenue de la Liberté, 92000 Nanterre',
      city: 'Nanterre',
      country: 'FR',
      department: '92',
      email: 'contact@forest-hill.com',
      latitude: 48.88837789999999,
      longitude: 2.2083152,
      name: 'Forrest Hill la Défense',
      phone: '01 47 24 67 67',
      zipCode: '92000',
    },
  ];

  const createdPartners: { uid: string; name: string }[] = [];
  for (const p of partners) {
    const createdPartner = await prisma.partners.upsert({
      create: p,
      update: {},
      where: { name: p.name },
    });
    console.log(`Partner ${createdPartner.name} has been created/found`);
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
    await prisma.partnerSports.upsert({
      create: relation,
      update: {},
      where: {
        partnerUid_sport: {
          partnerUid: relation.partnerUid,
          sport: relation.sport,
        },
      },
    });
  }
  console.log('Partner sports relations populated');

  // Création des terrains PRIVÉS (avec partenaire) et PUBLICS (sans partenaire)
  const fields = [
    // ? HOOPFACTORY - Terrains PRIVÉS
    {
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      city: 'Aubervilliers',
      country: 'FR',
      department: '93',
      latitude: 48.9047454,
      longitude: 2.3789354,
      name: 'Hoopsfactory - Court 1',
      partnerUid: createdPartners[0].uid,
      shortAddress: '3 Rue Pierre Larousse',
      sport: createdSports[1].name,
      status: VerificationStatus.APPROVED,
      type: FieldType.PRIVATE,
      zipCode: '93300',
    },
    {
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      city: 'Aubervilliers',
      country: 'FR',
      department: '93',
      latitude: 48.9047454,
      longitude: 2.3789354,
      name: 'Hoopsfactory - Court 2',
      partnerUid: createdPartners[0].uid,
      shortAddress: '3 Rue Pierre Larousse',
      sport: createdSports[1].name,
      status: VerificationStatus.APPROVED,
      type: FieldType.PRIVATE,
      zipCode: '93300',
    },
    // ? THE ONE BALL - Terrains PRIVÉS
    {
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      city: 'Noisy-le-Grand',
      country: 'FR',
      department: '93',
      latitude: 48.83436030000001,
      longitude: 2.5689833,
      name: 'The One Ball - Court 1',
      partnerUid: createdPartners[1].uid,
      shortAddress: '38 Rue du Ballon',
      sport: createdSports[1].name,
      status: VerificationStatus.APPROVED,
      type: FieldType.PRIVATE,
      zipCode: '93160',
    },
    {
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      city: 'Noisy-le-Grand',
      country: 'FR',
      department: '93',
      latitude: 48.83436030000001,
      longitude: 2.5689833,
      name: 'The One Ball - Court 2',
      partnerUid: createdPartners[1].uid,
      shortAddress: '38 Rue du Ballon',
      sport: createdSports[1].name,
      status: VerificationStatus.APPROVED,
      type: FieldType.PRIVATE,
      zipCode: '93160',
    },
    // ? STADIUM THIAS ORLY - Terrains PRIVÉS
    {
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      city: 'Thiais',
      country: 'FR',
      department: '94',
      latitude: 48.75098440000001,
      longitude: 2.3718412,
      name: 'Stadium Thiais - Terrain Football 1',
      partnerUid: createdPartners[2].uid,
      shortAddress: '2 rue du Courson',
      sport: createdSports[0].name,
      status: VerificationStatus.APPROVED,
      type: FieldType.PRIVATE,
      zipCode: '94320',
    },
    {
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      city: 'Thiais',
      country: 'FR',
      department: '94',
      latitude: 48.75098440000001,
      longitude: 2.3718412,
      name: 'Stadium Thiais - Court Basket',
      partnerUid: createdPartners[2].uid,
      shortAddress: '2 rue du Courson',
      sport: createdSports[1].name,
      status: VerificationStatus.APPROVED,
      type: FieldType.PRIVATE,
      zipCode: '94320',
    },
    // ? FOREST HILL - Terrains PRIVÉS
    {
      address: '19 avenue de la Liberté, 92000 Nanterre',
      city: 'Nanterre',
      country: 'FR',
      department: '92',
      latitude: 48.88837789999999,
      longitude: 2.2083152,
      name: 'Forest Hill - Court Tennis 1',
      partnerUid: createdPartners[3].uid,
      shortAddress: '19 avenue de la Liberté',
      sport: createdSports[2].name,
      status: VerificationStatus.APPROVED,
      type: FieldType.PRIVATE,
      zipCode: '92000',
    },
    {
      address: '19 avenue de la Liberté, 92000 Nanterre',
      city: 'Nanterre',
      country: 'FR',
      department: '92',
      latitude: 48.88837789999999,
      longitude: 2.2083152,
      name: 'Forest Hill - Court Padel 1',
      partnerUid: createdPartners[3].uid,
      shortAddress: '19 avenue de la Liberté',
      sport: createdSports[4].name,
      status: VerificationStatus.APPROVED,
      type: FieldType.PRIVATE,
      zipCode: '92000',
    },
    // ? Terrains PUBLICS (sans partenaire) - 50 terrains
    {
      address: '1 Rue Botzaris, 75019 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8806,
      longitude: 2.3844,
      name: 'Terrain Public - Parc des Buttes-Chaumont',
      partnerUid: null,
      shortAddress: '1 Rue Botzaris',
      sport: createdSports[0].name, // FOOTBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75019',
    },
    {
      address: '6 Rue de Médicis, 75006 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8462,
      longitude: 2.3372,
      name: 'Playground Public - Jardin du Luxembourg',
      partnerUid: null,
      shortAddress: '6 Rue de Médicis',
      sport: createdSports[1].name, // BASKETBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75006',
    },
    {
      address: '15 Avenue du Stade, 93170 Bagnolet',
      city: 'Bagnolet',
      country: 'FR',
      department: '93',
      latitude: 48.8645,
      longitude: 2.4164,
      name: 'Stade Municipal Bagnolet',
      partnerUid: null,
      shortAddress: '15 Avenue du Stade',
      sport: createdSports[0].name, // FOOTBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '93170',
    },
    {
      address: '211 Avenue Jean Jaurès, 75019 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8938,
      longitude: 2.39,
      name: 'Terrain Basket - Parc de la Villette',
      partnerUid: null,
      shortAddress: '211 Avenue Jean Jaurès',
      sport: createdSports[1].name, // BASKETBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75019',
    },
    {
      address: '81 Boulevard Kellermann, 75013 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8213,
      longitude: 2.3502,
      name: 'Stade Georges Carpentier',
      partnerUid: null,
      shortAddress: '81 Boulevard Kellermann',
      sport: createdSports[0].name, // FOOTBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75013',
    },
    {
      address: 'Quai de la Seine, 75019 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8841,
      longitude: 2.3797,
      name: 'Terrain Volley - Berges de Seine',
      partnerUid: null,
      shortAddress: 'Quai de la Seine',
      sport: createdSports[3].name, // VOLLEYBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75019',
    },
    {
      address: 'Rue Gaston Monmousseau, 93100 Montreuil',
      city: 'Montreuil',
      country: 'FR',
      department: '93',
      latitude: 48.8636,
      longitude: 2.4434,
      name: 'Terrain Synthétique Montreuil',
      partnerUid: null,
      shortAddress: 'Rue Gaston Monmousseau',
      sport: createdSports[0].name, // FOOTBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '93100',
    },
    {
      address: 'Place de la République, 75011 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8677,
      longitude: 2.3638,
      name: 'City Stade République',
      partnerUid: null,
      shortAddress: 'Place de la République',
      sport: createdSports[1].name, // BASKETBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75011',
    },
    {
      address: 'Route de la Pyramide, 94300 Vincennes',
      city: 'Vincennes',
      country: 'FR',
      department: '94',
      latitude: 48.8386,
      longitude: 2.4276,
      name: 'Stade Léo Lagrange Vincennes',
      partnerUid: null,
      shortAddress: 'Route de la Pyramide',
      sport: createdSports[0].name, // FOOTBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '94300',
    },
    {
      address: 'Avenue Reille, 75014 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8225,
      longitude: 2.3372,
      name: 'Terrain Basket - Parc Montsouris',
      partnerUid: null,
      shortAddress: 'Avenue Reille',
      sport: createdSports[1].name, // BASKETBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75014',
    },
    {
      address: '28 Boulevard Mortier, 75020 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8677,
      longitude: 2.4068,
      name: 'Stade Jules Ladoumègue',
      partnerUid: null,
      shortAddress: '28 Boulevard Mortier',
      sport: createdSports[0].name, // FOOTBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75020',
    },
    {
      address: 'Avenue Ingres, 75016 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8568,
      longitude: 2.2715,
      name: 'Courts Tennis - Jardin du Ranelagh',
      partnerUid: null,
      shortAddress: 'Avenue Ingres',
      sport: createdSports[2].name, // TENNIS
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75016',
    },
    {
      address: 'Avenue Édouard Vaillant, 93500 Pantin',
      city: 'Pantin',
      country: 'FR',
      department: '93',
      latitude: 48.8973,
      longitude: 2.4013,
      name: 'Terrain Football Pantin',
      partnerUid: null,
      shortAddress: 'Avenue Édouard Vaillant',
      sport: createdSports[0].name, // FOOTBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '93500',
    },
    {
      address: 'Place de la Bataille de Stalingrad, 75019 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8838,
      longitude: 2.3694,
      name: 'Playground Stalingrad',
      partnerUid: null,
      shortAddress: 'Place de la Bataille de Stalingrad',
      sport: createdSports[1].name, // BASKETBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75019',
    },
    {
      address: 'Rue du Moutier, 93300 Aubervilliers',
      city: 'Aubervilliers',
      country: 'FR',
      department: '93',
      latitude: 48.9119,
      longitude: 2.3822,
      name: 'Stade Municipal Aubervilliers',
      partnerUid: null,
      shortAddress: 'Rue du Moutier',
      sport: createdSports[0].name, // FOOTBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '93300',
    },
    {
      address: '24 Rue du Commandant Guilbaud, 75016 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8414,
      longitude: 2.2531,
      name: 'Terrain Volley - Parc des Princes',
      partnerUid: null,
      shortAddress: '24 Rue du Commandant Guilbaud',
      sport: createdSports[3].name, // VOLLEYBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75016',
    },
    {
      address: 'Avenue Paul Vaillant-Couturier, 93000 Bobigny',
      city: 'Bobigny',
      country: 'FR',
      department: '93',
      latitude: 48.9078,
      longitude: 2.4389,
      name: 'City Stade Bobigny',
      partnerUid: null,
      shortAddress: 'Avenue Paul Vaillant-Couturier',
      sport: createdSports[0].name, // FOOTBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '93000',
    },
    {
      address: 'Quai de la Marne, 75019 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8876,
      longitude: 2.3842,
      name: "Terrain Basket - Canal de l'Ourcq",
      partnerUid: null,
      shortAddress: 'Quai de la Marne',
      sport: createdSports[1].name, // BASKETBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75019',
    },
    {
      address: '9 Rue Jean Rey, 75015 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8535,
      longitude: 2.2917,
      name: 'Stade Émile Anthoine',
      partnerUid: null,
      shortAddress: '9 Rue Jean Rey',
      sport: createdSports[0].name, // FOOTBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75015',
    },
    {
      address: 'Rue de Belleville, 75020 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8722,
      longitude: 2.3894,
      name: 'Playground Belleville',
      partnerUid: null,
      shortAddress: 'Rue de Belleville',
      sport: createdSports[1].name, // BASKETBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75020',
    },
    {
      address: 'Rue de la République, 93200 Saint-Denis',
      city: 'Saint-Denis',
      country: 'FR',
      department: '93',
      latitude: 48.9362,
      longitude: 2.3574,
      name: 'Terrain Synthétique Saint-Denis',
      partnerUid: null,
      shortAddress: 'Rue de la République',
      sport: createdSports[0].name, // FOOTBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '93200',
    },
    {
      address: 'Rue du Général Leclerc, 92130 Issy-les-Moulineaux',
      city: 'Issy-les-Moulineaux',
      country: 'FR',
      department: '92',
      latitude: 48.8241,
      longitude: 2.2699,
      name: 'Tennis Municipal Issy',
      partnerUid: null,
      shortAddress: 'Rue du Général Leclerc',
      sport: createdSports[2].name, // TENNIS
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '92130',
    },
    {
      address: 'Bois de Vincennes, 75012 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8284,
      longitude: 2.4451,
      name: 'Stade Pershing Vincennes',
      partnerUid: null,
      shortAddress: 'Bois de Vincennes',
      sport: createdSports[0].name, // FOOTBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75012',
    },
    {
      address: 'Rue de Ménilmontant, 75020 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8692,
      longitude: 2.3869,
      name: 'City Stade Ménilmontant',
      partnerUid: null,
      shortAddress: 'Rue de Ménilmontant',
      sport: createdSports[1].name, // BASKETBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75020',
    },
    {
      address: 'Boulevard Jean Jaurès, 92110 Clichy',
      city: 'Clichy',
      country: 'FR',
      department: '92',
      latitude: 48.9044,
      longitude: 2.3059,
      name: 'Terrain Football Clichy',
      partnerUid: null,
      shortAddress: 'Boulevard Jean Jaurès',
      sport: createdSports[0].name, // FOOTBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '92110',
    },
    {
      address: 'Place de la Bataille de Stalingrad, 75010 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8813,
      longitude: 2.3699,
      name: 'Playground Jaurès',
      partnerUid: null,
      shortAddress: 'Place de la Bataille de Stalingrad',
      sport: createdSports[1].name, // BASKETBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75010',
    },
    {
      address: 'Rue Aristide Briand, 92300 Levallois-Perret',
      city: 'Levallois-Perret',
      country: 'FR',
      department: '92',
      latitude: 48.8938,
      longitude: 2.2877,
      name: 'Stade Municipal Levallois',
      partnerUid: null,
      shortAddress: 'Rue Aristide Briand',
      sport: createdSports[0].name, // FOOTBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '92300',
    },
    {
      address: 'Boulevard de Courcelles, 75008 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8799,
      longitude: 2.3089,
      name: 'Terrain Volley - Parc Monceau',
      partnerUid: null,
      shortAddress: 'Boulevard de Courcelles',
      sport: createdSports[3].name, // VOLLEYBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75008',
    },
    {
      address: 'Avenue Georges Gosnat, 94200 Ivry-sur-Seine',
      city: 'Ivry-sur-Seine',
      country: 'FR',
      department: '94',
      latitude: 48.8136,
      longitude: 2.3854,
      name: 'City Stade Ivry',
      partnerUid: null,
      shortAddress: 'Avenue Georges Gosnat',
      sport: createdSports[0].name, // FOOTBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '94200',
    },
    {
      address: 'Rue de Bercy, 75012 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.837,
      longitude: 2.3806,
      name: 'Terrain Basket - Parc de Bercy',
      partnerUid: null,
      shortAddress: 'Rue de Bercy',
      sport: createdSports[1].name, // BASKETBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75012',
    },
    {
      address: "Avenue Maurice d'Ocagne, 75014 Paris",
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8252,
      longitude: 2.3153,
      name: 'Stade Roger Le Gall',
      partnerUid: null,
      shortAddress: "Avenue Maurice d'Ocagne",
      sport: createdSports[0].name, // FOOTBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75014',
    },
    {
      address: 'Rue Oberkampf, 75011 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8651,
      longitude: 2.3762,
      name: 'Playground Oberkampf',
      partnerUid: null,
      shortAddress: 'Rue Oberkampf',
      sport: createdSports[1].name, // BASKETBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75011',
    },
    {
      address: 'Avenue de Stalingrad, 94800 Villejuif',
      city: 'Villejuif',
      country: 'FR',
      department: '94',
      latitude: 48.789,
      longitude: 2.3662,
      name: 'Terrain Football Villejuif',
      partnerUid: null,
      shortAddress: 'Avenue de Stalingrad',
      sport: createdSports[0].name, // FOOTBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '94800',
    },
    {
      address: 'Route de la Reine, 92100 Boulogne-Billancourt',
      city: 'Boulogne-Billancourt',
      country: 'FR',
      department: '92',
      latitude: 48.8352,
      longitude: 2.2428,
      name: 'Tennis Public Boulogne',
      partnerUid: null,
      shortAddress: 'Route de la Reine',
      sport: createdSports[2].name, // TENNIS
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '92100',
    },
    {
      address: 'Avenue du Général de Gaulle, 94000 Créteil',
      city: 'Créteil',
      country: 'FR',
      department: '94',
      latitude: 48.7791,
      longitude: 2.4597,
      name: 'City Stade Créteil',
      partnerUid: null,
      shortAddress: 'Avenue du Général de Gaulle',
      sport: createdSports[0].name, // FOOTBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '94000',
    },
    {
      address: 'Route de la Pyramide, 75012 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8375,
      longitude: 2.4447,
      name: 'Terrain Basket - Parc Floral',
      partnerUid: null,
      shortAddress: 'Route de la Pyramide',
      sport: createdSports[1].name, // BASKETBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75012',
    },
    {
      address: '82 Avenue Georges Lafont, 75016 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8452,
      longitude: 2.2708,
      name: 'Stade Pierre de Coubertin',
      partnerUid: null,
      shortAddress: '82 Avenue Georges Lafont',
      sport: createdSports[0].name, // FOOTBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75016',
    },
    {
      address: 'Avenue de Flandre, 75019 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8913,
      longitude: 2.376,
      name: 'Playground Crimée',
      partnerUid: null,
      shortAddress: 'Avenue de Flandre',
      sport: createdSports[1].name, // BASKETBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75019',
    },
    {
      address: 'Rue du Général Leclerc, 94500 Champigny-sur-Marne',
      city: 'Champigny-sur-Marne',
      country: 'FR',
      department: '94',
      latitude: 48.817,
      longitude: 2.495,
      name: 'Terrain Synthétique Champigny',
      partnerUid: null,
      shortAddress: 'Rue du Général Leclerc',
      sport: createdSports[0].name, // FOOTBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '94500',
    },
    {
      address: 'Allée de Longchamp, 75016 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8626,
      longitude: 2.2444,
      name: 'Terrain Volley - Bois de Boulogne',
      partnerUid: null,
      shortAddress: 'Allée de Longchamp',
      sport: createdSports[3].name, // VOLLEYBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75016',
    },
    {
      address: 'Avenue du Général Leclerc, 94700 Maisons-Alfort',
      city: 'Maisons-Alfort',
      country: 'FR',
      department: '94',
      latitude: 48.8033,
      longitude: 2.4368,
      name: 'City Stade Maisons-Alfort',
      partnerUid: null,
      shortAddress: 'Avenue du Général Leclerc',
      sport: createdSports[0].name, // FOOTBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '94700',
    },
    {
      address: 'Boulevard Kellermann, 75013 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8195,
      longitude: 2.3533,
      name: 'Terrain Basket - Parc Kellermann',
      partnerUid: null,
      shortAddress: 'Boulevard Kellermann',
      sport: createdSports[1].name, // BASKETBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75013',
    },
    {
      address: '99 Boulevard Kellermann, 75013 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8182,
      longitude: 2.3461,
      name: 'Stade Sébastien Charléty',
      partnerUid: null,
      shortAddress: '99 Boulevard Kellermann',
      sport: createdSports[0].name, // FOOTBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75013',
    },
    {
      address: 'Place de la Bastille, 75011 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8532,
      longitude: 2.3693,
      name: 'Playground Bastille',
      partnerUid: null,
      shortAddress: 'Place de la Bastille',
      sport: createdSports[1].name, // BASKETBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75011',
    },
    {
      address: "Avenue de l'Agent Sarre, 92700 Colombes",
      city: 'Colombes',
      country: 'FR',
      department: '92',
      latitude: 48.9223,
      longitude: 2.2531,
      name: 'Terrain Football Colombes',
      partnerUid: null,
      shortAddress: "Avenue de l'Agent Sarre",
      sport: createdSports[0].name, // FOOTBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '92700',
    },
    {
      address: 'Rue de la République, 92170 Vanves',
      city: 'Vanves',
      country: 'FR',
      department: '92',
      latitude: 48.8219,
      longitude: 2.2906,
      name: 'Tennis Municipal Vanves',
      partnerUid: null,
      shortAddress: 'Rue de la République',
      sport: createdSports[2].name, // TENNIS
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '92170',
    },
    {
      address: 'Avenue Paul Vaillant-Couturier, 94400 Vitry-sur-Seine',
      city: 'Vitry-sur-Seine',
      country: 'FR',
      department: '94',
      latitude: 48.7879,
      longitude: 2.3939,
      name: 'City Stade Vitry',
      partnerUid: null,
      shortAddress: 'Avenue Paul Vaillant-Couturier',
      sport: createdSports[0].name, // FOOTBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '94400',
    },
    {
      address: 'Rue Balard, 75015 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8429,
      longitude: 2.275,
      name: 'Terrain Basket - Parc André Citroën',
      partnerUid: null,
      shortAddress: 'Rue Balard',
      sport: createdSports[1].name, // BASKETBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75015',
    },
    {
      address: "Boulevard d'Inkermann, 92200 Neuilly-sur-Seine",
      city: 'Neuilly-sur-Seine',
      country: 'FR',
      department: '92',
      latitude: 48.8869,
      longitude: 2.2676,
      name: 'Stade Municipal Neuilly',
      partnerUid: null,
      shortAddress: "Boulevard d'Inkermann",
      sport: createdSports[0].name, // FOOTBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '92200',
    },
    {
      address: 'Place Gambetta, 75020 Paris',
      city: 'Paris',
      country: 'FR',
      department: '75',
      latitude: 48.8644,
      longitude: 2.3989,
      name: 'Playground Gambetta',
      partnerUid: null,
      shortAddress: 'Place Gambetta',
      sport: createdSports[1].name, // BASKETBALL
      status: VerificationStatus.APPROVED,
      type: FieldType.PUBLIC,
      zipCode: '75020',
    },
  ];

  const createdFields: {
    uid: string;
    sports: string[];
    partnerUid: string | null;
    type: FieldType;
    name: string | null;
  }[] = [];

  // Check if fields already exist
  const existingFields = await prisma.fields.findMany({
    include: {
      fieldSports: {
        select: {
          sport: true,
        },
      },
    },
  });

  if (existingFields.length > 0) {
    console.log(`Found ${existingFields.length} existing fields, skipping field creation`);
    createdFields.push(
      ...existingFields.map((f) => ({
        name: f.name,
        partnerUid: f.partnerUid,
        sports: f.fieldSports.map((fs) => fs.sport),
        type: f.type,
        uid: f.uid,
      })),
    );
  } else {
    for (const field of fields) {
      const createdField = await prisma.fields.create({
        data: {
          address: field.address,
          city: field.city,
          country: field.country,
          department: field.department,
          latitude: field.latitude,
          longitude: field.longitude,
          name: field.name,
          partner: field.partnerUid ? { connect: { uid: field.partnerUid } } : undefined,
          shortAddress: field.shortAddress,
          status: field.status,
          type: field.type,
          zipCode: field.zipCode,
        },
      });

      // Create fieldSport relation
      await prisma.fieldSports.create({
        data: {
          fieldUid: createdField.uid,
          sport: field.sport,
        },
      });

      console.log(`Field ${createdField.name} (${createdField.type}) has been created`);
      createdFields.push({
        name: createdField.name,
        partnerUid: createdField.partnerUid,
        sports: [field.sport],
        type: createdField.type,
        uid: createdField.uid,
      });
    }
  }

  // Helper function to get appropriate gameModes based on sport
  const getGameModesForSport = (sport: string): GameModes[] => {
    switch (sport) {
      case 'BASKETBALL':
        return [GameModes.THREE_V_THREE, GameModes.FIVE_V_FIVE];
      case 'FOOTBALL':
        return [GameModes.FIVE_V_FIVE, GameModes.ELEVEN_V_ELEVEN];
      case 'TENNIS':
        return [GameModes.ONE_V_ONE, GameModes.TWO_V_TWO];
      case 'PADDEL':
        return [GameModes.ONE_V_ONE, GameModes.TWO_V_TWO];
      default:
        return [GameModes.THREE_V_THREE, GameModes.FIVE_V_FIVE];
    }
  };

  // Helper function to get players per team based on gameMode
  const getPlayersPerTeamData = (mode: GameModes) => {
    switch (mode) {
      case GameModes.ONE_V_ONE:
        return { maxPlayersPerTeam: 1, minPlayersPerTeam: 1 };
      case GameModes.TWO_V_TWO:
        return { maxPlayersPerTeam: 2, minPlayersPerTeam: 2 };
      case GameModes.THREE_V_THREE:
        return { maxPlayersPerTeam: 3, minPlayersPerTeam: 3 };
      case GameModes.FOUR_V_FOUR:
        return { maxPlayersPerTeam: 4, minPlayersPerTeam: 3 };
      case GameModes.FIVE_V_FIVE:
        return { maxPlayersPerTeam: 5, minPlayersPerTeam: 3 };
      case GameModes.SIX_V_SIX:
        return { maxPlayersPerTeam: 6, minPlayersPerTeam: 4 };
      case GameModes.SEVEN_V_SEVEN:
        return { maxPlayersPerTeam: 7, minPlayersPerTeam: 5 };
      case GameModes.EIGHT_V_EIGHT:
        return { maxPlayersPerTeam: 8, minPlayersPerTeam: 5 };
      case GameModes.TEN_V_TEN:
        return { maxPlayersPerTeam: 10, minPlayersPerTeam: 7 };
      case GameModes.ELEVEN_V_ELEVEN:
        return { maxPlayersPerTeam: 11, minPlayersPerTeam: 8 };
      default:
        return { maxPlayersPerTeam: 5, minPlayersPerTeam: 3 };
    }
  };

  // Création des créneaux (FieldSlots) pour les terrains PRIVÉS
  console.log('Creating field slots for PRIVATE fields...');
  const privateFields = createdFields.filter((f) => f.type === FieldType.PRIVATE);

  const existingSlots = await prisma.fieldSlots.findMany({
    take: 1,
  });

  if (existingSlots.length === 0) {
    const today = new Date();
    const createdSlots = [];

    for (const field of privateFields) {
      // Créer des créneaux : 14 jours dans le passé jusqu'à 30 jours dans le futur
      for (let day = -14; day < 30; day++) {
        const slotDate = new Date(today);
        slotDate.setDate(today.getDate() + day);

        // Créneaux de 10h à 22h, avec durées variées (60, 90 ou 120 minutes)
        for (let hour = 10; hour < 22; hour++) {
          const startTime = new Date(slotDate);
          startTime.setHours(hour, 0, 0, 0);

          const endTime = new Date(startTime);
          const durationHours = [1, 1.5, 2][Math.floor(Math.random() * 3)]; // 60, 90 ou 120 minutes
          endTime.setHours(startTime.getHours() + Math.floor(durationHours));
          endTime.setMinutes(startTime.getMinutes() + (durationHours % 1) * 60);

          // Varier les gameModes selon le sport du terrain
          const sport = field.sports[0]; // Utiliser le premier sport du terrain
          const sportGameModes = getGameModesForSport(sport);
          const gameMode = sportGameModes[hour % sportGameModes.length];

          const slot = await prisma.fieldSlots.create({
            data: {
              endTime: endTime,
              fieldUid: field.uid,
              gameMode: gameMode,
              isReserved: false,
              price: Math.random() > 0.5 ? 20.0 : 25.0, // Prix variable
              startTime: startTime,
            },
          });
          createdSlots.push(slot);
        }
      }
    }
    console.log(`${createdSlots.length} field slots created for private fields`);
  } else {
    console.log('Field slots already exist, skipping creation');
  }

  const userCities = ['Paris', 'Créteil', 'Clichy', 'Saint-Denis'];
  const getRandomUserCity = () => userCities[Math.floor(Math.random() * userCities.length)];

  const users = [
    {
      bio: 'AAAAAAAAAAAAAAAAAAAAAAAA',
      birthdate: new Date('1998-01-31T00:00:00Z'),
      email: 'seto.kaiba@hotmail.fr',
      firstname: 'Seto',
      imageUrl: '1738433236109explore2.png',
      lastname: 'Kaiba',
      password: await hashPassword('Seto398!'),
      phone: '+33609032663',
      sex: Sex.MALE,
    },
    {
      bio: 'Le roi des duels',
      birthdate: new Date('1999-06-04T00:00:00Z'),
      email: 'yugi.muto@hotmail.fr',
      firstname: 'Yugi',
      imageUrl: '1738433236109explore2.png',
      lastname: 'Muto',
      password: await hashPassword('Yugi398!'),
      phone: '+33609032664',
      sex: Sex.MALE,
    },
    {
      bio: 'Duelliste passionné',
      birthdate: new Date('1999-01-25T00:00:00Z'),
      email: 'joey.wheeler@hotmail.fr',
      firstname: 'Joey',
      imageUrl: '1738433236109explore2.png',
      lastname: 'Wheeler',
      password: await hashPassword('Joey398!'),
      phone: '+33609032665',
      sex: Sex.MALE,
    },
    {
      bio: 'Protecteur du pharaon',
      birthdate: new Date('1999-01-25T00:00:00Z'),
      email: 'marik.ishtar@hotmail.fr',
      firstname: 'Marik',
      imageUrl: '1738433236109explore2.png',
      lastname: 'Ishtar',
      password: await hashPassword('Marik398!'),
      phone: '+33609032658',
      sex: Sex.MALE,
    },
    {
      bio: 'Exorciste à la force surhumaine et hôte de Sukuna',
      birthdate: new Date('2001-03-20T00:00:00Z'),
      email: 'yuji.itadori@hotmail.fr',
      firstname: 'Yuji',
      imageUrl: '1738433236109explore2.png',
      lastname: 'Itadori',
      password: await hashPassword('Yuji398!'),
      phone: '+33609032663',
      sex: Sex.MALE,
    },
    {
      bio: "Maitre des shikigamis et eleve de l'ecole d'exorcisme",
      birthdate: new Date('2001-07-22T00:00:00Z'),
      email: 'megumi.fushiguro@hotmail.fr',
      firstname: 'Megumi',
      imageUrl: '1738433236109explore2.png',
      lastname: 'Fushiguro',
      password: await hashPassword('Megumi398!'),
      phone: '+33609032664',
      sex: Sex.MALE,
    },
    {
      bio: 'Exorciste au caractère explosif et style de combat unique',
      birthdate: new Date('2001-08-07T00:00:00Z'),
      email: 'nobara.kugisaki@hotmail.fr',
      firstname: 'Nobara',
      imageUrl: '1738433236109explore2.png',
      lastname: 'Kugisaki',
      password: await hashPassword('Nobara398!'),
      phone: '+33609032665',
      sex: Sex.FEMALE,
    },
    {
      bio: "L'exorciste le plus puissant avec les Six Yeux",
      birthdate: new Date('1989-12-07T00:00:00Z'),
      email: 'satoru.gojo@hotmail.fr',
      firstname: 'Satoru',
      imageUrl: '1738433236109explore2.png',
      lastname: 'Gojo',
      password: await hashPassword('Gojo398!'),
      phone: '+33609032666',
      sex: Sex.MALE,
    },
    {
      bio: 'Exorciste de classe spéciale lié à Rika Orimoto',
      birthdate: new Date('2001-04-18T00:00:00Z'),
      email: 'yuta.okkotsu@hotmail.fr',
      firstname: 'Yuta',
      imageUrl: '1738433236109explore2.png',
      lastname: 'Okkotsu',
      password: await hashPassword('Yuta398!'),
      phone: '+33609032667',
      sex: Sex.MALE,
    },
    {
      bio: 'Ancien héros devenu une légende sombre',
      birthdate: new Date('2003-03-30T00:00:00Z'),
      email: 'eren.yeager@hotmail.fr',
      firstname: 'Eren',
      imageUrl: '1738433236109explore2.png',
      lastname: 'Yeager',
      password: await hashPassword('Eren398!'),
      phone: '+33609032668',
      sex: Sex.MALE,
    },
    {
      bio: 'Pourfendeur de démons au cœur pur',
      birthdate: new Date('2002-07-14T00:00:00Z'),
      email: 'tanjiro.kamado@hotmail.fr',
      firstname: 'Tanjiro',
      imageUrl: '1738433236109explore2.png',
      lastname: 'Kamado',
      password: await hashPassword('Tanjiro398!'),
      phone: '+33609032670',
      sex: Sex.MALE,
    },
    {
      bio: 'Roi des Fléaux, tyran au sourire glaçant',
      birthdate: new Date('1000-01-01T00:00:00Z'),
      email: 'ryomen.sukuna@hotmail.fr',
      firstname: 'Ryomen',
      imageUrl: '1738433236109explore2.png',
      lastname: 'Sukuna',
      password: await hashPassword('Sukuna398!'),
      phone: '+33609032660',
      sex: Sex.MALE,
    },
    {
      bio: 'Princesse du clan Hyuga et experte du Byakugan',
      birthdate: new Date('1997-12-27T00:00:00Z'),
      email: 'hinata.hyuga@hotmail.fr',
      firstname: 'Hinata',
      imageUrl: '1738433236109explore2.png',
      lastname: 'Hyuga',
      password: await hashPassword('Hinata398!'),
      phone: '+33609032672',
      sex: Sex.FEMALE,
    },
    {
      bio: 'Shinigami qui a obtenu les pouvoirs des Hollows',
      birthdate: new Date('1998-08-02T00:00:00Z'),
      email: 'ichigo.kurosaki@hotmail.fr',
      firstname: 'Ichigo',
      imageUrl: '1738433236109explore2.png',
      lastname: 'Kurosaki',
      password: await hashPassword('Ichigo398!'),
      phone: '+33609032673',
      sex: Sex.FEMALE,
    },
    {
      bio: 'Combattante talentueuse rejetée par le clan Zenin',
      birthdate: new Date('2001-09-25T00:00:00Z'),
      email: 'maki.zenin@hotmail.fr',
      firstname: 'Maki',
      imageUrl: '1738433236109explore2.png',
      lastname: 'Zenin',
      password: await hashPassword('Maki398!'),
      phone: '+33609032671',
      sex: Sex.FEMALE,
    },
    {
      bio: 'Chasseur de têtes et expert en sabre',
      birthdate: new Date('1998-07-03T00:00:00Z'),
      email: 'zoro.roronoa@hotmail.fr',
      firstname: 'Zoro',
      imageUrl: '1738433236109explore2.png',
      lastname: 'Roronoa',
      password: await hashPassword('Zoro398!'),
      phone: '+33609032666',
      sex: Sex.MALE,
    },
    {
      bio: 'Seigneur des Hollows et des Shinigamis',
      birthdate: new Date('1998-02-06T00:00:00Z'),
      email: 'aizen.sosuke@hotmail.fr',
      firstname: 'Aizen',
      imageUrl: '1738433236109explore2.png',
      lastname: 'Sosuke',
      password: await hashPassword('Aizen398!'),
      phone: '+33609032667',
      sex: Sex.MALE,
    },
  ].map((user) => ({
    ...user,
    city: getRandomUserCity(),
  }));

  // Generate 100+ additional users
  const additionalUsers = [];
  const firstNames = [
    'Alex',
    'Jordan',
    'Taylor',
    'Morgan',
    'Casey',
    'Riley',
    'Avery',
    'Quinn',
    'Blake',
    'Drew',
    'Cameron',
    'Dakota',
    'Skylar',
    'Phoenix',
    'River',
    'Sage',
    'Storm',
    'Kai',
    'Remy',
    'Finley',
    'Parker',
    'Reese',
    'Rowan',
    'Sawyer',
    'Emerson',
    'Harley',
    'Peyton',
    'Hayden',
    'Darcy',
    'Lennox',
    'Presley',
    'Oakley',
    'Ashton',
    'Kendall',
    'Skyler',
    'Ariel',
    'Bryn',
    'Cody',
    'Dallas',
    'Ellis',
    'Falcon',
    'Grayson',
    'Haven',
    'Indigo',
    'Jude',
    'Keenan',
    'Logan',
    'Morgan',
    'Nolan',
    'Owen',
    'Parker',
    'Quinn',
    'Rory',
    'Scout',
    'Tatum',
    'Ulysses',
    'Vaughn',
    'Wyatt',
    'Xavier',
    'Yale',
    'Zephyr',
    'Adrian',
    'Brennan',
    'Colton',
    'Dalton',
    'Ethan',
    'Finch',
    'Griffin',
    'Harrison',
    'Isaac',
    'Jackson',
    'Keaton',
    'Liam',
    'Mason',
    'Nathan',
    'Oliver',
    'Patrick',
    'Quincy',
    'Ryan',
    'Samuel',
    'Thomas',
    'Ulrich',
    'Victor',
    'William',
    'Xavier',
    'Yuri',
    'Zachary',
    'Abe',
    'Benson',
    'Cornelius',
    'Dominic',
    'Emilio',
    'Fabio',
    'Gideon',
    'Hector',
    'Igor',
    'Jasper',
    'Klaus',
    'Lucian',
    'Marcus',
    'Nicolas',
    'Oscar',
    'Paolo',
  ];
  const lastNames = [
    'Martin',
    'Bernard',
    'Thomas',
    'Robert',
    'Richard',
    'Petit',
    'Durand',
    'Lefevre',
    'Michel',
    'Garcia',
    'David',
    'Bertrand',
    'Roux',
    'Vincent',
    'Fournier',
    'Morel',
    'Girardin',
    'Andre',
    'Leroy',
    'Moreau',
    'Meunier',
    'Brun',
    'Martel',
    'Blanc',
    'Bonnet',
    'Boucher',
    'Bourgois',
    'Breton',
    'Broussard',
    'Brunet',
    'Brunette',
    'Bruyere',
    'Buchanan',
    'Buckley',
    'Buell',
    'Buford',
    'Bugbee',
    'Buhl',
    'Buhrman',
    'Bulkley',
    'Bull',
    'Bullock',
    'Bumgarner',
    'Bunch',
    'Bundy',
    'Bunker',
    'Bunn',
    'Bunting',
    'Burbank',
    'Burchard',
    'Burch',
    'Burckhardt',
    'Burden',
    'Burford',
    'Burg',
    'Burge',
    'Burger',
    'Burgess',
    'Burget',
    'Burgin',
    'Burgoyne',
    'Burgreen',
    'Burk',
    'Burke',
    'Burkett',
    'Burkhart',
    'Burkhead',
    'Burkholder',
    'Burks',
    'Burley',
    'Burleson',
    'Burley',
    'Burlingame',
    'Burman',
    'Burmeister',
    'Burn',
    'Burnaby',
    'Burnell',
    'Burner',
    'Burnes',
    'Burness',
    'Burnett',
    'Burney',
    'Burnham',
    'Burnie',
    'Burnley',
    'Burns',
    'Burnsides',
    'Burnum',
    'Burpee',
    'Burr',
    'Burrage',
    'Burrell',
    'Burren',
    'Burress',
    'Burrett',
    'Burridge',
    'Burris',
    'Burriss',
    'Burritt',
    'Burro',
    'Burrow',
    'Burrows',
    'Burrus',
    'Bursey',
    'Burson',
    'Burt',
    'Burta',
    'Burte',
    'Burton',
    'Burts',
    'Burwell',
    'Bury',
    'Busby',
    'Buscemi',
    'Busch',
    'Buse',
    'Busenbark',
    'Busfield',
    'Bush',
    'Bushby',
    'Bushee',
    'Busher',
    'Bushey',
    'Bushman',
    'Bushnell',
    'Bushy',
    'Busick',
    'Busk',
    'Busker',
    'Buskey',
    'Buskirk',
    'Busman',
    'Buss',
    'Busse',
    'Bussey',
    'Bussinger',
    'Bussone',
    'Bust',
    'Bustamante',
    'Buster',
    'Bustin',
    'Bustle',
    'Busto',
    'Busts',
    'Buswell',
    'Busy',
    'Butcher',
    'Buterbaugh',
    'Buterbaugh',
    'Buterbaugh',
    'Buterfield',
    'Butfield',
    'Butke',
    'Butker',
    'Butko',
    'Butland',
    'Butlar',
    'Butler',
    'Butley',
    'Butlin',
    'Butner',
    'Butram',
    'Butrick',
    'Butrum',
    'Butscher',
    'Butsford',
    'Butsow',
    'Butson',
    'Butt',
    'Buttacavoli',
    'Buttafuoco',
  ];
  const domains = [
    'gmail.com',
    'hotmail.fr',
    'yahoo.fr',
    'outlook.com',
    'protonmail.com',
    'mail.com',
  ];

  for (let i = 0; i < 100; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const domain = domains[i % domains.length];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${domain}`;

    additionalUsers.push({
      bio: `Passionné de sports et de jeux en équipe`,
      birthdate: new Date(
        1990 + Math.floor(Math.random() * 30),
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28),
      ),
      city: getRandomUserCity(),
      email,
      firstname: firstName,
      imageUrl: '1738433236109explore2.png',
      lastname: lastName,
      password: await hashPassword('Password123!'),
      phone: `+336${Math.floor(Math.random() * 100000000)
        .toString()
        .padStart(8, '0')}`,
      sex: Math.random() > 0.5 ? Sex.MALE : Sex.FEMALE,
    });
  }

  users.push(...additionalUsers);

  const createdUsers: { uid: string }[] = [];
  for (const user of users) {
    const createdUser = await prisma.users.upsert({
      create: user,
      update: {},
      where: { email: user.email },
    });
    createdUsers.push({ uid: createdUser.uid });
    console.log(`Created user: ${user.email}`);
  }

  // Create UserSports (sport levels for each user)
  console.log('Creating user sport levels...');
  const createdUserSports = [];

  for (const user of createdUsers) {
    // Each user gets 1-3 random sports with levels
    const numSports = Math.floor(Math.random() * 3) + 1; // 1 to 3 sports
    const userSportsList = [...createdSports]
      .sort(() => Math.random() - 0.5) // Shuffle
      .slice(0, numSports); // Take random sports

    for (const sport of userSportsList) {
      // Assign a random level between 1 and 3
      const level = Math.floor(Math.random() * 3) + 1;

      try {
        const userSport = await prisma.userSportPreferences.upsert({
          create: {
            level: level,
            sport: sport.name,
            userUid: user.uid,
          },
          update: {},
          where: {
            userUid_sport: {
              sport: sport.name,
              userUid: user.uid,
            },
          },
        });
        createdUserSports.push(userSport);
      } catch (_e) {
        // Skip if duplicate
      }
    }
  }

  console.log(`${createdUserSports.length} user sport levels created`);

  // Create UserHourPreferences (time preferences for each user)
  console.log('Creating user hour preferences...');
  const createdUserHourPreferences = [];

  for (const user of createdUsers) {
    // Each user gets 2-5 random time preferences
    const numPreferences = Math.floor(Math.random() * 4) + 2; // 2 to 5 preferences

    for (let i = 0; i < numPreferences; i++) {
      const dayOfWeek = Math.floor(Math.random() * 7); // 0-6 (Monday-Sunday)
      const timePeriods = ['MORNING', 'AFTERNOON', 'EVENING'];
      const timePeriod = timePeriods[Math.floor(Math.random() * timePeriods.length)];

      try {
        const userHourPreference = await prisma.userHourPreferences.create({
          data: {
            dayOfWeek: dayOfWeek,
            timePeriod: timePeriod as TimePeriod,
            type: UserHourPreferenceType.RECURRENT,
            userUid: user.uid,
          },
        });
        createdUserHourPreferences.push(userHourPreference);
      } catch (_e) {
        // Skip if duplicate or error
      }
    }
  }

  console.log(`${createdUserHourPreferences.length} user hour preferences created`);

  const today = new Date();
  const createdSessions = [];

  // Check if sessions already exist
  const existingSessions = await prisma.sessions.findMany({
    take: 1,
  });

  if (existingSessions.length > 0) {
    console.log('Sessions already exist, skipping session creation');
    const allSessions = await prisma.sessions.findMany();
    createdSessions.push(...allSessions);
  } else {
    console.log('Creating sessions...');

    // Récupérer quelques slots disponibles pour les terrains privés
    const availableSlots = await prisma.fieldSlots.findMany({
      take: 50, // Augmenté pour plus de diversité
      where: {
        isReserved: false,
      },
    });

    const publicFields = createdFields.filter((f) => f.type === FieldType.PUBLIC);

    // Créer 50 sessions pour terrains PRIVÉS (avec réservation de slot, payant)
    console.log('Creating 50 sessions for PRIVATE fields (paid) with slots...');
    for (let i = 0; i < 50 && i < availableSlots.length; i++) {
      const slot = availableSlots[i];
      const field = privateFields.find((f) => f.uid === slot.fieldUid);
      if (!field) continue;

      const creator = createdUsers[i % createdUsers.length];
      const fieldSport = field.sports[0]; // Utiliser le premier sport du terrain
      const sportGameModes = getGameModesForSport(fieldSport);
      const gameMode = sportGameModes[i % sportGameModes.length];
      const { maxPlayersPerTeam, minPlayersPerTeam } = getPlayersPerTeamData(gameMode);

      const startDate = slot.startTime;
      const endDate = slot.endTime;

      const createdSession = await prisma.sessions.create({
        data: {
          creatorUid: creator.uid,
          description: `Session de ${fieldSport} sur terrain privé`,
          endDate: endDate,
          fieldUid: field.uid,
          gameMode: gameMode,
          level: Math.floor(Math.random() * 3) + 1, // Random level 1-3
          maxPlayersPerTeam,
          minPlayersPerTeam,
          slotUid: slot.uid,
          sport: fieldSport,
          startDate: startDate,
          teamsPerGame: 2,
          title: `Session ${fieldSport} - ${field.name}`,
        },
      });

      // Marquer le slot comme réservé
      await prisma.fieldSlots.update({
        data: { isReserved: true },
        where: { uid: slot.uid },
      });

      createdSessions.push(createdSession);
    }

    // Créer 100 sessions pour terrains PUBLICS (sans slot, gratuit)
    console.log('Creating 100 sessions for PUBLIC fields (free) without slots...');

    for (let i = 0; i < 100; i++) {
      // -14 à +30 jours : une partie des sessions sera dans le passé
      const daysOffset = Math.floor(Math.random() * 45) - 14; // -14 à +30 jours
      const startDate = new Date(today);
      startDate.setDate(today.getDate() + daysOffset);
      startDate.setHours(10 + Math.floor(Math.random() * 10), 0, 0, 0); // 10h-20h

      const endDate = new Date(startDate);
      const durationHours = [1, 1.5, 2][Math.floor(Math.random() * 3)]; // 1, 1.5 ou 2 heures
      endDate.setHours(startDate.getHours() + Math.floor(durationHours));
      endDate.setMinutes(startDate.getMinutes() + (durationHours % 1) * 60);

      const field = publicFields[i % publicFields.length];
      const creator = createdUsers[i % createdUsers.length];
      const fieldSport = field.sports[0]; // Utiliser le premier sport du terrain
      const sportGameModes = getGameModesForSport(fieldSport);
      const gameMode = sportGameModes[i % sportGameModes.length];
      const { maxPlayersPerTeam, minPlayersPerTeam } = getPlayersPerTeamData(gameMode);

      const createdSession = await prisma.sessions.create({
        data: {
          creatorUid: creator.uid,
          description: `Session gratuite de ${fieldSport} sur terrain public`,
          endDate: endDate,
          fieldUid: field.uid,
          gameMode: gameMode,
          level: Math.floor(Math.random() * 3) + 1, // Random level 1-3
          maxPlayersPerTeam,
          minPlayersPerTeam,
          slotUid: null, // Pas de slot pour les terrains publics
          sport: fieldSport,
          startDate: startDate,
          teamsPerGame: 2,
          title: `Session ${fieldSport} - ${field.name || 'Terrain public'}`,
        },
      });
      createdSessions.push(createdSession);
    }

    console.log(`${createdSessions.length} sessions created (50 paid private + 100 free public)`);

    // Créer des sessions spécifiques pour les terrains publics cmjpyq9ok000j57po1wk8y0mi et cmjpyq9om000l57pohqm85tqy
    // avec des horaires et durées variées
    console.log('Creating specific sessions for public fields with varied times and durations...');
    const specificFieldUids = ['cmjpyq9ok000j57po1wk8y0mi', 'cmjpyq9om000l57pohqm85tqy'];
    // Inclure des jours passés (-2, -1), aujourd'hui (0) et demain (1)
    const days = [-2, -1, 0, 1];

    for (const fieldUid of specificFieldUids) {
      const field = createdFields.find((f) => f.uid === fieldUid);
      if (!field) {
        console.log(`Field ${fieldUid} not found, skipping...`);
        continue;
      }

      for (const dayOffset of days) {
        for (let j = 0; j < 4; j++) {
          const startDate = new Date(today);
          startDate.setDate(today.getDate() + dayOffset);
          const randomHour = 10 + Math.floor(Math.random() * 10); // 10h-20h
          startDate.setHours(randomHour, 0, 0, 0);

          const endDate = new Date(startDate);
          const durationHours = [1, 1.5, 2][Math.floor(Math.random() * 3)]; // 60, 90 ou 120 minutes
          endDate.setHours(startDate.getHours() + Math.floor(durationHours));
          endDate.setMinutes(startDate.getMinutes() + (durationHours % 1) * 60);

          const creator = createdUsers[j % createdUsers.length];
          const fieldSport = field.sports[0]; // Utiliser le premier sport du terrain
          const sportGameModes = getGameModesForSport(fieldSport);
          const gameMode = sportGameModes[j % sportGameModes.length];
          const { maxPlayersPerTeam, minPlayersPerTeam } = getPlayersPerTeamData(gameMode);

          const dayLabels: Record<number, string> = {
            [-2]: 'il y a 2 jours',
            [-1]: 'hier',
            0: "aujourd'hui",
            1: 'demain',
          };
          const dayLabel = dayLabels[dayOffset] ?? `J${dayOffset}`;

          const createdSession = await prisma.sessions.create({
            data: {
              creatorUid: creator.uid,
              description: `Session gratuite de ${fieldSport} sur terrain public ${dayLabel} à ${randomHour}h`,
              endDate: endDate,
              fieldUid: field.uid,
              gameMode: gameMode,
              level: Math.floor(Math.random() * 3) + 1, // Random level 1-3
              maxPlayersPerTeam,
              minPlayersPerTeam,
              slotUid: null,
              sport: fieldSport,
              startDate: startDate,
              teamsPerGame: 2,
              title: `Session ${fieldSport} ${dayLabel} à ${randomHour}h - ${field.name || 'Terrain public'}`,
            },
          });
          createdSessions.push(createdSession);
          console.log(`Created session for field ${fieldUid} on ${dayLabel} at ${randomHour}h`);
        }
      }
    }

    console.log(
      `Total: ${createdSessions.length} sessions created (including specific time slots)`,
    );
  }

  const partnerUsers = [
    {
      bio: 'Hoopsfactory',
      birthdate: new Date('1998-01-31T00:00:00Z'),
      email: partners[0].email,
      firstname: 'Hoopsfactory',
      lastname: 'Hoopsfactory',
      password: await hashPassword('Hoopsfactory398!'),
      sex: Sex.MALE,
      type: UserType.PARTNER,
    },
    {
      bio: 'Theoneball',
      birthdate: new Date('1998-01-31T00:00:00Z'),
      email: partners[1].email,
      firstname: 'Theoneball',
      lastname: 'Theoneball',
      password: await hashPassword('Theoneball398!'),
      sex: Sex.MALE,
      type: UserType.PARTNER,
    },
    {
      bio: 'Stadiumthiais',
      birthdate: new Date('1998-01-31T00:00:00Z'),
      email: partners[2].email,
      firstname: 'Stadiumthiais',
      lastname: 'Stadiumthiais',
      password: await hashPassword('Stadiumthiais398!'),
      sex: Sex.MALE,
      type: UserType.PARTNER,
    },
    {
      bio: 'Foresthill',
      birthdate: new Date('1998-01-31T00:00:00Z'),
      email: partners[3].email,
      firstname: 'Foresthill',
      lastname: 'Foresthill',
      password: await hashPassword('Foresthill398!'),
      sex: Sex.MALE,
      type: UserType.PARTNER,
    },
  ];

  const createdPartnerUsers: { uid: string }[] = [];
  for (const partnerUser of partnerUsers) {
    const createdPartnerUser = await prisma.users.upsert({
      create: partnerUser,
      update: {},
      where: { email: partnerUser.email },
    });
    createdPartnerUsers.push({ uid: createdPartnerUser.uid });
    console.log(`Created partner user: ${partnerUser.email}`);
  }

  // 2 teams for each session (Team A and Team B)
  console.log('Creating teams for all sessions...');
  const createdTeams: { uid: string; sessionUid: string; teamLabel: TeamLabels }[] = [];
  for (let i = 0; i < createdSessions.length; i++) {
    const session = createdSessions[i];

    // Team A
    const teamA = await prisma.sessionTeams.upsert({
      create: {
        sessionUid: session.uid,
        teamLabel: TeamLabels.A,
        teamName: 'Team A',
      },
      update: {},
      where: {
        sessionUid_teamLabel: {
          sessionUid: session.uid,
          teamLabel: TeamLabels.A,
        },
      },
    });
    createdTeams.push({ sessionUid: session.uid, teamLabel: TeamLabels.A, uid: teamA.uid });

    // Team B
    const teamB = await prisma.sessionTeams.upsert({
      create: {
        sessionUid: session.uid,
        teamLabel: TeamLabels.B,
        teamName: 'Team B',
      },
      update: {},
      where: {
        sessionUid_teamLabel: {
          sessionUid: session.uid,
          teamLabel: TeamLabels.B,
        },
      },
    });
    createdTeams.push({ sessionUid: session.uid, teamLabel: TeamLabels.B, uid: teamB.uid });

    if ((i + 1) % 30 === 0) {
      console.log(`Created teams for ${i + 1}/${createdSessions.length} sessions`);
    }
  }
  console.log(`${createdTeams.length} teams created`);

  // Add players to all sessions based on gameMode
  console.log('Adding players to all sessions based on gameMode...');
  const createdPlayers: { sessionUid: string; teamUid: string; userUid: string }[] = [];

  for (let i = 0; i < createdSessions.length; i++) {
    const session = createdSessions[i];
    const sessionTeams = createdTeams.filter((t) => t.sessionUid === session.uid);
    const { maxPlayersPerTeam } = getPlayersPerTeamData(session.gameMode);

    for (const team of sessionTeams) {
      // Add players between minPlayersPerTeam and maxPlayersPerTeam
      const numPlayers = Math.ceil(maxPlayersPerTeam * (0.6 + Math.random() * 0.4)); // 60-100% of max
      for (let j = 0; j < numPlayers; j++) {
        const user = createdUsers[(i * 10 + j) % createdUsers.length];
        try {
          const createdPlayer = await prisma.sessionPlayers.upsert({
            create: {
              sessionUid: session.uid,
              teamUid: team.uid,
              userUid: user.uid,
            },
            update: {},
            where: {
              sessionUid_userUid: {
                sessionUid: session.uid,
                userUid: user.uid,
              },
            },
          });
          createdPlayers.push({
            sessionUid: createdPlayer.sessionUid,
            teamUid: createdPlayer.teamUid,
            userUid: createdPlayer.userUid,
          });
        } catch (_e) {
          // Skip if duplicate
        }
      }
    }

    if ((i + 1) % 50 === 0) {
      console.log(`Added players to ${i + 1}/${createdSessions.length} sessions`);
    }
  }

  console.log(`${createdPlayers.length} players added to all sessions`);

  // Create GROUP conversations for each session
  console.log('Creating GROUP conversations for sessions...');
  let sessionConversationsCreated = 0;

  for (let i = 0; i < createdSessions.length; i++) {
    const session = createdSessions[i];

    // Récupérer tous les joueurs de cette session
    const sessionPlayers = await prisma.sessionPlayers.findMany({
      select: { userUid: true },
      where: { sessionUid: session.uid },
    });

    // Créer un Set pour éviter les doublons
    const participantUids = new Set<string>();

    // Ajouter le créateur de la session
    participantUids.add(session.creatorUid);

    // Ajouter tous les joueurs
    sessionPlayers.forEach((player) => {
      participantUids.add(player.userUid);
    });

    // Créer la conversation de session
    const sessionConversation = await prisma.conversations.upsert({
      create: {
        name: session.title || `Session ${session.sport}`,
        sessionUid: session.uid,
        type: ConversationType.SESSION,
      },
      update: {
        name: session.title || `Session ${session.sport}`,
      },
      where: { sessionUid: session.uid },
    });

    // Ajouter tous les participants comme membres de la conversation
    for (const userUid of participantUids) {
      await prisma.conversationMembers.upsert({
        create: {
          conversationUid: sessionConversation.uid,
          isAdmin: userUid === session.creatorUid, // Le créateur est admin
          userUid: userUid,
        },
        update: {
          isAdmin: userUid === session.creatorUid,
        },
        where: {
          conversationUid_userUid: {
            conversationUid: sessionConversation.uid,
            userUid: userUid,
          },
        },
      });
    }

    sessionConversationsCreated++;

    if ((i + 1) % 50 === 0) {
      console.log(`Created group conversations for ${i + 1}/${createdSessions.length} sessions`);
    }
  }

  console.log(`${sessionConversationsCreated} group conversations created for sessions`);

  // Create friend relationships and invitations
  console.log('Creating friend relationships and invitations...');

  const friendRelationships = [];

  // Main users indices
  const mainUserIndices = [0, 1, 2, 3, 4]; // Seto, Yugi, Joey, Marik, Yuji

  // For each main user, create at least 20 friends from the additional users
  for (const mainUserIdx of mainUserIndices) {
    const mainUserUid = createdUsers[mainUserIdx].uid;

    // Connect to 25 random users from the additional users (indices 17-116)
    const friendIndices = [];
    for (let i = 0; i < 25; i++) {
      const randomIdx = 17 + Math.floor(Math.random() * 100); // Random from additional users
      if (!friendIndices.includes(randomIdx) && randomIdx !== mainUserIdx) {
        friendIndices.push(randomIdx);
      }
    }

    // Ensure we have at least 20 friends
    while (friendIndices.length < 20) {
      const randomIdx = 17 + Math.floor(Math.random() * 100);
      if (!friendIndices.includes(randomIdx) && randomIdx !== mainUserIdx) {
        friendIndices.push(randomIdx);
      }
    }

    // Create friendships for this main user
    for (let i = 0; i < friendIndices.length; i++) {
      const friendUid = createdUsers[friendIndices[i]].uid;

      // Ensure consistent ordering (smaller uid first)
      const [userUid1, userUid2] =
        mainUserUid < friendUid ? [mainUserUid, friendUid] : [friendUid, mainUserUid];

      // Vary the status: 80% accepted, 15% pending, 5% rejected
      let status: InvitationStatus = InvitationStatus.ACCEPTED;
      const rand = Math.random();
      if (rand < 0.15) {
        status = InvitationStatus.PENDING;
      } else if (rand < 0.2) {
        status = InvitationStatus.REJECTED;
      }

      friendRelationships.push({
        status,
        userUid1,
        userUid2,
      });
    }
  }

  // Create friendships between the 5 main users themselves
  for (let i = 0; i < mainUserIndices.length; i++) {
    for (let j = i + 1; j < mainUserIndices.length; j++) {
      const user1Uid = createdUsers[mainUserIndices[i]].uid;
      const user2Uid = createdUsers[mainUserIndices[j]].uid;

      const [userUid1, userUid2] =
        user1Uid < user2Uid ? [user1Uid, user2Uid] : [user2Uid, user1Uid];

      friendRelationships.push({
        status: InvitationStatus.ACCEPTED,
        userUid1,
        userUid2,
      });
    }
  }

  // Create some cross-friendships between other original characters
  const otherCharacterIndices = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  for (let i = 0; i < otherCharacterIndices.length; i++) {
    for (let j = i + 1; j < Math.min(i + 4, otherCharacterIndices.length); j++) {
      const user1Uid = createdUsers[otherCharacterIndices[i]].uid;
      const user2Uid = createdUsers[otherCharacterIndices[j]].uid;

      const [userUid1, userUid2] =
        user1Uid < user2Uid ? [user1Uid, user2Uid] : [user2Uid, user1Uid];

      friendRelationships.push({
        status: InvitationStatus.ACCEPTED,
        userUid1,
        userUid2,
      });
    }
  }

  // Upsert all friend relationships
  let createdCount = 0;
  for (const relationship of friendRelationships) {
    try {
      await prisma.friends.upsert({
        create: relationship,
        update: { status: relationship.status },
        where: {
          userUid1_userUid2: {
            userUid1: relationship.userUid1,
            userUid2: relationship.userUid2,
          },
        },
      });
      createdCount++;
    } catch (_e) {
      // Skip duplicates
    }
  }

  console.log(`${createdCount} friend relationships created`);

  // Create conversations and messages
  console.log('Creating conversations and messages...');

  const messageContents = [
    'Salut ! Ça te dit de jouer demain ?',
    'Ouais carrément ! Tu as un terrain en tête ?',
    'Je pensais au terrain près de République, il est pas mal',
    'Parfait ! On se retrouve à quelle heure ?',
    'Vers 15h ça te va ?',
    "C'est noté ! À demain alors",
    'Hey, tu es dispo cette semaine pour une partie ?',
    'Merci pour la session, on remet ça bientôt !',
    "J'ai trouvé un nouveau spot, je t'envoie l'adresse",
    "Tu penses qu'on peut organiser un match à 5v5 ?",
    'Je connais quelques personnes qui seraient intéressées',
    'Cool ! On pourrait faire ça samedi prochain',
    'Tu as vu le nouveau terrain qui a ouvert ?',
    "Ouais, il a l'air top ! On devrait y aller",
    'Franchement la dernière session était géniale',
    'Tu es plutôt basket ou foot ?',
    'Les deux ! Mais je préfère le basket',
    'On devrait créer un groupe pour organiser des sessions régulières',
    'Bonne idée ! Je vais en parler aux autres',
    'Tu as quel niveau en tennis ?',
  ];

  const additionalUsersStartIndex = 17; // Les utilisateurs additionnels commencent à l'index 17
  const numberOfConversationsPerUser = 5;
  const numberOfMessagesPerConversation = 5;

  let totalConversations = 0;
  let totalMessages = 0;

  // Pour chaque utilisateur (on prend tous les utilisateurs, pas seulement les principaux)
  for (let i = 0; i < createdUsers.length; i++) {
    const user = createdUsers[i];

    // Sélectionner 5 autres utilisateurs aléatoirement (parmi les additionalUsers)
    const potentialPartners = [];
    for (let j = additionalUsersStartIndex; j < createdUsers.length; j++) {
      if (j !== i) {
        potentialPartners.push(createdUsers[j]);
      }
    }

    // Mélanger et prendre 5 utilisateurs
    const shuffled = potentialPartners.sort(() => Math.random() - 0.5);
    const selectedPartners = shuffled.slice(
      0,
      Math.min(numberOfConversationsPerUser, shuffled.length),
    );

    for (const partner of selectedPartners) {
      // Vérifier si une conversation existe déjà entre ces deux utilisateurs
      const existingConversation = await prisma.conversations.findFirst({
        include: {
          conversationMembers: true,
        },
        where: {
          conversationMembers: {
            every: {
              OR: [{ userUid: user.uid }, { userUid: partner.uid }],
            },
          },
          type: ConversationType.PRIVATE,
        },
      });

      // Vérifier que la conversation a exactement 2 membres et qu'ils sont bien les deux utilisateurs qu'on veut
      const conversationExists =
        existingConversation &&
        existingConversation.conversationMembers.length === 2 &&
        existingConversation.conversationMembers.some((m) => m.userUid === user.uid) &&
        existingConversation.conversationMembers.some((m) => m.userUid === partner.uid);

      if (conversationExists) {
        continue; // Passer à la conversation suivante
      }

      // Créer une nouvelle conversation PRIVATE
      const conversation = await prisma.conversations.create({
        data: {
          type: ConversationType.PRIVATE,
        },
      });

      // Ajouter les deux utilisateurs comme membres de la conversation
      await prisma.conversationMembers.create({
        data: {
          conversationUid: conversation.uid,
          isAdmin: false,
          userUid: user.uid,
        },
      });

      await prisma.conversationMembers.create({
        data: {
          conversationUid: conversation.uid,
          isAdmin: false,
          userUid: partner.uid,
        },
      });

      totalConversations++;

      // Créer 5 messages alternés entre les deux utilisateurs
      const baseTime = new Date();
      baseTime.setDate(baseTime.getDate() - Math.floor(Math.random() * 30)); // Messages dans les 30 derniers jours

      for (let msgIndex = 0; msgIndex < numberOfMessagesPerConversation; msgIndex++) {
        const senderUid = msgIndex % 2 === 0 ? user.uid : partner.uid;
        const receiverUid = msgIndex % 2 === 0 ? partner.uid : user.uid;

        const messageTime = new Date(baseTime);
        messageTime.setMinutes(baseTime.getMinutes() + msgIndex * 10); // 10 minutes entre chaque message

        const messageContent = messageContents[Math.floor(Math.random() * messageContents.length)];

        const message = await prisma.messages.create({
          data: {
            content: messageContent,
            conversationUid: conversation.uid,
            createdAt: messageTime,
            globalStatus: MessageStatus.READ,
            senderUid: senderUid,
            type: MessageType.TEXT,
            updatedAt: messageTime,
          },
        });

        // Créer le MessageReceipt pour le destinataire
        await prisma.messageReceipts.create({
          data: {
            messageUid: message.uid,
            status: MessageStatus.READ,
            userUid: receiverUid,
          },
        });

        totalMessages++;
      }
    }

    if ((i + 1) % 20 === 0) {
      console.log(`Processed conversations for ${i + 1}/${createdUsers.length} users`);
    }
  }

  console.log(`${totalConversations} conversations created`);
  console.log(`${totalMessages} messages created`);

  // Create 10 notifications per user: 5 SESSION_INVITATION + 5 FRIEND_REQUEST
  console.log('Creating notifications for each user...');
  const sessionInvitationNotifs = Array.from({ length: 5 }, (_, i) => ({
    body: `You have been invited to join a session (seed #${i + 1})`,
    data: {},
    title: `Session invitation ${i + 1}`,
    type: NotificationType.SESSION_INVITATION,
  }));
  const friendRequestNotifs = Array.from({ length: 5 }, (_, i) => ({
    body: `Someone sent you a friend request (seed #${i + 1})`,
    data: {},
    title: `Friend request ${i + 1}`,
    type: NotificationType.FRIEND_REQUEST,
  }));

  for (const user of createdUsers) {
    const data = [
      ...sessionInvitationNotifs.map((n) => ({
        body: n.body,
        data: n.data,
        title: n.title,
        type: n.type,
        userUid: user.uid,
      })),
      ...friendRequestNotifs.map((n) => ({
        body: n.body,
        data: n.data,
        title: n.title,
        type: n.type,
        userUid: user.uid,
      })),
    ];
    await prisma.notifications.createMany({ data });
  }
  console.log(`${createdUsers.length * 10} notifications created (10 per user)`);

  // ─── Utilisateurs lifecycle (cron jobs) ───────────────────────────────────
  console.log('Creating lifecycle users for cron job testing...');

  const now = new Date();

  // Utilisateurs à anonymiser :
  //   - deletedAt <= maintenant  (la fenêtre du cron est satisfaite)
  //   - isAnonymized: false
  const usersToAnonymize = [
    {
      birthdate: new Date('1990-05-15T00:00:00Z'),
      deletedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // il y a 1 jour
      email: 'lifecycle.anon1@ludora-seed.internal',
      firstname: 'Anon',
      isAnonymized: false,
      lastname: 'PendingOne',
      sex: Sex.MALE,
    },
    {
      birthdate: new Date('1992-11-20T00:00:00Z'),
      deletedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // il y a 7 jours
      email: 'lifecycle.anon2@ludora-seed.internal',
      firstname: 'Anon',
      isAnonymized: false,
      lastname: 'PendingTwo',
      sex: Sex.FEMALE,
    },
    {
      birthdate: new Date('1985-03-08T00:00:00Z'),
      deletedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // il y a 30 jours
      email: 'lifecycle.anon3@ludora-seed.internal',
      firstname: 'Anon',
      isAnonymized: false,
      lastname: 'PendingThree',
      sex: Sex.MALE,
    },
  ];

  // Utilisateurs à purger :
  //   - deletedAt <= il y a 2 ans  (la fenêtre du cron est satisfaite)
  //   - isAnonymized: true          (déjà anonymisés par le premier cron)
  const threeYearsAgo = new Date(now);
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

  const twoYearsAndOneMonthAgo = new Date(now);
  twoYearsAndOneMonthAgo.setFullYear(twoYearsAndOneMonthAgo.getFullYear() - 2);
  twoYearsAndOneMonthAgo.setMonth(twoYearsAndOneMonthAgo.getMonth() - 1);

  const usersToPurge = [
    {
      bio: null,
      birthdate: null,
      deletedAt: threeYearsAgo,
      email: `anon_lifecycle_purge1@ludora.app`,
      firstname: 'Utilisateur',
      imageUrl: null,
      isAnonymized: true,
      isEmailVerified: false,
      lastname: 'Supprimé',
      password: null,
      phone: null,
      sex: Sex.MALE,
    },
    {
      bio: null,
      birthdate: null,
      deletedAt: twoYearsAndOneMonthAgo,
      email: `anon_lifecycle_purge2@ludora.app`,
      firstname: 'Utilisateur',
      imageUrl: null,
      isAnonymized: true,
      isEmailVerified: false,
      lastname: 'Supprimé',
      password: null,
      phone: null,
      sex: Sex.FEMALE,
    },
    {
      bio: null,
      birthdate: null,
      deletedAt: new Date('2022-01-01T00:00:00Z'),
      email: `anon_lifecycle_purge3@ludora.app`,
      firstname: 'Utilisateur',
      imageUrl: null,
      isAnonymized: true,
      isEmailVerified: false,
      lastname: 'Supprimé',
      password: null,
      phone: null,
      sex: Sex.MALE,
    },
  ];

  for (const u of usersToAnonymize) {
    await prisma.users.upsert({
      create: u,
      update: {},
      where: { email: u.email },
    });
    console.log(`Lifecycle (to anonymize): ${u.email} — deletedAt: ${u.deletedAt.toISOString()}`);
  }

  for (const u of usersToPurge) {
    await prisma.users.upsert({
      create: u,
      update: {},
      where: { email: u.email },
    });
    console.log(`Lifecycle (to purge):     ${u.email} — deletedAt: ${u.deletedAt?.toISOString()}`);
  }

  console.log('Lifecycle users created (3 to anonymize + 3 to purge)');
  // ──────────────────────────────────────────────────────────────────────────

  console.log('✅ Seed completed successfully!');
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
