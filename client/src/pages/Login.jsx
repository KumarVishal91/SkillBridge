import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../services/api';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      mode === 'login'
        ? await login(form.email, form.password)
        : await register(form.name, form.email, form.password);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h1>🔄 SkillBridge</h1>
        <p className="muted">Learn what you want by teaching what you know.</p>
        <form onSubmit={submit}>
          {mode === 'register' && (
            <input placeholder="Full name" value={form.name} onChange={set('name')} required />
          )}
          <input type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
          <input
            type="password"
            placeholder="Password (6+ chars)"
            value={form.password}
            onChange={set('password')}
            required
          />
          {error && <p className="error">{error}</p>}
          <button className="btn" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
        <p className="small center">
          {mode === 'login' ? 'New here?' : 'Already have an account?'}{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === 'login' ? 'register' : 'login'); }}>
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </a>
        </p>
        <p className="small center muted">Demo: demo@demo.com / password123 (after running the seed)</p>
      </div>
    </div>
  );
}
