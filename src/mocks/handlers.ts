import { http, HttpResponse } from 'msw';
import { confirmedMatchesStore, paginate, sortRanking } from './store';
import type { CompletedMatchResult } from '../domain/result';
import { ConflictError } from '../data/contracts';
import {
  getNetworkScenario,
  getScenarioDelays,
  getSlowJitterDelay,
  getOutOfOrderDelay,
  handleTemporaryOutage,
  shouldDropCommitTimeout,
  waitDelay,
} from './scenarios';
import { MULTI_PAGE_FIXTURES } from './fixtures';

export const handlers = [
  // GET /api/ranking?configurationKey=...&page=1&pageSize=10
  http.get('*/api/ranking', async ({ request }) => {
    const scenario = getNetworkScenario(request.url);

    if (scenario === 'offline') {
      return HttpResponse.error();
    }
    if (scenario === 'error-4xx') {
      return HttpResponse.json(
        { error: 'Bad Request', code: 'SIMULATED_4XX', message: 'Simulated 400 Bad Request error.' },
        { status: 400 },
      );
    }
    if (scenario === 'error-5xx' || scenario === 'isolated-tab-failure') {
      return HttpResponse.json(
        { error: 'Internal Server Error', code: 'SIMULATED_5XX', message: 'Simulated 500 Server Error.' },
        { status: 500 },
      );
    }
    if (scenario === 'temporary-outage') {
      const outage = handleTemporaryOutage();
      if (outage.shouldFail) {
        return HttpResponse.error();
      }
    }
    if (scenario === 'timeout') {
      await waitDelay(getScenarioDelays().timeoutMs);
    }
    if (scenario === 'slow-jitter') {
      await waitDelay(getSlowJitterDelay());
    }
    if (scenario === 'out-of-order') {
      await waitDelay(getOutOfOrderDelay());
    }

    const url = new URL(request.url);
    const configurationKey = url.searchParams.get('configurationKey');
    if (!configurationKey) {
      return HttpResponse.json(
        {
          error: 'Bad Request',
          code: 'MISSING_CONFIGURATION_KEY',
          message: 'Query parameter "configurationKey" is required.',
        },
        { status: 400 },
      );
    }

    const pageParam = url.searchParams.get('page');
    const pageSizeParam = url.searchParams.get('pageSize');
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 10;

    if (Number.isNaN(page) || page < 1 || Number.isNaN(pageSize) || pageSize < 1) {
      return HttpResponse.json(
        {
          error: 'Bad Request',
          code: 'INVALID_PAGINATION',
          message: 'Query parameters "page" and "pageSize" must be positive integers.',
        },
        { status: 400 },
      );
    }

    if (scenario === 'empty') {
      return HttpResponse.json(
        { items: [], page, pageSize, totalItems: 0 },
        { status: 200 },
      );
    }

    if (scenario === 'multi-page') {
      const filtered = MULTI_PAGE_FIXTURES.filter(m => m.configurationKey === configurationKey);
      const sorted = sortRanking(filtered);
      const response = paginate(sorted, page, pageSize);
      return HttpResponse.json(response, { status: 200 });
    }

    const response = confirmedMatchesStore.getRanking({
      configurationKey,
      page,
      pageSize,
    });

    return HttpResponse.json(response, { status: 200 });
  }),

  // GET /api/players/:playerId/matches?page=1&pageSize=10
  http.get('*/api/players/:playerId/matches', async ({ params, request }) => {
    const scenario = getNetworkScenario(request.url);

    if (scenario === 'offline') {
      return HttpResponse.error();
    }
    if (scenario === 'error-4xx') {
      return HttpResponse.json(
        { error: 'Bad Request', code: 'SIMULATED_4XX', message: 'Simulated 400 Bad Request error.' },
        { status: 400 },
      );
    }
    if (scenario === 'error-5xx') {
      return HttpResponse.json(
        { error: 'Internal Server Error', code: 'SIMULATED_5XX', message: 'Simulated 500 Server Error.' },
        { status: 500 },
      );
    }
    // isolated-tab-failure deliberately does NOT fail player matches
    if (scenario === 'temporary-outage') {
      const outage = handleTemporaryOutage();
      if (outage.shouldFail) {
        return HttpResponse.error();
      }
    }
    if (scenario === 'timeout') {
      await waitDelay(getScenarioDelays().timeoutMs);
    }
    if (scenario === 'slow-jitter') {
      await waitDelay(getSlowJitterDelay());
    }
    if (scenario === 'out-of-order') {
      await waitDelay(getOutOfOrderDelay());
    }

    const playerId = typeof params.playerId === 'string' ? params.playerId : undefined;
    if (!playerId) {
      return HttpResponse.json(
        {
          error: 'Bad Request',
          code: 'MISSING_PLAYER_ID',
          message: 'Path parameter "playerId" is required.',
        },
        { status: 400 },
      );
    }

    const url = new URL(request.url);
    const pageParam = url.searchParams.get('page');
    const pageSizeParam = url.searchParams.get('pageSize');
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 10;

    if (Number.isNaN(page) || page < 1 || Number.isNaN(pageSize) || pageSize < 1) {
      return HttpResponse.json(
        {
          error: 'Bad Request',
          code: 'INVALID_PAGINATION',
          message: 'Query parameters "page" and "pageSize" must be positive integers.',
        },
        { status: 400 },
      );
    }

    if (scenario === 'empty') {
      return HttpResponse.json(
        { items: [], page, pageSize, totalItems: 0 },
        { status: 200 },
      );
    }

    const response = confirmedMatchesStore.getPlayerMatches(playerId, {
      page,
      pageSize,
    });

    return HttpResponse.json(response, { status: 200 });
  }),

  // POST /api/matches
  http.post('*/api/matches', async ({ request }) => {
    const scenario = getNetworkScenario(request.url);

    if (scenario === 'offline') {
      return HttpResponse.error();
    }
    if (scenario === 'error-4xx') {
      return HttpResponse.json(
        { error: 'Bad Request', code: 'SIMULATED_4XX', message: 'Simulated 400 Bad Request error.' },
        { status: 400 },
      );
    }
    if (scenario === 'error-5xx') {
      return HttpResponse.json(
        { error: 'Internal Server Error', code: 'SIMULATED_5XX', message: 'Simulated 500 Server Error.' },
        { status: 500 },
      );
    }
    if (scenario === 'temporary-outage') {
      const outage = handleTemporaryOutage();
      if (outage.shouldFail) {
        return HttpResponse.error();
      }
    }
    if (scenario === 'timeout') {
      await waitDelay(getScenarioDelays().timeoutMs);
    }
    if (scenario === 'slow-jitter') {
      await waitDelay(getSlowJitterDelay());
    }
    if (scenario === 'out-of-order') {
      await waitDelay(getOutOfOrderDelay());
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return HttpResponse.json(
        {
          error: 'Bad Request',
          code: 'INVALID_JSON',
          message: 'Request body must be valid JSON.',
        },
        { status: 400 },
      );
    }

    try {
      const typedPayload = payload as CompletedMatchResult;
      const { match, created } = confirmedMatchesStore.addMatch(typedPayload);

      if (scenario === 'commit-timeout') {
        if (shouldDropCommitTimeout(match.matchId)) {
          return HttpResponse.error();
        }
        return HttpResponse.json(match, { status: 200 });
      }

      return HttpResponse.json(match, { status: created ? 201 : 200 });
    } catch (error) {
      if (error instanceof ConflictError) {
        return HttpResponse.json(
          {
            error: 'Conflict',
            code: error.code,
            message: error.message,
            details: error.details,
          },
          { status: 409 },
        );
      }

      const message = error instanceof Error ? error.message : 'Invalid match payload';
      return HttpResponse.json(
        {
          error: 'Bad Request',
          code: 'INVALID_PAYLOAD',
          message,
        },
        { status: 400 },
      );
    }
  }),
];
