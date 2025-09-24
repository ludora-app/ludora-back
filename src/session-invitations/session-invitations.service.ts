import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { USERSELECT } from 'src/shared/constants/select-user';
import { SessionsService } from 'src/sessions/sessions.service';
import { Invitation_status, Session_invitations } from '@prisma/client';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { SessionInvitationFilterDto } from './dto/input/session-invitation-filter.dto';
import { CreateSessionInvitationDto } from './dto/input/create-session-invitation.dto';
import { UpdateSessionInvitationDto } from './dto/input/update-session-invitation.dto';
@Injectable()
export class SessionInvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionsService: SessionsService,
    private readonly usersService: UsersService,
  ) {}

  async create(
    createSessionInvitationDto: CreateSessionInvitationDto,
  ): Promise<Session_invitations> {
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

  async findAllByUserId(
    userId: string,
    filter: SessionInvitationFilterDto,
  ): Promise<{ items: Session_invitations[]; nextCursor: string | null; totalCount: number }> {
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

    //cursor on sessionId since userId doesnt change here
    if (cursor) {
      query.cursor = {
        sessionId_userId: {
          sessionId: cursor,
          userId: userId,
        },
      };
      query.skip = 1;
    }

    const sessionInvitations = await this.prisma.session_invitations.findMany({
      ...query,
      select: {
        createdAt: true,
        sessionId: true,
        status: true,
        updatedAt: true,
        userId: true,
      },
    });

    return sessionInvitations;
  }

  async findAllBySessionId(
    sessionId: string,
    filter: SessionInvitationFilterDto,
  ): Promise<{ items: Session_invitations[]; nextCursor: string | null; totalCount: number }> {
    const existingSession = await this.sessionsService.findOne(sessionId);

    if (!existingSession) {
      throw new NotFoundException('Session not found');
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
        sessionId: string;
        status?: Invitation_status;
      };
    } = {
      take: limit + 1,
      where: {
        sessionId,
      },
    };
    //cursor on userId since sessionId doesnt change here
    if (cursor) {
      query.cursor = {
        sessionId_userId: {
          sessionId: sessionId,
          userId: cursor,
        },
      };
      query.skip = 1;
    }

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
        createdAt: true,
        sessionId: true,
        status: true,
        updatedAt: true,
        userId: true,
      },
    });

    return sessionInvitations;
  }

  async findOne(sessionId: string, userId: string) {
    const existingSession = await this.sessionsService.findOne(sessionId);
    if (!existingSession) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    const existingUser = await this.usersService.findOne(userId, USERSELECT.findOne);
    if (!existingUser) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const invitation = await this.prisma.session_invitations.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId,
        },
      },
    });

    return invitation;
  }

  update(
    sessionId: string,
    userId: string,
    updateSessionInvitationDto: UpdateSessionInvitationDto,
  ) {
    //todo: use memberservice to create a member if the status is accepted
    return `This action updates session invitation for session ${sessionId} and user ${userId}`;
  }

  remove(sessionId: string, userId: string) {
    return `This action removes session invitation for session ${sessionId} and user ${userId}`;
  }
}
