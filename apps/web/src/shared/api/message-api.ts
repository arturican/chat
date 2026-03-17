import type {
  ChatMessagesQuery,
  ChatMessagesResponse,
  CreateMessageRequest,
  PublicMessage,
} from '@pulsechat/contracts';

import { apiRequest } from './api-client';

function createMessagesPath(chatId: string, query: ChatMessagesQuery = {}): string {
  const searchParams = new globalThis.URLSearchParams();

  if (query.cursor) {
    searchParams.set('cursor', query.cursor);
  }

  if (query.limit) {
    searchParams.set('limit', String(query.limit));
  }

  const search = searchParams.toString();

  return search ? `/chats/${chatId}/messages?${search}` : `/chats/${chatId}/messages`;
}

export function getChatMessages(
  accessToken: string,
  chatId: string,
  query: ChatMessagesQuery = {},
): Promise<ChatMessagesResponse> {
  return apiRequest<ChatMessagesResponse>(createMessagesPath(chatId, query), {
    accessToken,
  });
}

export function createChatMessage(
  accessToken: string,
  chatId: string,
  payload: CreateMessageRequest,
): Promise<PublicMessage> {
  return apiRequest<PublicMessage>(`/chats/${chatId}/messages`, {
    method: 'POST',
    accessToken,
    body: payload,
  });
}
