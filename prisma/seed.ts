import {
  FieldType,
  GameModes,
  PrismaClient,
  Sex,
  TeamLabels,
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
      latitude: 48.8644,
      longitude: 2.3989,
      status: VerificationStatus.APPROVED,
    },
  ];

  const createdFields: {
    uid: string;
    sport: string;
    partnerUid: string | null;
    type: FieldType;
    name: string | null;
  }[] = [];

  // Check if fields already exist
  const existingFields = await prisma.fields.findMany();

  if (existingFields.length > 0) {
    console.log(`Found ${existingFields.length} existing fields, skipping field creation`);
    createdFields.push(...existingFields);
  } else {
    for (const field of fields) {
      const createdField = await prisma.fields.create({
        data: {
          type: field.type,
          partner: field.partnerUid ? { connect: { uid: field.partnerUid } } : undefined,
          sportRelation: { connect: { name: field.sport } },
          name: field.name,
          address: field.address,
          shortAddress: field.address,
          latitude: field.latitude,
          longitude: field.longitude,
          status: field.status,
        },
      });
      console.log(`Field ${createdField.name} (${createdField.type}) has been created`);
      createdFields.push(createdField);
    }
  }

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

          // Varier les gameModes
          const gameModes = [GameModes.FIVE_V_FIVE, GameModes.THREE_V_THREE, GameModes.FOUR_V_FOUR];
          const gameMode = gameModes[hour % gameModes.length];

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

  // Generate sessions with startTime and duration
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
      const gameMode = allGameModes[i % allGameModes.length];

      const startDate = slot.startTime;
      const endDate = slot.endTime;

      const createdSession = await prisma.sessions.create({
        data: {
          creatorUid: creator.uid,
          fieldUid: field.uid,
          slotUid: slot.uid,
          sport: field.sport,
          gameMode: gameMode,
          startDate: startDate,
          endDate: endDate,
          title: `Session ${field.sport} - ${field.name}`,
          maxPlayersPerTeam: 5,
          minPlayersPerTeam: 3,
          teamsPerGame: 2,
          description: `Session de ${field.sport} sur terrain privé`,
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
      const gameMode = allGameModes[i % allGameModes.length];

      const createdSession = await prisma.sessions.create({
        data: {
          creatorUid: creator.uid,
          fieldUid: field.uid,
          slotUid: null, // Pas de slot pour les terrains publics
          sport: field.sport,
          gameMode: gameMode,
          startDate: startDate,
          endDate: endDate,
          title: `Session ${field.sport} - ${field.name || 'Terrain public'}`,
          maxPlayersPerTeam: 5,
          minPlayersPerTeam: 3,
          teamsPerGame: 2,
          description: `Session gratuite de ${field.sport} sur terrain public`,
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
          const gameMode = allGameModes[j % allGameModes.length];

          const dayLabel = dayOffset === 0 ? "aujourd'hui" : 'demain';

          const createdSession = await prisma.sessions.create({
            data: {
              creatorUid: creator.uid,
              fieldUid: field.uid,
              slotUid: null,
              sport: field.sport,
              gameMode: gameMode,
              startDate: startDate,
              endDate: endDate,
              title: `Session ${field.sport} ${dayLabel} à ${randomHour}h - ${field.name || 'Terrain public'}`,
              maxPlayersPerTeam: 5,
              minPlayersPerTeam: 3,
              teamsPerGame: 2,
              description: `Session gratuite de ${field.sport} sur terrain public ${dayLabel} à ${randomHour}h`,
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

  // Add some players to random teams
  console.log('Adding sample players to some teams...');
  const createdPlayers: { sessionUid: string; teamUid: string; userUid: string }[] = [];

  // Add players to the first 20 sessions
  for (let i = 0; i < 20; i++) {
    const session = createdSessions[i];
    const sessionTeams = createdTeams.filter((t) => t.sessionUid === session.uid);

    for (const team of sessionTeams) {
      const numPlayers = 2 + Math.floor(Math.random() * 2); // 2-3 players
      for (let j = 0; j < numPlayers; j++) {
        const user = createdUsers[(i * 2 + j) % createdUsers.length];
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
  }

  console.log(`${createdPlayers.length} players added to sessions`);
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
