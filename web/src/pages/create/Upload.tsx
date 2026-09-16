import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { getTemplate } from '@shared/catalog';
import { PAGE_RULES } from '@shared/pricing';
import { CurlyArrow, IconArrowRight, IconClose, IconSparkles, IconUpload, IconWand, SunFace } from '../../components/Doodles';
import { rebuildAllPages } from '../../editor/autofill';
import { usePhotoThumbUrl } from '../../lib/imageCache';
import { MAX_FILE_MB } from '../../lib/photos';
import { useProjects } from '../../store/projects';
import { toast } from '../../store/toast';

function Thumb({ id }: { id: string }) {
  const url = usePhotoThumbUrl(id);
  const removePhoto = useProjects(s => s.removePhoto);
  return (
    <li className="up-thumb">
      {url ? <img src={url} alt="" /> : <span className="up-thumb__wait" />}
      <button type="button" aria-label="Remove photo" onClick={() => removePhoto(id)}><IconClose width={14} /></button>
    </li>
  );
}

export default function Upload() {
  const project = useProjects(s => s.project)!;
  const photos = useProjects(s => s.photos);
  const { addPhotos, edit } = useProjects.getState();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const tpl = getTemplate(project.templateSlug) ?? getTemplate('blank')!;
  const count = project.photoIds.length;

  const onFiles = async (files: File[]) => {
    if (!files.length) return;
    setProgress({ done: 0, total: files.length });
    const { added, errors } = await addPhotos(files, (done, total) => setProgress({ done, total }));
    setProgress(null);
    if (added.length) toast(`${added.length} photo${added.length > 1 ? 's' : ''} added`);
    errors.slice(0, 4).forEach(e => toast(e, 'error'));
  };

  const autoFill = () => {
    const current = useProjects.getState().project!;
    const alreadyPlaced = current.pages.some(p => p.elements.some(el => el.type === 'photo' && el.photoId));
    if (alreadyPlaced && !confirm('Some pages already have photos. Rebuild every page around all your photos? (You can undo in the editor.)')) return;
    const { pages, placed, added } = rebuildAllPages(current, photos, tpl);
    edit(d => { d.pages = pages as typeof d.pages; });
    toast(`Arranged ${placed} photos across your diary${added ? ` and added ${added} pages` : ''} ✦`);
    navigate('../design', { relative: 'path' });
  };

  const suggested = Math.round(PAGE_RULES.included * 2.2);

  return (
    <div className="upload wrap">
      <div className="upload__head">
        <div>
          <p className="mono upload__eyebrow">step 2 · {project.title}</p>
          <h1>Drop in your <span className="hl">travel photos</span></h1>
          <p className="upload__lede">Add as many as you like — around {suggested} fills a {PAGE_RULES.included}-page diary nicely. Photos stay on this device until you order.</p>
        </div>
        <div className="sticky sticky--yellow upload__sticky" aria-hidden><SunFace width="70%" /></div>
      </div>

      <div
        className={`dropzone ${hover ? 'is-hover' : ''} ${count > 0 && !progress ? 'is-compact' : ''}`}
        onDragOver={e => { e.preventDefault(); setHover(true); }}
        onDragLeave={() => setHover(false)}
        onDrop={e => { e.preventDefault(); setHover(false); onFiles([...e.dataTransfer.files]); }}
      >
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={e => { onFiles([...(e.target.files ?? [])]); e.target.value = ''; }} />
        <span className="dropzone__icon"><IconUpload width={40} /></span>
        <p className="dropzone__title">{progress ? `Adding photos… ${progress.done} / ${progress.total}` : 'Drag photos here'}</p>
        {progress ? (
          <div className="progress" aria-hidden><span style={{ width: `${(progress.done / progress.total) * 100}%` }} /></div>
        ) : (
          <>
            <p className="dropzone__or">or</p>
            <button type="button" className="btn" onClick={() => inputRef.current?.click()}>Choose from device</button>
            <p className="dropzone__note">JPG, PNG or WebP · up to {MAX_FILE_MB} MB each</p>
          </>
        )}
        <p className="dropzone__hand hand"><CurlyArrow width={70} /> the good ones & the silly ones</p>
      </div>

      {count > 0 && (
        <>
          <div className="upload__count">
            <strong>{count} photo{count > 1 ? 's' : ''}</strong>
            <span>{count < suggested / 2 ? 'add a few more for a fuller diary' : 'looking great'}</span>
          </div>
          <ul className="up-grid">{project.photoIds.map(id => <Thumb key={id} id={id} />)}</ul>
        </>
      )}

      <div className="choices">
        <button type="button" className="choice choice--auto" onClick={autoFill} disabled={!count || Boolean(progress)}>
          <span className="badge-icon"><IconSparkles /></span>
          <strong>Auto-fill my diary</strong>
          <span>We arrange every photo into collage layouts across your pages — then tweak anything you like.</span>
          <span className="choice__go">Arrange for me <IconArrowRight width={20} /></span>
        </button>
        <button type="button" className="choice" onClick={() => navigate('../design', { relative: 'path' })} disabled={Boolean(progress)}>
          <span className="badge-icon badge-icon--lilac"><IconWand /></span>
          <strong>I’ll design it myself</strong>
          <span>Open the editor with starter layouts and place each photo exactly where you want it.</span>
          <span className="choice__go">Open the editor <IconArrowRight width={20} /></span>
        </button>
      </div>
    </div>
  );
}
