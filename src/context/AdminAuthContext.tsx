import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ADMIN_TOKEN_KEY = 'pb_admin_session_token';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  adminUsername: string | null;
  isLoading: boolean;
  authError: string | null;
  login: (username: string, password: string, securityKey: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  getAuthToken: () => string | null;
  // Aliases for backwards-compatibility
  isAuthorized: boolean;
  signOut: () => Promise<void>;
  user: { email: string } | null;
  adminRole: string | null;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminUsername, setAdminUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const getAuthToken = useCallback((): string | null => {
    try {
      return localStorage.getItem(ADMIN_TOKEN_KEY);
    } catch {
      return null;
    }
  }, []);

  const verifySession = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setIsAuthenticated(false);
      setAdminUsername(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/session', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.username) {
          setIsAuthenticated(true);
          setAdminUsername(data.username);
          setAuthError(null);
          return;
        }
      }

      // If session verification failed or expired, clean up token
      try {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
      } catch {
        // ignore
      }
      setIsAuthenticated(false);
      setAdminUsername(null);
    } catch {
      // If network error, preserve local state or fail closed
      setIsAuthenticated(false);
      setAdminUsername(null);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthToken]);

  // Check existing session on mount
  useEffect(() => {
    verifySession();
  }, [verifySession]);

  const login = async (
    username: string,
    password: string,
    securityKey: string
  ): Promise<boolean> => {
    setAuthError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          securityKey,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg = data.error || 'Invalid login details.';
        setAuthError(errorMsg);
        setIsAuthenticated(false);
        setAdminUsername(null);
        return false;
      }

      if (data.success && data.token) {
        try {
          localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        } catch {
          // ignore
        }
        setIsAuthenticated(true);
        setAdminUsername(data.username || username);
        setAuthError(null);
        return true;
      }

      setAuthError('Invalid login details.');
      setIsAuthenticated(false);
      return false;
    } catch {
      setAuthError('Unable to reach server. Please try again.');
      setIsAuthenticated(false);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    const token = getAuthToken();
    try {
      if (token) {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      // ignore
    } finally {
      try {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
      } catch {
        // ignore
      }
      setIsAuthenticated(false);
      setAdminUsername(null);
      setAuthError(null);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated,
        adminUsername,
        isLoading,
        authError,
        login,
        logout,
        refreshSession: verifySession,
        getAuthToken,
        // Aliases for compatibility
        isAuthorized: isAuthenticated,
        signOut: logout,
        user: isAuthenticated && adminUsername ? { email: adminUsername } : null,
        adminRole: isAuthenticated ? 'owner' : null,
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
