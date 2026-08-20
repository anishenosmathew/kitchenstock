import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import BottomNav from '../components/BottomNav';
import logo from '../images/logo.png';

const STATUS_LABEL = {
  ok: { text: 'Stocked', color: 'var(--sage-text)' },
  low: { text: 'Low stock', color: 'var(--terracotta-text)' },
};

const CATEGORY_ICON = {
  Spices: '🧂',
  Vegetables: '🥦',
  Fruits: '🍎',
  Dairy: '🥛',
  Others: '📦',
};

export default function Inventory() {
  const { token, kitchen } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const contentRef = useRef(null);

  function changeFilter(key) {
    setFilter(key);
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }

  useEffect(() => {
    if (!kitchen) { setLoading(false); return; }
    api
      .getInventory(kitchen.id, token)
      .then((data) => setItems(data.items))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [kitchen, token]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in7 = new Date(today); in7.setDate(today.getDate() + 7);

  const filtered = items.filter((item) => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'low' && item.status !== 'low') return false;
    if (filter === 'ok' && (item.status !== 'ok' || item.low_stock_at === null)) return false;
    if (filter === 'no-min' && item.low_stock_at !== null) return false;
    if (filter === 'expiring') {
      if (!item.expiry_date) return false;
      const exp = new Date(item.expiry_date); exp.setHours(0, 0, 0, 0);
      if (exp > in7) return false;
    }
    return true;
  });

  return (
    <div className="app-shell">
      <div className="page-content" ref={contentRef}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '18px 20px 12px' }}>
          <div onClick={() => navigate('/inventory')} style={{ cursor: 'pointer' }}>
            <h1 style={{ fontSize: 19, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src={logo} alt="logo" style={{ height: 28 }} />
              <span><span style={{ color: '#008000' }}>Kitchen</span><span style={{ color: '#FF0000' }}>Stock</span></span>
            </h1>
            <p style={{ margin: '0 12px 0', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--ink-soft)', paddingLeft: 36 }}>STOCK SMART. COOK EASY.</p>
          </div>
          <div style={{ marginLeft: 'auto', position: 'relative' }}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              style={{ width: 34, height: 34, borderRadius: '50%', border: '1.5px solid var(--line)', background: 'var(--card)', fontSize: 16, fontWeight: 700 }}
            >
              ⋯
            </button>
            {menuOpen && (
              <div style={{ position: 'absolute', right: 0, top: 40, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 10, minWidth: 170 }}>
                <div onClick={() => { setMenuOpen(false); navigate('/inventory/add'); }} style={menuItem}>Add item</div>
                <div onClick={() => { setMenuOpen(false); navigate('/alerts'); }} style={{ ...menuItem, borderTop: '1px solid var(--line)' }}>Low stock settings</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '0 20px 14px' }}>
          <input
            className="text-input"
            placeholder="Search egg, bread, cheese..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '0 20px 12px', overflowX: 'auto', scrollbarWidth: 'none', minHeight: 36 }}>
          {[
            { key: 'all', label: `All ${items.length}` },
            { key: 'low', label: 'Low stock' },
            { key: 'ok', label: 'In stock' },
            { key: 'expiring', label: 'Expiring' },
            { key: 'no-min', label: 'Others' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => changeFilter(f.key)}
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                padding: '6px 13px',
                borderRadius: 100,
                border: 'none',
                whiteSpace: 'nowrap',
                background: filter === f.key ? 'var(--terracotta-bg)' : 'transparent',
                color: filter === f.key ? 'var(--terracotta-text)' : 'var(--ink-soft)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && <p style={{ padding: '0 20px', color: 'var(--ink-soft)' }}>Loading…</p>}
        {error && <p className="error-text" style={{ padding: '0 20px' }}>{error}</p>}

        {filtered.map((item) => {
          const status = STATUS_LABEL[item.status];
          const expiryLabel = (() => {
            if (!item.expiry_date || Number(item.quantity) === 0) return null;
            const exp = new Date(item.expiry_date); exp.setHours(0, 0, 0, 0);
            const diff = Math.round((exp - today) / (1000 * 60 * 60 * 24));
            if (diff < 0) return { text: 'Expired', color: 'var(--terracotta-text)' };
            if (diff === 0) return { text: 'Expiring today', color: 'var(--terracotta-text)' };
            if (diff <= 7) return { text: `Expiring in ${diff}d`, color: 'var(--terracotta-text)' };
            return null;
          })();
          return (
            <div
              key={item.id}
              onClick={() => navigate(`/inventory/${item.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 20px',
                borderTop: '1px solid var(--line)',
                cursor: 'pointer',
              }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--tile-yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{CATEGORY_ICON[item.category] || '📦'}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14.5, fontWeight: 700, margin: 0 }}>{item.name}</p>
                <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '2px 0 0' }}>{item.location} · {item.category}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{item.quantity} {item.unit === 'count' ? 'nos' : item.unit}</p>
                <p style={{ fontSize: 11, fontWeight: 600, margin: '2px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                  {expiryLabel && <span style={{ color: expiryLabel.color }}>{expiryLabel.text}</span>}
                  {!expiryLabel && item.low_stock_at !== null ? <span style={{ color: status.color }}>{status.text}</span> : !expiryLabel && <span>&nbsp;</span>}
                </p>
              </div>
            </div>
          );
        })}

        {!loading && filtered.length === 0 && (
          <p style={{ padding: '20px', color: 'var(--ink-soft)', textAlign: 'center' }}>No items found.</p>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

const menuItem = { padding: '12px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' };
