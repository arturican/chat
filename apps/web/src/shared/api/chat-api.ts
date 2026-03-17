import type {
  ChatDetailsResponse,
  ChatListResponse,
  CreateDirectChatRequest,
  CreateGroupChatRequest,
  PublicChat,
} from '@pulsechat/contracts';

import { apiRequest } from './api-client';

export function getChats(accessToken: string): Promise<ChatListResponse> {
  return apiRequest<ChatListResponse>('/chats', {
    accessToken,
  });
}

export function getChat(accessToken: string, chatId: string): Promise<ChatDetailsResponse> {
  return apiRequest<ChatDetailsResponse>(`/chats/${chatId}`, {
    accessToken,
  });
}

export function createDirectChat(
  accessToken: string,
  payload: CreateDirectChatRequest,
): Promise<PublicChat> {
  return apiRequest<PublicChat>('/chats/direct', {
    method: 'POST',
    accessToken,
    body: payload,
  });
}

export function createGroupChat(
  accessToken: string,
  payload: CreateGroupChatRequest,
): Promise<PublicChat> {
  return apiRequest<PublicChat>('/chats/group', {
    method: 'POST',
    accessToken,
    body: payload,
  });
}
