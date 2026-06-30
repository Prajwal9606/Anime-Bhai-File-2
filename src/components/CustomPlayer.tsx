import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize2, Minimize2, FastForward, Loader2, Gauge } from 'lucide-react';

interface CustomPlayerProps {
  videoUrl?: string;
  embedHtml?: string;
  audioSources?: { lang: 'Hindi' | 'Japanese' | 'English'; url: string; embedHtml?: string }[];
  title: string;
  subtitle?: string;
  onNextEpisode?: () => void;
  hasNextEpisode?: boolean;
}

export default function CustomPlayer({ videoUrl, embedHtml, audioSources, title, subtitle, onNextEpisode, hasNextEpisode }: CustomPlayerProps) {
  const [activeAudioUrl, setActiveAudioUrl] = useState('');
  const [activeEmbedHtml, setActiveEmbedHtml] = useState('');
  const [activeLang, setActiveLang] = useState<'Hindi' | 'Japanese' | 'English'>('Hindi');

  // Robust update when audioSources or videoUrl changes
  useEffect(() => {
    if (audioSources && audioSources.length > 0) {
      // Order priority: Hindi, Japanese, English
      const hindiSource = audioSources.find(s => s.lang === 'Hindi');
      const japaneseSource = audioSources.find(s => s.lang === 'Japanese');
      const englishSource = audioSources.find(s => s.lang === 'English');
      
      const defaultSource = hindiSource || japaneseSource || englishSource || audioSources[0];
      setActiveAudioUrl(defaultSource.url);
      setActiveEmbedHtml(defaultSource.embedHtml || '');
      setActiveLang(defaultSource.lang);
    } else if (videoUrl || embedHtml) {
      setActiveAudioUrl(videoUrl || '');
      setActiveEmbedHtml(embedHtml || '');
      setActiveLang('Japanese');
    } else {
      setActiveAudioUrl('');
      setActiveEmbedHtml('');
    }
  }, [audioSources, videoUrl, embedHtml]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto hide controls after inactivity
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSpeedMenu(false);
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  // Handle Play / Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(e => console.log('Playback start ignored:', e));
      setIsPlaying(true);
    }
  };

  // Skip Forward/Backward
  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds));
  };

  // Volume Changes
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
    if (!nextMuted && volume === 0) {
      setVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  };

  // Fullscreen Changes
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error('Error entering fullscreen:', err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(err => console.error('Error exiting fullscreen:', err));
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Time Updates
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setIsLoading(false);
  };

  const handleSeeking = () => setIsLoading(true);
  const handleSeeked = () => setIsLoading(false);

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  const changeSpeed = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed;
    }
    setShowSpeedMenu(false);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept shortcuts if the user is typing in inputs
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowright':
          e.preventDefault();
          skip(10);
          break;
        case 'arrowleft':
          e.preventDefault();
          skip(-10);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, volume]);

  // Video ended -> go to next episode if available
  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (onNextEpisode && hasNextEpisode) {
      onNextEpisode();
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '00:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative aspect-video w-full bg-black rounded-3xl overflow-hidden shadow-2xl group border border-white/5 select-none"
      id="custom-theater-player"
    >
      {activeEmbedHtml ? (
        <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: activeEmbedHtml }} />
      ) : (
        <video
          ref={videoRef}
          src={activeAudioUrl || undefined}
          className="w-full h-full object-contain cursor-pointer"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => {
            setIsLoading(false);
            setIsPlaying(true);
          }}
          onSeeking={handleSeeking}
          onSeeked={handleSeeked}
          onEnded={handleVideoEnded}
          onClick={togglePlay}
          playsInline
        />
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
        </div>
      )}

      {/* Play/Pause Large Central Overlay */}
      <div 
        onClick={togglePlay}
        className={`absolute inset-0 flex items-center justify-center bg-black/10 transition-opacity z-10 cursor-pointer ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {!isPlaying && !isLoading && (
          <div className="w-16 h-16 rounded-full bg-cyan-500/95 flex items-center justify-center shadow-lg transform transition hover:scale-110 active:scale-95 text-black">
            <Play fill="black" size={30} className="ml-1" />
          </div>
        )}
      </div>

      {/* HUD Bar at the top */}
      <div 
        className={`absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent transition-transform duration-300 z-20 flex flex-col gap-1 ${
          showControls ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <span className="text-xs uppercase font-extrabold tracking-widest text-cyan-400">
          {subtitle || 'Now Streaming'}
        </span>
        <h2 className="text-xl font-bold text-white tracking-tight drop-shadow-sm">
          {title}
        </h2>
      </div>

      {/* Beautiful Controls Overlay at the Bottom */}
      <div 
        className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 z-20 flex flex-col gap-4 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Timeline Slider */}
        <div className="flex items-center gap-4 w-full">
          <span className="text-xs font-mono text-gray-300">{formatTime(currentTime)}</span>
          <div className="relative flex-grow group/slider h-1.5 flex items-center">
            <input 
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleScrub}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {/* Base track */}
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              {/* Active filled track */}
              <div 
                className="h-full bg-cyan-400 rounded-full relative"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              />
            </div>
            {/* Slider thumb dot on hover */}
            <div 
              className="absolute w-3 h-3 rounded-full bg-cyan-300 shadow-md pointer-events-none transform -translate-x-1/2 opacity-0 group-hover/slider:opacity-100 transition-opacity"
              style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono text-gray-300">{formatTime(duration)}</span>
        </div>

        {/* Buttons and Settings row */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-5">
            {/* Play/Pause */}
            <button 
              onClick={togglePlay}
              className="text-white hover:text-cyan-400 transform hover:scale-110 active:scale-95 transition"
            >
              {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
            </button>

            {/* Skip Back 10s */}
            <button 
              onClick={() => skip(-10)}
              className="text-white hover:text-cyan-400 transform hover:scale-110 transition"
              title="Rewind 10s"
            >
              <RotateCcw size={20} />
            </button>

            {/* Skip Forward 10s */}
            <button 
              onClick={() => skip(10)}
              className="text-white hover:text-cyan-400 transform hover:scale-110 transition"
              title="Fast Forward 10s"
            >
              <RotateCw size={20} />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 group/vol">
              <button onClick={toggleMute} className="text-white hover:text-cyan-400 transition">
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input 
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300 h-1 accent-cyan-400 bg-white/20 rounded-full cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-5">
            {/* Audio Language Selection */}
            {audioSources && audioSources.length > 0 && (
              <div className="relative">
                <select
                  value={activeLang}
                  onChange={(e) => {
                    const lang = e.target.value as 'Hindi' | 'Japanese' | 'English';
                    setActiveLang(lang);
                    const source = audioSources.find(s => s.lang === lang);
                    if (source) {
                      setActiveAudioUrl(source.url);
                      setActiveEmbedHtml(source.embedHtml || '');
                    }
                  }}
                  className="bg-black text-white text-xs p-1 rounded cursor-pointer border border-white/10"
                >
                  {['Hindi', 'Japanese', 'English'].map(lang => {
                    const exists = audioSources.find(s => s.lang === lang);
                    if (!exists) return null;
                    return <option key={lang} value={lang}>{lang}</option>;
                  })}
                </select>
              </div>
            )}
            {/* Playback speed multiplier */}
            <div className="relative">
              <button 
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="text-white hover:text-cyan-400 font-bold text-xs flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-md transition"
                title="Playback Speed"
              >
                <Gauge size={14} />
                {speed}x
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-24 bg-[#111111] border border-white/10 rounded-lg overflow-hidden shadow-xl z-30 flex flex-col">
                  {[0.5, 1, 1.25, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      onClick={() => changeSpeed(s)}
                      className={`text-xs font-bold py-2 hover:bg-cyan-500 hover:text-black transition text-left px-3 ${
                        speed === s ? 'text-cyan-400 bg-white/5' : 'text-white'
                      }`}
                    >
                      {s === 1 ? 'Normal' : `${s}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Next Episode Button */}
            {hasNextEpisode && onNextEpisode && (
              <button 
                onClick={onNextEpisode}
                className="text-white hover:text-cyan-400 flex items-center gap-1.5 text-xs font-black bg-cyan-600 hover:bg-cyan-500 text-black px-3.5 py-1.5 rounded-full shadow-lg transition transform hover:scale-105 active:scale-95"
                title="Watch Next Episode"
              >
                <FastForward size={14} fill="currentColor" />
                NEXT EP
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button 
              onClick={toggleFullscreen}
              className="text-white hover:text-cyan-400 transform hover:scale-110 transition"
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
