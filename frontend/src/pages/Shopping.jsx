import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import BottomNav from '../components/BottomNav';
import logo from '../images/logo.png';

const CATEGORY_ICON = {
  Spices: '🧂',
  Vegetables: '🥦',
  Fruits: '🍎',
  Dairy: '🥛',
  Others: '📦',
};

export default function Shopping() {
  const { token, kitchen } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!kitchen) return;
    api.getShoppingList(kitchen.id, token).then((data) => setItems(data.items));
  }, [kitchen, token]);

  const shareText = items.map((i) => `• ${i.name} — ${i.quantity}${i.unit}`).join('\n');
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(`KitchenStock shopping list:\n\n${shareText}`)}`;

  return (
    <div className="app-shell">
      <div className="page-content">
        <div style={{ padding: '18px 20px 4px' }}>
          <div onClick={() => navigate('/inventory')} style={{ cursor: 'pointer' }}>
            <h1 style={{ fontSize: 19, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src={logo} alt="logo" style={{ height: 28 }} />
              <span><span style={{ color: '#008000' }}>Kitchen</span><span style={{ color: '#FF0000' }}>Stock</span></span>
            </h1>
            <p style={{ margin: '0 12px', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--ink-soft)', paddingLeft: 36 }}>STOCK SMART. COOK EASY.</p>
          </div>
        </div>
        <p style={{ padding: '10px 20px', fontSize: 13, color: 'var(--ink-soft)' }}>
          {items.length} items currently below their low stock level
        </p>

        <p className="field-label" style={{ padding: '4px 20px 8px' }}>To buy</p>
        {items.map((item) => (
          <div key={item.id} style={{ padding: '12px 20px', borderTop: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--tile-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{CATEGORY_ICON[item.category] || '📦'}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14.5, fontWeight: 700, margin: 0 }}>{item.name}</p>
                <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '2px 0 0' }}>{item.location} · {item.category}</p>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{item.quantity} {item.unit === 'count' ? 'nos' : item.unit}</p>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <p style={{ padding: '20px', color: 'var(--ink-soft)', textAlign: 'center' }}>Nothing is low right now 🎉</p>
        )}

        {items.length > 0 && (
          <div style={{ padding: '16px 20px' }}>
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '100%', padding: '14px 0', borderRadius: 14,
                background: '#25D366', color: '#fff', fontSize: 14.5, fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Share list to WhatsApp
            </a>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
