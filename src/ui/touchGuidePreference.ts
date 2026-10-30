export const TOUCH_GUIDE_KEY = 'pirate-battle.touch-guide-dismissed.v1';

export function createTouchGuidePreference(storage: () => Pick<Storage, 'getItem' | 'setItem'>) {
  let dismissed = false;
  return {
    read() {
      try { dismissed ||= storage().getItem(TOUCH_GUIDE_KEY) === 'true'; } catch { /* Keep the page's shared memory fallback. */ }
      return dismissed;
    },
    dismiss() {
      dismissed = true;
      try { storage().setItem(TOUCH_GUIDE_KEY, 'true'); } catch { /* Survives HUD remounts until reload. */ }
    },
  };
}

export const touchGuidePreference = createTouchGuidePreference(() => window.sessionStorage);
