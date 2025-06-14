'use client';

import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch session on component mount
  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (!res.ok) {
          throw new Error('Failed to fetch session');
        }
        
        const session = await res.json();
        if (session && session.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        setError('Authentication failed. Please try logging in again.');
        console.error('Auth error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
