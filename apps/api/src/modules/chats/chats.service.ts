import { Inject, Injectable } from '@nestjs/common';
import type { ChatDetailsResponse, ChatListResponse, PublicChat } from '@pulsechat/contracts';

import { AppException } from '../../common/exceptions/app-exception';
import { PrismaService } from '../../prisma/prisma.service';
import { toPublicChat } from './chat.mapper';

@Injectable()
export class ChatsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listChats(userId: string): Promise<ChatListResponse> {
    const chats = await this.prisma.chat.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: this.chatInclude,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return {
      chats: chats.map((chat) => toPublicChat(chat, userId)),
    };
  }

  async getChat(userId: string, chatId: string): Promise<ChatDetailsResponse> {
    const chat = await this.prisma.chat.findFirst({
      where: {
        id: chatId,
        members: {
          some: {
            userId,
          },
        },
      },
      include: this.chatInclude,
    });

    if (!chat) {
      throw new AppException({
        status: 404,
        code: 'chat_not_found',
        message: 'Chat was not found.',
      });
    }

    return {
      chat: toPublicChat(chat, userId),
    };
  }

  async createDirectChat(userId: string, username: string): Promise<PublicChat> {
    const peer = await this.prisma.user.findFirst({
      where: {
        profile: {
          username,
        },
      },
    });

    if (!peer) {
      throw new AppException({
        status: 404,
        code: 'user_not_found',
        message: 'User was not found.',
      });
    }

    if (peer.id === userId) {
      throw new AppException({
        status: 400,
        code: 'direct_chat_self',
        message: 'You cannot create a direct chat with yourself.',
      });
    }

    const existingChats = await this.prisma.chat.findMany({
      where: {
        type: 'DIRECT',
        members: {
          some: {
            userId,
          },
        },
        AND: {
          members: {
            some: {
              userId: peer.id,
            },
          },
        },
      },
      include: this.chatInclude,
    });

    const existingChat = existingChats.find((chat) => chat.members.length === 2);

    if (existingChat) {
      return toPublicChat(existingChat, userId);
    }

    const chat = await this.prisma.chat.create({
      data: {
        type: 'DIRECT',
        createdById: userId,
        members: {
          create: [
            {
              userId,
              role: 'OWNER',
            },
            {
              userId: peer.id,
              role: 'MEMBER',
            },
          ],
        },
      },
      include: this.chatInclude,
    });

    return toPublicChat(chat, userId);
  }

  async createGroupChat(
    userId: string,
    title: string,
    memberUsernames: string[],
  ): Promise<PublicChat> {
    const normalizedUsernames = [
      ...new Set(memberUsernames.map((username) => username.trim().toLowerCase())),
    ];
    const peers = await this.prisma.user.findMany({
      where: {
        profile: {
          username: {
            in: normalizedUsernames,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    if (peers.length !== normalizedUsernames.length) {
      throw new AppException({
        status: 404,
        code: 'group_member_not_found',
        message: 'One or more selected users were not found.',
      });
    }

    if (peers.some((peer) => peer.id === userId)) {
      throw new AppException({
        status: 400,
        code: 'group_member_self',
        message: 'Do not add your own username to the group member list.',
      });
    }

    const chat = await this.prisma.chat.create({
      data: {
        type: 'GROUP',
        title: title.trim(),
        createdById: userId,
        members: {
          create: [
            {
              userId,
              role: 'OWNER',
            },
            ...peers.map((peer) => ({
              userId: peer.id,
              role: 'MEMBER' as const,
            })),
          ],
        },
      },
      include: this.chatInclude,
    });

    return toPublicChat(chat, userId);
  }

  private readonly chatInclude = {
    members: {
      orderBy: {
        joinedAt: 'asc' as const,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    },
  };
}
