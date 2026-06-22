import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';

/* ─────────────────────────────────────────────
   COMPONENT ERROR BOUNDARY
   Prevents one broken component from crashing the whole mode.
───────────────────────────────────────────── */
export class ComponentErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex flex-col items-center justify-center bg-[#0a0a0a] border border-[#ef4444]/30 rounded-lg p-6 gap-3">
          <AlertTriangle size={20} className="text-[#ef4444]" />
          <div className="text-[12px] font-medium text-[#ededed]">Component Error</div>
          <div className="text-[10px] text-[#888] font-mono text-center max-w-xs">{this.state.error?.message}</div>
          <button onClick={() => this.setState({ hasError: false, error: null })}
            className="text-[10px] px-3 py-1.5 bg-[#141414] border border-[#333] rounded text-[#ededed] hover:border-[#555] transition-colors flex items-center gap-1">
            <RefreshCw size={10} /> Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─────────────────────────────────────────────
   COMPONENT HEADER
───────────────────────────────────────────── */
export function ComponentHeader({ title, icon: Icon, status = 'idle', accent = '#00d4ff', actions, subtitle }) {
  const statusColors = { idle: '#555', active: accent, loading: '#f59e0b', warning: '#f59e0b', error: '#ef4444', success: '#10b981', empty: '#555' };
  const statusLabels = { idle: 'IDLE', active: 'ACTIVE', loading: 'LOADING', warning: 'WARNING', error: 'ERROR', success: 'NOMINAL', empty: 'EMPTY' };

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a1a1a] bg-[#000] shrink-0">
      <div className="flex items-center gap-2.5">
        {Icon && <Icon size={13} style={{ color: status === 'idle' ? '#666' : statusColors[status] }} />}
        <div className="flex flex-col">
          <span className="text-[12px] font-semibold text-[#ededed] leading-none tracking-tight">{title}</span>
          {subtitle && <span className="text-[9px] text-[#555] mt-0.5 font-mono">{subtitle}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Status pill */}
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#111] border border-[#1f1f1f]">
          {status === 'loading' ? (
            <Loader2 size={7} className="animate-spin" style={{ color: statusColors[status] }} />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColors[status], boxShadow: status !== 'idle' && status !== 'empty' ? `0 0 4px ${statusColors[status]}` : 'none' }}></div>
          )}
          <span className="text-[8px] font-mono" style={{ color: statusColors[status] }}>{statusLabels[status]}</span>
        </div>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   COMPONENT STATUS BAR
───────────────────────────────────────────── */
export function ComponentStatusBar({ items = [], accent = '#00d4ff' }) {
  return (
    <div className="flex items-center gap-4 px-4 py-1.5 border-t border-[#1a1a1a] bg-[#000] shrink-0">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="text-[8px] font-mono text-[#555] uppercase tracking-widest">{item.label}:</span>
          <span className="text-[9px] font-mono" style={{ color: item.color || '#888' }}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   COMPONENT EMPTY STATE
───────────────────────────────────────────── */
export function ComponentEmptyState({ icon: Icon, title, description, action, accent = '#00d4ff' }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
      {Icon && (
        <div className="w-10 h-10 rounded-lg bg-[#111] border border-[#1f1f1f] flex items-center justify-center">
          <Icon size={18} className="text-[#555]" />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <div className="text-[13px] font-medium text-[#888]">{title}</div>
        {description && <div className="text-[11px] text-[#555] max-w-[200px] leading-relaxed">{description}</div>}
      </div>
      {action && (
        <button onClick={action.onClick}
          className="text-[10px] px-3 py-1.5 rounded border border-[#222] bg-[#111] text-[#ededed] hover:border-[#444] transition-colors mt-1"
          style={{ '--tw-ring-color': accent }}>
          {action.label}
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   COMPONENT SKELETON
───────────────────────────────────────────── */
export function ComponentSkeleton({ rows = 4 }) {
  return (
    <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-3 items-center">
          <div className="w-8 h-8 rounded bg-[#111] skeleton-pulse shrink-0"></div>
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="h-2.5 rounded skeleton-pulse" style={{ width: `${60 + Math.random() * 30}%` }}></div>
            <div className="h-2 rounded skeleton-pulse" style={{ width: `${40 + Math.random() * 40}%` }}></div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   COMPONENT ACTION BUTTON
───────────────────────────────────────────── */
export function ComponentActionButton({ label, icon: Icon, onClick, variant = 'default', size = 'sm' }) {
  const variants = {
    default: 'bg-[#141414] border-[#222] text-[#ededed] hover:border-[#444] hover:bg-[#1a1a1a]',
    primary: 'bg-[#ededed] border-[#ededed] text-[#000] hover:bg-white',
    danger: 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444]/20',
    success: 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981] hover:bg-[#10b981]/20',
  };
  const sizes = { xs: 'text-[9px] px-2 py-1', sm: 'text-[10px] px-2.5 py-1.5', md: 'text-[11px] px-3 py-2' };
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 rounded border font-medium transition-all ${variants[variant]} ${sizes[size]}`}>
      {Icon && <Icon size={size === 'xs' ? 9 : size === 'sm' ? 10 : 12} />}
      {label}
    </button>
  );
}

/* ─────────────────────────────────────────────
   COMPONENT METRIC CARD
───────────────────────────────────────────── */
export function ComponentMetricCard({ label, value, sub, color = '#ededed', trend, icon: Icon }) {
  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-3 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono text-[#555] uppercase tracking-widest">{label}</span>
        {Icon && <Icon size={10} className="text-[#444]" />}
      </div>
      <div className="text-[20px] font-bold leading-none" style={{ color }}>{value}</div>
      {sub && <div className="text-[9px] text-[#666]">{sub}</div>}
      {trend && (
        <div className={`text-[9px] font-mono ${trend.startsWith('+') ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>{trend}</div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   COMPONENT SHELL — THE OUTER WRAPPER
───────────────────────────────────────────── */
export function ComponentShell({ children, className = '', accent = '#00d4ff', state = 'idle' }) {
  const isActive = state === 'active' || state === 'loading';
  return (
    <ComponentErrorBoundary>
      <div className={`relative flex flex-col h-full overflow-hidden bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg ${className}`}
        style={{ '--component-accent': accent }}>
        {/* Scanning laser top border when active */}
        {isActive && (
          <div className="absolute top-0 left-0 right-0 h-[1px] z-20 overflow-hidden">
            <motion.div
              className="h-full w-[40%]"
              style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
              animate={{ x: ['-40%', '160%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        )}
        {/* Ambient grid background */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        </div>
        {/* Content */}
        <div className="relative z-10 flex flex-col h-full min-h-0">{children}</div>
      </div>
    </ComponentErrorBoundary>
  );
}
