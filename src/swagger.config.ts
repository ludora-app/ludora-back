import { DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';

export const SWAGGER_TAG_APP = 'App';
export const SWAGGER_TAG_AUTH_B2C = 'Auth B2C';
export const SWAGGER_TAG_AUTH_B2B = 'Auth B2B';
export const SWAGGER_TAG_CONVERSATIONS = 'Conversations';
export const SWAGGER_TAG_DEVICES = 'Devices';
export const SWAGGER_TAG_EMAILS = 'Emails';
export const SWAGGER_TAG_FIELDS = 'Fields';
export const SWAGGER_TAG_FRIENDS = 'Friends';
export const SWAGGER_TAG_GEOLOCALISATION = 'Geolocalisation';
export const SWAGGER_TAG_HOUR_PREFERENCES = 'Hour Preferences';
export const SWAGGER_TAG_MODERATION = 'Moderation';
export const SWAGGER_TAG_NOTIFICATIONS = 'Notifications';
export const SWAGGER_TAG_PARTNERS = 'Partners';
export const SWAGGER_TAG_PAYMENT = 'Payment';
export const SWAGGER_TAG_SESSION_INVITATIONS = 'Session Invitations';
export const SWAGGER_TAG_SESSION_PLAYERS = 'Session Players';
export const SWAGGER_TAG_SESSION_TEAMS = 'Session Teams';
export const SWAGGER_TAG_SESSIONS = 'Sessions';
export const SWAGGER_TAG_SPORT_PREFERENCES = 'Sport Preferences';
export const SWAGGER_TAG_STORAGE = 'Storage';
export const SWAGGER_TAG_USERS = 'Users';

export const SWAGGER_DESCRIPTION_APP = 'Health check and application status';
export const SWAGGER_DESCRIPTION_AUTH_B2C =
  'B2C consumer authentication: register, login, Google OAuth, email verification, password reset, and token refresh';
export const SWAGGER_DESCRIPTION_AUTH_B2B =
  'B2B partner authentication: partner and user account registration and login';
export const SWAGGER_DESCRIPTION_CONVERSATIONS =
  'Messaging: send messages, manage conversations, pagination, and soft-deletion';
export const SWAGGER_DESCRIPTION_DEVICES =
  'FCM device token registration and deregistration for push notifications';
export const SWAGGER_DESCRIPTION_EMAILS = '(Dev only) Email test utilities';
export const SWAGGER_DESCRIPTION_FIELDS =
  'Sports field management for public and private (B2B) fields and field slots';
export const SWAGGER_DESCRIPTION_FRIENDS =
  'Friend relationship management: requests, listing, accept or decline, and removal';
export const SWAGGER_DESCRIPTION_GEOLOCALISATION =
  '(Dev only) Geocoding utilities: coordinates to address conversion and reverse';
export const SWAGGER_DESCRIPTION_HOUR_PREFERENCES =
  'User availability and hour preferences management';
export const SWAGGER_DESCRIPTION_MODERATION = 'User moderation: block and report users';
export const SWAGGER_DESCRIPTION_NOTIFICATIONS =
  'Push notification management: listing, read status, and deletion';
export const SWAGGER_DESCRIPTION_PARTNERS = 'B2B partner entity management';
export const SWAGGER_DESCRIPTION_PAYMENT =
  'Stripe payment integration: Connect accounts, payment intents, and bank accounts';
export const SWAGGER_DESCRIPTION_SESSION_INVITATIONS =
  'Session invitations: send, list, and update invitation status';
export const SWAGGER_DESCRIPTION_SESSION_PLAYERS =
  'Session player membership: join, leave, switch teams, and player suggestions';
export const SWAGGER_DESCRIPTION_SESSION_TEAMS = 'Read-only queries for teams within a session';
export const SWAGGER_DESCRIPTION_SESSIONS =
  'Sports session creation, listing, filtering, stats, and management';
export const SWAGGER_DESCRIPTION_SPORT_PREFERENCES =
  'User sport preferences and game mode settings';
export const SWAGGER_DESCRIPTION_STORAGE = 'File upload and signed URL generation';
export const SWAGGER_DESCRIPTION_USERS =
  'User profile management, password and email updates, and account lifecycle';

export const SWAGGER_OPTIONS: SwaggerCustomOptions = {
  swaggerOptions: { operationsSorter: 'method', tagsSorter: 'alpha' },
};

export function buildSwaggerDocument() {
  return new DocumentBuilder()
    .setTitle('Ludora API')
    .setDescription('API for the Ludora app')
    .setVersion('0.0.1')
    .addTag(SWAGGER_TAG_APP, SWAGGER_DESCRIPTION_APP)
    .addTag(SWAGGER_TAG_AUTH_B2B, SWAGGER_DESCRIPTION_AUTH_B2B)
    .addTag(SWAGGER_TAG_AUTH_B2C, SWAGGER_DESCRIPTION_AUTH_B2C)
    .addTag(SWAGGER_TAG_CONVERSATIONS, SWAGGER_DESCRIPTION_CONVERSATIONS)
    .addTag(SWAGGER_TAG_DEVICES, SWAGGER_DESCRIPTION_DEVICES)
    .addTag(SWAGGER_TAG_EMAILS, SWAGGER_DESCRIPTION_EMAILS)
    .addTag(SWAGGER_TAG_FIELDS, SWAGGER_DESCRIPTION_FIELDS)
    .addTag(SWAGGER_TAG_FRIENDS, SWAGGER_DESCRIPTION_FRIENDS)
    .addTag(SWAGGER_TAG_GEOLOCALISATION, SWAGGER_DESCRIPTION_GEOLOCALISATION)
    .addTag(SWAGGER_TAG_HOUR_PREFERENCES, SWAGGER_DESCRIPTION_HOUR_PREFERENCES)
    .addTag(SWAGGER_TAG_MODERATION, SWAGGER_DESCRIPTION_MODERATION)
    .addTag(SWAGGER_TAG_NOTIFICATIONS, SWAGGER_DESCRIPTION_NOTIFICATIONS)
    .addTag(SWAGGER_TAG_PARTNERS, SWAGGER_DESCRIPTION_PARTNERS)
    .addTag(SWAGGER_TAG_PAYMENT, SWAGGER_DESCRIPTION_PAYMENT)
    .addTag(SWAGGER_TAG_SESSION_INVITATIONS, SWAGGER_DESCRIPTION_SESSION_INVITATIONS)
    .addTag(SWAGGER_TAG_SESSION_PLAYERS, SWAGGER_DESCRIPTION_SESSION_PLAYERS)
    .addTag(SWAGGER_TAG_SESSION_TEAMS, SWAGGER_DESCRIPTION_SESSION_TEAMS)
    .addTag(SWAGGER_TAG_SESSIONS, SWAGGER_DESCRIPTION_SESSIONS)
    .addTag(SWAGGER_TAG_SPORT_PREFERENCES, SWAGGER_DESCRIPTION_SPORT_PREFERENCES)
    .addTag(SWAGGER_TAG_STORAGE, SWAGGER_DESCRIPTION_STORAGE)
    .addTag(SWAGGER_TAG_USERS, SWAGGER_DESCRIPTION_USERS)
    .addBearerAuth(
      {
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
        scheme: 'bearer',
        type: 'http',
      },
      'JWT-auth',
    )
    .build();
}
