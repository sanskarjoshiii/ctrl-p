import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { IconArrowLeft, IconArrowRight, IconWarning, Starburst } from '../../components/Doodles';
import { slotStats } from '../../editor/factory';
import { usePagePreviews } from '../../lib/previewCache';
import { useProjects } from '../../store/projects';
import './preview.css';

function Face({ url, side, label }: { url?: string; side: 'front' | 'back'; label: string }) {
  return (
    <div className={`leaf__face leaf__face--${side}`}>
      {url ? <img src={url} alt={label} draggable={false} /> : <span className="leaf__loading" aria-label={`${label} loading`} />}
      <span className="leaf__shade" />
    </div>
  );
}

export default function Preview() {
  const project = useProjects(s => s.project)!;
  const pages = project.pages;
  const leaves = Math.ceil(pages.length / 2);
  const [flipped, setFlipped] = useState(0);
  const urls = usePagePreviews(pages, Math.max(0, flipped * 2 - 1));
  const touchX = useRef<number | null>(null);
  const stats = slotStats(project);
  const ready = urls.filter(Boolean).length;

  const next = useCallback(() => setFlipped(f => Math.min(leaves, f + 1)), [leaves]);
  const prev = useCallback(() => setFlipped(f => Math.max(0, f - 1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Home') setFlipped(0);
      if (e.key === 'End') setFlipped(leaves);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, leaves]);

  const state = flipped === 0 ? 'closed' : flipped === leaves ? 'back' : 'open';
  const leftPage = flipped * 2 - 1, rightPage = flipped * 2;
  const caption =
    state === 'closed' ? 'Front cover' :
    state === 'back' ? 'Back cover' :
    `Pages ${leftPage}–${Math.min(rightPage, pages.length - 2)} of ${pages.length - 2}`;

  return (
    <div className="preview">
      <div className="preview__head wrap">
        <div>
          <p className="mono preview__eyebrow">step 4 · flip through</p>
          <h1>{project.title}</h1>
        </div>
        <div className="preview__actions">
          <Link className="btn btn--white" to="../design" relative="path"><IconArrowLeft width={18} /> Keep editing</Link>
          <Link className="btn btn--yellow" to="../order" relative="path">Looks perfect — order <IconArrowRight width={18} /></Link>
        </div>
      </div>

      {stats.empty > 0 && (
        <p className="preview__warn wrap"><IconWarning width={18} /> {stats.empty} empty photo frame{stats.empty > 1 ? 's' : ''} will print blank. <Link to="../design" relative="path" className="text-link">Fill them</Link></p>
      )}

      <div
        className="desk dot-paper"
        onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
          touchX.current = null;
        }}
      >
        <Starburst className="desk__burst" color="var(--yellow)" />
        <div className={`flipbook flipbook--${state}`} aria-live="polite">
          {Array.from({ length: leaves }, (_, i) => {
            const isFlipped = i < flipped;
            const style: CSSProperties = { zIndex: isFlipped ? i + 1 : leaves - i };
            return (
              <div key={pages[i * 2].id} className={`leaf ${isFlipped ? 'is-flipped' : ''}`} style={style} onClick={() => (isFlipped ? prev() : next())}>
                <Face url={urls[i * 2]} side="front" label={i === 0 ? 'Front cover' : `Page ${i * 2}`} />
                {pages[i * 2 + 1] && <Face url={urls[i * 2 + 1]} side="back" label={i * 2 + 1 === pages.length - 1 ? 'Back cover' : `Page ${i * 2 + 1}`} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="preview__controls wrap">
        <button type="button" className="round-btn" onClick={prev} disabled={flipped === 0} aria-label="Previous page"><IconArrowLeft width={26} /></button>
        <div className="preview__scrub">
          <p className="preview__caption">{caption}</p>
          <input type="range" min={0} max={leaves} value={flipped} onChange={e => setFlipped(Number(e.target.value))} aria-label="Flip to page" />
          {ready < pages.length && <p className="preview__loading">preparing pages {ready} / {pages.length}</p>}
        </div>
        <button type="button" className="round-btn" onClick={next} disabled={flipped === leaves} aria-label="Next page"><IconArrowRight width={26} /></button>
      </div>
      <p className="preview__tip hand">tip: use ← → keys, or tap the page to turn it</p>
    </div>
  );
}
