import { Play, Star } from 'lucide-react';
import { Video } from '../types';
import { motion } from 'motion/react';

interface AnimeCardProps {
  video: Video;
  onClick: () => void;
  key?: any;
}

export default function AnimeCard({ video, onClick }: AnimeCardProps) {
  return (
    <motion.div 
      whileHover={{ scale: 1.04, y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="bg-[#111111] rounded-2xl overflow-hidden group cursor-pointer border border-white/5 hover:border-cyan-500/30 shadow-md hover:shadow-lg hover:shadow-cyan-500/5 flex flex-col h-full"
    >
      {/* Thumbnail with overlay */}
      <div className="relative aspect-[16/10] overflow-hidden bg-zinc-900 flex-shrink-0">
        <img 
          src={video.thumbnail || undefined} 
          alt={video.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        {/* Glow & Play Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center transform scale-75 group-hover:scale-100 transition duration-300 text-black shadow-lg shadow-cyan-500/25">
            <Play fill="black" size={20} className="ml-1" />
          </div>
        </div>

        {/* Rating and Type tags */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {video.rating && (
            <span className="bg-black/80 backdrop-blur-md text-cyan-400 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-cyan-400/20">
              <Star size={8} fill="currentColor" />
              {video.rating}
            </span>
          )}
          <span className="bg-cyan-500 text-black text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
            {video.category === 'movie' ? 'Movie' : 'TV'}
          </span>
          {video.category === 'anime' && video.status && (
            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm ${
              video.status.toLowerCase() === 'completed'
                ? 'bg-emerald-500 text-white'
                : 'bg-amber-500 text-black'
            }`}>
              {video.status}
            </span>
          )}
        </div>

        {/* Year / Duration overlay */}
        <div className="absolute bottom-2 right-2 text-[10px] font-mono text-gray-300 bg-black/75 px-2 py-0.5 rounded-md border border-white/5">
          {video.year || '2024'} • {video.duration || '24m'}
        </div>
      </div>

      {/* Details info */}
      <div className="p-4 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="font-bold text-sm text-gray-100 group-hover:text-cyan-400 transition-colors line-clamp-1">
            {video.title}
          </h3>
          <p className="text-[11px] text-gray-400 line-clamp-2 mt-1.5 leading-relaxed font-medium">
            {video.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-1 mt-3">
          {(video.genres || ['Anime']).slice(0, 2).map((genre) => (
            <span 
              key={genre} 
              className="text-[10px] bg-white/5 hover:bg-white/10 text-gray-300 px-2 py-0.5 rounded-md transition border border-white/5"
            >
              {genre}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
