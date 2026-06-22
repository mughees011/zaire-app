import React, { useState, useRef, useEffect } from 'react';
import { Terminal, AlertTriangle, RefreshCw } from 'lucide-react';
import { ComponentShell, ComponentHeader, ComponentStatusBar, ComponentEmptyState, ComponentActionButton } from './ComponentShell';
import { useZaireOS } from '../../engine/ZaireOSContext';

const LOG_TYPE_STYLE = {
  operator: { color: '#00d4ff', prefix: '$', label: 'CMD' },
  system:   { color: '#a0a0a0', prefix: '>', label: 'SYS' },
  success:  { color: '#10b981', prefix: '✓', label: 'OK' },
  error:    { color: '#ef4444', prefix: '✕', label: 'ERR' },
  warn:     { color: '#f59e0b', prefix: '!', label: 'WRN' },
};

export default function TacticalTerminal({ accent = '#10b981' }) {
  const [input, setInput] = useState('');
  const [proMode, setProMode] = useState(false);
  const { commandLogs, dispatchCommand } = useZaireOS();
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [commandLogs]);

  const handleCommand = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      dispatchCommand(input);
      setInput('');
    }
  };

  // Build human-readable version of logs
  const humanLog = (log) => {
    if (log.sender === 'operator') return { text: `Running: "${log.text}"`, type: 'operator' };
    if (log.text.includes('complete') || log.text.includes('Complete')) return { text: log.text, type: 'success' };
    if (log.text.includes('error') || log.text.includes('Error')) return { text: log.text, type: 'error' };
    return { text: log.text, type: 'system' };
  };

  const hasErrors = commandLogs.some(l => l.text?.toLowerCase().includes('error'));
  const status = hasErrors ? 'warning' : commandLogs.length > 0 ? 'active' : 'idle';

  return (
    <ComponentShell accent={accent} state={status}>
      <ComponentHeader title="Execution Console" icon={Terminal} status={status} accent={accent}
        subtitle={proMode ? 'Advanced terminal mode' : 'Human-readable output'}
        actions={
          <button onClick={() => setProMode(!proMode)}
            className="text-[9px] font-mono px-2 py-1 rounded border border-[#222] bg-[#111] text-[#888] hover:text-[#ededed] transition-colors">
            {proMode ? 'Simple View' : 'Raw Terminal'}
          </button>
        } />

      {/* Status summary bar — non-pro mode */}
      {!proMode && (
        <div className="px-4 py-2.5 border-b border-[#1a1a1a] bg-[#050505] flex items-center gap-4 shrink-0">
          {[
            { label: 'Commands Run', value: commandLogs.filter(l => l.sender === 'operator').length, color: accent },
            { label: 'Responses', value: commandLogs.filter(l => l.sender === 'system').length, color: '#ededed' },
            { label: 'Errors', value: commandLogs.filter(l => l.text?.toLowerCase().includes('error')).length, color: '#ef4444' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className="text-[16px] font-bold font-mono" style={{ color: s.color }}>{s.value}</span>
              <span className="text-[9px] text-[#555]">{s.label}</span>
            </div>
          ))}
          {hasErrors && (
            <div className="ml-auto flex items-center gap-1.5">
              <AlertTriangle size={10} className="text-[#f59e0b]" />
              <span className="text-[9px] text-[#f59e0b]">Errors detected</span>
              <ComponentActionButton label="Retry" icon={RefreshCw} size="xs" variant="danger" onClick={() => {}} />
            </div>
          )}
        </div>
      )}

      {/* Log output */}
      <div ref={endRef} className="flex-1 overflow-y-auto min-h-0"
        style={{ background: '#000', padding: '12px', fontFamily: "'JetBrains Mono', monospace" }}>
        {commandLogs.length === 0 ? (
          <ComponentEmptyState icon={Terminal} title="Console Ready"
            description="Run a command from the Command Surface to see output here." accent={accent} />
        ) : proMode ? (
          // Raw terminal
          <div className="flex flex-col gap-1 text-[11px]">
            {commandLogs.map(log => {
              const cfg = LOG_TYPE_STYLE[log.sender] || LOG_TYPE_STYLE.system;
              return (
                <div key={log.id} className="flex gap-2">
                  <span className="text-[#444] shrink-0 w-16 text-right">
                    {new Date(log.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span style={{ color: cfg.color }}>{cfg.prefix}</span>
                  <span className="text-[#a0a0a0]">{log.text}</span>
                </div>
              );
            })}
          </div>
        ) : (
          // Human-readable
          <div className="flex flex-col gap-3 text-[12px]">
            {commandLogs.map(log => {
              const { text, type } = humanLog(log);
              const cfg = LOG_TYPE_STYLE[type] || LOG_TYPE_STYLE.system;
              return (
                <div key={log.id} className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded border flex items-center justify-center shrink-0 mt-0.5"
                    style={{ borderColor: `${cfg.color}30`, background: `${cfg.color}08` }}>
                    <span className="text-[9px] font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-[#ededed] leading-snug">{text}</span>
                    <span className="block text-[9px] text-[#444] mt-0.5 font-mono">
                      {new Date(log.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#1a1a1a] bg-[#000] shrink-0">
        <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded px-3 py-2 focus-within:border-[#333] transition-colors">
          <span className="font-mono text-[11px] shrink-0" style={{ color: accent }}>zaire@root:~$</span>
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={handleCommand} placeholder="Enter command..."
            className="flex-1 bg-transparent border-none outline-none font-mono text-[11px] text-[#ededed] placeholder-[#444]"
            autoComplete="off" spellCheck="false" />
        </div>
      </div>

      <ComponentStatusBar accent={accent} items={[
        { label: 'MODE', value: proMode ? 'TERMINAL' : 'SIMPLE' },
        { label: 'LOGS', value: commandLogs.length },
        { label: 'SHELL', value: 'zsh 5.9', color: accent },
      ]} />
    </ComponentShell>
  );
}
