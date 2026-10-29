import type { CompletedMatchResult } from '../domain/result';

export interface PaginatedResponse<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
}

export interface RequestOptions {
  readonly signal?: AbortSignal | undefined;
}

export interface RankingQuery {
  readonly configurationKey: string;
  readonly page?: number;
  readonly pageSize?: number;
  readonly signal?: AbortSignal | undefined;
}

export interface PlayerMatchesQuery {
  readonly page?: number;
  readonly pageSize?: number;
  readonly signal?: AbortSignal | undefined;
}

export type RankingItem = CompletedMatchResult;
export type PlayerMatchItem = CompletedMatchResult;

export type RankingResponse = PaginatedResponse<RankingItem>;
export type PlayerMatchesResponse = PaginatedResponse<PlayerMatchItem>;

export interface ApiErrorResponse {
  readonly error: string;
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Match ID already registered with divergent payload', details?: unknown) {
    super(409, 'MATCH_PAYLOAD_CONFLICT', message, details);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Invalid match payload', details?: unknown) {
    super(400, 'INVALID_PAYLOAD', message, details);
    this.name = 'ValidationError';
  }
}

export type OutboxStatus = 'pending' | 'recording' | 'recorded' | 'failed';

export type OutboxErrorCategory = 'network' | 'timeout' | 'validation' | 'conflict' | 'server' | 'unknown';

export interface OutboxEntry {
  readonly matchId: string;
  readonly result: CompletedMatchResult;
  readonly status: OutboxStatus;
  readonly attempts: number;
  readonly lastAttemptAt: string | null;
  readonly error: string | null;
  readonly errorCategory?: OutboxErrorCategory | undefined;
  readonly permanentFailure: boolean;
  readonly createdAt: string;
}
