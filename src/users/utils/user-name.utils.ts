export class UserNameUtils {
  private static readonly ADJECTIVES = [
    'Epic',
    'Elite',
    'Swift',
    'Brave',
    'Mighty',
    'Radiant',
    'Wild',
    'Great',
    'Mega',
    'Super',
    'Ultra',
    'Legendary',
    'Master',
    'Expert',
    'Golden',
    'Silver',
    'Bronze',
    'Iron',
  ];

  private static readonly LUDORA_NAMES = [
    'Ludorien',
    'Ludonaute',
    'Explorer',
    'Gamer',
    'Challenger',
    'Champion',
    'Athlete',
    'Pro',
    'Rookie',
    'Legend',
    'Titan',
    'Olympian',
    'Striker',
    'Defender',
    'Ace',
    'MVP',
  ];

  /**
   * Returns a random adjective for a first name.
   * @returns {string} A random adjective like 'Epic', 'Swift', etc.
   */
  static getRandomAdjective(): string {
    const randomIndex = Math.floor(Math.random() * UserNameUtils.ADJECTIVES.length);
    return UserNameUtils.ADJECTIVES[randomIndex];
  }

  /**
   * Returns a random Ludora-themed name from the predefined list.
   * @returns {string} A random name like 'Ludorien', 'Ludonaute', etc.
   */
  static getRandomLudoraName(): string {
    const randomIndex = Math.floor(Math.random() * UserNameUtils.LUDORA_NAMES.length);
    return UserNameUtils.LUDORA_NAMES[randomIndex];
  }
}
