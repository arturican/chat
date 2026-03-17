'use client';

import type { PublicChat } from '@pulsechat/contracts';
import type { FormEvent } from 'react';
import { startTransition, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getApiErrorMessage } from '../../shared/api/api-client';
import { createDirectChat, createGroupChat, getChat, getChats } from '../../shared/api/chat-api';
import { useAuthSession } from '../auth/auth-session-provider';

type ComposerMode = 'direct' | 'group';

interface ChatWorkspaceProps {
  activeChatId?: string;
}

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
      if (!session.accessToken) {
        return;
      }

      if (!activeChatId) {
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

  const chatList = useMemo(
    () =>
      chats.map((chat) => ({
        ...chat,
        isActive: chat.id === activeChatId,
        subtitle: session.user ? chatDescription(chat, session.user.id) : '',
      })),
    [activeChatId, chats, session.user],
  );

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
              Open a direct message or start a small group to bring the workspace to life.
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
                Add usernames to start the first conversation in your workspace.
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

              <section className="chat-empty-state">
                <h3>Conversation opened</h3>
                <p>
                  This chat is ready. Message history and the composer land in the next step, so for
                  now you can create chats, browse them, and open the right room.
                </p>
              </section>

              {isLoadingDetails ? (
                <p className="chat-detail-loading">Refreshing conversation details...</p>
              ) : null}
            </div>
          ) : (
            <div className="chat-stage-panel chat-stage-panel-empty">
              <span className="badge">Workspace</span>
              <h2 className="chat-stage-title">Choose a conversation to open it.</h2>
              <p className="chat-stage-copy">
                Your sidebar now holds direct and group chats. Pick one from the left or create a
                new conversation to get started.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
