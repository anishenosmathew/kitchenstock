import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';

export default function Account() {
  const { user, kitchen, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = (user?.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="app-shell">
      <div className="page-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '24px 20px 20px' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--sage-bg)', color: 'var(--sage-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>
            {initials}
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{user?.name}</p>
            <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', margin: '2px 0 0' }}>{user?.email}</p>
            {kitchen && <p style={{ fontSize: 11.5, color: 'var(--sage-text)', fontWeight: 700, margin: '4px 0 0' }}>{kitchen.name}</p>}
          </div>
        </div>

        <p className="field-label" style={{ padding: '16px 20px 8px' }}>Kitchen</p>
        <Row icon="🏠" label="Household" onClick={() => navigate('/household')} />
        <Row icon="🔔" label="Low stock settings" onClick={() => navigate('/alerts')} />
        <Row icon="🔗" label="Join a kitchen" onClick={() => navigate('/join-kitchen')} />

        <p className="field-label" style={{ padding: '16px 20px 8px' }}>Account</p>
        <Row icon="✏️" label="Edit profile" onClick={() => navigate('/account/edit')} />
        <Row icon="🔒" label="Change password" onClick={() => navigate('/account/password')} />

        <div style={{ padding: '24px 20px' }}>
          <button className="btn-secondary" style={{ color: 'var(--terracotta-text)' }} onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

function Row({ icon, label, onClick }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', padding: '13px 20px', borderTop: '1px solid var(--line)', cursor: 'pointer' }}>
      <span style={{ fontSize: 18, marginRight: 12 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600 }}>{label}</span>
      <span style={{ color: 'var(--ink-soft)' }}>›</span>
    </div>
  );
}
