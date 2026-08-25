import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse, ApiResponse } from '../../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, displayName: string, referralCode?: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('mph_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const activeToken = token || localStorage.getItem('mph_token');
    if (!activeToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      if (res.ok) {
        const data: ApiResponse<User> = await res.json();
        if (data.success && data.data) {
          setUser(data.data);
        } else {
          logout();
        }
      } else {
        logout();
      }
    } catch (err) {
      console.error('Failed to fetch user session:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result: ApiResponse<AuthResponse> = await res.json();

      if (res.ok && result.success && result.data) {
        const { token: newToken, user: newUser } = result.data;
        localStorage.setItem('mph_token', newToken);
        setToken(newToken);
        setUser(newUser);
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Invalid credentials' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection failed' };
    }
  };

  const register = async (email: string, password: string, displayName: string, referralCode?: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          display_name: displayName,
          referral_code: referralCode || undefined,
        }),
      });

      const result: ApiResponse<AuthResponse> = await res.json();

      if (res.ok && result.success && result.data) {
        const { token: newToken, user: newUser } = result.data;
        localStorage.setItem('mph_token', newToken);
        setToken(newToken);
        setUser(newUser);
        return { success: true, message: result.message };
      } else {
        return { success: false, error: result.error || 'Registration failed' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection failed' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('mph_token');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
