import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { Provider } from 'generated/prisma/browser';
import { Prisma, Users } from 'generated/prisma/client';
import { InvitationStatus } from 'generated/prisma/enums';
import { PinoLogger } from 'nestjs-pino';
import { CreateImageDto } from 'src/auth/dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageFolderName } from 'src/shared/constants/constants';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';
import { EmailsService } from 'src/shared/emails/emails.service';
import { StorageService } from 'src/shared/storage/storage.service';
import { DateUtils } from 'src/shared/utils/date.utils';
import { VerificationCodeUtil } from 'src/shared/utils/verification-code.utils';
import { USERSELECT } from '../shared/constants/select-user';
import { USER_SUGGESTION_CONFIG } from './constants/users.constants';
import {
  CreateUserDto,
  FindAllUsersResponseDataDto,
  UpdatePasswordDto,
  UpdateUserDto,
  UserFilterDto,
} from './dto';
import { RawUserFindAll, UserMapper } from './mappers/user.mapper';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly emailsService: EmailsService,
    private readonly storageService: StorageService,
    private readonly logger: PinoLogger,
    private readonly configService: ConfigService,
  ) {
    this.logger.setContext(UsersService.name);
  }

  private readonly GOOGLE_TESTER_ACCOUNT_EMAIL =
    this.configService.get<string>('GOOGLE_TESTER_ACCOUNT_EMAIL') ?? '';
  private readonly APPLE_TESTER_ACCOUNT_EMAIL =
    this.configService.get<string>('APPLE_TESTER_ACCOUNT_EMAIL') ?? '';

  private readonly TESTER_ACCOUNT_EMAILS = [
    this.GOOGLE_TESTER_ACCOUNT_EMAIL,
    this.APPLE_TESTER_ACCOUNT_EMAIL,
  ];

  async create(
    createUserDto: CreateUserDto,
    createImageDto?: CreateImageDto,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx ?? this.prismaService;

    const { email, firstname, lastname } = createUserDto;
    const formattedFirst = firstname.charAt(0).toUpperCase() + firstname.slice(1);
    const formattedLast = lastname.toUpperCase();
    const formattedEmail = email.toLowerCase();
    const formattedBirthdate = createUserDto.birthdate ? new Date(createUserDto.birthdate) : null;

    const existingUser = await prisma.users.findUnique({
      where: { email: formattedEmail },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    let imageUrl = { data: '' };

    if (createImageDto) {
      imageUrl = await this.storageService.upload(
        StorageFolderName.USERS,
        createImageDto.name,
        createImageDto.file,
      );
    } else {
      imageUrl = await this.storageService.createDefaultProfilePicture();
    }

    //? If the provider is not LUDORA, the email is verified
    const isEmailVerified =
      createUserDto.provider !== undefined && createUserDto.provider !== Provider.LUDORA;

    const newUser = await prisma.users.create({
      data: {
        bio: createUserDto.bio,
        birthdate: formattedBirthdate,
        email: formattedEmail,
        firstname: formattedFirst,
        imageUrl: imageUrl.data,
        lastname: formattedLast,
        password: createUserDto.password,
        phone: createUserDto.phone,
        sex: createUserDto.sex,
        ...(createUserDto.type && { type: createUserDto.type }),
        isEmailVerified,
        provider: createUserDto.provider,
        appleId: createUserDto.appleId,
        appleRefreshToken: createUserDto.appleRefreshToken,
      },
      select: { email: true, firstname: true, lastname: true, uid: true },
    });

    return newUser;
  }

  /**
   * Returns a paginated, ranked list of users based on shared sports, city, level match, and name search.
   *
   * Numeric score constants are wrapped with `Prisma.raw()` instead of being interpolated directly.
   * When a JS number is interpolated into `Prisma.sql`, it becomes a bound parameter (`$1`) whose type
   * PostgreSQL must infer from context. In expressions like `COUNT(*) * $1`, `COUNT(*)` returns `bigint`
   * and PostgreSQL cannot resolve the type of `$1`, falling back to `text` — causing the error
   * `operator does not exist: bigint * text`. `Prisma.raw()` embeds the value as a SQL literal instead,
   * which is safe here because these values come from internal constants, not user input.
   */
  async findAll(
    filters: UserFilterDto,
    userUid: string,
  ): Promise<PaginatedDataDto<FindAllUsersResponseDataDto>> {
    const {
      cursor,
      levels: filterLevels = [],
      limit = 10,
      name,
      sports: filterSports = [],
    } = filters;

    const connectedUser = await this.prismaService.users.findUnique({
      select: {
        city: true,
        userSportPreferences: { select: { level: true, sport: true } },
      },
      where: { uid: userUid },
    });

    if (!connectedUser) throw new NotFoundException('User not found');

    const currentOffset = cursor ? parseInt(cursor, 10) : 0;
    const take = limit + 1;

    // -------------------------------------------------------------------------
    // 1. SPORTS — scoring & strict filtering
    // -------------------------------------------------------------------------
    const isFilteringSports = filterSports.length > 0;
    const connectedUserSports = connectedUser.userSportPreferences.map((p) => p.sport);
    const sportsToScore = isFilteringSports ? filterSports : connectedUserSports;
    const hasSportsToScore = sportsToScore.length > 0;

    // +SPORT_SCORE_PER_MATCH per sport the other player shares with me (or with the filter)
    const sportScoreSql = hasSportsToScore
      ? Prisma.sql`COALESCE((
          SELECT COUNT(*) * ${Prisma.raw(USER_SUGGESTION_CONFIG.SCORES.SPORT_SCORE_PER_MATCH.toString())}
          FROM user_preferences."User_sports" usp_score
          WHERE usp_score.user_uid = u.uid
            AND usp_score.sport::text IN (${Prisma.join(sportsToScore)})
        ), 0)`
      : Prisma.sql`0`;

    // strict: only keep users who practice at least one of the requested sports
    let sportWhereSql = Prisma.empty;
    if (isFilteringSports) {
      sportWhereSql = Prisma.sql`
        AND EXISTS (
          SELECT 1 FROM user_preferences."User_sports" usp_f
          WHERE usp_f.user_uid = u.uid
            AND usp_f.sport::text IN (${Prisma.join(filterSports)})
        )`;
    }

    // -------------------------------------------------------------------------
    // 2. LEVELS — strict filtering
    // -------------------------------------------------------------------------
    let levelWhereSql = Prisma.empty;
    if (filterLevels.length > 0) {
      levelWhereSql = Prisma.sql`
        AND EXISTS (
          SELECT 1 FROM user_preferences."User_sports" usp_l
          WHERE usp_l.user_uid = u.uid
            AND usp_l.level IN (${Prisma.join(filterLevels.map((l) => Prisma.sql`${l}`))})
        )`;
    }

    const blockFilterSql = Prisma.sql`
    AND NOT EXISTS (
      SELECT 1 FROM moderation."User_blocks" ub
        WHERE (ub.blocker_uid = ${userUid} AND ub.blocked_uid = u.uid)
         OR (ub.blocker_uid = u.uid AND ub.blocked_uid = ${userUid})
    )
  `;

    // -------------------------------------------------------------------------
    // 3. CITY — +CITY_BONUS if same city as connected user
    // -------------------------------------------------------------------------
    const hasCity = !!connectedUser.city;
    const cityScoreSql = hasCity
      ? Prisma.sql`CASE WHEN u.city = ${connectedUser.city} THEN ${Prisma.raw(USER_SUGGESTION_CONFIG.SCORES.CITY_BONUS.toString())} ELSE 0 END`
      : Prisma.sql`0`;

    // -------------------------------------------------------------------------
    // 4. LEVEL MATCH — +LEVEL_MATCH_SCORE_PER_PAIR per (sport, level) pair shared with connected user
    // -------------------------------------------------------------------------
    const connectedUserSportPrefs = connectedUser.userSportPreferences;
    let levelMatchScoreSql = Prisma.sql`0`;
    if (connectedUserSportPrefs.length > 0) {
      const levelConditions = connectedUserSportPrefs.map(
        (p) => Prisma.sql`(usp_lvl.sport::text = ${p.sport} AND usp_lvl.level = ${p.level})`,
      );
      levelMatchScoreSql = Prisma.sql`COALESCE((
        SELECT COUNT(*) * ${Prisma.raw(USER_SUGGESTION_CONFIG.SCORES.LEVEL_MATCH_SCORE_PER_PAIR.toString())}
        FROM user_preferences."User_sports" usp_lvl
        WHERE usp_lvl.user_uid = u.uid
          AND (${Prisma.join(levelConditions, ' OR ')})
      ), 0)`;
    }

    // -------------------------------------------------------------------------
    // 5. SEARCH — filter + score by first name / last name
    // -------------------------------------------------------------------------
    let searchWhereSql = Prisma.empty;
    let searchScoreSql = Prisma.sql`0`;
    if (name) {
      const searchPattern = `%${name.replace(/\s+/g, '')}%`;
      searchWhereSql = Prisma.sql`
        AND (
          word_similarity(${name}, u.firstname) > ${Prisma.raw(USER_SUGGESTION_CONFIG.THRESHOLDS.WORD_SIMILARITY_THRESHOLD.toString())} OR
          word_similarity(${name}, u.lastname) > ${Prisma.raw(USER_SUGGESTION_CONFIG.THRESHOLDS.WORD_SIMILARITY_THRESHOLD.toString())} OR
          u.firstname ILIKE ${searchPattern}
          OR u.lastname ILIKE ${searchPattern}
          OR (u.firstname || ' ' || u.lastname) ILIKE ${searchPattern}
        )`;
      searchScoreSql = Prisma.sql`
        CASE
          WHEN u.firstname ILIKE ${searchPattern} OR u.lastname ILIKE ${searchPattern} THEN ${Prisma.raw(USER_SUGGESTION_CONFIG.SCORES.SEARCH_EXACT_BONUS.toString())}
          ELSE ${Prisma.raw(USER_SUGGESTION_CONFIG.SCORES.SEARCH_PARTIAL_BONUS.toString())}
        END`;
    }

    // -------------------------------------------------------------------------
    // 6. SAFETY BARRIER — require at least one scoring dimension
    // -------------------------------------------------------------------------
    if (!hasSportsToScore && !hasCity && !name) {
      return { items: [], nextCursor: null, totalCount: 0 };
    }

    // -------------------------------------------------------------------------
    // 7. EXECUTE RAW QUERY
    // -------------------------------------------------------------------------
    const rankedUsers = await this.prismaService.$queryRaw<
      { uid: string; score: number; total_count: bigint }[]
    >`
      SELECT
        ranked_users.*,
        count(*) OVER() AS total_count
      FROM (
        SELECT
          u.uid,
          (
            (${sportScoreSql}) +
            (${cityScoreSql}) +
            (${levelMatchScoreSql}) +
            (${searchScoreSql})
          ) AS score
        FROM auth."Users" u
        WHERE
          u.uid != ${userUid}
          AND u.email NOT IN (${Prisma.join(this.TESTER_ACCOUNT_EMAILS)})
          AND u.is_anonymized = false
          ${sportWhereSql}
          ${levelWhereSql}
          ${searchWhereSql}
          ${blockFilterSql}
      ) AS ranked_users
      ORDER BY ranked_users.score DESC, ranked_users.uid ASC
      LIMIT ${take}
      OFFSET ${currentOffset}
    `;

    // -------------------------------------------------------------------------
    // 8. HYDRATION & RETURN
    // -------------------------------------------------------------------------
    if (!rankedUsers || rankedUsers.length === 0) {
      return { items: [], nextCursor: null, totalCount: 0 };
    }

    const totalCount = Number(rankedUsers[0].total_count);
    let nextCursor: string | null = null;
    let itemsToFetch = rankedUsers;

    if (rankedUsers.length > limit) {
      itemsToFetch = rankedUsers.slice(0, limit);
      nextCursor = (currentOffset + limit).toString();
    }

    const userUids = itemsToFetch.map((r) => r.uid);
    const users = await this.prismaService.users.findMany({
      select: {
        bio: true,
        city: true,
        firstname: true,
        imageUrl: true,
        lastname: true,
        uid: true,
        userSportPreferences: {
          select: {
            level: true,
            sport: true,
            uid: true,
            userGameModePreferences: { select: { gameMode: true, uid: true } },
          },
        },
      },
      where: { uid: { in: userUids } },
    });

    const uidToIndex = new Map(itemsToFetch.map((item, idx) => [item.uid, idx]));
    const sortedUsers = [...users].sort(
      (a, b) => (uidToIndex.get(a.uid) ?? 999) - (uidToIndex.get(b.uid) ?? 999),
    );

    // Fetch friendship status if there are userUids
    const friendships =
      userUids.length > 0
        ? await this.prismaService.friends.findMany({
            where: {
              OR: [
                { userUid1: userUid, userUid2: { in: userUids } },
                { userUid1: { in: userUids }, userUid2: userUid },
              ],
            },
          })
        : [];

    const friendshipMap = new Map<string, InvitationStatus>();
    friendships.forEach((f) => {
      const otherUid = f.userUid1 === userUid ? f.userUid2 : f.userUid1;
      friendshipMap.set(otherUid, f.status);
    });

    const items = sortedUsers.map((user) =>
      UserMapper.toFindAllResponseDto(
        user as RawUserFindAll,
        connectedUser.city,
        connectedUserSports,
        friendshipMap.get(user.uid),
      ),
    );

    return { items, nextCursor, totalCount };
  }

  async findOne(uid: string, select: Prisma.UsersSelect, searcherUid?: string): Promise<Users> {
    const existingUser = await this.prismaService.users.findUnique({
      select: {
        ...select,
      },
      where: { uid },
    });

    if (!existingUser) {
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
        return null;
      }
    }

    return existingUser;
  }

  /**
   * Find a user by email
   * @param email - The email of the user
   * @description This method is used in the auth service to find a user by email
   * @returns The user
   */
  async findOneByEmail(email: string, select?: Prisma.UsersSelect): Promise<Users> {
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

  async update(
    uid: string,
    updateUserDto: UpdateUserDto,
    createImageDto?: CreateImageDto,
  ): Promise<void> {
    const existingUser = await this.findOne(uid, USERSELECT.findMe);

    if (!existingUser) throw new NotFoundException('User not found');
    let imageUrl = existingUser.imageUrl;
    if (createImageDto) {
      const uploadResult = await this.storageService.upload(
        StorageFolderName.USERS,
        createImageDto.name,
        createImageDto.file,
      );
      imageUrl = uploadResult.data;
    }

    const updatedUser = await this.prismaService.users.update({
      data: {
        ...updateUserDto,
        imageUrl: imageUrl,
      },
      where: { uid },
    });

    if (!updatedUser) {
      throw new BadRequestException('User not updated');
    }
    this.logger.debug('User updated successfully');
    return;
  }

  /**
   * @description This method is used to update the password of a user
   * @param uid
   * @param updatePasswordDto
   * @returns
   */
  async updatePassword(uid: string, updatePasswordDto: UpdatePasswordDto): Promise<void> {
    const { newPassword, oldPassword } = updatePasswordDto;

    if (oldPassword === newPassword) {
      throw new BadRequestException('New password cannot be the same as the old password');
    }

    const existingUser = await this.prismaService.users.findUnique({
      where: { uid },
    });

    if (!existingUser) throw new NotFoundException('User not found');

    if (existingUser.provider !== Provider.LUDORA) {
      throw new BadRequestException('Only LUDORA users can update their password');
    }

    const isPasswordValid = await argon2.verify(existingUser.password, oldPassword);

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    const hashedPassword = await argon2.hash(newPassword);

    const updatedUser = await this.prismaService.users.update({
      data: {
        password: hashedPassword,
      },
      where: { uid },
    });

    if (updatedUser) {
      await this.emailsService.sendEmail({
        data: { name: updatedUser.firstname },
        recipients: [updatedUser.email],
        template: 'passwordReset',
      });
      return;
    } else {
      throw new BadRequestException('User not updated');
    }
  }

  async updateEmail(uid: string, email: string): Promise<void> {
    const existingUser = await this.findOne(uid, USERSELECT.checkIfUserExistsByEmail);
    if (!existingUser) throw new NotFoundException('User not found');

    const existingUserWithEmail = await this.findOneByEmail(
      email,
      USERSELECT.checkIfUserExistsByEmail,
    );
    if (existingUserWithEmail) throw new ConflictException('Email already exists');

    await this.prismaService.users.update({
      data: { email },
      where: { uid },
    });
  }

  async deactivate(uid: string): Promise<void> {
    const existingUser = await this.prismaService.users.findUnique({
      where: { uid },
    });

    if (!existingUser) throw new NotFoundException('User not found');

    await this.prismaService.users.update({
      data: {
        isConnected: false,
      },
      where: { uid },
    });

    return;
  }

  async remove(uid: string): Promise<void> {
    const existingUser = await this.prismaService.users.findUnique({
      where: { uid },
    });

    if (!existingUser) throw new NotFoundException('User not found');

    await this.prismaService.users.delete({
      where: { uid },
    });

    return;
  }

  /**
   * Send a verification email to the user with a 6 digits verfication code that expires in 15 minutes
   * @param userUid - The uid of the user
   * @param email - The email of the user
   * @memberof UsersService & AuthService
   */
  async sendVerificationEmail(userUid: string, email: string) {
    const verificationCode = VerificationCodeUtil.generateVerificationCode();
    const expiresAt = new Date(Date.now() + DateUtils.FIFTEEN_MINUTES); // 15 minutes

    // Utiliser une transaction pour garantir l'atomicité
    await this.prismaService.$transaction(async (tx) => {
      // Supprimer les anciens codes de vérification
      await tx.emailVerification.deleteMany({
        where: { userUid: userUid },
      });

      // Créer le nouveau code
      await tx.emailVerification.create({
        data: {
          code: verificationCode,
          expiresAt,
          userUid: userUid,
        },
      });
    });

    // Envoyer l'email en dehors de la transaction
    await this.emailsService.sendEmail({
      data: { code: verificationCode },
      recipients: [email],
      template: 'verificationLink',
    });
  }

  /**
   * This async function returns the count of active users who are connected.
   * @returns The `getActiveUsersCount` function returns a Promise that resolves to a number, which
   * represents the count of users where the `isConnected` property is true in the database.
   * @description This method is used in the metrics service to get the count of active users.
   */
  async getActiveUsersCount(): Promise<number> {
    return await this.prismaService.users.count({
      where: {
        isConnected: true,
      },
    });
  }

  /**   * @param user - The user
   * @description This method is used to send a verification code for password reset to the user
   */
  async sendCodeForPasswordReset(
    user: Pick<
      Users,
      'uid' | 'email' | 'firstname' | 'lastname' | 'imageUrl' | 'provider' | 'isEmailVerified'
    >,
  ): Promise<void> {
    const verificationCode = VerificationCodeUtil.generateVerificationCode();
    this.logger.debug('verificationCode', verificationCode);
    const expiresAt = new Date(Date.now() + DateUtils.FIFTEEN_MINUTES);

    await this.prismaService.$transaction(async (tx) => {
      // Delete old verification codes
      await tx.emailVerification.deleteMany({
        where: { userUid: user.uid },
      });

      // Create the new code
      await tx.emailVerification.create({
        data: {
          code: verificationCode,
          expiresAt,
          userUid: user.uid,
        },
      });
    });

    await this.emailsService.sendEmail({
      data: { code: verificationCode, name: user.firstname },
      recipients: [user.email],
      template: 'passwordResetRequest',
    });
  }
  /**
   *
   * @param email - The email of the user
   * @description This method is used to send a verification code for password reset to the user email
   */
  async sendCodeForPasswordResetRequest(email: string): Promise<void> {
    const user = await this.findOneByEmail(email, USERSELECT.findOneByEmail);

    if (!user) {
      this.logger.error(`User not found for email: ${email}`);
      return;
    }

    if (user.provider === 'GOOGLE') {
      this.logger.error(`User is a Google user, cannot send password reset code`);
      return;
    }

    await this.sendCodeForPasswordReset(user);
  }

  /**
   * Marks a user for deletion in the database, the deletion will be processed after a 30 days retraction period
   * @param uid
   * @description This method is used to request the deletion of a user
   * @returns void - This function does not return anything.
   */
  async deletionRequest(uid: string): Promise<void> {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    /* we use updateMany to avoid calling the database one more time than necessary
      The existence of the user is already checked in the controller via the Guard
    */

    const result = await this.prismaService.users.updateMany({
      data: { deletedAt: thirtyDaysFromNow },
      where: { deletedAt: null, uid },
    });

    if (result.count === 0) {
      throw new BadRequestException('User already has a deletion request');
    }
  }

  async cancelDeletionRequest(uid: string): Promise<void> {
    /* we use updateMany to avoid calling the database one more time than necessary
      The existence of the user is already checked in the controller via the Guard
    */
    const result = await this.prismaService.users.updateMany({
      data: { deletedAt: null },
      where: { deletedAt: { not: null }, uid },
    });

    if (result.count === 0) {
      throw new BadRequestException('User does not have a deletion request');
    }
  }
}
