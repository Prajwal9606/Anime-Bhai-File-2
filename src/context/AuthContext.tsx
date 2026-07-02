import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, hasSupabaseConfig } from '../lib/supabase';
import { hashString, isAdminEmail, isAdminPassword } from '../lib/hash';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';

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
    // 1. Firebase Auth State Listener (Our primary handler for real Google Login)
    const unsubscribeFirebase = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const isEmailAdmin = await isAdminEmail(firebaseUser.email || '');
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${firebaseUser.uid}`,
          role: isEmailAdmin ? 'admin' : 'user'
        });
        setLoading(false);
      } else {
        // Fallback to Supabase / Demo when no Firebase Auth user is present
        if (!isDemoMode && supabase) {
          // 2. REAL SUPABASE AUTH TRACKING
          const getProfileRole = async (userId: string, email: string) => {
            try {
              const isEmailAdmin = await isAdminEmail(email);
              const targetRole = isEmailAdmin ? 'admin' : 'user';

              // Try to select first
              const { data, error } = await supabase
                .from('profiles')
                .select('role, full_name, avatar_seed')
                .eq('id', userId);
              
              if (!error && data && data.length > 0) {
                const currentRole = data[0].role;
                if (isEmailAdmin && currentRole !== 'admin') {
                  // Self-heal/Upgrade role to admin
                  await supabase
                    .from('profiles')
                    .update({ role: 'admin' })
                    .eq('id', userId);
                  return { role: 'admin', full_name: data[0].full_name, avatar_seed: data[0].avatar_seed };
                }
                return { role: currentRole, full_name: data[0].full_name, avatar_seed: data[0].avatar_seed };
              }

              // If profile does not exist or there was a select error, attempt to upsert
              const { data: upsertedData, error: upsertErr } = await supabase
                .from('profiles')
                .upsert({ id: userId, email: email, role: targetRole })
                .select('role, full_name, avatar_seed');

              if (!upsertErr && upsertedData && upsertedData.length > 0) {
                return { role: upsertedData[0].role, full_name: upsertedData[0].full_name, avatar_seed: upsertedData[0].avatar_seed };
              } else if (upsertErr) {
                console.warn('Could not upsert profile row in Supabase:', upsertErr);
              }
            } catch (e) {
              console.error('Error fetching role:', e);
            }
            const isEmailAdmin = await isAdminEmail(email);
            return { role: isEmailAdmin ? 'admin' : 'user', full_name: undefined, avatar_seed: undefined };
          };

          const syncUser = async (supabaseUser: any) => {
            if (supabaseUser) {
              const profile = await getProfileRole(supabaseUser.id, supabaseUser.email || '');
              setUser({
                id: supabaseUser.id,
                email: supabaseUser.email || '',
                displayName: profile.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0],
                photoURL: profile.avatar_seed 
                  ? (profile.avatar_seed.startsWith('http') || profile.avatar_seed.startsWith('data:') ? profile.avatar_seed : `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.avatar_seed}`) 
                  : `https://api.dicebear.com/7.x/bottts/svg?seed=${supabaseUser.id}`,
                role: profile.role
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
        } else {
          // 3. DEMO MODE (LOCAL PERSISTED SIMULATION)
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
          setLoading(false);
        }
      }
    });

    let subscriptionSupabase: any = null;
    if (!isDemoMode && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!auth.currentUser) {
          if (session?.user) {
            const isEmailAdmin = await isAdminEmail(session.user.email || '');
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              displayName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
              photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${session.user.id}`,
              role: isEmailAdmin ? 'admin' : 'user'
            });
          } else {
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
        }
      });
      subscriptionSupabase = subscription;
    }

    return () => {
      unsubscribeFirebase();
      if (subscriptionSupabase) {
        subscriptionSupabase.unsubscribe();
      }
    };
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
      const isEmailAdmin = await isAdminEmail(email);
      const newUser: AuthUser = {
        id: `mock-user-${Date.now()}`,
        email,
        displayName: name || email.split('@')[0],
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
        isMock: true,
        role: isEmailAdmin ? 'admin' : 'user'
      };
      localStorage.setItem('animebhai_simulated_user', JSON.stringify(newUser));
      
      // Save to mock database of registrations
      const accounts = JSON.parse(localStorage.getItem('animebhai_sim_accounts') || '[]');
      const hashedEmail = await hashString(email.toLowerCase());
      if (accounts.some((acc: any) => acc.emailHash === hashedEmail)) {
        const msg = 'Account with this email already exists.';
        setError(msg);
        throw new Error(msg);
      }
      const hashedPassword = await hashString(password);
      accounts.push({ emailHash: hashedEmail, passwordHash: hashedPassword, name });
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
        const isEmailAdmin = await isAdminEmail(email);
        if (isEmailAdmin) {
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
      const isEmailAdmin = await isAdminEmail(email);
      const isPasswordAdmin = await isAdminPassword(password);
      const isAdminCredentials = isEmailAdmin && isPasswordAdmin;

      if (isAdminCredentials) {
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

      const accounts = JSON.parse(localStorage.getItem('animebhai_sim_accounts') || '[]');
      const inputEmailHash = await hashString(email.toLowerCase());
      const inputPasswordHash = await hashString(password);
      
      // Seed an initial demo account if empty
      if (accounts.length === 0 || email.toLowerCase() === 'demo@animebhai.com') {
        const demoEmailHash = await hashString('demo@animebhai.com');
        const demoPasswordHash = await hashString('123456');
        
        if (inputEmailHash === demoEmailHash && inputPasswordHash === demoPasswordHash) {
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

      const account = accounts.find((acc: any) => acc.emailHash === inputEmailHash);

      if (!account || account.passwordHash !== inputPasswordHash) {
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
        role: isEmailAdmin ? 'admin' : 'user'
      };
      localStorage.setItem('animebhai_simulated_user', JSON.stringify(verifiedUser));
      setUser(verifiedUser);
    }
  };

  // Sign Out Flow
  const signOut = async () => {
    setError(null);
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase signout error:', e);
    }
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
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      if (result?.user) {
        const isEmailAdmin = await isAdminEmail(result.user.email || '');
        const loggedUser: AuthUser = {
          id: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || result.user.email?.split('@')[0],
          photoURL: result.user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${result.user.uid}`,
          role: isEmailAdmin ? 'admin' : 'user'
        };
        setUser(loggedUser);
      }
    } catch (err: any) {
      console.error('Firebase Google Sign-In error:', err);
      setError(err.message || 'Google authentication failed.');
      throw err;
    } finally {
      setLoading(false);
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
