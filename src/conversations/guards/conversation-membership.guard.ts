import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ConversationMembershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userUid = request.user?.uid;
    const conversationUid = request.params.uid || request.query.uid;

    if (!userUid || !conversationUid) throw new UnauthorizedException();

    const membership = await this.prisma.conversationMembers.findUnique({
      where: {
        conversationUid_userUid: { conversationUid, userUid },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this conversation.');
    }

    request.membership = membership;

    return true;
  }
}
