// 오프라인 동기화 — 네트워크 없을 때 큐에 쌓고, 복구 시 Supabase에 일괄 전송
// @react-native-community/netinfo로 네트워크 상태 감지

import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const QUEUE_KEY = 'illihealth:offline_queue';

interface QueueItem {
  id: string;
  table: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

// 현재 네트워크 연결 여부 반환
export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected === true && state.isInternetReachable !== false;
}

// 오프라인 큐에 항목 추가
export async function enqueue(table: string, payload: Record<string, unknown>): Promise<void> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const queue: QueueItem[] = raw ? (JSON.parse(raw) as QueueItem[]) : [];
  queue.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    table,
    payload,
    createdAt: new Date().toISOString(),
  });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

// 큐에 쌓인 항목을 Supabase에 전송
export async function flushQueue(): Promise<void> {
  const online = await isOnline();
  if (!online) return;

  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return;

  const queue: QueueItem[] = JSON.parse(raw) as QueueItem[];
  if (queue.length === 0) return;

  const failed: QueueItem[] = [];

  for (const item of queue) {
    const { error } = await supabase.from(item.table).insert(item.payload);
    if (error) {
      failed.push(item);
    }
  }

  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
}

// 앱 시작/네트워크 복구 시 큐 플러시 구독
export function subscribeNetworkFlush(): () => void {
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      void flushQueue();
    }
  });
  return unsubscribe;
}

// 오프라인 안전 insert: 온라인이면 직접, 오프라인이면 큐에
export async function safeInsert(
  table: string,
  payload: Record<string, unknown>
): Promise<{ queued: boolean; error: string | null }> {
  const online = await isOnline();

  if (online) {
    const { error } = await supabase.from(table).insert(payload);
    return { queued: false, error: error?.message ?? null };
  } else {
    await enqueue(table, payload);
    return { queued: true, error: null };
  }
}
