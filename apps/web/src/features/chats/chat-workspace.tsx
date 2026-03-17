'use client';

import type { PublicChat, PublicMessage, PublicMessageReply } from '@pulsechat/contracts';
import type { FormEvent } from 'react';
import { startTransition, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getApiErrorMessage } from '../../shared/api/api-client';
import { createDirectChat, createGroupChat, getChat, getChats } from '../../shared/api/chat-api';
import { getChatMessages } from '../../shared/api/message-api';
import { useAuthSession } from '../auth/auth-session-provider';
import { useChatRealtime } from './use-chat-realtime';

type ComposerMode = 'direct' | 'group';
type DeliveryState = 'pending' | null;

interface ChatWorkspaceProps {
  activeChatId?: string;
}

interface ChatMessageItem extends PublicMessage {
  clientId: string | null;
  deliveryState: DeliveryState;
}

const messageTimeFormatter = new Intl.DateTimeFormat('en', {
  hour: '2-digit',
  minute: '2-digit',
});

function formatMemberNames(chat: PublicChat, currentUserId: string): string {
  const peers = chat.members.filter((member) => member.id !== currentUserId);

  if (peers.length === 0) {
    return 'Just you';
  }

  if (chat.type === 'direct') {
    return peers[0]?.displayName || peers[0]?.username || 'Conversation';
  }

  return peers
    .slice(0, 3)
    .map((member) => member.displayName || member.username)
    .join(', ');
}

function chatDescription(chat: PublicChat, currentUserId: string): string {
  if (chat.type === 'direct') {
    return 'Direct conversation';
  }

  return `${chat.memberCount} people • ${formatMemberNames(chat, currentUserId)}`;
}

