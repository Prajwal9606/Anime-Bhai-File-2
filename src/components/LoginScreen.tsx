import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Mail, Lock, User, Eye, EyeOff, Loader2, Sparkles, CheckCircle, Database, Server, ShieldCheck, Key, ArrowLeft, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginScreenProps {
  onSuccess: () => void;
  onCancel?: () => void;
  onSwitchToAdmin?: () => void;
}

export default function LoginScreen({ onSuccess, onCancel, onSwitchToAdmin }: LoginScreenProps) {
  const { signUp, signIn, signOut, error, isDemoMode, setDemoMode, signInWithGoogle } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // MFA Challenge State
  const [showMfaChallenge, setShowMfaChallenge] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);

    // Basic Validations
    if (!email || !password) {
      setLocalError('Please fill out all required fields.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;

        if (data?.session) {
          await supabase.auth.signOut();
        }
        
        setIsSignUp(false);
        setPassword('');
        setSuccessMessage('Your account has been created. Please check your email and verify your address before logging in.');
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        
        if (data?.session) {
          window.location.href = '/';
        } else {
           setLocalError('Authentication failed. Please check your credentials.');
        }
      }
    } catch (err: any) {
      setLocalError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode || mfaCode.length !== 6) {
      setLocalError('Please enter a valid 6-digit code.');
      return;
    }

    setLoading(true);
    setLocalError(null);

    try {
      if (!isDemoMode && supabase && mfaFactorId) {
        const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
          factorId: mfaFactorId,
          code: mfaCode
        });

        if (verifyError) throw verifyError;
      } else if (isDemoMode) {
        // Simulated verification in Demo Mode (accept any 6 digit numeric code)
        if (!/^\d{6}$/.test(mfaCode)) {
          throw new Error('Invalid verification code format. Enter any 6-digit number to log in!');
        }
      }
      onSuccess();
    } catch (err: any) {
      setLocalError(err.message || 'MFA Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelChallenge = async () => {
    setLoading(true);
    try {
      // Sign out to clean up the half-authenticated session if they cancel the 2FA screen
      await signOut();
      setShowMfaChallenge(false);
      setMfaFactorId(null);
      setMfaCode('');
      setLocalError(null);
    } catch (err) {
      console.error('Error signing out on MFA cancel:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setLocalError(null);
    try {
      await signIn('demo@animebhai.com', '123456');
      
      const isSimMfa = localStorage.getItem('animebhai_mfa_enabled_demo@animebhai.com') === 'true';
      if (isSimMfa) {
        setMfaFactorId('mock-factor-id');
        setShowMfaChallenge(true);
        setLoading(false);
        return;
      }
      
      onSuccess();
    } catch (err: any) {
      setLocalError(err.message || 'Failed to trigger demo authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setLocalError(null);
    setSuccessMessage(null);
    try {
      await signInWithGoogle();
      onSuccess();
    } catch (err: any) {
      setLocalError(err.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-[calc(100vh-140px)] px-4">
      
      {/* Background Ambience Neon glow circle */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-cyan-500/5 filter blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#111111]/90 backdrop-blur-xl border border-cyan-500/15 rounded-3xl p-8 shadow-[0_0_50px_rgba(6,182,212,0.1)] relative overflow-hidden"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-4 shadow-lg shadow-cyan-500/5">
            {showMfaChallenge ? (
              <ShieldCheck size={24} className="text-cyan-400 animate-pulse" />
            ) : (
              <Sparkles size={24} className="animate-pulse" />
            )}
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {showMfaChallenge ? 'Two-Factor Challenge' : isSignUp ? 'Join Anime Bhai' : 'Welcome Back'}
          </h2>
          <p className="text-gray-400 text-xs mt-2 font-medium">
            {showMfaChallenge 
              ? 'Enter the 6-digit verification code from your Google Authenticator or secondary auth factor device to finalize log in.'
              : isSignUp 
                ? 'Create your secure account to start streaming your favorite shows' 
                : 'Sign in to access your custom playlist, watch history and discussions'}
          </p>
        </div>

        {/* Display Success Messages */}
        {successMessage && !showMfaChallenge && (
          <div className="mb-6 p-4.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-medium leading-relaxed flex gap-3 items-start shadow-[0_0_20px_rgba(34,211,238,0.05)]">
            <Mail size={16} className="text-cyan-400 shrink-0 mt-0.5 animate-bounce" />
            <div className="space-y-1">
              <p className="font-extrabold uppercase tracking-wider text-[10px] text-cyan-300">Confirmation Email Sent</p>
              <p className="text-gray-200">{successMessage}</p>
              <p className="text-cyan-300/90 font-bold text-[11px] mt-1.5 flex items-center gap-1">
                <span>💡 Tip: Check your <strong>Spam</strong> folder if it is not in your Inbox.</span>
              </p>
            </div>
          </div>
        )}

        {/* Display System or Local Errors */}
        {(localError || error) && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold leading-relaxed">
            {localError || error}
          </div>
        )}

        {/* Conditional rendering of MFA form vs. Standard Login/Signup form */}
        {showMfaChallenge ? (
          <form onSubmit={handleMfaSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-wider block text-center">Verification Code</label>
              <input 
                type="text" 
                maxLength={6}
                placeholder="e.g. 123456" 
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
                className="w-full bg-[#09090b] border border-white/10 rounded-xl py-3 px-4 text-center text-2xl font-mono font-black tracking-[0.4em] text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm uppercase tracking-widest py-3.5 rounded-xl shadow-lg shadow-cyan-500/10 transition transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Verify Code & Log In'}
            </button>

            <button 
              type="button"
              onClick={handleCancelChallenge}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-white font-bold uppercase tracking-wider transition pt-2"
            >
              <ArrowLeft size={12} />
              <span>Back to Sign In</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider block">Full Name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Your nickname or username" 
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full bg-[#09090b] text-sm text-white pl-10 pr-4 py-3 rounded-xl border border-white/10 focus:border-cyan-500 outline-none transition font-medium"
                  />
                  <User size={16} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-400 uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#09090b] text-sm text-white pl-10 pr-4 py-3 rounded-xl border border-white/10 focus:border-cyan-500 outline-none transition font-medium"
                />
                <Mail size={16} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider block">Password</label>
                {!isSignUp && (
                  <a href="#" className="text-[10px] text-cyan-400 hover:underline font-bold">Forgot password?</a>
                )}
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#09090b] text-sm text-white pl-10 pr-10 py-3 rounded-xl border border-white/10 focus:border-cyan-500 outline-none transition font-medium"
                />
                <Lock size={16} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm uppercase tracking-widest py-3.5 rounded-xl shadow-lg shadow-cyan-500/10 transition transform active:scale-[0.98] flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>
        )}

        {/* Continue with Google button */}
        {!showMfaChallenge && (
          <div className="space-y-4 mt-4">
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="flex-shrink mx-4 text-gray-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Or</span>
              <div className="flex-grow border-t border-white/5"></div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-[#09090b] hover:bg-white/5 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl border border-white/10 transition transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:border-cyan-500/30"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </div>
        )}

        {/* Toggles */}
        {!showMfaChallenge && (
          <div className="mt-6 text-center text-xs space-y-4">
            <div>
              <span className="text-gray-500 font-semibold">
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              </span>
              <button 
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setLocalError(null);
                  setSuccessMessage(null);
                }} 
                className="text-cyan-400 hover:underline font-bold"
              >
                {isSignUp ? 'Sign In' : 'Create One Now'}
              </button>
            </div>


          </div>
        )}

        {onCancel && !showMfaChallenge && (
          <button 
            onClick={onCancel}
            className="mt-4 w-full text-center text-xs text-gray-500 hover:text-gray-400 font-bold uppercase tracking-wider"
          >
            Go Back
          </button>
        )}

      </motion.div>
    </div>
  );
}

