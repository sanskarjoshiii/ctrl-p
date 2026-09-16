import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { coverUrls, TEMPLATES, type Region } from '@shared/catalog';
import { formatMoney, SIZES } from '@shared/pricing';
import { BookMockup } from '../components/BookMockup';
import { IconArrowUpRight, IconPlus, LoopArrowDown, SunFace } from '../components/Doodles';
import { DoodleHeading, SketchFrame } from '../components/Kit';
import './Templates.css';

const FILTERS: (Region | 'All')[] = ['All', 'Europe', 'Asia', 'Americas'];

export default function Templates() {
  const [params, setParams] = useSearchParams();
  const region = (params.get('region') as Region | 'All') ?? 'All';
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TEMPLATES.filter(t => t.hasCoverArt)
      .filter(t => region === 'All' || t.region === region)
      .filter(t => !q || [t.country, t.capital, t.tagline, t.region].some(s => s.toLowerCase().includes(q)));
  }, [region, query]);

  return (
    <div className="shop wrap">
      <header className="shop__head">
        <div>
          <DoodleHeading as="h1">Choose your cover</DoodleHeading>
          <p className="shop__lede">
            Every diary starts with a hand-illustrated destination cover. Pick one, and it opens in the editor with pages ready for your photos.
            All diaries start at <strong>{formatMoney(SIZES.medium.base)}</strong> for 24 pages.
          </p>
        </div>
        <div className="shop__note">
          <span className="hand-tag hand-tag--sky">can’t decide?</span>
          <LoopArrowDown width={36} />
        </div>
      </header>

      <div className="shop__bar" role="search">
        <div className="shop__filters" aria-label="Filter by region">
          {FILTERS.map(f => (
            <button key={f} className="chip" aria-pressed={region === f} onClick={() => setParams(f === 'All' ? {} : { region: f }, { replace: true })}>
              {f}
            </button>
          ))}
        </div>
        <label className="shop__search">
          <span className="visually-hidden">Search destinations</span>
          <input className="input" type="search" placeholder="Search a country or city…" value={query} onChange={e => setQuery(e.target.value)} />
        </label>
      </div>

      <div className="shop__grid">
        <Link to="/templates/blank" className="shop-card shop-card--blank">
          <div className="shop-card__blank-art dot-paper">
            <span className="sticky sticky--yellow shop-card__sticky"><SunFace width="70%" /></span>
            <span className="shop-card__plus"><IconPlus width={34} /></span>
            <span className="hand">start from scratch</span>
          </div>
          <div className="shop-card__meta">
            <h2>Blank notebook</h2>
            <p>Design your own cover</p>
          </div>
        </Link>

        {list.map(t => (
          <SketchFrame key={t.slug} className="shop-card" shadow={false}>
            <Link to={`/templates/${t.slug}`} className="shop-card__link">
              <div className="shop-card__art" style={{ background: t.palette.accent2 }}>
                {t.isNew && <span className="stamp shop-card__new">new</span>}
                <BookMockup src={coverUrls(t.slug).small} width="54%" tilt={-20} spineColor={t.coverColor} alt={`${t.country} diary cover`} />
              </div>
              <div className="shop-card__meta">
                <div>
                  <h2>{t.country}</h2>
                  <p>{t.tagline}</p>
                </div>
                <span className="shop-card__go" aria-hidden><IconArrowUpRight width={22} /></span>
              </div>
            </Link>
          </SketchFrame>
        ))}
      </div>

      {list.length === 0 && (
        <p className="shop__empty">No covers match “{query}” yet — try the blank notebook and make it yours.</p>
      )}
    </div>
  );
}
