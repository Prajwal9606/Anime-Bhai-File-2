/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from 'react';
import { Play, Tv, Sparkles, Clock, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Video, Episode } from '../types';
import { motion } from 'motion/react';

interface LatestEpisodesSectionProps {
  movies: Video[];
  onPlayEpisode: (movie: Video, episodeIndex: number) => void;
  isAdmin: boolean;
  onAdminClick?: () => void;
}

export default function LatestEpisodesSection({
  movies,
  onPlayEpisode,
  isAdmin,
  onAdminClick,
}: LatestEpisodesSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Extract all episodes added by the admin, or generate default ones if none exist
  const allEpisodeUpdates = useMemo(() => {
    const list: { movie: Video; episode: Episode; isCustom: boolean }[] = [];

    // 1. Gather all admin-created custom episodes
    movies.forEach((m) => {
      if (m.category === 'anime' && m.episodes && m.episodes.length > 0) {
        m.episodes.forEach((ep) => {
          list.push({
            movie: m,
            episode: ep,
            isCustom: true,
          });
        });
      }
    });

    // Sort custom episodes by index or timestamp-like id so latest are first
    list.sort((a, b) => {
      // If id is ep-timestamp, sort descending by timestamp
      const aTime = a.episode.id.startsWith('ep-') ? parseInt(a.episode.id.split('-')[1]) || 0 : 0;
      const bTime = b.episode.id.startsWith('ep-') ? parseInt(b.episode.id.split('-')[1]) || 0 : 0;
      if (bTime !== aTime) return bTime - aTime;
      return b.episode.index - a.episode.index;
    });

    // 2. If no custom episodes are added yet, generate gorgeous mock updates from active TV Shows
    if (list.length === 0) {
      const tvShows = movies.filter((m) => m.category === 'anime');
      tvShows.forEach((show) => {
        // Create 2 default episode updates for each show to keep the homepage lively
        const defaultTitles = [
          'The Rise of Power',
          'Beyond the Gate',
          'Shadows of Past',
          'Breaking the Limit',
        ];
        [3, 2, 1].forEach((index) => {
          list.push({
            movie: show,
            episode: {
              id: `default-${show.id}-${index}`,
              number: index,
              index,
              title: defaultTitles[index - 1] || `Special Episode ${index}`,
              videoUrl: '',
              duration: '24m',
              description: 'The journey takes an unexpected turn as new secrets are uncovered.',
            },
            isCustom: false,
          });
        });
      });
    }

    return list;
  }, [movies]);

  // Reset page when number of episodes changes
  useEffect(() => {
    setCurrentPage(1);
  }, [allEpisodeUpdates.length]);

  const totalPages = Math.ceil(allEpisodeUpdates.length / itemsPerPage);
  const safeCurrentPage = Math.min(currentPage, totalPages || 1);

  const paginatedEpisodes = useMemo(() => {
    const start = (safeCurrentPage - 1) * itemsPerPage;
    return allEpisodeUpdates.slice(start, start + itemsPerPage);
  }, [allEpisodeUpdates, safeCurrentPage, itemsPerPage]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 transition-all duration-300 ease-in-out border border-transparent hover:border-cyan-500/20 hover:bg-cyan-950/5 hover:backdrop-blur-sm hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] rounded-2xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Tv className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Latest Episode Updates
              <span className="text-[10px] bg-orange-500/15 border border-orange-500/30 text-orange-400 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-widest animate-pulse">
                New Releases
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Recently broadcast episodes and developer-curated releases.
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-md font-bold tracking-wider uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Admin Mode Active • Edit Series to Add Episodes</span>
          </div>
        )}
      </div>

      {allEpisodeUpdates.length === 0 ? (
        <div className="py-12 bg-white/5 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-center p-6 gap-3">
          <AlertCircle className="w-8 h-8 text-gray-600" />
          <h3 className="text-sm font-bold text-gray-300">No Episode Updates Yet</h3>
          <p className="text-xs text-gray-500 max-w-sm">
            Add some TV Series or Anime titles in the Catalog Control dashboard to view latest episode releases.
          </p>
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {paginatedEpisodes.map(({ movie, episode, isCustom }) => (
              <div
                key={`${movie.id}-${episode.id}`}
                onClick={() => onPlayEpisode(movie, episode.index - 1)}
                className="group relative bg-[#0e0e0e] border border-white/5 hover:border-white/15 rounded-lg overflow-hidden transition-all duration-300 cursor-pointer shadow hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex flex-col h-full animate-fade-in"
              >
                {/* Image Preview Container */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-900 border-b border-white/5 shrink-0">
                  <img
                    src={movie.posterUrl || movie.backdropUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200'}
                    alt={episode.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200';
                    }}
                  />
                  
                  {/* Visual Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  
                  {/* Floating Tags */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md">
                      EP {episode.index}
                    </span>
                    {isCustom && (
                      <span className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest bg-indigo-600 text-indigo-100 border border-indigo-400/30 shadow-md">
                        CUSTOM
                      </span>
                    )}
                  </div>

                  {episode.duration && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/75 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-bold text-gray-300 font-mono">
                      <Clock className="w-2.5 h-2.5 text-gray-400" />
                      <span>{episode.duration}</span>
                    </div>
                  )}

                  {/* Hover Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 duration-300">
                    <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      <Play className="w-5 h-5 fill-black ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Episode metadata info */}
                <div className="p-3 flex flex-col flex-grow justify-between min-w-0">
                  <div className="min-w-0">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-400 truncate block">
                      {movie.title}
                    </span>
                    <h4 className="text-[11px] font-bold text-white mt-1 group-hover:text-orange-300 transition-colors truncate">
                      {episode.title}
                    </h4>
                    {episode.description && (
                      <p className="text-[10px] text-gray-500 mt-1 leading-relaxed line-clamp-2">
                        {episode.description}
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-6 mt-6">
              <span className="text-xs text-gray-400">
                Showing <span className="font-bold text-white">{(safeCurrentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-bold text-white">
                  {Math.min(safeCurrentPage * itemsPerPage, allEpisodeUpdates.length)}
                </span>{' '}
                of <span className="font-bold text-white">{allEpisodeUpdates.length}</span> episodes
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={safeCurrentPage === 1}
                  className="p-2 rounded-lg bg-white/5 hover:bg-cyan-500/10 text-gray-400 hover:text-cyan-400 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 border border-white/5 hover:border-cyan-500/20 cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => {
                  const isActive = p === safeCurrentPage;
                  return (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200 border cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black border-cyan-400/30 font-black shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                          : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/5'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={safeCurrentPage === totalPages}
                  className="p-2 rounded-lg bg-white/5 hover:bg-cyan-500/10 text-gray-400 hover:text-cyan-400 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 border border-white/5 hover:border-cyan-500/20 cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
