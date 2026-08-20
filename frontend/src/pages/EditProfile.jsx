import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function EditProfile() {
  const { user, token, updateUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const initials = (name || 'U').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  async function handleSave() {
    setError('');
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    try {
      const data = await api.updateProfile({ name, phone }, token);
      updateUser(data.user);
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
        <span style={{ fontSize: 15, fontWeight: 700, marginLeft: 12 }}>Edit profile</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 20px 8px' }}>
        <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'var(--sage-bg)', color: 'var(--sage-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 26 }}>
          {initials}
        </div>
      </div>

      <div style={{ padding: '12px 28px 0' }}>
        <div className="field">
          <p className="field-label">Name</p>
          <input className="text-input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <p className="field-label">Email</p>
          <input className="text-input" value={user?.email || ''} disabled style={{ color: 'var(--ink-soft)', background: 'rgba(34,29,20,0.03)' }} />
          <p style={{ fontSize: 11.5, color: 'var(--ink-soft)', margin: '6px 2px 0' }}>Contact support to change your email.</p>
        </div>
        <div className="field">
          <p className="field-label">Phone (for WhatsApp alerts)</p>
          <input className="text-input" type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ marginTop: 8, marginBottom: 20 }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

const iconBtn = {
  width: 34, height: 34, borderRadius: '50%', border: '1.5px solid var(--line)',
  background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
