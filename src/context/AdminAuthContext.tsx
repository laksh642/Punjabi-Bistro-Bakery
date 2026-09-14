import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, signInWithGoogle, signOutAdmin, checkAdminAuthorization } from '../lib/supabase';
import { AdminUser } from '../types';

interface AdminAuthContextType {
  user: User | null;
  session: Session | null;
  adminRecord: AdminUser | null;
  adminRole: string | null;
  isAuthorized: boolean;
  isLoading: boolean;
  isCheckingAuth: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuthorization: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [adminRecord, setAdminRecord] = useState<AdminUser | null>(null);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const verifyAuthorization = useCallback(async (userId: string) => {
    setIsCheckingAuth(true);
    try {
      const authResult = await checkAdminAuthorization(userId);
      if (authResult.isAuthorized) {
        setIsAuthorized(true);
        setAdminRole(authResult.role);
        setAdminRecord(authResult.adminRecord);
        setAuthError(null);
      } else {
        setIsAuthorized(false);
        setAdminRole(null);
        setAdminRecord(null);
        if (authResult.error) {
          console.warn('Admin authorization notice:', authResult.error);
        }
      }
    } catch (err: unknown) {
      console.error('Failed to verify admin authorization:', err);
      setIsAuthorized(false);
      setAdminRole(null);
      setAdminRecord(null);
      setAuthError(err instanceof Error ? err.message : 'Failed to verify admin status');
    } finally {
      setIsCheckingAuth(false);
    }
  }, []);

  // Initialize session and listen to Supabase Auth state changes
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      setAuthError('Supabase is not configured. Please check environment variables.');
      return;
    }

    let isMounted = true;

    async function initSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Error fetching Supabase session:', error.message);
          if (isMounted) {
            setUser(null);
            setSession(null);
            setIsAuthorized(false);
          }
        } else if (data?.session?.user) {
          if (isMounted) {
            setSession(data.session);
            setUser(data.session.user);
            await verifyAuthorization(data.session.user.id);
          }
        } else {
          if (isMounted) {
            setUser(null);
            setSession(null);
            setIsAuthorized(false);
            setAdminRecord(null);
          }
        }
      } catch (err) {
        console.error('Session init error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    // Subscribe to auth state updates (e.g. login redirect completion, logout, token refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          await verifyAuthorization(currentSession.user.id);
        } else {
          setIsAuthorized(false);
          setAdminRecord(null);
        }
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setIsAuthorized(false);
        setAdminRecord(null);
        setAdminRole(null);
        setAuthError(null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [verifyAuthorization]);

  const handleSignInWithGoogle = async () => {
    setAuthError(null);
    const { error } = await signInWithGoogle('/admin');
    if (error) {
      setAuthError(error.message);
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    const { error } = await signOutAdmin();
    if (error) {
      setAuthError(error.message);
    }
    setUser(null);
    setSession(null);
    setIsAuthorized(false);
    setAdminRecord(null);
    setAdminRole(null);
  };

  const handleRefresh = async () => {
    if (user?.id) {
      await verifyAuthorization(user.id);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        session,
        adminRecord,
        adminRole,
        isAuthorized,
        isLoading,
        isCheckingAuth,
        authError,
        signInWithGoogle: handleSignInWithGoogle,
        signOut: handleSignOut,
        refreshAuthorization: handleRefresh,
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
