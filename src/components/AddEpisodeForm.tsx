import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import { Film, Radio, Code, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

interface EpisodeFormInputs {
  episodeNumber: number;
  title: string;
  thumbnailUrl?: string;
  hindiUrl: string;
  hindiEmbedHtml?: string;
  japaneseUrl?: string;
  japaneseEmbedHtml?: string;
  englishUrl?: string;
  englishEmbedHtml?: string;
  embedHtml?: string;
}

interface AddEpisodeFormProps {
  animeId: string;
  animeTitle: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AddEpisodeForm({ animeId, animeTitle, onSuccess, onCancel }: AddEpisodeFormProps) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<EpisodeFormInputs>({
    defaultValues: {
      episodeNumber: 1,
      title: '',
      thumbnailUrl: '',
      hindiUrl: '',
      hindiEmbedHtml: '',
      japaneseUrl: '',
      japaneseEmbedHtml: '',
      englishUrl: '',
      englishEmbedHtml: '',
      embedHtml: ''
    }
  });

  const onSubmit = async (data: EpisodeFormInputs) => {
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    // Prepare JSONB audio tracks payload
    const audioTracks: Record<string, string> = {};
    if (data.hindiUrl) audioTracks.hindi = data.hindiUrl;
    if (data.japaneseUrl) audioTracks.japanese = data.japaneseUrl;
    if (data.englishUrl) audioTracks.english = data.englishUrl;

    // Build standard audioSources list for compatibility
    const audioSources = [
      { lang: 'Hindi' as const, url: data.hindiUrl, embedHtml: data.hindiEmbedHtml || '' },
      ...((data.japaneseUrl || data.japaneseEmbedHtml) ? [{ lang: 'Japanese' as const, url: data.japaneseUrl || '', embedHtml: data.japaneseEmbedHtml || '' }] : []),
      ...((data.englishUrl || data.englishEmbedHtml) ? [{ lang: 'English' as const, url: data.englishUrl || '', embedHtml: data.englishEmbedHtml || '' }] : [])
    ];

    try {
      if (!supabase) {
        throw new Error('Supabase client is not configured or offline.');
      }

      // Securely insert the episode data into Supabase
      const { error } = await supabase
        .from('episodes')
        .insert({
          anime_id: animeId,
          episode_number: data.episodeNumber,
          title: data.title,
          video_url: data.hindiUrl || data.japaneseUrl || data.englishUrl || '',
          duration: '24m', // Default episode duration
          audio_tracks: audioTracks, // JSONB structure
          audioSources: audioSources, // List structure for local compatibility
          embedHtml: data.embedHtml || null
        });

      if (error) throw error;

      setSuccessMsg(`Successfully added Episode ${data.episodeNumber} to "${animeTitle}"!`);
      reset();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error inserting episode:', err);
      setErrorMsg(err.message || 'An error occurred while saving the episode to the database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-950 border border-white/5 rounded-3xl p-6 md:p-8 max-w-2xl mx-auto space-y-6 shadow-2xl">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-cyan-400">
          <Film className="w-5 h-5 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest">Episode Management</span>
        </div>
        <h2 className="text-xl font-black text-white tracking-tight">
          Add Episode to <span className="text-cyan-400">"{animeTitle}"</span>
        </h2>
        <p className="text-xs text-gray-400 font-medium leading-relaxed">
          Configure multi-language streaming assets, audio dubs, and third-party media players (Supports MP4 & Streamp2p).
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
              Episode Number <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              {...register('episodeNumber', { 
                required: 'Episode number is required', 
                min: { value: 1, message: 'Must be at least 1' } 
              })}
              placeholder="e.g. 1"
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-500 transition outline-none font-semibold"
            />
            {errors.episodeNumber && (
              <span className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.episodeNumber.message}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
              Episode Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('title', { required: 'Episode title is required' })}
              placeholder="e.g. Dawn of the Journey"
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-500 transition outline-none font-semibold"
            />
            {errors.title && (
              <span className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.title.message}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
            Thumbnail URL (Optional)
          </label>
          <input
            type="url"
            {...register('thumbnailUrl')}
            placeholder="e.g. https://images.unsplash.com/..."
            className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-500 transition outline-none font-semibold"
          />
        </div>

        {/* Audio Tracks, Video Streams & Language-Specific Embeds Section */}
        <div className="bg-black/50 border border-white/5 p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Radio className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
              Language Tracks (URLs & Embeds)
            </h3>
          </div>

          <div className="space-y-4">
            {/* Hindi Dub (Default) */}
            <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 space-y-3 relative">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-orange-500" />
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-300">Hindi Track (Default)</span>
                <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded font-black uppercase">Required</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Video Stream URL</label>
                  <input
                    type="url"
                    {...register('hindiUrl', { required: 'Hindi stream URL is required' })}
                    placeholder="e.g. https://domain.com/hindi.mp4"
                    className="w-full bg-black border border-white/10 focus:border-cyan-500 rounded-xl px-4 py-2 text-xs text-white transition outline-none font-mono"
                  />
                  {errors.hindiUrl && (
                    <span className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.hindiUrl.message}
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Embed Code / Link</label>
                  <input
                    type="text"
                    {...register('hindiEmbedHtml')}
                    placeholder="e.g. <iframe src='...'> or embed link"
                    className="w-full bg-black border border-white/10 focus:border-cyan-500 rounded-xl px-4 py-2 text-xs text-white transition outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Japanese Sub */}
            <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 space-y-3 relative">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500" />
              <span className="text-xs font-black uppercase tracking-wider text-zinc-300 block">Japanese Track (Optional)</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Video Stream URL</label>
                  <input
                    type="url"
                    {...register('japaneseUrl')}
                    placeholder="e.g. https://domain.com/japanese.mp4"
                    className="w-full bg-black border border-white/10 focus:border-cyan-500 rounded-xl px-4 py-2 text-xs text-white transition outline-none font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Embed Code / Link</label>
                  <input
                    type="text"
                    {...register('japaneseEmbedHtml')}
                    placeholder="e.g. <iframe src='...'> or embed link"
                    className="w-full bg-black border border-white/10 focus:border-cyan-500 rounded-xl px-4 py-2 text-xs text-white transition outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* English Dub */}
            <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 space-y-3 relative">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-cyan-500" />
              <span className="text-xs font-black uppercase tracking-wider text-zinc-300 block">English Track (Optional)</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Video Stream URL</label>
                  <input
                    type="url"
                    {...register('englishUrl')}
                    placeholder="e.g. https://domain.com/english.mp4"
                    className="w-full bg-black border border-white/10 focus:border-cyan-500 rounded-xl px-4 py-2 text-xs text-white transition outline-none font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Embed Code / Link</label>
                  <input
                    type="text"
                    {...register('englishEmbedHtml')}
                    placeholder="e.g. <iframe src='...'> or embed link"
                    className="w-full bg-black border border-white/10 focus:border-cyan-500 rounded-xl px-4 py-2 text-xs text-white transition outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Third-Party Player Embed Code */}
        <div className="bg-black/50 border border-white/5 p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Code className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
              Default / Fallback Player Embed Code
            </h3>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block">
              Fallback HTML Embed Code
            </label>
            <textarea
              {...register('embedHtml')}
              placeholder='e.g. <iframe src="https://streamp2p.com/embed/..." width="100%" height="100%" frameborder="0" allowfullscreen></iframe>'
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-500 transition outline-none font-mono h-16 resize-none"
            />
            <p className="text-[10px] text-gray-500 font-medium">
              Optional fallback general iframe embed code when no track-specific embeds are configured.
            </p>
          </div>
        </div>
        {/* Feedback Messages */}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Controls */}
        <div className="flex justify-end items-center gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl shadow-lg shadow-cyan-500/15 flex items-center gap-2 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                Add Episode
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
