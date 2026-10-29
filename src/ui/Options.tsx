import { useEffect, useRef, useState } from 'react';
import { OPTION_METADATA } from '../domain/config';
import type { GameOptions } from '../domain/config';
import { OPTION_KEYS, optionHelp, optionsDraft, saveDraft, validateDraft } from './optionsDraft';

export function Options({
  initial,
  notice,
  soundMuted = false,
  onToggleMute,
  save,
  onSaved,
  onCancel,
}: {
  initial: GameOptions | undefined;
  notice: string | undefined;
  soundMuted?: boolean;
  onToggleMute?: (muted: boolean) => void;
  save(options: GameOptions): boolean;
  onSaved(): void;
  onCancel(): void;
}) {
  const [draft, setDraft] = useState(() => optionsDraft(initial));
  const [failure, setFailure] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);
  const validation = validateDraft(draft);
  useEffect(() => { title.current?.focus(); }, []);
  return <main className="menu-screen options-screen" onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); onCancel(); } }}>
    <section className="menu-panel options-panel" aria-labelledby="options-title">
      <h1 id="options-title" ref={title} tabIndex={-1}>Options</h1>
      <p>Settings for your next match</p>
      {notice && <p className="storage-notice" role="status">{notice}</p>}
      <form noValidate onSubmit={event => {
        event.preventDefault();
        if (!validateDraft(draft).options) return;
        if (saveDraft(draft, save)) onSaved(); else setFailure(true);
      }}>
        {OPTION_KEYS.map(key => <div className="option-field" key={key}>
          <label htmlFor={key}>{OPTION_METADATA[key].label} <span>(seconds)</span></label>
          <input id={key} name={key} type="text" inputMode={OPTION_METADATA[key].step === 1000 ? 'numeric' : 'decimal'} autoComplete="off" spellCheck={false} value={draft[key]} onChange={event => setDraft({ ...draft, [key]: event.target.value })} aria-invalid={!!validation.errors[key]} aria-describedby={`${key}-help${validation.errors[key] ? ` ${key}-error` : ''}`} />
          <p className="field-help" id={`${key}-help`}>{optionHelp(key)}</p>
          {validation.errors[key] && <p className="field-error" id={`${key}-error`}>{validation.errors[key]}</p>}
        </div>)}
        <div className="option-field sound-option">
          <label htmlFor="sound-mute-button">Audio sound effects</label>
          {onToggleMute && (
            <button
              id="sound-mute-button"
              type="button"
              className="sound-toggle secondary"
              style={{ minHeight: '48px', minWidth: '48px', width: 'auto', padding: '10px 20px', marginTop: '6px' }}
              onClick={() => onToggleMute(!soundMuted)}
              aria-label={soundMuted ? 'Sound is muted, click to unmute' : 'Sound is active, click to mute'}
              aria-pressed={!soundMuted}
            >
              <span aria-hidden="true">{soundMuted ? '🔇 Sound: Muted' : '🔊 Sound: Active'}</span>
            </button>
          )}
          <p className="field-help" id="sound-mute-help">Toggle sound effects on or off.</p>
        </div>
        {failure && <p className="save-error" role="alert">Could not save settings on this device. Your changes are still here. Try Save again or Cancel.</p>}
        <button type="submit" disabled={!validation.options}>Save</button>
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
      </form>
    </section>
  </main>;
}
