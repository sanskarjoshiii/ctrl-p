import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { coverUrls, getTemplate } from '@shared/catalog';
import { formatMoney, SHIPPING } from '@shared/pricing';
import { BookMockup } from '../components/BookMockup';
import { IconCheck, Starburst } from '../components/Doodles';
import { LinkButton } from '../components/Kit';
import { api, type PublicOrder } from '../lib/api';
import { optionSummary } from './Cart';
import './commerce.css';

const STAGES = [
  { key: 'received', label: 'Order received' },
  { key: 'in_production', label: 'Printing & binding' },
  { key: 'shipped', label: 'On its way' },
  { key: 'delivered', label: 'Delivered' },
] as const;

export default function OrderPlaced() {
  const { orderId = '' } = useParams();
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getOrder(orderId).then(r => setOrder(r.order)).catch(e => setError(e.message));
  }, [orderId]);

  if (error) {
    return (
      <div className="cart-empty wrap">
        <p className="stamp" style={{ color: 'var(--coral)' }}>not found</p>
        <h1>We couldn’t load order {orderId}</h1>
        <p>{error}</p>
        <LinkButton to="/">Back home</LinkButton>
      </div>
    );
  }
  if (!order) return <div className="create__state" style={{ minHeight: '50vh' }}><span className="loader" aria-label="Loading order" /></div>;

  const stageIndex = Math.max(0, STAGES.findIndex(s => s.key === order.status));

  return (
    <div className="placed wrap">
      <div className="placed__hero">
        <Starburst className="placed__burst spin-slow" color="var(--yellow)" />
        <p className="stamp placed__stamp">order received</p>
        <h1>Yay, {order.customer.name.split(' ')[0]}! Your diary is off to print.</h1>
        <p className="placed__lede">
          Order <strong className="mono placed__id">{order.id}</strong> · confirmation sent to {order.customer.email}.
          {order.paymentMethod === 'cod' ? ' You’ll pay on delivery.' : order.paymentStatus === 'paid' ? ' Payment received.' : ''}
        </p>
      </div>

      <ol className="stages">
        {STAGES.map((s, i) => (
          <li key={s.key} className={i <= stageIndex && order.status !== 'awaiting_files' ? 'is-done' : ''}>
            <span className="stages__dot">{i <= stageIndex && order.status !== 'awaiting_files' ? <IconCheck width={14} /> : i + 1}</span>
            {s.label}
          </li>
        ))}
      </ol>

      <div className="placed__grid">
        <ul className="placed__items">
          {order.items.map(item => {
            const tpl = getTemplate(item.templateSlug);
            return (
              <li key={item.projectId + item.options.size} className="sketch">
                <BookMockup src={tpl?.hasCoverArt ? coverUrls(item.templateSlug).small : undefined} width={80} tilt={-20} spineColor={tpl?.coverColor} alt="" />
                <div>
                  <strong>{item.qty > 1 ? `${item.qty} × ` : ''}{item.title}</strong>
                  <span>{optionSummary(item)}</span>
                </div>
                <span className="placed__price">{formatMoney(item.unitPrice * item.qty)}</span>
              </li>
            );
          })}
        </ul>
        <aside className="summary sketch">
          <dl>
            <div><dt>Diaries</dt><dd>{formatMoney(order.totals.subtotal)}</dd></div>
            {order.totals.bundleDiscount > 0 && <div className="summary__saving"><dt>{order.totals.bundleLabel}</dt><dd>−{formatMoney(order.totals.bundleDiscount)}</dd></div>}
            {order.totals.promoDiscount > 0 && <div className="summary__saving"><dt>Code {order.totals.promoCode}</dt><dd>−{formatMoney(order.totals.promoDiscount)}</dd></div>}
            <div><dt>{SHIPPING[order.totals.shippingMethod].label} delivery</dt><dd>{order.totals.shipping ? formatMoney(order.totals.shipping) : 'Free'}</dd></div>
            <div className="summary__total"><dt>Total</dt><dd>{formatMoney(order.totals.total)}</dd></div>
          </dl>
          <p className="summary__note">Shipping to {order.customer.city}, {order.customer.state} · {SHIPPING[order.totals.shippingMethod].days}</p>
        </aside>
      </div>

      <div className="placed__actions">
        <LinkButton to="/templates" lines>Start another diary</LinkButton>
        <Link to="/diaries" className="text-link">View my diaries</Link>
      </div>
    </div>
  );
}
