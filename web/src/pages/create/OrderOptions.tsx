import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { coverUrls, getTemplate } from '@shared/catalog';
import { BINDINGS, BUNDLE_TIERS, bookPrice, formatMoney, GIFT_BOX_PRICE, PAPERS, SIZES, type BindingKey, type BookOptions, type PaperKey, type SizeKey } from '@shared/pricing';
import { BookMockup } from '../../components/BookMockup';
import { IconArrowLeft, IconCheck, IconGift, IconMinus, IconPlus, IconWarning } from '../../components/Doodles';
import { innerPageCount } from '../../editor/factory';
import { preflight } from '../../editor/preflight';
import { pagePreviewUrl } from '../../lib/previewCache';
import { blobToDataUrl, renderPage } from '../../lib/renderPage';
import { useCart } from '../../store/cart';
import { useProjects } from '../../store/projects';
import { toast } from '../../store/toast';
import '../commerce.css';
import './order.css';

function OptionCards<K extends string>({ name, value, options, onChange }: { name: string; value: K; options: Record<K, { label: string; note?: string; dims?: string; add?: number; base?: number }>; onChange: (k: K) => void }) {
  return (
    <div className="opt-cards" role="radiogroup" aria-label={name}>
      {(Object.keys(options) as K[]).map(key => {
        const o = options[key];
        const price = o.base !== undefined ? `from ${formatMoney(o.base)}` : o.add ? `+ ${formatMoney(o.add)}` : 'included';
        return (
          <label key={key} className={`opt-card ${value === key ? 'is-on' : ''}`}>
            <input type="radio" name={name} value={key} checked={value === key} onChange={() => onChange(key)} />
            <span className="opt-card__check" aria-hidden><IconCheck width={14} /></span>
            <strong>{o.label}</strong>
            <span className="opt-card__note">{o.dims ?? o.note}</span>
            <span className="opt-card__price">{price}</span>
          </label>
        );
      })}
    </div>
  );
}

