import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Loader2, PlayCircle, AlertCircle, FileVideo } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Explicit types requested by the user
export interface AudioTracks {
  hindi?: string;
  japanese?: string;
  english?: string;
}

export interface SupabaseEpisode {
  id: string;
  anime_id: string;
  episode_number: number;
  title: string;
  thumbnail_url?: string;
  duration?: string;
  video_url?: string;
  audio_tracks?: AudioTracks; // JSONB column equivalent
  
  // Firestore/custom fallback compatibility
  number?: number;
  videoUrl?: string;
  audioSources?: { lang: 'Hindi' | 'Japanese' | 'English'; url: string }[];
}

interface EpisodesListProps {
  animeId: string;
  onEditEpisode?: (episode: SupabaseEpisode) => void;
}

export default function EpisodesList({ animeId, onEditEpisode }: EpisodesListProps) {
  const [episodes, setEpisodes] = useState<SupabaseEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEpisodes = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetching from Firebase Firestore 'episodes' collection using matching query
      const q = query(
        collection(db, 'episodes'), 
        where('animeId', '==', animeId)
      );
      const querySnapshot = await getDocs(q);
      const fetched: SupabaseEpisode[] = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data
        } as SupabaseEpisode;
      });
      
      // Sort by episode number (supporting both field names)
      fetched.sort((a, b) => {
        const numA = a.episode_number ?? a.number ?? 0;
        const numB = b.episode_number ?? b.number ?? 0;
        return numA - numB;
      });
      
      setEpisodes(fetched);
    } catch (err) {
      console.error("Error loading episodes from Firestore:", err);
      setError("Failed to fetch episodes. Please check your connection or database schema.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (animeId) {
      fetchEpisodes();
    }
  }, [animeId]);

  const handleDelete = async (id: string) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this episode? This action cannot be undone.");
    if (!isConfirmed) return;

    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'episodes', id));
      setEpisodes(prev => prev.filter(ep => ep.id !== id));
    } catch (err) {
      console.error("Error deleting episode:", err);
      alert("Error deleting episode. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // Safe checks for audio presence (supporting both standard JSONB structure and array backup)
  const getAvailableLanguages = (ep: SupabaseEpisode) => {
    const langs: { lang: 'Hindi' | 'Japanese' | 'English'; present: boolean }[] = [
      { lang: 'Hindi', present: false },
      { lang: 'Japanese', present: false },
      { lang: 'English', present: false },
    ];

    // Check JSONB schema audio_tracks
    if (ep.audio_tracks) {
      if (ep.audio_tracks.hindi) langs[0].present = true;
      if (ep.audio_tracks.japanese) langs[1].present = true;
      if (ep.audio_tracks.english) langs[2].present = true;
    }

    // Check Firestore array backup audioSources
    if (ep.audioSources) {
      ep.audioSources.forEach(s => {
        if (s.lang === 'Hindi' && s.url) langs[0].present = true;
        if (s.lang === 'Japanese' && s.url) langs[1].present = true;
        if (s.lang === 'English' && s.url) langs[2].present = true;
      });
    }

    return langs.filter(l => l.present).map(l => l.lang);
  };

  if (loading) {
    return (
      <div className="bg-gray-950 border border-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[200px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider animate-pulse">
          Fetching series episodes...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/20 border border-red-900/45 rounded-2xl p-6 flex items-start gap-3 text-red-400">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-black uppercase tracking-wider">Database Error</h4>
          <p className="text-xs text-red-300/80 mt-1 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  if (episodes.length === 0) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl py-12 px-6 text-center flex flex-col items-center justify-center gap-2">
        <PlayCircle className="w-8 h-8 text-gray-600 mb-1" />
        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">No Episodes Found</h3>
        <p className="text-[11px] text-gray-500 max-w-sm leading-relaxed">
          There are no episodes configured for this series. Add new episodes using the creator panel above!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800/80 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-950 border-b border-gray-800/80 text-gray-400 text-[10px] uppercase tracking-widest font-black">
              <th className="p-4 w-16 text-center">Ep #</th>
              <th className="p-4">Thumbnail & Title</th>
              <th className="p-4">Available Audio</th>
              <th className="p-4 text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {episodes.map(ep => {
              const availableLangs = getAvailableLanguages(ep);
              const epNum = ep.episode_number ?? ep.number ?? 0;
              
              return (
                <tr key={ep.id} className="hover:bg-gray-800/40 transition-colors group">
                  {/* Episode Number */}
                  <td className="p-4 text-center font-black font-mono text-cyan-400 text-sm">
                    {epNum}
                  </td>
                  
                  {/* Thumbnail & Title */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-10 rounded-lg overflow-hidden bg-gray-950 border border-gray-800/80 shrink-0 flex items-center justify-center relative group-hover:border-cyan-500/30 transition-colors">
                        {ep.thumbnail_url ? (
                          <img 
                            src={ep.thumbnail_url} 
                            alt="" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <FileVideo className="w-4 h-4 text-gray-600" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <PlayCircle className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-white group-hover:text-cyan-300 transition-colors truncate text-xs">
                          {ep.title || `Episode ${epNum}`}
                        </h4>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {ep.duration || '24m'}
                        </span>
                      </div>
                    </div>
                  </td>
                  
                  {/* Available Audio */}
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1.5">
                      {availableLangs.length > 0 ? (
                        availableLangs.map(lang => {
                          let badgeStyle = 'bg-gray-800 border-gray-700 text-gray-400';
                          let displayName: string = lang;
                          
                          if (lang === 'Hindi') {
                            badgeStyle = 'bg-orange-500/10 border-orange-500/30 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.1)]';
                            displayName = 'HN';
                          } else if (lang === 'Japanese') {
                            badgeStyle = 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]';
                            displayName = 'JP';
                          } else if (lang === 'English') {
                            badgeStyle = 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]';
                            displayName = 'ENG';
                          }
                          
                          return (
                            <span 
                              key={lang} 
                              className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider ${badgeStyle}`}
                            >
                              {displayName}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[10px] text-gray-600 italic">No Audio Configured</span>
                      )}
                    </div>
                  </td>
                  
                  {/* Actions */}
                  <td className="p-4 text-right">
                    <div className="flex justify-end items-center gap-1">
                      {onEditEpisode && (
                        <button 
                          onClick={() => onEditEpisode(ep)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-cyan-400 hover:bg-gray-800 transition-all"
                          title="Edit Episode"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(ep.id)}
                        disabled={deletingId === ep.id}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-all disabled:opacity-50"
                        title="Delete Episode"
                      >
                        {deletingId === ep.id ? (
                          <Loader2 size={14} className="animate-spin text-red-400" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
