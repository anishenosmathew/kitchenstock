import { useEffect } from 'react';

export default function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--ink)', color: 'var(--cream)', fontSize: 13, fontWeight: 600,
      padding: '10px 20px', borderRadius: 100, zIndex: 999, whiteSpace: 'nowrap',
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    }}>
      {message}
    </div>
  );
}
