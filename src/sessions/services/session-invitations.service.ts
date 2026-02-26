import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InvitationStatus, SessionInvitations } from 'generated/prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { EventTypes } from 'src/notifications/constants/event.types';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSessionPlayerDto } from 'src/sessions/dto/input/create-session-player.dto';
import { SessionPlayersService } from 'src/sessions/services/session-players.service';
import { SessionsService } from 'src/sessions/services/sessions.service';
import { USERSELECT } from 'src/shared/constants/select-user';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';
import { UsersService } from 'src/users/users.service';
import { CreateManySessionInvitationDto } from '../dto/input/create-many-session-invitation.dto';
import { SessionInvitationFilterDto } from '../dto/input/session-invitation-filter.dto';
import { UpdateSessionInvitationDto } from '../dto/input/update-session-invitation.dto';

@Injectable()
export class SessionInvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionsService: SessionsService,
    private readonly usersService: UsersService,
    private readonly playersService: SessionPlayersService,
    private readonly logger: PinoLogger,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.setContext(SessionInvitationsService.name);
  }

  async createMany(
    senderUid: string,
    sessionUid: string,
    createManySessionInvitationDto: CreateManySessionInvitationDto,
  ): Promise<void> {
    const existingSender = await this.usersService.findOne(
      senderUid,
      USERSELECT.basicUserInfoDisplay,
    );
    if (!existingSender) {
      throw new NotFoundException('Sender not found');
    }
    const existingSession = await this.sessionsService.findOne(sessionUid);
    if (!existingSession) {
      throw new NotFoundException('Session not found');
    }
    const validUids = await this.checkValidUidBeforeSendingInvitations(
      senderUid,
      sessionUid,
      createManySessionInvitationDto.receiverUids,
    );

    //? Upsert each invitation: create if new, or set status back to PENDING if already exists (e.g. was CANCELED/REJECTED)
    const validUidsArray = Array.from(validUids ?? new Set<string>());
    if (validUidsArray.length > 0) {
      await this.prisma.$transaction(
        validUidsArray.map((receiverUid) =>
          this.prisma.sessionInvitations.upsert({
            create: { receiverUid, senderUid, sessionUid },
            update: { status: InvitationStatus.PENDING },
            where: {
              sessionUid_senderUid_receiverUid: {
                receiverUid,
                senderUid,
                sessionUid,
              },
            },
          }),
        ),
      );

      this.logger.debug(
        `${validUidsArray.length} users invited (or re-invited) to the session ${sessionUid}`,
      );
      if (validUidsArray.length > 0) {
        for (const uid of validUidsArray) {
          if (senderUid === uid) {
            this.logger.error(`User ${uid} cannot invite himself`);
            continue;
          }

          this.eventEmitter.emit(
            EventTypes.SESSION_INVITATION,
            {
              invitedBy: existingSender.firstname + ' ' + existingSender.lastname,
              inviterAvatar: existingSender.imageUrl,
              senderAvatar: existingSender.imageUrl,
              senderFirstname: existingSender.firstname,
              senderLastname: existingSender.lastname,
              senderUid: senderUid,
              sessionDate: existingSession.startDate,
              sessionSport: existingSession.sport,
              sessionTitle: existingSession.title,
              sessionUid: existingSession.uid,
            },
            uid,
          );
        }
      }
    } else {
      this.logger.warn(`No valid UIDs to invite to the session ${sessionUid}`);
    }
  }

  async findAllByReceiverId(
    receiverUid: string,
    filter: SessionInvitationFilterDto,
  ): Promise<PaginatedDataDto<SessionInvitations>> {
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
        status?: InvitationStatus;
      };
    } = {
      take: limit + 1,
      where: {
        receiverUid,
      },
    };

    if (scope === 'PENDING') {
      query.where.status = InvitationStatus.PENDING;
    } else if (scope === 'ACCEPTED') {
      query.where.status = InvitationStatus.ACCEPTED;
    } else if (scope === 'REJECTED') {
      query.where.status = InvitationStatus.REJECTED;
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
  ): Promise<PaginatedDataDto<SessionInvitations>> {
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
        status?: InvitationStatus;
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
      query.where.status = InvitationStatus.PENDING;
    } else if (scope === 'ACCEPTED') {
      query.where.status = InvitationStatus.ACCEPTED;
    } else if (scope === 'REJECTED') {
      query.where.status = InvitationStatus.REJECTED;
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

  /**
   * This function finds a session invitation by session UID and user UID using Prisma in TypeScript.
   * Used in order to check if an invitation exists independently of the sender or the receiver in the update method.
   * @param {string} sessionUid
   * @param {string} userUid
   * @returns The `findOneSessionBySenderOrReceiver` function is returning a Promise that resolves to
   * a `SessionInvitations` object. The function uses Prisma's `findFirst` method to query the database
   * for a `SessionInvitations` record that matches the provided `sessionUid` and either `senderUid`
   * or `receiverUid` equals to `userUid`.
   */
  async findOneSessionBySenderOrReceiver(sessionUid: string, userUid: string) {
    const existingSession = await this.sessionsService.findOne(sessionUid);
    if (!existingSession) {
      throw new NotFoundException(`Session ${sessionUid} not found`);
    }
    const invitation = await this.prisma.sessionInvitations.findFirst({
      where: {
        OR: [{ senderUid: userUid }, { receiverUid: userUid }],
        sessionUid,
      },
    });
    return invitation;
  }

  async update(updateSessionInvitationDto: UpdateSessionInvitationDto): Promise<void> {
    const existingInvitation = await this.prisma.sessionInvitations.findFirst({
      include: {
        session: {
          select: {
            creatorUid: true,
          },
        },
      },
      where: {
        OR: [
          { senderUid: updateSessionInvitationDto.userUid },
          { receiverUid: updateSessionInvitationDto.userUid },
        ],
        sessionUid: updateSessionInvitationDto.sessionUid,
      },
    });

    if (!existingInvitation) {
      throw new NotFoundException('Session invitation not found');
    }

    if (updateSessionInvitationDto.status === existingInvitation.status) {
      throw new BadRequestException(`Status ${updateSessionInvitationDto.status} is already set`);
    }
    let isSender;
    let isReceiver;
    if (updateSessionInvitationDto.userUid === existingInvitation.senderUid) {
      isSender = true;
    }
    if (updateSessionInvitationDto.userUid === existingInvitation.receiverUid) {
      isReceiver = true;
    }

    if (
      isReceiver &&
      updateSessionInvitationDto.status !== InvitationStatus.ACCEPTED &&
      updateSessionInvitationDto.status !== InvitationStatus.REJECTED
    ) {
      throw new BadRequestException(
        `The status ${updateSessionInvitationDto.status} is not allowed for the receiver`,
      );
    }
    if (isSender && updateSessionInvitationDto.status !== InvitationStatus.CANCELED) {
      throw new BadRequestException(
        `The status ${updateSessionInvitationDto.status} is not allowed for the sender`,
      );
    }
    const createSessionPlayerDto: CreateSessionPlayerDto = {
      sessionUid: existingInvitation.sessionUid,
      teamUid: existingInvitation.sessionUid,
      userUid: existingInvitation.receiverUid,
    };
    if (isSender && updateSessionInvitationDto.status === InvitationStatus.CANCELED) {
      await this.prisma.sessionInvitations.update({
        data: { status: updateSessionInvitationDto.status },
        where: {
          sessionUid_senderUid_receiverUid: {
            receiverUid: existingInvitation.receiverUid,
            senderUid: existingInvitation.senderUid,
            sessionUid: existingInvitation.sessionUid,
          },
        },
      });
      return;
    }
    if (isReceiver && updateSessionInvitationDto.status === InvitationStatus.ACCEPTED) {
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

        await this.playersService.addPlayerToSession(
          createSessionPlayerDto,
          existingInvitation.session.creatorUid,
          tx,
        );

        return updated;
      });
    }

    this.logger.info(
      `Session invitation with sessionUid${existingInvitation.sessionUid} updated to ${updateSessionInvitationDto.status}`,
    );
  }

  remove(sessionUid: string, userUid: string) {
    return `This action removes session invitation for session ${sessionUid} and user ${userUid}`;
  }

  async getTotalPendingInvitations(): Promise<number> {
    return await this.prisma.sessionInvitations.count({
      where: {
        status: InvitationStatus.PENDING,
      },
    });
  }

  /**
   * The function `checkValidUid` validates a list of receiver UIDs against certain conditions and
   * returns a set of valid UIDs.
   * @param {string} senderUid - The `senderUid` parameter represents the unique identifier of the user
   * who is sending the invitation.
   * @param {string} sessionUid - The `sessionUid` parameter in the `checkValidUid` function represents
   * the unique identifier of a session. This function is used to validate a list of receiver UIDs to
   * ensure they are valid for a given sender UID and session UID. The function checks if the sender UID
   * is not the same as
   * @param {string[]} receiverUids - The `receiverUids` parameter in the `checkValidUid` function is an
   * array of strings containing the user IDs of the receivers. The function iterates over each receiver
   * UID in the array to perform validation checks before adding the valid UIDs to a `Set` and returning
   * it as a `
   * @returns The `checkValidUid` function returns a Promise that resolves to a Set of valid user UIDs.
   * The function iterates over an array of receiver UIDs, performs various checks for each UID, and adds
   * the valid UIDs to the Set. If any of the checks fail, an error message is logged and the function
   * returns early without adding the UID to the Set.
   */
  async checkValidUidBeforeSendingInvitations(
    senderUid: string,
    sessionUid: string,
    receiverUids: string[],
  ): Promise<Set<string>> {
    const validUids = new Set<string>();

    for (const receiverUid of receiverUids) {
      if (senderUid === receiverUid) {
        this.logger.error(`User ${receiverUid} cannot invite himself`);
        continue;
      }
      const existingReceiver = await this.usersService.findOne(
        receiverUid,
        USERSELECT.checkIfUserExists,
      );

      if (!existingReceiver) {
        this.logger.error(`User ${receiverUid} not found`);
        continue;
      }

      const existingPlayer = await this.prisma.sessionPlayers.findFirst({
        where: {
          sessionUid,
          userUid: receiverUid,
        },
      });
      if (existingPlayer) {
        this.logger.error(`User ${receiverUid} already in session ${sessionUid}`);
        continue;
      }

      // ? checks if the user was already invited to the session by the sender
      const existingInvitation = await this.prisma.sessionInvitations.findFirst({
        where: {
          receiverUid: receiverUid,
          senderUid,
          sessionUid: sessionUid,
        },
      });
      // ? if the user is already invited and did not reject, skip (do not add to validUids)
      if (
        existingInvitation &&
        (existingInvitation.status === InvitationStatus.ACCEPTED ||
          existingInvitation.status === InvitationStatus.PENDING)
      ) {
        this.logger.warn(`User ${receiverUid} already invited to the session ${sessionUid}`);
        continue;
      }
      validUids.add(receiverUid);
    }

    return validUids;
  }
}
