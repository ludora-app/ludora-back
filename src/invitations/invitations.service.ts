import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionsService } from 'src/sessions/sessions.service';
import { USERSELECT } from 'src/shared/constants/select-user';
import { UsersService } from 'src/users/users.service';
import { CreateInvitationDto } from './dto/input/create-invitation.dto';
import { UpdateInvitationDto } from './dto/input/update-invitation.dto';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionsService: SessionsService,
    private readonly usersService: UsersService,
  ) {}

  async create(createInvitationDto: CreateInvitationDto) {
    // checks if the session exists
    const existingSession = await this.sessionsService.findOne(createInvitationDto.sessionId);

    if (!existingSession) {
      throw new BadRequestException('Session not found');
    }
    // checks if the user exists
    const existingUser = await this.usersService.findOne(
      createInvitationDto.userId,
      USERSELECT.findOne,
    );

    if (!existingUser) {
      throw new BadRequestException('User not found');
    }

    // checks if the user is already invited to the session
    const existingInvitation = await this.prisma.session_invitations.findUnique({
      where: {
        sessionId_userId: {
          sessionId: createInvitationDto.sessionId,
          userId: createInvitationDto.userId,
        },
      },
    });

    if (existingInvitation) {
      throw new ConflictException('User already invited to the session');
    }

    const invitation = await this.prisma.session_invitations.create({
      data: {
        sessionId: createInvitationDto.sessionId,
        userId: createInvitationDto.userId,
      },
    });

    return invitation;
  }

  findAll() {
    return `This action returns all invitations`;
  }

  findOne(id: number) {
    return `This action returns a #${id} invitation`;
  }

  update(id: number, updateInvitationDto: UpdateInvitationDto) {
    return `This action updates a #${id} invitation`;
  }

  remove(id: number) {
    return `This action removes a #${id} invitation`;
  }
}
