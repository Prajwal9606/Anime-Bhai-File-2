/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Play, Sparkles, Star, Film, Tv, Info, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Video } from '../types';
import AnimeImage from './AnimeImage';

interface JustCompletedSectionProps {
  movies?: Video[];
  onPlayMovie: (movie: Video) => void;
  onInspectMovie: (movie: Video) => void;
}

export default function JustCompletedSection({
  movies = [],
  onPlayMovie,
  onInspectMovie,
}: JustCompletedSectionProps) {
  const [visibleCount, setVisibleCount] = useState<number>(6);

  const localCompleted = useMemo(() => {
    return movies.filter(m => m.category === 'anime' && m.status === 'Completed');
  }, [movies]);

  const displayedAnime = useMemo(() => {
    if (localCompleted.length > 0) {
      return localCompleted.slice(0, 12);
    }
    // Fallback: show any local tv-shows if none are explicitly marked "Completed" yet
    return movies.filter(m => m.category === 'anime').slice(0, 12);
  }, [movies, localCompleted]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 transition-all duration-500 ease-in-out border border-cyan-500/20 bg-cyan-950/5 backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.1)] rounded-3xl mt-4 hover:border-cyan-500/45 hover:shadow-[0_0_40px_rgba(6,182,212,0.22)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Just Completed Series
              <span className="text-[10px] bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-widest shadow-inner">
                Finished Airing
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Binge the full story. Standard complete seasons with no weekly wait.
            </p>
          </div>
        </div>
      </div>

      {displayedAnime.length === 0 ? (
        <div className="py-12 bg-white/5 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-center p-6 gap-2">
          <AlertCircle className="w-7 h-7 text-gray-400" />
          <h3 className="text-xs font-bold text-gray-300">No Series Found</h3>
          <p className="text-[11px] text-gray-500 max-w-sm">
            Once you upload anime series and they are completed, they will appear here!
          </p>
        </div>
      ) : (
        <>
          {/* Portrait Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {displayedAnime.slice(0, visibleCount).map((movie) => (
              <div
                key={movie.id}
                onClick={() => onInspectMovie(movie)}
                className="group relative bg-[#0e0e0e] border border-white/5 hover:border-cyan-500/30 rounded-lg overflow-hidden transition-all duration-300 cursor-pointer shadow hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:scale-[1.02] active:scale-[0.98] flex flex-col h-full"
              >
                {/* Image Preview Container */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-900 border-b border-white/5 shrink-0">
                  <AnimeImage
                    title={movie.title}
                    initialSrc={movie.thumbnail || movie.backdrop}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out hover:brightness-110"
                  />

                  {/* Visual Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  {/* Floating Tags */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-md">
                      COMPLETED
                    </span>
                  </div>

                  <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/75 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-bold text-yellow-400 font-mono">
                    <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                    <span>{movie.rating}</span>
                  </div>

                  {/* Hover Control Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 duration-300 gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayMovie(movie);
                      }}
                      className="w-10 h-10 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 active:scale-95"
                    >
                      <Play className="w-5 h-5 fill-black ml-0.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspectMovie(movie);
                      }}
                      className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-[9px] font-bold text-white transition-all uppercase tracking-wider border border-white/5"
                    >
                      <Info className="w-3 h-3" />
                      <span>Info</span>
                    </button>
                  </div>
                </div>

                {/* Episode metadata info */}
                <div className="p-3 flex flex-col flex-grow justify-between min-w-0">
                  <div className="min-w-0">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 truncate block">
                      {movie.duration}
                    </span>
                    <h4 className="text-[11px] font-bold text-white mt-1 group-hover:text-cyan-300 transition-colors truncate">
                      {movie.title}
                    </h4>
                    {movie.description && (
                      <p className="text-[10px] text-gray-500 mt-1 leading-relaxed line-clamp-2">
                        {movie.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-2 text-[9px] font-bold uppercase tracking-widest text-gray-500 font-mono">
                    <span className="truncate max-w-[70%]">{movie.genres.slice(0, 1).join(', ') || 'Series'}</span>
                    <span>{movie.year}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* More / Less Button */}
          {displayedAnime.length > 6 && (
            <div className="flex justify-center mt-6 pt-2 border-t border-white/5">
              <button
                onClick={() => setVisibleCount((prev) => (prev === 6 ? 12 : 6))}
                className="px-6 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-sm hover:shadow-cyan-500/10 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>{visibleCount === 6 ? 'Show More Series' : 'Show Less'}</span>
                {visibleCount === 6 ? (
                  <ChevronDown className="w-4 h-4 text-cyan-400" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-cyan-400" />
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
