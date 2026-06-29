import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, ShieldCheck, ShieldAlert, Key, RefreshCw, Trash2, Copy, Check, QrCode, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SecuritySettings() {
  const { user, isDemoMode } = useAuth();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrollmentData, setEnrollmentData] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeFactors, setActiveFactors] = useState<any[]>([]);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Load MFA Status on Mount
  useEffect(() => {
    fetchMfaStatus();
  }, [user]);

  const fetchMfaStatus = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    if (!isDemoMode && supabase) {
      try {
        const { data, error: mfaError } = await supabase.auth.mfa.listFactors();
        if (mfaError) throw mfaError;

        const totpFactors = data?.all || [];
        const active = totpFactors.filter((f: any) => f.status === 'verified');
        setActiveFactors(active);
        setMfaEnabled(active.length > 0);
      } catch (err: any) {
        console.error('Error fetching MFA factors:', err);
        setError(err.message || 'Failed to fetch security settings.');
      } finally {
        setLoading(false);
      }
    } else {
      // Demo Mode simulated state
      const isSimEnabled = localStorage.getItem(`animebhai_mfa_enabled_${user.email}`) === 'true';
      setMfaEnabled(isSimEnabled);
      if (isSimEnabled) {
        setActiveFactors([{
          id: 'mock-factor-id',
          factorType: 'totp',
          friendlyName: 'AnimeBhai Authenticator (Demo)',
          status: 'verified',
          createdAt: new Date().toISOString()
        }]);
      } else {
        setActiveFactors([]);
      }
      setLoading(false);
    }
  };

  // Start enrollment
  const handleEnroll = async () => {
    setError(null);
    setSuccess(null);
    setVerificationCode('');
    
    if (!isDemoMode && supabase) {
      try {
        const { data, error: enrollError } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          issuer: 'AnimeBhai',
          friendlyName: 'AnimeBhai OTP'
        });

        if (enrollError) throw enrollError;
        
        // data contains: id, type, totp: { qr_code, secret, uri }
        setEnrollmentData(data);
      } catch (err: any) {
        setError(err.message || 'MFA enrollment failed to initialize.');
      }
    } else {
      // Mock enrollment data
      const mockSecret = 'JBSWY3DPEHPK3PXP';
      const mockUri = `otpauth://totp/AnimeBhai:${user?.email || 'demo@animebhai.com'}?secret=${mockSecret}&issuer=AnimeBhai`;
      setEnrollmentData({
        id: 'mock-factor-id',
        type: 'totp',
        totp: {
          secret: mockSecret,
          qr_code: mockUri, // qrcode.react can render URI directly
          uri: mockUri
        }
      });
    }
  };

  // Verify and complete enrollment
  const handleVerifyEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    setError(null);
    setSuccess(null);

    if (!isDemoMode && supabase) {
      try {
        const factorId = enrollmentData.id;
        
        const { data, error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
          factorId,
          code: verificationCode
        });

        if (verifyError) throw verifyError;

        setSuccess('Multi-Factor Authentication activated successfully!');
        setEnrollmentData(null);
        fetchMfaStatus();
      } catch (err: any) {
        setError(err.message || 'Verification failed. Please check the code and try again.');
      }
    } else {
      // Demo Mode verification
      // Any 6-digit code works in Demo mode
      if (/^\d{6}$/.test(verificationCode)) {
        localStorage.setItem(`animebhai_mfa_enabled_${user?.email}`, 'true');
        setSuccess('Multi-Factor Authentication (Demo Mode) activated successfully! Try logging in again to see the challenge.');
        setEnrollmentData(null);
        fetchMfaStatus();
      } else {
        setError('Invalid verification code format. Enter any 6-digit number to proceed in Demo Mode!');
      }
    }
  };

  // Disable MFA
  const handleUnenroll = async (factorId: string) => {
    if (!window.confirm('Are you absolutely sure you want to disable Multi-Factor Authentication? Your account will be less secure.')) {
      return;
    }

    setError(null);
    setSuccess(null);

    if (!isDemoMode && supabase) {
      try {
        const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId });
        if (unenrollError) throw unenrollError;

        setSuccess('Multi-Factor Authentication disabled successfully.');
        fetchMfaStatus();
      } catch (err: any) {
        setError(err.message || 'Failed to disable MFA.');
      }
    } else {
      // Demo Mode
      localStorage.removeItem(`animebhai_mfa_enabled_${user?.email}`);
      setSuccess('Multi-Factor Authentication (Demo Mode) disabled.');
      fetchMfaStatus();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div id="mfa-security-settings" className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <Shield size={12} /> Account Protection
          </span>
          <h2 className="text-3xl font-black text-white tracking-tight">Two-Factor Authentication (2FA)</h2>
          <p className="text-gray-400 text-xs mt-1">
            Secure your streaming account by requiring a secondary verification code from Google Authenticator or other TOTP apps.
          </p>
        </div>

        {/* Global status badge */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400">
              <RefreshCw size={12} className="animate-spin" />
              <span>Checking status...</span>
            </div>
          ) : mfaEnabled ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-extrabold text-emerald-400 uppercase tracking-wider shadow-lg shadow-emerald-500/5">
              <ShieldCheck size={14} />
              <span>MFA Enabled</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-extrabold text-red-400 uppercase tracking-wider">
              <ShieldAlert size={14} />
              <span>MFA Disabled</span>
            </div>
          )}
        </div>
      </div>

      {/* Alert notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-medium leading-relaxed">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium leading-relaxed">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="text-cyan-400 animate-spin" size={32} />
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">Loading Security Settings</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Settings info / actions */}
          <div className="lg:col-span-2 space-y-6">
            {!enrollmentData ? (
              <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full filter blur-3xl pointer-events-none" />
                
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Key size={18} className="text-cyan-400" />
                  {mfaEnabled ? 'Your Enrolled Factors' : 'Enroll Authenticator Factor'}
                </h3>

                {mfaEnabled ? (
                  <div className="space-y-6">
                    <p className="text-gray-300 text-xs leading-relaxed">
                      You have active factor(s) protecting your account. When signing in from a new browser or after session expiry, you will be prompted for a 6-digit dynamic code generated by your authenticator.
                    </p>

                    <div className="space-y-3">
                      {activeFactors.map((factor) => (
                        <div key={factor.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                              <Shield size={20} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">{factor.friendlyName || 'Authenticator App'}</p>
                              <p className="text-[10px] font-mono text-gray-400 mt-0.5">ID: {factor.id}</p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleUnenroll(factor.id)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-xl transition"
                            title="Disable factor"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-gray-300 text-xs leading-relaxed">
                      Two-Factor Authentication adds an extra layer of protection to your account. In addition to your email and password, you will need to enter a 6-digit verification code generated by applications like Google Authenticator, Microsoft Authenticator, or 1Password.
                    </p>

                    <button
                      onClick={handleEnroll}
                      className="inline-flex items-center gap-2 bg-cyan-500 text-black px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/10"
                    >
                      <span>Set Up Google Authenticator</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Enrollment Active UI
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#111111] border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <QrCode size={18} className="text-cyan-400" />
                    Configure Authenticator app
                  </h3>
                  <button 
                    onClick={() => setEnrollmentData(null)}
                    className="text-xs text-gray-400 hover:text-white font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Step 1: Scan QR */}
                  <div className="space-y-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-black">1</span>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider ml-2 inline-block">Scan this QR Code</h4>
                    <p className="text-gray-300 text-xs leading-relaxed pl-8">
                      Open your Authenticator app (e.g. Google Authenticator, Authy), choose "Add account", then scan this QR code.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-6 pl-8 py-3">
                      <div className="bg-white p-3 rounded-2xl shadow-inner inline-block">
                        <QRCodeSVG value={enrollmentData.totp.uri} size={150} />
                      </div>
                      <div className="space-y-2 text-center sm:text-left">
                        <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">Unable to scan?</span>
                        <p className="text-[11px] text-gray-400 leading-normal max-w-xs">
                          You can manually add this secret key inside your authenticator app to enroll.
                        </p>
                        <div className="inline-flex items-center gap-2 bg-black/40 border border-white/5 px-3 py-1.5 rounded-xl font-mono text-xs text-cyan-300">
                          <span className="select-all tracking-wider">{enrollmentData.totp.secret}</span>
                          <button 
                            type="button" 
                            onClick={() => copyToClipboard(enrollmentData.totp.secret)}
                            className="text-gray-400 hover:text-white transition"
                          >
                            {copiedSecret ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Verification Input */}
                  <div className="space-y-4 border-t border-white/5 pt-6">
                    <div>
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-black">2</span>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider ml-2 inline-block">Verify Activation Code</h4>
                      <p className="text-gray-300 text-xs leading-relaxed pl-8">
                        Enter the temporary 6-digit confirmation code displayed in your authenticator app below to complete setup.
                      </p>
                    </div>

                    <form onSubmit={handleVerifyEnrollment} className="pl-8 space-y-4 max-w-xs">
                      <div className="space-y-1.5">
                        <input 
                          type="text" 
                          maxLength={6}
                          placeholder="e.g. 123456" 
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-center text-xl font-mono font-bold tracking-[0.4em] text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-cyan-500 text-black py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-cyan-400 transition"
                      >
                        Verify & Enable 2FA
                      </button>

                      {isDemoMode && (
                        <p className="text-[10px] text-amber-400/80 font-bold leading-relaxed mt-2">
                          💡 Demo Hint: Since you are running in local demo mode, you can type any 6-digit number to instantly verify!
                        </p>
                      )}
                    </form>
                  </div>

                </div>
              </motion.div>
            )}
          </div>

          {/* Guidelines Sidebar */}
          <div className="space-y-6">
            <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 shadow-xl space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-3">
                <ShieldCheck size={14} className="text-cyan-400" />
                MFA Best Practices
              </h4>
              <ul className="space-y-3 text-[11px] text-gray-400 leading-relaxed list-disc list-inside">
                <li>Keep your Google Authenticator or secondary auth factor device secure.</li>
                <li>Write down or back up recovery parameters if your authenticator app supports cloud backups.</li>
                <li>If you lose access to your verification device, you will need system administrators or verification email recoveries to reset your MFA status.</li>
                <li>Never share your temporary 6-digit authentication token codes with anybody.</li>
              </ul>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
