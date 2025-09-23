import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionsService } from 'src/sessions/sessions.service';
import { UsersService } from 'src/users/users.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionsService: SessionsService,
    private readonly usersService: UsersService,
  ) {}

  async create(createInvitationDto: CreateInvitationDto) {
    const existingSession = await this.sessionsService.findOne(createInvitationDto.sessionId);

    if (!existingSession) {
      throw new BadRequestException('Session not found');
    }
    // todo : check if the user is already invited to the session
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
