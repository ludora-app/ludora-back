import {
  ConversationType,
  FieldType,
  GameModes,
  InvitationStatus,
  MessageStatus,
  MessageType,
  PrismaClient,
  Sex,
  TeamLabels,
  TimePeriod,
  UserHourPreferenceType,
  UserType,
  VerificationStatus,
} from '../generated/prisma/client';
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
      where: { name: sport.name },
      update: {},
      create: sport,
    });
    createdSports.push(createdSport);
  }

  const partners = [
    {
      name: 'HOOPSFACTORY',
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      zipCode: '93300',
      city: 'Aubervilliers',
      department: '93',
      country: 'FR',
      latitude: 48.9047454,
      longitude: 2.3789354,
      phone: '01 72 59 88 99',
      email: 'contact@hoopsfactory.fr',
    },
    {
      name: 'The One Ball',
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      zipCode: '93160',
      city: 'Noisy-le-Grand',
      department: '93',
      country: 'FR',
      latitude: 48.83436030000001,
      longitude: 2.5689833,
      phone: '01 85 78 44 44',
      email: 'contact@theoneball.fr',
    },
    {
      name: 'Stadium Thias Orly',
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      zipCode: '94320',
      city: 'Thiais',
      department: '94',
      country: 'FR',
      latitude: 48.75098440000001,
      longitude: 2.3718412,
      phone: '01 46 87 64 24',
      email: 'stadium.thiais@gmail.com',
    },
    {
      name: 'Forrest Hill la Défense',
      address: '19 avenue de la Liberté, 92000 Nanterre',
      zipCode: '92000',
      city: 'Nanterre',
      department: '92',
      country: 'FR',
      latitude: 48.88837789999999,
      longitude: 2.2083152,
      phone: '01 47 24 67 67',
      email: 'contact@forest-hill.com',
    },
  ];

  const createdPartners: { uid: string; name: string }[] = [];
  for (const p of partners) {
    const createdPartner = await prisma.partners.upsert({
      where: { name: p.name },
      update: {},
      create: p,
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
      where: {
        partnerUid_sport: {
          partnerUid: relation.partnerUid,
          sport: relation.sport,
        },
      },
      update: {},
      create: relation,
    });
  }
  console.log('Partner sports relations populated');

  // Création des terrains PRIVÉS (avec partenaire) et PUBLICS (sans partenaire)
  const fields = [
    // ? HOOPFACTORY - Terrains PRIVÉS
    {
      type: FieldType.PRIVATE,
      partnerUid: createdPartners[0].uid,
      sport: createdSports[1].name,
      name: 'Hoopsfactory - Court 1',
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      shortAddress: '3 Rue Pierre Larousse',
      zipCode: '93300',
      city: 'Aubervilliers',
      department: '93',
      country: 'FR',
      latitude: 48.9047454,
      longitude: 2.3789354,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PRIVATE,
      partnerUid: createdPartners[0].uid,
      sport: createdSports[1].name,
      name: 'Hoopsfactory - Court 2',
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      shortAddress: '3 Rue Pierre Larousse',
      zipCode: '93300',
      city: 'Aubervilliers',
      department: '93',
      country: 'FR',
      latitude: 48.9047454,
      longitude: 2.3789354,
      status: VerificationStatus.APPROVED,
    },
    // ? THE ONE BALL - Terrains PRIVÉS
    {
      type: FieldType.PRIVATE,
      partnerUid: createdPartners[1].uid,
      sport: createdSports[1].name,
      name: 'The One Ball - Court 1',
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      shortAddress: '38 Rue du Ballon',
      zipCode: '93160',
      city: 'Noisy-le-Grand',
      department: '93',
      country: 'FR',
      latitude: 48.83436030000001,
      longitude: 2.5689833,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PRIVATE,
      partnerUid: createdPartners[1].uid,
      sport: createdSports[1].name,
      name: 'The One Ball - Court 2',
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      shortAddress: '38 Rue du Ballon',
      zipCode: '93160',
      city: 'Noisy-le-Grand',
      department: '93',
      country: 'FR',
      latitude: 48.83436030000001,
      longitude: 2.5689833,
      status: VerificationStatus.APPROVED,
    },
    // ? STADIUM THIAS ORLY - Terrains PRIVÉS
    {
      type: FieldType.PRIVATE,
      partnerUid: createdPartners[2].uid,
      sport: createdSports[0].name,
      name: 'Stadium Thiais - Terrain Football 1',
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      shortAddress: '2 rue du Courson',
      zipCode: '94320',
      city: 'Thiais',
      department: '94',
      country: 'FR',
      latitude: 48.75098440000001,
      longitude: 2.3718412,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PRIVATE,
      partnerUid: createdPartners[2].uid,
      sport: createdSports[1].name,
      name: 'Stadium Thiais - Court Basket',
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      shortAddress: '2 rue du Courson',
      zipCode: '94320',
      city: 'Thiais',
      department: '94',
      country: 'FR',
      latitude: 48.75098440000001,
      longitude: 2.3718412,
      status: VerificationStatus.APPROVED,
    },
    // ? FOREST HILL - Terrains PRIVÉS
    {
      type: FieldType.PRIVATE,
      partnerUid: createdPartners[3].uid,
      sport: createdSports[2].name,
      name: 'Forest Hill - Court Tennis 1',
      address: '19 avenue de la Liberté, 92000 Nanterre',
      shortAddress: '19 avenue de la Liberté',
      zipCode: '92000',
      city: 'Nanterre',
      department: '92',
      country: 'FR',
      latitude: 48.88837789999999,
      longitude: 2.2083152,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PRIVATE,
      partnerUid: createdPartners[3].uid,
      sport: createdSports[4].name,
      name: 'Forest Hill - Court Padel 1',
      address: '19 avenue de la Liberté, 92000 Nanterre',
      shortAddress: '19 avenue de la Liberté',
      zipCode: '92000',
      city: 'Nanterre',
      department: '92',
      country: 'FR',
      latitude: 48.88837789999999,
      longitude: 2.2083152,
      status: VerificationStatus.APPROVED,
    },
    // ? Terrains PUBLICS (sans partenaire) - 50 terrains
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[0].name, // FOOTBALL
      name: 'Terrain Public - Parc des Buttes-Chaumont',
      address: '1 Rue Botzaris, 75019 Paris',
      shortAddress: '1 Rue Botzaris',
      zipCode: '75019',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8806,
      longitude: 2.3844,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[1].name, // BASKETBALL
      name: 'Playground Public - Jardin du Luxembourg',
      address: '6 Rue de Médicis, 75006 Paris',
      shortAddress: '6 Rue de Médicis',
      zipCode: '75006',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8462,
      longitude: 2.3372,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[0].name, // FOOTBALL
      name: 'Stade Municipal Bagnolet',
      address: '15 Avenue du Stade, 93170 Bagnolet',
      shortAddress: '15 Avenue du Stade',
      zipCode: '93170',
      city: 'Bagnolet',
      department: '93',
      country: 'FR',
      latitude: 48.8645,
      longitude: 2.4164,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[1].name, // BASKETBALL
      name: 'Terrain Basket - Parc de la Villette',
      address: '211 Avenue Jean Jaurès, 75019 Paris',
      shortAddress: '211 Avenue Jean Jaurès',
      zipCode: '75019',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8938,
      longitude: 2.39,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[0].name, // FOOTBALL
      name: 'Stade Georges Carpentier',
      address: '81 Boulevard Kellermann, 75013 Paris',
      shortAddress: '81 Boulevard Kellermann',
      zipCode: '75013',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8213,
      longitude: 2.3502,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[3].name, // VOLLEYBALL
      name: 'Terrain Volley - Berges de Seine',
      address: 'Quai de la Seine, 75019 Paris',
      shortAddress: 'Quai de la Seine',
      zipCode: '75019',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8841,
      longitude: 2.3797,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[0].name, // FOOTBALL
      name: 'Terrain Synthétique Montreuil',
      address: 'Rue Gaston Monmousseau, 93100 Montreuil',
      shortAddress: 'Rue Gaston Monmousseau',
      zipCode: '93100',
      city: 'Montreuil',
      department: '93',
      country: 'FR',
      latitude: 48.8636,
      longitude: 2.4434,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[1].name, // BASKETBALL
      name: 'City Stade République',
      address: 'Place de la République, 75011 Paris',
      shortAddress: 'Place de la République',
      zipCode: '75011',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8677,
      longitude: 2.3638,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[0].name, // FOOTBALL
      name: 'Stade Léo Lagrange Vincennes',
      address: 'Route de la Pyramide, 94300 Vincennes',
      shortAddress: 'Route de la Pyramide',
      zipCode: '94300',
      city: 'Vincennes',
      department: '94',
      country: 'FR',
      latitude: 48.8386,
      longitude: 2.4276,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[1].name, // BASKETBALL
      name: 'Terrain Basket - Parc Montsouris',
      address: 'Avenue Reille, 75014 Paris',
      shortAddress: 'Avenue Reille',
      zipCode: '75014',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8225,
      longitude: 2.3372,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[0].name, // FOOTBALL
      name: 'Stade Jules Ladoumègue',
      address: '28 Boulevard Mortier, 75020 Paris',
      shortAddress: '28 Boulevard Mortier',
      zipCode: '75020',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8677,
      longitude: 2.4068,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[2].name, // TENNIS
      name: 'Courts Tennis - Jardin du Ranelagh',
      address: 'Avenue Ingres, 75016 Paris',
      shortAddress: 'Avenue Ingres',
      zipCode: '75016',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8568,
      longitude: 2.2715,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[0].name, // FOOTBALL
      name: 'Terrain Football Pantin',
      address: 'Avenue Édouard Vaillant, 93500 Pantin',
      shortAddress: 'Avenue Édouard Vaillant',
      zipCode: '93500',
      city: 'Pantin',
      department: '93',
      country: 'FR',
      latitude: 48.8973,
      longitude: 2.4013,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[1].name, // BASKETBALL
      name: 'Playground Stalingrad',
      address: 'Place de la Bataille de Stalingrad, 75019 Paris',
      shortAddress: 'Place de la Bataille de Stalingrad',
      zipCode: '75019',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8838,
      longitude: 2.3694,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[0].name, // FOOTBALL
      name: 'Stade Municipal Aubervilliers',
      address: 'Rue du Moutier, 93300 Aubervilliers',
      shortAddress: 'Rue du Moutier',
      zipCode: '93300',
      city: 'Aubervilliers',
      department: '93',
      country: 'FR',
      latitude: 48.9119,
      longitude: 2.3822,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[3].name, // VOLLEYBALL
      name: 'Terrain Volley - Parc des Princes',
      address: '24 Rue du Commandant Guilbaud, 75016 Paris',
      shortAddress: '24 Rue du Commandant Guilbaud',
      zipCode: '75016',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8414,
      longitude: 2.2531,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[0].name, // FOOTBALL
      name: 'City Stade Bobigny',
      address: 'Avenue Paul Vaillant-Couturier, 93000 Bobigny',
      shortAddress: 'Avenue Paul Vaillant-Couturier',
      zipCode: '93000',
      city: 'Bobigny',
      department: '93',
      country: 'FR',
      latitude: 48.9078,
      longitude: 2.4389,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[1].name, // BASKETBALL
      name: "Terrain Basket - Canal de l'Ourcq",
      address: 'Quai de la Marne, 75019 Paris',
      shortAddress: 'Quai de la Marne',
      zipCode: '75019',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8876,
      longitude: 2.3842,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[0].name, // FOOTBALL
      name: 'Stade Émile Anthoine',
      address: '9 Rue Jean Rey, 75015 Paris',
      shortAddress: '9 Rue Jean Rey',
      zipCode: '75015',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8535,
      longitude: 2.2917,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[1].name, // BASKETBALL
      name: 'Playground Belleville',
      address: 'Rue de Belleville, 75020 Paris',
      shortAddress: 'Rue de Belleville',
      zipCode: '75020',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8722,
      longitude: 2.3894,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[0].name, // FOOTBALL
      name: 'Terrain Synthétique Saint-Denis',
      address: 'Rue de la République, 93200 Saint-Denis',
      shortAddress: 'Rue de la République',
      zipCode: '93200',
      city: 'Saint-Denis',
      department: '93',
      country: 'FR',
      latitude: 48.9362,
      longitude: 2.3574,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[2].name, // TENNIS
      name: 'Tennis Municipal Issy',
      address: 'Rue du Général Leclerc, 92130 Issy-les-Moulineaux',
      shortAddress: 'Rue du Général Leclerc',
      zipCode: '92130',
      city: 'Issy-les-Moulineaux',
      department: '92',
      country: 'FR',
      latitude: 48.8241,
      longitude: 2.2699,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[0].name, // FOOTBALL
      name: 'Stade Pershing Vincennes',
      address: 'Bois de Vincennes, 75012 Paris',
      shortAddress: 'Bois de Vincennes',
      zipCode: '75012',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8284,
      longitude: 2.4451,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[1].name, // BASKETBALL
      name: 'City Stade Ménilmontant',
      address: 'Rue de Ménilmontant, 75020 Paris',
      shortAddress: 'Rue de Ménilmontant',
      zipCode: '75020',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8692,
      longitude: 2.3869,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[0].name, // FOOTBALL
      name: 'Terrain Football Clichy',
      address: 'Boulevard Jean Jaurès, 92110 Clichy',
      shortAddress: 'Boulevard Jean Jaurès',
      zipCode: '92110',
      city: 'Clichy',
      department: '92',
      country: 'FR',
      latitude: 48.9044,
      longitude: 2.3059,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[1].name, // BASKETBALL
      name: 'Playground Jaurès',
      address: 'Place de la Bataille de Stalingrad, 75010 Paris',
      shortAddress: 'Place de la Bataille de Stalingrad',
      zipCode: '75010',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8813,
      longitude: 2.3699,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[0].name, // FOOTBALL
      name: 'Stade Municipal Levallois',
      address: 'Rue Aristide Briand, 92300 Levallois-Perret',
      shortAddress: 'Rue Aristide Briand',
      zipCode: '92300',
      city: 'Levallois-Perret',
      department: '92',
      country: 'FR',
      latitude: 48.8938,
      longitude: 2.2877,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[3].name, // VOLLEYBALL
      name: 'Terrain Volley - Parc Monceau',
      address: 'Boulevard de Courcelles, 75008 Paris',
      shortAddress: 'Boulevard de Courcelles',
      zipCode: '75008',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8799,
      longitude: 2.3089,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[0].name, // FOOTBALL
      name: 'City Stade Ivry',
      address: 'Avenue Georges Gosnat, 94200 Ivry-sur-Seine',
      shortAddress: 'Avenue Georges Gosnat',
      zipCode: '94200',
      city: 'Ivry-sur-Seine',
      department: '94',
      country: 'FR',
      latitude: 48.8136,
      longitude: 2.3854,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[1].name, // BASKETBALL
      name: 'Terrain Basket - Parc de Bercy',
      address: 'Rue de Bercy, 75012 Paris',
      shortAddress: 'Rue de Bercy',
      zipCode: '75012',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.837,
      longitude: 2.3806,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[0].name, // FOOTBALL
      name: 'Stade Roger Le Gall',
      address: "Avenue Maurice d'Ocagne, 75014 Paris",
      shortAddress: "Avenue Maurice d'Ocagne",
      zipCode: '75014',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8252,
      longitude: 2.3153,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[1].name, // BASKETBALL
      name: 'Playground Oberkampf',
      address: 'Rue Oberkampf, 75011 Paris',
      shortAddress: 'Rue Oberkampf',
      zipCode: '75011',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8651,
      longitude: 2.3762,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[0].name, // FOOTBALL
      name: 'Terrain Football Villejuif',
      address: 'Avenue de Stalingrad, 94800 Villejuif',
      shortAddress: 'Avenue de Stalingrad',
      zipCode: '94800',
      city: 'Villejuif',
      department: '94',
      country: 'FR',
      latitude: 48.789,
      longitude: 2.3662,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[2].name, // TENNIS
      name: 'Tennis Public Boulogne',
      address: 'Route de la Reine, 92100 Boulogne-Billancourt',
      shortAddress: 'Route de la Reine',
      zipCode: '92100',
      city: 'Boulogne-Billancourt',
      department: '92',
      country: 'FR',
      latitude: 48.8352,
      longitude: 2.2428,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[0].name, // FOOTBALL
      name: 'City Stade Créteil',
      address: 'Avenue du Général de Gaulle, 94000 Créteil',
      shortAddress: 'Avenue du Général de Gaulle',
      zipCode: '94000',
      city: 'Créteil',
      department: '94',
      country: 'FR',
      latitude: 48.7791,
      longitude: 2.4597,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[1].name, // BASKETBALL
      name: 'Terrain Basket - Parc Floral',
      address: 'Route de la Pyramide, 75012 Paris',
      shortAddress: 'Route de la Pyramide',
      zipCode: '75012',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8375,
      longitude: 2.4447,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[0].name, // FOOTBALL
      name: 'Stade Pierre de Coubertin',
      address: '82 Avenue Georges Lafont, 75016 Paris',
      shortAddress: '82 Avenue Georges Lafont',
      zipCode: '75016',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8452,
      longitude: 2.2708,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[1].name, // BASKETBALL
      name: 'Playground Crimée',
      address: 'Avenue de Flandre, 75019 Paris',
      shortAddress: 'Avenue de Flandre',
      zipCode: '75019',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8913,
      longitude: 2.376,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[0].name, // FOOTBALL
      name: 'Terrain Synthétique Champigny',
      address: 'Rue du Général Leclerc, 94500 Champigny-sur-Marne',
      shortAddress: 'Rue du Général Leclerc',
      zipCode: '94500',
      city: 'Champigny-sur-Marne',
      department: '94',
      country: 'FR',
      latitude: 48.817,
      longitude: 2.495,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[3].name, // VOLLEYBALL
      name: 'Terrain Volley - Bois de Boulogne',
      address: 'Allée de Longchamp, 75016 Paris',
      shortAddress: 'Allée de Longchamp',
      zipCode: '75016',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8626,
      longitude: 2.2444,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[0].name, // FOOTBALL
      name: 'City Stade Maisons-Alfort',
      address: 'Avenue du Général Leclerc, 94700 Maisons-Alfort',
      shortAddress: 'Avenue du Général Leclerc',
      zipCode: '94700',
      city: 'Maisons-Alfort',
      department: '94',
      country: 'FR',
      latitude: 48.8033,
      longitude: 2.4368,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[1].name, // BASKETBALL
      name: 'Terrain Basket - Parc Kellermann',
      address: 'Boulevard Kellermann, 75013 Paris',
      shortAddress: 'Boulevard Kellermann',
      zipCode: '75013',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8195,
      longitude: 2.3533,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[0].name, // FOOTBALL
      name: 'Stade Sébastien Charléty',
      address: '99 Boulevard Kellermann, 75013 Paris',
      shortAddress: '99 Boulevard Kellermann',
      zipCode: '75013',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8182,
      longitude: 2.3461,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[1].name, // BASKETBALL
      name: 'Playground Bastille',
      address: 'Place de la Bastille, 75011 Paris',
      shortAddress: 'Place de la Bastille',
      zipCode: '75011',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8532,
      longitude: 2.3693,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[0].name, // FOOTBALL
      name: 'Terrain Football Colombes',
      address: "Avenue de l'Agent Sarre, 92700 Colombes",
      shortAddress: "Avenue de l'Agent Sarre",
      zipCode: '92700',
      city: 'Colombes',
      department: '92',
      country: 'FR',
      latitude: 48.9223,
      longitude: 2.2531,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[2].name, // TENNIS
      name: 'Tennis Municipal Vanves',
      address: 'Rue de la République, 92170 Vanves',
      shortAddress: 'Rue de la République',
      zipCode: '92170',
      city: 'Vanves',
      department: '92',
      country: 'FR',
      latitude: 48.8219,
      longitude: 2.2906,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[0].name, // FOOTBALL
      name: 'City Stade Vitry',
      address: 'Avenue Paul Vaillant-Couturier, 94400 Vitry-sur-Seine',
      shortAddress: 'Avenue Paul Vaillant-Couturier',
      zipCode: '94400',
      city: 'Vitry-sur-Seine',
      department: '94',
      country: 'FR',
      latitude: 48.7879,
      longitude: 2.3939,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[1].name, // BASKETBALL
      name: 'Terrain Basket - Parc André Citroën',
      address: 'Rue Balard, 75015 Paris',
      shortAddress: 'Rue Balard',
      zipCode: '75015',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8429,
      longitude: 2.275,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[0].name, // FOOTBALL
      name: 'Stade Municipal Neuilly',
      address: "Boulevard d'Inkermann, 92200 Neuilly-sur-Seine",
      shortAddress: "Boulevard d'Inkermann",
      zipCode: '92200',
      city: 'Neuilly-sur-Seine',
      department: '92',
      country: 'FR',
      latitude: 48.8869,
      longitude: 2.2676,
      status: VerificationStatus.APPROVED,
    },
    {
      type: FieldType.PUBLIC,
      partnerUid: null,
      sport: createdSports[1].name, // BASKETBALL
      name: 'Playground Gambetta',
      address: 'Place Gambetta, 75020 Paris',
      shortAddress: 'Place Gambetta',
      zipCode: '75020',
      city: 'Paris',
      department: '75',
      country: 'FR',
      latitude: 48.8644,
      longitude: 2.3989,
      status: VerificationStatus.APPROVED,
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
        uid: f.uid,
        sports: f.fieldSports.map((fs) => fs.sport),
        partnerUid: f.partnerUid,
        type: f.type,
        name: f.name,
      })),
    );
  } else {
    for (const field of fields) {
      const createdField = await prisma.fields.create({
        data: {
          type: field.type,
          partner: field.partnerUid ? { connect: { uid: field.partnerUid } } : undefined,
          name: field.name,
          address: field.address,
          shortAddress: field.shortAddress,
          zipCode: field.zipCode,
          city: field.city,
          department: field.department,
          country: field.country,
          latitude: field.latitude,
          longitude: field.longitude,
          status: field.status,
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
        uid: createdField.uid,
        sports: [field.sport],
        partnerUid: createdField.partnerUid,
        type: createdField.type,
        name: createdField.name,
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
      // Créer des créneaux pour les 30 prochains jours
      for (let day = 0; day < 30; day++) {
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
              fieldUid: field.uid,
              startTime: startTime,
              endTime: endTime,
              gameMode: gameMode,
              price: Math.random() > 0.5 ? 20.0 : 25.0, // Prix variable
              isReserved: false,
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
      bio: "Maitre des shikigamis et eleve de l'ecole d'exorcisme",
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
      bio: "L'exorciste le plus puissant avec les Six Yeux",
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
      email: 'ichigo.kurosaki@hotmail.fr',
      password: await hashPassword('Ichigo398!'),
      firstname: 'Ichigo',
      lastname: 'Kurosaki',
      birthdate: new Date('1998-08-02T00:00:00Z'),
      sex: Sex.FEMALE,
      bio: 'Shinigami qui a obtenu les pouvoirs des Hollows',
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
      email: 'zoro.roronoa@hotmail.fr',
      password: await hashPassword('Zoro398!'),
      firstname: 'Zoro',
      lastname: 'Roronoa',
      birthdate: new Date('1998-07-03T00:00:00Z'),
      sex: Sex.MALE,
      bio: 'Chasseur de têtes et expert en sabre',
      phone: '+33609032666',
      imageUrl: '1738433236109explore2.png',
    },
    {
      email: 'aizen.sosuke@hotmail.fr',
      password: await hashPassword('Aizen398!'),
      firstname: 'Aizen',
      lastname: 'Sosuke',
      birthdate: new Date('1998-02-06T00:00:00Z'),
      sex: Sex.MALE,
      bio: 'Seigneur des Hollows et des Shinigamis',
      phone: '+33609032667',
      imageUrl: '1738433236109explore2.png',
    },
  ];

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
      email,
      password: await hashPassword('Password123!'),
      firstname: firstName,
      lastname: lastName,
      birthdate: new Date(
        1990 + Math.floor(Math.random() * 30),
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28),
      ),
      sex: Math.random() > 0.5 ? Sex.MALE : Sex.FEMALE,
      bio: `Passionné de sports et de jeux en équipe`,
      phone: `+336${Math.floor(Math.random() * 100000000)
        .toString()
        .padStart(8, '0')}`,
      imageUrl: '1738433236109explore2.png',
    });
  }

  users.push(...additionalUsers);

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
          where: {
            userUid_sport: {
              userUid: user.uid,
              sport: sport.name,
            },
          },
          update: {},
          create: {
            userUid: user.uid,
            sport: sport.name,
            level: level,
          },
        });
        createdUserSports.push(userSport);
      } catch (e) {
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
            userUid: user.uid,
            type: UserHourPreferenceType.RECURRENT,
            dayOfWeek: dayOfWeek,
            timePeriod: timePeriod as TimePeriod,
          },
        });
        createdUserHourPreferences.push(userHourPreference);
      } catch (e) {
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
      where: {
        isReserved: false,
      },
      take: 50, // Augmenté pour plus de diversité
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
          fieldUid: field.uid,
          slotUid: slot.uid,
          sport: fieldSport,
          gameMode: gameMode,
          level: Math.floor(Math.random() * 3) + 1, // Random level 1-3
          startDate: startDate,
          endDate: endDate,
          title: `Session ${fieldSport} - ${field.name}`,
          maxPlayersPerTeam,
          minPlayersPerTeam,
          teamsPerGame: 2,
          description: `Session de ${fieldSport} sur terrain privé`,
        },
      });

      // Marquer le slot comme réservé
      await prisma.fieldSlots.update({
        where: { uid: slot.uid },
        data: { isReserved: true },
      });

      createdSessions.push(createdSession);
    }

    // Créer 100 sessions pour terrains PUBLICS (sans slot, gratuit)
    console.log('Creating 100 sessions for PUBLIC fields (free) without slots...');

    for (let i = 0; i < 100; i++) {
      const daysAhead = Math.floor(Math.random() * 30) + 1; // 1-30 jours
      const startDate = new Date(today);
      startDate.setDate(today.getDate() + daysAhead);
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
          fieldUid: field.uid,
          slotUid: null, // Pas de slot pour les terrains publics
          sport: fieldSport,
          gameMode: gameMode,
          level: Math.floor(Math.random() * 3) + 1, // Random level 1-3
          startDate: startDate,
          endDate: endDate,
          title: `Session ${fieldSport} - ${field.name || 'Terrain public'}`,
          maxPlayersPerTeam,
          minPlayersPerTeam,
          teamsPerGame: 2,
          description: `Session gratuite de ${fieldSport} sur terrain public`,
        },
      });
      createdSessions.push(createdSession);
    }

    console.log(`${createdSessions.length} sessions created (50 paid private + 100 free public)`);

    // Créer des sessions spécifiques pour les terrains publics cmjpyq9ok000j57po1wk8y0mi et cmjpyq9om000l57pohqm85tqy
    // avec des horaires et durées variées
    console.log('Creating specific sessions for public fields with varied times and durations...');
    const specificFieldUids = ['cmjpyq9ok000j57po1wk8y0mi', 'cmjpyq9om000l57pohqm85tqy'];
    const days = [0, 1]; // 0 = aujourd'hui, 1 = demain

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

          const dayLabel = dayOffset === 0 ? "aujourd'hui" : 'demain';

          const createdSession = await prisma.sessions.create({
            data: {
              creatorUid: creator.uid,
              fieldUid: field.uid,
              slotUid: null,
              sport: fieldSport,
              gameMode: gameMode,
              level: Math.floor(Math.random() * 3) + 1, // Random level 1-3
              startDate: startDate,
              endDate: endDate,
              title: `Session ${fieldSport} ${dayLabel} à ${randomHour}h - ${field.name || 'Terrain public'}`,
              maxPlayersPerTeam,
              minPlayersPerTeam,
              teamsPerGame: 2,
              description: `Session gratuite de ${fieldSport} sur terrain public ${dayLabel} à ${randomHour}h`,
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
  const createdTeams: { uid: string; sessionUid: string; teamLabel: TeamLabels }[] = [];
  for (let i = 0; i < createdSessions.length; i++) {
    const session = createdSessions[i];

    // Team A
    const teamA = await prisma.sessionTeams.upsert({
      where: {
        sessionUid_teamLabel: {
          sessionUid: session.uid,
          teamLabel: TeamLabels.A,
        },
      },
      update: {},
      create: {
        sessionUid: session.uid,
        teamLabel: TeamLabels.A,
        teamName: 'Team A',
      },
    });
    createdTeams.push({ uid: teamA.uid, sessionUid: session.uid, teamLabel: TeamLabels.A });

    // Team B
    const teamB = await prisma.sessionTeams.upsert({
      where: {
        sessionUid_teamLabel: {
          sessionUid: session.uid,
          teamLabel: TeamLabels.B,
        },
      },
      update: {},
      create: {
        sessionUid: session.uid,
        teamLabel: TeamLabels.B,
        teamName: 'Team B',
      },
    });
    createdTeams.push({ uid: teamB.uid, sessionUid: session.uid, teamLabel: TeamLabels.B });

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
            where: {
              sessionUid_userUid: {
                sessionUid: session.uid,
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
      where: { sessionUid: session.uid },
      select: { userUid: true },
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
    const groupConversation = await prisma.conversations.create({
      data: {
        type: ConversationType.SESSION,
        sessionUid: session.uid,
        name: session.title || `Session ${session.sport}`,
      },
    });

    // Ajouter tous les participants comme membres de la conversation
    for (const userUid of participantUids) {
      await prisma.conversationMembers.create({
        data: {
          conversationUid: groupConversation.uid,
          userUid: userUid,
          isAdmin: userUid === session.creatorUid, // Le créateur est admin
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
        userUid1,
        userUid2,
        status,
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
        userUid1,
        userUid2,
        status: InvitationStatus.ACCEPTED,
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
        userUid1,
        userUid2,
        status: InvitationStatus.ACCEPTED,
      });
    }
  }

  // Upsert all friend relationships
  let createdCount = 0;
  for (const relationship of friendRelationships) {
    try {
      await prisma.friends.upsert({
        where: {
          userUid1_userUid2: {
            userUid1: relationship.userUid1,
            userUid2: relationship.userUid2,
          },
        },
        update: { status: relationship.status },
        create: relationship,
      });
      createdCount++;
    } catch (e) {
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
        where: {
          type: ConversationType.PRIVATE,
          conversationMembers: {
            every: {
              OR: [{ userUid: user.uid }, { userUid: partner.uid }],
            },
          },
        },
        include: {
          conversationMembers: true,
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
          userUid: user.uid,
          isAdmin: false,
        },
      });

      await prisma.conversationMembers.create({
        data: {
          conversationUid: conversation.uid,
          userUid: partner.uid,
          isAdmin: false,
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
            conversationUid: conversation.uid,
            senderUid: senderUid,
            content: messageContent,
            globalStatus: MessageStatus.READ,
            type: MessageType.TEXT,
            createdAt: messageTime,
            updatedAt: messageTime,
          },
        });

        // Créer le MessageReceipt pour le destinataire
        await prisma.messageReceipts.create({
          data: {
            messageUid: message.uid,
            userUid: receiverUid,
            status: MessageStatus.READ,
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
  console.log('✅ Seed completed successfully!');
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
