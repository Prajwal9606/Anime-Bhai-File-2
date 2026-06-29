/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Video } from './types';
import { MOCK_VIDEOS } from './data/mockData';
import { Search, User, LogOut, Heart, Film, Tv, Compass, ShieldAlert, Sparkles, X, ChevronRight, ArrowLeft, Shield, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import logo from '../assets/.aistudio/logo.jpeg';
import AdminPanel from './components/AdminPanel';
import AnimeCard from './components/AnimeCard';
import ShowDetails from './components/ShowDetails';
import TheaterView from './components/TheaterView';
import LoginScreen from './components/LoginScreen';
import SecuritySettings from './components/SecuritySettings';
import AdminLoginScreen from './components/AdminLoginScreen';

function AnimeBhaiApp() {
  const { user, signOut, isDemoMode } = useAuth();
  
  const isAdmin = user?.role === 'admin' || 
                  user?.email?.toLowerCase() === 'prajwalgadade9606@gmail.com'.toLowerCase() ||
                  user?.email?.toLowerCase() === 'prajwalgadade96@gmail.com'.toLowerCase();

  const [firestoreVideos, setFirestoreVideos] = useState<Video[]>([]);
  const [allVideos, setAllVideos] = useState<Video[]>(MOCK_VIDEOS);
  const [bannerImage, setBannerImage] = useState<string | null>(null);

  // Fetch AniList banner image
  useEffect(() => {
    if (allVideos.length > 0) {
      const fetchBanner = async () => {
        const query = `
          query ($search: String) {
            Media(search: $search, type: ANIME) {
              bannerImage
            }
          }
        `;
        const variables = { search: allVideos[0].title };
        try {
          const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables })
          });
          const data = await response.json();
          if (data.data?.Media?.bannerImage) {
            setBannerImage(data.data.Media.bannerImage);
          }
        } catch (err) {
          console.error("AniList fetch error:", err);
        }
      };
      fetchBanner();
    }
  }, [allVideos]);
  const [activeTab, setActiveTab] = useState<'home' | 'anime' | 'movies' | 'favorites' | 'security'>('home');
  const [aal2Verified, setAal2Verified] = useState<boolean>(true);
  const [checkingAal, setCheckingAal] = useState<boolean>(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);
  const [activeEpisodeIndex, setActiveEpisodeIndex] = useState<number>(0);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLoginTab, setShowLoginTab] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const lastUserEmailRef = useRef<string | null>(null);

  // Automatically open Admin Panel when an admin logs in
  useEffect(() => {
    if (user) {
      if (isAdmin && lastUserEmailRef.current !== user.email) {
        setShowAdmin(true);
        setShowLoginTab(false);
        setShowAdminLogin(false);
      }
      lastUserEmailRef.current = user.email || null;
    } else {
      lastUserEmailRef.current = null;
    }
  }, [user, isAdmin]);

  // Close login overlay when user successfully logs in
  useEffect(() => {
    if (user && showLoginTab) {
      setShowLoginTab(false);
    }
  }, [user, showLoginTab]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('animebhai_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Redirect to home if user logs out while viewing favorites or security settings
  useEffect(() => {
    if (!user && (activeTab === 'favorites' || activeTab === 'security')) {
      setActiveTab('home');
    }
  }, [user, activeTab]);

  // Check MFA AAL level when playing video
  useEffect(() => {
    async function verifyStreamAal() {
      if (playingVideo && user) {
        if (!isDemoMode && supabase) {
          setCheckingAal(true);
          try {
            const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            if (data) {
              if (data.nextLevel === 'aal2' && data.currentLevel !== 'aal2') {
                // MFA is active but user is only at aal1!
                setAal2Verified(false);
              } else {
                setAal2Verified(true);
              }
            }
          } catch (err) {
            console.error('Error verifying assurance level:', err);
          } finally {
            setCheckingAal(false);
          }
        } else if (isDemoMode) {
          // Demo Mode check
          const isSimMfa = localStorage.getItem(`animebhai_mfa_enabled_${user.email}`) === 'true';
          setAal2Verified(true);
        }
      } else {
        setAal2Verified(true);
      }
    }
    verifyStreamAal();
  }, [playingVideo, user, isDemoMode]);

  // Listen to Firestore real-time videos
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'videos'), (snapshot) => {
      const vids = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          description: data.description || 'Custom uploaded title on Anime Bhai platform.',
          thumbnail: data.thumbnail || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop',
          videoUrl: data.videoUrl || '',
          category: data.category || 'anime',
          createdAt: data.createdAt || new Date().toISOString(),
          rating: data.rating || '4.5',
          year: data.year || '2024',
          genres: data.genres || [data.category === 'movie' ? 'Movie' : 'Anime', 'Action'],
          duration: data.duration || (data.category === 'movie' ? '2h 5m' : '24m'),
          backdrop: data.backdrop || data.thumbnail || '',
          episodes: data.episodes || []
        } as Video;
      });
      setFirestoreVideos(vids);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'videos');
    });
    return unsubscribe;
  }, []);

  // Merge Firestore Videos and Mock Videos
  useEffect(() => {
    const merged = [...firestoreVideos];
    MOCK_VIDEOS.forEach(mockVid => {
      if (!merged.some(v => v.title.toLowerCase() === mockVid.title.toLowerCase())) {
        merged.push(mockVid);
      }
    });
    setAllVideos(merged);
  }, [firestoreVideos]);

  // Sync favorites to local storage
  const handleToggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      localStorage.setItem('animebhai_favorites', JSON.stringify(next));
      return next;
    });
  };

  // Click outside search suggestions closes dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter videos according to tab and query
  const filteredVideos = allVideos.filter(video => {
    if (activeTab === 'anime' && video.category !== 'anime') return false;
    if (activeTab === 'movies' && video.category !== 'movie') return false;
    if (activeTab === 'favorites' && !favorites.includes(video.id)) return false;
    return true;
  });

  // Search filter
  const searchResults = searchQuery.trim() === '' 
    ? [] 
    : allVideos.filter(v => 
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (v.genres && v.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase())))
      );

  const handleSelectVideo = (video: Video) => {
    setSelectedVideo(video);
    setPlayingVideo(null);
    setShowLoginTab(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlayEpisode = async (index: number) => {
    if (selectedVideo) {
      setPlayingVideo(selectedVideo);
      setActiveEpisodeIndex(index);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePlayMovie = async () => {
    if (selectedVideo) {
      setPlayingVideo(selectedVideo);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] font-sans overflow-x-hidden">
      
      {/* Sticky Header Navigation */}
      <header className="sticky top-0 z-50 bg-[#050505]/85 backdrop-blur-md border-b border-white/5 py-4 px-6 transition duration-300">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Tab Links */}
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
            <div 
              onClick={() => {
                setSelectedVideo(null);
                setPlayingVideo(null);
                setActiveTab('home');
                setShowAdmin(false);
                setShowLoginTab(false);
              }}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(34,211,238,0.25)] border border-cyan-500/20 group-hover:scale-105 transition-all">
                <img src={logo} alt="Anime Bhai Logo" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-xl font-black text-white tracking-tighter uppercase">
                ANIME<span className="text-cyan-400 font-black">BHAI</span>
              </h1>
            </div>

            <nav className="flex items-center gap-1 sm:gap-2">
              {[
                { id: 'home', label: 'Home', icon: Compass },
                { id: 'anime', label: 'Anime Series', icon: Tv },
                { id: 'movies', label: 'Movies', icon: Film },
                ...(user ? [
                  { id: 'favorites', label: 'My List', icon: Heart },
                  { id: 'security', label: '2FA Security', icon: Shield }
                ] : [])
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id && !showAdmin && !selectedVideo && !playingVideo && !showLoginTab;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setSelectedVideo(null);
                      setPlayingVideo(null);
                      setShowAdmin(false);
                      setShowLoginTab(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition ${
                      isActive 
                        ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/15' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={12} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Search, Admin Access, & User Controls */}
          <div className="flex items-center justify-end gap-4 w-full md:w-auto">
            
            {/* Search Input block with auto-suggestions */}
            <div ref={searchRef} className="relative w-full sm:w-64">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search title, genre..." 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full bg-[#111111] text-xs font-semibold text-white pl-9 pr-8 py-2 rounded-full border border-white/5 focus:border-cyan-500/40 focus:bg-[#151515] outline-none transition"
                />
                <Search size={14} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500" />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && searchQuery.trim() !== '' && (
                <div className="absolute top-full right-0 mt-2 w-full sm:w-80 bg-[#111111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 max-h-[360px] overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <div className="p-2 space-y-1">
                      <span className="block text-[10px] font-black uppercase text-cyan-400 tracking-wider px-3 py-1.5">
                        Matches Found ({searchResults.length})
                      </span>
                      {searchResults.map(video => (
                        <div 
                          key={video.id}
                          onClick={() => {
                            handleSelectVideo(video);
                            setShowSuggestions(false);
                            setSearchQuery('');
                          }}
                          className="flex gap-3 p-2 hover:bg-white/5 rounded-xl cursor-pointer transition"
                        >
                          <img src={video.thumbnail || undefined} alt={video.title} className="w-14 aspect-video object-cover rounded-lg bg-zinc-950 flex-shrink-0" />
                          <div className="overflow-hidden">
                            <h4 className="text-xs font-black text-white truncate">{video.title}</h4>
                            <span className="text-[10px] text-gray-400 capitalize">{video.category} • {video.year}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-gray-500 font-bold">
                      No titles match "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Admin trigger */}
            {isAdmin && (
              <button 
                onClick={() => {
                  setShowAdmin(!showAdmin);
                  setSelectedVideo(null);
                  setPlayingVideo(null);
                  setShowLoginTab(false);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 border transition ${
                  showAdmin 
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-md shadow-amber-500/10' 
                    : 'bg-black/40 border-white/5 text-gray-400 hover:text-amber-400 hover:border-amber-400/20'
                }`}
                title="Admin Control Center"
              >
                <ShieldAlert size={12} />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            {/* Profile authentication controls */}
            {user ? (
              <div className="flex items-center gap-2.5 border-l border-white/5 pl-4 group/profile relative">
                <div className="flex items-center gap-2 cursor-pointer">
                  <img src={user.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=fallback'} alt="User" className="w-8 h-8 rounded-xl border border-cyan-500/20" />
                  <div className="hidden lg:block text-left">
                    <span className="block text-[10px] font-black uppercase text-cyan-400 tracking-wider">Online</span>
                    <span className="block text-[11px] font-bold text-gray-300 max-w-[100px] truncate">{user.displayName || user.email}</span>
                  </div>
                </div>
                <button 
                  onClick={() => signOut()}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-white/5 transition"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setShowLoginTab(true);
                  setSelectedVideo(null);
                  setPlayingVideo(null);
                  setShowAdmin(false);
                }} 
                className="bg-cyan-500 text-black px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider hover:bg-cyan-400 transition"
              >
                Sign In
              </button>
            )}

          </div>

        </div>
      </header>

      {/* Primary Main Content layout router */}
      <main className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-140px)]">
        
        {/* Helper to allow clicking child cards inside lists to trigger details */}
        {allVideos.map(v => (
          <button 
            key={v.id} 
            id={`card-trigger-${v.id}`} 
            className="hidden" 
            onClick={() => handleSelectVideo(v)} 
          />
        ))}

        {showAdminLogin ? (
          <AdminLoginScreen 
            onSuccess={() => {
              setShowAdminLogin(false);
              setShowAdmin(true);
            }}
            onCancel={() => setShowAdminLogin(false)}
          />
        ) : showLoginTab ? (
          <LoginScreen 
            onSuccess={() => setShowLoginTab(false)}
            onCancel={() => setShowLoginTab(false)}
          />
        ) : showAdmin && isAdmin ? (
          <div className="max-w-7xl mx-auto">
            <button 
              onClick={() => setShowAdmin(false)}
              className="mb-6 inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-cyan-400 font-extrabold uppercase tracking-widest transition"
            >
              <ArrowLeft size={14} /> Back to dashboard
            </button>
            <AdminPanel videos={allVideos} />
          </div>
        ) : playingVideo ? (
          // 1. THEATER PLAYER VIEW
          <TheaterView 
            video={playingVideo}
            activeEpisodeIndex={activeEpisodeIndex}
            onSelectEpisode={setActiveEpisodeIndex}
            onBackToDetails={() => {
              setPlayingVideo(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBackToHome={() => {
              setPlayingVideo(null);
              setSelectedVideo(null);
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            allVideos={allVideos}
            user={user}
          />
        ) : selectedVideo ? (
          // 2. DETAILED INFORMATION PAGE
          <ShowDetails 
            video={selectedVideo}
            onBack={() => {
              setSelectedVideo(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onPlayEpisode={handlePlayEpisode}
            onPlayMovie={handlePlayMovie}
            onToggleFavorite={handleToggleFavorite}
            isFavorite={favorites.includes(selectedVideo.id)}
          />
        ) : (
          // 3. DASHBOARD / GRID TABS VIEW
          <div className="max-w-7xl mx-auto space-y-12">
            
            {activeTab === 'security' ? (
              <SecuritySettings />
            ) : (
              <>
                {/* Show dynamic billboard hero banner strictly in Home Tab */}
                {activeTab === 'home' && allVideos.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl overflow-hidden relative h-[380px] md:h-[480px] flex items-end p-6 md:p-12 border border-white/5 shadow-2xl shadow-cyan-500/5 group/hero"
                  >
                    {/* Backdrop cover and fades */}
                    <div className="absolute inset-0">
                      <img 
                        src={bannerImage || allVideos[0].backdrop || allVideos[0].thumbnail || undefined} 
                        alt={allVideos[0].title} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/hero:scale-[1.02]" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/30 to-transparent"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/90 via-transparent to-transparent"></div>
                    </div>

                    <div className="relative z-10 max-w-2xl space-y-4">
                      {/* Glowing Spotlight Badge */}
                      <div className="inline-flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-400/35 text-cyan-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
                        <Sparkles size={11} className="animate-pulse" />
                        Spotlight No.1
                      </div>

                      <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none">
                        {allVideos[0].title}
                      </h2>

                      <p className="text-gray-300 text-xs md:text-sm leading-relaxed font-semibold line-clamp-3">
                        {allVideos[0].description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button 
                          onClick={() => handleSelectVideo(allVideos[0])}
                          className="bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-500/15 transition transform hover:scale-105"
                        >
                          Watch Now
                          <ChevronRight size={14} />
                        </button>
                        <button 
                          onClick={() => handleToggleFavorite(allVideos[0].id)}
                          className={`px-4 py-3 rounded-xl border font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition ${
                            favorites.includes(allVideos[0].id)
                              ? 'bg-red-500/15 border-red-500/30 text-red-400'
                              : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/15'
                          }`}
                        >
                          <Heart size={14} fill={favorites.includes(allVideos[0].id) ? "currentColor" : "none"} />
                          {favorites.includes(allVideos[0].id) ? "In My List" : "Add to List"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Lists categorized view */}
                {activeTab === 'home' ? (
                  <div className="space-y-12">
                    {/* 1. Trending Now Carousel */}
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-6 bg-cyan-500 rounded-full" />
                          <h3 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">
                            Trending Now
                          </h3>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {allVideos.slice(0, 4).map(video => (
                          <AnimeCard 
                            key={video.id} 
                            video={video} 
                            onClick={() => handleSelectVideo(video)} 
                          />
                        ))}
                      </div>
                    </div>

                    {/* 2. Anime Series Column Grid */}
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-6 bg-cyan-500 rounded-full" />
                          <h3 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">
                            Anime Series
                          </h3>
                        </div>
                        <button 
                          onClick={() => setActiveTab('anime')}
                          className="text-xs text-cyan-400 hover:text-white font-extrabold uppercase tracking-widest flex items-center gap-1 transition"
                        >
                          View All <ChevronRight size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {allVideos.filter(v => v.category === 'anime').slice(0, 4).map(video => (
                          <AnimeCard 
                            key={video.id} 
                            video={video} 
                            onClick={() => handleSelectVideo(video)} 
                          />
                        ))}
                      </div>
                    </div>

                    {/* 3. Top Rated Movies Column Grid */}
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-6 bg-cyan-500 rounded-full" />
                          <h3 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">
                            Featured Movies
                          </h3>
                        </div>
                        <button 
                          onClick={() => setActiveTab('movies')}
                          className="text-xs text-cyan-400 hover:text-white font-extrabold uppercase tracking-widest flex items-center gap-1 transition"
                        >
                          View All <ChevronRight size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {allVideos.filter(v => v.category === 'movie').slice(0, 4).map(video => (
                          <AnimeCard 
                            key={video.id} 
                            video={video} 
                            onClick={() => handleSelectVideo(video)} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Individual tab grids
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                      <div className="w-1.5 h-6 bg-cyan-500 rounded-full" />
                      <h3 className="text-2xl font-black tracking-tight text-white uppercase">
                        {activeTab === 'anime' ? 'Anime Series catalog' : 
                        activeTab === 'movies' ? 'Movies list' : 'My saved favorites'}
                      </h3>
                    </div>
                    {filteredVideos.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredVideos.map(video => (
                          <AnimeCard 
                            key={video.id} 
                            video={video} 
                            onClick={() => handleSelectVideo(video)} 
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="py-20 text-center">
                        <p className="text-gray-500 font-bold text-sm">
                          {activeTab === 'favorites' 
                            ? 'Your list is empty. Add titles to your watch list using the heart icon on any details page!' 
                            : 'No titles have been uploaded under this category yet.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

          </div>
        )}

      </main>

      {/* Footer Branding credits */}
      <footer className="border-t border-white/5 py-8 mt-20 bg-black/60">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-gray-500">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">ANIME<span className="text-cyan-400">BHAI</span></span>
              <span>© 2026. All rights reserved.</span>
            </div>
            <span className="hidden sm:inline text-white/10">|</span>
            <button
              id="admin-footer-trigger"
              onClick={() => {
                setShowAdminLogin(true);
                setShowLoginTab(false);
                setSelectedVideo(null);
                setPlayingVideo(null);
                setShowAdmin(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-[10px] text-gray-600 hover:text-cyan-400 font-black uppercase tracking-widest transition flex items-center gap-1.5 cursor-pointer"
              title="Secure Administrator Portal"
            >
              <span className="w-1.5 h-1.5 bg-cyan-500/50 rounded-full" />
              Admin Portal
            </button>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Contact Us</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AnimeBhaiApp />
    </AuthProvider>
  );
}
