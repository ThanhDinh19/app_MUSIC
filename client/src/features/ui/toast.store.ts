import { create } from 'zustand';

export interface Toast {
  id: number;
  message: string;
  tone: 'default' | 'error';
  action?: { label: string; onClick: () => void };
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, 'id'>, durationMs?: number) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast, durationMs = 2800) => {
    const id = nextId++;
    set({ toasts: [...get().toasts.slice(-2), { ...toast, id }] });
    window.setTimeout(() => get().dismiss(id), durationMs);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

/** Gọi được từ bất kỳ đâu (kể cả ngoài React). */
export const toast = (message: string, action?: Toast['action']) =>
  useToastStore.getState().push({ message, tone: 'default', action }, action ? 4500 : 2800);

export const toastError = (message: string) => useToastStore.getState().push({ message, tone: 'error' }, 3800);
