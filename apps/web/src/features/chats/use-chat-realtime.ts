'use client';

import type {
  AnyServerEvent,
  MessageCreatedPayload,
  MessageSendPayload,
} from '@pulsechat/contracts';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { loadPublicEnv } from '../../shared/config/public-env';

type RealtimeStatus = 'offline' | 'connecting' | 'connected' | 'reconnecting';

interface UseChatRealtimeOptions {
  accessToken: string | null;
  onMessageCreated: (payload: MessageCreatedPayload) => void;
}

function getRealtimeUrl(): string {
  const { apiBaseUrl } = loadPublicEnv();
  const url = new globalThis.URL(apiBaseUrl);

  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = `${url.pathname.replace(/\/api\/?$/, '')}/ws`.replace(/\/{2,}/g, '/');
  url.search = '';
  url.hash = '';

  return url.toString();
}

export function useChatRealtime({ accessToken, onMessageCreated }: UseChatRealtimeOptions) {
  const [status, setStatus] = useState<RealtimeStatus>('offline');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const socketRef = useRef<globalThis.WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const shouldReconnectRef = useRef(false);
  const pendingMessagesRef = useRef<Map<string, MessageSendPayload>>(new Map());

  const clearReconnectTimer = useEffectEvent(() => {
    if (reconnectTimerRef.current !== null) {
      globalThis.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  });

  const flushPendingMessages = useEffectEvent(() => {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== globalThis.WebSocket.OPEN) {
      return;
    }

    for (const payload of pendingMessagesRef.current.values()) {
      socket.send(
        JSON.stringify({
          event: 'message.send',
          payload,
        }),
      );
    }
  });

  const handleServerEvent = useEffectEvent((serverEvent: AnyServerEvent) => {
    switch (serverEvent.event) {
      case 'auth.ack':
        setStatus('connected');
        setErrorMessage(null);
        flushPendingMessages();
        return;
      case 'auth.error':
        setStatus('offline');
        setErrorMessage(serverEvent.payload.message);
        return;
      case 'error':
        setErrorMessage(serverEvent.payload.message);
        return;
      case 'message.created':
        if (serverEvent.payload.clientId) {
          pendingMessagesRef.current.delete(serverEvent.payload.clientId);
        }

        onMessageCreated(serverEvent.payload);
        return;
      default:
        return;
    }
  });

  const connect = useEffectEvent(() => {
    if (!accessToken) {
      return;
    }

    clearReconnectTimer();
    setStatus(socketRef.current ? 'reconnecting' : 'connecting');

    const socket = new globalThis.WebSocket(getRealtimeUrl());

    socketRef.current = socket;

    socket.addEventListener('open', () => {
      socket.send(
        JSON.stringify({
          event: 'auth.identify',
          payload: {
            accessToken,
          },
        }),
      );
    });

    socket.addEventListener('message', (event) => {
      try {
        const serverEvent = JSON.parse(String(event.data)) as AnyServerEvent;

        if (
          !serverEvent ||
          typeof serverEvent !== 'object' ||
          typeof serverEvent.event !== 'string'
        ) {
          return;
        }

        handleServerEvent(serverEvent);
      } catch {
        setErrorMessage('Received an invalid realtime event.');
      }
    });

    socket.addEventListener('error', () => {
      setErrorMessage('Realtime connection dropped. Reconnecting...');
    });

    socket.addEventListener('close', () => {
      if (socketRef.current === socket) {
        socketRef.current = null;
      }

      if (!shouldReconnectRef.current || !accessToken) {
        setStatus('offline');
        return;
      }

      setStatus('reconnecting');
      clearReconnectTimer();
      reconnectTimerRef.current = globalThis.setTimeout(() => {
        connect();
      }, 1500);
    });
  });

  useEffect(() => {
    if (!accessToken) {
      shouldReconnectRef.current = false;
      clearReconnectTimer();

      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }

      setStatus('offline');
      setErrorMessage(null);
      pendingMessagesRef.current.clear();
      return;
    }

    shouldReconnectRef.current = true;
    connect();

    return () => {
      shouldReconnectRef.current = false;
      clearReconnectTimer();

      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [accessToken, clearReconnectTimer, connect]);

  const sendMessage = useEffectEvent((payload: MessageSendPayload) => {
    pendingMessagesRef.current.set(payload.clientId, payload);

    const socket = socketRef.current;

    if (socket && socket.readyState === globalThis.WebSocket.OPEN && status === 'connected') {
      socket.send(
        JSON.stringify({
          event: 'message.send',
          payload,
        }),
      );
      return;
    }

    setErrorMessage('Reconnecting. Your message will send as soon as the connection is back.');
  });

  return {
    status,
    errorMessage,
    sendMessage,
  };
}
