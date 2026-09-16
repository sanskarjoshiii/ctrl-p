import { useState, type FormEvent, type InputHTMLAttributes } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { SHIPPING } from '@shared/pricing';
import type { CustomerDetails, PaymentMethod } from '@shared/types';
import { BookMockup } from '../components/BookMockup';
import { IconArrowLeft, IconCheck, PaperPlane } from '../components/Doodles';
import { innerPageCount } from '../editor/factory';
import { api, ApiError } from '../lib/api';
import { useCart } from '../store/cart';
import { useProjects } from '../store/projects';
import { toast } from '../store/toast';
import { CartTotals, itemCover, optionSummary } from './Cart';
import './commerce.css';

const SAVED_KEY = 'bd-customer';
const EMPTY: CustomerDetails = { name: '', email: '', phone: '', address1: '', address2: '', city: '', state: '', postalCode: '', country: 'India' };

function loadSaved(): CustomerDetails {
  try { return { ...EMPTY, ...JSON.parse(localStorage.getItem(SAVED_KEY) ?? '{}') }; } catch { return EMPTY; }
}

function validate(c: CustomerDetails) {
  const e: Partial<Record<keyof CustomerDetails, string>> = {};
  if (!c.name.trim()) e.name = 'Who should we deliver to?';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) e.email = 'Enter a valid email';
  if (c.phone.replace(/\D/g, '').length < 8) e.phone = 'Enter a phone number for the courier';
  if (!c.address1.trim()) e.address1 = 'Required';
  if (!c.city.trim()) e.city = 'Required';
  if (!c.state.trim()) e.state = 'Required';
  if (!/^[A-Za-z0-9 -]{3,12}$/.test(c.postalCode.trim())) e.postalCode = 'Enter a valid postal code';
  if (!c.country.trim()) e.country = 'Required';
  return e;
}

interface Progress { label: string; detail: string; fraction: number }

