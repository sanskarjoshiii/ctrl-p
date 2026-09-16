import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { coverUrls, getTemplate, TEMPLATES } from '@shared/catalog';
import { BINDINGS, BUNDLE_TIERS, formatMoney, PAGE_RULES, PAPERS, SHIPPING, SIZES } from '@shared/pricing';
import { BookMockup } from '../components/BookMockup';
import { CurlyArrow, IconArrowLeft, IconCheck, Sparkle, Starburst } from '../components/Doodles';
import { Button, SketchFrame } from '../components/Kit';
import { useProjects } from '../store/projects';
import { toast } from '../store/toast';
import NotFound from './NotFound';
import './TemplateDetail.css';

const INCLUDED = [
  `${PAGE_RULES.included} printed pages, add more up to ${PAGE_RULES.max}`,
  'Front & back cover with your chosen design',
  '17 collage layouts, 11 photo frames, stickers & fonts',
  'Autosaved drafts — finish whenever you like',
];

export default function TemplateDetail() {
  const { slug = '' } = useParams();
  const tpl = getTemplate(slug);
  const navigate = useNavigate();
  const createProject = useProjects(s => s.createProject);
  const [busy, setBusy] = useState(false);

  if (!tpl) return <NotFound />;

  const start = async () => {
    setBusy(true);
    try {
      const id = await createProject(tpl.slug);
      navigate(`/create/${id}/photos`);
    } catch {
      toast('Couldn’t create your diary — is storage available in this browser?', 'error');
      setBusy(false);
    }
  };

  const others = TEMPLATES.filter(t => t.hasCoverArt && t.slug !== tpl.slug).slice(0, 4);

  return (
    <div className="detail wrap">
      <Link to="/templates" className="detail__back"><IconArrowLeft width={20} /> All covers</Link>

      <div className="detail__grid">
        <div className="detail__visual" style={{ background: tpl.palette.accent2 }}>
          <Starburst className="detail__burst float" color="var(--white)" />
          {tpl.hasCoverArt ? (
            <BookMockup src={coverUrls(tpl.slug).medium} width="min(62%, 360px)" tilt={-24} spineColor={tpl.coverColor} alt={`${tpl.country} diary cover`} />
          ) : (
            <BookMockup width="min(62%, 360px)" tilt={-24} spineColor="#f1ecd6">
              <div className="detail__blank grid-paper">
                <span className="detail__blank-title">My Travel<br />Diary</span>
                <span className="detail__blank-bar" />
                <span className="mono">vol. 01</span>
              </div>
            </BookMockup>
          )}
          <p className="detail__hand hand">{tpl.greeting}</p>
        </div>

        <div className="detail__info">
          <p className="mono detail__eyebrow">{tpl.region === 'Blank' ? 'Design your own' : `${tpl.region} collection`}</p>
          <h1 className="detail__title"><span className="hl">{tpl.country}</span> diary</h1>
          <p className="detail__desc">{tpl.description}</p>

          <div className="detail__price">
            <p><span className="detail__from">{PAGE_RULES.included} pages from</span> <strong>{formatMoney(SIZES.medium.base)}</strong></p>
            <p className="detail__per">then {formatMoney(SIZES.medium.perPage)} per extra page · Large from {formatMoney(SIZES.large.base)}</p>
          </div>

          <div className="detail__bundles">
            {[{ n: 1, label: 'single', note: 'one diary' }, ...BUNDLE_TIERS.slice().reverse().map(t => ({ n: t.minBooks, label: t.minBooks === 2 ? 'duo' : 'trio+', note: `save ${Math.round(t.rate * 100)}%` }))].map(b => (
              <div key={b.label} className="detail__bundle">
                <div className="detail__stack">{Array.from({ length: Math.min(b.n, 3) }, (_, i) => <span key={i} style={{ background: [tpl.palette.accent, tpl.palette.accent2, tpl.palette.ink][i] }} />)}</div>
                <strong>{b.label}</strong>
                <span>{b.note}</span>
              </div>
            ))}
          </div>

          <div className="detail__cta">
            <Button size="lg" lines onClick={start} disabled={busy} aria-busy={busy}>{busy ? 'Opening…' : 'Start my diary'}</Button>
            <p className="detail__hint hand"><CurlyArrow width={60} /> you’ll add photos next</p>
          </div>

          <ul className="detail__included">
            {INCLUDED.map(i => <li key={i}><IconCheck width={18} /> {i}</li>)}
          </ul>

          <div className="detail__specs">
            <details className="sketch sketch--flat" open>
              <summary>How it works</summary>
              <ol>
                <li>Start your diary — the cover opens in the editor with starter layouts on every page.</li>
                <li>Upload photos, then auto-fill the whole book or place them page by page.</li>
                <li>Preview it as a flip-book, pick size, binding and paper, and add it to your cart.</li>
              </ol>
            </details>
            <details className="sketch sketch--flat">
              <summary>Sizes & finishes</summary>
              <ul>
                {Object.values(SIZES).map(s => <li key={s.label}><strong>{s.label}</strong> {s.dims} — from {formatMoney(s.base)}</li>)}
                {Object.values(BINDINGS).map(b => <li key={b.label}><strong>{b.label}</strong> — {b.note}{b.add ? ` (+${formatMoney(b.add)})` : ''}</li>)}
                {Object.values(PAPERS).map(p => <li key={p.label}><strong>{p.label}</strong> paper — {p.note}{p.add ? ` (+${formatMoney(p.add)})` : ''}</li>)}
              </ul>
            </details>
            <details className="sketch sketch--flat">
              <summary>Shipping</summary>
              <ul>
                {Object.values(SHIPPING).map(s => (
                  <li key={s.label}><strong>{s.label}</strong> {s.days} — {formatMoney(s.price)}{Number.isFinite(s.freeOver) ? `, free over ${formatMoney(s.freeOver)}` : ''}</li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      </div>

      {others.length > 0 && (
        <section className="detail__more">
          <h2><Sparkle width={26} /> More destinations</h2>
          <div className="detail__more-grid">
            {others.map(t => (
              <SketchFrame key={t.slug} className="detail__mini" shadow={false}>
                <Link to={`/templates/${t.slug}`}>
                  <img src={coverUrls(t.slug).small} alt={`${t.country} cover`} loading="lazy" />
                  <span>{t.country}</span>
                </Link>
              </SketchFrame>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
