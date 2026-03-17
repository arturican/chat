import { Inject, Injectable } from '@nestjs/common';
import type {
  ChatMessagesQuery,
  ChatMessagesResponse,
  CreateMessageRequest,
  PublicMessage,
} from '@pulsechat/contracts';

import { AppException } from '../../common/exceptions/app-exception';
import { PrismaService } from '../../prisma/prisma.service';
import { messageInclude, toPublicMessage } from './message.mapper';

const defaultMessagesPageSize = 20;

@Injectable()
export class MessagesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listMessages(
    userId: string,
    chatId: string,
    query: ChatMessagesQuery,
  ): Promise<ChatMessagesResponse> {
    await this.assertChatMembership(chatId, userId);

    const pageSize = query.limit ?? defaultMessagesPageSize;

    if (query.cursor) {
      await this.assertCursorBelongsToChat(chatId, query.cursor);
    }

    const messages = await this.prisma.message.findMany({
      where: {
        chatId,
      },
      include: messageInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...(query.cursor
        ? {
            cursor: {
              id: query.cursor,
            },
          }
        : {}),
      skip: query.cursor ? 1 : 0,
      take: pageSize + 1,
    });

    const hasMore = messages.length > pageSize;
    const visibleMessages = hasMore ? messages.slice(0, pageSize) : messages;

    return {
      data: visibleMessages.map((message) => toPublicMessage(message)).reverse(),
      meta: {
        nextCursor:
          hasMore && visibleMessages.length > 0
            ? visibleMessages[visibleMessages.length - 1]!.id
            : null,
      },
    };
  }

  async createMessage(
    userId: string,
    chatId: string,
    input: CreateMessageRequest,
  ): Promise<PublicMessage> {
    await this.assertChatMembership(chatId, userId);

    if (input.replyToMessageId) {
      await this.assertReplyMessage(chatId, input.replyToMessageId);
    }

    const message = await this.prisma.$transaction(async (transaction) => {
      const createdMessage = await transaction.message.create({
        data: {
          chatId,
          authorId: userId,
          body: input.body.trim(),
          replyToMessageId: input.replyToMessageId ?? null,
        },
        include: messageInclude,
      });

      await transaction.chat.update({
        where: {
          id: chatId,
        },
        data: {
          updatedAt: createdMessage.createdAt,
        },
      });

      return createdMessage;
    });

    return toPublicMessage(message);
  }

  private async assertChatMembership(chatId: string, userId: string): Promise<void> {
    const membership = await this.prisma.chatMember.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new AppException({
        status: 404,
        code: 'chat_not_found',
        message: 'Chat was not found.',
      });
    }
  }

  private async assertCursorBelongsToChat(chatId: string, cursor: string): Promise<void> {
    const message = await this.prisma.message.findUnique({
      where: {
        id: cursor,
      },
      select: {
        chatId: true,
      },
    });

    if (!message || message.chatId !== chatId) {
      throw new AppException({
        status: 400,
        code: 'invalid_cursor',
        message: 'Message cursor is invalid for this chat.',
      });
    }
  }

  private async assertReplyMessage(chatId: string, replyToMessageId: string): Promise<void> {
    const message = await this.prisma.message.findUnique({
      where: {
        id: replyToMessageId,
      },
      select: {
        chatId: true,
      },
    });

    if (!message || message.chatId !== chatId) {
      throw new AppException({
        status: 404,
        code: 'reply_message_not_found',
        message: 'The selected reply target was not found in this chat.',
      });
    }
  }
}
