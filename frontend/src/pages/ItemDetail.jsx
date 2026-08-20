import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const UNITS = ['g', 'kg', 'ml', 'L', 'nos'];
const LOCATIONS = ['Pantry', 'Fridge', 'Freezer'];
const CATEGORIES = ['Others', 'Dairy', 'Fruits', 'Spices', 'Vegetables'];

function fmt(qty, unit) {
  const u = unit === 'count' ? 'nos' : unit;
  return `${qty} ${u}`;
}

export default function ItemDetail() {
  const { itemId } = useParams();
  const { token, kitchen } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [qtyError, setQtyError] = useState('');
  const [form, setForm] = useState({});
  const [qtyInput, setQtyInput] = useState('');
  const [qtyFocused, setQtyFocused] = useState(false);
  const [qtyDirty, setQtyDirty] = useState(false);

  useEffect(() => {
    api.getItem(kitchen.id, itemId, token).then((data) => {
      const it = data.item;
      setItem(it);
      setForm({
        name: it.name,
        category: it.category,
        location: it.location,
        unit: it.unit === 'count' ? 'nos' : it.unit,
        lowStockAt: it.low_stock_at ?? '',
        lowStockUnit: it.low_stock_unit ? (it.low_stock_unit === 'count' ? 'nos' : it.low_stock_unit) : (it.unit === 'count' ? 'nos' : it.unit),
        expiryDate: it.expiry_date ? it.expiry_date.slice(0, 10) : '',
      });
    });
  }, [kitchen, itemId, token]);

  async function handleSave() {
    if (qtyFocused && qtyInput === '') { setQtyError('Please enter a valid quantity.'); return; }
    const raw = qtyInput !== '' ? qtyInput : String(item.quantity);
    const parsed = Number(raw);
    if (isNaN(parsed) || parsed < 0) { setQtyError('Please enter a valid quantity.'); return; }
    setQtyError('');
    setBusy(true);
    try {
      const delta = parsed - Number(item.quantity);
      if (delta !== 0) await api.adjustQuantity(kitchen.id, itemId, { delta }, token);
      await api.updateItem(kitchen.id, itemId, {
        name: form.name,
        category: form.category,
        location: form.location,
        unit: form.unit === 'nos' ? 'count' : form.unit,
        lowStockAt: form.lowStockAt === '' ? null : Number(form.lowStockAt),
        lowStockUnit: form.lowStockUnit === 'nos' ? 'count' : form.lowStockUnit,
        expiryDate: form.expiryDate || null,
      }, token);
      navigate('/inventory');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await api.deleteItem(kitchen.id, itemId, token);
      navigate('/inventory');
    } finally {
      setBusy(false);
    }
  }

  function step(delta) {
    if (busy) return;
    const current = qtyFocused ? (qtyInput !== '' ? Number(qtyInput) : Number(item.quantity)) : Number(item.quantity);
    const next = Math.max(0, current + delta);
    setQtyInput(String(next));
    setQtyFocused(true);
    setQtyDirty(true);
  }

  if (!item) return <div className="app-shell" style={{ padding: 20 }}>Loading…</div>;

  const currentQty = qtyFocused ? (qtyInput !== '' ? Number(qtyInput) : Number(item.quantity)) : Number(item.quantity);
  const isLow = item.low_stock_at !== null && currentQty <= Number(item.low_stock_at);

  return (
    <div className="app-shell">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 8px' }}>
        <button onClick={() => navigate(-1)} style={iconBtn}>←</button>
      </div>

      <div style={{ padding: '6px 24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <input
            className="text-input"
            value={form.name || ''}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={{ fontSize: 22, fontWeight: 800, padding: '4px 0', border: 'none', background: 'transparent', outline: 'none', flex: 1 }}
          />
          <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 100, background: isLow ? 'var(--terracotta-bg)' : 'transparent', color: isLow ? 'var(--terracotta-text)' : 'transparent', whiteSpace: 'nowrap' }}>
            Low stock
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '2px 0 0' }}>{form.location} · {form.category}</p>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Quantity */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 20, padding: 20 }}>
          <p className="field-label" style={{ marginBottom: 12 }}>Current quantity</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <button onClick={() => step(-1)} disabled={busy} style={stepBtn}>−</button>
            <span style={{ fontSize: 34, fontWeight: 800, minWidth: 70, textAlign: 'center', display: 'inline-flex', alignItems: 'baseline', justifyContent: 'center' }}>
              <input
                type="number"
                value={qtyFocused ? qtyInput : item.quantity}
                onChange={(e) => { setQtyInput(e.target.value); setQtyDirty(true); }}
                onFocus={() => { setQtyFocused(true); if (!qtyDirty) setQtyInput(String(item.quantity)); }}
                style={{ fontSize: 34, fontWeight: 800, width: 70, textAlign: 'center', border: 'none', background: 'transparent', outline: 'none', padding: 0 }}
              />
              <span style={{ fontSize: 14, marginLeft: 2 }}>{form.unit || (item.unit === 'count' ? 'nos' : item.unit)}</span>
            </span>
            <button onClick={() => step(1)} disabled={busy} style={stepBtn}>+</button>
          </div>
          {qtyError && <p style={{ fontSize: 12, color: 'var(--terracotta-text)', margin: '8px 0 0' }}>{qtyError}</p>}
          {item.low_stock_at !== null && (
            <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
              Low stock alert at <b style={{ color: 'var(--terracotta-text)' }}>{fmt(item.low_stock_at, item.low_stock_unit)}</b>
            </p>
          )}
        </div>

        {/* Details */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: 16 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <p className="field-label">Category</p>
              <select className="unit-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <p className="field-label">Location</p>
              <select className="unit-select" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
                {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <p className="field-label">Low stock at</p>
              <input className="text-input" type="number" placeholder="e.g. 5" value={form.lowStockAt} onChange={(e) => setForm({ ...form, lowStockAt: e.target.value })} />
            </div>
            <div style={{ flex: 1 }}>
              <p className="field-label">Unit</p>
              <select className="unit-select" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <p className="field-label">Expiry date</p>
              <input className="text-input" type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
            </div>
            <div style={{ flex: 1 }}>
              <p className="field-label">Last restocked</p>
              <p style={{ fontSize: 14, fontWeight: 700, margin: '10px 0 0' }}>{item.last_restocked_at ? new Date(item.last_restocked_at).toLocaleDateString() : '—'}</p>
            </div>
          </div>
        </div>

        {/* Info tiles */}


        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0 24px' }}>
          <button className="btn-primary" onClick={handleSave} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          <button onClick={() => setConfirmDelete(true)} style={{ width: '100%', padding: '13px', borderRadius: 14, border: '1.5px solid var(--terracotta-text)', background: 'transparent', color: 'var(--terracotta-text)', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Remove item</button>
          <button className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </div>

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }}>
          <div style={{ width: '100%', background: 'var(--cream)', borderRadius: '20px 20px 0 0', padding: '28px 20px 36px' }}>
            <p style={{ fontSize: 17, fontWeight: 800, margin: '0 0 6px', textAlign: 'center' }}>Remove item?</p>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', textAlign: 'center', margin: '0 0 24px' }}>"{item.name}" will be permanently deleted from your inventory.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={handleDelete} disabled={busy} style={{ width: '100%', padding: '13px', borderRadius: 14, border: 'none', background: 'var(--terracotta-text)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                {busy ? 'Removing…' : 'Yes, remove'}
              </button>
              <button onClick={() => setConfirmDelete(false)} style={{ width: '100%', padding: '13px', borderRadius: 14, border: '1.5px solid var(--line)', background: 'transparent', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const stepBtn = {
  width: 40, height: 40, borderRadius: '50%', border: '1.5px solid var(--line)',
  background: 'var(--cream)', fontSize: 20, fontWeight: 600,
};
const iconBtn = {
  width: 34, height: 34, borderRadius: '50%', border: '1.5px solid var(--line)',
  background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
