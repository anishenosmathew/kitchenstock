import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function ChangePassword() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (next.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (next !== confirm) {
      setError('New passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      await api.changePassword({ currentPassword: current, newPassword: next }, token);
      navigate(-1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px 20px 8px' }}>
        <button onClick={() => navigate(-1)} style={iconBtn}>←</button>
        <span style={{ fontSize: 15, fontWeight: 700, marginLeft: 12 }}>Change password</span>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '20px 28px 0' }}>
        <div className="field">
          <p className="field-label">Current password</p>
          <input className="text-input" type="password" placeholder="••••••••" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div className="field">
          <p className="field-label">New password</p>
          <input className="text-input" type="password" placeholder="At least 8 characters" value={next} onChange={(e) => setNext(e.target.value)} />
        </div>
        <div className="field">
          <p className="field-label">Confirm new password</p>
          <input className="text-input" type="password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>

        <div style={{ padding: '4px 14px', background: 'rgba(34,29,20,0.03)', borderRadius: 12, marginBottom: 22 }}>
          <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', margin: '10px 0' }}>• At least 8 characters</p>
          <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', margin: '10px 0' }}>• One number or symbol recommended</p>
        </div>

        {error && <p className="error-text">{error}</p>}

        <button className="btn-primary" disabled={saving}>
          {saving ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}

const iconBtn = {
  width: 34, height: 34, borderRadius: '50%', border: '1.5px solid var(--line)',
  background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
