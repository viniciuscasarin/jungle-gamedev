import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { orientation } from '../input/browserOrientation';

export interface DialogProps {
  readonly title: string;
  readonly children?: ReactNode;
  readonly onEscape?: () => void;
}

const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Dialog({ title, children, onEscape }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const { blocked } = useSyncExternalStore(orientation.subscribe, orientation.getSnapshot, orientation.getSnapshot);

  useEffect(() => {
    triggerRef.current = document.activeElement as HTMLElement | null;

    const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (focusables && focusables.length > 0) {
      focusables[0]?.focus();
    }

    return () => {
      const trigger = triggerRef.current;
      if (trigger?.isConnected && !trigger.closest('[inert]')) trigger.focus();
    };
  }, [title]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (blocked) return;
    if (event.key === 'Escape' && onEscape) {
      event.preventDefault();
      onEscape();
      return;
    }

    if (event.key !== 'Tab' || !dialogRef.current) return;

    const focusables = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusables.length === 0) return;

    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;

    if (event.shiftKey) {
      if (document.activeElement === first || !dialogRef.current.contains(document.activeElement)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last || !dialogRef.current.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div className="dialog-backdrop">
      <div
        className="session-panel"
        role="dialog"
        aria-modal={blocked ? undefined : true}
        aria-labelledby="dialog-title"
        ref={dialogRef}
        onKeyDown={handleKeyDown}
      >
        <h2 id="dialog-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}
