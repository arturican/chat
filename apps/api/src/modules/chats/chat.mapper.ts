import type { Chat, ChatMember, Profile, User } from '@prisma/client';
import type { PublicChat } from '@pulsechat/contracts';

import { toPublicUser } from '../auth/auth.mapper';

interface ChatUser extends User {
  profile: Profile | null;
}

interface ChatMemberWithUser extends ChatMember {
  user: ChatUser;
}

interface ChatWithMembers extends Chat {
  members: ChatMemberWithUser[];
}

function toChatType(type: Chat['type']): PublicChat['type'] {
  return type === 'DIRECT' ? 'direct' : 'group';
}

function buildChatTitle(chat: ChatWithMembers, currentUserId: string): string {
  if (chat.type === 'GROUP') {
    return chat.title?.trim() || 'Untitled group';
  }

  const peerMember = chat.members.find((member) => member.userId !== currentUserId);
  const profile = peerMember?.user.profile;

  if (!profile) {
    return 'Direct chat';
  }

  return profile.displayName?.trim() || profile.username;
}

export function toPublicChat(chat: ChatWithMembers, currentUserId: string): PublicChat {
  const members = chat.members.map((member) => toPublicUser(member.user));

  return {
    id: chat.id,
    type: toChatType(chat.type),
    title: buildChatTitle(chat, currentUserId),
    members,
    memberCount: members.length,
    createdAt: chat.createdAt.toISOString(),
    updatedAt: chat.updatedAt.toISOString(),
  };
}
