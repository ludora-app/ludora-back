import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';
import { UserSimpleDisplayWithUidData } from 'src/users/dto';
import { CreateReportDto } from './dto/input/create-report.dto';
import { BlockedUsersMapper } from './mappers/blocked-users.mapper';

@Injectable()
export class ModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ModerationService.name);
  }

  async blockUser(blockerUid: string, userToBlockUid: string): Promise<void> {
    const existingUser = await this.prisma.users.findUnique({
      select: { uid: true },
      where: { uid: userToBlockUid },
    });

    if (!existingUser) {
      this.logger.warn(`User ${userToBlockUid} not found`);
      throw new NotFoundException('User not found');
    }

    const existingBlock = await this.prisma.userBlocks.findUnique({
      where: {
        blockerUid_blockedUid: {
          blockedUid: userToBlockUid,
          blockerUid,
        },
      },
    });

    if (existingBlock) {
      this.logger.warn(`User ${blockerUid} already blocked user ${userToBlockUid}`);
      throw new ConflictException('User already blocked');
    }

    await this.prisma.$transaction([
      this.prisma.userBlocks.create({
        data: {
          blockedUid: userToBlockUid,
          blockerUid,
        },
      }),
      this.prisma.friends.deleteMany({
        where: {
          OR: [
            { userUid1: blockerUid, userUid2: userToBlockUid },
            { userUid1: userToBlockUid, userUid2: blockerUid },
          ],
        },
      }),
    ]);

    this.logger.debug(`User ${blockerUid} blocked user ${userToBlockUid}`);
    return;
  }

  async unblockUser(blockerUid: string, userToUnblockUid: string): Promise<void> {
    const existingBlock = await this.prisma.userBlocks.findUnique({
      where: {
        blockerUid_blockedUid: {
          blockedUid: userToUnblockUid,
          blockerUid,
        },
      },
    });
    if (!existingBlock) {
      this.logger.warn(`User ${blockerUid} not blocked user ${userToUnblockUid}`);
      throw new BadRequestException("You haven't blocked this user");
    }

    await this.prisma.userBlocks.delete({
      where: { blockerUid_blockedUid: { blockedUid: userToUnblockUid, blockerUid } },
    });

    this.logger.debug(`User ${blockerUid} unblocked user ${userToUnblockUid}`);
    return;
  }

  async findAllBlockedUsers(
    blockerUid: string,
  ): Promise<PaginatedDataDto<UserSimpleDisplayWithUidData>> {
    const blockedUsers = await this.prisma.userBlocks.findMany({
      select: {
        blocked: {
          select: {
            firstname: true,
            imageUrl: true,
            lastname: true,
            uid: true,
          },
        },
      },
      where: {
        blockerUid,
      },
    });
    return {
      items: blockedUsers.map(BlockedUsersMapper.toDto),
      totalCount: blockedUsers.length,
    };
  }

  async createReport(reporterUid: string, report: CreateReportDto): Promise<void> {
    const existingReport = await this.prisma.userReports.findFirst({
      where: {
        reason: report.reason,
        reportedUid: report.reportedUid,
        reporterUid,
      },
    });

    if (existingReport) {
      this.logger.warn(`Report already exists for user ${report.reportedUid}`);
      throw new ConflictException('You already reported this user for this reason');
    }

    await this.prisma.userReports.create({
      data: {
        description: report.description,
        reason: report.reason,
        reportedUid: report.reportedUid,
        reporterUid,
      },
    });

    this.logger.debug(`Report created for user ${report.reportedUid}`);
    return;
  }
}
