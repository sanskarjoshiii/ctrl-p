import { Link } from 'react-router';
import { coverUrls, TEMPLATES } from '@shared/catalog';
import { formatMoney, PAGE_RULES, SIZES } from '@shared/pricing';
import { BookMockup } from '../components/BookMockup';
import {
  Bulb, CurlyArrow, Cursor, IconArrowUpRight, IconAsterisk, IconBook, IconPhotos, IconTruck, IconWand, LoopArrowDown, PaperPlane, Smiley, Starburst, SunFace,
} from '../components/Doodles';
import { DoodleHeading, LinkButton, Marquee, Selectable, SketchFrame, useReveal } from '../components/Kit';
import './Home.css';

const FEATURED = ['france', 'japan', 'usa', 'mexico'];

const STEPS = [
  { icon: IconBook, color: '', title: 'Pick a cover', text: 'Ten hand-illustrated destination covers, or a blank notebook you design yourself.', link: '/templates', cta: 'Browse covers' },
  { icon: IconPhotos, color: 'badge-icon--lilac', title: 'Drop your photos', text: 'Upload straight from your camera roll. We keep full quality for print and a light copy for editing.', link: '/templates', cta: 'Start uploading' },
  { icon: IconWand, color: 'badge-icon--coral', title: 'Make every page yours', text: 'Collage layouts, polaroid & film frames, stickers, doodles and 17 fonts — or auto-fill in one click.', link: '/templates', cta: 'Open the editor' },
  { icon: IconTruck, color: 'badge-icon--sky', title: 'Hold it forever', text: 'Flip through a live preview, choose size & paper, and we print, bind and deliver to your door.', link: '/#timeline', cta: 'See delivery times' },
];

const TIMELINE = [
  { when: 'Day 0', title: 'You design it', place: 'about 20 minutes', text: 'Pick a cover, drop in photos, arrange pages and preview the finished diary before ordering.', dot: 'yellow' },
  { when: 'Day 1', title: 'We check every page', place: 'print prep', text: 'Your files are checked for empty frames and low-resolution photos before anything is printed.', dot: 'ink' },
  { when: 'Day 2–4', title: 'Printed & bound', place: 'studio', text: 'Printed at 300 dpi on thick paper and bound as a hardcover or lay-flat book.', dot: 'pink' },
  { when: 'Day 7–10', title: 'At your door', place: 'tracked delivery', text: 'Shipped with tracking — or express in 3–5 business days if the trip was that good.', dot: 'sky' },
];

const FAQ = [
  { q: 'How many photos do I need?', a: `A ${PAGE_RULES.included}-page diary looks great with roughly 40–70 photos. You can add pages up to ${PAGE_RULES.max}, two at a time.` },
  { q: 'Will my phone photos print well?', a: 'Yes — modern phone photos print beautifully. The editor warns you if a photo is stretched too big for its frame.' },
  { q: 'Can I save and come back later?', a: 'Every change autosaves on this device. Find your drafts anytime under “My diaries”.' },
  { q: 'What sizes and finishes are there?', a: `Medium (${SIZES.medium.dims}) or Large (${SIZES.large.dims}), hardcover or lay-flat, with gloss or silk-matte paper.` },
  { q: 'Do you offer discounts on multiple books?', a: '2 diaries get 10% off and 3 or more get 15% off — applied automatically in your cart.' },
  { q: 'Can I send it as a gift?', a: 'Add a gift box when you order and ship it straight to their address.' },
];

