import {
  listenMediaQueryChanges,
  resolveThemePreference,
  setThemePreference,
} from 'mazey';
import type { ResolvedTheme, ThemePreference } from 'mazey';

const systemThemeQuery = '(prefers-color-scheme: dark)';

export function initializeThemeControls(storageKey: string): () => void {
  const root = document.documentElement;
  if (root.dataset.themeControlsReady === 'true') return () => undefined;

  let media: MediaQueryList | null = null;
  try {
    media = window.matchMedia(systemThemeQuery);
  } catch {
    // Mazey resolves to a safe fallback when system detection is unavailable.
  }

  const resolveSessionTheme = (preference: ThemePreference): ResolvedTheme =>
    preference === 'system' ? (media?.matches ? 'dark' : 'light') : preference;
  const apply = (
    preference: ThemePreference,
    resolvedTheme: ResolvedTheme
  ): void => {
    root.dataset.bsTheme = resolvedTheme;
    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;
    const themeColor = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"][data-theme-color]'
    );
    if (themeColor) {
      themeColor.content =
        resolvedTheme === 'dark'
          ? (themeColor.dataset.themeColorDark ?? themeColor.content)
          : (themeColor.dataset.themeColorLight ?? themeColor.content);
    }
    try {
      window.localStorage.setItem(
        'tsd-theme',
        preference === 'system' ? 'os' : preference
      );
    } catch {
      // TypeDoc synchronization is optional when storage is unavailable.
    }
    document
      .querySelectorAll<HTMLSelectElement>('[data-theme-select]')
      .forEach((control) => {
        if (control.value !== preference) control.value = preference;
      });
  };

  const initialTheme = resolveThemePreference(storageKey);
  let selectedPreference: ThemePreference =
    initialTheme.label === 'System' ? 'system' : initialTheme.value;
  let sessionOnlyPreference = false;
  const handleChange = (event: Event): void => {
    const control = event.target;
    if (
      !(control instanceof HTMLSelectElement) ||
      !control.matches('[data-theme-select]')
    ) {
      return;
    }
    const preference = control.value as ThemePreference;
    const stored = setThemePreference(storageKey, preference);
    const resolved = resolveThemePreference(storageKey);
    selectedPreference = stored
      ? resolved.label === 'System'
        ? 'system'
        : resolved.value
      : preference;
    sessionOnlyPreference = !stored;
    apply(
      selectedPreference,
      stored ? resolved.value : resolveSessionTheme(preference)
    );
  };
  const handleSystemTheme = (): void => {
    if (selectedPreference !== 'system') return;
    apply(
      'system',
      sessionOnlyPreference
        ? resolveSessionTheme('system')
        : resolveThemePreference(storageKey).value
    );
  };

  root.dataset.themeControlsReady = 'true';
  apply(selectedPreference, initialTheme.value);
  document.addEventListener('change', handleChange);
  const stopListening = listenMediaQueryChanges(media, handleSystemTheme);
  return () => {
    document.removeEventListener('change', handleChange);
    stopListening();
    delete root.dataset.themeControlsReady;
  };
}
