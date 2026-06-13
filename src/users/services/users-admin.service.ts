import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { USERSELECT } from 'src/shared/constants/select-user';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';
import { CreateUserBanDto } from '../dto/input/create-user-ban.dto';
import { ReportFilterDto } from '../dto/input/report-filter.dto';
import { FindAllReportedUsersResponseData } from '../dto/output/find-all-reported-users-response.dto';
import { UserMapper } from '../mappers/user.mapper';
import { UsersService } from './users.service';

@Injectable()
export class UsersAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly usersService: UsersService,
  ) {
    this.logger.setContext(UsersAdminService.name);
  }

  async adminDeleteUser(uid: string): Promise<void> {
    const user = await this.usersService.findOne(uid, USERSELECT.checkIfUserExists);

    if (!user) throw new NotFoundException('User not found');

    await this.prisma.users.delete({ where: { uid } });

    this.logger.warn(`[ADMIN ACTION] - User ${user.email} (${uid}) has been deleted by an admin`);
  }

  async findAllUsersOrderedByReports(
    params: ReportFilterDto,
  ): Promise<PaginatedDataDto<FindAllReportedUsersResponseData>> {
    const { reportReason, limit, cursor } = params;

    const users = await this.prisma.users.findMany({
      select: {
        uid: true,
        email: true,
        firstname: true,
        lastname: true,
        createdAt: true,
        imageUrl: true,
        sex: true,
        isEmailVerified: true,
        _count: {
          select: { reportedByUsers: true },
        },
      },
      where: {
        reportedByUsers: {
          some: reportReason ? { reason: reportReason } : {},
        },
      },
      orderBy: {
        reportedByUsers: {
          _count: 'desc',
        },
      },
      ...(limit ? { take: limit } : {}),
      ...(cursor ? { cursor: { uid: cursor } } : {}),
    });

    let nextCursor: string | null = null;
    if (users.length > limit) {
      const nextItem = users.pop();
      nextCursor = nextItem?.uid;
    }

    const items = users.map((user) => UserMapper.toReportDto(user));

    return { items: items, totalCount: items.length, nextCursor };
  }

  async findOneWithReports(uid: string) {
    const user = await this.prisma.users.findUnique({
      where: { uid },
      select: {
        bio: true,
        city: true,
        firstname: true,
        imageUrl: true,
        lastname: true,
        sex: true,
        isEmailVerified: true,
        uid: true,
        email: true,
        createdAt: true,
        reportedByUsers: {
          select: {
            reason: true,
            description: true,
            createdAt: true,
            reporter: {
              select: { email: true, firstname: true, lastname: true, uid: true, imageUrl: true },
            },
          },
        },
        _count: {
          select: {
            sessionPlayers: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return UserMapper.toFindOneWithReportsDto(user);
  }

  async banUser(dto: CreateUserBanDto): Promise<void> {
    const { userUid, banReason } = dto;

    const user = await this.usersService.findOne(userUid, USERSELECT.checkIfUserExists);

    if (!user) throw new NotFoundException('User not found');

    if (user.isBanned) throw new BadRequestException('User is already banned');

    await this.prisma.users.update({
      where: { uid: userUid },
      data: { isBanned: true, bannedAt: new Date(), banReason: banReason },
    });

    this.logger.warn(
      `[ADMIN ACTION] - User ${user.email} (${userUid}) has been banned by an admin`,
    );

    await this.handleUserBan(userUid);
  }

  /**
   *
   * @param userUid
   */
  private async handleUserBan(userUid: string): Promise<void> {
    await this.prisma.userTokens.deleteMany({ where: { uid: userUid } });
    // TODO: send email
  }
}
