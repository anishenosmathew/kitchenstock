import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const UNITS = ['g', 'kg', 'ml', 'L', 'nos'];
const LOCATIONS = ['Pantry', 'Fridge', 'Freezer'];
const CATEGORIES = ['Others', 'Dairy', 'Fruits', 'Spices', 'Vegetables'];

export default function AddItem() {
  const { token, kitchen } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('g');
  const [location, setLocation] = useState('Pantry');
  const [category, setCategory] = useState('Others');
  const [lowStockAt, setLowStockAt] = useState('');
  const [lowStockUnit, setLowStockUnit] = useState('g');
  const [expiryDate, setExpiryDate] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Item name is required.');
      return;
    }

    setSaving(true);
    try {
      await api.createItem(
        kitchen.id,
        {
          name: name.trim(),
          quantity: Number(quantity) || 0,
          unit,
          location,
          category,
          lowStockAt: lowStockAt === '' ? null : Number(lowStockAt),
          lowStockUnit,
          expiryDate: expiryDate || null,
        },
        token
      );
      navigate('/inventory');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 8px' }}>
        <button onClick={() => navigate(-1)} style={iconBtn}>✕</button>
        <span style={{ fontSize: 15, fontWeight: 700 }}>Add item</span>
        <div style={{ width: 36 }} />
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '12px 20px 0' }}>
        <div className="field">
          <p className="field-label">Item name</p>
          <input className="text-input" placeholder="e.g. Turmeric powder" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <p className="field-label">Quantity</p>
            <input className="text-input" type="number" placeholder="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div className="field" style={{ maxWidth: 110, marginBottom: 0 }}>
            <p className="field-label">Unit</p>
            <select className="unit-select" value={unit} onChange={(e) => setUnit(e.target.value)}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <p className="field-label">Location</p>
            <select className="unit-select" value={location} onChange={(e) => setLocation(e.target.value)}>
              {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <p className="field-label">Category</p>
            <select className="unit-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
          <div className="field" style={{ flex: 1 }}>
            <p className="field-label">Low stock alert (optional)</p>
            <input className="text-input" type="number" placeholder="e.g. 5" value={lowStockAt} onChange={(e) => setLowStockAt(e.target.value)} />
          </div>
          <div className="field" style={{ maxWidth: 110 }}>
            <p className="field-label">Unit</p>
            <select className="unit-select" value={lowStockUnit} onChange={(e) => setLowStockUnit(e.target.value)}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div className="field">
          <p className="field-label">Expiry date (optional)</p>
          <input className="text-input" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
        </div>

        {error && <p className="error-text">{error}</p>}

        <div style={{ padding: '14px 0 20px' }}>
          <button className="btn-primary" disabled={saving}>
            {saving ? 'Adding…' : 'Add to inventory'}
          </button>
        </div>
      </form>
    </div>
  );
}

const iconBtn = {
  width: 36, height: 36, borderRadius: '50%', border: '1.5px solid var(--line)',
  background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
