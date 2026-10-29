import { useCallback, useEffect, useSyncExternalStore, useState } from 'react';
import type { OutboxEntry, OutboxStatus } from './contracts';
import { outboxStore } from './outboxStore';
import { outboxService } from './outboxService';

export type SemanticDeliveryStatus = 'Recording…' | 'Recorded' | 'Pending — Retry';

export function mapSemanticStatus(status: OutboxStatus | undefined, inMemoryRecorded: boolean): SemanticDeliveryStatus {
  if (inMemoryRecorded || status === 'recorded') {
    return 'Recorded';
  }
  if (status === 'recording') {
    return 'Recording…';
  }
  return 'Pending — Retry';
}

export interface MatchOutboxState {
  readonly entry: OutboxEntry | undefined;
  readonly status: OutboxStatus;
  readonly displayStatus: SemanticDeliveryStatus;
  readonly isRecording: boolean;
  readonly isRecorded: boolean;
  readonly isPendingOrFailed: boolean;
  readonly error: string | null;
  readonly attempts: number;
  retry: () => Promise<void>;
}

export function useMatchOutboxStatus(matchId: string | undefined): MatchOutboxState {
  const [recordedLocally, setRecordedLocally] = useState<boolean>(false);

  const getSnapshot = useCallback(() => {
    return matchId ? outboxStore.getEntry(matchId) : undefined;
  }, [matchId]);

  // Subscribe to outbox store changes
  const entry = useSyncExternalStore(
    outboxStore.subscribe,
    getSnapshot,
    getSnapshot
  );

  useEffect(() => {
    // If it was once in outbox and now removed, or status is recorded, mark locally as recorded
    if (entry?.status === 'recorded') {
      setRecordedLocally(true);
    }
  }, [entry?.status]);

  const status: OutboxStatus = entry
    ? entry.status
    : recordedLocally
    ? 'recorded'
    : 'recorded'; // If not in outbox at all upon viewing (e.g. from lastResult), it has been confirmed

  const displayStatus = mapSemanticStatus(entry ? entry.status : 'recorded', recordedLocally);
  const isRecording = displayStatus === 'Recording…';
  const isRecorded = displayStatus === 'Recorded';
  const isPendingOrFailed = displayStatus === 'Pending — Retry';

  const retry = useCallback(async () => {
    if (!matchId) return;
    await outboxService.retry(matchId);
  }, [matchId]);

  return {
    entry,
    status,
    displayStatus,
    isRecording,
    isRecorded,
    isPendingOrFailed,
    error: entry?.error ?? null,
    attempts: entry?.attempts ?? 0,
    retry,
  };
}

export function usePendingOutbox() {
  const entries = useSyncExternalStore(
    outboxStore.subscribe,
    outboxStore.getEntries,
    outboxStore.getEntries
  );

  const [isDispatching, setIsDispatching] = useState(false);

  const retryAll = useCallback(async () => {
    setIsDispatching(true);
    try {
      await outboxService.dispatchAllPending();
    } finally {
      setIsDispatching(false);
    }
  }, []);

  const pendingEntries = entries.filter(e => e.status !== 'recorded');
  const pendingCount = pendingEntries.length;

  return {
    entries: pendingEntries,
    pendingCount,
    isDispatching,
    retryAll,
  };
}
