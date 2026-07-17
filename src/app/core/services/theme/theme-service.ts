import { Service, effect, signal } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'pe_theme';

function readStoredMode(): ThemeMode | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'dark' || stored === 'light' ? stored : null;
  } catch {
    return null;
  }
}

function systemPrefersLight(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches;
}

/*
 * ──────────────────────────────────────────────────────────────────
 !  Light/dark theme toggle. The design tokens in styles.less are CSS
 *  custom properties (`:root` = dark, `:root[data-theme='light']` =
 *  light) — this service just owns which one is active: a `mode`
 *  signal, persisted to localStorage, that an effect() mirrors onto
 *  `<html data-theme>`. Defaults to the system preference the first
 *  time there's no stored choice.
 *
 *  index.html also stamps `data-theme` synchronously before Angular
 *  bootstraps (reading the same localStorage key) so there's no flash
 *  of the wrong theme; this service takes over from there.
 * ──────────────────────────────────────────────────────────────────
 */
@Service()
export class ThemeService {
  readonly mode = signal<ThemeMode>(readStoredMode() ?? (systemPrefersLight() ? 'light' : 'dark'));

  constructor() {
    effect(() => {
      const mode = this.mode();
      document.documentElement.setAttribute('data-theme', mode);
      try {
        localStorage.setItem(STORAGE_KEY, mode);
      } catch {
        // Storage unavailable (private mode, quota) — theme still applies for this session.
      }
    });
  }

  toggle(): void {
    this.mode.update((m) => (m === 'dark' ? 'light' : 'dark'));
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
  }
}
