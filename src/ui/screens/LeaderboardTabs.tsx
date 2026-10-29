import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { usePlayerHistory, useRanking } from '../../data/queries';

export interface RankingTabProps {
  configurationKey: string;
  configurationLabel?: string | undefined;
  client?: QueryClient | undefined;
}

export function RankingTab({ configurationKey, configurationLabel, client }: RankingTabProps) {
  const [page, setPage] = useState(1);
  const [prevConfigKey, setPrevConfigKey] = useState(configurationKey);

  // Reset to page 1 whenever configurationKey changes
  if (prevConfigKey !== configurationKey) {
    setPrevConfigKey(configurationKey);
    setPage(1);
  }

  const { data, isLoading, isError, isFetching, refetch } = useRanking(
    configurationKey,
    page,
    10,
    client
  );

  const filterHeader = (
    <div className="tab-header-filter" aria-label="Configuration filter">
      <span className="config-badge">
        {`Configuration: ${configurationLabel ?? 'Current settings'}`}
      </span>
    </div>
  );

  if (isError) {
    return (
      <div className="tab-content">
        {filterHeader}
        <div className="tab-status-message tab-error" role="alert">
          <p>Failed to load ranking.</p>
          <button type="button" className="tab-retry-button" onClick={() => void refetch()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="tab-content">
        {filterHeader}
        <div className="tab-status-message tab-loading" aria-live="polite">
          <p>Loading ranking…</p>
        </div>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="tab-content">
        {filterHeader}
        <div className="tab-empty-message">
          <p>No matches for these settings yet.</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(data.totalItems / data.pageSize));

  return (
    <div className="tab-content">
      {filterHeader}
      <div className="table-responsive-container" aria-busy={isFetching}>
        <table className="leaderboard-table" aria-label="Ranking table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Captain</th>
              <th scope="col">Score</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => {
              const rank = (data.page - 1) * data.pageSize + index + 1;
              return (
                <tr key={item.matchId}>
                  <td className="col-rank">{`#${rank}`}</td>
                  <td className="col-player">{item.playerName}</td>
                  <td className="col-score">{item.score}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <nav className="pagination-bar" aria-label="Ranking pagination">
        <button
          type="button"
          className="pagination-nav-button"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page <= 1 || isFetching}
          aria-label="Previous page"
        >
          Previous
        </button>
        <span className="pagination-info" aria-current="page">
          {`Page ${data.page} of ${totalPages}`}
        </span>
        <button
          type="button"
          className="pagination-nav-button"
          onClick={() => setPage(p => p + 1)}
          disabled={page >= totalPages || isFetching}
          aria-label="Next page"
        >
          Next
        </button>
      </nav>
    </div>
  );
}

export interface MatchHistoryTabProps {
  playerId: string;
  client?: QueryClient | undefined;
}

export function MatchHistoryTab({ playerId, client }: MatchHistoryTabProps) {
  const [page, setPage] = useState(1);
  const [prevPlayerId, setPrevPlayerId] = useState(playerId);

  // Reset to page 1 whenever playerId changes
  if (prevPlayerId !== playerId) {
    setPrevPlayerId(playerId);
    setPage(1);
  }

  const { data, isLoading, isError, isFetching, refetch } = usePlayerHistory(
    playerId,
    page,
    10,
    client
  );

  if (isError) {
    return (
      <div className="tab-content">
        <div className="tab-status-message tab-error" role="alert">
          <p>Failed to load match history.</p>
          <button type="button" className="tab-retry-button" onClick={() => void refetch()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="tab-content">
        <div className="tab-status-message tab-loading" aria-live="polite">
          <p>Loading match history…</p>
        </div>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="tab-content">
        <div className="tab-empty-message">
          <p>No completed matches yet.</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(data.totalItems / data.pageSize));

  return (
    <div className="tab-content">
      <div className="table-responsive-container" aria-busy={isFetching}>
        <table className="leaderboard-table" aria-label="Match history table">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Score</th>
              <th scope="col">Duration</th>
              <th scope="col">Reason</th>
              <th scope="col">Config</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map(item => {
              const dateStr = new Date(item.completedAt).toLocaleString();
              const durationSec = Math.round(item.activeDurationMs / 1000);
              const reasonStr =
                item.endReason === 'player_destroyed' ? 'Ship destroyed' : 'Time expired';
              const sessionSec = Math.round(item.configuration.options.sessionDurationMs / 1000);
              const spawnSec = (
                item.configuration.options.enemySpawnIntervalMs / 1000
              ).toFixed(1);
              const configStr = `${sessionSec}s · ${spawnSec}s spawn`;

              return (
                <tr key={item.matchId}>
                  <td className="col-date">{dateStr}</td>
                  <td className="col-score">{item.score}</td>
                  <td className="col-duration">{`${durationSec}s`}</td>
                  <td className="col-reason">{reasonStr}</td>
                  <td className="col-config">{configStr}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <nav className="pagination-bar" aria-label="Match history pagination">
        <button
          type="button"
          className="pagination-nav-button"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page <= 1 || isFetching}
          aria-label="Previous page"
        >
          Previous
        </button>
        <span className="pagination-info" aria-current="page">
          {`Page ${data.page} of ${totalPages}`}
        </span>
        <button
          type="button"
          className="pagination-nav-button"
          onClick={() => setPage(p => p + 1)}
          disabled={page >= totalPages || isFetching}
          aria-label="Next page"
        >
          Next
        </button>
      </nav>
    </div>
  );
}

export interface LeaderboardTabsProps {
  configurationKey: string;
  configurationLabel?: string | undefined;
  playerId: string;
  client?: QueryClient | undefined;
}

export function LeaderboardTabs({
  configurationKey,
  configurationLabel,
  playerId,
  client,
}: LeaderboardTabsProps) {
  const [activeTab, setActiveTab] = useState<'ranking' | 'history'>('ranking');
  const rankingTabRef = useRef<HTMLButtonElement>(null);
  const historyTabRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const tabs = ['ranking', 'history'] as const;
    const currentIndex = tabs.indexOf(activeTab);
    let nextIndex = currentIndex;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (event.key === 'Home') {
      event.preventDefault();
      nextIndex = 0;
    } else if (event.key === 'End') {
      event.preventDefault();
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== currentIndex) {
      const nextTab = tabs[nextIndex]!;
      setActiveTab(nextTab);
      if (nextTab === 'ranking') {
        rankingTabRef.current?.focus();
      } else {
        historyTabRef.current?.focus();
      }
    }
  };

  return (
    <div className="leaderboard-tabs-container">
      <div
        role="tablist"
        aria-label="Rankings and History"
        className="tabs-list"
        onKeyDown={handleKeyDown}
      >
        <button
          ref={rankingTabRef}
          role="tab"
          id="tab-ranking"
          aria-selected={activeTab === 'ranking'}
          aria-controls="panel-ranking"
          tabIndex={activeTab === 'ranking' ? 0 : -1}
          className={`tab-button ${activeTab === 'ranking' ? 'active' : ''}`}
          onClick={() => setActiveTab('ranking')}
          type="button"
        >
          Ranking
        </button>
        <button
          ref={historyTabRef}
          role="tab"
          id="tab-history"
          aria-selected={activeTab === 'history'}
          aria-controls="panel-history"
          tabIndex={activeTab === 'history' ? 0 : -1}
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
          type="button"
        >
          Match History
        </button>
      </div>

      <div
        role="tabpanel"
        id="panel-ranking"
        aria-labelledby="tab-ranking"
        tabIndex={0}
        hidden={activeTab !== 'ranking'}
        className="tab-panel"
      >
        <RankingTab
          configurationKey={configurationKey}
          configurationLabel={configurationLabel}
          client={client}
        />
      </div>

      <div
        role="tabpanel"
        id="panel-history"
        aria-labelledby="tab-history"
        tabIndex={0}
        hidden={activeTab !== 'history'}
        className="tab-panel"
      >
        <MatchHistoryTab playerId={playerId} client={client} />
      </div>
    </div>
  );
}
