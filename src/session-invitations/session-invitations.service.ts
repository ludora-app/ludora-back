import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { USERSELECT } from 'src/shared/constants/select-user';
import { SessionsService } from 'src/sessions/sessions.service';
import { Invitation_status, SessionInvitations } from '@prisma/client';
import { SessionPlayersService } from 'src/sessions/session-players.service';
import { CreateSessionPlayerDto } from 'src/sessions/dto/input/create-session-player.dto';
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
    private readonly playersService: SessionPlayersService,
  ) {}

  private logger = new Logger(SessionInvitationsService.name);

  async create(
    senderUid: string,
    createSessionInvitationDto: CreateSessionInvitationDto,
  ): Promise<SessionInvitations> {
    // checks if the session exists
    const existingSession = await this.sessionsService.findOne(
      createSessionInvitationDto.sessionUid,
    );

    if (!existingSession) {
      this.logger.error(`Session ${createSessionInvitationDto.sessionUid} not found`);
      throw new BadRequestException('Session not found');
    }
    // checks if the receiver exists
    const existingReceiver = await this.usersService.findOne(
      createSessionInvitationDto.receiverUid,
      USERSELECT.findOne,
    );

    if (!existingReceiver) {
      this.logger.error(`User ${createSessionInvitationDto.receiverUid} not found`);
      throw new BadRequestException('User not found');
    }

    if (senderUid === createSessionInvitationDto.receiverUid) {
      this.logger.error(`User ${createSessionInvitationDto.receiverUid} cannot invite himself`);
      throw new BadRequestException('You cannot invite yourself to a session');
    }

    // checks if the user is already invited to the session
    const existingInvitation = await this.prisma.sessionInvitations.findFirst({
      where: {
        receiverUid: createSessionInvitationDto.receiverUid,
        sessionUid: createSessionInvitationDto.sessionUid,
      },
    });

    // ? if the user is already invited to the session and did not reject, we throw an error
    if (
      existingInvitation &&
      (existingInvitation.status === Invitation_status.ACCEPTED ||
        existingInvitation.status === Invitation_status.PENDING)
    ) {
      this.logger.error(
        `User ${createSessionInvitationDto.receiverUid} already invited to the session ${createSessionInvitationDto.sessionUid}`,
      );
      throw new ConflictException('User already invited to the session');
    }

    const invitation = await this.prisma.sessionInvitations.create({
      data: {
        receiverUid: createSessionInvitationDto.receiverUid,
        senderUid,
        sessionUid: createSessionInvitationDto.sessionUid,
      },
    });
    this.logger.log(
      `User ${createSessionInvitationDto.receiverUid} invited to the session ${createSessionInvitationDto.sessionUid} by User${senderUid}`,
    );
    return invitation;
  }

  async findAllByReceiverId(
    receiverUid: string,
    filter: SessionInvitationFilterDto,
  ): Promise<{ items: SessionInvitations[]; nextCursor: string | null; totalCount: number }> {
    const existingUser = await this.usersService.findOne(receiverUid, USERSELECT.findOne);

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const { cursor, limit, scope } = filter;
    const query: {
      take: number;
      skip?: number;
      cursor?: {
        sessionUid_senderUid_receiverUid: {
          sessionUid: string;
          senderUid: string;
          receiverUid: string;
        };
      };
      where: {
        receiverUid: string;
        status?: Invitation_status;
      };
    } = {
      take: limit + 1,
      where: {
        receiverUid,
      },
    };

    if (scope === 'PENDING') {
      query.where.status = Invitation_status.PENDING;
    } else if (scope === 'ACCEPTED') {
      query.where.status = Invitation_status.ACCEPTED;
    } else if (scope === 'REJECTED') {
      query.where.status = Invitation_status.REJECTED;
    }

    //cursor on sessionUid since receiverUid doesnt change here
    if (cursor) {
      const [cursorSessionId, cursorSenderId, cursorReceiverId] = cursor.split(':');
      query.cursor = {
        sessionUid_senderUid_receiverUid: {
          receiverUid: cursorReceiverId,
          senderUid: cursorSenderId,
          sessionUid: cursorSessionId,
        },
      };
      query.skip = 1;
    }

    const sessionInvitations = await this.prisma.sessionInvitations.findMany({
      ...query,
      select: {
        createdAt: true,
        receiverUid: true,
        senderUid: true,
        sessionUid: true,
        status: true,
        updatedAt: true,
        userId: true,
      },
    });

    return {
      items: sessionInvitations,
      nextCursor: null,
      totalCount: sessionInvitations.length,
    };
  }

  async findAllBySessionId(
    sessionUid: string,
    filter: SessionInvitationFilterDto,
  ): Promise<{ items: SessionInvitations[]; nextCursor: string | null; totalCount: number }> {
    const existingSession = await this.sessionsService.findOne(sessionUid);

    if (!existingSession) {
      throw new NotFoundException('Session not found');
    }

    const { cursor, limit, scope } = filter;
    const query: {
      take: number;
      skip?: number;
      cursor?: {
        sessionUid_senderUid_receiverUid: {
          sessionUid: string;
          senderUid: string;
          receiverUid: string;
        };
      };
      where: {
        sessionUid: string;
        status?: Invitation_status;
      };
    } = {
      take: limit + 1,
      where: {
        sessionUid,
      },
    };
    //cursor on userUid since sessionUid doesnt change here
    if (cursor) {
      const [cursorSessionId, cursorSenderId, cursorReceiverId] = cursor.split(':');
      query.cursor = {
        sessionUid_senderUid_receiverUid: {
          receiverUid: cursorReceiverId,
          senderUid: cursorSenderId,
          sessionUid: cursorSessionId,
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

    const sessionInvitations = await this.prisma.sessionInvitations.findMany({
      ...query,
      select: {
        createdAt: true,
        receiverUid: true,
        senderUid: true,
        sessionUid: true,
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

  async findOne(sessionUid: string, receiverUid: string) {
    const existingSession = await this.sessionsService.findOne(sessionUid);
    if (!existingSession) {
      throw new NotFoundException(`Session ${sessionUid} not found`);
    }

    const existingReceiver = await this.usersService.findOne(receiverUid, USERSELECT.findOne);
    if (!existingReceiver) {
      throw new NotFoundException(`User ${receiverUid} not found`);
    }

    const invitation = await this.prisma.sessionInvitations.findFirst({
      where: {
        receiverUid,
        sessionUid,
      },
    });
    return invitation;
  }

  async update(updateSessionInvitationDto: UpdateSessionInvitationDto): Promise<void> {
    //todo: use memberservice to create a member if the status is accepted
    const existingInvitation = await this.findOne(
      updateSessionInvitationDto.sessionUid,
      updateSessionInvitationDto.userUid,
    );

    if (!existingInvitation) {
      throw new NotFoundException('Session invitation not found');
    }

    if (updateSessionInvitationDto.status === existingInvitation.status) {
      throw new BadRequestException(`Status ${updateSessionInvitationDto.status} is already set`);
    }
    // let isSender;
    let isReceiver;
    if (updateSessionInvitationDto.userUid === existingInvitation.senderUid) {
      // isSender = true;
    }
    if (updateSessionInvitationDto.userUid === existingInvitation.receiverUid) {
      isReceiver = true;
    }

    //todo: add a CANCELED status
    if (isReceiver && updateSessionInvitationDto.status !== Invitation_status.ACCEPTED) {
      throw new BadRequestException(`You cannot change the status of the sender or the receiver`);
    }
    const createSessionPlayerDto: CreateSessionPlayerDto = {
      sessionUid: existingInvitation.sessionUid,
      teamUid: existingInvitation.sessionUid,
      userUid: existingInvitation.receiverUid,
    };

    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.sessionInvitations.update({
        data: { status: updateSessionInvitationDto.status },
        where: {
          sessionUid_senderUid_receiverUid: {
            receiverUid: existingInvitation.receiverUid,
            senderUid: existingInvitation.senderUid,
            sessionUid: existingInvitation.sessionUid,
          },
        },
      });

      await this.playersService.addPlayerToSession(createSessionPlayerDto, tx);

      return updated;
    });

    this.logger.log(
      `Session invitation with sessionUid${existingInvitation.sessionUid} updated to ${updateSessionInvitationDto.status}`,
    );
  }

  remove(sessionUid: string, userUid: string) {
    return `This action removes session invitation for session ${sessionUid} and user ${userUid}`;
  }
}
