import { useContext } from 'react';
import { keepPreviousData, QueryClientContext, useQuery } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { getPlayerMatches, getRanking } from './client';
import type { PlayerMatchesResponse, RankingResponse } from './contracts';
import { queryClient as defaultQueryClient } from './queryClient';

export const rankingQueryKey = (configurationKey: string, page = 1, pageSize = 10) =>
  ['ranking', configurationKey, page, pageSize] as const;

export const playerHistoryQueryKey = (playerId: string, page = 1, pageSize = 10) =>
  ['history', playerId, page, pageSize] as const;

export function useRanking(
  configurationKey: string,
  page = 1,
  pageSize = 10,
  client?: QueryClient,
) {
  const contextClient = useContext(QueryClientContext);
  const resolvedClient = client ?? contextClient ?? defaultQueryClient;

  return useQuery<RankingResponse, Error>(
    {
      queryKey: rankingQueryKey(configurationKey, page, pageSize),
      queryFn: ({ signal }) => getRanking({ configurationKey, page, pageSize }, { signal }),
      placeholderData: keepPreviousData,
      enabled: Boolean(configurationKey),
    },
    resolvedClient,
  );
}

export function usePlayerHistory(
  playerId: string,
  page = 1,
  pageSize = 10,
  client?: QueryClient,
) {
  const contextClient = useContext(QueryClientContext);
  const resolvedClient = client ?? contextClient ?? defaultQueryClient;

  return useQuery<PlayerMatchesResponse, Error>(
    {
      queryKey: playerHistoryQueryKey(playerId, page, pageSize),
      queryFn: ({ signal }) => getPlayerMatches(playerId, { page, pageSize }, { signal }),
      placeholderData: keepPreviousData,
      enabled: Boolean(playerId),
    },
    resolvedClient,
  );
}

export const useRankingQuery = useRanking;
export const usePlayerHistoryQuery = usePlayerHistory;

