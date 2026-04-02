import * as crypto from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Provider } from 'generated/prisma/enums';
import { PinoLogger } from 'nestjs-pino';
import { AppleService } from 'src/apple/apple.service';
import { StorageService } from 'src/shared/storage/storage.service';
import { DEFAULT_USER_DATA } from 'src/users/constants/users.constants';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly storageService: StorageService,
    private readonly appleService: AppleService,
  ) {
    this.logger.setContext(UserLifecycleService.name);
  }

  /**
   * The `anonymizeUser` function anonymizes a user in the database by updating their information and
   * deleting associated data, with an optional deletion of the user's avatar image.
   * @param {string} uid - The `uid` parameter in the `anonymizeUser` function is a unique identifier for
   * the user whose data is being anonymized. It is used to locate the specific user in the database and
   * perform the necessary operations to anonymize their data.
   * @returns The `anonymizeUser` function is returning a `Promise<void>`.
   */
  async anonymizeUser(uid: string): Promise<void> {
    let imageUrlToDelete: string | null = null;

    try {
      await this.prisma.$transaction(async (tx) => {
        const user = await tx.users.findUnique({
          select: { deletedAt: true, imageUrl: true, provider: true, appleRefreshToken: true },
          where: { uid },
        });

        if (!user?.deletedAt) {
          this.logger.warn(`User ${uid} not marked for deletion (deletedAt is null)`);
          return;
        }

        if (user.imageUrl && !user.imageUrl.includes('default-avatars')) {
          imageUrlToDelete = user.imageUrl;
        }

        // await tx.refreshTokens.deleteMany({ where: { userUid: uid } });
        // await tx.devices.deleteMany({ where: { userUid: uid } });
        // await tx.userTokens.deleteMany({ where: { userUid: uid } });
        // await tx.notifications.deleteMany({ where: { userUid: uid } });

        if (user.provider === Provider.APPLE && user.appleRefreshToken) {
          await this.appleService.revokeToken(user.appleRefreshToken);
        }

        const randomHash = crypto.randomBytes(8).toString('hex');
        await tx.users.update({
          data: {
            bio: null,
            birthdate: null,
            email: `anon_${randomHash}@ludora.app`,
            firstname: DEFAULT_USER_DATA.FIRSTNAME,
            imageUrl: null,
            isAnonymized: true,
            isConnected: false,
            isEmailVerified: false,
            lastname: DEFAULT_USER_DATA.LASTNAME,
            password: null,
            phone: null,
          },
          where: { uid },
        });

        await tx.friends.deleteMany({
          where: { OR: [{ userUid1: uid }, { userUid2: uid }] },
        });
      });

      this.logger.info(`User ${uid} DB anonymization successful.`);

      if (imageUrlToDelete) {
        await this.storageService.deleteFile(imageUrlToDelete).catch((err) => {
          this.logger.error(`Failed to delete avatar for ${uid} in Cloud Storage: ${err.message}`);
        });
      }

      // TODO: Call PaymentService to delete the Stripe Customer
    } catch (error) {
      this.logger.error(`Error anonymizing user ${uid}: ${error.message}`);
      return;
    }
  }

  /**
   * Anonymizes users who have been marked for deletion and are older than 2 years
   * @returns void - This function does not return anything.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async anonymizeExpiredUsers(): Promise<void> {
    const now = new Date();

    const usersToAnonymize = await this.prisma.users.findMany({
      select: { uid: true },
      where: {
        deletedAt: { lte: now, not: null },
        isAnonymized: false,
      },
    });

    for (const { uid } of usersToAnonymize) {
      await this.anonymizeUser(uid);
    }
  }

  /* The `@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)` decorator in the `purgeAnonymizedUsers` method is
used in NestJS to schedule a task to run at midnight every day. This method is responsible for
purging anonymized users who have been marked for deletion and are older than 2 years. */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async purgeAnonymizedUsers(): Promise<void> {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    try {
      // Pas besoin de transaction pour un deleteMany isolé
      const result = await this.prisma.users.deleteMany({
        where: {
          deletedAt: { lte: twoYearsAgo, not: null },
          isAnonymized: true,
        },
      });

      if (result.count > 0) {
        this.logger.info(
          `Purged ${result.count} anonymized users successfully (older than 2 years).`,
        );
      }
    } catch (error) {
      this.logger.error(`Error purging anonymized users: ${error.message}`);
    }
  }
}
