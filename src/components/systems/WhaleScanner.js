import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertOctagon, ArrowRight, Bell, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { ComponentShell, ComponentHeader, ComponentStatusBar, ComponentEmptyState, ComponentActionButton } from './ComponentShell';

const MOCK_ALERTS = [
  { id: 1, asset: 'BTC', amount: '12,500', value: '$803.1M', from: 'Unknown Wallet', to: 'Binance Hot', type: 'DUMP_WARNING', direction: 'out', confidence: 91, impact: 'HIGH',   time: '12s ago', signal: 'Bearish pressure expected' },
  { id: 2, asset: 'ETH', amount: '142,000', value: '$489.9M', from: 'Coinbase Prime', to: 'Cold Storage', type: 'ACCUMULATION', direction: 'in', confidence: 88, impact: 'MEDIUM', time: '4m ago', signal: 'Institutional accumulation' },
  { id: 3, asset: 'SOL', amount: '800,000', value: '$114.2M', from: 'FTX Estate',  to: 'Kraken', type: 'LIQUIDATION', direction: 'out', confidence: 95, impact: 'HIGH', time: '9m ago', signal: 'Estate forced sell' },
];

const TYPE_COLORS = { DUMP_WARNING: '#ef4444', ACCUMULATION: '#10b981', LIQUIDATION: '#f59e0b' };

export default function WhaleScanner({ accent = '#ef4444' }) {
  const [alerts] = useState(MOCK_ALERTS);
  const [alertSet, setAlertSet] = useState(new Set());

  const toggleAlert = (id) => setAlertSet(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <ComponentShell accent={accent} state="active">
      <ComponentHeader title="Whale Scanner" icon={AlertOctagon} status="warning" accent={accent}
        subtitle={`${alerts.length} large transactions detected`}
        actions={
          <div className="text-[9px] font-mono text-[accent] border border-[#ef4444]/20 bg-[#ef4444]/10 px-2 py-0.5 rounded flex items-center gap-1 text-[#ef4444]">
            <span className="w-1.5 h-1.5 bg-[#ef4444] rounded-full animate-ping"></span> DEFCON 2
          </div>
        } />

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-px bg-[#1a1a1a] border-b border-[#1a1a1a] shrink-0">
        {[
          { label: 'Detected', value: alerts.length, color: '#ef4444' },
          { label: 'High Impact', value: alerts.filter(a => a.impact === 'HIGH').length, color: '#f59e0b' },
          { label: 'Watching', value: alertSet.size, color: accent },
        ].map(m => (
          <div key={m.label} className="bg-[#000] px-4 py-2.5 flex flex-col gap-0.5">
            <span className="text-[8px] font-mono text-[#555] uppercase tracking-widest">{m.label}</span>
            <span className="text-[16px] font-bold font-mono" style={{ color: m.color }}>{m.value}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-0">
        {alerts.length === 0 ? (
          <ComponentEmptyState icon={AlertOctagon} title="No whale activity"
            description="Large transactions will appear here in real-time." accent={accent} />
        ) : (
          <AnimatePresence>
            {alerts.map(alert => {
              const color = TYPE_COLORS[alert.type] || '#888';
              return (
                <motion.div key={alert.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  className="bg-[#000] border rounded-lg p-3 relative overflow-hidden"
                  style={{ borderColor: `${color}25` }}>
                  {/* Left bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: color }} />

                  <div className="pl-2">
                    {/* Top row */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-mono font-bold tracking-widest px-1.5 py-0.5 rounded"
                        style={{ color, background: `${color}10` }}>{alert.type}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-[#555] font-mono">{alert.time}</span>
                        <span className="text-[8px] px-1 py-0.5 rounded font-mono"
                          style={{ color: alert.impact === 'HIGH' ? '#ef4444' : '#f59e0b', background: alert.impact === 'HIGH' ? '#ef444410' : '#f59e0b10' }}>
                          {alert.impact}
                        </span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-[20px] font-bold text-[#ededed] leading-none">{alert.amount}</span>
                      <span className="text-[14px] font-bold leading-none" style={{ color }}>{alert.asset}</span>
                      <span className="text-[11px] text-[#666] font-mono pb-0.5">({alert.value})</span>
                    </div>

                    {/* Flow */}
                    <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded p-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-[7px] font-mono text-[#555] uppercase mb-0.5">From</div>
                        <div className="text-[10px] font-mono text-[#ededed] truncate">{alert.from}</div>
                      </div>
                      <div className="flex flex-col items-center gap-1 shrink-0 px-1">
                        {alert.direction === 'out' ? <TrendingDown size={12} className="text-[#ef4444]" /> : <TrendingUp size={12} className="text-[#10b981]" />}
                        <ArrowRight size={10} className="text-[#444]" />
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <div className="text-[7px] font-mono text-[#555] uppercase mb-0.5">To</div>
                        <div className="text-[10px] font-mono text-[#ededed] truncate">{alert.to}</div>
                      </div>
                    </div>

                    {/* Confidence + Signal */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1 mr-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-[7px] font-mono text-[#555] uppercase tracking-widest">Confidence</span>
                          <span className="text-[8px] font-mono" style={{ color }}>{alert.confidence}%</span>
                        </div>
                        <div className="h-[2px] bg-[#111] rounded-full overflow-hidden">
                          <motion.div className="h-full" style={{ background: color }}
                            initial={{ width: 0 }} animate={{ width: `${alert.confidence}%` }} transition={{ duration: 0.8 }} />
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-[#888] italic mb-2">{alert.signal}</div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <ComponentActionButton label={alertSet.has(alert.id) ? 'Watching' : 'Set Alert'} icon={Bell} size="xs"
                        variant={alertSet.has(alert.id) ? 'success' : 'default'} onClick={() => toggleAlert(alert.id)} />
                      <ComponentActionButton label="Explorer" icon={ExternalLink} size="xs" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <ComponentStatusBar accent={accent} items={[
        { label: 'FEED', value: 'LIVE', color: '#ef4444' },
        { label: 'THRESHOLD', value: '$50M+' },
        { label: 'ALERTS', value: alertSet.size, color: alertSet.size > 0 ? '#10b981' : '#555' },
      ]} />
    </ComponentShell>
  );
}
