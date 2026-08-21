import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function JoinKitchen() {
  const { token, updateKitchen } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleJoin(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await api.joinKitchen(code.trim(), token);
      updateKitchen(res.kitchen);
      navigate('/inventory');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px 20px 8px' }}>
        <button onClick={() => navigate(-1)} style={iconBtn}>←</button>
        <span style={{ fontSize: 15, fontWeight: 700, marginLeft: 12 }}>Join a kitchen</span>
      </div>

      <form onSubmit={handleJoin} style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', margin: 0, lineHeight: 1.5 }}>
          Enter the invite code shared by your household owner to join their kitchen.
        </p>
        <input
          className="input"
          placeholder="Invite code (e.g. A1B2C3)"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={6}
          style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, letterSpacing: '.0009em', textAlign: 'center' }}
          autoFocus
        />
        {error && <p className="error-text">{error}</p>}
        <button className="btn-primary" type="submit" disabled={busy || !code.trim()}>
          Join kitchen
        </button>
      </form>
    </div>
  );
}

const iconBtn = {
  width: 34, height: 34, borderRadius: '50%', border: '1.5px solid var(--line)',
  background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
