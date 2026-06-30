/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  Maximize,
  Minimize,
  RotateCcw,
  Sparkles,
  Captions,
  Settings,
  Tv,
  Search,
  ChevronDown,
  Bookmark,
  Download,
  Sun,
  Moon,
  SkipForward,
  SkipBack,
  Check,
  Eye,
  Volume1,
  Sparkle,
  ExternalLink,
  Unlock,
  ShieldAlert
} from 'lucide-react';
import { Video } from '../types';

const playSwooshSound = () => {};
const playSelectSound = () => {};
const playTickSound = () => {};

export interface TheaterViewProps {
  video: Video;
  activeEpisodeIndex: number;
  onSelectEpisode: (index: number) => void;
  onBackToDetails: () => void;
  onBackToHome: () => void;
  allVideos: Video[];
  user: any;
}

interface CaptionCue {
  start: number;
  end: number;
  textEn: string;
  textEs: string;
}

// Custom curated subtitles
const MOCK_CAPTIONS: CaptionCue[] = [
  { start: 1, end: 5, textEn: '[Epic theme music swells]', textEs: '[La música mística ambiental crece]' },
  { start: 5, end: 9, textEn: 'Narrator: "Legends foretold the arrival of a chosen one."', textEs: 'Narrador: "Las leyendas predijeron la llegada del elegido."' },
  { start: 9, end: 14, textEn: 'Main Character: "Whatever challenges lie ahead, I am ready to face them."', textEs: 'Protagonista: "Cualesquiera que sean los desafíos, estoy listo."' },
  { start: 14, end: 18, textEn: '[Action forces clash • Sparks crackle]', textEs: '[Las fuerzas chocan • Chispas crujen]' },
  { start: 18, end: 23, textEn: 'Companion: "Are you ready for what comes next?"', textEs: 'Compañero: "¿Estás listo para lo que viene después?"' },
  { start: 23, end: 28, textEn: 'Main Character: "I have been preparing my whole life."', textEs: 'Protagonista: "Me he estado preparando toda mi vida."' },
  { start: 28, end: 35, textEn: '[Intensity increases • Wind howling]', textEs: '[La intensidad aumenta • Viento aullando]' },
  { start: 35, end: 42, textEn: 'Narrator: "To break the limits, willpower is the ultimate key."', textEs: 'Narrador: "Para romper los límites, la voluntad es la clave definitiva."' },
  { start: 42, end: 50, textEn: '[Soundtrack climaxes in epic orchestration]', textEs: '[La música llega a su clímax épico]' }
];

const extractSrcFromEmbed = (code: string): string => {
  if (!code) return '';
  const trimmed = code.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const match = trimmed.match(/src=["']([^"']+)["']/i);
  return match ? match[1] : trimmed;
};

