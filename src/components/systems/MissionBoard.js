import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, CheckCircle2, Clock, AlertCircle, PlayCircle, Plus, ChevronRight, Activity, Zap } from 'lucide-react';
import { ComponentShell, ComponentHeader, ComponentStatusBar, ComponentEmptyState, ComponentActionButton, ComponentMetricCard } from './ComponentShell';
import { useZaireOS } from '../../engine/ZaireOSContext';

// SVG Progress Ring
function ProgressRing({ progress = 0, size = 36, stroke = 3, color = '#10b981' }) {
  const r = (size - stroke * 2) / 2;
  const circ = r * 2 * Math.PI;
  const offset = circ - (progress / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a1a1a" strokeWidth={stroke} />
      <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={`${circ} ${circ}`}
        initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: 'easeOut' }} />
    </svg>
  );
}

function MissionCard({ mission, onClick }) {
  const stateConfig = {
    running: { color: '#10b981', label: 'RUNNING', icon: PlayCircle },
    waiting: { color: '#f59e0b', label: 'IDLE', icon: Clock },
    todo:    { color: '#555',    label: 'QUEUED', icon: Clock },
    done:    { color: '#3b82f6', label: 'DONE',   icon: CheckCircle2 },
    error:   { color: '#ef4444', label: 'BLOCKED', icon: AlertCircle },
  };
  const cfg = stateConfig[mission.status] || stateConfig.todo;
  const Icon = cfg.icon;

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`bg-[#000] border rounded-lg p-3 cursor-pointer group transition-all hover:border-[#333] ${
        mission.status === 'done' ? 'border-[#111] opacity-50' : 'border-[#1a1a1a]'
      }`}>
      <div className="flex items-start gap-3">
        {/* Progress Ring */}
        <div className="relative shrink-0 flex items-center justify-center">
          <ProgressRing progress={mission.progress || 0} size={36} color={cfg.color} />
          <div className="absolute inset-0 flex items-center justify-center">
            {mission.status === 'done'
              ? <CheckCircle2 size={12} className="text-[#3b82f6]" />
              : <span className="text-[8px] font-mono text-[#888]">{mission.progress || 0}%</span>
            }
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <span className={`text-[12px] font-medium leading-snug ${mission.status === 'done' ? 'line-through text-[#555]' : 'text-[#ededed]'}`}>
              {mission.title}
            </span>
            <div className="flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded border text-[8px] font-mono"
              style={{ color: cfg.color, borderColor: `${cfg.color}30`, background: `${cfg.color}08` }}>
              <Icon size={8} /> {cfg.label}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[9px] text-[#666] font-mono">AGT: {mission.agent || '—'}</span>
            <span className="text-[9px] font-mono" style={{ color: mission.priority === 'Critical' ? '#ef4444' : mission.priority === 'High' ? '#f59e0b' : '#555' }}>
              ● {mission.priority || 'Normal'}
            </span>
            {mission.eta && <span className="text-[9px] text-[#555] font-mono">ETA: {mission.eta}</span>}
          </div>

          {/* Progress bar */}
          {mission.status === 'running' && (
            <div className="mt-2 h-[2px] bg-[#111] rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full bg-[#10b981]"
                initial={{ width: 0 }} animate={{ width: `${mission.progress || 0}%` }}
                transition={{ duration: 1, ease: 'linear' }} />
            </div>
          )}
        </div>
        <ChevronRight size={12} className="text-[#333] group-hover:text-[#666] shrink-0 mt-1 transition-colors" />
      </div>
    </motion.div>
  );
}

export default function MissionBoard({ accent = '#10b981' }) {
  const [activeTab, setActiveTab] = useState('active');
  const [selected, setSelected] = useState(null);
  const { missions, dispatchCommand } = useZaireOS();

  const tabs = [
    { id: 'active', label: 'Active', filter: m => m.status === 'running' || m.status === 'waiting' },
    { id: 'backlog', label: 'Backlog', filter: m => m.status === 'todo' },
    { id: 'done', label: 'Completed', filter: m => m.status === 'done' },
  ];
  const currentTab = tabs.find(t => t.id === activeTab);
  const visible = missions.filter(currentTab.filter);
  const running = missions.filter(m => m.status === 'running');
  const avgProgress = running.length ? Math.round(running.reduce((s, m) => s + (m.progress || 0), 0) / running.length) : 0;
  const status = running.length > 0 ? 'active' : 'idle';

  return (
    <ComponentShell accent={accent} state={status}>
      <ComponentHeader title="Mission Board" icon={Target} status={status} accent={accent}
        subtitle={`${running.length} active · ${missions.filter(m => m.status === 'done').length} complete`} />

      {/* Metric Bar */}
      <div className="grid grid-cols-3 gap-px bg-[#1a1a1a] border-b border-[#1a1a1a] shrink-0">
        {[
          { label: 'Active', value: running.length, color: '#10b981' },
          { label: 'Progress', value: `${avgProgress}%`, color: accent },
          { label: 'Blocked', value: missions.filter(m => m.status === 'error').length, color: '#ef4444' },
        ].map(m => (
          <div key={m.label} className="bg-[#000] px-4 py-2.5 flex flex-col gap-0.5">
            <span className="text-[8px] font-mono text-[#555] uppercase tracking-widest">{m.label}</span>
            <span className="text-[16px] font-bold font-mono" style={{ color: m.color }}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1a1a1a] bg-[#000] shrink-0">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2 text-[10px] font-medium tracking-wide transition-colors border-b-[1px] ${
              activeTab === t.id ? 'text-[#ededed] border-[#ededed]' : 'text-[#555] border-transparent hover:text-[#888]'
            }`}>
            {t.label}
            <span className="ml-1.5 text-[8px] font-mono opacity-60">
              ({missions.filter(t.filter).length})
            </span>
          </button>
        ))}
      </div>

      {/* Mission List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-0">
        {visible.length === 0 ? (
          <ComponentEmptyState icon={Target} title="No missions in this pipeline"
            description="Dispatch a command to create a new mission automatically."
            accent={accent} />
        ) : (
          <AnimatePresence>
            {visible.map(m => (
              <MissionCard key={m.id} mission={m} onClick={() => setSelected(selected === m.id ? null : m.id)} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Quick add */}
      <div className="p-3 border-t border-[#1a1a1a] bg-[#000] shrink-0 flex gap-2">
        <ComponentActionButton label="New Mission" icon={Plus} onClick={() => dispatchCommand('Create a new mission objective')} />
      </div>

      <ComponentStatusBar accent={accent} items={[
        { label: 'TOTAL', value: missions.length },
        { label: 'SWARM', value: `${running.length} assigned`, color: accent },
      ]} />
    </ComponentShell>
  );
}
