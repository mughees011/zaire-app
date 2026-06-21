import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, FolderTree, FileCode2, Play, Terminal, Lightbulb, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { ComponentShell, ComponentHeader, ComponentStatusBar, ComponentActionButton } from './ComponentShell';
import { useZaireOS } from '../../engine/ZaireOSContext';

const FILES = [
  { name: 'vector_search.py', status: 'active', lang: 'Python' },
  { name: 'ZaireAgent.ts', status: 'modified', lang: 'TypeScript' },
  { name: 'types.d.ts', status: 'saved', lang: 'TypeScript' },
];

const CODE = [
  { indent: 0, tokens: [{ t: 'import', c: '#c678dd' }, { t: ' numpy ', c: '#abb2bf' }, { t: 'as', c: '#c678dd' }, { t: ' np', c: '#abb2bf' }] },
  { indent: 0, tokens: [{ t: 'from', c: '#c678dd' }, { t: ' typing ', c: '#abb2bf' }, { t: 'import', c: '#c678dd' }, { t: ' List, Dict', c: '#e5c07b' }] },
  { indent: 0, tokens: [] },
  { indent: 0, tokens: [{ t: 'class ', c: '#c678dd' }, { t: 'VectorDatabase', c: '#e5c07b' }, { t: ':', c: '#abb2bf' }] },
  { indent: 1, tokens: [{ t: 'def ', c: '#c678dd' }, { t: '__init__', c: '#61afef' }, { t: '(self, dims: ', c: '#abb2bf' }, { t: 'int', c: '#e5c07b' }, { t: ' = ', c: '#abb2bf' }, { t: '1536', c: '#d19a66' }, { t: '):', c: '#abb2bf' }] },
  { indent: 2, tokens: [{ t: 'self', c: '#e06c75' }, { t: '.dims = dims', c: '#abb2bf' }] },
  { indent: 2, tokens: [{ t: 'self', c: '#e06c75' }, { t: '.index = []', c: '#abb2bf' }] },
  { indent: 0, tokens: [] },
  { indent: 1, tokens: [{ t: 'def ', c: '#c678dd' }, { t: 'search', c: '#61afef' }, { t: '(self, query, k=', c: '#abb2bf' }, { t: '5', c: '#d19a66' }, { t: '):', c: '#abb2bf' }] },
  { indent: 2, tokens: [{ t: '# Cosine similarity search', c: '#5c6370' }] },
  { indent: 2, tokens: [{ t: 'return', c: '#c678dd' }, { t: ' self._compute(query, k)', c: '#abb2bf' }] },
];

const TABS = ['Editor', 'Architecture', 'Terminal', 'Tests'];

