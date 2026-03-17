import { Inject, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import type {
  MessageCreatedPayload,
  ServerEventName,
  ServerEventPayloadMap,
} from '@pulsechat/contracts';
import type { WebSocket } from 'ws';

import { AppException } from '../../common/exceptions/app-exception';
import { AuthService } from '../auth/auth.service';
import { MessagesService } from '../messages/messages.service';
import { AuthIdentifyPayloadDto } from './dto/auth-identify-payload.dto';
import { MessageSendPayloadDto } from './dto/message-send-payload.dto';
import { serializeServerEvent } from './realtime.protocol';
import { validateRealtimePayload } from './realtime.validation';

interface AuthenticatedSocket extends WebSocket {
  authUserId: string | null;
}

@WebSocketGateway({
  path: '/ws',
})
export class RealtimeGateway {
  private readonly logger = new Logger(RealtimeGateway.name);
  private readonly socketsByUserId = new Map<string, Set<AuthenticatedSocket>>();

  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(MessagesService) private readonly messagesService: MessagesService,
  ) {}

  handleConnection(client: AuthenticatedSocket) {
    client.authUserId = null;
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.unregisterClient(client);
  }

  @SubscribeMessage('auth.identify')
  async handleIdentify(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: unknown,
  ): Promise<void> {
    try {
      const input = await validateRealtimePayload(AuthIdentifyPayloadDto, payload);
      const authUser = await this.authService.verifyAccessToken(input.accessToken);

      this.registerClient(client, authUser.sub);
      this.sendEvent(client, 'auth.ack', {
        userId: authUser.sub,
      });
    } catch (error) {
      this.sendAuthError(client, error);
    }
  }

  @SubscribeMessage('message.send')
  async handleMessageSend(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: unknown,
  ): Promise<void> {
    if (!client.authUserId) {
      this.sendAuthError(
        client,
        new AppException({
          status: 401,
          code: 'unauthorized',
          message: 'Identify the websocket connection before sending messages.',
        }),
      );
      return;
    }

    try {
      const input = await validateRealtimePayload(MessageSendPayloadDto, payload);
      const message = await this.messagesService.createMessage(
        client.authUserId,
        input.chatId,
        {
          body: input.body,
          replyToMessageId: input.replyToMessageId ?? null,
        },
        {
          clientId: input.clientId,
        },
      );
      const memberUserIds = await this.messagesService.getChatMemberUserIds(input.chatId);
      const eventPayload: MessageCreatedPayload = {
        chatId: input.chatId,
        clientId: input.clientId,
        message,
      };

      this.broadcastToUsers(memberUserIds, 'message.created', eventPayload);
    } catch (error) {
      this.sendError(client, error);
    }
  }

  private registerClient(client: AuthenticatedSocket, userId: string) {
    this.unregisterClient(client);
    client.authUserId = userId;

    const userSockets = this.socketsByUserId.get(userId) ?? new Set<AuthenticatedSocket>();

    userSockets.add(client);
    this.socketsByUserId.set(userId, userSockets);
  }

  private unregisterClient(client: AuthenticatedSocket) {
    if (!client.authUserId) {
      return;
    }

    const userSockets = this.socketsByUserId.get(client.authUserId);

    if (!userSockets) {
      client.authUserId = null;
      return;
    }

    userSockets.delete(client);

    if (userSockets.size === 0) {
      this.socketsByUserId.delete(client.authUserId);
    }

    client.authUserId = null;
  }

  private broadcastToUsers<TEvent extends ServerEventName>(
    userIds: string[],
    event: TEvent,
    payload: ServerEventPayloadMap[TEvent],
  ) {
    const serializedEvent = serializeServerEvent(event, payload);

    for (const userId of userIds) {
      const userSockets = this.socketsByUserId.get(userId);

      if (!userSockets) {
        continue;
      }

      for (const socket of userSockets) {
        if (socket.readyState === 1) {
          socket.send(serializedEvent);
        }
      }
    }
  }

  private sendEvent<TEvent extends ServerEventName>(
    client: AuthenticatedSocket,
    event: TEvent,
    payload: ServerEventPayloadMap[TEvent],
  ) {
    if (client.readyState !== 1) {
      return;
    }

    client.send(serializeServerEvent(event, payload));
  }

  private sendAuthError(client: AuthenticatedSocket, error: unknown) {
    const appError = this.toAppException(error, {
      status: 401,
      code: 'unauthorized',
      message: 'Unable to authorize this realtime connection.',
    });

    this.sendEvent(client, 'auth.error', {
      code: appError.code,
      message: appError.message,
    });
    this.logger.warn(`Realtime auth failed: ${appError.code}`);
  }

  private sendError(client: AuthenticatedSocket, error: unknown) {
    const appError = this.toAppException(error, {
      status: 400,
      code: 'realtime_error',
      message: 'Unable to process the realtime event.',
    });

    this.sendEvent(client, 'error', {
      code: appError.code,
      message: appError.message,
    });
  }

  private toAppException(
    error: unknown,
    fallback: {
      status: number;
      code: string;
      message: string;
    },
  ): AppException {
    if (error instanceof AppException) {
      return error;
    }

    return new AppException(fallback);
  }
}
