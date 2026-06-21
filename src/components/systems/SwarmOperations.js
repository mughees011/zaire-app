import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Cpu, ShieldCheck, X, ChevronRight, Terminal, Target } from 'lucide-react';
import { ComponentShell, ComponentHeader, ComponentStatusBar, ComponentEmptyState } from './ComponentShell';
import { useZaireOS } from '../../engine/ZaireOSContext';

const ROLE_META = {
  'Code Architect': { icon: Network, color: '#3b82f6', role: 'Architecture & Code', abbr: 'CA' },
  'Executor Agent': { icon: Cpu, color: '#10b981', role: 'Execution & Deployment', abbr: 'EX' },
  'Critic Agent':   { icon: ShieldCheck, color: '#94a3b8', role: 'Review & Validation', abbr: 'CR' },
  'Planner Agent':  { icon: Target, color: '#f59e0b', role: 'Planning & Strategy', abbr: 'PL' },
};

function AgentCard({ agent, isSelected, onClick }) {
  const meta = ROLE_META[agent.id] || { icon: Network, color: '#00d4ff', role: 'General', abbr: '??' };
  const Icon = meta.icon;
  const isRunning = agent.status === 'ACTIVE' || agent.status === 'EXECUTING';

  return (
    <motion.div layout onClick={onClick}
      className={`bg-[#000] border rounded-lg p-3 cursor-pointer transition-all ${isSelected ? 'border-[#333]' : 'border-[#1a1a1a] hover:border-[#2a2a2a]'}`}>
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center border"
            style={{ background: `${meta.color}10`, borderColor: isRunning ? `${meta.color}50` : '#1a1a1a' }}>
            <Icon size={14} style={{ color: isRunning ? meta.color : '#555' }} />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#0a0a0a]"
            style={{ background: isRunning ? meta.color : '#333' }}>
            {isRunning && (
              <motion.div className="absolute inset-0 rounded-full" style={{ background: meta.color }}
                animate={{ scale: [1, 1.8], opacity: [0.6, 0] }} transition={{ duration: 1, repeat: Infinity }} />
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-[#ededed] truncate">{agent.id}</div>
          <div className="text-[9px] text-[#555] font-mono">{meta.role}</div>
          <div className="mt-0.5 text-[10px] text-[#888] truncate">{agent.objective || 'Standby'}</div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border"
            style={{ color: isRunning ? meta.color : '#555', borderColor: isRunning ? `${meta.color}30` : '#1a1a1a', background: isRunning ? `${meta.color}08` : '#111' }}>
            {agent.status}
          </span>
          <ChevronRight size={10} className={`transition-transform ${isSelected ? 'rotate-90 text-[#888]' : 'text-[#333]'}`} />
        </div>
      </div>

      <AnimatePresence>
        {isSelected && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 pt-3 border-t border-[#1a1a1a] flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2">
                {[{ label: 'TOKENS', value: `${Math.floor(Math.random()*8+2)}K` }, { label: 'LATENCY', value: `${Math.floor(Math.random()*200+80)}ms` }, { label: 'MEMORY', value: '412MB' }]
                  .map(m => (
                    <div key={m.label} className="bg-[#0a0a0a] rounded p-2 text-center">
                      <div className="text-[12px] font-mono font-bold text-[#ededed]">{m.value}</div>
                      <div className="text-[7px] font-mono text-[#555] uppercase tracking-widest">{m.label}</div>
                    </div>
                  ))}
              </div>
              <div className="bg-[#000] border border-[#1a1a1a] rounded p-2">
                <div className="text-[8px] font-mono text-[#555] uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Terminal size={8} /> stdout
                </div>
                <div className="flex flex-col gap-1 max-h-20 overflow-y-auto">
                  {(agent.thoughts || []).slice(-4).map((t, i) => (
                    <div key={i} className="text-[9px] font-mono flex gap-2">
                      <span className="text-[#444]">[{t.time}]</span>
                      <span style={{ color: meta.color }}>{t.text}</span>
                    </div>
                  ))}
                  {(!agent.thoughts || agent.thoughts.length === 0) && (
                    <span className="text-[9px] text-[#444] font-mono">No output yet</span>
                  )}
                  {isRunning && <div className="w-1.5 h-3 animate-pulse" style={{ background: meta.color }}></div>}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function SwarmOperations({ accent = '#00d4ff' }) {
  const { agents, setAgents } = useZaireOS();
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => prev.map(agent => {
        if (agent.status === 'ACTIVE' || agent.status === 'EXECUTING') {
          const thought = { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            text: `> EXEC_NODE[0x${Math.floor(Math.random() * 9000).toString(16).toUpperCase()}] OK` };
          return { ...agent, thoughts: [...(agent.thoughts || []), thought].slice(-5) };
        }
        return agent;
      }));
    }, 2500);
    return () => clearInterval(interval);
  }, [setAgents]);

  const activeCount = agents.filter(a => a.status === 'ACTIVE' || a.status === 'EXECUTING').length;
  const status = activeCount > 0 ? 'active' : 'idle';

  return (
    <ComponentShell accent={accent} state={status}>
      <ComponentHeader title="Swarm Operations" icon={Network} status={status} accent={accent}
        subtitle={`${agents.length} agents · ${activeCount} executing`} />

      <div className="px-4 py-2 border-b border-[#1a1a1a] bg-[#000] flex items-center gap-3 shrink-0">
        {agents.map(a => {
          const meta = ROLE_META[a.id] || { color: '#00d4ff', abbr: '??' };
          const running = a.status === 'ACTIVE' || a.status === 'EXECUTING';
          return (
            <div key={a.id} onClick={() => setSelectedId(a.id === selectedId ? null : a.id)}
              className="w-6 h-6 rounded border flex items-center justify-center text-[8px] font-mono font-bold cursor-pointer transition-all"
              style={{ borderColor: running ? `${meta.color}60` : '#1a1a1a', background: running ? `${meta.color}15` : '#111', color: running ? meta.color : '#444' }}>
              {meta.abbr}
            </div>
          );
        })}
        <span className="text-[9px] font-mono text-[#555]">{activeCount} processing</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-0">
        {agents.length === 0 ? (
          <ComponentEmptyState icon={Network} title="No agents in swarm"
            description="Agents appear when a mode is launched and tasks are assigned." accent={accent} />
        ) : (
          <AnimatePresence>
            {agents.map(agent => (
              <AgentCard key={agent.id} agent={agent}
                isSelected={selectedId === agent.id}
                onClick={() => setSelectedId(selectedId === agent.id ? null : agent.id)} />
            ))}
          </AnimatePresence>
        )}
      </div>

      <ComponentStatusBar accent={accent} items={[
        { label: 'EXECUTING', value: activeCount, color: activeCount > 0 ? '#10b981' : '#555' },
        { label: 'SYNC', value: '< 1ms', color: accent },
        { label: 'CLUSTER', value: 'HEALTHY', color: '#10b981' },
      ]} />
    </ComponentShell>
  );
}
