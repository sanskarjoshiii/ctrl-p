import { isRouteErrorResponse, Link, useRouteError } from 'react-router';

export default function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : 'Unknown error';
  return (
    <div style={{ minHeight: 'var(--screen-h)', display: 'grid', placeContent: 'center', gap: 18, padding: 24, textAlign: 'center' }}>
      <p className="stamp" style={{ color: 'var(--coral)', justifySelf: 'center' }}>oops</p>
      <h1 style={{ fontSize: '2.4rem', fontWeight: 600 }}>Something tore a page</h1>
      <p style={{ color: 'var(--ink-soft)' }}>Your diary is autosaved on this device. Reload to carry on.</p>
      <code style={{ fontSize: 13, color: 'var(--muted)' }}>{message}</code>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        <button className="btn" onClick={() => window.location.reload()}>Reload</button>
        <Link className="btn btn--white" to="/">Home</Link>
      </div>
    </div>
  );
}