export default function TheaterView({
  video,
  activeEpisodeIndex: propActiveEpisodeIndex,
  onSelectEpisode,
  onBackToDetails,
  onBackToHome,
  allVideos = [],
  user
}: TheaterViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeVideo, setActiveVideo] = useState<Video>(video);
  useEffect(() => {
    setActiveVideo(video);
  }, [video]);

  const movie = activeVideo;
  const allMovies = allVideos || [];
  const onClose = onBackToDetails || onBackToHome;
  const soundEnabled = false;

  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('animebhai_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const onToggleFavorite = (v: Video) => {
    let next: string[];
    if (watchlist.includes(v.id)) {
      next = watchlist.filter(id => id !== v.id);
    } else {
      next = [...watchlist, v.id];
    }
    setWatchlist(next);
    localStorage.setItem('animebhai_favorites', JSON.stringify(next));
  };

  const onSelectMovie = (targetVideo: Video) => {
    setActiveVideo(targetVideo);
    setActiveEpisodeIndex(0);
    onSelectEpisode(0);
  };

  // --- Watch Room States ---
  const [activeEpisodeIndex, setActiveEpisodeIndex] = useState(propActiveEpisodeIndex ?? 0);
  useEffect(() => {
    setActiveEpisodeIndex(propActiveEpisodeIndex);
  }, [propActiveEpisodeIndex]);
  const [searchEpisodeQuery, setSearchEpisodeQuery] = useState('');
  const [selectedSubDub, setSelectedSubDub] = useState<'sub' | 'dub'>('sub');
  const [selectedEpisodeRange, setSelectedEpisodeRange] = useState('001-012');

  // Interactive controls below player
  const [autoPlay, setAutoPlay] = useState(true);
  const [autoNext, setAutoNext] = useState(true);
  const [autoSkip, setAutoSkip] = useState(true);
  const [lightOff, setLightOff] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [playerEngine, setPlayerEngine] = useState<'auto' | 'iframe' | 'native'>('auto');

  // Audio Track State
  const [activeAudio, setActiveAudio] = useState<'Japanese' | 'English' | 'Hindi'>('Hindi');

  // Video playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [activeSubtitle, setActiveSubtitle] = useState<'off' | 'en' | 'es'>('en');
  const [ambientGlow, setAmbientGlow] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [videoLoading, setVideoLoading] = useState(false);

  // Generate 12 episodes custom tailored to the selected title
  const episodes = useMemo(() => {
    if (movie.episodes && movie.episodes.length > 0) {
      return movie.episodes.map((ep, index) => ({
        index: ep.index || (index + 1),
        title: ep.title || `Episode ${index + 1}`,
        videoUrl: ep.videoUrl,
        description: ep.description,
        duration: ep.duration,
        jpVideoUrl: ep.jpVideoUrl,
        jpEmbedCode: ep.jpEmbedCode,
        enVideoUrl: ep.enVideoUrl,
        enEmbedCode: ep.enEmbedCode,
        hnVideoUrl: ep.hnVideoUrl,
        hnEmbedCode: ep.hnEmbedCode
      }));
    }

    const isSoloLeveling = movie.title.toLowerCase().includes('leveling');
    const soloLevelingTitles = [
      "I'm used to it",
      "If I had one more chance",
      "It's Like a Game",
      "I've Gotta Get Stronger",
      "A Pretty Good Deal",
      "The Real Hunt Begins",
      "Let's See How Far I Can Go",
      "This Is Frustrating",
      "You've Been Hiding Your Skills",
      "What Is This, a Picnic?",
      "A Knight Who Defends the Realm",
      "Arise"
    ];

    const generalTitles = [
      "The Awakening",
      "Secrets of the Unseen",
      "A Dark Path Forward",
      "Unforgiven Forces Clash",
      "Gathering of Allies",
      "The Hidden Sanctuary",
      "Clash of Ultimate Willpower",
      "The Lost Fallen Kingdom",
      "Rebirth in Holy Flames",
      "Journey Into the Abyss",
      "The Crucial Final Choice",
      "Legends Endure Forever"
    ];

    const titlesList = isSoloLeveling ? soloLevelingTitles : generalTitles;

    return Array.from({ length: 12 }).map((_, index) => ({
      index: index + 1,
      title: titlesList[index] || `Episode ${index + 1}`,
      videoUrl: undefined as string | undefined,
      description: undefined as string | undefined,
      duration: undefined as string | undefined
    }));
  }, [movie]);

  const currentEpOrMovie = useMemo(() => {
    const isTvShow = movie.category === 'anime' || (movie as any).type === 'tv-show';
    if (isTvShow && episodes && episodes[activeEpisodeIndex]) {
      return episodes[activeEpisodeIndex];
    }
    return movie;
  }, [movie, episodes, activeEpisodeIndex]);

  const activeMedia = useMemo(() => {
    let videoUrl = currentEpOrMovie.videoUrl || movie.videoUrl;
    let embedCode: string | undefined = undefined;

    if (activeAudio === 'Japanese') {
      if (currentEpOrMovie.jpVideoUrl || currentEpOrMovie.jpEmbedCode) {
        videoUrl = currentEpOrMovie.jpVideoUrl;
        embedCode = currentEpOrMovie.jpEmbedCode;
      }
    } else if (activeAudio === 'English') {
      if (currentEpOrMovie.enVideoUrl || currentEpOrMovie.enEmbedCode) {
        videoUrl = currentEpOrMovie.enVideoUrl;
        embedCode = currentEpOrMovie.enEmbedCode;
      }
    } else if (activeAudio === 'Hindi') {
      if (currentEpOrMovie.hnVideoUrl || currentEpOrMovie.hnEmbedCode) {
        videoUrl = currentEpOrMovie.hnVideoUrl;
        embedCode = currentEpOrMovie.hnEmbedCode;
      }
    }

    // Auto-detect if videoUrl is actually a player webpage / third-party embed URL instead of a direct raw media stream
    if (videoUrl && !embedCode) {
      const trimmedUrl = videoUrl.trim();
      const isHttpUrl = trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://');
      
      if (isHttpUrl) {
        const lowerUrl = trimmedUrl.toLowerCase();
        const hasVideoExtension = lowerUrl.match(/\.(mp4|m3u8|webm|ogg|mp3|wav|mov|mkv|avi|flv|ts)(?:\?|$)/i);
        
        // If it doesn't have a direct video extension and doesn't look like a direct raw video stream file
        if (!hasVideoExtension && !lowerUrl.includes('.mp4') && !lowerUrl.includes('.m3u8')) {
          embedCode = trimmedUrl;
        }
      }
    }

    // Apply player engine override
    if (playerEngine === 'iframe') {
      return {
        videoUrl: undefined,
        embedCode: embedCode || videoUrl
      };
    } else if (playerEngine === 'native') {
      let forcedUrl = videoUrl;
      if (!forcedUrl && embedCode) {
        // Try extracting url from within iframe embed code if they passed an iframe code
        const srcMatch = embedCode.match(/src="([^"]+)"/);
        if (srcMatch && srcMatch[1]) {
          forcedUrl = srcMatch[1];
        } else if (embedCode.startsWith('http://') || embedCode.startsWith('https://')) {
          forcedUrl = embedCode;
        }
      }
      return {
        videoUrl: forcedUrl,
        embedCode: undefined
      };
    }

    return {
      videoUrl: embedCode ? undefined : videoUrl,
      embedCode
    };
  }, [currentEpOrMovie, activeAudio, movie.videoUrl, playerEngine]);

  const hasEmbed = !!activeMedia.embedCode;
  const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;

  const renderEmbed = (code: string) => {
    const trimmed = code.trim();
    const sandboxEnabled = localStorage.getItem('cineflix-sandbox-enabled') === 'true'; // default to false (sandbox removed)
    const sandboxSettings = localStorage.getItem('cineflix-sandbox-settings') || "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-fullscreen allow-pointer-lock allow-presentation";
    if (trimmed.startsWith('<iframe') || trimmed.startsWith('<div')) {
      let processedCode = trimmed;
      if (processedCode.includes('<iframe')) {
        if (!sandboxEnabled) {
          // Completely strip any sandbox attributes to allow unrestricted 3rd party playback
          processedCode = processedCode.replace(/\s?sandbox="[^"]*"/g, '');
          processedCode = processedCode.replace(/\s?sandbox='[^']*'/g, '');
        } else {
          // Enforce sandbox settings that explicitly allow popups and escaping sandbox
          if (!processedCode.includes('sandbox=')) {
            processedCode = processedCode.replace('<iframe', `<iframe sandbox="${sandboxSettings}"`);
          } else {
            processedCode = processedCode.replace(/sandbox="[^"]*"/g, `sandbox="${sandboxSettings}"`);
            processedCode = processedCode.replace(/sandbox='[^']*'/g, `sandbox='${sandboxSettings}'`);
          }
        }
      }
      return (
        <div 
          className="w-full h-full relative z-10 flex items-center justify-center [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:border-0"
          dangerouslySetInnerHTML={{ __html: processedCode }}
        />
      );
    } else {
      return (
        <iframe
          src={trimmed}
          className="w-full h-full absolute inset-0 border-0 z-10"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          sandbox={sandboxEnabled ? sandboxSettings : undefined}
        />
      );
    }
  };

  // Filter episodes based on user query
  const filteredEpisodes = useMemo(() => {
    if (!searchEpisodeQuery.trim()) return episodes;
    return episodes.filter(
      (ep) =>
        ep.index.toString() === searchEpisodeQuery.trim() ||
        ep.title.toLowerCase().includes(searchEpisodeQuery.toLowerCase())
    );
  }, [episodes, searchEpisodeQuery]);

  // Find related curated recommendations (excluding active title)
  const relatedTitles = useMemo(() => {
    const others = allMovies.filter((m) => m.id !== movie.id);
    if (others.length > 0) return others.slice(0, 5);
    return [];
  }, [allMovies, movie]);

  // Set episode index back to 1 when title changes or propActiveEpisodeIndex is provided
  useEffect(() => {
    setActiveEpisodeIndex(propActiveEpisodeIndex ?? 0);
    triggerLoadAnimation();
  }, [movie, propActiveEpisodeIndex]);

  // Auto-hide timeline player controls
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const resetTimer = () => {
      setShowControls(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', resetTimer);
      container.addEventListener('click', resetTimer);
    }
    resetTimer();

    return () => {
      if (container) {
        container.removeEventListener('mousemove', resetTimer);
        container.removeEventListener('click', resetTimer);
      }
      clearTimeout(timer);
    };
  }, [isPlaying]);

  // Escape to exit player
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightOff) {
          setLightOff(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, lightOff]);

  const triggerLoadAnimation = () => {
    setVideoLoading(true);
    const timer = setTimeout(() => {
      setVideoLoading(false);
      // restart video time
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    }, 550);
    return () => clearTimeout(timer);
  };

  // Video handlers
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      // Auto Next check when video ends
      if (videoRef.current.ended && autoNext) {
        handleNextEpisode();
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (autoPlay) {
        videoRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted = vol === 0;
    }
  };

  const toggleMute = () => {
    const nextMuteState = !isMuted;
    setIsMuted(nextMuteState);
    if (videoRef.current) {
      videoRef.current.muted = nextMuteState;
    }
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  const skipTime = (amount: number) => {
    if (videoRef.current) {
      let nextTime = videoRef.current.currentTime + amount;
      if (nextTime < 0) nextTime = 0;
      if (nextTime > duration) nextTime = duration;
      videoRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  const formatTime = (timeInSecs: number) => {
    if (isNaN(timeInSecs) || !isFinite(timeInSecs)) return '0:00';
    const minutes = Math.floor(timeInSecs / 60);
    const seconds = Math.floor(timeInSecs % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleEpisodeSelect = (index: number) => {
    if (soundEnabled) playTickSound();
    setActiveEpisodeIndex(index);
    triggerLoadAnimation();
  };

  const handlePrevEpisode = () => {
    if (activeEpisodeIndex > 0) {
      handleEpisodeSelect(activeEpisodeIndex - 1);
    }
  };

  const handleNextEpisode = () => {
    if (activeEpisodeIndex < episodes.length - 1) {
      handleEpisodeSelect(activeEpisodeIndex + 1);
    }
  };

  const handleAudioSelect = (audio: 'Japanese' | 'English' | 'Hindi') => {
    if (soundEnabled) playTickSound();
    setActiveAudio(audio);
    triggerLoadAnimation();
  };

  const isFavorite = watchlist.includes(movie.id);

  // Subtitle cue matching
  const activeCue = MOCK_CAPTIONS.find(
    (cue) => currentTime >= cue.start && currentTime <= cue.end
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#060606] overflow-y-auto custom-scrollbar flex flex-col font-sans text-gray-200 select-none"
    >
      {/* Lights Off Dimmable Blackout Overlay */}
      {lightOff && (
        <div 
          onClick={() => setLightOff(false)}
          className="fixed inset-0 bg-black/95 z-40 transition-all duration-500 cursor-pointer flex items-center justify-center"
        >
          <div className="absolute top-8 text-center text-xs tracking-widest text-cyan-400 animate-pulse">
            💡 LIGHTS DEACTIVATED • CLICK ANYWHERE TO RESTORE LIGHT
          </div>
        </div>
      )}

      {/* TOP HEADER MENU */}
      <header className="relative z-50 shrink-0 h-16 border-b border-white/5 bg-[#0b0b0b]/90 backdrop-blur px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { if (soundEnabled) playSwooshSound(); onClose(); }}>
            <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
              <ChevronDown className="w-4 h-4 rotate-90" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest">Anime Watch Room</span>
              <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                {movie.title} 
                <span className="text-xs text-gray-500 font-medium">({movie.year})</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">


          <button
            onClick={() => { if (soundEnabled) playSwooshSound(); onClose(); }}
            className="px-4 py-1.5 text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>Close Room</span>
          </button>
        </div>
      </header>

      {/* WATCH ROOM CONTENT GRID */}
      <main className={`relative z-10 flex-1 w-full max-w-[1800px] mx-auto p-4 md:p-6 lg:p-8 flex flex-col xl:flex-row gap-6 ${lightOff ? 'z-[45]' : ''}`}>
        
        {/* COLUMN 1: LEFT SIDEBAR (EPISODE LIST) */}
        {!theaterMode && (
          <div className="w-full xl:w-72 shrink-0 flex flex-col gap-4">
            <div className="bg-[#0b0b0b] border border-white/10 rounded p-4 flex flex-col gap-3.5 shadow-xl">
              
              {/* Header Filters */}
              <div className="flex gap-2">
                {/* Sub & Dub Selector Dropdown */}
                <div className="relative flex-1">
                  <select
                    value={selectedSubDub}
                    onChange={(e) => {
                      if (soundEnabled) playTickSound();
                      setSelectedSubDub(e.target.value as 'sub' | 'dub');
                    }}
                    className="w-full px-2.5 py-1.5 bg-black border border-white/10 hover:border-white/20 rounded text-[11px] font-bold text-gray-300 focus:outline-none appearance-none cursor-pointer tracking-wider"
                  >
                    <option value="sub">Sub & Dub</option>
                    <option value="dub">Dub Only</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                </div>

                {/* Range Selector Dropdown */}
                <div className="relative flex-1">
                  <select
                    value={selectedEpisodeRange}
                    onChange={(e) => {
                      if (soundEnabled) playTickSound();
                      setSelectedEpisodeRange(e.target.value);
                    }}
                    className="w-full px-2.5 py-1.5 bg-black border border-white/10 hover:border-white/20 rounded text-[11px] font-bold text-gray-300 focus:outline-none appearance-none cursor-pointer tracking-wider"
                  >
                    <option value="001-012">001-012</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                </div>

                {/* Find num input */}
                <div className="relative w-20">
                  <input
                    type="text"
                    placeholder="Find num!"
                    value={searchEpisodeQuery}
                    onChange={(e) => setSearchEpisodeQuery(e.target.value)}
                    className="w-full px-2 py-1.5 bg-black border border-white/10 rounded text-[11px] font-medium text-white focus:outline-none placeholder-gray-600 focus:border-white/30 text-center font-mono"
                  />
                </div>
              </div>

              {/* Scrollable list of episodes */}
              <div className="flex flex-col gap-1 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
                {filteredEpisodes.length === 0 ? (
                  <span className="text-center text-xs text-gray-600 py-6 font-semibold">No episodes found</span>
                ) : (
                  filteredEpisodes.map((ep, idx) => {
                    const isSelected = ep.index - 1 === activeEpisodeIndex;
                    return (
                      <button
                        key={ep.index}
                        onClick={() => handleEpisodeSelect(ep.index - 1)}
                        className={`w-full px-3.5 py-2.5 rounded text-left transition-all text-xs flex items-center justify-between border ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500/30 text-white font-bold shadow shadow-indigo-600/20'
                            : 'bg-black/30 border-transparent hover:bg-white/5 text-gray-400 hover:text-white hover:border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <span className={`font-mono text-[10px] w-5 text-right font-extrabold ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                            {ep.index}
                          </span>
                          <span className="truncate">{ep.title}</span>
                        </div>
                        {isSelected && (
                          <Play className="w-3 h-3 fill-current animate-pulse text-white shrink-0 ml-1.5" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>

            </div>
          </div>
        )}

        {/* COLUMN 2: CENTER PANEL (PLAYER & QUICK TOOLS & SERVERS) */}
        <div className="flex-1 flex flex-col gap-6">
          


          {/* Main player box area */}
          <div
            ref={containerRef}
            className={`relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center transition-all ${
              lightOff ? 'ring-4 ring-indigo-500/20 shadow-indigo-500/5' : ''
            }`}
          >
            {/* Ambient Background Glow inside the player frame */}
            {ambientGlow && (
              <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 aspect-video bg-gradient-to-tr from-indigo-500 via-purple-600 to-transparent blur-[120px]" />
              </div>
            )}



            {/* Simulated loading screen */}
            {videoLoading ? (
              <div className="absolute inset-0 bg-[#080808]/95 flex flex-col items-center justify-center z-40 gap-4 select-none backdrop-blur-md">
                <div className="relative flex items-center justify-center">
                  {/* Outer glowing loader ring */}
                  <div className="w-20 h-20 rounded-full border-2 border-cyan-500/10 border-t-cyan-400 animate-spin absolute" />
                  
                  {/* Inner brand emblem breathing */}
                  <motion.div
                    animate={{ scale: [0.9, 1.05, 0.9] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Tv className="w-12 h-12 text-indigo-400" />
                  </motion.div>
                </div>
                
                <div className="flex flex-col items-center gap-1 mt-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
                    Initializing Stream
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                    Loading {activeAudio} Track...
                  </span>
                </div>
              </div>
            ) : null}

            {/* Real HTML5 Video element or Custom Embed iframe */}
            {hasEmbed ? (
              renderEmbed(activeMedia.embedCode!)
            ) : (
              <video
                ref={videoRef}
                src={activeMedia.videoUrl || undefined}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full h-full object-contain cursor-pointer relative z-10"
                onClick={togglePlay}
                playsInline
              />
            )}

            {/* Subtitle Overlay Track */}
            {activeSubtitle !== 'off' && activeCue && (
              <div className="absolute bottom-20 inset-x-6 flex justify-center pointer-events-none z-20">
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  key={activeCue.start}
                  className="px-5 py-1.5 rounded-lg bg-black/85 border border-white/10 backdrop-blur-md text-white font-sans text-xs md:text-sm font-semibold tracking-wide text-center shadow-2xl"
                >
                  {activeSubtitle === 'en' ? activeCue.textEn : activeCue.textEs}
                </motion.p>
              </div>
            )}

            {/* Atmos Surround Mode tag overlay */}
            {isPlaying && (
              <div className="absolute top-4 left-4 pointer-events-none z-20">
                <div className="px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-extrabold tracking-widest flex items-center gap-1.5 backdrop-blur-sm uppercase">
                  <Sparkle className="w-3 h-3 animate-pulse" /> Dolby Audio HD
                </div>
              </div>
            )}

            {/* Overlay Timeline Player controls bar */}
            <AnimatePresence>
              {showControls && !hasEmbed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/60 flex flex-col justify-between p-4 z-30"
                >
                  {/* Overlay Header */}
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                        <Tv className="w-3.5 h-3.5" />
                      </span>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none">STREAMING EPISODE {activeEpisodeIndex + 1}</span>
                        <span className="text-xs font-bold text-white tracking-wide mt-0.5 leading-none">{episodes[activeEpisodeIndex]?.title}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Ambient Light control */}
                      <button
                        onClick={() => setAmbientGlow(!ambientGlow)}
                        title="Toggle Ambient Glow Canvas"
                        className={`p-1.5 rounded border transition-all ${ambientGlow ? 'bg-indigo-500/15 border-indigo-500/30 text-white' : 'bg-black/60 border border-white/5 text-gray-500 hover:text-white'}`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>

                      {/* Timeline Volume Muter */}
                      <div className="flex items-center gap-1.5 bg-black/60 border border-white/5 rounded px-2 py-1">
                        <button onClick={toggleMute} className="text-gray-400 hover:text-white transition-colors">
                          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                        <span className="text-[10px] font-bold font-mono text-gray-400">VOL</span>
                      </div>
                    </div>
                  </div>

                  {/* Overlay Footer Slider Controls */}
                  <div className="flex flex-col gap-3 w-full">
                    {/* Time scrubber range input */}
                    <div className="flex items-center gap-3 w-full">
                      <span className="text-[10px] text-gray-400 font-mono w-8 text-right font-semibold">
                        {formatTime(currentTime)}
                      </span>
                      <input
                        id="player-timeline-slider"
                        type="range"
                        min={0}
                        max={isNaN(duration) || !isFinite(duration) || !duration ? 100 : duration}
                        value={isNaN(currentTime) || !isFinite(currentTime) ? 0 : currentTime}
                        onChange={handleSeekChange}
                        className="flex-1 accent-indigo-500 bg-white/10 rounded h-1 cursor-pointer hover:h-1.5 transition-all outline-none"
                      />
                      <span className="text-[10px] text-gray-400 font-mono w-8 text-left font-semibold">
                        {formatTime(duration)}
                      </span>
                    </div>

                    {/* Bottom toolbar */}
                    <div className="flex items-center justify-between w-full text-xs font-semibold">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={togglePlay}
                          className="w-8 h-8 rounded-full bg-white hover:bg-gray-200 text-black flex items-center justify-center transition-all shadow-lg"
                        >
                          {isPlaying ? (
                            <Pause className="w-4 h-4 fill-black" />
                          ) : (
                            <Play className="w-4 h-4 fill-black ml-0.5" />
                          )}
                        </button>

                        <button onClick={() => skipTime(-10)} title="Rewind 10s" className="p-1 text-gray-400 hover:text-white transition-colors">
                          <RotateCcw className="w-4 h-4" />
                        </button>

                        <span className="h-4 w-px bg-white/10" />

                        <span className="text-[10px] tracking-widest text-indigo-400 uppercase font-extrabold">AUDIO: {activeAudio.toUpperCase()}</span>
                      </div>

                      {/* Right toolbar controls */}
                      <div className="flex items-center gap-2">
                        {/* Subtitle selection popup trigger */}
                        <button
                          onClick={() => {
                            const list: ('off' | 'en' | 'es')[] = ['off', 'en', 'es'];
                            const cur = list.indexOf(activeSubtitle);
                            setActiveSubtitle(list[(cur + 1) % list.length]);
                          }}
                          className={`px-2 py-1 rounded border text-[10px] font-extrabold tracking-wider transition-all uppercase flex items-center gap-1 ${activeSubtitle !== 'off' ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400' : 'bg-black/60 border-white/5 text-gray-500'}`}
                        >
                          <Captions className="w-3 h-3" />
                          <span>{activeSubtitle === 'off' ? 'Off' : activeSubtitle}</span>
                        </button>

                        {/* Speed controller */}
                        <div className="relative">
                          <button
                            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                            className="px-2 py-1 rounded bg-black/60 border border-white/5 text-gray-400 hover:text-white text-[10px] font-bold flex items-center gap-1"
                          >
                            <Settings className="w-3 h-3" />
                            <span>{playbackSpeed}x</span>
                          </button>

                          {showSpeedMenu && (
                            <div className="absolute bottom-full right-0 mb-1.5 w-20 rounded bg-[#0b0b0b] border border-white/10 p-0.5 shadow-2xl flex flex-col z-40">
                              {[0.5, 1, 1.5, 2].map((sp) => (
                                <button
                                  key={sp}
                                  onClick={() => changeSpeed(sp)}
                                  className={`px-2 py-1 rounded text-left text-[10px] font-bold transition-colors ${playbackSpeed === sp ? 'bg-indigo-500/15 text-indigo-400' : 'text-gray-400 hover:bg-white/5'}`}
                                >
                                  {sp}x
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Fullscreen control */}
                        <button onClick={toggleFullscreen} className="p-1 text-gray-400 hover:text-white transition-colors">
                          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                        </button>
                      </div>

                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* QUICK TOOLBAR CONTROL BAR (Mirroring screenshot) */}
          <div className="bg-[#0b0b0b] border border-white/10 rounded px-4 py-3 flex flex-wrap items-center justify-between gap-4 text-[11px] font-extrabold tracking-widest uppercase text-gray-400 shadow-xl">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Theater Mode Expand */}
              <button
                onClick={() => { if (soundEnabled) playTickSound(); setTheaterMode(!theaterMode); }}
                className={`flex items-center gap-1.5 transition-colors hover:text-white ${theaterMode ? 'text-indigo-400' : ''}`}
                title="Toggle Expanded Full Theater Mode"
              >
                <Maximize className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{theaterMode ? 'Exit Theater' : 'Expand'}</span>
              </button>

              {/* Auto Play checkbox toggle */}
              <button
                onClick={() => setAutoPlay(!autoPlay)}
                className="flex items-center gap-1.5 transition-colors hover:text-white"
              >
                <Check className={`w-3.5 h-3.5 stroke-[3.5] transition-transform ${autoPlay ? 'text-green-400 scale-110' : 'text-gray-600'}`} />
                <span>Auto Play</span>
              </button>

              {/* Auto Next checkbox toggle */}
              <button
                onClick={() => setAutoNext(!autoNext)}
                className="flex items-center gap-1.5 transition-colors hover:text-white"
              >
                <Check className={`w-3.5 h-3.5 stroke-[3.5] transition-transform ${autoNext ? 'text-green-400 scale-110' : 'text-gray-600'}`} />
                <span>Auto Next</span>
              </button>

              {/* Auto Skip checkbox toggle (Highlighted in Golden Amber matching original screenshot) */}
              <button
                onClick={() => setAutoSkip(!autoSkip)}
                className={`flex items-center gap-1.5 transition-colors hover:text-amber-300 ${autoSkip ? 'text-amber-400' : 'text-gray-400'}`}
              >
                <Check className={`w-3.5 h-3.5 stroke-[3.5] transition-transform ${autoSkip ? 'text-amber-400 scale-110' : 'text-gray-600'}`} />
                <span>Auto Skip</span>
              </button>

              {/* Light dimmer switch */}
              <button
                onClick={() => { if (soundEnabled) playTickSound(); setLightOff(!lightOff); }}
                className={`flex items-center gap-1.5 transition-colors hover:text-white ${lightOff ? 'text-indigo-400 font-black' : ''}`}
              >
                {lightOff ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                <span>{lightOff ? 'Light On' : 'Light Off'}</span>
              </button>

              {/* Prev Episode button */}
              <button
                onClick={handlePrevEpisode}
                disabled={activeEpisodeIndex === 0}
                className="flex items-center gap-1 transition-colors hover:text-white disabled:opacity-30 disabled:pointer-events-none"
              >
                <SkipBack className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              {/* Next Episode button */}
              <button
                onClick={handleNextEpisode}
                disabled={activeEpisodeIndex === episodes.length - 1}
                className="flex items-center gap-1 transition-colors hover:text-white disabled:opacity-30 disabled:pointer-events-none"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>Next</span>
              </button>
            </div>

            {/* Watchlist toggle Add to List (Mirroring bookmark icon on the right) */}
            <button
              onClick={() => { if (soundEnabled) playSelectSound(); onToggleFavorite(movie); }}
              className={`flex items-center gap-1.5 transition-all py-1 px-2.5 rounded hover:bg-white/5 ${isFavorite ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-400 hover:text-white'}`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
              <span>{isFavorite ? 'In Watchlist' : 'Add to list'}</span>
            </button>
          </div>

          {/* BOTTOM SERVERS & STATUS CARD CONTAINER (Exactly matching original screenshot styling) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 bg-[#0b0b0b] border border-white/10 rounded p-5 shadow-xl">
            
            {/* Status Info (Left Col) */}
            <div className="lg:col-span-4 bg-white/5 border border-white/5 rounded-lg p-5 flex flex-col items-center justify-center text-center gap-2">
              <span className="text-gray-300 text-xs leading-relaxed max-w-xs font-semibold">
                You're watching <span className="text-indigo-400 font-black uppercase">Episode {activeEpisodeIndex + 1}</span> of <span className="text-white font-bold">{movie.title}</span>.
              </span>
            </div>

            {/* Server selections (Right Col) */}
            <div className="lg:col-span-8 flex flex-col justify-center divide-y divide-white/5">
              
              {/* Audio Source Selector */}
              <div className="py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 shrink-0 w-32 flex items-center gap-1.5 font-sans">
                  <span>🔊</span> Audio Sources
                </span>
                <div className="flex flex-wrap gap-2">
                  {(['Hindi', 'Japanese', 'English'] as const).map((audio) => {
                    const isActive = activeAudio === audio;
                    const flags: Record<string, string> = {
                      Japanese: '🇯🇵',
                      English: '🇺🇸',
                      Hindi: '🇮🇳'
                    };
                    return (
                      <button
                        key={audio}
                        onClick={() => handleAudioSelect(audio)}
                        className={`px-4 py-2 rounded text-[10px] font-extrabold uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-indigo-600 border-indigo-500 text-white font-extrabold shadow-md shadow-indigo-600/15 scale-105'
                            : 'bg-black/50 border-white/5 text-gray-400 hover:text-white hover:bg-black/80'
                        }`}
                      >
                        <span>{flags[audio]}</span>
                        <span>{audio} Audio</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* COLUMN 3: RIGHT SIDEBAR (RELATED CURATED MOVIE LIST) */}
        {!theaterMode && (
          <div className="w-full xl:w-80 shrink-0 flex flex-col gap-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white border-b border-white/5 pb-2">
              Related Recommendations
            </h3>

            <div className="flex flex-col gap-3">
              {relatedTitles.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectMovie(item)}
                  className="group flex items-start gap-3 bg-[#0b0b0b]/60 hover:bg-[#0b0b0b] border border-white/5 hover:border-white/10 rounded p-2.5 transition-all duration-300 cursor-pointer shadow hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                  {/* Poster miniature */}
                  <div className="w-16 h-22 rounded overflow-hidden shrink-0 bg-zinc-950 border border-white/5">
                    <img
                      src={item.thumbnail || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200';
                      }}
                    />
                  </div>

                  {/* Title & Info */}
                  <div className="flex-1 min-w-0 flex flex-col py-1">
                    <h4 className="text-xs font-bold text-gray-200 group-hover:text-indigo-400 transition-colors truncate">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase mt-1">
                      {item.category === 'movie' || (item as any).type === 'movie' ? 'Movie' : 'TV Series'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono font-medium mt-1">
                      {item.category === 'movie' || (item as any).type === 'movie' ? '1 Chapter' : '12 Episodes'} • {item.duration}
                    </span>
                    
                    {/* Tiny visual rating stars */}
                    <div className="flex items-center gap-1 mt-1.5 text-amber-500">
                      <span className="text-[10px] font-bold font-mono">★</span>
                      <span className="text-[9px] font-bold font-mono text-gray-400">{item.rating || 4.5}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Decorative ambient background lights */}
      <div className="fixed bottom-0 inset-x-0 h-40 bg-gradient-to-t from-indigo-500/5 to-transparent pointer-events-none z-0" />
    </motion.div>
  );
}
