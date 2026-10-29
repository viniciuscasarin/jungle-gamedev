import axios, { AxiosError } from 'axios';
import type { AxiosInstance, CreateAxiosDefaults } from 'axios';
import type { CompletedMatchResult } from '../domain/result';
import { ApiError, ConflictError, ValidationError } from './contracts';
import type {
  ApiErrorResponse,
  PlayerMatchesQuery,
  PlayerMatchesResponse,
  RankingQuery,
  RankingResponse,
  RequestOptions,
} from './contracts';

export function createApiClient(config?: CreateAxiosDefaults, instance?: AxiosInstance) {
  const client =
    instance ??
    axios.create({
      baseURL: config?.baseURL ?? (typeof window !== 'undefined' ? '' : 'http://localhost'),
      timeout: config?.timeout ?? 15000,
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      ...config,
    });

  function wrapError(error: unknown): never {
    if (axios.isCancel(error)) {
      throw error;
    }
    if (axios.isAxiosError(error)) {
      const axiosErr = error as AxiosError<ApiErrorResponse>;
      if (axiosErr.code === 'ERR_CANCELED' || axiosErr.name === 'CanceledError') {
        throw error;
      }
      if (axiosErr.code === 'ECONNABORTED' || axiosErr.message?.toLowerCase().includes('timeout')) {
        throw new ApiError(0, 'TIMEOUT', axiosErr.message || 'Request timed out');
      }
      const status = axiosErr.response?.status ?? 0;
      const data = axiosErr.response?.data;
      if (status === 409) {
        throw new ConflictError(data?.message ?? 'Match ID already registered with divergent payload', data?.details);
      }
      if (status === 400) {
        throw new ValidationError(data?.message ?? 'Invalid match payload', data?.details);
      }
      if (status > 0) {
        throw new ApiError(status, data?.code ?? 'HTTP_ERROR', data?.message ?? axiosErr.message, data?.details);
      }
      throw new ApiError(0, 'NETWORK_ERROR', axiosErr.message || 'Network error occurred');
    }
    throw error;
  }

  return {
    async getRanking(query: RankingQuery, options?: RequestOptions): Promise<RankingResponse> {
      try {
        const signal = options?.signal ?? query.signal;
        const response = await client.get<RankingResponse>('/api/ranking', {
          params: {
            configurationKey: query.configurationKey,
            page: query.page ?? 1,
            pageSize: query.pageSize ?? 10,
          },
          ...(signal ? { signal } : {}),
        });
        return response.data;
      } catch (error) {
        return wrapError(error);
      }
    },

    async getPlayerMatches(playerId: string, query?: PlayerMatchesQuery, options?: RequestOptions): Promise<PlayerMatchesResponse> {
      try {
        const signal = options?.signal ?? query?.signal;
        const response = await client.get<PlayerMatchesResponse>(`/api/players/${encodeURIComponent(playerId)}/matches`, {
          params: {
            page: query?.page ?? 1,
            pageSize: query?.pageSize ?? 10,
          },
          ...(signal ? { signal } : {}),
        });
        return response.data;
      } catch (error) {
        return wrapError(error);
      }
    },

    async postMatch(result: CompletedMatchResult, options?: RequestOptions): Promise<CompletedMatchResult> {
      try {
        const signal = options?.signal;
        const response = await client.post<CompletedMatchResult>('/api/matches', result, {
          ...(signal ? { signal } : {}),
        });
        return response.data;
      } catch (error) {
        return wrapError(error);
      }
    },
  };
}

export const apiClient = createApiClient();
export const { getRanking, getPlayerMatches, postMatch } = apiClient;
