import { Sessions } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { PipeTransform, Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class SessionsPipe implements PipeTransform {
  constructor(private readonly prisma: PrismaService) {}

  async transform(sessionUid: string): Promise<Sessions> {
    const session = await this.prisma.sessions.findUnique({
      where: { uid: sessionUid },
    });

    if (!session) {
      throw new NotFoundException(`Session not found`);
    }

    return session;
  }
}
