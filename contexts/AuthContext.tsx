import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

export type UserRole = 'admin' | 'student';

export interface User {
  email: string;
  role: UserRole;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const PRECONFIGURED_ACCOUNTS = [
  { email: 'admin@campus.ma', password: 'admin123', role: 'admin' as UserRole },
  { email: 'etudiant@campus.ma', password: 'etudiant123', role: 'student' as UserRole },
];

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => ({ success: false }),
  logout: () => {},
  updateUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredSession();
  }, []);

  async function loadStoredSession() {
    try {
      const stored = await SecureStore.getItemAsync('user_session');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.log('Failed to load session:', e);
    } finally {
      setIsLoading(false);
    }
  }

  function getDefaultName(email: string): string {
    const localPart = email.split('@')[0];
    return localPart.charAt(0).toUpperCase() + localPart.slice(1);
  }

  function login(email: string, password: string): { success: boolean; error?: string } {
    const account = PRECONFIGURED_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
    );

    if (!account) {
      return { success: false, error: 'Email ou mot de passe incorrect' };
    }

    const userData: User = { email: account.email, role: account.role, name: getDefaultName(account.email) };
    setUser(userData);
    SecureStore.setItemAsync('user_session', JSON.stringify(userData)).catch(() => {});
    return { success: true };
  }

  function updateUser(updates: Partial<User>) {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      SecureStore.setItemAsync('user_session', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }

  function logout() {
    setUser(null);
    SecureStore.deleteItemAsync('user_session').catch(() => {});
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
