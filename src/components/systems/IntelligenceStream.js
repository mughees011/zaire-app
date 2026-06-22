import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, ShieldCheck, Brain, Bookmark, Share2, ChevronDown } from 'lucide-react';
import { ComponentShell, ComponentHeader, ComponentStatusBar, ComponentEmptyState, ComponentActionButton } from './ComponentShell';

const CATEGORIES = ['All', 'AI', 'Market', 'Security', 'Research'];

const MOCK_INTEL = [
  { id: 1, priority: 'CRITICAL', category: 'AI', title: 'OpenAI GPT-5 weights leak rumor on underground forums', summary: 'Multiple sources corroborate partial model weights appearing on private Telegram channels. Systemic market shift expected.', action: 'Monitor Anthropic and Google response', confidence: 41, reliability: 62, importance: 9, source: 'Alpha Scrape', time: '14m ago', saved: false },
  { id: 2, priority: 'HIGH', category: 'Market', title: 'Cursor released aggressive new pricing — potential threat to ZAIRE Developer tier', summary: 'Cursor has dropped their pro plan to $15/mo with unlimited completions. Direct competitive pressure.', action: 'Brief pricing team for counter-strategy', confidence: 92, reliability: 95, importance: 8, source: 'HackerNews API', time: '2m ago', saved: false },
  { id: 3, priority: 'NORMAL', category: 'AI', title: 'New open-source vector database achieves sub-ms latency', summary: 'Could reduce Memory Vault query time by up to 40% if integrated. MIT licensed.', action: 'Add to engineering backlog for evaluation', confidence: 88, reliability: 91, importance: 6, source: 'GitHub Trending', time: '1h ago', saved: false },
];

const PRIORITY_COLORS = { CRITICAL: '#ef4444', HIGH: '#f59e0b', NORMAL: '#3b82f6' };

export default function IntelligenceStream({ accent = '#3b82f6' }) {
  const [items, setItems] = useState(MOCK_INTEL);
  const [category, setCategory] = useState('All');
  const [expanded, setExpanded] = useState(null);

  const toggleSave = (id) => setItems(prev => prev.map(i => i.id === id ? { ...i, saved: !i.saved } : i));

  const filtered = items.filter(i => category === 'All' || i.category === category);

  return (
    <ComponentShell accent={accent} state="active">
      <ComponentHeader title="Intelligence Stream" icon={Radio} status="active" accent={accent}
        subtitle={`${items.length} signals · live radar`} />

      {/* Category filter */}
      <div className="flex gap-1 px-3 py-2 border-b border-[#1a1a1a] bg-[#000] overflow-x-auto shrink-0">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-2.5 py-1 rounded text-[9px] font-mono whitespace-nowrap transition-colors shrink-0 ${category === c ? 'bg-[#141414] border border-[#333] text-[#ededed]' : 'text-[#555] hover:text-[#888]'}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-0">
        {filtered.length === 0 ? (
          <ComponentEmptyState icon={Radio} title="No signals in this category" accent={accent} />
        ) : (
          <AnimatePresence>
            {filtered.map(item => {
              const color = PRIORITY_COLORS[item.priority] || '#888';
              const isExpanded = expanded === item.id;
              return (
                <motion.div key={item.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-[#000] border border-[#1a1a1a] rounded-lg overflow-hidden hover:border-[#2a2a2a] transition-colors">
                  {/* Card Header — always visible */}
                  <div className="p-3 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : item.id)}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[8px] font-mono font-bold tracking-widest px-1.5 py-0.5 rounded"
                          style={{ color, background: `${color}10` }}>{item.priority}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#111] border border-[#1a1a1a] font-mono text-[#666]">
                          {item.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] text-[#555] font-mono">{item.time}</span>
                        <ChevronDown size={12} className={`text-[#555] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    <div className="text-[12px] font-medium text-[#ededed] leading-snug mb-2">{item.title}</div>

                    {/* Quick metrics row */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] font-mono text-[#555]">CONFIDENCE</span>
                        <div className="w-16 h-[2px] bg-[#111] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${item.confidence}%`, background: color }} />
                        </div>
                        <span className="text-[8px] font-mono" style={{ color }}>{item.confidence}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ShieldCheck size={9} className="text-[#555]" />
                        <span className="text-[8px] font-mono text-[#666]">Src: {item.reliability}%</span>
                      </div>
                      <div className="ml-auto flex items-center gap-1">
                        <span className="text-[8px] text-[#555]">IMP:</span>
                        <span className="text-[9px] font-bold font-mono" style={{ color: item.importance >= 8 ? '#ef4444' : item.importance >= 6 ? '#f59e0b' : '#888' }}>
                          {item.importance}/10
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        className="overflow-hidden border-t border-[#1a1a1a]">
                        <div className="p-3 flex flex-col gap-3">
                          {/* Summary */}
                          <div className="text-[11px] text-[#888] leading-relaxed">{item.summary}</div>

                          {/* Recommended action */}
                          <div className="flex items-start gap-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded p-2">
                            <Brain size={11} style={{ color: accent }} className="shrink-0 mt-0.5" />
                            <div>
                              <div className="text-[8px] font-mono text-[#555] uppercase tracking-widest mb-0.5">AI Recommendation</div>
                              <div className="text-[10px] text-[#ededed]">{item.action}</div>
                            </div>
                          </div>

                          <div className="text-[8px] font-mono text-[#555]">Source: {item.source}</div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <ComponentActionButton label={item.saved ? 'Saved' : 'Save to Memory'} icon={Bookmark} size="xs"
                              variant={item.saved ? 'success' : 'default'} onClick={() => toggleSave(item.id)} />
                            <ComponentActionButton label="Send to Swarm" icon={Share2} size="xs" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <ComponentStatusBar accent={accent} items={[
        { label: 'SIGNALS', value: filtered.length },
        { label: 'SAVED', value: items.filter(i => i.saved).length, color: '#10b981' },
        { label: 'RADAR', value: 'LIVE', color: accent },
      ]} />
    </ComponentShell>
  );
}
