import { useEffect, useRef } from 'react';
import type { CompletedMatchResult } from '../../domain/result';
import { useMatchOutboxStatus } from '../../data/useMatchOutbox';

export interface ResultOutcome {
  result: CompletedMatchResult;
  saved: boolean;
}

export function Result({
  outcome,
  onAgain,
  onMenu,
}: {
  outcome: ResultOutcome;
  onAgain(): void;
  onMenu(): void;
}) {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    title.current?.focus();
  }, [outcome]);

  const result = outcome.result;
  const outbox = useMatchOutboxStatus(result.matchId);

  return (
    <main className="result-screen" data-match-id={result.matchId}>
      <section className="session-panel" aria-labelledby="result-title">
        <h1 id="result-title" ref={title} tabIndex={-1}>
          Result
        </h1>
        <p className="result-reason">
          {result.endReason === 'time_expired' ? 'Time expired' : 'Ship destroyed'}
        </p>
        <dl>
          <div>
            <dt>Score</dt>
            <dd>{result.score}</dd>
          </div>
          <div>
            <dt>Active time</dt>
            <dd>{(result.activeDurationMs / 1000).toFixed(2)} s</dd>
          </div>
        </dl>
        <p role="status" className="storage-status">
          {outcome.saved
            ? 'Saved on this device'
            : 'Could not save on this device. This result is available for this visit.'}
        </p>
        <div className="delivery-status-container">
          <p
            role="status"
            className="delivery-status"
            data-delivery-status={outbox.status}
          >
            {outbox.displayStatus}
          </p>
          {outbox.isPendingOrFailed && (
            <button
              className="secondary retry-button"
              onClick={() => void outbox.retry()}
            >
              Retry
            </button>
          )}
        </div>
        {outbox.error && (
          <p className="delivery-error" role="alert">
            {outbox.error}
          </p>
        )}
        <button onClick={onAgain}>Play Again</button>
        <button className="secondary" onClick={onMenu}>
          Main Menu
        </button>
      </section>
    </main>
  );
}