function normalizeCommaSeparatedUsernames(value: string): string[] {
  return [
    ...new Set(
      value
        .split(',')
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

function prependMissingMessages(
  currentMessages: ChatMessageItem[],
  incomingMessages: ChatMessageItem[],
): ChatMessageItem[] {
  const existingMessageIds = new Set(currentMessages.map((message) => message.id));

  return [
    ...incomingMessages.filter((message) => !existingMessageIds.has(message.id)),
    ...currentMessages,
  ];
}

function formatMessageTime(isoDate: string): string {
  return messageTimeFormatter.format(new Date(isoDate));
}

function trimReplyPreview(body: string): string {
  return body.length > 120 ? `${body.slice(0, 117)}...` : body;
}

function toChatMessageItem(message: PublicMessage): ChatMessageItem {
  return {
    ...message,
    clientId: null,
    deliveryState: null,
  };
}

function createReplyPreview(message: ChatMessageItem): PublicMessageReply {
  return {
    id: message.id,
    body: message.body,
    author: message.author,
  };
}

export function ChatWorkspace({ activeChatId }: ChatWorkspaceProps) {
  const router = useRouter();
  const session = useAuthSession();
  const [chats, setChats] = useState<PublicChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<PublicChat | null>(null);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [chatsError, setChatsError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [composerMode, setComposerMode] = useState<ComposerMode>('direct');
  const [directUsername, setDirectUsername] = useState('');
  const [groupTitle, setGroupTitle] = useState('');
  const [groupMembers, setGroupMembers] = useState('');
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [nextMessagesCursor, setNextMessagesCursor] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [messageBody, setMessageBody] = useState('');
  const [replyTarget, setReplyTarget] = useState<ChatMessageItem | null>(null);
  const [messagesReloadToken, setMessagesReloadToken] = useState(0);
  const realtime = useChatRealtime({
    accessToken: session.accessToken,
    onMessageCreated: (payload) => {
      setChats((currentChats) => {
        const activeChat = currentChats.find((chat) => chat.id === payload.chatId);

        if (!activeChat) {
          return currentChats;
        }

        return [
          {
            ...activeChat,
            updatedAt: payload.message.createdAt,
          },
          ...currentChats.filter((chat) => chat.id !== payload.chatId),
        ];
      });
      setSelectedChat((currentChat) =>
        currentChat && currentChat.id === payload.chatId
          ? {
              ...currentChat,
              updatedAt: payload.message.createdAt,
            }
          : currentChat,
      );

      if (payload.chatId !== activeChatId) {
        return;
      }

      setMessages((currentMessages) => {
        const nextMessage = toChatMessageItem(payload.message);
        const messagesWithoutOptimisticCopy =
          payload.clientId !== null
            ? currentMessages.filter((message) => message.clientId !== payload.clientId)
            : currentMessages;

        if (messagesWithoutOptimisticCopy.some((message) => message.id === nextMessage.id)) {
          return messagesWithoutOptimisticCopy;
        }

        return [...messagesWithoutOptimisticCopy, nextMessage];
      });
    },
  });

  useEffect(() => {
    async function loadChats() {
      if (!session.accessToken) {
        return;
      }

      setIsLoadingChats(true);
      setChatsError(null);

      try {
        const response = await getChats(session.accessToken);

        setChats(response.chats);
      } catch (error) {
        setChatsError(getApiErrorMessage(error));
      } finally {
        setIsLoadingChats(false);
      }
    }

    void loadChats();
  }, [session.accessToken]);

  useEffect(() => {
    if (!activeChatId) {
      setSelectedChat(null);
      return;
    }

    const existingChat = chats.find((chat) => chat.id === activeChatId);

    if (existingChat) {
      setSelectedChat(existingChat);
    }
  }, [activeChatId, chats]);

  useEffect(() => {
    async function loadChatDetails() {
      if (!session.accessToken || !activeChatId) {
        return;
      }

      setIsLoadingDetails(true);

      try {
        const response = await getChat(session.accessToken, activeChatId);

        setSelectedChat(response.chat);
        setChats((currentChats) => {
          const hasExistingChat = currentChats.some((chat) => chat.id === response.chat.id);

          if (hasExistingChat) {
            return currentChats.map((chat) =>
              chat.id === response.chat.id ? response.chat : chat,
            );
          }

          return [response.chat, ...currentChats];
        });
      } catch (error) {
        setChatsError(getApiErrorMessage(error));
        setSelectedChat(null);
      } finally {
        setIsLoadingDetails(false);
      }
    }

    void loadChatDetails();
  }, [activeChatId, session.accessToken]);

  useEffect(() => {
    let isCancelled = false;

    async function loadMessages() {
      if (!session.accessToken) {
        return;
      }

      if (!activeChatId) {
        setMessages([]);
        setNextMessagesCursor(null);
        setMessagesError(null);
        setReplyTarget(null);
        return;
      }

      setIsLoadingMessages(true);
      setMessagesError(null);
      setSendError(null);
      setReplyTarget(null);

      try {
        const response = await getChatMessages(session.accessToken, activeChatId, {
          limit: 20,
        });

        if (isCancelled) {
          return;
        }

        setMessages(response.data.map((message) => toChatMessageItem(message)));
        setNextMessagesCursor(response.meta.nextCursor);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setMessages([]);
        setNextMessagesCursor(null);
        setMessagesError(getApiErrorMessage(error));
      } finally {
        if (!isCancelled) {
          setIsLoadingMessages(false);
        }
      }
    }

    void loadMessages();

    return () => {
      isCancelled = true;
    };
  }, [activeChatId, messagesReloadToken, session.accessToken]);

  useEffect(() => {
    if (realtime.errorMessage) {
      setSendError(realtime.errorMessage);
    }
  }, [realtime.errorMessage]);

  const chatList = useMemo(
    () =>
      chats.map((chat) => ({
        ...chat,
        isActive: chat.id === activeChatId,
        subtitle: session.user ? chatDescription(chat, session.user.id) : '',
      })),
    [activeChatId, chats, session.user],
  );

  async function handleLoadOlderMessages() {
    if (!session.accessToken || !activeChatId || !nextMessagesCursor) {
      return;
    }

    setIsLoadingOlderMessages(true);
    setMessagesError(null);

    try {
      const response = await getChatMessages(session.accessToken, activeChatId, {
        cursor: nextMessagesCursor,
        limit: 20,
      });

      setMessages((currentMessages) =>
        prependMissingMessages(
          currentMessages,
          response.data.map((message) => toChatMessageItem(message)),
        ),
      );
      setNextMessagesCursor(response.meta.nextCursor);
    } catch (error) {
      setMessagesError(getApiErrorMessage(error));
    } finally {
      setIsLoadingOlderMessages(false);
    }
  }

  async function handleCreateDirectChat(event: FormEvent) {
    event.preventDefault();

    if (!session.accessToken) {
      return;
    }

    setIsSubmitting(true);
    setCreateError(null);

    try {
      const chat = await createDirectChat(session.accessToken, {
        username: directUsername.trim().toLowerCase(),
      });

      setDirectUsername('');
      setChats((currentChats) => {
        const existing = currentChats.find((currentChat) => currentChat.id === chat.id);

        if (existing) {
          return currentChats.map((currentChat) =>
            currentChat.id === chat.id ? chat : currentChat,
          );
        }

        return [chat, ...currentChats];
      });

      startTransition(() => {
        router.push(`/chats/${chat.id}`);
      });
    } catch (error) {
      setCreateError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateGroupChat(event: FormEvent) {
    event.preventDefault();

    if (!session.accessToken) {
      return;
    }

    setIsSubmitting(true);
    setCreateError(null);

    try {
      const chat = await createGroupChat(session.accessToken, {
        title: groupTitle.trim(),
        memberUsernames: normalizeCommaSeparatedUsernames(groupMembers),
      });

      setGroupTitle('');
      setGroupMembers('');
      setChats((currentChats) => [
        chat,
        ...currentChats.filter((currentChat) => currentChat.id !== chat.id),
      ]);

      startTransition(() => {
        router.push(`/chats/${chat.id}`);
      });
    } catch (error) {
      setCreateError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSendMessage(event: FormEvent) {
    event.preventDefault();

    if (!activeChatId || !session.user) {
      return;
    }

    const trimmedBody = messageBody.trim();

    if (trimmedBody.length === 0) {
      return;
    }

    const clientId = globalThis.crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const optimisticMessage: ChatMessageItem = {
      id: `optimistic-${clientId}`,
      chatId: activeChatId,
      body: trimmedBody,
      author: session.user,
      replyTo: replyTarget ? createReplyPreview(replyTarget) : null,
      createdAt,
      updatedAt: createdAt,
      clientId,
      deliveryState: 'pending',
    };

    setSendError(null);
    setMessages((currentMessages) => [...currentMessages, optimisticMessage]);
    setMessageBody('');
    setReplyTarget(null);
    setChats((currentChats) => {
      const activeChat = currentChats.find((chat) => chat.id === activeChatId);

      if (!activeChat) {
        return currentChats;
      }

      return [
        {
          ...activeChat,
          updatedAt: createdAt,
        },
        ...currentChats.filter((chat) => chat.id !== activeChatId),
      ];
    });
    setSelectedChat((currentChat) =>
      currentChat
        ? {
            ...currentChat,
            updatedAt: createdAt,
          }
        : currentChat,
    );

    realtime.sendMessage({
      chatId: activeChatId,
      clientId,
      body: trimmedBody,
      replyToMessageId: replyTarget?.id ?? null,
    });
  }

  return (
    <main className="chat-screen">
      <div className="chat-workspace">
        <aside className="chat-sidebar">
          <div className="chat-sidebar-head">
            <div>
              <span className="badge">Chats</span>
              <h1 className="chat-sidebar-title">Your conversations</h1>
            </div>
            <p className="chat-sidebar-copy">
              Open a direct message or start a small group conversation.
            </p>
          </div>

          <section className="chat-composer card">
            <div className="chat-composer-switch">
              <button
                className={
                  composerMode === 'direct' ? 'composer-tab composer-tab-active' : 'composer-tab'
                }
                type="button"
                onClick={() => setComposerMode('direct')}
              >
                Direct
              </button>
              <button
                className={
                  composerMode === 'group' ? 'composer-tab composer-tab-active' : 'composer-tab'
                }
                type="button"
                onClick={() => setComposerMode('group')}
              >
                Group
              </button>
            </div>

            {composerMode === 'direct' ? (
              <form
                className="chat-composer-form"
                onSubmit={(event) => void handleCreateDirectChat(event)}
              >
                <label className="field">
                  <span>Username</span>
                  <input
                    className="input"
                    placeholder="friend_name"
                    value={directUsername}
                    onChange={(event) => setDirectUsername(event.target.value)}
                  />
                </label>
                <button className="primary-button" disabled={isSubmitting} type="submit">
                  {isSubmitting ? 'Starting...' : 'Start chat'}
                </button>
              </form>
            ) : (
              <form
                className="chat-composer-form"
                onSubmit={(event) => void handleCreateGroupChat(event)}
              >
                <label className="field">
                  <span>Group name</span>
                  <input
                    className="input"
                    placeholder="Design review"
                    value={groupTitle}
                    onChange={(event) => setGroupTitle(event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Members</span>
                  <input
                    className="input"
                    placeholder="anna, max, kate"
                    value={groupMembers}
                    onChange={(event) => setGroupMembers(event.target.value)}
                  />
                </label>
                <button className="primary-button" disabled={isSubmitting} type="submit">
                  {isSubmitting ? 'Creating...' : 'Create group'}
                </button>
              </form>
            )}

            {createError ? (
              <p className="feedback feedback-error" role="alert">
                {createError}
              </p>
            ) : (
              <p className="feedback feedback-neutral">
                Add usernames to open a conversation and keep your inbox moving.
              </p>
            )}
          </section>

          <section className="chat-list card">
            <div className="chat-list-head">
              <h2>Recent</h2>
              {session.user ? <span>@{session.user.username}</span> : null}
            </div>

            {isLoadingChats ? <p className="chat-list-empty">Loading conversations...</p> : null}
            {!isLoadingChats && chatsError ? <p className="chat-list-empty">{chatsError}</p> : null}
            {!isLoadingChats && !chatsError && chatList.length === 0 ? (
              <p className="chat-list-empty">
                No conversations yet. Start with a direct chat or create a group.
              </p>
            ) : null}

            <div className="chat-list-items">
              {chatList.map((chat) => (
                <button
                  key={chat.id}
                  className={
                    chat.isActive ? 'chat-list-item chat-list-item-active' : 'chat-list-item'
                  }
                  type="button"
                  onClick={() => router.push(`/chats/${chat.id}`)}
                >
                  <div>
                    <strong>{chat.title}</strong>
                    <p>{chat.subtitle}</p>
                  </div>
                  <span>{chat.type === 'direct' ? 'Direct' : 'Group'}</span>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className="chat-stage">
          {activeChatId && selectedChat ? (
            <div className="chat-stage-panel">
              <header className="chat-stage-header">
                <div>
                  <span className="badge">
                    {selectedChat.type === 'direct' ? 'Direct chat' : 'Group chat'}
                  </span>
                  <h2 className="chat-stage-title">{selectedChat.title}</h2>
                  <p className="chat-stage-copy">
                    {session.user
                      ? chatDescription(selectedChat, session.user.id)
                      : selectedChat.memberCount}
                  </p>
                </div>
              </header>

              <div className="chat-members">
                {selectedChat.members.map((member) => (
                  <article key={member.id} className="chat-member-card">
                    <strong>{member.displayName || member.username}</strong>
                    <span>@{member.username}</span>
                  </article>
                ))}
              </div>

              <section className="chat-history-panel">
                <div className="chat-history-head">
                  <div>
                    <h3>Conversation</h3>
                    <p>Catch up on recent messages and keep the thread moving in real time.</p>
                  </div>
                  <div className="chat-history-actions">
                    <span
                      className={
                        realtime.status === 'connected'
                          ? 'chat-live-status chat-live-status-active'
                          : 'chat-live-status'
                      }
                    >
                      {realtime.status === 'connected'
                        ? 'Live'
                        : realtime.status === 'reconnecting'
                          ? 'Reconnecting'
                          : 'Connecting'}
                    </span>
                    {nextMessagesCursor ? (
                      <button
                        className="ghost-button"
                        disabled={isLoadingOlderMessages}
                        type="button"
                        onClick={() => void handleLoadOlderMessages()}
                      >
                        {isLoadingOlderMessages ? 'Loading...' : 'Load older'}
                      </button>
                    ) : null}
                  </div>
                </div>

                {isLoadingMessages ? (
                  <div className="chat-empty-state">
                    <h3>Loading conversation</h3>
                    <p>Bringing the latest messages into view.</p>
                  </div>
                ) : null}

                {!isLoadingMessages && messagesError ? (
                  <div className="chat-empty-state">
                    <h3>Conversation unavailable</h3>
                    <p>{messagesError}</p>
                    <button
                      className="primary-button chat-retry-button"
                      type="button"
                      onClick={() => setMessagesReloadToken((currentValue) => currentValue + 1)}
                    >
                      Retry messages
                    </button>
                  </div>
                ) : null}

                {!isLoadingMessages && !messagesError && messages.length === 0 ? (
                  <div className="chat-empty-state">
                    <h3>No messages yet</h3>
                    <p>
                      Start the conversation with a first message and PulseChat will keep it here.
                    </p>
                  </div>
                ) : null}

                {!isLoadingMessages && !messagesError && messages.length > 0 ? (
                  <div className="chat-message-list">
                    {messages.map((message) => {
                      const isOwnMessage = session.user?.id === message.author.id;

                      return (
                        <article
                          key={message.id}
                          className={
                            isOwnMessage
                              ? 'chat-message-card chat-message-card-own'
                              : 'chat-message-card'
                          }
                        >
                          <div className="chat-message-meta">
                            <strong>{message.author.displayName || message.author.username}</strong>
                            <div className="chat-message-meta-side">
                              {message.deliveryState === 'pending' ? (
                                <span className="chat-message-status">Sending...</span>
                              ) : null}
                              <span>{formatMessageTime(message.createdAt)}</span>
                            </div>
                          </div>

                          {message.replyTo ? (
                            <div className="chat-message-reply-preview">
                              <span>
                                Replying to{' '}
                                {message.replyTo.author.displayName ||
                                  message.replyTo.author.username}
                              </span>
                              <p>{trimReplyPreview(message.replyTo.body)}</p>
                            </div>
                          ) : null}

                          <p className="chat-message-body">{message.body}</p>

                          <button
                            className="chat-reply-button"
                            type="button"
                            onClick={() => setReplyTarget(message)}
                          >
                            Reply
                          </button>
                        </article>
                      );
                    })}
                  </div>
                ) : null}
              </section>

              <section className="chat-message-composer">
                {replyTarget ? (
                  <div className="chat-replying-banner">
                    <div>
                      <strong>
                        Replying to {replyTarget.author.displayName || replyTarget.author.username}
                      </strong>
                      <p>{trimReplyPreview(replyTarget.body)}</p>
                    </div>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => setReplyTarget(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : null}

                <form
                  className="chat-message-form"
                  onSubmit={(event) => void handleSendMessage(event)}
                >
                  <label className="field">
                    <span>Message</span>
                    <textarea
                      className="input textarea"
                      placeholder="Write a message"
                      rows={4}
                      value={messageBody}
                      onChange={(event) => setMessageBody(event.target.value)}
                    />
                  </label>

                  {sendError ? (
                    <p className="feedback feedback-error" role="alert">
                      {sendError}
                    </p>
                  ) : (
                    <p className="feedback feedback-neutral">
                      New messages appear live here, and queued ones resume sending after reconnect.
                    </p>
                  )}

                  <div className="chat-message-form-actions">
                    {isLoadingDetails ? (
                      <p className="chat-detail-loading">Refreshing conversation details...</p>
                    ) : (
                      <span className="chat-detail-loading">
                        {realtime.status === 'connected'
                          ? 'Realtime delivery is active for this conversation.'
                          : 'Messages will keep trying while the connection comes back.'}
                      </span>
                    )}
                    <button
                      className="primary-button"
                      disabled={messageBody.trim().length === 0}
                      type="submit"
                    >
                      Send message
                    </button>
                  </div>
                </form>
              </section>
            </div>
          ) : (
            <div className="chat-stage-panel chat-stage-panel-empty">
              <span className="badge">Workspace</span>
              <h2 className="chat-stage-title">Choose a conversation to open it.</h2>
              <p className="chat-stage-copy">
                Pick one from the left or create a new conversation to start exchanging messages.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
