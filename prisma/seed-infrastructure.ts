import { PrismaClient, Game_modes, Day_of_week } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}
/**
 * @description Seeds the infrastructure schema
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
      sport_id: createdSports[1].id,
    },
    {
      partner_id: createdPartners[1].id,
      sport_id: createdSports[1].id,
    },
    {
      partner_id: createdPartners[2].id,
      sport_id: createdSports[0].id,
    },
    {
      partner_id: createdPartners[2].id,
      sport_id: createdSports[1].id,
    },
    {
      partner_id: createdPartners[2].id,
      sport_id: createdSports[4].id,
    },
    {
      partner_id: createdPartners[2].id,
      sport_id: createdSports[5].id,
    },
    {
      partner_id: createdPartners[2].id,
      sport_id: createdSports[6].id,
    },
    {
      partner_id: createdPartners[3].id,
      sport_id: createdSports[2].id,
    },
    {
      partner_id: createdPartners[3].id,
      sport_id: createdSports[3].id,
    },
    {
      partner_id: createdPartners[3].id,
      sport_id: createdSports[4].id,
    },
    {
      partner_id: createdPartners[3].id,
      sport_id: createdSports[5].id,
    },
    {
      partner_id: createdPartners[3].id,
      sport_id: createdSports[6].id,
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
      sport_id: createdSports[1].id,
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      latitude: 48.9047454,
      longitude: 2.3789354,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[0].id,
      sport_id: createdSports[1].id,
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      latitude: 48.9047454,
      longitude: 2.3789354,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[0].id,
      sport_id: createdSports[1].id,
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      latitude: 48.9047454,
      longitude: 2.3789354,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[0].id,
      sport_id: createdSports[1].id,
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      latitude: 48.9047454,
      longitude: 2.3789354,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[0].id,
      sport_id: createdSports[1].id,
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      latitude: 48.9047454,
      longitude: 2.3789354,
      game_mode: 'THREE_V_THREE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[0].id,
      sport_id: createdSports[1].id,
      address: '3 Rue Pierre Larousse, 93300 Aubervilliers',
      latitude: 48.9047454,
      longitude: 2.3789354,
      game_mode: 'THREE_V_THREE',
      entry_fee: 0,
    },
    // ? THE ONE BALL
    {
      partner_id: createdPartners[1].id,
      sport_id: createdSports[1].id,
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      latitude: 48.8499,
      longitude: 2.5667,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[1].id,
      sport_id: createdSports[1].id,
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      latitude: 48.8499,
      longitude: 2.5667,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[1].id,
      sport_id: createdSports[1].id,
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      latitude: 48.8499,
      longitude: 2.5667,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[1].id,
      sport_id: createdSports[1].id,
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      latitude: 48.8499,
      longitude: 2.5667,
      game_mode: 'THREE_V_THREE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[1].id,
      sport_id: createdSports[1].id,
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      latitude: 48.8499,
      longitude: 2.5667,
      game_mode: 'THREE_V_THREE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[1].id,
      sport_id: createdSports[1].id,
      address: '38 Rue du Ballon, 93160 Noisy-le-Grand',
      latitude: 48.8499,
      longitude: 2.5667,
      game_mode: 'THREE_V_THREE',
      entry_fee: 0,
    },
    // ? STADIUM THIAS ORLY
    {
      partner_id: createdPartners[2].id,
      sport_id: createdSports[1].id,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[2].id,
      sport_id: createdSports[1].id,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[2].id,
      sport_id: createdSports[1].id,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[2].id,
      sport_id: createdSports[4].id,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[2].id,
      sport_id: createdSports[4].id,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[2].id,
      sport_id: createdSports[4].id,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[2].id,
      sport_id: createdSports[4].id,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[2].id,
      sport_id: createdSports[4].id,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[2].id,
      sport_id: createdSports[4].id,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[2].id,
      sport_id: createdSports[0].id,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[2].id,
      sport_id: createdSports[0].id,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[2].id,
      sport_id: createdSports[0].id,
      address: 'ZI SENIA, 2 rue du Courson, Thiais 94320, France',
      latitude: 48.7555,
      longitude: 2.4033,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[3].id,
      sport_id: createdSports[4].id,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.892,
      longitude: 2.236,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[3].id,
      sport_id: createdSports[4].id,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.892,
      longitude: 2.236,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[3].id,
      sport_id: createdSports[4].id,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.892,
      longitude: 2.236,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[3].id,
      sport_id: createdSports[2].id,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.892,
      longitude: 2.236,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[3].id,
      sport_id: createdSports[2].id,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.892,
      longitude: 2.236,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[3].id,
      sport_id: createdSports[5].id,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.892,
      longitude: 2.236,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
    {
      partner_id: createdPartners[3].id,
      sport_id: createdSports[5].id,
      address: '19 avenue de la Liberté, 92000 Nanterre',
      latitude: 48.892,
      longitude: 2.236,
      game_mode: 'FIVE_V_FIVE',
      entry_fee: 0,
    },
  ];

  const createdFields: { id: string; sport_id: string; partner_id: string; game_mode: string }[] = [];
  for (const field of fields) {
    const createdField = await prisma.fields.create({
      data: {
        partner: { connect: { id: field.partner_id } },
        sport: { connect: { id: field.sport_id } },
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
  //** ORGANISATIONS */
  //***************** */
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
