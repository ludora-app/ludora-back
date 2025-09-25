import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { USERSELECT } from 'src/shared/constants/select-user';
import { SessionsService } from 'src/sessions/sessions.service';
import { Invitation_status, Session_invitations } from '@prisma/client';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
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

  private logger = new Logger(SessionInvitationsService.name);

  async create(
    senderId: string,
    createSessionInvitationDto: CreateSessionInvitationDto,
  ): Promise<Session_invitations> {
    // checks if the session exists
    const existingSession = await this.sessionsService.findOne(
      createSessionInvitationDto.sessionId,
    );

    if (!existingSession) {
      this.logger.error(`Session ${createSessionInvitationDto.sessionId} not found`);
      throw new BadRequestException('Session not found');
    }
    // checks if the receiver exists
    const existingReceiver = await this.usersService.findOne(
      createSessionInvitationDto.receiverId,
      USERSELECT.findOne,
    );

    if (!existingReceiver) {
      this.logger.error(`User ${createSessionInvitationDto.receiverId} not found`);
      throw new BadRequestException('User not found');
    }

    if (senderId === createSessionInvitationDto.receiverId) {
      this.logger.error(`User ${createSessionInvitationDto.receiverId} cannot invite himself`);
      throw new BadRequestException('You cannot invite yourself to a session');
    }

    // checks if the user is already invited to the session
    const existingInvitation = await this.prisma.session_invitations.findFirst({
      where: {
        receiverId: createSessionInvitationDto.receiverId,
        sessionId: createSessionInvitationDto.sessionId,
      },
    });

    // ? if the user is already invited to the session and did not reject, we throw an error
    if (
      existingInvitation &&
      (existingInvitation.status === Invitation_status.ACCEPTED ||
        existingInvitation.status === Invitation_status.PENDING)
    ) {
      this.logger.error(
        `User ${createSessionInvitationDto.receiverId} already invited to the session ${createSessionInvitationDto.sessionId}`,
      );
      throw new ConflictException('User already invited to the session');
    }

    const invitation = await this.prisma.session_invitations.create({
      data: {
        receiverId: createSessionInvitationDto.receiverId,
        senderId,
        sessionId: createSessionInvitationDto.sessionId,
      },
    });
    this.logger.log(
      `User ${createSessionInvitationDto.receiverId} invited to the session ${createSessionInvitationDto.sessionId} by User${senderId}`,
    );
    return invitation;
  }

  async findAllByReceiverId(
    receiverId: string,
    filter: SessionInvitationFilterDto,
  ): Promise<{ items: Session_invitations[]; nextCursor: string | null; totalCount: number }> {
    const existingUser = await this.usersService.findOne(receiverId, USERSELECT.findOne);

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const { cursor, limit, scope } = filter;
    const query: {
      take: number;
      skip?: number;
      cursor?: {
        sessionId_senderId_receiverId: {
          sessionId: string;
          senderId: string;
          receiverId: string;
        };
      };
      where: {
        receiverId: string;
        status?: Invitation_status;
      };
    } = {
      take: limit + 1,
      where: {
        receiverId,
      },
    };

    if (scope === 'PENDING') {
      query.where.status = Invitation_status.PENDING;
    } else if (scope === 'ACCEPTED') {
      query.where.status = Invitation_status.ACCEPTED;
    } else if (scope === 'REJECTED') {
      query.where.status = Invitation_status.REJECTED;
    }

    //cursor on sessionId since receiverId doesnt change here
    if (cursor) {
      const [cursorSessionId, cursorSenderId, cursorReceiverId] = cursor.split(':');
      query.cursor = {
        sessionId_senderId_receiverId: {
          receiverId: cursorReceiverId,
          senderId: cursorSenderId,
          sessionId: cursorSessionId,
        },
      };
      query.skip = 1;
    }

    const sessionInvitations = await this.prisma.session_invitations.findMany({
      ...query,
      select: {
        createdAt: true,
        receiverId: true,
        senderId: true,
        sessionId: true,
        status: true,
        updatedAt: true,
      },
    });

    return {
      items: sessionInvitations,
      nextCursor: null,
      totalCount: sessionInvitations.length,
    };
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
        sessionId_senderId_receiverId: {
          sessionId: string;
          senderId: string;
          receiverId: string;
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
      const [cursorSessionId, cursorSenderId, cursorReceiverId] = cursor.split(':');
      query.cursor = {
        sessionId_senderId_receiverId: {
          receiverId: cursorReceiverId,
          senderId: cursorSenderId,
          sessionId: cursorSessionId,
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
        receiverId: true,
        senderId: true,
        sessionId: true,
        status: true,
        updatedAt: true,
      },
    });

    return {
      items: sessionInvitations,
      nextCursor: null,
      totalCount: sessionInvitations.length,
    };
  }

  async findOne(sessionId: string, receiverId: string) {
    const existingSession = await this.sessionsService.findOne(sessionId);
    if (!existingSession) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    const existingReceiver = await this.usersService.findOne(receiverId, USERSELECT.findOne);
    if (!existingReceiver) {
      throw new NotFoundException(`User ${receiverId} not found`);
    }

    const invitation = await this.prisma.session_invitations.findFirst({
      where: {
        receiverId,
        sessionId,
      },
    });
    return invitation;
  }

  async update(updateSessionInvitationDto: UpdateSessionInvitationDto) {
    //todo: use memberservice to create a member if the status is accepted
    const existingInvitation = await this.findOne(
      updateSessionInvitationDto.sessionId,
      updateSessionInvitationDto.userId,
    );

    if (!existingInvitation) {
      throw new NotFoundException('Session invitation not found');
    }

    if (updateSessionInvitationDto.status === existingInvitation.status) {
      throw new BadRequestException(`Status ${updateSessionInvitationDto.status} is already set`);
    }
    let isSender;
    let isReceiver;
    if (updateSessionInvitationDto.userId === existingInvitation.senderId) {
      isSender = true;
    }
    if (updateSessionInvitationDto.userId === existingInvitation.receiverId) {
      isReceiver = true;
    }

    //todo: add a CANCELED status
    if (isReceiver && updateSessionInvitationDto.status !== Invitation_status.ACCEPTED) {
      throw new BadRequestException(`You cannot change the status of the sender or the receiver`);
    }
    // todo: use the member service to create a member if the status is accepted
    const updatedInvitation = await this.prisma.session_invitations.update({
      data: { status: updateSessionInvitationDto.status },
      where: {
        sessionId_senderId_receiverId: {
          receiverId: existingInvitation.receiverId,
          senderId: existingInvitation.senderId,
          sessionId: existingInvitation.sessionId,
        },
      },
    });

    this.logger.log(
      `Session invitation with sessionId${existingInvitation.sessionId} updated to ${updateSessionInvitationDto.status}`,
    );

    return updatedInvitation;
  }

  remove(sessionId: string, userId: string) {
    return `This action removes session invitation for session ${sessionId} and user ${userId}`;
  }
}
