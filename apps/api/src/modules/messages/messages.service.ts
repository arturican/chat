import { Inject, Injectable } from '@nestjs/common';
import type {
  ChatMessagesQuery,
  ChatMessagesResponse,
  CreateMessageRequest,
  PublicMessage,
} from '@pulsechat/contracts';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { AppException } from '../../common/exceptions/app-exception';
import { PrismaService } from '../../prisma/prisma.service';
import { messageInclude, toPublicMessage } from './message.mapper';

const defaultMessagesPageSize = 20;

interface CreateMessageOptions {
  clientId?: string | null;
}

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
    options: CreateMessageOptions = {},
  ): Promise<PublicMessage> {
    if (options.clientId) {
      const existingMessage = await this.prisma.message.findFirst({
        where: {
          authorId: userId,
          clientId: options.clientId,
        },
        include: messageInclude,
      });

      if (existingMessage) {
        if (existingMessage.chatId !== chatId) {
          throw new AppException({
            status: 409,
            code: 'client_id_conflict',
            message: 'Client message id is already bound to another chat.',
          });
        }

        return toPublicMessage(existingMessage);
      }
    }

    await this.assertChatMembership(chatId, userId);

    if (input.replyToMessageId) {
      await this.assertReplyMessage(chatId, input.replyToMessageId);
    }

    try {
      const message = await this.prisma.$transaction(async (transaction) => {
        const createdMessage = await transaction.message.create({
          data: {
            chatId,
            authorId: userId,
            clientId: options.clientId ?? null,
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
    } catch (error) {
      if (
        options.clientId &&
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existingMessage = await this.prisma.message.findFirst({
          where: {
            authorId: userId,
            clientId: options.clientId,
          },
          include: messageInclude,
        });

        if (existingMessage && existingMessage.chatId === chatId) {
          return toPublicMessage(existingMessage);
        }
      }

      throw error;
    }
  }

  async getChatMemberUserIds(chatId: string): Promise<string[]> {
    const members = await this.prisma.chatMember.findMany({
      where: {
        chatId,
      },
      select: {
        userId: true,
      },
    });

    return members.map((member) => member.userId);
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
