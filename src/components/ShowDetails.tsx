import { Play, Star, ArrowLeft, Heart, Calendar, Clock, Tv } from 'lucide-react';
import { Video } from '../types';
import { motion } from 'motion/react';

interface ShowDetailsProps {
  video: Video;
  onBack: () => void;
  onPlayEpisode: (index: number) => void;
  onPlayMovie: () => void;
  onToggleFavorite: (id: string) => void;
  isFavorite: boolean;
}

export default function ShowDetails({ 
  video, 
  onBack, 
  onPlayEpisode, 
  onPlayMovie, 
  onToggleFavorite, 
  isFavorite 
}: ShowDetailsProps) {
  const isAnime = video.category === 'anime';
  const hasEpisodes = video.episodes && video.episodes.length > 0;

  // Render dummy episodes if none are added in custom uploads
  const displayEpisodes = hasEpisodes 
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

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Billboard Backdrop Banner */}
      <div className="relative h-[380px] md:h-[480px] w-full overflow-hidden flex items-end">
        {/* Background Image with advanced blur/fades */}
        <div className="absolute inset-0">
          <img 
            src={video.backdrop || video.thumbnail || undefined} 
            alt={video.title} 
            className="w-full h-full object-cover scale-105 filter blur-xs brightness-95"
            referrerPolicy="no-referrer"
          />
          {/* Fades to transparent */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/95 via-transparent to-[#050505]/25"></div>
        </div>

        {/* Back Button */}
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 z-30 flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 hover:bg-cyan-500 hover:text-black hover:border-cyan-500 px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest transition shadow-lg"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Backdrop overlay layout details */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-8 md:pb-12 flex flex-col md:flex-row gap-8 items-end">
          {/* Left Poster card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-48 md:w-60 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/15 flex-shrink-0 hidden md:block"
          >
            <img src={video.thumbnail || undefined} alt={video.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </motion.div>

          {/* Right Text details inside banner */}
          <div className="flex-grow">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-cyan-500 text-black text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
                {video.category === 'movie' ? 'Movie' : 'Anime'}
              </span>
              {video.category === 'anime' && video.status && (
                <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest shadow-md ${
                  video.status.toLowerCase() === 'completed'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-500 text-black'
                }`}>
                  {video.status}
                </span>
              )}
              {video.rating && (
                <span className="bg-black/60 backdrop-blur-md text-cyan-400 text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 border border-cyan-400/20">
                  <Star size={12} fill="currentColor" />
                  {video.rating} Score
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              {video.title}
            </h1>

            {/* Quick Metadata Info */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 mt-4 text-xs font-semibold text-gray-300">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-cyan-400" />
                {video.year || '2024'}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-cyan-400" />
                {video.duration || '24 mins'}
              </span>
              {isAnime && (
                <span className="flex items-center gap-1.5">
                  <Tv size={14} className="text-cyan-400" />
                  {displayEpisodes?.length || 0} Episodes
                </span>
              )}
            </div>

            {/* Primary CTA Buttons inside Banner */}
            <div className="flex items-center gap-4 mt-6">
              {video.category === 'movie' ? (
                <button 
                  onClick={onPlayMovie}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm uppercase tracking-wider px-8 py-3.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition transform hover:scale-105 active:scale-95"
                >
                  <Play size={18} fill="currentColor" />
                  Play Movie
                </button>
              ) : (
                <button 
                  onClick={() => onPlayEpisode(0)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm uppercase tracking-wider px-8 py-3.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition transform hover:scale-105 active:scale-95"
                >
                  <Play size={18} fill="currentColor" />
                  Watch Episode 1
                </button>
              )}

              <button 
                onClick={() => onToggleFavorite(video.id)}
                className={`p-3.5 rounded-2xl border transition shadow-lg ${
                  isFavorite 
                    ? 'bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/35' 
                    : 'bg-black/40 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                }`}
                title={isFavorite ? 'Remove from My List' : 'Add to My List'}
              >
                <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Show Details and Content List Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left column - About & Synopsis */}
        <div className="lg:col-span-1 space-y-8">
          <div>
            <h2 className="text-lg font-black tracking-widest text-cyan-400 uppercase mb-4">
              Synopsis
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed font-medium">
              {video.description}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-black tracking-widest text-cyan-400 uppercase mb-4">
              Genres
            </h2>
            <div className="flex flex-wrap gap-2">
              {(video.genres || ['Action', 'Fantasy']).map((genre) => (
                <span 
                  key={genre} 
                  className="bg-zinc-900 border border-white/5 text-gray-200 text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-zinc-800 transition"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>

          {/* Key Facts */}
          <div className="bg-[#111111] border border-white/5 p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-sm tracking-wide uppercase border-b border-white/5 pb-2 text-gray-400">
              Details Info
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <span className="text-gray-400 block mb-1">Status</span>
                <span className="text-emerald-400">Completed</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-1">Studios</span>
                <span className="text-white">{(video as any).studio || 'Ufotable / MAPPA'}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-1">Aired</span>
                <span className="text-white">{video.year || '2024'}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-1">Type</span>
                <span className="text-white">{video.category === 'movie' ? 'Movie' : 'TV Series'}</span>
              </div>
              {(video as any).contentRating && (
                <div className="col-span-2">
                  <span className="text-gray-400 block mb-1">Rating Classification</span>
                  <span className="text-white">{(video as any).contentRating}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column - Episode Selection list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black tracking-tight text-white">
              {isAnime ? 'Episodes List' : 'Main Feature'}
            </h2>
            {isAnime && (
              <span className="text-xs font-mono text-gray-400 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                Season 1 ({displayEpisodes.length} Episodes)
              </span>
            )}
          </div>

          {isAnime ? (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {displayEpisodes.map((ep, idx) => (
                <div 
                  key={ep.id}
                  onClick={() => onPlayEpisode(idx)}
                  className="bg-[#111111] hover:bg-zinc-900 border border-white/5 hover:border-cyan-500/20 rounded-2xl p-4 flex gap-4 items-center cursor-pointer transition group"
                >
                  {/* Episode thumbnail cover */}
                  <div className="w-32 aspect-video bg-zinc-900 rounded-xl overflow-hidden relative flex-shrink-0">
                    <img 
                      src={video.thumbnail || undefined} 
                      alt={ep.title} 
                      className="w-full h-full object-cover filter brightness-75 group-hover:scale-105 transition"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/45 transition">
                      <Play fill="white" size={16} className="text-white" />
                    </div>
                    {/* Time length */}
                    <span className="absolute bottom-1 right-1 text-[9px] font-mono font-bold bg-black/85 px-1.5 py-0.5 rounded text-gray-300">
                      {ep.duration}
                    </span>
                  </div>

                  {/* Episode summary details */}
                  <div className="flex-grow">
                    <div className="flex items-baseline gap-2">
                      <span className="text-cyan-400 text-xs font-extrabold uppercase tracking-wider font-mono">
                        EP {ep.number}
                      </span>
                      <h3 className="font-bold text-sm text-gray-100 group-hover:text-cyan-400 transition">
                        {ep.title}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed font-medium">
                      {ep.description || 'Watch the latest episode of this amazing anime series, packed with high stakes adventure and breathtaking combat action.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div 
              onClick={onPlayMovie}
              className="bg-gradient-to-r from-zinc-900 to-[#111111] hover:from-zinc-800 border border-white/5 hover:border-cyan-500/20 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 cursor-pointer transition group"
            >
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition">
                  {video.title} (Full Movie)
                </h3>
                <p className="text-xs text-gray-400 max-w-xl font-medium">
                  {video.description}
                </p>
                <div className="flex items-center gap-4 text-xs font-mono text-gray-400 pt-1">
                  <span>Rating: {video.rating}/5</span>
                  <span>Length: {video.duration || '2h 5m'}</span>
                </div>
              </div>
              <button 
                onClick={onPlayMovie}
                className="bg-white hover:bg-cyan-500 hover:text-black text-black px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 flex-shrink-0 transition transform group-hover:scale-105"
              >
                <Play fill="currentColor" size={14} /> Start Stream
              </button>
            </div>
          )}
        </div>

      </div>

      {/* MAL Auto-Retrieved Gallery Showcase */}
      {video.gallery && video.gallery.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-16">
          <div className="border-t border-white/5 pt-10">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <h2 className="text-xl font-black tracking-tight text-white uppercase tracking-wider">
                MyAnimeList Official Art Gallery
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {video.gallery.map((imgUrl, idx) => (
                <div 
                  key={idx} 
                  className="relative group aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 hover:border-cyan-500/30 transition shadow-lg bg-zinc-950 cursor-pointer"
                  onClick={() => {
                    window.open(imgUrl, '_blank');
                  }}
                >
                  <img 
                    src={imgUrl} 
                    alt={`${video.title} Official Art ${idx + 1}`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 opacity-0 group-hover:opacity-100 transition duration-300 flex items-end p-3">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest">
                      View Original Art #{idx + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
