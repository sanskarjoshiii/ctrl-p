import { useState, type FormEvent } from 'react';
import { adminApi, type Session } from './api';

export default function Login({ onSignedIn }: { onSignedIn: (session: Session) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onSignedIn(await adminApi.login(email, password));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
      setPassword('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin admin--centre">
      <form className="login" onSubmit={submit}>
        <h1>
          Book Diaries <span>admin</span>
        </h1>
        <p className="muted">Staff only. Orders, production and shipping.</p>

        {error && (
          <div className="errorbox" role="alert">
            <span>{error}</span>
          </div>
        )}

        <label className="field">
          <span>Email</span>
          <input type="email" autoComplete="username" required autoFocus value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} />
        </label>

        <button type="submit" className="btn btn--primary btn--block" disabled={busy || !email || !password}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="login__hint muted">
          Locked out? An account locks for 15 minutes after 5 failed attempts. Ask an owner to reset it with{' '}
          <code>npm run admin:user -w server</code>.
        </p>
      </form>
    </div>
  );
}
