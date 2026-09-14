import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { StorefrontPage } from './pages/StorefrontPage';
import { AdminPage } from './pages/AdminPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<StorefrontPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/orders" element={<OrderTrackingPage />} />
          <Route path="/tracking" element={<OrderTrackingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </StoreProvider>
  );
}