export default function Home() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <div className="home" ref={ref}>
      {/* ——— Hero ——— */}
      <section className="hero wrap">
        <div className="hero__copy">
          <div className="sticky hero__sticky float--slow float" aria-hidden><SunFace width="70%" /></div>
          <h1 className="hero__title">
            Your trips, printed as <span className="hl">storybooks</span>
          </h1>
          <p className="hero__lede">
            Pick a hand-illustrated cover, drop in your travel photos and design every page with collages, frames and doodles.
            We print it on thick paper and deliver it to your door.
          </p>
          <div className="hero__actions">
            <LinkButton to="/templates" size="lg" lines>Start your diary</LinkButton>
            <Link to="/templates/blank" className="text-link">or start from scratch</Link>
          </div>
          <ul className="hero__facts mono">
            <li>{PAGE_RULES.min}–{PAGE_RULES.max} pages</li>
            <li>300 dpi print</li>
            <li>from {formatMoney(SIZES.medium.base)}</li>
          </ul>
        </div>

        <div className="hero__art">
          <p className="hero__note hand"><Smiley width={26} /> your trip here</p>
          <CurlyArrow className="hero__arrow" />
          <SketchFrame className="hero__frame">
            <span className="hero__pin hero__pin--l" /><span className="hero__pin hero__pin--r" />
            <Bulb className="hero__bulb" />
            <div className="hero__stage grid-paper">
              <BookMockup src={coverUrls('japan').small} width="39%" tilt={24} className="hero__book hero__book--l" spineColor="#e6dcc6" alt="Japan diary cover" />
              <BookMockup src={coverUrls('italy').small} width="39%" tilt={-24} className="hero__book hero__book--r" spineColor="#f2e3bd" alt="Italy diary cover" />
              <BookMockup src={coverUrls('france').small} width="48%" tilt={-18} className="hero__book hero__book--c" spineColor="#e9dcc6" alt="France diary cover" />
            </div>
            <Starburst className="hero__burst" color="var(--coral)" />
          </SketchFrame>
          <PaperPlane className="hero__plane" />
        </div>
      </section>

      <Marquee items={TEMPLATES.filter(t => t.hasCoverArt).map(t => t.country)} />

      {/* ——— How it works ——— */}
      <section id="how" className="how wrap">
        <div className="how__head reveal">
          <h2 className="how__title">Here’s how<br />it works… <Smiley width={58} /></h2>
          <div className="how__tag">
            <span className="hand-tag">4 easy steps?</span>
            <LoopArrowDown width={40} />
          </div>
        </div>
        <div className="how__grid reveal">
          <div className="how__stats">
            <div className="how__stat"><strong>10</strong><span>hand-illustrated covers</span></div>
            <div className="how__stat"><strong>17</strong><span>collage layouts & 11 frames</span></div>
            <div className="how__stat"><strong>1</strong><span>click to auto-fill every page</span></div>
          </div>
          <div className="how__steps">
            {STEPS.map(({ icon: Icon, color, title, text, link, cta }, i) => (
              <article className="how__step" key={title}>
                <div className="how__step-body">
                  <span className="how__num mono">0{i + 1}</span>
                  <span className={`badge-icon ${color}`}><Icon /></span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
                <Link to={link} className="how__step-link">{cta} <IconArrowUpRight width={22} /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ——— Banner ——— */}
      <section className="wrap reveal">
        <div className="banner">
          <span className="banner__pink" /><svg className="banner__tri" viewBox="0 0 100 90"><path d="M50 4 96 86H4Z" fill="none" stroke="currentColor" strokeWidth="2.5" /></svg>
          <span className="banner__half" /><span className="banner__grid banner__grid--l" /><span className="banner__grid banner__grid--r" />
          <span className="banner__cross" /><Cursor className="banner__cursor" />
          <p className="banner__text">Pick <span>.</span> Design <span>.</span> Print</p>
        </div>
      </section>

      {/* ——— Destinations ——— */}
      <section className="destinations wrap">
        <h2 className="destinations__title reveal">
          Pick your <span className="destinations__underline">destination</span>
          <span className="sticky sticky--sky destinations__sticky" aria-hidden><SunFace width="72%" /></span>
        </h2>
        <div className="destinations__grid">
          {FEATURED.map(slug => {
            const t = TEMPLATES.find(x => x.slug === slug)!;
            return (
              <SketchFrame key={slug} className="dest-card reveal">
                <Link to={`/templates/${slug}`} className="dest-card__link">
                  <div className="dest-card__art" style={{ background: t.palette.accent2 }}>
                    <BookMockup src={coverUrls(slug).small} width="38%" tilt={-22} spineColor={t.coverColor} alt={`${t.country} cover`} />
                  </div>
                  <div className="dest-card__meta">
                    <div>
                      <h3>{t.country}</h3>
                      <p>{t.tagline}</p>
                    </div>
                    <span className="dest-card__go" aria-hidden><IconArrowUpRight width={24} /></span>
                  </div>
                </Link>
              </SketchFrame>
            );
          })}
        </div>
        <div className="destinations__more reveal">
          <LinkButton to="/templates" variant="yellow" size="lg">View all 10 covers</LinkButton>
          <Cursor className="destinations__cursor" color="var(--white)" />
        </div>
      </section>

      {/* ——— Editor showcase ——— */}
      <section className="showcase wrap reveal">
        <div className="showcase__box">
          <div className="showcase__copy">
            <span className="hand-tag hand-tag--yellow">drag. drop. done.</span>
            <h2>Your pages,<br /><span className="hl">your rules.</span></h2>
            <ul className="showcase__list">
              <li><IconAsterisk width={20} /> 17 collage layouts, from polaroid piles to film strips</li>
              <li><IconAsterisk width={20} /> Frames: polaroid, stamp, arch, circle, washi tape…</li>
              <li><IconAsterisk width={20} /> Stickers, shapes and doodles in your cover’s colours</li>
              <li><IconAsterisk width={20} /> Undo, autosave and a live flip-through preview</li>
            </ul>
            <LinkButton to="/templates" variant="ink" lines>Try the editor</LinkButton>
          </div>

          <div className="window">
            <div className="window__bar"><i /><i /><i /><span className="mono">page 04 — lisbon.diary</span></div>
            <div className="window__body">
              <div className="window__tools">
                {['Photos', 'Layouts', 'Frames', 'Text', 'Stickers'].map((t, i) => <span key={t} className={`window__tool ${i === 2 ? 'is-on' : ''}`}>{t}</span>)}
              </div>
              <div className="window__page dot-paper">
                <div className="snap snap--a" style={{ backgroundImage: `url(${coverUrls('italy').medium})` }} />
                <div className="snap snap--b" style={{ backgroundImage: `url(${coverUrls('greece').medium})` }}><span className="hand">sunset spot</span></div>
                <Selectable className="snap-select">
                  <div className="snap snap--c" style={{ backgroundImage: `url(${coverUrls('thailand').medium})` }} />
                </Selectable>
                <p className="window__caption hand">best. trip. ever.</p>
                <Starburst className="window__burst" color="var(--yellow)" />
              </div>
            </div>
          </div>
          <code className="showcase__badge" aria-hidden>{'</>'}</code>
        </div>
      </section>

      {/* ——— Timeline ——— */}
      <section id="timeline" className="timeline">
        <div className="wrap timeline__head reveal">
          <h2 className="doodle-heading"><span>From camera roll to coffee table</span><Smiley /></h2>
          <span className="hand-tag">your diary’s journey</span>
        </div>
        <div className="timeline__paper grid-paper">
          <div className="wrap">
            {TIMELINE.map(step => (
              <div className="timeline__row reveal" key={step.when}>
                <div className="timeline__left">
                  <h3>{step.title}</h3>
                  <p className="timeline__when">{step.when}</p>
                  <p className="timeline__place">{step.place}</p>
                </div>
                <div className="timeline__line"><span className={`timeline__dot timeline__dot--${step.dot}`} /></div>
                <p className="timeline__text">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— FAQ ——— */}
      <section id="faq" className="faq wrap">
        <DoodleHeading className="reveal">Questions, answered</DoodleHeading>
        <div className="faq__grid">
          {FAQ.map(item => (
            <details className="faq__item sketch reveal" key={item.q}>
              <summary>{item.q}<span className="faq__plus" aria-hidden>+</span></summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ——— CTA ——— */}
      <section className="wrap reveal">
        <div className="cta">
          <Starburst className="cta__burst spin-slow" />
          <h2>Let’s start your first diary</h2>
          <p>Choose a destination cover, and you’ll be dropping photos onto pages in under a minute.</p>
          <LinkButton to="/templates" size="lg" lines>Pick a cover</LinkButton>
        </div>
      </section>
    </div>
  );
}