export default function Checkout() {
  const { items, shipping, promoCode, clear, update } = useCart();
  const loadProjectData = useProjects(s => s.loadProjectData);
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerDetails>(loadSaved);
  const [payment, setPayment] = useState<PaymentMethod>('online');
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerDetails, string>>>({});
  const [progress, setProgress] = useState<Progress | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  if (!items.length && !progress) return <Navigate to="/cart" replace />;

  const field = (key: keyof CustomerDetails, label: string, { className = '', ...props }: InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className={`field ${className}`}>
      <label className="field__label" htmlFor={`co-${key}`}>{label}</label>
      <input
        {...props}
        id={`co-${key}`}
        className="input"
        value={customer[key] ?? ''}
        aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? `co-${key}-error` : undefined}
        onChange={e => { setCustomer(c => ({ ...c, [key]: e.target.value })); if (errors[key]) setErrors(er => ({ ...er, [key]: undefined })); }}
      />
      {errors[key] && <span className="field__error" id={`co-${key}-error`}>{errors[key]}</span>}
    </div>
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validate(customer);
    setErrors(found);
    if (Object.keys(found).length) {
      document.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    setFailure(null);
    try {
      // Make sure every diary is still here and the cart reflects its current page count.
      setProgress({ label: 'Checking your diaries', detail: '', fraction: 0 });
      const projects = [];
      let changed = false;
      for (const item of items) {
        const project = await loadProjectData(item.projectId);
        if (!project) throw new Error(`“${item.title}” isn’t saved on this device any more.`);
        const pages = innerPageCount(project);
        if (pages !== item.pages) { update(item.id, { pages }); changed = true; }
        projects.push(project);
      }
      if (changed) {
        setProgress(null);
        toast('A diary’s page count changed since you added it — we updated your total. Please review and place the order again.', 'error');
        return;
      }

      localStorage.setItem(SAVED_KEY, JSON.stringify(customer));
      setProgress({ label: 'Creating your order', detail: '', fraction: 0.02 });
      const { order, uploads } = await api.createOrder({
        customer, shipping, promoCode: promoCode || undefined, paymentMethod: payment,
        items: items.map(i => ({ projectId: i.projectId, title: i.title, templateSlug: i.templateSlug, pages: i.pages, qty: i.qty, options: i.options })),
      });

      const { printPixelRatio, renderProjectPages } = await import('../lib/renderPage');
      for (let i = 0; i < items.length; i++) {
        const project = projects[i];
        const base = i / items.length, span = 1 / items.length;
        const blobs = await renderProjectPages(project, { pixelRatio: printPixelRatio(items[i].options.size), variant: 'original', quality: 0.92 }, (done, total) =>
          setProgress({ label: `Preparing print files · ${items[i].title}`, detail: `page ${done} of ${total}`, fraction: base + span * 0.6 * (done / total) }),
        );
        await api.uploadPages(uploads[i].url, blobs, JSON.stringify(project), f =>
          setProgress({ label: `Uploading · ${items[i].title}`, detail: `${Math.round(f * 100)}%`, fraction: base + span * (0.6 + 0.4 * f) }),
        );
      }

      if (payment === 'online') {
        setProgress({ label: 'Confirming payment', detail: '', fraction: 1 });
        await api.pay(order.id);
      }
      clear();
      navigate(`/order/${order.id}`, { replace: true });
    } catch (err) {
      setProgress(null);
      if (err instanceof ApiError && err.fields) {
        const mapped: Partial<Record<keyof CustomerDetails, string>> = {};
        for (const [k, v] of Object.entries(err.fields)) if (k.startsWith('customer.')) mapped[k.slice(9) as keyof CustomerDetails] = v;
        setErrors(mapped);
      }
      setFailure(err instanceof Error ? err.message : 'Something went wrong. Your diaries are safe — please try again.');
    }
  };

  return (
    <div className="checkout wrap">
      <Link to="/cart" className="detail__back"><IconArrowLeft width={20} /> Back to cart</Link>
      <h1 className="checkout__title">Almost there <span className="hand">✎</span></h1>

      <form className="checkout__grid" onSubmit={submit} noValidate>
        <div className="checkout__form">
          <fieldset className="checkout__block sketch sketch--flat">
            <legend>Contact</legend>
            <div className="form-grid">
              {field('name', 'Full name', { autoComplete: 'name', className: 'form-grid__full' })}
              {field('email', 'Email', { type: 'email', autoComplete: 'email' })}
              {field('phone', 'Phone', { type: 'tel', autoComplete: 'tel' })}
            </div>
          </fieldset>

          <fieldset className="checkout__block sketch sketch--flat">
            <legend>Delivery address</legend>
            <div className="form-grid">
              {field('address1', 'Address', { autoComplete: 'address-line1', className: 'form-grid__full' })}
              {field('address2', 'Apartment, landmark (optional)', { autoComplete: 'address-line2', className: 'form-grid__full' })}
              {field('city', 'City', { autoComplete: 'address-level2' })}
              {field('state', 'State', { autoComplete: 'address-level1' })}
              {field('postalCode', 'PIN / postal code', { autoComplete: 'postal-code', inputMode: 'numeric' })}
              {field('country', 'Country', { autoComplete: 'country-name' })}
            </div>
          </fieldset>

          <fieldset className="checkout__block sketch sketch--flat">
            <legend>Payment</legend>
            <div className="pay-choice">
              <label className={payment === 'online' ? 'is-on' : ''}>
                <input type="radio" name="payment" checked={payment === 'online'} onChange={() => setPayment('online')} />
                <span className="pay-choice__check"><IconCheck width={14} /></span>
                <span><strong>Pay online</strong><span>UPI, cards & net banking</span></span>
              </label>
              <label className={payment === 'cod' ? 'is-on' : ''}>
                <input type="radio" name="payment" checked={payment === 'cod'} onChange={() => setPayment('cod')} />
                <span className="pay-choice__check"><IconCheck width={14} /></span>
                <span><strong>Cash on delivery</strong><span>Pay when your diary arrives</span></span>
              </label>
            </div>
            {payment === 'online' && <p className="checkout__demo mono">demo mode — no payment gateway connected yet</p>}
          </fieldset>
        </div>

        <aside className="summary sketch checkout__summary">
          <h2>Your order</h2>
          <ul className="mini-items">
            {items.map(item => (
              <li key={item.id}>
                <BookMockup src={itemCover(item)} width={54} tilt={-18} alt="" />
                <div><strong>{item.qty > 1 ? `${item.qty} × ` : ''}{item.title}</strong><span>{optionSummary(item)}</span></div>
              </li>
            ))}
          </ul>
          <CartTotals />
          <p className="summary__note">{SHIPPING[shipping].label} delivery · {SHIPPING[shipping].days}</p>
          {failure && <p className="checkout__failure" role="alert">{failure}</p>}
          <button type="submit" className="btn btn--lg btn--block" disabled={Boolean(progress)}>{payment === 'cod' ? 'Place order' : 'Pay & place order'}</button>
          <p className="checkout__fine">By placing your order you confirm your pages are ready to print.</p>
        </aside>
      </form>

      {progress && (
        <div className="print-overlay" role="dialog" aria-modal="true" aria-label="Placing your order">
          <div className="print-overlay__card sketch">
            <PaperPlane className="print-overlay__plane" />
            <h2>{progress.label}</h2>
            <p>{progress.detail || 'hang tight…'}</p>
            <div className="progress progress--lg"><span style={{ width: `${Math.max(3, progress.fraction * 100)}%` }} /></div>
            <p className="print-overlay__hint">Please keep this tab open — we’re preparing full-resolution pages for print.</p>
          </div>
        </div>
      )}
    </div>
  );
}
