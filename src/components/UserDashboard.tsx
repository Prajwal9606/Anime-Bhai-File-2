import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Heart, ArrowLeft, Dices, Loader2, Play, Upload, Link2, Image as ImageIcon, Camera, Shield, LogOut } from 'lucide-react';
import SecuritySettings from './SecuritySettings';

interface UserDashboardProps {
  allVideos: any[];
  favorites: string[];
  onSelectVideo?: (video: any) => void;
  onClose?: () => void;
}

export default function UserDashboard({ allVideos, favorites, onSelectVideo, onClose }: UserDashboardProps) {
  const { user, isDemoMode, signOut } = useAuth();
  const [name, setName] = useState(user?.displayName || '');
  const [dashboardTab, setDashboardTab] = useState<'favorites' | 'security'>('favorites');
  
  const [avatarSource, setAvatarSource] = useState<'dicebear' | 'custom'>(() => {
    if (user?.photoURL && (user.photoURL.startsWith('data:') || !user.photoURL.includes('dicebear.com'))) {
      return 'custom';
    }
    return 'dicebear';
  });

  const [seed, setSeed] = useState(() => {
    if (user?.photoURL && user.photoURL.includes('dicebear.com')) {
      const match = user.photoURL.match(/seed=([^&]+)/);
      if (match) return match[1];
    }
    return user?.id || '';
  });

  const [customPhoto, setCustomPhoto] = useState(() => {
    if (user?.photoURL && (user.photoURL.startsWith('data:') || !user.photoURL.includes('dicebear.com'))) {
      return user.photoURL;
    }
    return '';
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const favAnimes = allVideos.filter(v => favorites.includes(v.id));

  const handleRandomizeSeed = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let newSeed = '';
    for (let i = 0; i < 8; i++) {
      newSeed += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSeed(newSeed);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Image file is too large. Please choose an image smaller than 2MB.');
      return;
    }

    setUploadProgress('Processing image...');
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setCustomPhoto(base64);
      setAvatarSource('custom');
      setUploadProgress(null);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
      setUploadProgress(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Image file is too large. Please choose an image smaller than 2MB.');
      return;
    }

    setUploadProgress('Processing image...');
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setCustomPhoto(base64);
      setAvatarSource('custom');
      setUploadProgress(null);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
      setUploadProgress(null);
    };
    reader.readAsDataURL(file);
  };

  const updateProfile = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    const finalAvatarValue = avatarSource === 'custom' ? customPhoto : seed;

    try {
      if (isDemoMode || user.isMock || !supabase) {
        // Handle local simulation update
        const updatedUser = {
          ...user,
          displayName: name,
          photoURL: finalAvatarValue || `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`
        };
        localStorage.setItem('animebhai_simulated_user', JSON.stringify(updatedUser));
        
        // Also update registration accounts in simulation if present
        const accounts = JSON.parse(localStorage.getItem('animebhai_sim_accounts') || '[]');
        const updatedAccounts = accounts.map((acc: any) => {
          if (acc.email === user.email) {
            return { ...acc, name: name };
          }
          return acc;
        });
        localStorage.setItem('animebhai_sim_accounts', JSON.stringify(updatedAccounts));
        
        setSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
        return;
      }

      // Real Supabase flow
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: name, avatar_seed: finalAvatarValue })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const photoURL = avatarSource === 'custom' && customPhoto
    ? customPhoto
    : `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;

  return (
    <div className="max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1800px] 4xl:max-w-[2200px] 5xl:max-w-[2560px] mx-auto w-full px-4 py-6">
      
      {/* Back button */}
      {onClose && (
        <button 
          onClick={onClose}
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-cyan-400 font-extrabold uppercase tracking-widest transition cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Browse
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Profile Card & settings - left column */}
        <div className="lg:col-span-4 bg-[#111] border border-white/5 p-6 rounded-2xl relative overflow-hidden shadow-2xl">
          {/* Neon background accent glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className="text-sm font-black uppercase text-cyan-400 tracking-wider mb-6 flex items-center gap-1.5">
            <User size={16} />
            <span>My Profile</span>
          </h2>

          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative group mb-4">
              <div className="absolute inset-0 bg-cyan-500/20 rounded-2xl blur-md group-hover:bg-cyan-500/30 transition-all" />
              <img 
                src={photoURL} 
                alt="Profile Avatar" 
                className="w-24 h-24 rounded-2xl border border-cyan-500/20 relative z-10 bg-black/40 p-1 object-contain transition-transform group-hover:scale-105" 
              />
            </div>
            
            <h3 className="text-lg font-black text-white">{user?.displayName || user?.email?.split('@')[0]}</h3>
            <span className="text-xs text-gray-400 mt-1">{user?.email}</span>

            {/* User status labels */}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full">
                Active Member
              </span>
              {isDemoMode && (
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  Demo Sandbox
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">Display Name</label>
              <input 
                type="text"
                placeholder="Otaku Legend"
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/40 text-xs font-semibold text-white px-3.5 py-2 rounded-xl border border-white/5 focus:border-cyan-500/40 outline-none transition"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">Profile Picture Source</label>
              <div className="grid grid-cols-2 gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setAvatarSource('dicebear')}
                  className={`py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition cursor-pointer ${
                    avatarSource === 'dicebear'
                      ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Robot Generator
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarSource('custom')}
                  className={`py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition cursor-pointer ${
                    avatarSource === 'custom'
                      ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  My Custom Pic
                </button>
              </div>
            </div>

            {avatarSource === 'dicebear' ? (
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Robot Generator Seed</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Enter unique seed"
                    value={seed} 
                    onChange={(e) => setSeed(e.target.value)}
                    className="flex-1 bg-black/40 text-xs font-mono text-white px-3.5 py-2 rounded-xl border border-white/5 focus:border-cyan-500/40 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={handleRandomizeSeed}
                    className="bg-white/5 hover:bg-white/10 text-cyan-400 px-3 rounded-xl border border-white/5 transition flex items-center justify-center cursor-pointer"
                    title="Randomize Avatar Seed"
                  >
                    <Dices size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Custom Picture upload option / drag & drop */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">Upload Profile Image</label>
                  
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                      dragOver 
                        ? 'border-cyan-500 bg-cyan-500/10' 
                        : 'border-white/10 hover:border-cyan-500/30 bg-black/20 hover:bg-black/30'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept="image/*" 
                      className="hidden" 
                    />
                    <Upload size={20} className="text-cyan-400 mb-2" />
                    <span className="text-[11px] font-bold text-gray-300">
                      {uploadProgress || 'Drag & drop image here or click to browse'}
                    </span>
                    <span className="text-[9px] text-gray-500 mt-1 uppercase font-semibold">Supports JPG, PNG, WEBP (Max 2MB)</span>
                  </div>
                </div>

                {/* Paste direct Image URL option */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Or Paste Image URL</label>
                    <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest flex items-center gap-0.5"><Link2 size={8} /> Web Link</span>
                  </div>
                  <input 
                    type="text"
                    placeholder="https://example.com/avatar.jpg"
                    value={customPhoto.startsWith('data:') ? '' : customPhoto} 
                    onChange={(e) => {
                      setCustomPhoto(e.target.value);
                      setError(null);
                    }}
                    className="w-full bg-black/40 text-xs text-white px-3.5 py-2 rounded-xl border border-white/5 focus:border-cyan-500/40 outline-none transition"
                  />
                  {customPhoto.startsWith('data:') && (
                    <span className="text-[9px] text-cyan-400/80 font-semibold mt-1 block">✓ Embedded image file loaded successfully</span>
                  )}
                </div>
              </div>
            )}

            <button 
              onClick={updateProfile}
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider py-2.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-cyan-500/10 mt-6"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : success ? (
                <span>Changes Saved!</span>
              ) : (
                <span>Save Profile Changes</span>
              )}
            </button>

            {error && (
              <p className="text-red-400 text-[11px] font-bold mt-2 text-center bg-red-500/10 border border-red-500/20 p-2 rounded-xl">
                {error}
              </p>
            )}

            {success && (
              <p className="text-cyan-400 text-[11px] font-bold mt-2 text-center bg-cyan-500/10 border border-cyan-500/20 p-2 rounded-xl">
                Profile updated successfully! Refreshing...
              </p>
            )}

            <button 
              onClick={() => signOut()}
              className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/35 font-black text-xs uppercase tracking-wider py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer mt-3 shadow-lg shadow-rose-500/5"
              title="Sign Out Account"
            >
              <LogOut size={14} />
              <span>Sign Out Account</span>
            </button>
          </div>
        </div>

        {/* Favorite Anime List / Security Settings - right column */}
        <div className="lg:col-span-8 bg-[#111] border border-white/5 p-6 rounded-2xl shadow-2xl min-h-[450px]">
          
          {/* Sub-tab Selection */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <div className="flex gap-4">
              <button
                onClick={() => setDashboardTab('favorites')}
                className={`flex items-center gap-1.5 pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer ${
                  dashboardTab === 'favorites'
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-gray-500 hover:text-gray-350'
                }`}
              >
                <Heart size={14} className={dashboardTab === 'favorites' ? "text-rose-500" : ""} fill={dashboardTab === 'favorites' ? "currentColor" : "none"} />
                <span>My Favorites ({favAnimes.length})</span>
              </button>
              <button
                onClick={() => setDashboardTab('security')}
                className={`flex items-center gap-1.5 pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer ${
                  dashboardTab === 'security'
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-gray-500 hover:text-gray-350'
                }`}
              >
                <Shield size={14} className={dashboardTab === 'security' ? "text-cyan-400" : ""} />
                <span>2FA Security</span>
              </button>
            </div>
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider bg-white/5 px-2.5 py-1 rounded-md hidden sm:inline">
              {dashboardTab === 'favorites' ? 'Collection Space' : 'Protection Panel'}
            </span>
          </div>

          {dashboardTab === 'favorites' ? (
            <>
              {favAnimes.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {favAnimes.map(anime => (
                    <div 
                      key={anime.id} 
                      onClick={() => onSelectVideo && onSelectVideo(anime)}
                      className="bg-black/40 border border-white/5 p-2 rounded-2xl hover:border-cyan-500/20 group cursor-pointer transition-all hover:-translate-y-0.5"
                    >
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-950">
                        <img 
                          src={anime.thumbnail} 
                          alt={anime.title} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-cyan-500 text-black p-2 rounded-full transform scale-90 group-hover:scale-100 transition-transform">
                            <Play size={16} fill="currentColor" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2.5 px-1 overflow-hidden">
                        <h4 className="text-xs font-black text-gray-200 truncate group-hover:text-cyan-400 transition-colors">
                          {anime.title}
                        </h4>
                        <span className="text-[10px] font-bold text-gray-500 block capitalize mt-0.5">
                          {anime.category} • {anime.year || '2026'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-20">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-gray-500">
                    <Heart size={28} />
                  </div>
                  <h4 className="text-sm font-black text-gray-300 uppercase tracking-wider">Your List is Empty</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs">
                    Browse our anime database and click on "Add to List" to save your top titles here.
                  </p>
                  {onClose && (
                    <button 
                      onClick={onClose}
                      className="mt-6 bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-cyan-350 text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-full border border-white/5 transition cursor-pointer"
                    >
                      Explore Anime
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="py-2 animate-fadeIn">
              <SecuritySettings />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
