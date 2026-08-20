import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await signup(name, email, password, inviteCode || undefined);
      navigate('/inventory');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 20px 8px' }}>
        <h1 style={{ fontSize: 22 }}>
          <span style={{ color: 'var(--sage-text)' }}>Kitchen</span>Stock
        </h1>
      </div>
      <form onSubmit={handleSubmit} style={{ padding: '20px 28px' }}>
        <div className="field">
          <p className="field-label">Your name</p>
          <input className="text-input" placeholder="e.g. Alan Enos" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <p className="field-label">Email</p>
          <input className="text-input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <p className="field-label">Password</p>
          <input className="text-input" type="password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="field">
          <p className="field-label">Confirm password</p>
          <input className="text-input" type="password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <div className="field">
          <p className="field-label">Invite code (optional)</p>
          <input className="text-input" placeholder="Have a code? Enter it here" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />
        </div>
        <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '0 0 16px', lineHeight: 1.5 }}>
          With no invite code, you'll get your own kitchen and can invite others later.
        </p>
        {error && <p className="error-text">{error}</p>}
        <button className="btn-primary" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13.5, color: 'var(--ink-soft)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--sage-text)', fontWeight: 700 }}>Log in</Link>
        </p>
      </form>
    </div>
  );
}
