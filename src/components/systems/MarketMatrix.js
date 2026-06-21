import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown, DollarSign, Star, Plus } from 'lucide-react';
import { ComponentShell, ComponentHeader, ComponentStatusBar, ComponentActionButton } from './ComponentShell';

const INITIAL_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin',  price: 64230.00, change: +2.4, signal: 'STRONG BUY', score: 98, risk: 'Medium', vol: '42B',  watchlist: true },
  { symbol: 'ETH', name: 'Ethereum', price:  3450.12, change: -0.8, signal: 'HOLD',        score: 54, risk: 'Medium', vol: '18B',  watchlist: true },
  { symbol: 'SOL', name: 'Solana',   price:   142.80, change: +8.2, signal: 'BREAKOUT',    score: 92, risk: 'High',   vol: '6B',   watchlist: false },
  { symbol: 'NVDA', name: 'NVIDIA',  price:   128.50, change: +1.4, signal: 'ACCUMULATE',  score: 76, risk: 'Low',    vol: '92B',  watchlist: false },
];

const SIGNAL_COLORS = { 'STRONG BUY': '#10b981', 'BREAKOUT': '#00d4ff', 'ACCUMULATE': '#a78bfa', 'HOLD': '#f59e0b', 'SELL': '#ef4444' };

export default function MarketMatrix({ accent = '#00d4ff' }) {
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [filter, setFilter] = useState('All');
  const [halalOnly, setHalalOnly] = useState(false);

  // Live price flicker
  useEffect(() => {
    const interval = setInterval(() => {
      setAssets(prev => prev.map(a => ({
        ...a,
        price: parseFloat((a.price * (1 + (Math.random() - 0.5) * 0.001)).toFixed(2))
      })));
    }, 900);
    return () => clearInterval(interval);
  }, []);

  const toggleWatch = (symbol) => setAssets(prev => prev.map(a => a.symbol === symbol ? { ...a, watchlist: !a.watchlist } : a));

  const filtered = assets.filter(a => {
    if (filter === 'Watchlist') return a.watchlist;
    if (halalOnly) return a.symbol !== 'BTC'; // mock halal filter
    return true;
  });

  return (
    <ComponentShell accent={accent} state="active">
      <ComponentHeader title="Market Intelligence" icon={Activity} status="active" accent={accent}
        subtitle="Quantum-scored signal matrix"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setHalalOnly(!halalOnly)}
              className={`text-[9px] font-mono px-2 py-1 rounded border transition-colors ${halalOnly ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : 'bg-[#111] border-[#222] text-[#555] hover:text-[#888]'}`}>
              ☪ Halal
            </button>
          </div>
        } />

      {/* Filter tabs */}
      <div className="flex border-b border-[#1a1a1a] bg-[#000] shrink-0">
        {['All', 'Watchlist', 'Crypto', 'Equities'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-2 text-[10px] font-medium transition-colors border-b ${filter === f ? 'text-[#ededed] border-[#ededed]' : 'text-[#555] border-transparent hover:text-[#888]'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Asset cards */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-0">
        <AnimatePresence>
          {filtered.map(asset => {
            const isUp = asset.change >= 0;
            const signalColor = SIGNAL_COLORS[asset.signal] || '#888';
            return (
              <motion.div key={asset.symbol} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-[#000] border border-[#1a1a1a] rounded-lg p-3 relative overflow-hidden hover:border-[#2a2a2a] transition-colors">
                {/* Left accent */}
                <div className="absolute left-0 top-0 bottom-0 w-[2px]"
                  style={{ background: isUp ? '#10b981' : '#ef4444' }} />

                <div className="flex items-start justify-between pl-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-[#ededed] tracking-wide">{asset.symbol}</span>
                      <span className="text-[9px] text-[#555]">{asset.name}</span>
                      <span className="text-[8px] px-1 py-0.5 rounded bg-[#111] border border-[#1a1a1a] font-mono text-[#666]">
                        VOL {asset.vol}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <DollarSign size={12} className="text-[#555]" />
                      <span className="text-[18px] font-bold font-mono text-[#ededed] leading-none">
                        {asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1" style={{ color: isUp ? '#10b981' : '#ef4444' }}>
                      {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      <span className="text-[11px] font-bold font-mono">{isUp ? '+' : ''}{asset.change}%</span>
                    </div>
                    <button onClick={() => toggleWatch(asset.symbol)}>
                      <Star size={12} className="transition-colors" style={{ color: asset.watchlist ? '#f59e0b' : '#333', fill: asset.watchlist ? '#f59e0b' : 'none' }} />
                    </button>
                  </div>
                </div>

                {/* Signal + Risk row */}
                <div className="pl-2 flex items-center gap-3 mb-2">
                  <span className="text-[9px] font-bold font-mono tracking-widest" style={{ color: signalColor }}>
                    ● {asset.signal}
                  </span>
                  <span className="text-[8px] text-[#555]">RISK: {asset.risk}</span>
                </div>

                {/* Score bar */}
                <div className="pl-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[8px] font-mono text-[#555] uppercase tracking-widest">AI Signal Score</span>
                    <span className="text-[9px] font-mono" style={{ color: signalColor }}>{asset.score}/100</span>
                  </div>
                  <div className="h-1 bg-[#111] rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ background: signalColor }}
                      initial={{ width: 0 }} animate={{ width: `${asset.score}%` }} transition={{ duration: 1, type: 'spring' }} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <ComponentStatusBar accent={accent} items={[
        { label: 'ASSETS', value: filtered.length },
        { label: 'HALAL', value: halalOnly ? 'ON' : 'OFF', color: halalOnly ? '#10b981' : '#555' },
        { label: 'ENGINE', value: 'QUANTUM', color: accent },
      ]} />
    </ComponentShell>
  );
}
