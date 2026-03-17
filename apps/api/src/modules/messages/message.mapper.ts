import { Prisma } from '@prisma/client';
import type { PublicMessage, PublicMessageReply } from '@pulsechat/contracts';

import { toPublicUser } from '../auth/auth.mapper';

export const messageInclude = Prisma.validator<Prisma.MessageInclude>()({
  author: {
    include: {
      profile: true,
    },
  },
  replyTo: {
    include: {
      author: {
        include: {
          profile: true,
        },
      },
    },
  },
});

type MessageWithRelations = Prisma.MessageGetPayload<{
  include: typeof messageInclude;
}>;

type ReplyMessageWithAuthor = NonNullable<MessageWithRelations['replyTo']>;

function toPublicMessageReply(message: ReplyMessageWithAuthor): PublicMessageReply {
  return {
    id: message.id,
    body: message.body,
    author: toPublicUser(message.author),
  };
}

export function toPublicMessage(message: MessageWithRelations): PublicMessage {
  return {
    id: message.id,
    chatId: message.chatId,
    body: message.body,
    author: toPublicUser(message.author),
    replyTo: message.replyTo ? toPublicMessageReply(message.replyTo) : null,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
  };
}
