import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { coverUrls, getTemplate } from '@shared/catalog';
import { BINDINGS, bookPrice, formatMoney, PAPERS, SHIPPING, SIZES, type ShippingKey } from '@shared/pricing';
import { BookMockup } from '../components/BookMockup';
import { IconArrowRight, IconMinus, IconPlus, IconTrash, LoopArrowDown, Starburst } from '../components/Doodles';
import { DoodleHeading, LinkButton } from '../components/Kit';
import { useCart, useCartTotals, type CartItem } from '../store/cart';
import { useProjects } from '../store/projects';
import './commerce.css';

export function CartTotals({ compact = false }: { compact?: boolean }) {
  const totals = useCartTotals();
  return (
    <dl>
      <div><dt>{totals.books} diar{totals.books === 1 ? 'y' : 'ies'}</dt><dd>{formatMoney(totals.subtotal)}</dd></div>
      {totals.bundleDiscount > 0 && <div className="summary__saving"><dt>{totals.bundleLabel}</dt><dd>−{formatMoney(totals.bundleDiscount)}</dd></div>}
      {totals.promoDiscount > 0 && <div className="summary__saving"><dt>Code {totals.promoCode}</dt><dd>−{formatMoney(totals.promoDiscount)}</dd></div>}
      <div><dt>{SHIPPING[totals.shippingMethod].label} delivery</dt><dd>{totals.shipping ? formatMoney(totals.shipping) : 'Free'}</dd></div>
      <div className="summary__total"><dt>Total{compact ? '' : ' (incl. taxes)'}</dt><dd>{formatMoney(totals.total)}</dd></div>
    </dl>
  );
}

export const optionSummary = (item: Pick<CartItem, 'options' | 'pages'>) =>
  [`${SIZES[item.options.size].label} ${SIZES[item.options.size].dims}`, BINDINGS[item.options.binding].label, `${PAPERS[item.options.paper].label} paper`, `${item.pages} pages`, item.options.giftBox && 'gift box'].filter(Boolean).join(' · ');

export const itemCover = (item: CartItem) => item.coverThumb ?? (getTemplate(item.templateSlug)?.hasCoverArt ? coverUrls(item.templateSlug).small : undefined);

function CartRow({ item }: { item: CartItem }) {
  const { update, remove } = useCart.getState();
  const exists = useProjects(s => s.metas.some(m => m.id === item.projectId));
  const tpl = getTemplate(item.templateSlug);
  const unit = bookPrice(item.options, item.pages).unit;
  return (
    <li className="cart-row sketch">
      <BookMockup src={itemCover(item)} width={92} tilt={-20} spineColor={tpl?.coverColor} alt="">
        <span className="cart-row__blank" />
      </BookMockup>
      <div className="cart-row__info">
        <h2>{item.title}</h2>
        <p>{optionSummary(item)}</p>
        {!exists && <p className="cart-row__warn">This diary isn’t saved on this device any more — it can’t be printed.</p>}
        <div className="cart-row__links">
          {exists && <Link to={`/create/${item.projectId}/design`} className="text-link">Edit design</Link>}
          {exists && <Link to={`/create/${item.projectId}/order`} className="text-link">Change options</Link>}
          <button type="button" className="cart-row__remove" onClick={() => remove(item.id)}><IconTrash width={16} /> Remove</button>
        </div>
      </div>
      <div className="cart-row__qty">
        <div className="stepper" role="group" aria-label={`Quantity of ${item.title}`}>
          <button type="button" onClick={() => update(item.id, { qty: item.qty - 1 })} disabled={item.qty <= 1} aria-label="Fewer copies"><IconMinus width={16} /></button>
          <output>{item.qty}</output>
          <button type="button" onClick={() => update(item.id, { qty: item.qty + 1 })} disabled={item.qty >= 20} aria-label="More copies"><IconPlus width={16} /></button>
        </div>
        <p className="cart-row__price"><strong>{formatMoney(unit * item.qty)}</strong>{item.qty > 1 && <span>{formatMoney(unit)} each</span>}</p>
      </div>
    </li>
  );
}

export default function Cart() {
  const { items, promoCode, shipping, setPromo, setShipping } = useCart();
  const totals = useCartTotals();
  const metas = useProjects(s => s.metas);
  const navigate = useNavigate();
  const [code, setCode] = useState(promoCode);
  const printable = items.every(i => metas.some(m => m.id === i.projectId));

  if (!items.length) {
    return (
      <div className="cart-empty wrap">
        <Starburst width={110} />
        <DoodleHeading as="h1">Your cart is empty</DoodleHeading>
        <p>Finished a diary? Add it from the order step. Or start a new one — it only takes a few minutes.</p>
        <LoopArrowDown width={40} />
        <LinkButton to="/templates" lines>Browse covers</LinkButton>
      </div>
    );
  }

  return (
    <div className="cart wrap">
      <DoodleHeading as="h1">Your cart</DoodleHeading>
      <div className="cart__grid">
        <ul className="cart__list">{items.map(item => <CartRow key={item.id} item={item} />)}</ul>

        <aside className="summary sketch cart__summary">
          <h2>Order summary</h2>
          <fieldset className="ship-choice">
            <legend>Delivery</legend>
            {(Object.keys(SHIPPING) as ShippingKey[]).map(key => (
              <label key={key} className={shipping === key ? 'is-on' : ''}>
                <input type="radio" name="shipping" checked={shipping === key} onChange={() => setShipping(key)} />
                <span><strong>{SHIPPING[key].label}</strong> {SHIPPING[key].days}</span>
                <span>{Number.isFinite(SHIPPING[key].freeOver) ? `free over ${formatMoney(SHIPPING[key].freeOver)}` : formatMoney(SHIPPING[key].price)}</span>
              </label>
            ))}
          </fieldset>
          <form className="promo" onSubmit={e => { e.preventDefault(); setPromo(code.trim().toUpperCase()); }}>
            <label className="visually-hidden" htmlFor="promo">Promo code</label>
            <input id="promo" className="input input--sm" placeholder="Promo code" value={code} onChange={e => setCode(e.target.value)} />
            <button type="submit" className="btn btn--sm btn--white">Apply</button>
          </form>
          {totals.promoValid === false && <p className="field__error">That code isn’t valid.</p>}
          {totals.promoValid && <p className="promo__ok">{totals.promoLabel} ✓</p>}
          <CartTotals />
          {!totals.bundleDiscount && <p className="summary__note">Add a second diary to save 10% · 3+ save 15%</p>}
          <button type="button" className="btn btn--lg btn--block" disabled={!printable} onClick={() => navigate('/checkout')}>
            Checkout <IconArrowRight width={20} />
          </button>
          {!printable && <p className="field__error">Remove diaries that are no longer on this device to continue.</p>}
          <Link to="/templates" className="cart__more text-link">+ start another diary</Link>
        </aside>
      </div>
    </div>
  );
}
