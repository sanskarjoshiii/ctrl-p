import { LinkButton } from '../components/Kit';
import { LoopArrowDown, Starburst } from '../components/Doodles';

export default function NotFound() {
  return (
    <div className="wrap" style={{ padding: '90px 0 60px', display: 'grid', justifyItems: 'center', gap: 22, textAlign: 'center' }}>
      <Starburst width={120} />
      <p className="stamp" style={{ color: 'var(--coral)', fontSize: '1.2rem' }}>lost in transit</p>
      <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', fontWeight: 600 }}>This page took a wrong turn</h1>
      <p style={{ maxWidth: 480, color: 'var(--ink-soft)' }}>The link may be old, or the diary was deleted from this device.</p>
      <LoopArrowDown width={40} />
      <LinkButton to="/templates" lines>Browse covers</LinkButton>
    </div>
  );
}
