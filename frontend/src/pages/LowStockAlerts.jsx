import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const UNITS = ['g', 'kg', 'ml', 'L', 'nos'];

export default function LowStockAlerts() {
  const { token, kitchen } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [edits, setEdits] = useState({}); // itemId -> { lowStockAt, lowStockUnit }
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!kitchen) { setLoading(false); return; }
    api
      .getInventory(kitchen.id, token)
      .then((data) => setItems(data.items))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [kitchen, token]);

  function setEdit(itemId, field, value) {
    setEdits((prev) => ({
      ...prev,
      [itemId]: { ...currentValues(itemId), [field]: value },
    }));
  }

  function currentValues(itemId) {
    if (edits[itemId]) return edits[itemId];
    const item = items.find((i) => i.id === itemId);
    return { lowStockAt: item?.low_stock_at ?? '', lowStockUnit: item?.low_stock_unit ?? item?.unit };
  }

  const grouped = items
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    .reduce((acc, item) => {
      acc[item.category] = acc[item.category] || [];
      acc[item.category].push(item);
      return acc;
    }, {});

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const changedIds = Object.keys(edits);
      await Promise.all(
        changedIds.map((itemId) => {
          const { lowStockAt, lowStockUnit } = edits[itemId];
          return api.updateThreshold(
            kitchen.id,
            itemId,
            { lowStockAt: lowStockAt === '' ? null : Number(lowStockAt), lowStockUnit },
            token
          );
        })
      );
      navigate(-1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="page-content" style={{ paddingBottom: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '20px 20px 8px' }}>
          <button onClick={() => navigate(-1)} style={iconBtn}>←</button>
          <span style={{ fontSize: 15, fontWeight: 700, marginLeft: 12 }}>Low stock settings</span>
        </div>

        <p style={{ padding: '2px 20px 14px', fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
          Set how much of each item should be left before it shows as "Low stock."
        </p>

        <div style={{ padding: '0 20px 12px' }}>
          <input
            className="text-input"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && <p style={{ padding: '0 20px', color: 'var(--ink-soft)' }}>Loading…</p>}
        {error && <p className="error-text" style={{ padding: '0 20px' }}>{error}</p>}

        {Object.entries(grouped).map(([category, categoryItems]) => (
          <div key={category}>
            <p className="field-label" style={{ padding: '14px 20px 6px' }}>{category}</p>
            <div style={{ padding: '0 20px' }}>
              {categoryItems.map((item) => {
                const { lowStockAt, lowStockUnit } = currentValues(item.id);
                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14, padding: '10px 12px', marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                      <p style={{ fontSize: 11.5, color: 'var(--ink-soft)', margin: '1px 0 0' }}>{item.location}</p>
                    </div>
                    <input
                      type="number"
                      value={lowStockAt}
                      onChange={(e) => setEdit(item.id, 'lowStockAt', e.target.value)}
                      style={{ width: 60, fontSize: 14, fontWeight: 700, textAlign: 'center', padding: '9px 4px', borderRadius: 10, border: '1.5px solid var(--line)', background: 'var(--cream)', color: 'var(--ink)' }}
                    />
                    <select
                      value={lowStockUnit}
                      onChange={(e) => setEdit(item.id, 'lowStockUnit', e.target.value)}
                      style={{ width: 76, fontSize: 12.5, fontWeight: 600, padding: '9px 6px', borderRadius: 10, border: '1.5px solid var(--line)', background: 'var(--cream)', color: 'var(--ink)' }}
                    >
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {!loading && items.length === 0 && (
          <p style={{ padding: '20px', color: 'var(--ink-soft)', textAlign: 'center' }}>No items yet.</p>
        )}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 420, margin: '0 auto', padding: '16px 20px', background: 'var(--cream)', borderTop: '1px solid var(--line)' }}>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

const iconBtn = {
  width: 34, height: 34, borderRadius: '50%', border: '1.5px solid var(--line)',
  background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
