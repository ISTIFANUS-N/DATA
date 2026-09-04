import { writable } from 'svelte/store';

export interface Toast {
  id: number;
  message: string;
  kind: 'success' | 'error';
}

export const toasts = writable<Toast[]>([]);
let counter = 0;

export function showToast(message: string, kind: Toast['kind'] = 'success') {
  const id = ++counter;
  toasts.update((t) => [...t, { id, message, kind }]);
  setTimeout(() => {
    toasts.update((t) => t.filter((toast) => toast.id !== id));
  }, 3200);
}
