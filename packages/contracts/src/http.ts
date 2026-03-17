import type {
  Cursor,
  EntityId,
  IsoDateString,
  PublicChat,
  PublicMessage,
  PublicUser,
} from './shared';

export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, string | number | boolean | null>;
}

export interface CursorPageMeta {
  nextCursor: Cursor | null;
}

export interface CursorPageResponse<TItem> {
  data: TItem[];
  meta: CursorPageMeta;
}

export interface HealthResponse {
  status: 'ok';
  timestamp: IsoDateString;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface MeResponse {
  user: PublicUser;
}

export interface CreateDirectChatRequest {
  username: string;
}

export interface CreateGroupChatRequest {
  title: string;
  memberUsernames: string[];
}

export interface ChatListResponse {
  chats: PublicChat[];
}

export interface ChatDetailsResponse {
  chat: PublicChat;
}

export interface ChatMessagesQuery {
  cursor?: Cursor;
  limit?: number;
}

export type ChatMessagesResponse = CursorPageResponse<PublicMessage>;

export interface CreateMessageRequest {
  body: string;
  replyToMessageId?: EntityId | null;
}
