import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from '@shared/admin';
import { SIZES } from '@shared/pricing';
import { TEMPLATES } from '@shared/catalog';
import type { OrderStatus } from '@shared/types';
import { adminApi, type OrderListResponse } from './api';
import { useApiErrorHandler } from './AdminApp';
import { CopyButton, ErrorNote, PaymentBadge, Skeleton, StatusBadge, formatDate, formatMoney, relativeTime } from './ui';
import { useResource } from './useResource';

/** Saved views from issue #2 — one click to the list ops actually work from. */
const SAVED_VIEWS = [
  { label: 'To review', query: 'status=received' },
  { label: 'Ready to print', query: 'status=ready_to_print' },
  { label: 'In production', query: 'status=printing,binding,quality_check' },
  { label: 'To dispatch', query: 'status=packed' },
  { label: 'Express', query: 'shipping=express' },
  { label: 'COD to confirm', query: 'paymentStatus=cod' },
  { label: 'Late', query: 'late=1' },
  { label: 'On hold', query: 'status=on_hold' },
];

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'total', label: 'Highest total' },
  { value: 'ship_by', label: 'Ship by' },
];

export default function Orders() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const onError = useApiErrorHandler();

  const query = params.toString();
  const { data, error, reload } = useResource<OrderListResponse>(
    () => adminApi.orders(query),
    query,
    err => onError(err, 'Could not load orders'),
  );

  // Every filter lives in the URL, so a view can be pasted into chat.
  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    if (!('page' in patch)) next.delete('page');
    setParams(next, { replace: true });
  }

  const statusFilter = useMemo(() => (params.get('status') ?? '').split(',').filter(Boolean), [params]);
  const activeFilters = [...params.keys()].filter(k => k !== 'page' && k !== 'sort').length;

  function toggleStatus(status: OrderStatus) {
    const next = statusFilter.includes(status) ? statusFilter.filter(s => s !== status) : [...statusFilter, status];
    update({ status: next.join(',') });
  }

  return (
    <div className="stack">
      <div className="pagehead">
        <h1>Orders {data && <span className="muted">· {data.total.toLocaleString('en-IN')}</span>}</h1>
        <a className="btn btn--ghost btn--sm" href={adminApi.csvUrl(query)}>
          Export CSV
        </a>
      </div>

      <div className="views">
        {SAVED_VIEWS.map(view => (
          <button
            key={view.label}
            type="button"
            className={query === view.query ? 'chip is-on' : 'chip'}
            onClick={() => setParams(new URLSearchParams(view.query), { replace: true })}
          >
            {view.label}
          </button>
        ))}
        {activeFilters > 0 && (
          <button type="button" className="chip chip--clear" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
            Clear filters
          </button>
        )}
      </div>

      <div className="filters">
        <form
          className="filters__search"
          onSubmit={e => {
            e.preventDefault();
            update({ q: search.trim() || null });
          }}
        >
          <input
            type="search"
            placeholder="Order ID, name, email, phone or PIN code"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search orders"
          />
          <button type="submit" className="btn btn--sm">
            Search
          </button>
        </form>

        <label className="field field--inline">
          <span>Template</span>
          <select value={params.get('template') ?? ''} onChange={e => update({ template: e.target.value || null })}>
            <option value="">Any</option>
            {TEMPLATES.map(t => (
              <option key={t.slug} value={t.slug}>
                {t.country}
              </option>
            ))}
          </select>
        </label>

        <label className="field field--inline">
          <span>Size</span>
          <select value={params.get('size') ?? ''} onChange={e => update({ size: e.target.value || null })}>
            <option value="">Any</option>
            {Object.entries(SIZES).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field field--inline">
          <span>Sort</span>
          <select value={params.get('sort') ?? 'newest'} onChange={e => update({ sort: e.target.value })}>
            {SORTS.map(s => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field field--inline field--check">
          <input type="checkbox" checked={params.get('late') === '1'} onChange={e => update({ late: e.target.checked ? '1' : null })} />
          <span>Late only</span>
        </label>
      </div>

      <div className="statusbar">
        {ORDER_STATUSES.map(status => (
          <button
            key={status}
            type="button"
            className={statusFilter.includes(status) ? 'chip chip--sm is-on' : 'chip chip--sm'}
            onClick={() => toggleStatus(status)}
          >
            {ORDER_STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorNote error={error} retry={reload} />
      ) : !data ? (
        <Skeleton rows={8} />
      ) : data.orders.length === 0 ? (
        <p className="empty">No orders match these filters.</p>
      ) : (
        <>
          <div className="tablewrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Placed</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th className="num">Total</th>
                  <th>Payment</th>
                  <th>Fulfilment</th>
                  <th>Check</th>
                  <th>Ship by</th>
                  <th>Tags</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map(order => (
                  <tr key={order.id}>
                    <td className="mono">
                      <Link to={`/admin/orders/${order.id}`}>{order.id}</Link>
                      <CopyButton value={order.id} label="⧉" />
                    </td>
                    <td title={formatDate(order.createdAt)}>{relativeTime(order.createdAt)}</td>
                    <td>
                      {order.customerName}
                      <span className="muted small"> · {order.city}</span>
                    </td>
                    <td>
                      {order.diaries} {order.diaries === 1 ? 'diary' : 'diaries'} · {order.books} {order.books === 1 ? 'copy' : 'copies'}
                    </td>
                    <td className="num">{formatMoney(order.total)}</td>
                    <td>
                      <PaymentBadge status={order.paymentStatus} />
                    </td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td>{order.warnings ? <span className="warn">⚠ {order.warnings}</span> : <span className="ok">✓</span>}</td>
                    <td className={order.late ? 'late' : ''}>{formatDate(order.shipBy)}</td>
                    <td>
                      {order.tags.map(tag => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.pages > 1 && (
            <div className="pager">
              <button type="button" className="btn btn--sm" disabled={data.page <= 1} onClick={() => update({ page: String(data.page - 1) })}>
                Previous
              </button>
              <span className="muted">
                Page {data.page} of {data.pages}
              </span>
              <button type="button" className="btn btn--sm" disabled={data.page >= data.pages} onClick={() => update({ page: String(data.page + 1) })}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
