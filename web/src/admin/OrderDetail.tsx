import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  FULFILMENT_FLOW,
  HOLDABLE,
  ORDER_STATUS_LABELS,
  REASON_REQUIRED,
  checkTransition,
} from '@shared/admin';
import { BINDINGS, PAPERS } from '@shared/pricing';
import type { OrderStatus } from '@shared/types';
import { toast } from '../store/toast';
import { adminApi, type AdminItem, type OrderDetail as Detail } from './api';
import { useApiErrorHandler, useSession } from './AdminApp';
import {
  ConfirmDialog,
  CopyButton,
  Empty,
  ErrorNote,
  PaymentBadge,
  Panel,
  Skeleton,
  StatusBadge,
  formatBytes,
  formatDate,
  formatDateTime,
  formatMoney,
  relativeTime,
} from './ui';
import { useResource } from './useResource';

export default function OrderDetail() {
  const { id = '' } = useParams();
  const { user, allows } = useSession();
  const onError = useApiErrorHandler();

  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ to: OrderStatus; reason: boolean } | null>(null);
  const [shipping, setShipping] = useState(false);
  const [gallery, setGallery] = useState<{ item: AdminItem; page: number } | null>(null);
  // An optimistic status change paints `override` over the detail it was based
  // on. Once the refetch returns a new object the base no longer matches and the
  // override retires itself — no effect, and no window where the optimistic
  // paint outlives the real answer.
  const [override, setOverride] = useState<{ base: Detail; detail: Detail } | null>(null);

  const resource = useResource<Detail>(() => adminApi.order(id), id, err => onError(err, 'Could not load this order'));
  const load = resource.reload;
  const data = override && override.base === resource.data ? override.detail : resource.data;

  if (resource.error) return <ErrorNote error={resource.error} retry={load} />;
  if (!data) return <Skeleton rows={10} />;

  const { order, items, notes, events, otherOrders } = data;

  /** Optimistic status change: paint it, then roll back if the server says no. */
  async function changeStatus(to: OrderStatus, reason: string) {
    const base = resource.data;
    const current = data!;
    setBusy(true);
    // Paint every field the server would set, not just the status, so the
    // optimistic view matches what comes back instead of briefly showing a
    // hold with no reason.
    if (base) {
      setOverride({
        base,
        detail: {
          ...current,
          order: {
            ...current.order,
            status: to,
            holdFrom: to === 'on_hold' ? current.order.status : current.order.holdFrom,
            holdReason: to === 'on_hold' ? reason : null,
            cancelReason: to === 'cancelled' ? reason : current.order.cancelReason,
            cancelledAt: to === 'cancelled' ? new Date().toISOString() : current.order.cancelledAt,
          },
        },
      });
    }
    try {
      await adminApi.setStatus(id, to, reason);
      toast(`Moved to ${ORDER_STATUS_LABELS[to].toLowerCase()}`);
      load();
    } catch (err) {
      setOverride(null);
      onError(err, 'Could not change the status');
    } finally {
      setBusy(false);
      setPending(null);
    }
  }

  function requestStatus(to: OrderStatus) {
    const verdict = checkTransition(order.status, to, {
      role: user.role,
      paymentStatus: order.paymentStatus,
      holdFrom: order.holdFrom,
      carrier: order.carrier,
      trackingNumber: order.trackingNumber,
      // The dialog collects the reason; assume one so the preview is about the
      // transition itself, not the empty field.
      reason: REASON_REQUIRED.includes(to) ? 'pending' : undefined,
    });
    if (!verdict.ok) {
      toast(verdict.reason ?? 'That change is not allowed', 'error');
      return;
    }
    if (to === 'shipped') {
      setShipping(true);
      return;
    }
    if (REASON_REQUIRED.includes(to)) {
      setPending({ to, reason: true });
      return;
    }
    void changeStatus(to, '');
  }

  const next = order.nextStatus;
  const canEditAddress = allows('orders.address') && !['shipped', 'delivered', 'returned'].includes(order.status);

  return (
    <div className="stack">
      <div className="orderhead">
        <div>
          <Link to="/admin/orders" className="back">
            ← Orders
          </Link>
          <h1 className="mono">
            {order.id} <CopyButton value={order.id} />
          </h1>
          <p className="muted">
            Placed {formatDateTime(order.createdAt)} · {relativeTime(order.createdAt)}
            {order.shipBy && (
              <>
                {' · '}
                <span className={order.late ? 'late' : ''}>ship by {formatDate(order.shipBy)}</span>
              </>
            )}
          </p>
        </div>
        <div className="orderhead__badges">
          <StatusBadge status={order.status} />
          <PaymentBadge status={order.paymentStatus} />
        </div>
      </div>

      <div className="stepper">
        {FULFILMENT_FLOW.map(step => {
          const reached = FULFILMENT_FLOW.indexOf(order.status) >= FULFILMENT_FLOW.indexOf(step) && FULFILMENT_FLOW.includes(order.status);
          return (
            <span key={step} className={`stepper__step ${reached ? 'is-done' : ''} ${order.status === step ? 'is-now' : ''}`}>
              {ORDER_STATUS_LABELS[step]}
            </span>
          );
        })}
      </div>

      {order.status === 'on_hold' && (
        <div className="notice notice--warn">
          <strong>On hold</strong>
          {order.holdReason ? ` — ${order.holdReason}` : ''}
          {order.holdFrom ? ` (paused at ${ORDER_STATUS_LABELS[order.holdFrom].toLowerCase()})` : ''}
        </div>
      )}
      {order.status === 'cancelled' && (
        <div className="notice notice--bad">
          <strong>Cancelled</strong>
          {order.cancelReason ? ` — ${order.cancelReason}` : ''} on {formatDate(order.cancelledAt)}
        </div>
      )}

      {allows('orders.status') && (
        <div className="actions">
          {next && (
            <button type="button" className="btn btn--primary" disabled={busy} onClick={() => requestStatus(next)}>
              {next === 'shipped' ? 'Mark shipped…' : `Move to ${ORDER_STATUS_LABELS[next].toLowerCase()}`}
            </button>
          )}
          {HOLDABLE.includes(order.status) && (
            <button type="button" className="btn" disabled={busy} onClick={() => requestStatus('on_hold')}>
              Hold…
            </button>
          )}
          {allows('orders.cancel') && !['cancelled', 'shipped', 'delivered', 'returned'].includes(order.status) && (
            <button type="button" className="btn btn--danger" disabled={busy} onClick={() => requestStatus('cancelled')}>
              Cancel…
            </button>
          )}
          {order.status === 'shipped' && (
            <button type="button" className="btn" disabled={busy} onClick={() => requestStatus('returned')}>
              Returned…
            </button>
          )}
          <button
            type="button"
            className="btn btn--ghost"
            disabled={busy}
            onClick={async () => {
              try {
                const r = await adminApi.resendEmail(id, order.status === 'shipped' ? 'order_shipped' : 'order_received');
                toast(r.email ? `Email queued to ${r.email.to}` : 'Email could not be sent', r.email ? 'info' : 'error');
                load();
              } catch (err) {
                onError(err, 'Could not resend the email');
              }
            }}
          >
            Resend email
          </button>
        </div>
      )}

      <div className="grid grid--detail">
        <div className="stack">
          <Panel title="Diaries">
            {items.map(item => (
              <ItemCard key={item.index} orderId={order.id} item={item} canFiles={allows('orders.files')} onChanged={load} onOpenGallery={page => setGallery({ item, page })} />
            ))}
          </Panel>

          <Panel title="Activity">
            {events.length === 0 ? (
              <Empty>Nothing recorded yet.</Empty>
            ) : (
              <ol className="timeline">
                {events.map(event => (
                  <li key={event.id}>
                    <time dateTime={event.createdAt} title={formatDateTime(event.createdAt)}>
                      {relativeTime(event.createdAt)}
                    </time>
                    <div>
                      <strong>
                        {event.fromStatus && event.toStatus
                          ? `${ORDER_STATUS_LABELS[event.fromStatus]} → ${ORDER_STATUS_LABELS[event.toStatus]}`
                          : event.type.replace(/_/g, ' ')}
                      </strong>
                      {event.note && <p>{event.note}</p>}
                      <span className="muted small">{event.actorName ?? event.actorType}</span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>

        <div className="stack">
          <Panel
            title="Customer & delivery"
            action={canEditAddress ? <AddressEditor orderId={order.id} order={order} onSaved={load} /> : undefined}
          >
            <address className="shiplabel">
              {order.shippingLabel.map(line => (
                <div key={line}>{line}</div>
              ))}
            </address>
            <p className="muted small">
              <a href={`mailto:${order.customer.email}`}>{order.customer.email}</a> ·{' '}
              <a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a> ·{' '}
              <a href={`https://wa.me/${order.customer.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            </p>
            <p className="muted small">Delivery: {order.shippingMethod}</p>
            {otherOrders.length > 0 && (
              <p className="muted small">
                {otherOrders.length} other order{otherOrders.length === 1 ? '' : 's'} from this customer:{' '}
                {otherOrders.map(o => (
                  <Link key={o.id} to={`/admin/orders/${o.id}`} className="mono">
                    {o.id}{' '}
                  </Link>
                ))}
              </p>
            )}
          </Panel>

          <Panel title="Shipping">
            {order.trackingNumber ? (
              <dl className="kv">
                <dt>Carrier</dt>
                <dd>{order.carrier}</dd>
                <dt>Tracking</dt>
                <dd className="mono">
                  {order.trackingNumber} <CopyButton value={order.trackingNumber} />
                </dd>
                <dt>Shipped</dt>
                <dd>{formatDateTime(order.shippedAt)}</dd>
                {order.deliveredAt && (
                  <>
                    <dt>Delivered</dt>
                    <dd>{formatDateTime(order.deliveredAt)}</dd>
                  </>
                )}
              </dl>
            ) : (
              <Empty>Not dispatched yet.</Empty>
            )}
          </Panel>

          <Panel title="Totals">
            <dl className="kv kv--money">
              <dt>Subtotal</dt>
              <dd>{formatMoney(order.totals.subtotal)}</dd>
              {order.totals.bundleDiscount > 0 && (
                <>
                  <dt>{order.totals.bundleLabel}</dt>
                  <dd>−{formatMoney(order.totals.bundleDiscount)}</dd>
                </>
              )}
              {order.totals.promoDiscount > 0 && (
                <>
                  <dt>Promo {order.totals.promoCode}</dt>
                  <dd>−{formatMoney(order.totals.promoDiscount)}</dd>
                </>
              )}
              <dt>Shipping</dt>
              <dd>{order.totals.shipping ? formatMoney(order.totals.shipping) : 'Free'}</dd>
              <dt className="total">Total</dt>
              <dd className="total">{formatMoney(order.totals.total)}</dd>
            </dl>
            <p className="muted small">Paid by {order.paymentMethod === 'cod' ? 'cash on delivery' : 'card / online'}</p>
          </Panel>

          <Tags orderId={order.id} tags={order.tags} editable={allows('orders.annotate')} onSaved={load} />

          <Panel title="Internal notes">
            {allows('orders.annotate') && <NoteForm orderId={order.id} onSaved={load} />}
            {notes.length === 0 ? (
              <Empty>No notes yet.</Empty>
            ) : (
              <ul className="notes">
                {notes.map(note => (
                  <li key={note.id}>
                    <p>{note.body}</p>
                    <span className="muted small">
                      {note.authorName} · {relativeTime(note.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      {pending && (
        <ConfirmDialog
          title={pending.to === 'cancelled' ? 'Cancel this order?' : `Move to ${ORDER_STATUS_LABELS[pending.to].toLowerCase()}?`}
          body={pending.to === 'cancelled' ? <p>The customer will be emailed. Any payment taken has to be refunded separately.</p> : undefined}
          confirmLabel={pending.to === 'cancelled' ? 'Cancel order' : 'Confirm'}
          reasonLabel="Reason (required, recorded on the order)"
          tone={pending.to === 'cancelled' ? 'danger' : 'default'}
          busy={busy}
          onConfirm={reason => changeStatus(pending.to, reason)}
          onClose={() => setPending(null)}
        />
      )}

      {shipping && (
        <ShipDialog
          orderId={order.id}
          busy={busy}
          onClose={() => setShipping(false)}
          onShipped={() => {
            setShipping(false);
            load();
          }}
        />
      )}

      {gallery && <Lightbox orderId={order.id} item={gallery.item} page={gallery.page} onClose={() => setGallery(null)} onPage={page => setGallery({ ...gallery, page })} />}
    </div>
  );
}

function ItemCard({
  orderId,
  item,
  canFiles,
  onChanged,
  onOpenGallery,
}: {
  orderId: string;
  item: AdminItem;
  canFiles: boolean;
  onChanged: () => void;
  onOpenGallery: (page: number) => void;
}) {
  const onError = useApiErrorHandler();
  const [regenerating, setRegenerating] = useState(false);
  const print = item.printFile;
  const warnings = item.preflight;
  const pages = Array.from({ length: item.pagesExpected }, (_, i) => i);

  return (
    <article className="item">
      <header>
        <h3>{item.title}</h3>
        <span className="muted small">
          {item.sizeLabel} · {BINDINGS[item.options.binding].label} · {PAPERS[item.options.paper].label}
          {item.options.giftBox ? ' · gift box' : ''} · {item.pages} pages · ×{item.qty} · {formatMoney(item.unitPrice)} each
        </span>
      </header>

      <div className="item__files">
        <span>
          Pages received {item.filesReceived}/{item.pagesExpected}
        </span>
        {print ? (
          <span className={`badge badge--${print.status === 'ready' ? 'good' : print.status === 'failed' ? 'bad' : 'wait'}`}>PDF {print.status}</span>
        ) : (
          <span className="badge badge--wait">PDF not queued</span>
        )}
        {canFiles && print?.status === 'ready' && (
          <a className="btn btn--sm" href={adminApi.printPdfUrl(orderId, item.index)}>
            Download PDF ({formatBytes(print.bytes)})
          </a>
        )}
        {canFiles && (
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            disabled={regenerating}
            onClick={async () => {
              setRegenerating(true);
              try {
                await adminApi.regeneratePdf(orderId, item.index);
                toast('Rebuild queued — refresh in a minute');
                onChanged();
              } catch (err) {
                onError(err, 'Could not queue a rebuild');
              } finally {
                setRegenerating(false);
              }
            }}
          >
            {regenerating ? 'Queuing…' : 'Regenerate'}
          </button>
        )}
      </div>

      {print?.error && <p className="notice notice--bad small">{print.error}</p>}

      {print?.report && (
        <details className="prepress">
          <summary>
            Prepress report · {print.report.pageCount} pages · {print.report.trimMm.width}×{print.report.trimMm.height} mm · {print.report.iccProfileName}
          </summary>
          <ul>
            {print.report.checks.map(check => (
              <li key={check.name} className={check.pass ? 'ok' : check.blocking ? 'bad' : 'warn'}>
                <strong>{check.name}</strong> {check.detail}
              </li>
            ))}
          </ul>
          {print.sha256 && <p className="muted small mono">sha256 {print.sha256}</p>}
        </details>
      )}

      {warnings && warnings.emptyFrames + warnings.lowResPhotos + warnings.missingPhotos > 0 && (
        <ul className="checks">
          {warnings.emptyFrames > 0 && (
            <li className="warn">
              {warnings.emptyFrames} empty photo frame{warnings.emptyFrames > 1 ? 's' : ''}
              {warnings.emptyPages.length > 0 && ` — pages ${warnings.emptyPages.map(p => p + 1).join(', ')}`}
            </li>
          )}
          {warnings.lowResPhotos > 0 && (
            <li className="warn">
              {warnings.lowResPhotos} photo{warnings.lowResPhotos > 1 ? 's' : ''} below 150 dpi
              {warnings.lowResPages.length > 0 && ` — pages ${warnings.lowResPages.map(p => p + 1).join(', ')}`}
            </li>
          )}
          {warnings.missingPhotos > 0 && <li className="bad">{warnings.missingPhotos} photo(s) were missing from the customer's device</li>}
        </ul>
      )}

      {canFiles && item.filesReceived > 0 && (
        <div className="gallery">
          {pages.map(page => (
            <button key={page} type="button" className="gallery__thumb" onClick={() => onOpenGallery(page)} title={pageLabel(page, item.pagesExpected)}>
              <img src={adminApi.pageUrl(orderId, item.index, page)} alt={pageLabel(page, item.pagesExpected)} loading="lazy" />
              <span>{pageLabel(page, item.pagesExpected)}</span>
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

const pageLabel = (page: number, total: number) => (page === 0 ? 'Cover' : page === total - 1 ? 'Back' : String(page));

function Lightbox({ orderId, item, page, onClose, onPage }: { orderId: string; item: AdminItem; page: number; onClose: () => void; onPage: (page: number) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPage(Math.max(0, page - 1));
      if (e.key === 'ArrowRight') onPage(Math.min(item.pagesExpected - 1, page + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [page, item.pagesExpected, onClose, onPage]);

  return (
    <div className="lightbox" role="dialog" aria-label="Page preview" onClick={onClose}>
      <figure onClick={e => e.stopPropagation()}>
        <img src={adminApi.pageUrl(orderId, item.index, page)} alt={pageLabel(page, item.pagesExpected)} />
        <figcaption>
          <button type="button" className="btn btn--sm" disabled={page === 0} onClick={() => onPage(page - 1)}>
            ←
          </button>
          <span>
            {item.title} · {pageLabel(page, item.pagesExpected)} of {item.pagesExpected}
          </span>
          <button type="button" className="btn btn--sm" disabled={page >= item.pagesExpected - 1} onClick={() => onPage(page + 1)}>
            →
          </button>
          <button type="button" className="btn btn--sm btn--ghost" onClick={onClose}>
            Close
          </button>
        </figcaption>
      </figure>
    </div>
  );
}

function ShipDialog({ orderId, busy, onClose, onShipped }: { orderId: string; busy: boolean; onClose: () => void; onShipped: () => void }) {
  const onError = useApiErrorHandler();
  const [carrier, setCarrier] = useState('');
  const [tracking, setTracking] = useState('');
  const [sending, setSending] = useState(false);

  return (
    <ConfirmDialog
      title="Mark shipped"
      body={
        <>
          <label className="field">
            <span>Carrier</span>
            <input value={carrier} onChange={e => setCarrier(e.target.value)} placeholder="Bluedart, Delhivery…" required />
          </label>
          <label className="field">
            <span>Tracking number (AWB)</span>
            <input value={tracking} onChange={e => setTracking(e.target.value)} required className="mono" />
          </label>
          <p className="muted small">This emails the customer a tracking link.</p>
        </>
      }
      confirmLabel="Mark shipped & email"
      busy={busy || sending}
      onConfirm={async () => {
        if (!carrier.trim() || !tracking.trim()) {
          toast('Carrier and tracking number are both required', 'error');
          return;
        }
        setSending(true);
        try {
          const result = await adminApi.ship(orderId, carrier.trim(), tracking.trim());
          toast(result.email ? `Shipped — emailed ${result.email.to}` : 'Shipped, but the email failed');
          onShipped();
        } catch (err) {
          onError(err, 'Could not mark this order shipped');
        } finally {
          setSending(false);
        }
      }}
      onClose={onClose}
    />
  );
}

function AddressEditor({ orderId, order, onSaved }: { orderId: string; order: Detail['order']; onSaved: () => void }) {
  const onError = useApiErrorHandler();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => ({ ...order.customer }));
  const [saving, setSaving] = useState(false);

  if (!open) {
    return (
      <button type="button" className="btn btn--sm btn--ghost" onClick={() => setOpen(true)}>
        Edit address
      </button>
    );
  }

  const field = (key: keyof typeof form, label: string) => (
    <label className="field">
      <span>{label}</span>
      <input value={form[key] ?? ''} onChange={e => setForm({ ...form, [key]: e.target.value })} />
    </label>
  );

  return (
    <ConfirmDialog
      title="Edit delivery address"
      body={
        <div className="formgrid">
          {field('name', 'Name')}
          {field('phone', 'Phone')}
          {field('address1', 'Address line 1')}
          {field('address2', 'Address line 2')}
          {field('city', 'City')}
          {field('state', 'State')}
          {field('postalCode', 'PIN code')}
          {field('country', 'Country')}
        </div>
      }
      confirmLabel="Save address"
      busy={saving}
      onConfirm={async () => {
        setSaving(true);
        try {
          await adminApi.updateAddress(orderId, form as unknown as Record<string, string>);
          toast('Address updated — the change is on the order timeline');
          setOpen(false);
          onSaved();
        } catch (err) {
          onError(err, 'Could not update the address');
        } finally {
          setSaving(false);
        }
      }}
      onClose={() => setOpen(false)}
    />
  );
}

function Tags({ orderId, tags, editable, onSaved }: { orderId: string; tags: string[]; editable: boolean; onSaved: () => void }) {
  const onError = useApiErrorHandler();
  const [value, setValue] = useState('');

  async function save(next: string[]) {
    try {
      await adminApi.setTags(orderId, next);
      onSaved();
    } catch (err) {
      onError(err, 'Could not update tags');
    }
  }

  return (
    <Panel title="Tags">
      <div className="tags">
        {tags.length === 0 && <span className="muted small">No tags</span>}
        {tags.map(tag => (
          <span key={tag} className="tag">
            {tag}
            {editable && (
              <button type="button" onClick={() => save(tags.filter(t => t !== tag))} aria-label={`Remove ${tag}`}>
                ×
              </button>
            )}
          </span>
        ))}
      </div>
      {editable && (
        <form
          className="tags__add"
          onSubmit={e => {
            e.preventDefault();
            const tag = value.trim().toLowerCase();
            if (!tag || tags.includes(tag)) return;
            setValue('');
            void save([...tags, tag]);
          }}
        >
          <input value={value} onChange={e => setValue(e.target.value)} placeholder="Add a tag" maxLength={40} />
          <button type="submit" className="btn btn--sm" disabled={!value.trim()}>
            Add
          </button>
        </form>
      )}
    </Panel>
  );
}

function NoteForm({ orderId, onSaved }: { orderId: string; onSaved: () => void }) {
  const onError = useApiErrorHandler();
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="noteform"
      onSubmit={async e => {
        e.preventDefault();
        if (!body.trim()) return;
        setSaving(true);
        try {
          await adminApi.addNote(orderId, body.trim());
          setBody('');
          onSaved();
        } catch (err) {
          onError(err, 'Could not save the note');
        } finally {
          setSaving(false);
        }
      }}
    >
      <textarea rows={2} value={body} onChange={e => setBody(e.target.value)} placeholder="Add an internal note…" maxLength={2000} />
      <button type="submit" className="btn btn--sm" disabled={saving || !body.trim()}>
        {saving ? 'Saving…' : 'Add note'}
      </button>
    </form>
  );
}
