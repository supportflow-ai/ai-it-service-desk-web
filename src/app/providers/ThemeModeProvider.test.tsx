import { act, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ThemeModeProvider } from './ThemeModeProvider';
import { THEME_STORAGE_KEY, useThemeMode } from './themeMode';

function Probe() {
  const { preference, resolved, setPreference } = useThemeMode();
  return (
    <>
      <p>{preference} → {resolved}</p>
      <button type="button" onClick={() => setPreference('dark')}>dark</button>
      <button type="button" onClick={() => setPreference('system')}>system</button>
    </>
  );
}

function mockSystemDark(matches: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
    matches, media: query, onchange: null, addListener() {}, removeListener() {},
    addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
  }));
}

afterEach(() => {
  vi.restoreAllMocks();
  delete document.documentElement.dataset.theme;
});

it('follows the system setting until the user picks a mode', () => {
  mockSystemDark(true);
  render(<ThemeModeProvider><Probe /></ThemeModeProvider>);
  expect(screen.getByText('system → dark')).toBeInTheDocument();
  expect(document.documentElement.dataset.theme).toBe('dark');
});

it('applies and remembers an explicit choice, and forgets it when going back to the system', () => {
  mockSystemDark(false);
  render(<ThemeModeProvider><Probe /></ThemeModeProvider>);
  expect(document.documentElement.dataset.theme).toBe('light');
  act(() => screen.getByRole('button', { name: 'dark' }).click());
  expect(screen.getByText('dark → dark')).toBeInTheDocument();
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  act(() => screen.getByRole('button', { name: 'system' }).click());
  expect(screen.getByText('system → light')).toBeInTheDocument();
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
});

it('restores the saved choice and ignores an unknown stored value', () => {
  localStorage.setItem(THEME_STORAGE_KEY, 'dark');
  const { unmount } = render(<ThemeModeProvider><Probe /></ThemeModeProvider>);
  expect(screen.getByText('dark → dark')).toBeInTheDocument();
  unmount();
  localStorage.setItem(THEME_STORAGE_KEY, 'purple');
  render(<ThemeModeProvider><Probe /></ThemeModeProvider>);
  expect(screen.getByText('system → light')).toBeInTheDocument();
});

it('still renders when storage is blocked', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
  render(<ThemeModeProvider><Probe /></ThemeModeProvider>);
  act(() => screen.getByRole('button', { name: 'dark' }).click());
  expect(screen.getByText('dark → dark')).toBeInTheDocument();
});
