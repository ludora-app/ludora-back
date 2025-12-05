import uuid from 'uuid';
import { Injectable } from '@nestjs/common';
import { Messages } from 'generated/prisma/browser';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConversationType, MessageStatus, MessageType } from 'generated/prisma/enums';
@Injectable()
export class WebsocketsService {
  constructor(public prisma: PrismaService) {}

  /**
   * Map of user uid to socket uid
   */
  private readonly userSocketMap = new Map<string, string>();
  /**
   * Map of socket uid to user uid
   */
  private readonly socketUserMap = new Map<string, string>();
  /**
   * Map of group uid to set of user uids
   */
  private readonly groupUsers = new Map<string, Set<string>>();

  /**
   * Add a user to the map
   * @param userUid - The user uid
   * @param socket_uid - The socket uid
   */
  addUser(userUid: string, socket_uid: string): void {
    this.userSocketMap.set(userUid, socket_uid);
    this.socketUserMap.set(socket_uid, userUid);
  }

  /**
   * Remove a user from the map
   * @param socket_uid - The socket uid
   */
  removeUser(socket_uid: string): void {
    const userUid = this.socketUserMap.get(socket_uid);
    if (userUid) {
      this.userSocketMap.delete(userUid);
      this.socketUserMap.delete(socket_uid);
    }
  }

  /**
   * Get the socket uid for a user
   * @param userUid - The user uid
   * @returns The socket uid
   */
  getUserSocketUid(userUid: string): string | undefined {
    return this.userSocketMap.get(userUid);
  }

  /**
   * Add a user to a group
   * @param userUid - The user uid
   * @param group_uid - The group uid
   */
  addUserToGroup(userUid: string, group_uid: string): void {
    if (!this.groupUsers.has(group_uid)) {
      this.groupUsers.set(group_uid, new Set());
    }
    this.groupUsers.get(group_uid).add(userUid);
  }

  /**
   * Remove a user from a group
   * @param userUid - The user uid
   * @param group_uid - The group uid
   */
  removeUserFromGroup(userUid: string, group_uid: string): void {
    const group = this.groupUsers.get(group_uid);
    if (group) {
      group.delete(userUid);
    }
  }

  /**
   * Check if a user is in a group
   * @param userUid - The user uid
   * @param group_uid - The group uid
   * @returns True if the user is in the group, false otherwise
   */
  isUserInGroup(userUid: string, group_uid: string): boolean {
    const group = this.groupUsers.get(group_uid);
    return group ? group.has(userUid) : false;
  }

  /**
   * Create a group
   * @param name - The name of the group
   * @returns The group uid
   */
  async createGroup(name: string): Promise<string> {
    const group_uid = uuid.v4();
    this.groupUsers.set(group_uid, new Set());
    await this.prisma.conversations.create({
      data: {
        name,
        type: ConversationType.GROUP,
        uid: group_uid,
      },
    });
    return group_uid;
  }

  /**
   * Create a message
   * @param sender_uid - The sender uid
   * @param _ - The conversation uid
   * @param content - The content of the message
   * @param conversation_uid - The conversation uid
   * @param type - The type of the message
   */
  async createMessage(
    sender_uid: string,
    _: string,
    content: string,
    conversation_uid: string,
    type: MessageType,
  ): Promise<void> {
    return this.prisma.$transaction(async () => {
      await this.prisma.messages.create({
        data: {
          content,
          conversation: {
            connect: { uid: conversation_uid },
          },
          sender: {
            connect: { uid: sender_uid },
          },
          status: MessageStatus.SENT,
          type,
        },
      });
      //? Update the conversation so that the most recent one is at the top
      await this.prisma.conversations.update({
        data: { updatedAt: new Date() },
        where: { uid: conversation_uid },
      });
    });
  }

  async createGroupMessage(
    sender_uid: string,
    group_uid: string,
    content: string,
    type: MessageType,
  ): Promise<Messages> {
    const conversationExists = await this.prisma.conversations.findUnique({
      where: { uid: group_uid },
    });

    if (!conversationExists) {
      throw new Error(`Conversation with uid ${group_uid} not found`);
    }

    const newMessage = await this.prisma.messages.create({
      data: {
        content,
        conversation: {
          connect: { uid: group_uid },
        },
        sender: {
          connect: { uid: sender_uid },
        },
        status: MessageStatus.SENT,
        type,
      },
    });
    return newMessage;
  }
}
