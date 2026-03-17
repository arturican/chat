import { Body, Controller, Get, HttpCode, Inject, Param, Post, UseGuards } from '@nestjs/common';
import type { ChatDetailsResponse, ChatListResponse, PublicChat } from '@pulsechat/contracts';

import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AccessTokenPayload } from '../auth/auth.types';
import { CreateDirectChatRequestDto } from './dto/create-direct-chat-request.dto';
import { CreateGroupChatRequestDto } from './dto/create-group-chat-request.dto';
import { ChatsService } from './chats.service';

// Nest needs DTO classes at runtime for reflected validation metadata.
const chatDtoRuntimeReferences = [CreateDirectChatRequestDto, CreateGroupChatRequestDto];
void chatDtoRuntimeReferences;

@UseGuards(AccessTokenGuard)
@Controller('chats')
export class ChatsController {
  constructor(@Inject(ChatsService) private readonly chatsService: ChatsService) {}

  @Get()
  async listChats(@CurrentUser() user: AccessTokenPayload): Promise<ChatListResponse> {
    return this.chatsService.listChats(user.sub);
  }

  @Get(':chatId')
  async getChat(
    @CurrentUser() user: AccessTokenPayload,
    @Param('chatId') chatId: string,
  ): Promise<ChatDetailsResponse> {
    return this.chatsService.getChat(user.sub, chatId);
  }

  @HttpCode(201)
  @Post('direct')
  async createDirectChat(
    @CurrentUser() user: AccessTokenPayload,
    @Body() input: CreateDirectChatRequestDto,
  ): Promise<PublicChat> {
    return this.chatsService.createDirectChat(user.sub, input.username);
  }

  @HttpCode(201)
  @Post('group')
  async createGroupChat(
    @CurrentUser() user: AccessTokenPayload,
    @Body() input: CreateGroupChatRequestDto,
  ): Promise<PublicChat> {
    return this.chatsService.createGroupChat(user.sub, input.title, input.memberUsernames);
  }
}
