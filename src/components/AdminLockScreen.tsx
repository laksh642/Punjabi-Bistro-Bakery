import React from 'react';
import { AdminLoginScreen } from './AdminLoginScreen';

/**
 * AdminLockScreen delegates directly to the private AdminLoginScreen.
 */
export const AdminLockScreen: React.FC = () => {
  return <AdminLoginScreen />;
};

export default AdminLockScreen;
