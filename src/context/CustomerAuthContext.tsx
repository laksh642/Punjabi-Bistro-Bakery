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
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithDemoCustomer: (demo?: { name?: string; email?: string; phone?: string; address?: string }) => void;
  logoutCustomer: () => Promise<void>;
  updateCustomerProfile: (data: Partial<CustomerProfile>) => Promise<boolean>;
  openLoginModal: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

const DEMO_USER_STORAGE_KEY = 'pb_demo_customer_user';

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Helper to load profile for a user
  const loadProfile = useCallback(async (currentUserId: string, currentUserEmail?: string, currentName?: string) => {
    try {
      let profile = await fetchCustomerProfileFromCloud(currentUserId);
      if (!profile) {
        // Construct default profile from OAuth metadata
        profile = {
          userId: currentUserId,
          fullName: currentName || currentUserEmail?.split('@')[0] || 'Customer',
          email: currentUserEmail || '',
          city: 'Dharamkot',
          state: 'Himachal Pradesh',
          pincode: '176219',
        };
        await saveCustomerProfileToCloud(profile);
      }
      setCustomerProfile(profile);
    } catch (err) {
      console.warn('Customer loadProfile notice:', err);
    }
  }, []);

  // Initialize Supabase Auth Session
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
          setIsLoading(false);
          return;
        }

        // Check for local demo user if no Supabase session exists
        const savedDemo = localStorage.getItem(DEMO_USER_STORAGE_KEY);
        if (savedDemo && mounted) {
          try {
            const parsed = JSON.parse(savedDemo);
            setUser(parsed.user);
            setCustomerProfile(parsed.profile);
          } catch {}
        }
      } catch (err) {
        console.warn('Auth initialization notice:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initAuth();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);
        // Clear any demo session
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);
        const metaName =
          newSession.user.user_metadata?.full_name || newSession.user.user_metadata?.name;
        await loadProfile(newSession.user.id, newSession.user.email, metaName);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setCustomerProfile(null);
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [loadProfile]);

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const redirectUrl = window.location.origin;
      const isIframe = window.self !== window.top;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: isIframe,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Google OAuth sign-in error:', error);
        return { success: false, error: error.message };
      }

      if (isIframe && data?.url) {
        window.open(data.url, '_blank');
      }

      return { success: true };
    } catch (err: any) {
      console.error('Google sign-in exception:', err);
      return { success: false, error: err?.message || 'Failed to initialize Google Sign-in' };
    }
  };

  /**
   * Demo customer login helper for instant testing in sandboxes/iframes
   * where Google OAuth redirects to external domains may be restricted.
   */
  const loginWithDemoCustomer = (demo?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  }) => {
    const demoId = 'cust-demo-' + Math.random().toString(36).slice(2, 9);
    const demoEmail = demo?.email || 'customer@punjabibistro.com';
    const demoName = demo?.name || 'Lakshit Goyal';

    const mockUser: User = {
      id: demoId,
      app_metadata: { provider: 'google' },
      user_metadata: { full_name: demoName },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: demoEmail,
      phone: demo?.phone || '+91 98765 43210',
      role: 'authenticated',
      updated_at: new Date().toISOString(),
    };

    const mockProfile: CustomerProfile = {
      userId: demoId,
      fullName: demoName,
      email: demoEmail,
      phone: demo?.phone || '9876543210',
      address: demo?.address || 'Near German Bakery, Upper Dharamkot',
      landmark: 'Opposite Pine Forest Trail',
      city: 'Dharamkot',
      state: 'Himachal Pradesh',
      pincode: '176219',
      deliveryInstructions: 'Ring doorbell, leave outside front door if not available.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setUser(mockUser);
    setCustomerProfile(mockProfile);
    localStorage.setItem(
      DEMO_USER_STORAGE_KEY,
      JSON.stringify({ user: mockUser, profile: mockProfile })
    );
    setIsAuthModalOpen(false);
  };

  const logoutCustomer = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem(DEMO_USER_STORAGE_KEY);
    setUser(null);
    setSession(null);
    setCustomerProfile(null);
    setIsMyOrdersOpen(false);
    setIsAccountModalOpen(false);
  };

  const updateCustomerProfile = async (data: Partial<CustomerProfile>): Promise<boolean> => {
    if (!user) return false;
    const updated: CustomerProfile = {
      ...(customerProfile || {
        userId: user.id,
        fullName: user.user_metadata?.full_name || 'Customer',
        email: user.email || '',
      }),
      ...data,
      userId: user.id,
      updatedAt: new Date().toISOString(),
    };

    setCustomerProfile(updated);
    const ok = await saveCustomerProfileToCloud(updated);
    return ok;
  };

  const openLoginModal = () => {
    setIsAuthModalOpen(true);
  };

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
        loginWithGoogle,
        loginWithDemoCustomer,
        logoutCustomer,
        updateCustomerProfile,
        openLoginModal,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = (): CustomerAuthContextType => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};
