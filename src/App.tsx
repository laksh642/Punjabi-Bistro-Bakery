import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { CustomerAuthProvider } from './context/CustomerAuthContext';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { MyOrdersModal } from './components/MyOrdersModal';
import { CustomerAccountModal } from './components/CustomerAccountModal';
import { StorefrontPage } from './pages/StorefrontPage';
import { AdminPage } from './pages/AdminPage';
import { AuthCallbackHandler } from './pages/AuthCallbackHandler';

// Handles backwards-compatibility for any legacy hash links (e.g. /#/admin -> /admin)
function HashRedirector() {
  const navigate = useNavigate();
  useEffect(() => {
    if (window.location.hash.startsWith('#/')) {
      const targetPath = window.location.hash.slice(1);
      if (targetPath) {
        navigate(targetPath, { replace: true });
      }
    }
  }, [navigate]);
  return null;
}

export default function App() {
  return (
    <StoreProvider>
      <AdminAuthProvider>
        <CustomerAuthProvider>
          <BrowserRouter>
            <HashRedirector />
            <Routes>
              <Route path="/" element={<StorefrontPage />} />
              <Route path="/auth/callback" element={<AuthCallbackHandler />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/orders" element={<Navigate to="/" replace />} />
              <Route path="/orders/:token" element={<Navigate to="/" replace />} />
              <Route path="/tracking" element={<Navigate to="/" replace />} />
              <Route path="/tracking/:token" element={<Navigate to="/" replace />} />
              <Route path="/track" element={<Navigate to="/" replace />} />
              <Route path="/track/:token" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            {/* Global Customer Modals */}
            <CustomerAuthModal />
            <MyOrdersModal />
            <CustomerAccountModal />
          </BrowserRouter>
        </CustomerAuthProvider>
      </AdminAuthProvider>
    </StoreProvider>
  );
}
