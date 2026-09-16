// Small shared pieces for the admin: formatting, badges, panels, dialogs.
//
// Times are written in IST because that is where the packing table is; the wire
// format stays UTC everywhere.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@shared/admin';
import { formatMoney } from '@shared/pricing';
import type { OrderStatus, PaymentStatus } from '@shared/types';

export const IST = 'Asia/Kolkata';

const dateTimeFormat = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});
const dateFormat = new Intl.DateTimeFormat('en-IN', { timeZone: IST, day: '2-digit', month: 'short', year: 'numeric' });

export const formatDateTime = (iso: string | null) => (iso ? dateTimeFormat.format(new Date(iso)) : '—');
export const formatDate = (iso: string | null) => (iso ? dateFormat.format(new Date(iso)) : '—');
export { formatMoney };

export function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60000);
  if (Math.abs(minutes) < 1) return 'just now';
  if (Math.abs(minutes) < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return `${days}d ago`;
  return formatDate(iso);
}

export const formatBytes = (bytes: number | null) =>
  bytes === null ? '—' : bytes > 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.round(bytes / 1000)} KB`;

/** Status badges share one colour vocabulary across the list and the detail. */
const STATUS_TONE: Record<OrderStatus, string> = {
  awaiting_files: 'wait',
  received: 'info',
  ready_to_print: 'info',
  printing: 'work',
  binding: 'work',
  quality_check: 'work',
  packed: 'work',
  shipped: 'good',
  delivered: 'good',
  on_hold: 'warn',
  cancelled: 'dead',
  returned: 'bad',
};

const PAYMENT_TONE: Record<PaymentStatus, string> = {
  pending: 'wait',
  paid: 'good',
  failed: 'bad',
  cod: 'info',
  cod_collected: 'good',
  refunded: 'dead',
  partially_refunded: 'warn',
};

export const StatusBadge = ({ status }: { status: OrderStatus }) => (
  <span className={`badge badge--${STATUS_TONE[status] ?? 'info'}`}>{ORDER_STATUS_LABELS[status] ?? status}</span>
);

export const PaymentBadge = ({ status }: { status: PaymentStatus }) => (
  <span className={`badge badge--${PAYMENT_TONE[status] ?? 'info'}`}>{PAYMENT_STATUS_LABELS[status] ?? status}</span>
);

export function Panel({ title, action, children, className = '' }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`panel ${className}`}>
      <header className="panel__head">
        <h2>{title}</h2>
        {action}
      </header>
      <div className="panel__body">{children}</div>
    </section>
  );
}

export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="copy"
      title={`Copy ${value}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        } catch {
          /* clipboard blocked — the value is on screen anyway */
        }
      }}
    >
      {done ? 'Copied' : label}
    </button>
  );
}

export const Empty = ({ children }: { children: ReactNode }) => <p className="empty">{children}</p>;

export const ErrorNote = ({ error, retry }: { error: string; retry?: () => void }) => (
  <div className="errorbox" role="alert">
    <span>{error}</span>
    {retry && (
      <button type="button" onClick={retry}>
        Try again
      </button>
    )}
  </div>
);

export const Skeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="skeleton" aria-hidden>
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="skeleton__row" />
    ))}
  </div>
);

/**
 * A modal that asks for confirmation and, when `reasonLabel` is given, refuses
 * to submit without one — cancel, hold and return all require a reason both
 * here and on the server.
 */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  reasonLabel,
  tone = 'default',
  busy,
  onConfirm,
  onClose,
}: {
  title: string;
  body?: ReactNode;
  confirmLabel: string;
  reasonLabel?: string;
  tone?: 'default' | 'danger';
  busy?: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const ref = useRef<HTMLDialogElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.showModal();
    field.current?.focus();
  }, []);

  const needsReason = Boolean(reasonLabel);
  const ready = !needsReason || reason.trim().length > 0;

  return (
    <dialog className="dialog" ref={ref} onClose={onClose} onCancel={onClose}>
      <form
        method="dialog"
        onSubmit={e => {
          e.preventDefault();
          if (ready && !busy) onConfirm(reason.trim());
        }}
      >
        <h3>{title}</h3>
        {body && <div className="dialog__body">{body}</div>}
        {reasonLabel && (
          <label className="field">
            <span>{reasonLabel}</span>
            <textarea ref={field} rows={3} value={reason} onChange={e => setReason(e.target.value)} required />
          </label>
        )}
        <footer className="dialog__foot">
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={`btn ${tone === 'danger' ? 'btn--danger' : 'btn--primary'}`} disabled={!ready || busy}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
