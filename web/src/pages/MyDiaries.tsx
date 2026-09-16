import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { coverUrls, getTemplate } from '@shared/catalog';
import { BookMockup } from '../components/BookMockup';
import { IconCopy, IconEye, IconTrash, LoopArrowDown, Sparkle, Starburst } from '../components/Doodles';
import { DoodleHeading, LinkButton } from '../components/Kit';
import { useCart } from '../store/cart';
import { useProjects, type ProjectMeta } from '../store/projects';
import { toast } from '../store/toast';
import './commerce.css';

const ago = (ts: number) => {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

function DiaryCard({ meta }: { meta: ProjectMeta }) {
  const tpl = getTemplate(meta.templateSlug);
  const { deleteProject, duplicateProject } = useProjects.getState();
  const removeFromCart = useCart(s => s.removeProject);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const pct = meta.slots ? Math.round((meta.filled / meta.slots) * 100) : 0;

  return (
    <li className="diary-card sketch">
      <Link to={`/create/${meta.id}/design`} className="diary-card__art" style={{ background: tpl?.palette.accent2 ?? 'var(--yellow-soft)' }} aria-label={`Open ${meta.title}`}>
        <BookMockup src={tpl?.hasCoverArt ? coverUrls(meta.templateSlug).small : undefined} width="46%" tilt={-22} spineColor={tpl?.coverColor}>
          <span className="diary-card__blank grid-paper"><Sparkle width={28} /></span>
        </BookMockup>
      </Link>
      <div className="diary-card__body">
        <h2>{meta.title}</h2>
        <p className="diary-card__meta">{tpl?.country ?? 'Custom'} · {meta.pages} pages · {meta.photos} photos · edited {ago(meta.updatedAt)}</p>
        <div className="meter" aria-label={`${pct}% of photo frames filled`}><span style={{ width: `${pct}%` }} /></div>
        <p className="diary-card__fill">{meta.filled} / {meta.slots} frames filled</p>
        <div className="diary-card__actions">
          <Link className="btn btn--sm" to={`/create/${meta.id}/design`}>Continue</Link>
          <Link className="icon-btn" to={`/create/${meta.id}/preview`} title="Preview" aria-label={`Preview ${meta.title}`}><IconEye width={18} /></Link>
          <button type="button" className="icon-btn" title="Duplicate" aria-label={`Duplicate ${meta.title}`} disabled={busy} onClick={async () => { setBusy(true); const id = await duplicateProject(meta.id); setBusy(false); if (id) toast('Diary duplicated', 'info', { label: 'Open', run: () => navigate(`/create/${id}/design`) }); }}><IconCopy width={18} /></button>
          <button type="button" className="icon-btn icon-btn--danger" title="Delete" aria-label={`Delete ${meta.title}`} disabled={busy} onClick={async () => {
            if (!confirm(`Delete “${meta.title}” and its photos from this device? This can’t be undone.`)) return;
            setBusy(true);
            await deleteProject(meta.id);
            removeFromCart(meta.id);
            toast('Diary deleted');
          }}><IconTrash width={18} /></button>
        </div>
      </div>
    </li>
  );
}

export default function MyDiaries() {
  const metas = useProjects(s => s.metas);
  const sorted = [...metas].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="diaries wrap">
      <header className="diaries__head">
        <DoodleHeading as="h1">My diaries</DoodleHeading>
        <p>Drafts autosave in this browser. Clearing site data removes them, so finish and order the ones you love.</p>
      </header>
      {sorted.length ? (
        <ul className="diaries__grid">{sorted.map(m => <DiaryCard key={m.id} meta={m} />)}</ul>
      ) : (
        <div className="cart-empty">
          <Starburst width={100} />
          <h2>No diaries yet</h2>
          <p>Pick a destination cover and your first draft will show up here.</p>
          <LoopArrowDown width={36} />
          <LinkButton to="/templates" lines>Start a diary</LinkButton>
        </div>
      )}
    </div>
  );
}
