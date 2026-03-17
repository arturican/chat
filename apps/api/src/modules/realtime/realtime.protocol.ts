import { Buffer } from 'node:buffer';
import type {
  AnyClientEvent,
  ServerEvent,
  ServerEventName,
  ServerEventPayloadMap,
} from '@pulsechat/contracts';

type IncomingWsData = string | Buffer | ArrayBuffer | Buffer[];

function toText(data: IncomingWsData): string {
  if (typeof data === 'string') {
    return data;
  }

  if (data instanceof ArrayBuffer) {
    return Buffer.from(data).toString('utf8');
  }

  if (Array.isArray(data)) {
    return Buffer.concat(data).toString('utf8');
  }

  return data.toString('utf8');
}

export function parseRealtimeClientMessage(
  data: IncomingWsData,
): { event: string; data: unknown } | void {
  try {
    const event = JSON.parse(toText(data)) as Partial<AnyClientEvent> & {
      data?: unknown;
    };

    if (!event || typeof event !== 'object' || typeof event.event !== 'string') {
      return;
    }

    return {
      event: event.event,
      data: 'payload' in event ? event.payload : event.data,
    };
  } catch {
    return;
  }
}

export function createServerEvent<TEvent extends ServerEventName>(
  event: TEvent,
  payload: ServerEventPayloadMap[TEvent],
): ServerEvent<TEvent> {
  return {
    event,
    payload,
    ts: new Date().toISOString(),
  };
}

export function serializeServerEvent<TEvent extends ServerEventName>(
  event: TEvent,
  payload: ServerEventPayloadMap[TEvent],
): string {
  return JSON.stringify(createServerEvent(event, payload));
}
