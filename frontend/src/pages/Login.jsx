import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../images/logo.png';


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/inventory');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <div style={{ display: 'flex', alignItems: 'center', padding: '18px 20px 12px' }}>
        <div onClick={() => navigate('/inventory')} style={{ cursor: 'pointer' }}>
          <h1 style={{ fontSize: 19, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={logo} alt="logo" style={{ height: 28 }} />
            <span><span style={{ color: '#008000' }}>Kitchen</span><span style={{ color: '#FF0000' }}>Stock</span></span>
          </h1>
          <p style={{ margin: '0 12px 0', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--ink-soft)', paddingLeft: 36 }}>STOCK SMART. COOK EASY.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} style={{ padding: '24px 28px' }}>
        <div className="field">
          <p className="field-label">Email</p>
          <input
            className="text-input"
            type="text"
            placeholder="you@example.com (or admin)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <p className="field-label">Password</p>
          <input
            className="text-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn-primary" disabled={loading}>
          {loading ? 'Logging in…' : 'Log in'}
        </button>
        <p style={{ textAlign: 'center', marginTop: 22, fontSize: 13.5, color: 'var(--ink-soft)' }}>
          New to KitchenStock? <Link to="/signup" style={{ color: 'var(--sage-text)', fontWeight: 700 }}>Create an account</Link>
        </p>
      </form>
    </div>
  );
}
