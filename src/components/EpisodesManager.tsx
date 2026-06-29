import React, { useState } from 'react';
import { PlusCircle, Trash2, Edit2, Zap, Save, X, Film, Code, Radio } from 'lucide-react';
import { Episode } from '../types';

interface EpisodesManagerProps {
  animeTitle: string;
  episodes: Episode[];
  onUpdateEpisodes: (episodes: Episode[]) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function EpisodesManager({ animeTitle, episodes, onUpdateEpisodes, onSave, onCancel }: EpisodesManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // State for the edit form
  const [form, setForm] = useState<Episode>({ id: '', number: 1, title: '', duration: '24m', videoUrl: '' });

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setForm(episodes[index]);
  };

  const handleUpdateEpisode = () => {
    if (editingIndex === null) return;
    const updatedEpisodes = [...episodes];
    updatedEpisodes[editingIndex] = form;
    onUpdateEpisodes(updatedEpisodes);
    setEditingIndex(null);
  };

  const handleAutoGenerate = () => {
    const newEpisodes: Episode[] = Array.from({ length: 12 }, (_, i) => ({
      id: `auto-${Date.now()}-${i}`,
      number: i + 1,
      title: `Episode ${i + 1}`,
      duration: '24m',
      videoUrl: ''
    }));
    onUpdateEpisodes(newEpisodes);
  };

  return (
    <div className="bg-[#111111]/90 border border-white/5 rounded-3xl p-6 text-white">
      {/* HEADER */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Film className="text-cyan-400" /> EPISODES MANAGER
          </h2>
          <p className="text-xs text-gray-400 mt-1">Configure individual episodes for "{animeTitle}".</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleAutoGenerate} className="bg-purple-900/40 border border-purple-500/30 text-purple-300 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-purple-900/60 transition">
            <Zap size={14} /> AUTO-GENERATE 12 EPISODES
          </button>
          <button onClick={() => onUpdateEpisodes([])} className="bg-red-900/20 border border-red-900/50 text-red-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-red-900/40 transition">
            <Trash2 size={14} /> REMOVE ALL
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: EDIT PANEL */}
        <div className="bg-black/40 border border-white/5 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-black text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Edit2 size={14} className="text-cyan-400" /> EDIT EPISODE DETAILS
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Number</label>
              <input type="number" value={form.number} onChange={e => setForm({...form, number: Number(e.target.value)})} className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Duration</label>
              <input type="text" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Episode Title</label>
            <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase">General Video URL</label>
            <input type="url" value={form.videoUrl} onChange={e => setForm({...form, videoUrl: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs" placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2"><Radio size={12}/> Audio Sources</label>
            <div className="space-y-1">
              {(['Hindi', 'Japanese', 'English'] as const).map(lang => (
                <div key={lang} className="flex gap-2">
                  <span className="w-16 text-[10px] font-bold self-center">{lang}</span>
                  <input 
                    type="url" 
                    placeholder={`${lang} URL`} 
                    value={form.audioSources?.find(s => s.lang === lang)?.url || ''}
                    onChange={e => {
                      const newSources = [...(form.audioSources || [])];
                      const existingIndex = newSources.findIndex(s => s.lang === lang);
                      if (existingIndex > -1) {
                        newSources[existingIndex].url = e.target.value;
                      } else {
                        newSources.push({ lang, url: e.target.value });
                      }
                      setForm({...form, audioSources: newSources});
                    }}
                    className="flex-1 bg-black border border-white/10 rounded-lg p-2 text-xs" 
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Embed Code</label>
            <textarea value={form.embedHtml || ''} onChange={e => setForm({...form, embedHtml: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs h-16" />
          </div>
          
          <div className="flex gap-2 pt-2">
            <button onClick={handleUpdateEpisode} className="bg-cyan-500 text-black px-4 py-2 rounded-lg text-xs font-black uppercase flex-1">Update Episode</button>
            <button onClick={() => setEditingIndex(null)} className="bg-white/10 px-4 py-2 rounded-lg text-xs font-black uppercase">Cancel</button>
          </div>
        </div>

        {/* RIGHT: ACTIVE LIST */}
        <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Film size={14} className="text-cyan-400" /> ACTIVE LIST
            </h3>
            <span className="text-xs bg-purple-900/50 text-purple-200 px-2 py-0.5 rounded">{episodes.length} EPISODES</span>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {episodes.map((ep, idx) => (
              <div key={idx} className="bg-black border border-white/10 p-3 rounded-xl flex items-center gap-3">
                <span className="text-[10px] font-black text-cyan-400 bg-cyan-900/20 px-2 py-1 rounded">EP {ep.number}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{ep.title}</p>
                  <p className="text-[9px] text-gray-500">Duration: {ep.duration}</p>
                </div>
                <button onClick={() => handleEdit(idx)} className="text-gray-500 hover:text-cyan-400"><Edit2 size={14}/></button>
                <button onClick={() => {
                  const updated = episodes.filter((_, i) => i !== idx);
                  onUpdateEpisodes(updated);
                }} className="text-gray-500 hover:text-red-400"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/5">
        <button onClick={onCancel} className="text-gray-400 text-xs font-bold uppercase">Cancel</button>
        <button onClick={onSave} className="bg-purple-600 px-6 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-2"><Save size={14}/> Save Title</button>
      </div>
    </div>
  );
}
