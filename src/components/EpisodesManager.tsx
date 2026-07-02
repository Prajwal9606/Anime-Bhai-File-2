import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Trash2, 
  Edit2, 
  Zap, 
  Save, 
  X, 
  Film, 
  Code, 
  Radio, 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  Plus, 
  Globe, 
  Music,
  CheckCircle2,
  Tv
} from 'lucide-react';
import { Episode } from '../types';

interface EpisodesManagerProps {
  animeTitle: string;
  episodes: Episode[];
  onUpdateEpisodes: (episodes: Episode[]) => void;
  onSave: () => void;
  onCancel: () => void;
}

type LangTab = 'Hindi' | 'Japanese' | 'English' | 'Fallback';

export default function EpisodesManager({ animeTitle, episodes, onUpdateEpisodes, onSave, onCancel }: EpisodesManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [activeLangTab, setActiveLangTab] = useState<LangTab>('Hindi');
  
  // State for the edit/add form
  const [form, setForm] = useState<Episode>({ 
    id: '', 
    number: 1, 
    title: '', 
    duration: '24m', 
    videoUrl: '',
    audioSources: [
      { lang: 'Hindi', url: '', embedHtml: '' },
      { lang: 'Japanese', url: '', embedHtml: '' },
      { lang: 'English', url: '', embedHtml: '' }
    ],
    embedHtml: ''
  });

  // Automatically sync next episode number if not editing
  useEffect(() => {
    if (editingIndex === null) {
      setForm(prev => ({
        ...prev,
        number: episodes.length + 1,
        title: `Episode ${episodes.length + 1}`
      }));
    }
  }, [episodes.length, editingIndex]);

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    const targetEpisode = episodes[index];
    
    // Ensure audioSources has all three languages represented for stable form handling
    const rawSources = targetEpisode.audioSources || [];
    const normalizedSources = (['Hindi', 'Japanese', 'English'] as const).map(lang => {
      const match = rawSources.find(s => s.lang === lang);
      return match ? { ...match } : { lang, url: '', embedHtml: '' };
    });

    setForm({
      ...targetEpisode,
      audioSources: normalizedSources
    });
  };

  const handleAddOrUpdateEpisode = () => {
    // Validate basics
    if (!form.title.trim()) {
      alert('Please enter an episode title.');
      return;
    }

    // Clean up empty audioSources before saving to minimize DB weight
    const cleanSources = (form.audioSources || []).filter(s => s.url?.trim() || s.embedHtml?.trim());

    const finalizedEpisode: Episode = {
      id: form.id || `ep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      number: Number(form.number) || (episodes.length + 1),
      title: form.title.trim(),
      duration: form.duration?.trim() || '24m',
      videoUrl: form.videoUrl?.trim() || '',
      audioSources: cleanSources.length > 0 ? cleanSources : undefined,
      embedHtml: form.embedHtml?.trim() || undefined
    };

    if (editingIndex !== null) {
      // UPDATE mode
      const updated = [...episodes];
      updated[editingIndex] = finalizedEpisode;
      
      // Sort by episode number automatically to ensure pristine listing
      updated.sort((a, b) => a.number - b.number);
      onUpdateEpisodes(updated);
      setEditingIndex(null);
    } else {
      // ADD mode
      const updated = [...episodes, finalizedEpisode];
      updated.sort((a, b) => a.number - b.number);
      onUpdateEpisodes(updated);
    }

    // Reset Form
    resetFormState();
  };

  const resetFormState = () => {
    setEditingIndex(null);
    setForm({
      id: '',
      number: episodes.length + 1,
      title: `Episode ${episodes.length + 1}`,
      duration: '24m',
      videoUrl: '',
      audioSources: [
        { lang: 'Hindi', url: '', embedHtml: '' },
        { lang: 'Japanese', url: '', embedHtml: '' },
        { lang: 'English', url: '', embedHtml: '' }
      ],
      embedHtml: ''
    });
  };

  const handleDeleteEpisode = (index: number) => {
    const updated = episodes.filter((_, i) => i !== index);
    // Auto re-sequence episode numbers for cleanliness
    const resequenced = updated.map((ep, idx) => ({
      ...ep,
      number: idx + 1
    }));
    onUpdateEpisodes(resequenced);
    if (editingIndex === index) {
      resetFormState();
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const moveEpisode = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === episodes.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...episodes];
    
    // Swap episodes
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Fix up their sequential episode numbers to stay mathematically ordered
    const resequenced = updated.map((ep, idx) => ({
      ...ep,
      number: idx + 1
    }));

    onUpdateEpisodes(resequenced);
    if (editingIndex === index) {
      setEditingIndex(targetIndex);
    } else if (editingIndex === targetIndex) {
      setEditingIndex(index);
    }
  };

  const handleAutoGenerate = () => {
    const nextStart = episodes.length > 0 ? Math.max(...episodes.map(e => e.number)) + 1 : 1;
    const generated: Episode[] = Array.from({ length: 12 }, (_, i) => {
      const num = nextStart + i;
      return {
        id: `auto-${Date.now()}-${num}-${Math.random().toString(36).substr(2, 4)}`,
        number: num,
        title: `Episode ${num}: Dawn of Battle`,
        duration: '24m',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
      };
    });
    
    onUpdateEpisodes([...episodes, ...generated]);
  };

  // Quick helper to check which languages are configured for a given episode
  const getLanguageBadges = (ep: Episode) => {
    const badges: { lang: string; color: string; bg: string }[] = [];
    
    // Fallback/Default
    if (ep.videoUrl || ep.embedHtml) {
      badges.push({ lang: 'DEF', color: 'text-cyan-400 border-cyan-500/20', bg: 'bg-cyan-500/10' });
    }
    
    // Detailed sources
    if (ep.audioSources && ep.audioSources.length > 0) {
      ep.audioSources.forEach(s => {
        if (s.url || s.embedHtml) {
          if (s.lang === 'Hindi') {
            badges.push({ lang: 'HI', color: 'text-orange-400 border-orange-500/20', bg: 'bg-orange-500/10' });
          } else if (s.lang === 'Japanese') {
            badges.push({ lang: 'JA', color: 'text-red-400 border-red-500/20', bg: 'bg-red-500/10' });
          } else if (s.lang === 'English') {
            badges.push({ lang: 'EN', color: 'text-emerald-400 border-emerald-500/20', bg: 'bg-emerald-500/10' });
          }
        }
      });
    }
    
    return badges;
  };

  return (
    <div className="bg-[#0b0c10] border border-cyan-500/15 rounded-3xl p-6 text-white shadow-[0_0_50px_rgba(6,182,212,0.05)] relative overflow-hidden">
      {/* Absolute ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none -ml-40 -mb-40" />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-5 border-b border-white/5 relative z-10">
        <div>
          <span className="text-[10px] font-black text-cyan-400 tracking-widest uppercase block mb-1">INTERACTIVE SERIES MANAGER</span>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
            <Tv className="text-cyan-400 animate-pulse" size={24} /> 
            <span>Episode Catalogue</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Currently editing playlist for <span className="text-cyan-400 font-bold">"{animeTitle}"</span>.
          </p>
        </div>
        
        <div className="flex gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <button 
            type="button"
            onClick={handleAutoGenerate} 
            className="flex-1 sm:flex-none bg-purple-900/30 border border-purple-500/25 text-purple-300 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-purple-900/50 transition duration-300"
          >
            <Zap size={14} className="text-purple-400" /> Auto-Generate 12 EPs
          </button>
          <button 
            type="button"
            onClick={() => {
              if (confirm('Are you sure you want to clear all episodes in this series?')) {
                onUpdateEpisodes([]);
                resetFormState();
              }
            }} 
            className="flex-1 sm:flex-none bg-red-950/20 border border-red-500/15 text-red-400 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-red-950/40 transition duration-300"
          >
            <Trash2 size={14} /> Clear All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* LEFT PANEL: ADVANCED EDITOR (7 Columns) */}
        <div className="lg:col-span-7 bg-zinc-950/60 border border-white/5 rounded-2xl p-6 space-y-5 relative">
          
          <div className="flex justify-between items-center pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${editingIndex !== null ? 'bg-amber-400 animate-pulse shadow-[0_0_8px_#fbbf24]' : 'bg-cyan-500 shadow-[0_0_8px_#22d3ee]'}`} />
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-200">
                {editingIndex !== null ? `Editing Episode ${form.number}` : 'Episode Builder (Add Mode)'}
              </h3>
            </div>
            {editingIndex !== null && (
              <button 
                onClick={resetFormState}
                className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-wider font-bold flex items-center gap-1 transition"
              >
                <X size={12} /> Cancel Edit
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* Title Block */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">Episode Title</label>
              <input 
                type="text" 
                placeholder="e.g., Episode 1: The Dark Continent" 
                value={form.title} 
                onChange={e => setForm({...form, title: e.target.value})} 
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-cyan-500/50 transition duration-300 outline-none font-bold" 
              />
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">Episode Number</label>
                <input 
                  type="number" 
                  min="1"
                  value={form.number} 
                  onChange={e => setForm({...form, number: Number(e.target.value)})} 
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-500/50 transition duration-300 outline-none font-bold font-mono" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">Duration</label>
                <input 
                  type="text" 
                  placeholder="e.g., 24m" 
                  value={form.duration} 
                  onChange={e => setForm({...form, duration: e.target.value})} 
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-500/50 transition duration-300 outline-none font-bold font-mono" 
                />
              </div>
            </div>

            {/* Language Stream Override Tabs */}
            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-white/5">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Music size={12} className="text-cyan-400" /> Lang Tracks & Media Players
                </span>
                
                {/* Language tab selector */}
                <div className="flex gap-1 bg-zinc-900/80 p-1 rounded-xl border border-white/5 overflow-x-auto">
                  {(['Hindi', 'Japanese', 'English', 'Fallback'] as const).map(tab => {
                    const isSelected = activeLangTab === tab;
                    
                    // Quick check if configured
                    let isConfigured = false;
                    if (tab === 'Fallback') {
                      isConfigured = !!(form.videoUrl || form.embedHtml);
                    } else {
                      const match = form.audioSources?.find(s => s.lang === tab);
                      isConfigured = !!(match?.url || match?.embedHtml);
                    }

                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveLangTab(tab)}
                        className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all duration-300 relative whitespace-nowrap ${
                          isSelected 
                            ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/10' 
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {tab}
                        {isConfigured && (
                          <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-zinc-950' : 'bg-cyan-400 shadow-[0_0_4px_#22d3ee]'}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Tab Body */}
              <div className="space-y-3 pt-1">
                {activeLangTab !== 'Fallback' ? (
                  (() => {
                    const lang = activeLangTab as 'Hindi' | 'Japanese' | 'English';
                    const newSources = [...(form.audioSources || [])];
                    const sourceIndex = newSources.findIndex(s => s.lang === lang);
                    const source = sourceIndex > -1 ? newSources[sourceIndex] : { lang, url: '', embedHtml: '' };

                    const handleSourceChange = (field: 'url' | 'embedHtml', value: string) => {
                      const updatedSources = [...newSources];
                      const idx = updatedSources.findIndex(s => s.lang === lang);
                      if (idx > -1) {
                        updatedSources[idx][field] = value;
                      } else {
                        updatedSources.push({ lang, url: field === 'url' ? value : '', embedHtml: field === 'embedHtml' ? value : '' });
                      }
                      setForm({ ...form, audioSources: updatedSources });
                    };

                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-zinc-300">
                            Configure {lang} Dub/Sub
                          </span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                            source.url || source.embedHtml ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-zinc-900 text-zinc-500'
                          }`}>
                            {source.url || source.embedHtml ? 'CONFIGURED' : 'NOT CONFIGURED'}
                          </span>
                        </div>

                        <div className="space-y-3 bg-zinc-950/40 p-3 rounded-xl border border-white/5">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Direct Video Stream Link (MP4/m3u8)</label>
                            <input 
                              type="url" 
                              placeholder={`https://example.com/anime-${lang.toLowerCase()}.mp4`}
                              value={source.url || ''}
                              onChange={e => handleSourceChange('url', e.target.value)}
                              className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500/50 transition outline-none font-mono" 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Embed Player Iframe Code / Direct Embed Link</label>
                            <input 
                              type="text" 
                              placeholder={`<iframe src="..."></iframe> or third-party play link`}
                              value={source.embedHtml || ''}
                              onChange={e => handleSourceChange('embedHtml', e.target.value)}
                              className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500/50 transition outline-none font-mono" 
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-zinc-300">
                        Default Fallback Stream & Player
                      </span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                        form.videoUrl || form.embedHtml ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-zinc-900 text-zinc-500'
                      }`}>
                        {form.videoUrl || form.embedHtml ? 'CONFIGURED' : 'NOT CONFIGURED'}
                      </span>
                    </div>

                    <div className="space-y-3 bg-zinc-950/40 p-3 rounded-xl border border-white/5">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Fallback Video URL</label>
                        <input 
                          type="url" 
                          placeholder="https://example.com/default-stream.mp4"
                          value={form.videoUrl || ''}
                          onChange={e => setForm({...form, videoUrl: e.target.value})}
                          className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500/50 transition outline-none font-mono" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Fallback Player HTML Embed Code</label>
                        <textarea 
                          placeholder="<iframe src='https://streaming-provider.com/ep-1' ...></iframe>"
                          value={form.embedHtml || ''}
                          onChange={e => setForm({...form, embedHtml: e.target.value})}
                          className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500/50 transition outline-none font-mono h-14 resize-none" 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Trigger Row */}
          <div className="flex gap-2.5 pt-2">
            <button 
              type="button"
              onClick={handleAddOrUpdateEpisode} 
              className={`flex-1 text-black font-black text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                editingIndex !== null 
                  ? 'bg-amber-400 hover:bg-amber-300 shadow-amber-500/10' 
                  : 'bg-cyan-400 hover:bg-cyan-300 shadow-cyan-500/10'
              }`}
            >
              {editingIndex !== null ? (
                <>
                  <CheckCircle2 size={16} /> Update Episode Spec
                </>
              ) : (
                <>
                  <PlusCircle size={16} /> Append Episode to Catalogue
                </>
              )}
            </button>
            
            {editingIndex === null && episodes.length > 0 && (
              <button
                type="button"
                onClick={resetFormState}
                className="bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-400 hover:text-white px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition duration-300"
              >
                Clear Form
              </button>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: PLAYLIST SCROLLER & REORDER (5 Columns) */}
        <div className="lg:col-span-5 bg-zinc-950/60 border border-white/5 rounded-2xl p-6 flex flex-col h-[560px]">
          <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-200 flex items-center gap-2">
              <Film size={14} className="text-cyan-400" /> 
              <span>Active Playlist</span>
            </h3>
            <span className="text-[10px] font-black bg-purple-500/15 text-purple-300 border border-purple-500/25 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {episodes.length} Episodes
            </span>
          </div>

          {episodes.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-black/25 rounded-xl border border-dashed border-white/5">
              <Film size={36} className="text-zinc-700 mb-3 animate-bounce" />
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">No Episodes Configured</p>
              <p className="text-[10px] text-zinc-600 mt-1 max-w-[200px] leading-relaxed">
                Use the Episode Builder to append individual entries, or click "Auto-Generate" to populate instantly!
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 max-h-[460px] custom-scrollbar">
              {episodes.map((ep, idx) => {
                const isSelected = editingIndex === idx;
                const badges = getLanguageBadges(ep);

                return (
                  <div 
                    key={ep.id || idx} 
                    className={`p-3.5 rounded-xl border transition-all duration-300 flex items-center gap-3 group relative overflow-hidden ${
                      isSelected 
                        ? 'bg-cyan-950/20 border-cyan-500/40 shadow-inner shadow-cyan-500/5' 
                        : 'bg-black border-white/5 hover:border-zinc-800'
                    }`}
                  >
                    {/* Active highlight side-beam */}
                    {isSelected && (
                      <div className="absolute top-0 bottom-0 left-0 w-1 bg-cyan-400" />
                    )}

                    {/* Left block: index/num */}
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-[10px] font-black tracking-wider px-2 py-1 rounded ${
                        isSelected ? 'bg-cyan-500 text-black font-black' : 'bg-zinc-900 text-zinc-400'
                      }`}>
                        EP {ep.number}
                      </span>
                      
                      {/* Micro reordering widget */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition duration-300">
                        <button 
                          type="button"
                          onClick={() => moveEpisode(idx, 'up')}
                          disabled={idx === 0}
                          className={`p-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer ${idx === 0 ? 'opacity-30 pointer-events-none' : ''}`}
                        >
                          <ArrowUp size={10} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => moveEpisode(idx, 'down')}
                          disabled={idx === episodes.length - 1}
                          className={`p-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer ${idx === episodes.length - 1 ? 'opacity-30 pointer-events-none' : ''}`}
                        >
                          <ArrowDown size={10} />
                        </button>
                      </div>
                    </div>

                    {/* Central block: Text metadata */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate transition duration-300 ${isSelected ? 'text-cyan-400' : 'text-white'}`}>
                        {ep.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-[9px] text-zinc-500 font-bold font-mono uppercase tracking-wider">{ep.duration}</span>
                        
                        {/* Audio/Video language tags */}
                        {badges.length > 0 && (
                          <div className="flex gap-1 items-center">
                            <span className="text-[8px] text-zinc-600 font-black">|</span>
                            {badges.map((b, bIdx) => (
                              <span 
                                key={bIdx} 
                                className={`text-[7px] font-black px-1.5 py-0.25 border rounded uppercase ${b.color} ${b.bg}`}
                              >
                                {b.lang}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right block: edit/remove controls */}
                    <div className="flex items-center gap-1.5 ml-2">
                      <button 
                        type="button"
                        onClick={() => handleEdit(idx)} 
                        className={`p-2 rounded-lg transition-all duration-300 hover:scale-105 cursor-pointer ${
                          isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-500 hover:text-cyan-400 hover:bg-white/5'
                        }`}
                        title="Edit Details"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDeleteEpisode(idx)} 
                        className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-white/5 transition-all duration-300 hover:scale-105 cursor-pointer"
                        title="Delete Episode"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER CONTROLS */}
      <div className="flex justify-end items-center gap-3 mt-6 pt-6 border-t border-white/5 relative z-10">
        <button 
          type="button"
          onClick={onCancel} 
          className="text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition duration-300"
        >
          Discard
        </button>
        <button 
          type="button"
          onClick={onSave} 
          className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-black px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-cyan-500/10 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
        >
          <Save size={14} /> Commit Changes & Save
        </button>
      </div>
    </div>
  );
}
