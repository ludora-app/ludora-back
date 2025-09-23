import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Invitation_status } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionsService } from 'src/sessions/sessions.service';
import { USERSELECT } from 'src/shared/constants/select-user';
import { UsersService } from 'src/users/users.service';
import { CreateSessionInvitationDto } from './dto/input/create-session-invitation.dto';
import { SessionInvitationFilterDto } from './dto/input/session-invitation-filter.dto';
import { UpdateSessionInvitationDto } from './dto/input/update-session-invitation.dto';

@Injectable()
export class SessionInvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionsService: SessionsService,
    private readonly usersService: UsersService,
  ) {}

  async create(createSessionInvitationDto: CreateSessionInvitationDto) {
    // checks if the session exists
    const existingSession = await this.sessionsService.findOne(
      createSessionInvitationDto.sessionId,
    );

    if (!existingSession) {
      throw new BadRequestException('Session not found');
    }
    // checks if the user exists
    const existingUser = await this.usersService.findOne(
      createSessionInvitationDto.userId,
      USERSELECT.findOne,
    );

    if (!existingUser) {
      throw new BadRequestException('User not found');
    }

    // checks if the user is already invited to the session
    const existingInvitation = await this.prisma.session_invitations.findUnique({
      where: {
        sessionId_userId: {
          sessionId: createSessionInvitationDto.sessionId,
          userId: createSessionInvitationDto.userId,
        },
      },
    });

    if (existingInvitation) {
      throw new ConflictException('User already invited to the session');
    }

    const invitation = await this.prisma.session_invitations.create({
      data: {
        sessionId: createSessionInvitationDto.sessionId,
        userId: createSessionInvitationDto.userId,
      },
    });

    return invitation;
  }

  async findAllByUserId(userId: string, filter: SessionInvitationFilterDto) {
    const existingUser = await this.usersService.findOne(userId, USERSELECT.findOne);

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const { cursor, limit, scope } = filter;
    const query: {
      take: number;
      skip?: number;
      cursor?: {
        sessionId_userId: {
          sessionId: string;
          userId: string;
        };
      };
      where: {
        userId: string;
        status?: Invitation_status;
      };
    } = {
      take: limit + 1,
      where: {
        userId,
      },
    };

    if (scope === 'PENDING') {
      query.where.status = Invitation_status.PENDING;
    } else if (scope === 'ACCEPTED') {
      query.where.status = Invitation_status.ACCEPTED;
    } else if (scope === 'REJECTED') {
      query.where.status = Invitation_status.REJECTED;
    }

    const sessionInvitations = await this.prisma.session_invitations.findMany({
      ...query,
      select: {
        status: true,
        sessionId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return sessionInvitations;
  }

  async findAllBySessionId() {}

  findOne(sessionId: string, userId: string) {
    return `This action returns session invitation for session ${sessionId} and user ${userId}`;
  }

  update(
    sessionId: string,
    userId: string,
    updateSessionInvitationDto: UpdateSessionInvitationDto,
  ) {
    return `This action updates session invitation for session ${sessionId} and user ${userId}`;
  }

  remove(sessionId: string, userId: string) {
    return `This action removes session invitation for session ${sessionId} and user ${userId}`;
  }
}
