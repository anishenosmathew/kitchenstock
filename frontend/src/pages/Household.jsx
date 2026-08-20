import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function Household() {
  const { user, token, kitchen, logout, updateKitchen } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getHousehold(kitchen.id, token).then(setData).catch((err) => setError(err.message));
  }, [kitchen, token]);

  const myRole = data?.members.find((m) => m.id === user.id)?.role;
  const isOwner = myRole === 'owner';

  async function handleRotateCode() {
    setBusy(true);
    try {
      const res = await api.rotateInviteCode(kitchen.id, token);
      setData((prev) => ({ ...prev, kitchen: { ...prev.kitchen, invite_code: res.inviteCode } }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(memberId) {
    setBusy(true);
    try {
      await api.removeMember(kitchen.id, memberId, token);
      setData((prev) => ({ ...prev, members: prev.members.filter((m) => m.id !== memberId) }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    setBusy(true);
    try {
      const res = await api.leaveKitchen(kitchen.id, token);
      updateKitchen(res.kitchen);
      navigate('/join-kitchen');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  function handleShare() {
    const code = data?.kitchen.invite_code;
    const text = `Join our kitchen on KitchenStock! Use invite code: ${code}`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
      alert('Invite code copied to clipboard.');
    }
  }

  if (!data) return <div className="app-shell" style={{ padding: 20 }}>Loading…</div>;

  return (
    <div className="app-shell">
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px 20px 8px' }}>
        <button onClick={() => navigate(-1)} style={iconBtn}>←</button>
        <span style={{ fontSize: 15, fontWeight: 700, marginLeft: 12 }}>Household</span>
      </div>

      {error && <p className="error-text" style={{ padding: '0 20px' }}>{error}</p>}

      {isOwner && (
        <div style={{ padding: '14px 20px 0' }}>
          <p className="field-label">Invite someone</p>
          <div style={card}>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 14px', lineHeight: 1.5 }}>
              Share this code with someone in your household. They'll enter it when creating an account to join your kitchen.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, fontFamily: 'monospace', fontSize: 20, fontWeight: 700, letterSpacing: '0.1em', textAlign: 'center', padding: '12px 0', background: 'var(--cream)', border: '1.5px dashed var(--line)', borderRadius: 12 }}>
                {data.kitchen.invite_code}
              </div>
              <button onClick={handleShare} className="btn-primary" style={{ width: 'auto', padding: '12px 16px', whiteSpace: 'nowrap' }}>
                Share
              </button>
            </div>
            <button onClick={handleRotateCode} disabled={busy} style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', fontSize: 12, marginTop: 12, textDecoration: 'underline' }}>
              Generate a new code
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: '18px 20px 0' }}>
        <p className="field-label">Members</p>
        <div style={{ ...card, padding: '6px 18px 4px' }}>
          {data.members.map((member, i) => (
            <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--sage-bg)', color: 'var(--sage-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                {member.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{member.name}</p>
                <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '1px 0 0' }}>{member.email}</p>
              </div>
              <span style={{
                fontSize: 10.5, fontWeight: 700, padding: '4px 9px', borderRadius: 6,
                background: member.role === 'owner' ? 'var(--sage-bg)' : 'rgba(34,29,20,0.06)',
                color: member.role === 'owner' ? 'var(--sage-text)' : 'var(--ink-soft)',
              }}>
                {member.role.toUpperCase()}
              </span>
              {isOwner && member.role !== 'owner' && (
                <button onClick={() => handleRemove(member.id)} disabled={busy} style={{ background: 'none', border: 'none', color: 'var(--terracotta-text)', fontSize: 12, fontWeight: 600, marginLeft: 6 }}>
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {!isOwner && (
        <div style={{ padding: '24px 20px' }}>
          <button className="btn-secondary" style={{ color: 'var(--terracotta-text)' }} onClick={handleLeave} disabled={busy}>
            Leave this kitchen
          </button>
        </div>
      )}
    </div>
  );
}

const card = { background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: 18 };
const iconBtn = {
  width: 34, height: 34, borderRadius: '50%', border: '1.5px solid var(--line)',
  background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
