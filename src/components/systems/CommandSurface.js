import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SquareTerminal, Send, Mic, ChevronRight, Bot, User, Sparkles } from 'lucide-react';
import { ComponentShell, ComponentHeader, ComponentStatusBar, ComponentEmptyState } from './ComponentShell';
import { useZaireOS } from '../../engine/ZaireOSContext';

const SUGGESTED_ACTIONS = [
  'Run a competitive analysis',
  'Summarize last session',
  'Build a project plan',
  'Research market trends',
];

export default function CommandSurface({ accent = '#00d4ff' }) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const { commandLogs, dispatchCommand, agents } = useZaireOS();
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const activeAgents = agents.filter(a => a.status === 'ACTIVE' || a.status === 'EXECUTING');
  const status = activeAgents.length > 0 ? 'active' : 'idle';

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [commandLogs]);

  const handleSend = (text) => {
    const cmd = (text || input).trim();
    if (!cmd) return;
    dispatchCommand(cmd);
    setInput('');
  };

  return (
    <ComponentShell accent={accent} state={status}>
      <ComponentHeader
        title="Command Surface"
        icon={SquareTerminal}
        status={status}
        accent={accent}
        subtitle={activeAgents.length > 0 ? `${activeAgents.length} agents processing` : 'Ready for directive'}
      />

      {/* Mission Context Bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[#1a1a1a] bg-[#050505] shrink-0">
        {activeAgents.map(a => (
          <div key={a.id} className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#111] border border-[#1a1a1a]">
            <motion.div className="w-1.5 h-1.5 rounded-full bg-[#10b981]"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }} />
            <span className="text-[10px] font-mono text-[#a0a0a0]">{a.id}</span>
            <span className="text-[9px] text-[#555]">processing</span>
          </div>
        ))}
        {activeAgents.length === 0 && (
          <span className="text-[10px] text-[#555] font-mono">No active agents — type a command to begin</span>
        )}
      </div>

      {/* Conversation Stream */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 min-h-0">
        {commandLogs.length === 0 ? (
          <ComponentEmptyState
            icon={Sparkles}
            title="Command Surface Ready"
            description="Type a directive or select a suggested action below to begin your mission."
            accent={accent}
          />
        ) : (
          <AnimatePresence>
            {commandLogs.map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="flex gap-3">
                <div className="shrink-0 mt-0.5">
                  {msg.sender === 'system' ? (
                    <div className="w-6 h-6 rounded bg-[#111] border border-[#1a1a1a] flex items-center justify-center">
                      <Bot size={12} style={{ color: accent }} />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded bg-[#1a1a1a] border border-[#222] flex items-center justify-center">
                      <User size={12} className="text-[#888]" />
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold" style={{ color: msg.sender === 'system' ? accent : '#888' }}>
                      {msg.sender === 'system' ? 'ZAIRE ENGINE' : 'OPERATOR'}
                    </span>
                    <span className="text-[9px] text-[#444] font-mono">
                      {new Date(msg.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {msg.sender === 'operator' ? (
                    <div className="text-[13px] text-[#ededed] leading-relaxed">{msg.text}</div>
                  ) : (
                    <div className="bg-[#050505] border border-[#1a1a1a] rounded-lg p-3 text-[12px] text-[#a0a0a0] font-mono leading-relaxed">
                      {msg.text}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggested Actions */}
      {commandLogs.length === 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-2 shrink-0">
          {SUGGESTED_ACTIONS.map(action => (
            <button key={action} onClick={() => handleSend(action)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#111] border border-[#1a1a1a] text-[10px] text-[#888] hover:text-[#ededed] hover:border-[#333] transition-all">
              <ChevronRight size={10} /> {action}
            </button>
          ))}
        </div>
      )}

      {/* Command Input */}
      <div className="p-3 border-t border-[#1a1a1a] bg-[#000] shrink-0">
        <div className="flex gap-2 items-end bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-2 focus-within:border-[#333] transition-colors">
          <textarea ref={inputRef} rows={2} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
            placeholder="Type a directive or describe an outcome..."
            className="flex-1 bg-transparent border-none outline-none resize-none text-[13px] text-[#ededed] placeholder-[#555] leading-relaxed font-sans" />
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => setIsRecording(!isRecording)}
              className={`p-1.5 rounded border transition-all ${isRecording ? 'bg-[#ef4444]/20 border-[#ef4444]/50 text-[#ef4444]' : 'bg-[#111] border-[#222] text-[#666] hover:text-[#ededed]'}`}>
              <Mic size={12} />
            </button>
            <button onClick={() => handleSend()}
              className="p-1.5 rounded border bg-[#ededed] border-[#ededed] text-[#000] hover:bg-white transition-all">
              <Send size={12} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1.5 px-1">
          <span className="text-[9px] text-[#444] font-mono">⏎ Execute · Shift+⏎ Newline</span>
          {isRecording && <span className="text-[9px] text-[#ef4444] animate-pulse font-mono">● REC</span>}
        </div>
      </div>

      <ComponentStatusBar accent={accent} items={[
        { label: 'SESSION', value: `${commandLogs.length} messages` },
        { label: 'AGENTS', value: `${activeAgents.length} active`, color: activeAgents.length > 0 ? '#10b981' : '#555' },
        { label: 'MODE', value: 'COMMAND', color: accent },
      ]} />
    </ComponentShell>
  );
}
