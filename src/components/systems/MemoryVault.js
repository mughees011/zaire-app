import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Search, Cpu, Box, Trash2, Download, Tag, Star } from 'lucide-react';
import { ComponentShell, ComponentHeader, ComponentStatusBar, ComponentEmptyState, ComponentActionButton } from './ComponentShell';

const MOCK_MEMORIES = [
  { id: 1, type: 'semantic', title: 'React Architecture Patterns', tokens: 1420, importance: 98, tags: ['code', 'architecture'], time: '2h ago', scope: 'Project' },
  { id: 2, type: 'code',     title: 'ZaireOSContext State Sync',  tokens: 840,  importance: 87, tags: ['state', 'context'],  time: '1h ago', scope: 'Session' },
  { id: 3, type: 'pref',    title: 'Operator prefers dark themes', tokens: 120, importance: 72, tags: ['preference'],         time: '1d ago', scope: 'User' },
  { id: 4, type: 'semantic', title: 'Vector DB embedding specs',   tokens: 390,  importance: 91, tags: ['ai', 'memory'],      time: '30m ago', scope: 'Project' },
];

const TYPE_META = {
  semantic: { color: '#a78bfa', label: 'Semantic' },
  code:     { color: '#00d4ff', label: 'Code' },
  pref:     { color: '#10b981', label: 'Preference' },
};

const SCOPE_TABS = ['All', 'Project', 'Session', 'User'];

export default function MemoryVault({ accent = '#a78bfa' }) {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('All');
  const [memories, setMemories] = useState(MOCK_MEMORIES);

  const filtered = memories.filter(m =>
    (scope === 'All' || m.scope === scope) &&
    (query === '' || m.title.toLowerCase().includes(query.toLowerCase()) || m.tags.some(t => t.includes(query)))
  );

  const deleteMemory = (id) => setMemories(prev => prev.filter(m => m.id !== id));
  const totalTokens = memories.reduce((s, m) => s + m.tokens, 0);

  return (
    <ComponentShell accent={accent} state="idle">
      <ComponentHeader title="Neural Memory" icon={Database} status="active" accent={accent}
        subtitle={`${memories.length} entries · ${(totalTokens / 1000).toFixed(1)}K tokens`}
        actions={<ComponentActionButton label="Export" icon={Download} size="xs" />} />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-px bg-[#1a1a1a] border-b border-[#1a1a1a] shrink-0">
        {[
          { label: 'Entries', value: memories.length, color: accent },
          { label: 'Tokens', value: `${(totalTokens/1000).toFixed(1)}K`, color: '#ededed' },
          { label: 'Avg Score', value: `${Math.round(memories.reduce((s,m)=>s+m.importance,0)/memories.length)}%`, color: '#10b981' },
        ].map(m => (
          <div key={m.label} className="bg-[#000] px-4 py-2.5 flex flex-col gap-0.5">
            <span className="text-[8px] font-mono text-[#555] uppercase tracking-widest">{m.label}</span>
            <span className="text-[16px] font-bold font-mono" style={{ color: m.color }}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="p-3 border-b border-[#1a1a1a] bg-[#000] shrink-0">
        <div className="flex items-center bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-3 py-2 focus-within:border-[#333] transition-colors">
          <Search size={12} className="text-[#555] mr-2" />
          <input type="text" placeholder="Search memory space..." value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-[12px] text-[#ededed] placeholder-[#555]" />
        </div>
      </div>

      {/* Scope Tabs */}
      <div className="flex border-b border-[#1a1a1a] bg-[#000] shrink-0">
        {SCOPE_TABS.map(s => (
          <button key={s} onClick={() => setScope(s)}
            className={`flex-1 py-1.5 text-[10px] font-medium transition-colors border-b ${scope === s ? 'text-[#ededed] border-[#ededed]' : 'text-[#555] border-transparent hover:text-[#888]'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Memory List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-0">
        {filtered.length === 0 ? (
          <ComponentEmptyState icon={Database} title="No memories found"
            description="Memories are created automatically as you interact with ZAIRE." accent={accent} />
        ) : (
          <AnimatePresence>
            {filtered.map(mem => {
              const typeMeta = TYPE_META[mem.type] || { color: accent, label: 'Memory' };
              return (
                <motion.div key={mem.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#000] border border-[#1a1a1a] rounded-lg p-3 group hover:border-[#2a2a2a] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg border border-[#1a1a1a] flex items-center justify-center shrink-0"
                      style={{ background: `${typeMeta.color}10` }}>
                      {mem.type === 'semantic' ? <Cpu size={12} style={{ color: typeMeta.color }} /> :
                       mem.type === 'code' ? <Box size={12} style={{ color: typeMeta.color }} /> :
                       <Star size={12} style={{ color: typeMeta.color }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-[#ededed] mb-1 truncate">{mem.title}</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[8px] px-1 py-0.5 rounded font-mono"
                          style={{ color: typeMeta.color, background: `${typeMeta.color}10` }}>{typeMeta.label}</span>
                        <span className="text-[8px] text-[#555] font-mono">{mem.scope}</span>
                        <span className="text-[8px] text-[#555]">{mem.tokens} tokens · {mem.time}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {mem.tags.map(tag => (
                          <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded bg-[#111] border border-[#1f1f1f] text-[#666] flex items-center gap-0.5">
                            <Tag size={7} /> {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="text-[10px] font-bold font-mono" style={{ color: mem.importance > 85 ? '#10b981' : '#f59e0b' }}>
                        {mem.importance}%
                      </div>
                      <button onClick={() => deleteMemory(mem.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded border border-[#ef4444]/20 text-[#ef4444] hover:bg-[#ef4444]/10 transition-all">
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                  {/* Importance bar */}
                  <div className="mt-2 h-[1px] bg-[#111] rounded-full overflow-hidden">
                    <motion.div className="h-full" style={{ background: mem.importance > 85 ? '#10b981' : '#f59e0b' }}
                      initial={{ width: 0 }} animate={{ width: `${mem.importance}%` }} transition={{ duration: 0.8 }} />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <ComponentStatusBar accent={accent} items={[
        { label: 'SCOPE', value: scope },
        { label: 'VECTOR DIM', value: '1536', color: accent },
        { label: 'INDEX', value: 'SYNCED', color: '#10b981' },
      ]} />
    </ComponentShell>
  );
}
