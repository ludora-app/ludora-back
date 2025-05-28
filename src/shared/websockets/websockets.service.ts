import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
// import { Message_type } from '@prisma/client';

@Injectable()
export class WebsocketsService {
  constructor(public prisma: PrismaService) {}

  private readonly userSocketMap = new Map<string, string>();
  private readonly socketUserMap = new Map<string, string>();
  private readonly groupUsers = new Map<string, Set<string>>();

  // addUser(userId: string, socket_id: string) {
  //   this.userSocketMap.set(userId, socket_id);
  //   this.socketUserMap.set(socket_id, userId);
  // }

  // removeUser(socket_id: string) {
  //   const userId = this.socketUserMap.get(socket_id);
  //   if (userId) {
  //     this.userSocketMap.delete(userId);
  //     this.socketUserMap.delete(socket_id);
  //   }
  // }

  // getUserSocketId(userId: string): string | undefined {
  //   return this.userSocketMap.get(userId);
  // }

  // addUserToGroup(userId: string, group_id: string) {
  //   if (!this.groupUsers.has(group_id)) {
  //     this.groupUsers.set(group_id, new Set());
  //   }
  //   this.groupUsers.get(group_id).add(userId);
  // }

  // removeUserFromGroup(userId: string, group_id: string) {
  //   const group = this.groupUsers.get(group_id);
  //   if (group) {
  //     group.delete(userId);
  //   }
  // }

  // isUserInGroup(userId: string, group_id: string): boolean {
  //   const group = this.groupUsers.get(group_id);
  //   return group ? group.has(userId) : false;
  // }

  // async createGroup(name: string): Promise<string> {
  //   const group_id = uuidv4();
  //   this.groupUsers.set(group_id, new Set());
  //   await this.prisma.conversations.create({
  //     data: {
  //       id: group_id,
  //       name,
  //       type: 'GROUP',
  //     },
  //   });
  //   return group_id;
  // }

  // async createMessage(
  //   sender_id: string,
  //   _: string,
  //   content: string,
  //   conversation_id: string,
  //   type: Message_type,
  // ) {
  //   return this.prisma.$transaction(async () => {
  //     await this.prisma.messages.create({
  //       data: {
  //         content,
  //         conversation: {
  //           connect: { id: conversation_id },
  //         },
  //         sender: {
  //           connect: { id: sender_id },
  //         },
  //         status: 'SENT',
  //         type,
  //       },
  //     });
  //     //? Update the conversation so that the most recent one is at the top
  //     await this.prisma.conversations.update({
  //       data: { updatedAt: new Date() },
  //       where: { id: conversation_id },
  //     });
  //   });
  // }

  // async createGroupMessage(
  //   sender_id: string,
  //   group_id: string,
  //   content: string,
  //   type: Message_type,
  // ) {
  //   const conversationExists = await this.prisma.conversations.findUnique({
  //     where: { id: group_id },
  //   });

  //   if (!conversationExists) {
  //     throw new Error(`Conversation with id ${group_id} not found`);
  //   }

  //   return this.prisma.messages.create({
  //     data: {
  //       content,
  //       conversation: {
  //         connect: { id: group_id },
  //       },
  //       sender: {
  //         connect: { id: sender_id },
  //       },
  //       status: 'SENT',
  //       type,
  //     },
  //   });
  // }
}
