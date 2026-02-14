import { ConversationMemberResponseData } from '../dto/output/conversation-member-response.dto';

export interface RawConversationMember {
  joinedAt: Date;
  isAdmin: boolean;
  conversation: {
    sessionUid: string;
  };
  sessionTeams: {
    teamLabel: string;
    teamName: string;
  }[];
  user: {
    firstname: string;
    lastname: string;
    imageUrl: string;
    uid: string;
  };
}

export class ConversationMembersMapper {
  static toDto(member: RawConversationMember): ConversationMemberResponseData {
    return {
      firstname: member.user.firstname,
      imageUrl: member.user.imageUrl,
      isAdmin: member.isAdmin,
      joinedAt: member.joinedAt,
      lastname: member.user.lastname,
      sessionData: member.conversation.sessionUid
        ? {
            teamLabel: member.sessionTeams[0]?.teamLabel ?? null,
            teamName: member.sessionTeams[0]?.teamName ?? null,
          }
        : null,
      userUid: member.user.uid,
    };
  }
}
