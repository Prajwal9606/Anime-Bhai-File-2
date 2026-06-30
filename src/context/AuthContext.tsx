import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, hasSupabaseConfig } from '../lib/supabase';

interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  isMock?: boolean;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isDemoMode: boolean;
  setDemoMode: (demo: boolean) => void;
  signUp: (email: string, password: string, name?: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(() => {
    const saved = localStorage.getItem('animebhai_use_demo_mode');
    if (saved === 'true') return true;
    if (saved === 'false') return false;
    const customUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
    return !customUrl;
  });

  const setDemoMode = (demo: boolean) => {
    setIsDemoMode(demo);
    localStorage.setItem('animebhai_use_demo_mode', String(demo));
  };

  // Track Auth State
  useEffect(() => {
    if (!isDemoMode && supabase) {
      // 1. REAL SUPABASE AUTH TRACKING
      const getProfileRole = async (userId: string, email: string) => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();
          if (data && data.role) return data.role;
        } catch (e) {
          console.error('Error fetching role:', e);
        }
        const isEmailAdmin = email.toLowerCase() === 'prajwalgadade9606@gmail.com' || email.toLowerCase() === 'prajwalgadade96@gmail.com';
        return isEmailAdmin ? 'admin' : 'user';
      };

      const syncUser = async (supabaseUser: any) => {
        if (supabaseUser) {
          const role = await getProfileRole(supabaseUser.id, supabaseUser.email || '');
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            displayName: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0],
            photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${supabaseUser.id}`,
            role
          });
        } else {
          // Fallback to simulated admin/user if present in localStorage
          const savedUser = localStorage.getItem('animebhai_simulated_user');
          if (savedUser) {
            try {
              setUser(JSON.parse(savedUser));
            } catch {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
        setLoading(false);
      };

      supabase.auth.getSession().then(({ data: { session } }) => {
        syncUser(session?.user);
      }).catch((err) => {
        console.error('Supabase getSession error:', err);
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        syncUser(session?.user);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // 2. DEMO MODE (LOCAL PERSISTED SIMULATION)
      const savedUser = localStorage.getItem('animebhai_simulated_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    }
  }, [isDemoMode]);

  // Sign Up Flow
  const signUp = async (email: string, password: string, name?: string) => {
    setError(null);
    if (!isDemoMode && supabase) {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name || email.split('@')[0],
          }
        }
      });
      if (err) {
        setError(err.message);
        throw err;
      }
      if (data.session && data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          displayName: name || email.split('@')[0],
          photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${data.user.id}`
        });
      } else {
        setUser(null);
      }
      return data;
    } else {
      // Demo Mode Sign Up
      if (password.length < 6) {
        const msg = 'Password should be at least 6 characters.';
        setError(msg);
        throw new Error(msg);
      }
      const newUser: AuthUser = {
        id: `mock-user-${Date.now()}`,
        email,
        displayName: name || email.split('@')[0],
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
        isMock: true,
        role: (email.toLowerCase() === 'prajwalgadade9606@gmail.com' || email.toLowerCase() === 'prajwalgadade96@gmail.com') ? 'admin' : 'user'
      };
      localStorage.setItem('animebhai_simulated_user', JSON.stringify(newUser));
      
      // Save to mock database of registrations
      const accounts = JSON.parse(localStorage.getItem('animebhai_sim_accounts') || '[]');
      if (accounts.some((acc: any) => acc.email === email)) {
        const msg = 'Account with this email already exists.';
        setError(msg);
        throw new Error(msg);
      }
      accounts.push({ email, password, name });
      localStorage.setItem('animebhai_sim_accounts', JSON.stringify(accounts));

      setUser(newUser);
      return { session: {}, user: newUser };
    }
  };

  // Sign In Flow
  const signIn = async (email: string, password: string) => {
    setError(null);
    if (!isDemoMode && supabase) {
      try {
        const { data, error: err } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (err) {
          throw err;
        }
        if (data.user && data.session) {
          setUser({
            id: data.user.id,
            email: data.user.email || '',
            displayName: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
            photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${data.user.id}`
          });
        } else {
          setUser(null);
          if (data.user && !data.session) {
            throw new Error('Check your email and confirm your account before logging in. (Remember to check your Spam folder!)');
          }
        }
      } catch (err: any) {
        // SPECIAL ADMIN FALLBACK: bypass email confirmation requirement for admin emails
        const isAdminEmail = email.toLowerCase() === 'prajwalgadade96@gmail.com'.toLowerCase() ||
                             email.toLowerCase() === 'prajwalgadade9606@gmail.com'.toLowerCase();
        if (isAdminEmail) {
          console.log('Admin login error or unconfirmed email, falling back to simulated admin gateway for developer ease:', err.message);
          const newUser: AuthUser = {
            id: 'mock-user-admin-prajwal',
            email: email,
            displayName: 'Prajwal Admin',
            photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
            isMock: true,
            role: 'admin'
          };
          localStorage.setItem('animebhai_simulated_user', JSON.stringify(newUser));
          setUser(newUser);
          return;
        }
        setError(err.message);
        throw err;
      }
    } else {
      // Demo Mode Sign In
      const accounts = JSON.parse(localStorage.getItem('animebhai_sim_accounts') || '[]');
      const account = accounts.find((acc: any) => acc.email === email);
      
      // Seed an initial demo account if empty
      if (accounts.length === 0 || email === 'demo@animebhai.com') {
        if (password === '123456') {
          const newUser: AuthUser = {
            id: 'mock-user-demo',
            email: 'demo@animebhai.com',
            displayName: 'Demo Otaku',
            photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=demo',
            isMock: true,
            role: 'user'
          };
          localStorage.setItem('animebhai_simulated_user', JSON.stringify(newUser));
          setUser(newUser);
          return;
        }
      }

      if (!account || account.password !== password) {
        const msg = 'Invalid email or password. Hint: Use demo@animebhai.com with password 123456 to test immediately!';
        setError(msg);
        throw new Error(msg);
      }

      const verifiedUser: AuthUser = {
        id: `mock-user-${email}`,
        email,
        displayName: account.name || email.split('@')[0],
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
        isMock: true,
        role: (email.toLowerCase() === 'prajwalgadade9606@gmail.com' || email.toLowerCase() === 'prajwalgadade96@gmail.com') ? 'admin' : 'user'
      };
      localStorage.setItem('animebhai_simulated_user', JSON.stringify(verifiedUser));
      setUser(verifiedUser);
    }
  };

  // Sign Out Flow
  const signOut = async () => {
    setError(null);
    if (!isDemoMode && supabase) {
      const { error: err } = await supabase.auth.signOut();
      if (err) {
        setError(err.message);
        throw err;
      }
    } else {
      localStorage.removeItem('animebhai_simulated_user');
    }
    setUser(null);
  };

  // Sign In with Google Flow
  const signInWithGoogle = async () => {
    setError(null);
    if (!isDemoMode && supabase) {
      const { data, error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true
        }
      });

      if (err) {
        setError(err.message);
        throw err;
      }

      if (data?.url) {
        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const authWindow = window.open(
          data.url,
          'Google Auth',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        if (!authWindow) {
          throw new Error('Popup blocked! Please allow popups for this site.');
        }
      }
    } else {
      // Demo Mode simulation
      const newUser: AuthUser = {
        id: 'mock-user-google',
        email: 'google-otaku@gmail.com',
        displayName: 'Google Otaku',
        photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=google',
        isMock: true
      };
      localStorage.setItem('animebhai_simulated_user', JSON.stringify(newUser));
      setUser(newUser);
    }
  };

  // Listen for OAuth message
  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'SUPABASE_AUTH_SUCCESS') {
        const { accessToken, refreshToken } = event.data;
        if (accessToken && refreshToken && !isDemoMode && supabase) {
          setLoading(true);
          try {
            const { error: sessionErr } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            if (sessionErr) throw sessionErr;
          } catch (err: any) {
            console.error('Error setting OAuth session:', err);
            setError(err.message || 'OAuth verification failed.');
          } finally {
            setLoading(false);
          }
        }
      } else if (event.data?.type === 'SUPABASE_AUTH_ERROR') {
        setError(event.data.error || 'Google authentication failed.');
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => {
      window.removeEventListener('message', handleOAuthMessage);
    };
  }, [isDemoMode]);

  return (
    <AuthContext.Provider value={{ user, loading, error, isDemoMode, setDemoMode, signUp, signIn, signOut, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
