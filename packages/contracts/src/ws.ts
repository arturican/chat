import type { EntityId, IsoDateString, Nullable } from './shared';

export const clientEventNames = [
  'auth.identify',
  'presence.subscribe',
  'message.send',
  'message.edit',
  'message.delete',
  'message.read',
  'chat.typing.start',
  'chat.typing.stop',
] as const;

export const serverEventNames = [
  'auth.ack',
  'auth.error',
  'presence.sync',
  'presence.updated',
  'message.created',
  'message.updated',
  'message.deleted',
  'message.read.updated',
  'chat.typing.updated',
  'error',
] as const;

export type ClientEventName = (typeof clientEventNames)[number];
export type ServerEventName = (typeof serverEventNames)[number];

export interface AuthIdentifyPayload {
  accessToken: string;
}

export interface PresenceSubscribePayload {
  chatIds: EntityId[];
}

export interface MessageSendPayload {
  chatId: EntityId;
  clientId: string;
  text: string;
  replyToMessageId: Nullable<EntityId>;
  attachmentIds: EntityId[];
}

export interface MessageEditPayload {
  messageId: EntityId;
  text: string;
}

export interface MessageDeletePayload {
  messageId: EntityId;
}

export interface MessageReadPayload {
  chatId: EntityId;
  messageId: EntityId;
}

export interface ChatTypingPayload {
  chatId: EntityId;
}

export interface AuthAckPayload {
  userId: EntityId;
}

export interface AuthErrorPayload {
  code: string;
  message: string;
}

export interface PresenceSyncPayload {
  chatIds: EntityId[];
  onlineUserIds: EntityId[];
}

export interface PresenceUpdatedPayload {
  userId: EntityId;
  isOnline: boolean;
}

export interface MessageCreatedPayload {
  chatId: EntityId;
  messageId: EntityId;
  clientId: string;
}

export interface MessageUpdatedPayload {
  messageId: EntityId;
  text: string;
}

export interface MessageDeletedPayload {
  messageId: EntityId;
}

export interface MessageReadUpdatedPayload {
  chatId: EntityId;
  messageId: EntityId;
  userId: EntityId;
}

export interface ChatTypingUpdatedPayload {
  chatId: EntityId;
  userIds: EntityId[];
}

export interface ErrorEventPayload {
  code: string;
  message: string;
}

export interface ClientEventPayloadMap {
  'auth.identify': AuthIdentifyPayload;
  'presence.subscribe': PresenceSubscribePayload;
  'message.send': MessageSendPayload;
  'message.edit': MessageEditPayload;
  'message.delete': MessageDeletePayload;
  'message.read': MessageReadPayload;
  'chat.typing.start': ChatTypingPayload;
  'chat.typing.stop': ChatTypingPayload;
}

export interface ServerEventPayloadMap {
  'auth.ack': AuthAckPayload;
  'auth.error': AuthErrorPayload;
  'presence.sync': PresenceSyncPayload;
  'presence.updated': PresenceUpdatedPayload;
  'message.created': MessageCreatedPayload;
  'message.updated': MessageUpdatedPayload;
  'message.deleted': MessageDeletedPayload;
  'message.read.updated': MessageReadUpdatedPayload;
  'chat.typing.updated': ChatTypingUpdatedPayload;
  error: ErrorEventPayload;
}

export interface ClientEvent<TEvent extends ClientEventName> {
  event: TEvent;
  requestId?: string;
  payload: ClientEventPayloadMap[TEvent];
}

export interface ServerEvent<TEvent extends ServerEventName> {
  event: TEvent;
  payload: ServerEventPayloadMap[TEvent];
  ts: IsoDateString;
}

export type AnyClientEvent = {
  [TEvent in ClientEventName]: ClientEvent<TEvent>;
}[ClientEventName];

export type AnyServerEvent = {
  [TEvent in ServerEventName]: ServerEvent<TEvent>;
}[ServerEventName];