export default function CodeStudio({ accent = '#3b82f6' }) {
  const [activeTab, setActiveTab] = useState('Editor');
  const [proMode, setProMode] = useState(false);
  const [activeFile, setActiveFile] = useState('vector_search.py');
  const { agents } = useZaireOS();
  const architect = agents.find(a => a.id === 'Code Architect');
  const isActive = architect?.status === 'ACTIVE' || architect?.status === 'EXECUTING';
  const status = isActive ? 'active' : 'idle';

  return (
    <ComponentShell accent={accent} state={status}>
      <ComponentHeader title="Engineering Studio" icon={Code2} status={status} accent={accent}
        subtitle={activeFile}
        actions={
          <button onClick={() => setProMode(!proMode)}
            className="flex items-center gap-1 text-[9px] font-mono px-2 py-1 rounded border border-[#222] bg-[#111] text-[#888] hover:text-[#ededed] transition-colors">
            {proMode ? <><EyeOff size={9} /> Beginner</> : <><Eye size={9} /> Pro Mode</>}
          </button>
        } />

      {/* Tabs */}
      <div className="flex border-b border-[#1a1a1a] bg-[#000] shrink-0">
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-[10px] font-medium transition-colors border-b ${activeTab === t ? 'text-[#ededed] border-[#ededed]' : 'text-[#555] border-transparent hover:text-[#888]'}`}>
            {t}
          </button>
        ))}
        <div className="ml-auto flex items-center px-3">
          <ComponentActionButton label="Run" icon={Play} variant="success" size="xs" />
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* File Tree */}
        <div className="w-36 border-r border-[#1a1a1a] bg-[#050505] flex flex-col shrink-0">
          <div className="px-3 py-2 flex items-center gap-1.5 border-b border-[#1a1a1a]">
            <FolderTree size={10} className="text-[#555]" />
            <span className="text-[9px] font-mono text-[#555] uppercase tracking-widest">Workspace</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
            {FILES.map(f => (
              <div key={f.name} onClick={() => setActiveFile(f.name)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${f.name === activeFile ? 'bg-[#141414] border border-[#222]' : 'hover:bg-[#0a0a0a]'}`}>
                <FileCode2 size={10} style={{ color: f.name === activeFile ? accent : '#555' }} />
                <span className="text-[9px] font-mono truncate" style={{ color: f.name === activeFile ? '#ededed' : '#888' }}>{f.name}</span>
                {f.status === 'modified' && <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] ml-auto shrink-0"></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {activeTab === 'Editor' && (
            <>
              {/* AI Suggestion Banner */}
              {isActive && (
                <div className="px-3 py-2 border-b border-[#1a1a1a] bg-[#050505] flex items-center gap-2 shrink-0">
                  <Lightbulb size={10} style={{ color: accent }} />
                  <span className="text-[10px] text-[#888]">AI is analyzing this file...</span>
                  <motion.div className="h-[1px] flex-1 overflow-hidden">
                    <motion.div className="h-full w-1/3" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
                      animate={{ x: ['-100%', '400%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} />
                  </motion.div>
                </div>
              )}

              {/* Non-coder summary */}
              {!proMode && (
                <div className="px-3 py-2.5 border-b border-[#1a1a1a] bg-[#050505] shrink-0">
                  <div className="text-[10px] text-[#888] leading-relaxed">
                    <span className="font-semibold text-[#ededed]">What this does:</span> This file creates a database that stores information as mathematical vectors, enabling fast similarity search across large amounts of data.
                  </div>
                </div>
              )}

              {/* Code editor */}
              <div className="flex-1 overflow-y-auto p-3 bg-[#000] font-mono text-[11px] leading-relaxed min-h-0"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {CODE.map((line, i) => (
                  <div key={i} className="flex hover:bg-[#0a0a0a] rounded px-1">
                    <span className="text-[#333] w-6 shrink-0 select-none text-right mr-3">{i + 1}</span>
                    <span style={{ paddingLeft: `${line.indent * 16}px` }}>
                      {line.tokens.map((tok, j) => (
                        <span key={j} style={{ color: tok.c }}>{tok.t}</span>
                      ))}
                    </span>
                  </div>
                ))}
                {isActive && <div className="w-2 h-3 mt-1 ml-7 animate-pulse" style={{ background: accent }}></div>}
              </div>
            </>
          )}

          {activeTab === 'Terminal' && (
            <div className="flex-1 p-3 bg-[#000] font-mono text-[10px] overflow-y-auto"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <div style={{ color: accent }}>$ python vector_search.py</div>
              {isActive ? (
                <>
                  <div className="text-[#a0a0a0]">Initializing VectorDatabase...</div>
                  <div className="text-[#10b981]">[OK] Dimensions: 1536</div>
                  <div className="animate-pulse" style={{ color: accent }}>_</div>
                </>
              ) : <div className="text-[#555]">Ready. Press Run to execute.</div>}
            </div>
          )}

          {activeTab === 'Tests' && (
            <div className="flex-1 p-3 flex flex-col gap-2 overflow-y-auto bg-[#000]">
              {[{ name: 'test_init_dimensions', pass: true }, { name: 'test_search_similarity', pass: true }, { name: 'test_empty_query', pass: false }].map(t => (
                <div key={t.name} className="flex items-center gap-3 px-3 py-2 rounded border border-[#1a1a1a] bg-[#0a0a0a]">
                  <CheckCircle2 size={12} style={{ color: t.pass ? '#10b981' : '#ef4444' }} />
                  <span className="text-[11px] font-mono" style={{ color: t.pass ? '#a0a0a0' : '#ef4444' }}>{t.name}</span>
                  <span className="ml-auto text-[9px] font-mono" style={{ color: t.pass ? '#10b981' : '#ef4444' }}>{t.pass ? 'PASS' : 'FAIL'}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Architecture' && (
            <div className="flex-1 flex items-center justify-center bg-[#000] p-4">
              <div className="text-center text-[#555]">
                <Code2 size={24} className="mx-auto mb-2 opacity-30" />
                <div className="text-[11px]">Architecture diagram — coming soon</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ComponentStatusBar accent={accent} items={[
        { label: 'FILE', value: activeFile },
        { label: 'LANG', value: FILES.find(f => f.name === activeFile)?.lang || 'Unknown' },
        { label: 'AI', value: isActive ? 'Analyzing' : 'Idle', color: isActive ? accent : '#555' },
      ]} />
    </ComponentShell>
  );
}
