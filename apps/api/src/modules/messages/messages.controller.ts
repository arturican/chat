import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { ChatMessagesResponse, PublicMessage } from '@pulsechat/contracts';

import { AccessTokenGuard } from '../auth/access-token.guard';
import type { AccessTokenPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { ChatMessagesQueryDto } from './dto/chat-messages-query.dto';
import { CreateMessageRequestDto } from './dto/create-message-request.dto';
import { MessagesService } from './messages.service';

// Nest needs DTO classes at runtime for reflected validation metadata.
const messagesDtoRuntimeReferences = [ChatMessagesQueryDto, CreateMessageRequestDto];
void messagesDtoRuntimeReferences;

@UseGuards(AccessTokenGuard)
@Controller('chats/:chatId/messages')
export class MessagesController {
  constructor(@Inject(MessagesService) private readonly messagesService: MessagesService) {}

  @Get()
  async listMessages(
    @CurrentUser() user: AccessTokenPayload,
    @Param('chatId') chatId: string,
    @Query() query: ChatMessagesQueryDto,
  ): Promise<ChatMessagesResponse> {
    return this.messagesService.listMessages(user.sub, chatId, query);
  }

  @HttpCode(201)
  @Post()
  async createMessage(
    @CurrentUser() user: AccessTokenPayload,
    @Param('chatId') chatId: string,
    @Body() input: CreateMessageRequestDto,
  ): Promise<PublicMessage> {
    return this.messagesService.createMessage(user.sub, chatId, input);
  }
}
