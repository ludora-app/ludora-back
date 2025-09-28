import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
// import { Message_type } from '@prisma/client';

@Injectable()
export class WebsocketsService {
  constructor(public prisma: PrismaService) {}

  private readonly userSocketMap = new Map<string, string>();
  private readonly socketUserMap = new Map<string, string>();
  private readonly groupUsers = new Map<string, Set<string>>();

  // addUser(userUid: string, socket_uid: string) {
  //   this.userSocketMap.set(userUid, socket_uid);
  //   this.socketUserMap.set(socket_uid, userUid);
  // }

  // removeUser(socket_uid: string) {
  //   const userUid = this.socketUserMap.get(socket_uid);
  //   if (userUid) {
  //     this.userSocketMap.delete(userUid);
  //     this.socketUserMap.delete(socket_uid);
  //   }
  // }

  // getUserSocketUid(userUid: string): string | undefined {
  //   return this.userSocketMap.get(userUid);
  // }

  // addUserToGroup(userUid: string, group_uid: string) {
  //   if (!this.groupUsers.has(group_uid)) {
  //     this.groupUsers.set(group_uid, new Set());
  //   }
  //   this.groupUsers.get(group_uid).add(userUid);
  // }

  // removeUserFromGroup(userUid: string, group_uid: string) {
  //   const group = this.groupUsers.get(group_uid);
  //   if (group) {
  //     group.delete(userUid);
  //   }
  // }

  // isUserInGroup(userUid: string, group_uid: string): boolean {
  //   const group = this.groupUsers.get(group_uid);
  //   return group ? group.has(userUid) : false;
  // }

  // async createGroup(name: string): Promise<string> {
  //   const group_uid = uuidv4();
  //   this.groupUsers.set(group_uid, new Set());
  //   await this.prisma.conversations.create({
  //     data: {
  //       uid: group_uid,
  //       name,
  //       type: 'GROUP',
  //     },
  //   });
  //   return group_uid;
  // }

  // async createMessage(
  //   sender_uid: string,
  //   _: string,
  //   content: string,
  //   conversation_uid: string,
  //   type: Message_type,
  // ) {
  //   return this.prisma.$transaction(async () => {
  //     await this.prisma.messages.create({
  //       data: {
  //         content,
  //         conversation: {
  //           connect: { uid: conversation_uid },
  //         },
  //         sender: {
  //           connect: { uid: sender_uid },
  //         },
  //         status: 'SENT',
  //         type,
  //       },
  //     });
  //     //? Update the conversation so that the most recent one is at the top
  //     await this.prisma.conversations.update({
  //       data: { updatedAt: new Date() },
  //       where: { uid: conversation_uid },
  //     });
  //   });
  // }

  // async createGroupMessage(
  //   sender_uid: string,
  //   group_uid: string,
  //   content: string,
  //   type: Message_type,
  // ) {
  //   const conversationExists = await this.prisma.conversations.findUnique({
  //     where: { uid: group_uid },
  //   });

  //   if (!conversationExists) {
  //     throw new Error(`Conversation with uid ${group_uid} not found`);
  //   }

  //   return this.prisma.messages.create({
  //     data: {
  //       content,
  //       conversation: {
  //         connect: { uid: group_uid },
  //       },
  //       sender: {
  //         connect: { uid: sender_uid },
  //       },
  //       status: 'SENT',
  //       type,
  //     },
  //   });
  // }
}
