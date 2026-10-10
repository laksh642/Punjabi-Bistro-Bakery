import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, fetchCustomerProfileFromCloud, saveCustomerProfileToCloud } from '../lib/supabase';
import { CustomerProfile } from '../types';

interface CustomerAuthContextType {
  user: User | null;
  session: Session | null;
  customerProfile: CustomerProfile | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isMyOrdersOpen: boolean;
  setIsMyOrdersOpen: (open: boolean) => void;
  isAccountModalOpen: boolean;
  setIsAccountModalOpen: (open: boolean) => void;
  selectedOrderNumberForModal: string | null;
  setSelectedOrderNumberForModal: (orderNum: string | null) => void;
  openMyOrdersWithOrder: (orderNum: string) => void;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string; url?: string }>;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  logoutCustomer: () => Promise<void>;
  updateCustomerProfile: (data: Partial<CustomerProfile>) => Promise<boolean>;
  openLoginModal: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [selectedOrderNumberForModal, setSelectedOrderNumberForModal] = useState<string | null>(null);

  const openMyOrdersWithOrder = useCallback((orderNum: string) => {
    setSelectedOrderNumberForModal(orderNum);
    setIsMyOrdersOpen(true);
  }, []);

  // Synchronize customer profile from cloud database
  const loadProfile = useCallback(async (currentUserId: string, currentUserEmail?: string, currentName?: string) => {
    try {
      let profile = await fetchCustomerProfileFromCloud(currentUserId);
      if (!profile) {
        // Construct standard default profile for Dharamkot delivery
        profile = {
          userId: currentUserId,
          fullName: currentName || currentUserEmail?.split('@')[0] || 'Customer',
          email: currentUserEmail || '',
          city: 'Dharamkot',
          state: 'Punjab',
          pincode: '142042',
        };
        await saveCustomerProfileToCloud(profile);
      }
      setCustomerProfile(profile);
    } catch (err) {
      console.warn('Customer loadProfile notice:', err);
    }
  }, []);

  // Initialize and synchronize Supabase Auth Session
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user && mounted) {
          setSession(sessionData.session);
          setUser(sessionData.session.user);
          const metaName =
            sessionData.session.user.user_metadata?.full_name ||
            sessionData.session.user.user_metadata?.name;
          await loadProfile(sessionData.session.user.id, sessionData.session.user.email, metaName);
        }
      } catch (err) {
        console.warn('Customer auth initialization notice:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initAuth();

    // Standard Supabase auth state change subscription
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);
        const metaName =
          newSession.user.user_metadata?.full_name || newSession.user.user_metadata?.name;
        await loadProfile(newSession.user.id, newSession.user.email, metaName);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setCustomerProfile(null);
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [loadProfile]);

  /**
   * Initiates standard Google OAuth redirection.
   * Directs user to Supabase OAuth with callback to /auth/callback
   */
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string; url?: string }> => {
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        console.error('Google OAuth sign-in error:', error);
        return { success: false, error: error.message };
      }

      if (data?.url) {
        // Direct browser navigation to Google OAuth provider
        window.location.href = data.url;
        return { success: true, url: data.url };
      }

      return { success: true };
    } catch (err: any) {
      console.error('Google sign-in exception:', err);
      return { success: false, error: err?.message || 'Failed to initialize Google Sign-in' };
    }
  };

  /**
   * Standard Email sign-in
   */
  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      if (data?.session?.user) {
        setSession(data.session);
        setUser(data.session.user);
        const metaName =
          data.session.user.user_metadata?.full_name ||
          data.session.user.user_metadata?.name;
        await loadProfile(data.session.user.id, data.session.user.email, metaName);
        setIsAuthModalOpen(false);
        return { success: true };
      }
      return { success: false, error: 'Sign-in failed. Please try again.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to sign in' };
    }
  };

  /**
   * Standard Email sign-up
   */
  const signUpWithEmail = async (email: string, password: string, fullName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            name: fullName.trim(),
          },
        },
      });
      if (error) {
        return { success: false, error: error.message };
      }
      if (data?.session?.user) {
        setSession(data.session);
        setUser(data.session.user);
        await loadProfile(data.session.user.id, data.session.user.email, fullName.trim());
        setIsAuthModalOpen(false);
        return { success: true };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to create customer account' };
    }
  };

  /**
   * Customer sign-out
   */
  const logoutCustomer = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Customer signOut notice:', err);
    }
    setUser(null);
    setSession(null);
    setCustomerProfile(null);
    setIsMyOrdersOpen(false);
    setIsAccountModalOpen(false);
  };

  /**
   * Update and persist customer profile
   */
  const updateCustomerProfile = async (data: Partial<CustomerProfile>): Promise<boolean> => {
    if (!user) return false;
    const updated: CustomerProfile = {
      ...(customerProfile || {
        userId: user.id,
        fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer',
        email: user.email || '',
        city: 'Dharamkot',
        state: 'Punjab',
        pincode: '142042',
      }),
      ...data,
      userId: user.id,
    };

    const success = await saveCustomerProfileToCloud(updated);
    if (success) {
      setCustomerProfile(updated);
      return true;
    }
    return false;
  };

  const openLoginModal = () => setIsAuthModalOpen(true);

  return (
    <CustomerAuthContext.Provider
      value={{
        user,
        session,
        customerProfile,
        isLoading,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isMyOrdersOpen,
        setIsMyOrdersOpen,
        isAccountModalOpen,
        setIsAccountModalOpen,
        selectedOrderNumberForModal,
        setSelectedOrderNumberForModal,
        openMyOrdersWithOrder,
        loginWithGoogle,
        loginWithEmail,
        signUpWithEmail,
        logoutCustomer,
        updateCustomerProfile,
        openLoginModal,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};
