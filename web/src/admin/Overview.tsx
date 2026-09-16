import { useState } from 'react';
import { Link } from 'react-router';
import { ORDER_STATUS_LABELS } from '@shared/admin';
import { BINDINGS, PAPERS, SIZES } from '@shared/pricing';
import type { OrderStatus } from '@shared/types';
import { adminApi, type Stats } from './api';
import { useApiErrorHandler } from './AdminApp';
import { ErrorNote, Panel, Skeleton, formatMoney, relativeTime } from './ui';
import { useResource } from './useResource';

const RANGES = [
  { days: 1, label: 'Today' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
];

const pct = (current: number, previous: number) => {
  if (!previous) return current ? null : 0;
  return ((current - previous) / previous) * 100;
};

function Kpi({ label, value, current, previous }: { label: string; value: string; current: number; previous: number }) {
  const change = pct(current, previous);
  return (
    <div className="kpi">
      <span className="kpi__label">{label}</span>
      <strong className="kpi__value">{value}</strong>
      {change === null ? (
        <span className="kpi__delta kpi__delta--flat">new</span>
      ) : (
        <span className={`kpi__delta kpi__delta--${change > 0 ? 'up' : change < 0 ? 'down' : 'flat'}`}>
          {change > 0 ? '▲' : change < 0 ? '▼' : '■'} {Math.abs(change).toFixed(0)}% vs previous
        </span>
      )}
    </div>
  );
}

/** Orders and revenue per day. Bars rather than a chart library — two series, 30 points. */
function DailyChart({ series }: { series: Stats['series'] }) {
  const peak = Math.max(1, ...series.map(d => d.revenue));
  return (
    <div className="chart" role="img" aria-label={`Orders and revenue for the last ${series.length} days`}>
      {series.map(day => (
        <div key={day.date} className="chart__col" title={`${day.date}: ${day.orders} order(s), ${formatMoney(day.revenue)}`}>
          <div className="chart__bar" style={{ height: `${(day.revenue / peak) * 100}%` }} />
          {day.orders > 0 && <span className="chart__count">{day.orders}</span>}
        </div>
      ))}
    </div>
  );
}

function Mix({ title, data, labels }: { title: string; data: Record<string, number>; labels?: Record<string, string> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((n, [, v]) => n + v, 0);
  if (!total) return null;
  return (
    <div className="mix">
      <h4>{title}</h4>
      {entries.map(([key, value]) => (
        <div key={key} className="mix__row">
          <span className="mix__label">{labels?.[key] ?? key}</span>
          <span className="mix__track">
            <span className="mix__fill" style={{ width: `${(value / total) * 100}%` }} />
          </span>
          <span className="mix__value">{value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Overview() {
  const [days, setDays] = useState(30);
  const onError = useApiErrorHandler();
  const { data: stats, error, reload } = useResource(
    () => adminApi.stats(days),
    String(days),
    err => onError(err, 'Could not load the dashboard'),
  );

  if (error) return <ErrorNote error={error} retry={reload} />;
  if (!stats) return <Skeleton rows={8} />;

  const { current, previous } = stats.kpis;
  const attention = stats.queues.filter(q => q.count > 0);

  return (
    <div className="stack">
      <div className="pagehead">
        <h1>Overview</h1>
        <div className="segmented">
          {RANGES.map(r => (
            <button key={r.days} type="button" className={days === r.days ? 'is-on' : ''} onClick={() => setDays(r.days)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="kpis">
        <Kpi label="Orders" value={String(current.orders)} current={current.orders} previous={previous.orders} />
        <Kpi label="Net revenue" value={formatMoney(current.netRevenue)} current={current.netRevenue} previous={previous.netRevenue} />
        <Kpi label="Shipping collected" value={formatMoney(current.shippingCollected)} current={current.shippingCollected} previous={previous.shippingCollected} />
        <Kpi label="Average order" value={formatMoney(current.averageOrderValue)} current={current.averageOrderValue} previous={previous.averageOrderValue} />
        <Kpi label="Books sold" value={String(current.booksSold)} current={current.booksSold} previous={previous.booksSold} />
        <Kpi label="Pages printed" value={current.pagesPrinted.toLocaleString('en-IN')} current={current.pagesPrinted} previous={previous.pagesPrinted} />
        <Kpi label="COD share" value={`${Math.round(current.codShare * 100)}%`} current={current.codShare} previous={previous.codShare} />
      </div>

      <Panel title="Needs attention">
        {attention.length === 0 ? (
          <p className="allclear">Nothing is waiting on you. Every order is on track.</p>
        ) : (
          <div className="queues">
            {attention.map(queue => (
              <Link key={queue.key} to={`/admin/orders?${queue.filter}`} className="queue">
                <strong>{queue.count}</strong>
                <span>{queue.label}</span>
              </Link>
            ))}
          </div>
        )}
      </Panel>

      <div className="grid grid--2">
        <Panel title={`Orders & revenue · last ${stats.series.length} days`}>
          <DailyChart series={stats.series} />
        </Panel>

        <Panel title="Where orders are">
          <div className="funnel">
            {Object.entries(stats.funnel).length === 0 && <p className="empty">No orders yet.</p>}
            {Object.entries(stats.funnel)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => (
                <Link key={status} to={`/admin/orders?status=${status}`} className="funnel__row">
                  <span>{ORDER_STATUS_LABELS[status as OrderStatus] ?? status}</span>
                  <strong>{count}</strong>
                </Link>
              ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid--2">
        <Panel title="Product mix">
          <Mix title="Size" data={stats.mix.size} labels={Object.fromEntries(Object.entries(SIZES).map(([k, v]) => [k, v.label]))} />
          <Mix title="Binding" data={stats.mix.binding} labels={Object.fromEntries(Object.entries(BINDINGS).map(([k, v]) => [k, v.label]))} />
          <Mix title="Paper" data={stats.mix.paper} labels={Object.fromEntries(Object.entries(PAPERS).map(([k, v]) => [k, v.label]))} />
          <Mix title="Top templates" data={stats.mix.template} />
        </Panel>

        <Panel title="Recent activity">
          {stats.activity.length === 0 ? (
            <p className="empty">Nothing has happened yet.</p>
          ) : (
            <ul className="feed">
              {stats.activity.map(event => (
                <li key={event.id}>
                  <span className="feed__when">{relativeTime(event.createdAt)}</span>
                  <span className="feed__what">
                    {event.orderId !== '-' ? <Link to={`/admin/orders/${event.orderId}`}>{event.orderId}</Link> : <span className="mono">export</span>}{' '}
                    {describe(event.type)}
                    {event.note ? ` — ${event.note}` : ''}
                  </span>
                  <span className="feed__who">{event.actorName ?? event.actorType}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <p className="muted small">
        Print jobs: {Object.entries(stats.printJobs).map(([k, v]) => `${v} ${k}`).join(' · ') || 'none yet'}. Emails are going to the{' '}
        <strong>{stats.emailTransport}</strong> transport.
      </p>
    </div>
  );
}

function describe(type: string) {
  switch (type) {
    case 'created':
      return 'was placed';
    case 'files_received':
      return 'uploaded files';
    case 'status_changed':
      return 'changed status';
    case 'payment_changed':
      return 'payment updated';
    case 'print_file':
      return 'print file';
    case 'note_added':
      return 'got a note';
    case 'tags_changed':
      return 'tags changed';
    case 'address_changed':
      return 'address edited';
    case 'email_sent':
      return 'email sent';
    case 'file_downloaded':
      return 'files accessed';
    case 'shipment_created':
      return 'was shipped';
    default:
      return type;
  }
}
