import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Inventory from './pages/Inventory';
import ItemDetail from './pages/ItemDetail';
import Shopping from './pages/Shopping';
import Account from './pages/Account';
import AddItem from './pages/AddItem';
import Household from './pages/Household';
import EditProfile from './pages/EditProfile';
import ChangePassword from './pages/ChangePassword';
import LowStockAlerts from './pages/LowStockAlerts';
import JoinKitchen from './pages/JoinKitchen';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
          <Route path="/inventory/add" element={<ProtectedRoute><AddItem /></ProtectedRoute>} />
          <Route path="/inventory/:itemId" element={<ProtectedRoute><ItemDetail /></ProtectedRoute>} />
          <Route path="/shopping" element={<ProtectedRoute><Shopping /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
          <Route path="/account/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path="/account/password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          <Route path="/household" element={<ProtectedRoute><Household /></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><LowStockAlerts /></ProtectedRoute>} />
          <Route path="/join-kitchen" element={<ProtectedRoute><JoinKitchen /></ProtectedRoute>} />

          <Route path="/" element={<Navigate to="/inventory" replace />} />
          <Route path="*" element={<Navigate to="/inventory" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
