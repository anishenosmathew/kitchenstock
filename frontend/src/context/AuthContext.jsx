import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem('kitchenstock_auth');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (auth) {
      localStorage.setItem('kitchenstock_auth', JSON.stringify(auth));
    } else {
      localStorage.removeItem('kitchenstock_auth');
    }
  }, [auth]);

  async function login(email, password) {
    const data = await api.login({ email, password });
    setAuth(data);
    return data;
  }

  async function signup(name, email, password, inviteCode) {
    const data = await api.signup({ name, email, password, inviteCode });
    setAuth(data);
    return data;
  }

  function logout() {
    setAuth(null);
  }

  function updateUser(user) {
    setAuth((prev) => ({ ...prev, user }));
  }

  function updateKitchen(kitchen) {
    setAuth((prev) => ({ ...prev, kitchen }));
  }

  const value = {
    user: auth?.user || null,
    token: auth?.token || null,
    kitchen: auth?.kitchen || null,
    isLoggedIn: !!auth?.token,
    login,
    signup,
    logout,
    updateUser,
    updateKitchen,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