export default function OrderOptions() {
  const project = useProjects(s => s.project)!;
  const photos = useProjects(s => s.photos);
  const edit = useProjects(s => s.edit);
  const addToCart = useCart(s => s.add);
  const navigate = useNavigate();
  const tpl = getTemplate(project.templateSlug) ?? getTemplate('blank')!;
  const [options, setOptions] = useState<BookOptions>(project.options);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | undefined>(tpl.hasCoverArt && !project.pages[0].elements.length ? coverUrls(tpl.slug).medium : undefined);

  const pages = innerPageCount(project);
  const price = bookPrice(options, pages);
  const checks = useMemo(() => preflight(project, photos, options.size), [project, photos, options.size]);
  const blocking = checks.some(c => c.level === 'error');

  useEffect(() => {
    if (coverUrl) return;
    let alive = true;
    pagePreviewUrl(project.pages[0], 0.5).then(url => alive && setCoverUrl(url)).catch(() => undefined);
    return () => { alive = false; };
  }, [project.pages, coverUrl]);

  const set = <K extends keyof BookOptions>(key: K, value: BookOptions[K]) => {
    const next = { ...options, [key]: value };
    setOptions(next);
    edit(d => { d.options = next; }, { history: false });
  };

  const add = async () => {
    setBusy(true);
    try {
      let coverThumb: string | undefined;
      if (!tpl.hasCoverArt || project.pages[0].elements.length) {
        coverThumb = await blobToDataUrl(await renderPage(project.pages[0], { pixelRatio: 0.34, variant: 'preview', quality: 0.8 }));
      }
      addToCart({ projectId: project.id, title: project.title, templateSlug: project.templateSlug, pages, options, qty, coverThumb });
      toast(`${project.title} added to your cart`);
      navigate('/cart');
    } catch {
      toast('Couldn’t add to cart — please try again', 'error');
      setBusy(false);
    }
  };

  return (
    <div className="order wrap">
      <Link to="../preview" relative="path" className="detail__back"><IconArrowLeft width={20} /> Back to preview</Link>
      <div className="order__grid">
        <div className="order__visual" style={{ background: tpl.palette.accent2 }}>
          <BookMockup src={coverUrl} width="min(58%, 320px)" tilt={-26} spineColor={tpl.coverColor} alt={`${project.title} cover`}>
            {!coverUrl && <span className="leaf__loading" />}
          </BookMockup>
          <p className="order__size-tag mono">{SIZES[options.size].label} · {SIZES[options.size].dims}</p>
        </div>

        <div className="order__form">
          <p className="mono upload__eyebrow">step 5 · make it yours</p>
          <h1>Choose your finish</h1>

          <section className="order__block">
            <h2>Size</h2>
            <OptionCards<SizeKey> name="Size" value={options.size} options={SIZES} onChange={v => set('size', v)} />
          </section>
          <section className="order__block">
            <h2>Binding</h2>
            <OptionCards<BindingKey> name="Binding" value={options.binding} options={BINDINGS} onChange={v => set('binding', v)} />
          </section>
          <section className="order__block">
            <h2>Paper</h2>
            <OptionCards<PaperKey> name="Paper" value={options.paper} options={PAPERS} onChange={v => set('paper', v)} />
          </section>

          <section className="order__block order__row">
            <label className="toggle">
              <input type="checkbox" checked={options.giftBox} onChange={e => set('giftBox', e.target.checked)} />
              <span className="toggle__box" aria-hidden><IconCheck width={16} /></span>
              <IconGift width={24} />
              <span><strong>Gift box</strong> — keepsake box with ribbon (+{formatMoney(GIFT_BOX_PRICE)})</span>
            </label>
            <div className="stepper" role="group" aria-label="Quantity">
              <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Fewer copies"><IconMinus width={16} /></button>
              <output aria-live="polite">{qty}</output>
              <button type="button" onClick={() => setQty(q => Math.min(20, q + 1))} disabled={qty >= 20} aria-label="More copies"><IconPlus width={16} /></button>
            </div>
          </section>

          <section className="order__block">
            <h2>Print check</h2>
            <ul className="checks">
              {checks.map(c => (
                <li key={c.title} className={`check check--${c.level}`}>
                  <span className="check__icon">{c.level === 'ok' ? <IconCheck width={14} /> : <IconWarning width={14} />}</span>
                  <div>
                    <strong>{c.title}</strong>
                    {c.detail && <p>{c.detail}{c.pages?.length ? ` Pages: ${c.pages.slice(0, 8).map(p => (p === 0 ? 'cover' : p)).join(', ')}${c.pages.length > 8 ? '…' : ''}` : ''}</p>}
                  </div>
                </li>
              ))}
            </ul>
            {checks.some(c => c.level !== 'ok') && <Link to="../design" relative="path" className="text-link">Fix in the editor</Link>}
          </section>

          <div className="summary sketch">
            <dl>
              <div><dt>{SIZES[options.size].label} diary, {price.pages} pages</dt><dd>{formatMoney(price.base)}</dd></div>
              {price.extraPages > 0 && <div><dt>{price.extraPages} extra pages × {formatMoney(SIZES[options.size].perPage)}</dt><dd>{formatMoney(price.extraPagesCost)}</dd></div>}
              {price.binding > 0 && <div><dt>{BINDINGS[options.binding].label} binding</dt><dd>{formatMoney(price.binding)}</dd></div>}
              {price.paper > 0 && <div><dt>{PAPERS[options.paper].label} paper</dt><dd>{formatMoney(price.paper)}</dd></div>}
              {price.giftBox > 0 && <div><dt>Gift box</dt><dd>{formatMoney(price.giftBox)}</dd></div>}
              <div className="summary__total"><dt>{qty > 1 ? `${qty} copies` : 'Total'}</dt><dd>{formatMoney(price.unit * qty)}</dd></div>
            </dl>
            <p className="summary__note">{qty >= BUNDLE_TIERS[1].minBooks ? `Bundle discount applied in cart (${BUNDLE_TIERS.find(t => qty >= t.minBooks)?.label}).` : 'Order 2 diaries and save 10% · 3+ save 15%'}</p>
            <button type="button" className="btn btn--lg btn--block" onClick={add} disabled={busy || blocking} aria-busy={busy}>{busy ? 'Adding…' : 'Add to cart'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
