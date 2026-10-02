import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type Theme = 'light' | 'dark';

// app.html applies the saved theme before first paint; this just mirrors it.
function initial(): Theme {
  if (!browser) return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export const theme = writable<Theme>(initial());

function apply(t: Theme) {
  if (!browser) return;
  document.documentElement.classList.toggle('dark', t === 'dark');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#0B120E' : '#1F7A34');
}

export function setTheme(t: Theme) {
  theme.set(t);
  apply(t);
  try { localStorage.setItem('stx_theme', t); } catch {}
}

export function toggleTheme() {
  setTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark');
}
