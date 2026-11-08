import { Injectable } from '@nestjs/common';
import { Prisma, Users } from 'generated/prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { USERSELECT } from '../../shared/constants/select-user';
import { PlayAreaResponseData } from '../dto';
import { SearchLocation } from '../interfaces/search-location.interface';
import { UserMapper } from '../mappers/user.mapper';

/**
 * @description Read-only access to users.
 * Used by the guards, the auth services and other domains that only need to look up a user,
 * so they don't depend on the whole UsersService and its mutations.
 */
@Injectable()
export class UserLookupService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UserLookupService.name);
  }

  /**
   * Find a user by uid
   * @param uid - The uid of the user
   * @param select - The fields to select
   * @param searcherUid - If provided, returns null when a block exists between the two users
   * @returns The user, or null if not found or blocked
   */
  async findOne(
    uid: string,
    select: Prisma.UsersSelect,
    searcherUid?: string,
  ): Promise<Users | null> {
    const existingUser = await this.prismaService.users.findUnique({
      select: {
        ...select,
      },
      where: { uid },
    });

    if (!existingUser) {
      this.logger.debug(`User not found: ${uid}`);
      return null;
    }

    if (searcherUid) {
      const existingBlock = await this.prismaService.userBlocks.findFirst({
        where: {
          OR: [
            { blockerUid: searcherUid, blockedUid: uid },
            { blockerUid: uid, blockedUid: searcherUid },
          ],
        },
      });

      if (existingBlock) {
        this.logger.debug(`User ${uid} hidden from ${searcherUid} because of a block`);
        return null;
      }
    }

    return existingUser;
  }

  /**
   * Find a user by email
   * @param email - The email of the user
   * @description This method is used in the auth service to find a user by email
   * @returns The user, or null if not found
   */
  async findOneByEmail(email: string, select?: Prisma.UsersSelect): Promise<Users | null> {
    const user = await this.prismaService.users.findUnique({
      select: select ?? USERSELECT.checkIfUserExistsByEmail,
      where: { email },
    });

    if (!user) return null;

    return user;
  }

  async findOneByAppleId(appleId: string) {
    const user = await this.prismaService.users.findUnique({
      select: USERSELECT.findOneByAppleId,
      where: { appleId },
    });

    if (!user) return null;

    return user;
  }

  /**
   * Find the play area of a user
   * @param uid - The uid of the user
   * @returns The play area, or null if the user has not set one
   */
  async findPlayArea(uid: string): Promise<PlayAreaResponseData | null> {
    const user = await this.prismaService.users.findUnique({
      select: {
        playAreaLatitude: true,
        playAreaLongitude: true,
        playAreaRadiusKm: true,
      },
      where: { uid },
    });

    const playArea = user ? UserMapper.toPlayAreaDto(user) : null;
    if (!playArea) {
      this.logger.debug(`No play area for user ${uid}`);
      return null;
    }

    return playArea;
  }

  /**
   * Complete a geographic search with the play area of the user when the app sends no position:
   * the center of the play area replaces the position, and its radius the missing max distance.
   * A position sent by the app is always used as is.
   * @param location - The position and max distance sent by the app
   * @param userUid - The uid of the user making the search
   * @returns The location to search around, unchanged if the user has no play area
   */
  async resolveSearchLocation(location: SearchLocation, userUid: string): Promise<SearchLocation> {
    const { maxDistance, userLat, userLon } = location;
    if (userLat != null && userLon != null) return location;

    const playArea = await this.findPlayArea(userUid);
    if (!playArea) return location;

    this.logger.debug(`Searching around the play area of user ${userUid}`);
    return {
      maxDistance: maxDistance ?? playArea.radiusKm,
      userLat: playArea.latitude,
      userLon: playArea.longitude,
    };
  }
}
