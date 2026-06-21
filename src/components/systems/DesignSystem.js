import React from 'react';
import './DesignSystem.css';

/* ─────────────────────────────────────────────
   DESIGN SYSTEM — PRIMITIVE COMPONENTS
   All ZAIRE panels use these building blocks.
───────────────────────────────────────────── */

export function ZaireCard({ children, className = '', noPadding = false }) {
  return (
    <div className={`flex flex-col h-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg overflow-hidden ${noPadding ? '' : 'p-4'} ${className}`}>
      {children}
    </div>
  );
}

export function ZaireHeader({ title, icon: Icon, rightElement, subtitle }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a1a1a] bg-[#000] shrink-0">
      <div className="flex items-center gap-2.5">
        {Icon && <Icon size={13} className="text-[#666]" />}
        <div>
          <div className="text-[12px] font-semibold text-[#ededed] tracking-tight">{title}</div>
          {subtitle && <div className="text-[9px] text-[#555] font-mono mt-0.5">{subtitle}</div>}
        </div>
      </div>
      {rightElement && <div className="flex items-center gap-2">{rightElement}</div>}
    </div>
  );
}

export function ZaireBadge({ children, variant = 'default', dot = false }) {
  const variants = {
    default: 'bg-[#141414] text-[#888] border-[#222]',
    success: 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20',
    warning: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20',
    danger:  'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20',
    info:    'bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/20',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${variants[variant]}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />}
      {children}
    </span>
  );
}

export function ZaireInput({ value, onChange, placeholder, icon: Icon }) {
  return (
    <div className="flex items-center bg-[#000] border border-[#1a1a1a] rounded-lg px-3 py-2 focus-within:border-[#333] transition-colors">
      {Icon && <Icon size={12} className="text-[#555] mr-2 shrink-0" />}
      <input value={value} onChange={onChange} placeholder={placeholder}
        className="flex-1 bg-transparent border-none outline-none text-[12px] text-[#ededed] placeholder-[#555]" />
    </div>
  );
}

export function ZaireTabs({ tabs = [], activeTab, onChange }) {
  return (
    <div className="flex border-b border-[#1a1a1a] bg-[#000] shrink-0">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`px-4 py-2 text-[10px] font-medium transition-colors border-b ${activeTab === t.id ? 'text-[#ededed] border-[#ededed]' : 'text-[#555] border-transparent hover:text-[#888]'}`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function ZaireButton({ children, onClick, variant = 'default', size = 'sm', icon: Icon }) {
  const variants = {
    default: 'bg-[#141414] border-[#222] text-[#ededed] hover:border-[#444]',
    primary: 'bg-[#ededed] border-[#ededed] text-[#000] hover:bg-white',
    danger:  'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444]/20',
  };
  const sizes = { xs: 'text-[9px] px-2 py-1', sm: 'text-[10px] px-2.5 py-1.5', md: 'text-[11px] px-3 py-2' };
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 rounded border font-medium transition-all ${variants[variant]} ${sizes[size]}`}>
      {Icon && <Icon size={size === 'xs' ? 9 : 11} />}
      {children}
    </button>
  );
}
