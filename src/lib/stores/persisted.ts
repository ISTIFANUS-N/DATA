import { browser } from '$app/environment';
import { writable, type Writable } from 'svelte/store';

export function persisted<T>(key: string, initial: T): Writable<T> {
  let value = initial;

  if (browser) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        value = JSON.parse(raw);
      } catch {
        value = initial;
      }
    }
  }

  const store = writable<T>(value);

  if (browser) {
    store.subscribe((v) => localStorage.setItem(key, JSON.stringify(v)));
  }

  return store;
}
