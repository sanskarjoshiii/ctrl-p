import { create } from 'zustand';

export interface Toast {
  id: number;
  message: string;
  tone: 'info' | 'error';
  action?: { label: string; run: () => void };
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, tone?: Toast['tone'], action?: Toast['action']) => void;
  dismiss: (id: number) => void;
}

let seq = 0;
export const useToasts = create<ToastState>(set => ({
  toasts: [],
  push: (message, tone = 'info', action) => {
    const id = ++seq;
    set(s => ({ toasts: [...s.toasts.slice(-2), { id, message, tone, action }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), tone === 'error' ? 6000 : 3600);
  },
  dismiss: id => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));

export const toast = (message: string, tone?: Toast['tone'], action?: Toast['action']) => useToasts.getState().push(message, tone, action);
