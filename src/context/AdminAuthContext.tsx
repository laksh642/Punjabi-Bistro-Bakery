import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { adminSupabase, verifyIsAdminUser } from '../lib/supabase';

const ADMIN_TOKEN_KEY = 'pb_admin_session_token';

export interface AdminAuthContextType {
  isAuthenticated: boolean;
  adminUser: User | null;
  adminUsername: string | null;
  adminEmail: string | null;
  isLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  loginWithPassword: (emailOrUsername: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
  getAuthToken: () => string | null;
  // Aliases for backwards-compatibility
  login: (username: string, password: string, securityKey?: string) => Promise<boolean>;
  loginStep1: (username: string, password: string) => Promise<{ success: boolean; step1Token?: string; error?: string }>;
  loginStep2: (step1Token: string, securityKey: string) => Promise<{ success: boolean; error?: string }>;
  recoverAccount: (recoveryToken: string, newUsername: string, newPassword: string, newSecurityKey: string) => Promise<{ success: boolean; error?: string }>;
  isAuthorized: boolean;
  signOut: () => Promise<void>;
  user: { email: string } | null;
  adminRole: string | null;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const getAuthToken = useCallback((): string | null => {
    try {
      return localStorage.getItem(ADMIN_TOKEN_KEY);
    } catch {
      return null;
    }
  }, []);

  // Helper: verify and apply session
  const applySession = useCallback(async (session: Session | null): Promise<boolean> => {
    if (!session || !session.user) {
      setAdminUser(null);
      setAdminEmail(null);
      setIsAuthenticated(false);
      try {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem('pb_admin_username');
      } catch {}
      return false;
    }

    const email = session.user.email || '';
    const isAuthorized = await verifyIsAdminUser(email);

    if (isAuthorized) {
      setAdminUser(session.user);
      setAdminEmail(email);
      setIsAuthenticated(true);
      setAuthError(null);
      try {
        localStorage.setItem(ADMIN_TOKEN_KEY, session.access_token);
        localStorage.setItem('pb_admin_username', email);
      } catch {}
      return true;
    } else {
      // Authenticated with Supabase, but not an authorized admin
      await adminSupabase.auth.signOut();
      setAdminUser(null);
      setAdminEmail(null);
      setIsAuthenticated(false);
      try {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem('pb_admin_username');
      } catch {}
      return false;
    }
  }, []);

  // Check existing session on mount and subscribe to auth state changes
  useEffect(() => {
    let isMounted = true;

    async function initAdminAuth() {
      try {
        const { data: { session } } = await adminSupabase.auth.getSession();
        if (!isMounted) return;
        if (session) {
          await applySession(session);
        } else {
          setIsAuthenticated(false);
          setAdminUser(null);
          setAdminEmail(null);
        }
      } catch (err) {
        console.warn('AdminAuth session check notice:', err);
        if (isMounted) {
          setIsAuthenticated(false);
          setAdminUser(null);
          setAdminEmail(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAdminAuth();

    const { data: { subscription } } = adminSupabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      await applySession(session);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      const { data: { session } } = await adminSupabase.auth.getSession();
      await applySession(session);
    } catch {
      setIsAuthenticated(false);
      setAdminUser(null);
      setAdminEmail(null);
    }
  }, [applySession]);

  // Primary Login Method: Email or Username + Password via Supabase Auth
  const loginWithPassword = async (
    emailOrUsername: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    setIsLoading(true);

    try {
      const cleanInput = emailOrUsername.trim();
      if (!cleanInput || !password) {
        const msg = 'Please enter your administrator email/username and password.';
        setAuthError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }

      // Automatically normalize username to email if no @ provided
      const email = cleanInput.includes('@')
        ? cleanInput.toLowerCase()
        : `${cleanInput.toLowerCase()}@punjabibistro.com`;

      // 1. Supabase Auth Verification (GoTrue bcrypt)
      const { data, error } = await adminSupabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user || !data.session) {
        const msg =
          error?.message === 'Invalid login credentials'
            ? 'Invalid administrator credentials. Please check your username/email and password.'
            : error?.message || 'Authentication failed. Please verify your administrator credentials.';
        setAuthError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }

      // 2. Authoritative Authorization Check
      const authorized = await applySession(data.session);
      if (!authorized) {
        const msg = 'Access Denied: This account is not registered as an authorized administrator.';
        setAuthError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Unable to connect to authentication service. Please check your connection.';
      setAuthError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  // Google OAuth Login for Owner
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    try {
      const { error } = await adminSupabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/admin',
        },
      });

      if (error) {
        setAuthError(error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Failed to initiate Google authentication.';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  // Admin Logout
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await adminSupabase.auth.signOut();
    } catch {
      // ignore
    }
    setAdminUser(null);
    setAdminEmail(null);
    setIsAuthenticated(false);
    setAuthError(null);
    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem('pb_admin_username');
    } catch {}
    setIsLoading(false);
  };

  // Update Password directly in Supabase Auth
  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!newPassword || newPassword.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters.' };
      }

      const { error } = await adminSupabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update password.' };
    }
  };

  // Compatibility aliases
  const login = async (username: string, password: string): Promise<boolean> => {
    const res = await loginWithPassword(username, password);
    return res.success;
  };

  const loginStep1 = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; step1Token?: string; error?: string }> => {
    const res = await loginWithPassword(username, password);
    return { success: res.success, step1Token: res.success ? 'supabase-auth-token' : undefined, error: res.error };
  };

  const loginStep2 = async (): Promise<{ success: boolean; error?: string }> => {
    return { success: isAuthenticated };
  };

  const recoverAccount = async (
    _token: string,
    username: string,
    newPass: string
  ): Promise<{ success: boolean; error?: string }> => {
    return loginWithPassword(username, newPass);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated,
        adminUser,
        adminUsername: adminEmail || 'Administrator',
        adminEmail,
        isLoading,
        authError,
        clearAuthError,
        loginWithPassword,
        loginWithGoogle,
        logout,
        updatePassword,
        refreshSession,
        getAuthToken,
        // Aliases
        login,
        loginStep1,
        loginStep2,
        recoverAccount,
        isAuthorized: isAuthenticated,
        signOut: logout,
        user: adminEmail ? { email: adminEmail } : null,
        adminRole: 'owner',
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
