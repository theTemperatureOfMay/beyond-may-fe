import { Client } from "@stomp/stompjs";
import type { IMessage } from "@stomp/stompjs";
import { ENV } from "@/lib/env";

let client: Client | null = null;

/** STOMP 클라이언트 생성. 토큰은 CONNECT 프레임 헤더로 전달. */
const createClient = (token?: string): Client =>
  new Client({
    brokerURL: ENV.SOCKET_URL, // ws://.../ws
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    reconnectDelay: 3000, // 끊기면 3초 후 재연결
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
  });

/** 단일 클라이언트 반환 (없으면 생성) */
export const getClient = (): Client => {
  if (!client) {
    client = createClient();
  }
  return client;
};

/** 연결 시작. 토큰이 있으면 토큰을 실어 새로 생성. */
export const connectClient = (token?: string): Client => {
  if (token) {
    if (client?.active) {
      client.deactivate();
    }
    client = createClient(token);
  }
  const current = getClient();
  if (!current.active) {
    current.activate(); // 연결 시작
  }
  return current;
};

/** 연결 해제 */
export const disconnectClient = (): void => {
  if (client?.active) {
    client.deactivate();
  }
  client = null;
};

/** STOMP 메시지 발행 (SEND). destination에 JSON body 전송. */
export const publishMessage = (destination: string, body: unknown): void => {
  const current = getClient();
  if (current.active && current.connected) {
    current.publish({
      destination,
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    });
  }
};

export type { IMessage };
