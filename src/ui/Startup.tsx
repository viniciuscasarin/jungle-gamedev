import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { startup } from '../startup/session';
import { LOGO_URL } from '../startup/manifest';
import type { StartupState } from '../startup/coordinator';
import { orientation, enterLandscape } from '../input/browserOrientation';

const PHRASES = [
  'Bribing the kraken…', 'Teaching the parrot bad words…',
  'Counting suspiciously acquired gold…', "Untangling the captain's beard…",
  'Checking the plank for splinters…',
];

export function StartupPresentation({ state, children }: { state: StartupState; children?: ReactNode }) {
  const [phrase, setPhrase] = useState(0);
  const status = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.phase !== 'loading') return;
    const timer = setInterval(() => setPhrase(value => (value + 1) % PHRASES.length), 3000);
    return () => clearInterval(timer);
  }, [state.phase]);
  useEffect(() => { if (state.phase === 'failed') status.current?.focus(); }, [state.phase]);
  return <>
    <img key={state.generation} className="startup-logo" src={LOGO_URL} alt="Jungle Gaming" width={1774} height={887} onError={event => { event.currentTarget.style.visibility = 'hidden'; }} />
    <div className="startup-progress" role="progressbar" aria-label="Preparing game resources" aria-valuemin={0} aria-valuemax={100} aria-valuenow={state.progress}>
      <div className="startup-progress-fill" style={{ width: `${state.progress}%` }} />
    </div>
    <p>{state.progress}% · {state.completed}/{state.total} resources prepared</p>
    <p ref={status} tabIndex={-1} role="status">{state.phase === 'failed' ? 'Game images could not be prepared. Please try again.' : state.completed === state.total ? 'Finishing initialization…' : 'Preparing Pirate Battle…'}</p>
    {state.phase === 'loading' && <p className="startup-phrase">{PHRASES[phrase]}</p>}
    {state.phase === 'failed' && <button onClick={() => void startup.retry()}>Retry</button>}
    {children}
  </>;
}

export function StartupShell({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(startup.subscribe, startup.getSnapshot);
  const previousFocus = useRef<HTMLElement | null>(null);
  const guard = useRef<HTMLElement>(null);
  const subscribeOrientation = useCallback((notify: () => void) => {
    let wasBlocked = orientation.getSnapshot().blocked;
    return orientation.subscribe(() => {
      const next = orientation.getSnapshot().blocked;
      // Capture before React sets inert and the browser moves focus to body.
      if (next && !wasBlocked) previousFocus.current = document.activeElement as HTMLElement;
      wasBlocked = next; notify();
    });
  }, []);
  const { blocked } = useSyncExternalStore(subscribeOrientation, orientation.getSnapshot);
  useLayoutEffect(() => { document.getElementById('startup-cover')?.remove(); }, []);
  useLayoutEffect(() => {
    if (blocked) guard.current?.querySelector('button')?.focus();
    else if (previousFocus.current) {
      const previous = previousFocus.current;
      const candidate = previous.isConnected && previous !== document.body && !previous.closest('[inert], [aria-hidden="true"]') ? previous :
        document.querySelector<HTMLElement>('[role="dialog"] button, .menu-panel button, .startup-screen [role="status"]');
      candidate?.focus();
      previousFocus.current = null;
    }
  }, [blocked]);
  useEffect(() => {
    if (blocked && !guard.current?.contains(document.activeElement)) guard.current?.querySelector('button')?.focus();
    if (state.phase === 'ready' && !blocked) {
      const current = document.activeElement;
      if (!current || current === document.body || current.closest('.startup-screen')) {
        document.querySelector<HTMLButtonElement>('[role="dialog"] button, .menu-panel button')?.focus();
      }
    }
  }, [state.phase, blocked]);
  return <>
    {state.phase === 'ready' && <div inert={blocked} aria-hidden={blocked}>{children}</div>}
    {(state.phase !== 'ready' || blocked) && <main ref={guard} className="startup-screen" aria-label={blocked ? 'Landscape required' : 'Game startup'} onKeyDown={event => {
      if (!blocked || event.key !== 'Tab') return;
      const buttons = guard.current?.querySelectorAll<HTMLButtonElement>('button');
      if (!buttons?.length) return;
      const first = buttons[0]!, last = buttons[buttons.length - 1]!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}>
      {state.phase !== 'ready' && <StartupPresentation state={state} />}
      {blocked && <section aria-labelledby="orientation-title">
        <h1 id="orientation-title">Turn your device to landscape</h1>
        <p>Rotate your device sideways to play Pirate Battle.</p>
        <button onClick={() => void enterLandscape()}>Enter landscape</button>
      </section>}
    </main>}
  </>;
}
