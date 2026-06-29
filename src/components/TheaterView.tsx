import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, MessageSquare, Send, Calendar, Clock, Star, Heart, Flame,
  Tv, Search, Grid, List, Eye, Volume2, Lightbulb, Maximize2, Minimize2,
  ChevronRight, Info, Sparkles, Share2, Compass, HelpCircle, Radio, Play,
  Pause, FastForward, RotateCw, RotateCcw, Gauge, Video as VideoIcon, 
  Activity, Users, ThumbsUp, Trash2, Check, AlertCircle, VolumeX
} from 'lucide-react';
import { Video, Episode } from '../types';
import CustomPlayer from './CustomPlayer';
import AnimeCard from './AnimeCard';

interface TheaterViewProps {
  video: Video;
  activeEpisodeIndex: number;
  onSelectEpisode: (index: number) => void;
  onBackToDetails: () => void;
  onBackToHome: () => void;
  allVideos: Video[];
  user: any;
}

interface Comment {
  id: string;
  user: string;
  photoURL?: string;
  text: string;
  timestamp: string;
  likes: number;
}

interface ChatMessage {
  id: string;
  user: string;
  avatar: string;
  text: string;
  timestamp: string;
  badge?: string;
  color: string;
}

export default function TheaterView({
  video,
  activeEpisodeIndex,
  onSelectEpisode,
  onBackToDetails,
  onBackToHome,
  allVideos,
  user
}: TheaterViewProps) {
  const isAnime = video.category === 'anime';

  // -------------------------------------------------------------
  // Dynamic Episodes Compilation
  // -------------------------------------------------------------
  const displayEpisodes = video.episodes && video.episodes.length > 0
    ? video.episodes
    : isAnime
      ? [
          {
            id: 'auto-ep1',
            number: 1,
            title: 'Episode 1: The Journey Begins',
            videoUrl: video.videoUrl,
            duration: '24:00',
            description: 'Introduction to the world, meeting our core protagonist, and establishing the primary challenges ahead.'
          },
          {
            id: 'auto-ep2',
            number: 2,
            title: 'Episode 2: Unveiling Powers',
            videoUrl: video.videoUrl,
            duration: '23:30',
            description: 'A trial by fire forces our heroes to discover hidden inner potential and form strategic alliances.'
          },
          {
            id: 'auto-ep3',
            number: 3,
            title: 'Episode 3: The Gathering Storm',
            videoUrl: video.videoUrl,
            duration: '24:15',
            description: 'Antagonistic forces begin coordinate attacks, laying down groundwork for an immersive epic confrontation.'
          }
        ]
      : [];

  const currentEpisode: Episode | null = isAnime && displayEpisodes.length > activeEpisodeIndex
    ? displayEpisodes[activeEpisodeIndex]
    : null;

  // -------------------------------------------------------------
  // Dynamic Servers & Audio Tracks Handler (Aniwave Style)
  // -------------------------------------------------------------
  const [activeLanguage, setActiveLanguage] = useState<'Hindi' | 'Japanese' | 'English'>('Hindi');
  const [activeServer, setActiveServer] = useState<'hd1' | 'hd2' | 'embed'>('hd1');

  // Sync default available language when active episode changes
  useEffect(() => {
    if (currentEpisode) {
      const sources = currentEpisode.audioSources || [];
      if (sources.length > 0) {
        // Auto select first available language in Hindi -> Japanese -> English order
        const hasHindi = sources.some(s => s.lang === 'Hindi');
        const hasJapanese = sources.some(s => s.lang === 'Japanese');
        const hasEnglish = sources.some(s => s.lang === 'English');

        if (hasHindi) setActiveLanguage('Hindi');
        else if (hasJapanese) setActiveLanguage('Japanese');
        else if (hasEnglish) setActiveLanguage('English');
        else setActiveLanguage(sources[0].lang);
      } else {
        setActiveLanguage('Hindi'); // default fallback
      }

      // Reset to primary HD server when episode changes
      if (currentEpisode.embedHtml) {
        setActiveServer('embed');
      } else {
        setActiveServer('hd1');
      }
    }
  }, [activeEpisodeIndex, video.id]);

  // Compute actual active streaming inputs to send to the Player
  const getActivePlayback = () => {
    if (!currentEpisode) {
      return {
        url: video.videoUrl,
        embed: undefined,
        sources: undefined
      };
    }

    const sources = currentEpisode.audioSources || [];
    const matchedSource = sources.find(s => s.lang === activeLanguage);

    // If the server selected is the embed iframe
    if (activeServer === 'embed' && currentEpisode.embedHtml) {
      return {
        url: '',
        embed: currentEpisode.embedHtml,
        sources: undefined
      };
    }

    // Server HD-1/HD-2 routing
    if (matchedSource) {
      return {
        url: matchedSource.url,
        embed: undefined,
        sources: sources
      };
    }

    // Fallback if no specific language match found
    return {
      url: currentEpisode.videoUrl || video.videoUrl,
      embed: currentEpisode.embedHtml,
      sources: sources.length > 0 ? sources : undefined
    };
  };

  const { url: currentVideoUrl, embed: currentEmbedHtml, sources: currentAudioSources } = getActivePlayback();

  const playerTitle = currentEpisode ? `${video.title} - Episode ${currentEpisode.number}` : video.title;
  const playerSubtitle = currentEpisode ? currentEpisode.title : 'Full Length Movie';

  // -------------------------------------------------------------
  // Player Controls Toolbar Settings (Persisted in State)
  // -------------------------------------------------------------
  const [autoPlay, setAutoPlay] = useState(true);
  const [autoNext, setAutoNext] = useState(true);
  const [autoSkip, setAutoSkip] = useState(false);
  const [lightsOff, setLightsOff] = useState(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [showSkipNotify, setShowSkipNotify] = useState(false);

  // Trigger brief alert when auto-skip is enabled and video begins
  useEffect(() => {
    if (autoSkip) {
      setShowSkipNotify(true);
      const timer = setTimeout(() => setShowSkipNotify(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [activeEpisodeIndex, autoSkip]);

  // -------------------------------------------------------------
  // Interactive Live Chat simulation & Forums Board
  // -------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<'chat' | 'comments'>('chat');
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 'c1',
      user: 'Zoro_Fan99',
      photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop',
      text: "The pacing in this episode was absolutely phenomenal! The animation on the swordplay literally rivaled some movie production values. Can't wait to see how they resolve that massive cliffhanger!",
      timestamp: '2 hours ago',
      likes: 42
    },
    {
      id: 'c2',
      user: 'Natsu_FireDragon',
      photoURL: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop',
      text: "Is it just me or does the Hindi Dub sound incredible? The voice actors did a fantastic job capturing the original spirit. Pure nostalgic magic!",
      timestamp: '4 hours ago',
      likes: 31
    },
    {
      id: 'c3',
      user: 'Megumin_Explosion',
      photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop',
      text: "That wizard battle at 14:20 is definitely going down in the history of anime. Frame by frame masterpiece. 10/10 Animewave delivers as usual!",
      timestamp: 'Yesterday',
      likes: 19
    }
  ]);
  const [commentInput, setCommentInput] = useState('');

  // Live Chat stream simulation
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', user: 'LuffyG5', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Luffy', text: 'LETS GOOOOO! EP 12 IS FINALLY HERE!', timestamp: '12:01', color: 'text-orange-400', badge: 'Pirate King' },
    { id: '2', user: 'ShadowMonarch', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Shadow', text: 'Anyone watching the Hindi dub? Highly recommended!', timestamp: '12:01', color: 'text-purple-400', badge: 'VIP' },
    { id: '3', user: 'GokuBlue', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Goku', text: 'Is this the season finale?', timestamp: '12:02', color: 'text-cyan-400' },
    { id: '4', user: 'Sukuna_Cursed', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sukuna', text: 'The fight choreo is insane. CloverWorks never misses.', timestamp: '12:02', color: 'text-rose-400', badge: 'Mod' },
    { id: '5', user: 'Hokage_Uz', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Uz', text: 'Dattebayo! That OP song slaps so hard.', timestamp: '12:03', color: 'text-amber-400' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Simulated live message ticker
  useEffect(() => {
    const randomUsers = [
      { name: 'Saitama_OnePunch', badge: 'OP', color: 'text-yellow-400' },
      { name: 'Mikasa_Ackerman', badge: 'VIP', color: 'text-red-400' },
      { name: 'Tanjiro_Breath', badge: 'Slayer', color: 'text-emerald-400' },
      { name: 'Deku_AllForOne', badge: 'Hero', color: 'text-green-400' },
      { name: 'Rimuru_Slime', badge: 'Demon', color: 'text-blue-400' },
      { name: 'Gojo_Infinity', badge: 'Honored', color: 'text-cyan-400' }
    ];

    const randomMessages = [
      "OMG, did you guys see that animation sequence??",
      "I love the sound effects of the magic spells!",
      "HINDI dub quality is so professional wow",
      "Auto skip is a lifesaver, direct action!",
      "Zoro would get lost in this player layout lol",
      "Is there a manga chapter where this continues?",
      "Highly recommend everyone to watch Season 1 first!",
      "That background music is sending shivers down my spine.",
      "CloverWorks Studio did an amazing job here.",
      "The voice acting makes it 100x more emotional.",
      "Fell off my chair at the cliffhanger!"
    ];

    const chatTicker = setInterval(() => {
      if (activeTab === 'chat') {
        const randomUser = randomUsers[Math.floor(Math.random() * randomUsers.length)];
        const randomText = randomMessages[Math.floor(Math.random() * randomMessages.length)];
        const now = new Date();
        const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const newMessage: ChatMessage = {
          id: `ticker-${Date.now()}`,
          user: randomUser.name,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${randomUser.name}`,
          text: randomText,
          timestamp,
          badge: randomUser.badge,
          color: randomUser.color
        };

        setChatMessages(prev => [...prev.slice(-30), newMessage]);
      }
    }, 4500);

    return () => clearInterval(chatTicker);
  }, [activeTab]);

  // Scroll to chat end
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      user: user?.displayName || user?.email?.split('@')[0] || 'Anonymous_Otaku',
      photoURL: user?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id || 'guest'}`,
      text: commentInput.trim(),
      timestamp: 'Just now',
      likes: 0
    };

    setComments([newComment, ...comments]);
    setCommentInput('');
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newMsg: ChatMessage = {
      id: `user-msg-${Date.now()}`,
      user: user?.displayName || user?.email?.split('@')[0] || 'MyGuest',
      avatar: user?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id || 'guest'}`,
      text: chatInput.trim(),
      timestamp,
      color: 'text-cyan-400',
      badge: 'User'
    };

    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');
  };

  const toggleLikeComment = (id: string) => {
    setComments(comments.map(c => c.id === id ? { ...c, likes: c.likes + 1 } : c));
  };

  // -------------------------------------------------------------
  // Episode Selector Filters & Formats (Zoro Grid vs Detail List)
  // -------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeRange, setActiveRange] = useState('1-50');

  // Filtered episodes based on search query
  const filteredEpisodes = displayEpisodes.filter(ep => 
    ep.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ep.number.toString() === searchQuery
  );

  // Grouping ranges (for huge shows like One Piece, otherwise default to single 1-50 range)
  const rangeGroups = ['1-50'];

  // -------------------------------------------------------------
  // Video Ended callback (Auto Play Next)
  // -------------------------------------------------------------
  const hasNextEpisode = isAnime && activeEpisodeIndex < displayEpisodes.length - 1;
  const triggerNextEpisode = () => {
    if (hasNextEpisode) {
      onSelectEpisode(activeEpisodeIndex + 1);
    }
  };

  // Recommendations
  const recommendedVideos = allVideos
    .filter(v => v.id !== video.id)
    .slice(0, 5);

  return (
    <div className="relative min-h-screen bg-[#07070a] text-gray-100 font-sans pb-16">
      
      {/* Lights Out Dim Curtain Overlay */}
      <AnimatePresence>
        {lightsOff && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.95 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 space-y-6">
        
        {/* BREADCRUMB BAR (Aniwave Style) */}
        <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 py-1 gap-4 relative z-50">
          <div className="flex items-center gap-2">
            <button onClick={onBackToHome} className="hover:text-cyan-400 font-bold transition flex items-center gap-1">
              Home
            </button>
            <ChevronRight size={12} className="text-gray-700" />
            <span className="capitalize">{video.category === 'movie' ? 'Movies' : 'TV Series'}</span>
            <ChevronRight size={12} className="text-gray-700" />
            <button onClick={onBackToDetails} className="hover:text-cyan-400 font-bold max-w-[200px] md:max-w-xs truncate transition">
              {video.title}
            </button>
            {currentEpisode && (
              <>
                <ChevronRight size={12} className="text-gray-700" />
                <span className="text-cyan-400 font-extrabold font-mono">Episode {currentEpisode.number}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={onBackToDetails}
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-cyan-400 font-black uppercase tracking-wider transition bg-white/5 px-3 py-1.5 rounded-lg border border-white/5"
            >
              <ArrowLeft size={12} /> Back to Details
            </button>
            <span className="text-gray-800">|</span>
            <span className="bg-cyan-500/10 text-cyan-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-cyan-400/20 flex items-center gap-1">
              <Activity size={10} className="animate-pulse" />
              HD STREAMING SERVER
            </span>
          </div>
        </div>

        {/* MAIN THEATER GRID SYSTEM */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* PLAYER COLUMNS (Width adjusts dynamically on expansion) */}
          <div className={`${isPlayerExpanded ? 'lg:col-span-4' : 'lg:col-span-3'} space-y-4 relative z-50`}>
            
            {/* COMPACT PLAYER PANEL */}
            <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black">
              <CustomPlayer 
                videoUrl={currentVideoUrl}
                audioSources={currentAudioSources}
                embedHtml={currentEmbedHtml}
                title={playerTitle}
                subtitle={playerSubtitle}
                onNextEpisode={triggerNextEpisode}
                hasNextEpisode={hasNextEpisode}
              />

              {/* Auto Skip Intro Notification Overlay */}
              <AnimatePresence>
                {showSkipNotify && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="absolute bottom-20 left-6 bg-gradient-to-r from-cyan-600 to-cyan-800 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 z-30"
                  >
                    <Sparkles className="w-4 h-4 animate-spin text-black" />
                    <span>Auto-Skip Intro is Active! Skipping recap...</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* PLAYER CONTROL SWITCHERS BAR (Aniwave signature bar) */}
            <div className="bg-[#0f0f13] border border-white/5 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-4 text-gray-400 font-bold">
                
                {/* Auto Play */}
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <input 
                    type="checkbox" 
                    checked={autoPlay} 
                    onChange={e => setAutoPlay(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-8 h-4 rounded-full transition-colors flex items-center p-0.5 ${autoPlay ? 'bg-cyan-500' : 'bg-zinc-800'}`}>
                    <div className={`w-3 h-3 rounded-full bg-black transition-transform ${autoPlay ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <span className="group-hover:text-white transition">Auto Play</span>
                </label>

                {/* Auto Next */}
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <input 
                    type="checkbox" 
                    checked={autoNext} 
                    onChange={e => {
                      setAutoNext(e.target.checked);
                      if (e.target.checked) setAutoPlay(true);
                    }}
                    className="sr-only"
                  />
                  <div className={`w-8 h-4 rounded-full transition-colors flex items-center p-0.5 ${autoNext ? 'bg-cyan-500' : 'bg-zinc-800'}`}>
                    <div className={`w-3 h-3 rounded-full bg-black transition-transform ${autoNext ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <span className="group-hover:text-white transition">Auto Next</span>
                </label>

                {/* Auto Skip Intro */}
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <input 
                    type="checkbox" 
                    checked={autoSkip} 
                    onChange={e => setAutoSkip(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-8 h-4 rounded-full transition-colors flex items-center p-0.5 ${autoSkip ? 'bg-cyan-500' : 'bg-zinc-800'}`}>
                    <div className={`w-3 h-3 rounded-full bg-black transition-transform ${autoSkip ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <span className="group-hover:text-white transition">Auto Skip OP/ED</span>
                </label>

              </div>

              {/* Action Utilities (Lights / Dimensions) */}
              <div className="flex items-center gap-2">
                
                {/* Light switch */}
                <button 
                  onClick={() => setLightsOff(!lightsOff)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition font-bold ${
                    lightsOff 
                      ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' 
                      : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Turn off surrounding page lights"
                >
                  <Lightbulb size={13} className={lightsOff ? 'animate-bounce' : ''} />
                  <span>{lightsOff ? 'Lights On' : 'Lights Off'}</span>
                </button>

                {/* Resize width switcher */}
                <button 
                  onClick={() => setIsPlayerExpanded(!isPlayerExpanded)}
                  className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition font-bold"
                  title={isPlayerExpanded ? "Contract view" : "Expand view"}
                >
                  {isPlayerExpanded ? (
                    <>
                      <Minimize2 size={13} />
                      <span>Shrink</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 size={13} />
                      <span>Expand</span>
                    </>
                  )}
                </button>

              </div>
            </div>

            {/* HIGH FIDELITY SERVER SWITCHER BLOCK (Aniwave Dual Stream Style) */}
            <div className="bg-[#0f0f13] border border-white/5 rounded-3xl p-5 md:p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/5 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <h3 className="font-black text-xs uppercase tracking-widest text-white">
                      Streaming Servers Network
                    </h3>
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold">
                    Choose Hindi Dub, Japanese Sub, or English Dub file nodes below.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/5 self-start">
                  <span className="text-[9px] font-black uppercase text-gray-500 px-2">Format:</span>
                  <span className="bg-cyan-500/10 text-cyan-400 text-[9px] font-extrabold px-2 py-0.5 rounded-lg uppercase tracking-wider border border-cyan-400/10">SUB</span>
                  <span className="bg-purple-500/10 text-purple-400 text-[9px] font-extrabold px-2 py-0.5 rounded-lg uppercase tracking-wider border border-purple-400/10">DUB</span>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-extrabold px-2 py-0.5 rounded-lg uppercase tracking-wider border border-emerald-500/10">MULTY</span>
                </div>
              </div>

              {/* Serves list categorised by audio/sub track options */}
              <div className="space-y-4">
                
                {/* 1. HINDI DUB SERVERS BLOCK */}
                <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-3">
                  <div className="flex items-center gap-2 md:col-span-1 pt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-xs font-extrabold tracking-wider uppercase text-cyan-400">Hindi Dub 🎙️</span>
                  </div>
                  <div className="md:col-span-3 flex flex-wrap gap-2">
                    <button 
                      onClick={() => {
                        setActiveLanguage('Hindi');
                        setActiveServer('hd1');
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        activeLanguage === 'Hindi' && activeServer === 'hd1'
                          ? 'bg-cyan-500 text-black font-black shadow-lg shadow-cyan-500/20' 
                          : 'bg-black border border-white/5 text-gray-400 hover:text-white hover:bg-zinc-900'
                      }`}
                    >
                      <VideoIcon size={12} />
                      Server HD-1 (Vite)
                    </button>
                    {currentEpisode?.embedHtml && (
                      <button 
                        onClick={() => {
                          setActiveLanguage('Hindi');
                          setActiveServer('embed');
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          activeLanguage === 'Hindi' && activeServer === 'embed'
                            ? 'bg-cyan-500 text-black font-black shadow-lg shadow-cyan-500/20' 
                            : 'bg-black border border-white/5 text-gray-400 hover:text-white hover:bg-zinc-900'
                        }`}
                      >
                        <HelpCircle size={12} />
                        StreamP2P (Embed)
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. JAPANESE SUB SERVERS BLOCK */}
                <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-3 border-t border-white/5 pt-3">
                  <div className="flex items-center gap-2 md:col-span-1 pt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                    <span className="text-xs font-extrabold tracking-wider uppercase text-purple-400">Japanese Sub 🇯🇵</span>
                  </div>
                  <div className="md:col-span-3 flex flex-wrap gap-2">
                    <button 
                      onClick={() => {
                        setActiveLanguage('Japanese');
                        setActiveServer('hd1');
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        activeLanguage === 'Japanese' && activeServer === 'hd1'
                          ? 'bg-purple-500 text-black font-black shadow-lg shadow-purple-500/20' 
                          : 'bg-black border border-white/5 text-gray-400 hover:text-white hover:bg-zinc-900'
                      }`}
                    >
                      <VideoIcon size={12} />
                      Server JP-1 (Vite)
                    </button>
                  </div>
                </div>

                {/* 3. ENGLISH DUB SERVERS BLOCK */}
                <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-3 border-t border-white/5 pt-3">
                  <div className="flex items-center gap-2 md:col-span-1 pt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-extrabold tracking-wider uppercase text-emerald-400">English Dub 🇬🇧</span>
                  </div>
                  <div className="md:col-span-3 flex flex-wrap gap-2">
                    <button 
                      onClick={() => {
                        setActiveLanguage('English');
                        setActiveServer('hd1');
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        activeLanguage === 'English' && activeServer === 'hd1'
                          ? 'bg-emerald-500 text-black font-black shadow-lg shadow-emerald-500/20' 
                          : 'bg-black border border-white/5 text-gray-400 hover:text-white hover:bg-zinc-900'
                      }`}
                    >
                      <VideoIcon size={12} />
                      Server EN-1 (Vite)
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* EXPANDED PLACEHOLDER: If player width expanded, show layout grid shift */}
            {isPlayerExpanded && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. EPISODES BLOCK (PUSHED DOWN) */}
                <div className="lg:col-span-2">
                  <EpisodesBox 
                    isAnime={isAnime}
                    videoTitle={video.title}
                    displayEpisodes={displayEpisodes}
                    activeEpisodeIndex={activeEpisodeIndex}
                    onSelectEpisode={onSelectEpisode}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    activeRange={activeRange}
                    setActiveRange={setActiveRange}
                    rangeGroups={rangeGroups}
                    filteredEpisodes={filteredEpisodes}
                  />
                </div>

                {/* 2. CHAT OR SEASON RAIL (PUSHED DOWN) */}
                <div className="lg:col-span-1 space-y-4">
                  <SeasonsSwitcher />
                  <ProTipPanel />
                </div>

              </div>
            )}

            {/* ANIME DETAILS INFORMATION BANNER BELOW PLAYER (Aniwave premium table style) */}
            <div className="bg-[#0f0f13] border border-white/5 p-6 rounded-3xl">
              <div className="flex flex-col md:flex-row gap-6">
                
                {/* Left Side: high quality Poster */}
                <div className="w-32 md:w-44 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex-shrink-0 relative group self-center md:self-start bg-zinc-900">
                  <img 
                    src={video.thumbnail || undefined} 
                    alt={video.title} 
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-105" 
                    referrerPolicy="no-referrer"
                  />
                  {/* Rating Tag */}
                  <div className="absolute top-2 left-2 bg-cyan-500 text-black text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                    {video.rating || '4.8'}
                  </div>
                  {/* Category format tag */}
                  <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest border border-white/10">
                    {video.category === 'movie' ? 'MOVIE' : 'TV'}
                  </div>
                </div>

                {/* Right Side: details and descriptions */}
                <div className="flex-grow space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] bg-cyan-500/10 text-cyan-400 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest border border-cyan-400/20">
                        Trending #{video.year || '1'}
                      </span>
                      <span className="text-xs text-gray-500 font-bold">•</span>
                      <span className="text-xs text-gray-400 font-extrabold uppercase">{video.category} Showcase</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                      {video.title}
                    </h1>
                    {currentEpisode && (
                      <h3 className="text-sm font-black text-cyan-400">
                        Episode {currentEpisode.number} : {currentEpisode.title}
                      </h3>
                    )}
                  </div>

                  <p className="text-xs md:text-sm text-gray-400 leading-relaxed font-medium">
                    {currentEpisode?.description || video.description}
                  </p>

                  {/* Metadata Table Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 border-t border-white/5 pt-4 text-xs font-bold">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-gray-500 block">Japanese Name</span>
                      <span className="text-gray-200 truncate block">{video.title} (TV)</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-gray-500 block">Premiered</span>
                      <span className="text-gray-200 block">Spring {video.year || '2024'}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-gray-500 block">Status</span>
                      <span className="text-emerald-400 block">{video.status || 'Finished Airing'}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-gray-500 block">Studio</span>
                      <span className="text-gray-200 block">CloverWorks</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-gray-500 block">Genres</span>
                      <span className="text-gray-200 block truncate">{video.genres?.join(', ') || 'Action, Fantasy, Magic, Adventure'}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-gray-500 block">Duration</span>
                      <span className="text-gray-200 block">{video.duration || '24 min per ep'}</span>
                    </div>
                  </div>

                  {/* Social Sharing panel */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <button className="bg-cyan-500/15 border border-cyan-500/20 text-cyan-400 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-cyan-500 hover:text-black transition flex items-center gap-1.5 shadow-lg">
                      <Heart size={13} fill="currentColor" /> Add to Watchlist
                    </button>
                    <button className="bg-white/5 border border-white/5 text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5">
                      <Share2 size={13} /> Share with Friends
                    </button>
                  </div>

                </div>

              </div>
            </div>

            {/* LOWER PORTION DISCUSSION BOARDS */}
            <div className="bg-[#0f0f13] border border-white/5 rounded-3xl p-5 md:p-6 space-y-6">
              
              {/* Tab Navigation header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setActiveTab('chat')}
                    className={`text-xs font-black uppercase tracking-wider pb-2 border-b-2 transition flex items-center gap-1.5 ${
                      activeTab === 'chat' 
                        ? 'border-cyan-500 text-white' 
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <MessageSquare size={13} />
                    Live Room Chat ({chatMessages.length})
                  </button>
                  <button 
                    onClick={() => setActiveTab('comments')}
                    className={`text-xs font-black uppercase tracking-wider pb-2 border-b-2 transition flex items-center gap-1.5 ${
                      activeTab === 'comments' 
                        ? 'border-cyan-500 text-white' 
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <Users size={13} />
                    Fan Discussion Forums ({comments.length})
                  </button>
                </div>
                
                <span className="text-[10px] text-gray-500 font-extrabold uppercase hidden md:inline">
                  {activeTab === 'chat' ? '💬 real-time fan discussions' : '✍️ review forum board'}
                </span>
              </div>

              {/* TAB 1: LIVE ROOM CHAT (Zoro real-time feel) */}
              {activeTab === 'chat' && (
                <div className="space-y-4">
                  <div className="h-72 overflow-y-auto pr-1 space-y-3 custom-scrollbar flex flex-col">
                    {chatMessages.map(m => (
                      <div key={m.id} className="flex items-start gap-2.5 text-xs">
                        <img src={m.avatar} alt="Avatar" className="w-6 h-6 rounded-md bg-zinc-800" />
                        <div className="bg-black/25 rounded-xl p-2.5 border border-white/5 max-w-[85%]">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className={`font-black tracking-wide ${m.color}`}>{m.user}</span>
                            {m.badge && (
                              <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[8px] font-black uppercase tracking-widest px-1 rounded">
                                {m.badge}
                              </span>
                            )}
                            <span className="text-[9px] text-gray-600 font-mono">{m.timestamp}</span>
                          </div>
                          <p className="text-gray-300 font-medium break-all">{m.text}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  <form onSubmit={handleSendChatMessage} className="flex gap-2">
                    <input 
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder={user ? "Join the live stream conversation..." : "Login to join the live fan discussions..."}
                      disabled={!user}
                      className="flex-grow bg-black text-xs text-white px-4 py-3 rounded-xl border border-white/10 focus:border-cyan-500 outline-none transition font-semibold"
                    />
                    <button 
                      type="submit"
                      disabled={!user || !chatInput.trim()}
                      className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:hover:bg-cyan-500 text-black font-black uppercase text-xs px-4 rounded-xl transition flex items-center justify-center"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 2: FORUM DISCUSSIONS (Reviews) */}
              {activeTab === 'comments' && (
                <div className="space-y-6">
                  
                  {/* Post Comments form */}
                  <form onSubmit={handlePostComment} className="flex gap-3">
                    <img 
                      src={user?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id || 'guest'}`} 
                      alt="avatar" 
                      className="w-9 h-9 rounded-xl border border-white/15 bg-zinc-800"
                    />
                    <div className="relative flex-grow">
                      <input 
                        type="text"
                        placeholder={user ? "Write an episode review or comment..." : "Sign in to leave a review..."}
                        disabled={!user}
                        value={commentInput}
                        onChange={e => setCommentInput(e.target.value)}
                        className="w-full bg-black text-xs text-white pl-4 pr-12 py-3 rounded-xl border border-white/15 focus:border-cyan-500 outline-none transition font-semibold"
                      />
                      <button 
                        type="submit"
                        disabled={!user || !commentInput.trim()}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-cyan-400 disabled:text-gray-700 transition"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </form>

                  {/* List of comment items */}
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                    {comments.map((c) => (
                      <div key={c.id} className="bg-black/30 rounded-2xl p-4 flex gap-3.5 border border-white/5">
                        <img 
                          src={c.photoURL} 
                          alt="avatar" 
                          className="w-8 h-8 rounded-xl border border-white/10 bg-zinc-800 flex-shrink-0" 
                        />
                        <div className="flex-grow space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-gray-200">{c.user}</span>
                            <span className="text-[10px] font-mono text-gray-500">{c.timestamp}</span>
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed font-semibold">
                            {c.text}
                          </p>
                          <div className="pt-2 flex items-center">
                            <button 
                              onClick={() => toggleLikeComment(c.id)}
                              className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-red-400 font-black transition"
                            >
                              <ThumbsUp size={10} />
                              <span>{c.likes} Likes</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

            </div>

          </div>

          {/* SIDEBAR COLUMNS: EPISODE SELECTION & RECOMMENDATION RAIL (Hidden if player width full) */}
          {!isPlayerExpanded && (
            <div className="lg:col-span-1 space-y-6 relative z-50">
              
              {/* EPISODES CONTROLLER BOX */}
              <EpisodesBox 
                isAnime={isAnime}
                videoTitle={video.title}
                displayEpisodes={displayEpisodes}
                activeEpisodeIndex={activeEpisodeIndex}
                onSelectEpisode={onSelectEpisode}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                viewMode={viewMode}
                setViewMode={setViewMode}
                activeRange={activeRange}
                setActiveRange={setActiveRange}
                rangeGroups={rangeGroups}
                filteredEpisodes={filteredEpisodes}
              />

              {/* SEASONS CHANGER ROW */}
              <SeasonsSwitcher />

              {/* RECOMMENDED SERIES COLUMN */}
              {recommendedVideos.length > 0 && (
                <div className="bg-[#0f0f13] border border-white/5 p-5 rounded-3xl space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">
                      You May Also Like
                    </h4>
                  </div>

                  <div className="space-y-4">
                    {recommendedVideos.map((vid, rank) => (
                      <div 
                        key={vid.id}
                        onClick={() => {
                          const detailsBtn = document.getElementById(`card-trigger-${vid.id}`);
                          if (detailsBtn) detailsBtn.click();
                        }}
                        className="flex gap-3 hover:bg-white/5 p-1 rounded-xl transition cursor-pointer group"
                      >
                        {/* Rank index number */}
                        <div className="text-sm font-black text-gray-600 self-center w-5 text-center group-hover:text-cyan-400 transition">
                          {rank < 9 ? `0${rank+1}` : rank+1}
                        </div>
                        <img 
                          src={vid.thumbnail || undefined} 
                          className="w-12 h-16 rounded-lg object-cover border border-white/5 bg-zinc-950 flex-shrink-0" 
                          alt="cover" 
                        />
                        <div className="overflow-hidden flex flex-col justify-center">
                          <h5 className="text-xs font-black text-white truncate group-hover:text-cyan-400 transition">
                            {vid.title}
                          </h5>
                          <span className="text-[10px] text-gray-500 font-bold capitalize mt-0.5">
                            {vid.category} • {vid.year}
                          </span>
                          <span className="text-[9px] text-cyan-400/80 font-black flex items-center gap-1 mt-1 font-mono">
                            <Star size={8} fill="currentColor" /> {vid.rating || '4.8'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* KEYBOARD SHORTCUTS PRO-TIP BOX */}
              <ProTipPanel />

            </div>
          )}

        </div>

      </div>

    </div>
  );
}

// -------------------------------------------------------------
// Sub-component: Episodes Selection Panel (Zoro Custom Grid)
// -------------------------------------------------------------
interface EpisodesBoxProps {
  isAnime: boolean;
  videoTitle: string;
  displayEpisodes: Episode[];
  activeEpisodeIndex: number;
  onSelectEpisode: (index: number) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (val: 'grid' | 'list') => void;
  activeRange: string;
  setActiveRange: (val: string) => void;
  rangeGroups: string[];
  filteredEpisodes: Episode[];
}

function EpisodesBox({
  isAnime,
  videoTitle,
  displayEpisodes,
  activeEpisodeIndex,
  onSelectEpisode,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  activeRange,
  setActiveRange,
  rangeGroups,
  filteredEpisodes
}: EpisodesBoxProps) {
  if (!isAnime) {
    return (
      <div className="bg-[#0f0f13] border border-white/5 p-5 rounded-3xl text-center">
        <p className="text-xs text-gray-400 font-bold">
          Full feature movie playback. No individual episodic playlist index.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#0f0f13] border border-white/5 p-5 rounded-3xl space-y-4">
      
      {/* Episodes box header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="space-y-0.5">
          <h3 className="font-black text-xs uppercase tracking-widest text-cyan-400">
            Episodes Navigator
          </h3>
          <span className="text-[9px] text-gray-500 font-bold block uppercase">
            Total Episodes: {displayEpisodes.length}
          </span>
        </div>
        <div className="flex gap-1 bg-black/60 p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-1 rounded-lg transition ${viewMode === 'grid' ? 'bg-cyan-500 text-black' : 'text-gray-400 hover:text-white'}`}
            title="Compact Grid"
          >
            <Grid size={13} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1 rounded-lg transition ${viewMode === 'list' ? 'bg-cyan-500 text-black' : 'text-gray-400 hover:text-white'}`}
            title="Detail List"
          >
            <List size={13} />
          </button>
        </div>
      </div>

      {/* Episode Filter and Search Controls */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
          <input 
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search ep number or title..."
            className="w-full bg-black border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-cyan-500 transition outline-none font-semibold"
          />
        </div>

        {/* Range Group tabs for quick navigation */}
        {rangeGroups.length > 1 && (
          <div className="flex gap-1 overflow-x-auto pb-1">
            {rangeGroups.map(grp => (
              <button 
                key={grp}
                onClick={() => setActiveRange(grp)}
                className={`px-3 py-1 text-[10px] rounded-lg font-bold border transition ${
                  activeRange === grp 
                    ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' 
                    : 'bg-black border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {grp}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Episodes view renderer */}
      <div className="max-h-72 overflow-y-auto pr-1 custom-scrollbar">
        {filteredEpisodes.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-500 font-bold">
            No matching episodes found.
          </div>
        ) : viewMode === 'grid' ? (
          /* Zoro Compact grid of squared-circles */
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {filteredEpisodes.map((ep) => {
              const epIndex = displayEpisodes.findIndex(item => item.id === ep.id);
              const isActive = epIndex === activeEpisodeIndex;
              return (
                <button 
                  key={ep.id}
                  onClick={() => onSelectEpisode(epIndex)}
                  className={`aspect-square rounded-xl text-xs font-black transition flex items-center justify-center border hover:scale-105 active:scale-95 ${
                    isActive 
                      ? 'bg-cyan-500 border-cyan-500 text-black font-black shadow-lg shadow-cyan-500/20' 
                      : 'bg-black/60 border-white/5 text-gray-300 hover:bg-zinc-900 hover:border-white/15'
                  }`}
                  title={ep.title}
                >
                  {ep.number}
                </button>
              );
            })}
          </div>
        ) : (
          /* Zoro detailed List card rows */
          <div className="space-y-2">
            {filteredEpisodes.map((ep) => {
              const epIndex = displayEpisodes.findIndex(item => item.id === ep.id);
              const isActive = epIndex === activeEpisodeIndex;
              return (
                <button 
                  key={ep.id}
                  onClick={() => onSelectEpisode(epIndex)}
                  className={`w-full text-left p-2.5 rounded-xl border transition flex items-center gap-3 group ${
                    isActive 
                      ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 font-black' 
                      : 'bg-black/40 border-white/5 text-gray-300 hover:bg-zinc-900 hover:border-white/10'
                  }`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0 ${
                    isActive ? 'bg-cyan-500 text-black' : 'bg-white/5 text-gray-300 group-hover:bg-cyan-500 group-hover:text-black transition'
                  }`}>
                    {ep.number}
                  </span>
                  <div className="overflow-hidden flex-grow">
                    <span className="block text-xs font-bold truncate">
                      {ep.title}
                    </span>
                    <span className="block text-[9px] font-mono text-gray-500 mt-0.5">
                      Length: {ep.duration}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

// Seasons switcher rail
function SeasonsSwitcher() {
  const [activeSeason, setActiveSeason] = useState(2);
  return (
    <div className="bg-[#0f0f13] border border-white/5 p-5 rounded-3xl space-y-3">
      <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
        <Compass className="w-3.5 h-3.5 text-cyan-400" />
        <h4 className="text-xs font-black uppercase tracking-wider text-white">
          Other Seasons
        </h4>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs font-bold">
        {[1, 2, 3].map(num => (
          <button 
            key={num}
            onClick={() => setActiveSeason(num)}
            className={`px-3 py-2 rounded-xl text-left border transition flex items-center justify-between ${
              activeSeason === num 
                ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' 
                : 'bg-black border-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <span>Season {num}</span>
            {activeSeason === num && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />}
          </button>
        ))}
        <button className="px-3 py-2 rounded-xl text-left border border-dashed border-white/5 text-gray-600 text-[10px] font-bold cursor-not-allowed">
          Spin-Off Movie
        </button>
      </div>
    </div>
  );
}

// Pro-tip panel helper
function ProTipPanel() {
  return (
    <div className="bg-[#0f0f13] border border-white/5 p-5 rounded-3xl space-y-3">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">
        Keyboard Shortcuts
      </h4>
      <div className="space-y-1.5 text-[10px] text-gray-400 font-bold leading-relaxed">
        <div className="flex justify-between border-b border-white/5 pb-1">
          <span>Toggle Pause</span>
          <kbd className="bg-black border border-white/10 px-1 py-0.5 rounded text-cyan-400">Space</kbd>
        </div>
        <div className="flex justify-between border-b border-white/5 pb-1">
          <span>Seek Forward 10s</span>
          <kbd className="bg-black border border-white/10 px-1 py-0.5 rounded text-cyan-400">→</kbd>
        </div>
        <div className="flex justify-between border-b border-white/5 pb-1">
          <span>Seek Backward 10s</span>
          <kbd className="bg-black border border-white/10 px-1 py-0.5 rounded text-cyan-400">←</kbd>
        </div>
        <div className="flex justify-between border-b border-white/5 pb-1">
          <span>Toggle Fullscreen</span>
          <kbd className="bg-black border border-white/10 px-1 py-0.5 rounded text-cyan-400">F</kbd>
        </div>
        <div className="flex justify-between">
          <span>Mute Audio</span>
          <kbd className="bg-black border border-white/10 px-1 py-0.5 rounded text-cyan-400">M</kbd>
        </div>
      </div>
    </div>
  );
}
