import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/inventory', label: 'Inventory', icon: '📋' },
  { to: '/shopping', label: 'Shopping', icon: '🛒' },
  { to: '/account', label: 'Account', icon: '👤' },
];

export default function BottomNav() {
  return (
    <nav style={styles.tabbar}>
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          style={({ isActive }) => ({
            ...styles.tab,
            color: isActive ? 'var(--ink)' : 'var(--ink-soft)',
            fontWeight: isActive ? 600 : 400,
          })}
        >
          <span style={{ fontSize: 18 }}>{tab.icon}</span>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}

const styles = {
  tabbar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    maxWidth: 420,
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-around',
    padding: '12px 0',
    background: 'var(--cream)',
    borderTop: '1px solid var(--line)',
  },
  tab: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    fontSize: 11,
    textDecoration: 'none',
  },
};
