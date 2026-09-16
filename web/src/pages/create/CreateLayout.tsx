import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router';
import { IconCart, IconCheck } from '../../components/Doodles';
import { Logo } from '../../components/Kit';
import { Toasts } from '../../components/SiteLayout';
import { loadEditorFonts } from '../../lib/fonts';
import { useCartCount } from '../../store/cart';
import { useProjects } from '../../store/projects';
import './create.css';

const STEPS = [
  { path: 'photos', label: 'Photos' },
  { path: 'design', label: 'Design' },
  { path: 'preview', label: 'Preview' },
  { path: 'order', label: 'Order' },
];

function SaveState() {
  const saveState = useProjects(s => s.saveState);
  const label = saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Not saved — storage full?' : 'Saved on this device';
  return <span className={`save-state save-state--${saveState}`} role="status">{saveState === 'saved' && <IconCheck width={14} />}{label}</span>;
}

export default function CreateLayout() {
  const { projectId = '' } = useParams();
  const { pathname } = useLocation();
  const status = useProjects(s => s.status);
  const project = useProjects(s => s.project);
  const openProject = useProjects(s => s.openProject);
  const cartCount = useCartCount();
  const step = STEPS.findIndex(s => pathname.endsWith(`/${s.path}`));

  useEffect(() => { openProject(projectId); }, [projectId, openProject]);
  useEffect(() => { loadEditorFonts(); }, []);

  const ready = status === 'ready' && project?.id === projectId;

  return (
    <div className={`create ${pathname.endsWith('/design') ? 'create--editor' : ''}`}>
      <header className="create__head">
        <Logo className="create__logo" />
        <nav className="flow" aria-label="Diary steps">
          <span className="flow__step is-done"><span className="flow__dot"><IconCheck width={14} /></span><span className="flow__label">Cover</span></span>
          {STEPS.map((s, i) => (
            <NavLink key={s.path} to={`/create/${projectId}/${s.path}`} className={`flow__step ${i < step ? 'is-done' : ''} ${i === step ? 'is-current' : ''}`}>
              <span className="flow__dot">{i < step ? <IconCheck width={14} /> : i + 2}</span>
              <span className="flow__label">{s.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="create__right">
          {ready && <SaveState />}
          <Link to="/cart" className="create__cart" aria-label={`Cart, ${cartCount} items`}>
            <IconCart width={22} />{cartCount > 0 && <span>{cartCount}</span>}
          </Link>
        </div>
      </header>

      {status === 'missing' ? (
        <div className="create__state wrap">
          <p className="stamp" style={{ color: 'var(--coral)' }}>not found</p>
          <h1>We couldn’t find this diary</h1>
          <p>Drafts are saved in the browser you made them in. It may have been deleted, or created on another device.</p>
          <div className="create__state-actions">
            <Link className="btn" to="/diaries">My diaries</Link>
            <Link className="btn btn--white" to="/templates">Start a new one</Link>
          </div>
        </div>
      ) : ready ? (
        <Outlet />
      ) : (
        <div className="create__state"><span className="loader" aria-label="Loading your diary" /></div>
      )}
      <Toasts />
    </div>
  );
}
