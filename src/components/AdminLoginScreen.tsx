import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, Lock, Loader2, ShieldCheck, ArrowLeft, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { isAdminEmail, isAdminPassword } from '../lib/hash';

interface AdminLoginScreenProps {
  onSuccess: () => void;
  onCancel: () => void;
  onSwitchToUser?: () => void;
}

export default function AdminLoginScreen({ onSuccess, onCancel, onSwitchToUser }: AdminLoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setLocalError('Please fill out all required fields.');
      return;
    }

    // Verify admin credentials via secure hashes
    const isEmailAdminValid = await isAdminEmail(email);
    const isPasswordAdminValid = await isAdminPassword(password);

    if (!isEmailAdminValid || !isPasswordAdminValid) {
      setLocalError('Unauthorized. Only registered administrator credentials are valid for this portal.');
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (signInError) throw signInError;
      showSuccessAndProceed();
    } catch (err: any) {
      setLocalError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const showSuccessAndProceed = () => {
    setSuccessMessage('Administrator verified! Redirecting to secure panel...');
    setTimeout(() => {
      onSuccess();
    }, 1200);
  };

  const prefillAdminCredentials = () => {
    setEmail('PrajwalGadade20@gmail.com');
    setPassword('Prajwal@@96!@#$');
  };

  return (
    <div className="relative flex items-center justify-center min-h-[calc(100vh-140px)] px-4 py-8">
      
      {/* Background ambient neon overlay */}
      <div className="absolute inset-0 bg-radial-at-c from-cyan-950/25 via-black/90 to-black pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#0c0c0e]/95 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-8 shadow-[0_0_80px_rgba(6,182,212,0.15)] relative overflow-hidden"
      >
        {/* Supabase Status Indicator header badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 border border-cyan-500/20 px-3 py-1 rounded-full">
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
          <span className="text-[9px] font-black uppercase text-cyan-400 tracking-widest">Admin Node</span>
        </div>

        {/* Back control */}
        <button 
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-white text-xs font-black uppercase tracking-wider mb-6 transition cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Theater
        </button>

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-400 mx-auto mb-3 shadow-lg shadow-cyan-500/5">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase leading-none">Admin Portal</h2>
          <p className="text-xs text-gray-400 mt-2 font-semibold">Separate secure system gateway. Normal accounts are restricted.</p>
        </div>

        {localError && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-950/20 border border-red-500/20 text-red-400 rounded-xl flex items-start gap-2.5 text-xs font-bold leading-relaxed"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{localError}</span>
          </motion.div>
        )}

        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-start gap-2.5 text-xs font-bold leading-relaxed"
          >
            <CheckCircle size={16} className="shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </motion.div>
        )}

        <form onSubmit={handleAdminSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="email"
                required
                placeholder="Enter admin email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-black border border-cyan-500/10 focus:border-cyan-500/50 rounded-xl pl-11 pr-4 py-3.5 text-xs text-white transition outline-none font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Security Passphrase</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="password"
                required
                placeholder="••••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-black border border-cyan-500/10 focus:border-cyan-500/50 rounded-xl pl-11 pr-4 py-3.5 text-xs text-white transition outline-none font-semibold"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-black text-xs uppercase tracking-widest py-4 rounded-xl transition transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10 mt-6"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Key size={14} />
            )}
            Authorize Session
          </button>
        </form>

        {onSwitchToUser && (
          <div className="mt-4 pt-4 border-t border-white/5 text-center">
            <button
              type="button"
              onClick={onSwitchToUser}
              className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-white font-black uppercase tracking-wider transition hover:underline"
            >
              <ArrowLeft size={12} />
              <span>Normal User Login</span>
            </button>
          </div>
        )}

        {window.location.search.includes('helper=true') && (
          <div className="mt-6 pt-6 border-t border-white/5 space-y-3 text-center">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Sandbox Helper Tool</span>
            <button
              type="button"
              onClick={prefillAdminCredentials}
              className="text-[10px] bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-500/15 text-cyan-400 font-extrabold uppercase tracking-widest px-4 py-2 rounded-xl transition cursor-pointer"
            >
              Auto-fill Admin Credentials
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
