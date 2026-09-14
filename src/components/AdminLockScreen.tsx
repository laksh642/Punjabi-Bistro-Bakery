import React from 'react';
import { AdminLoginScreen } from './AdminLoginScreen';
import { useAdminAuth } from '../context/AdminAuthContext';

/**
 * AdminLockScreen has been upgraded from legacy password-lock to Google OAuth Authentication.
 * Retained for backwards-compatibility.
 */
export const AdminLockScreen: React.FC = () => {
  const { signInWithGoogle, authError } = useAdminAuth();
  return <AdminLoginScreen onSignIn={signInWithGoogle} authError={authError} />;
};

export default AdminLockScreen;
