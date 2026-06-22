import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Responsive as ResponsiveGridLayout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { ZaireOSProvider } from '../engine/ZaireOSContext';
import { ComponentErrorBoundary, ComponentSkeleton } from './systems/ComponentShell';

// Premium component imports
import CommandSurface    from './systems/CommandSurface';
import MissionBoard      from './systems/MissionBoard';
import SwarmOperations   from './systems/SwarmOperations';
import IntelligenceStream from './systems/IntelligenceStream';
import NeuralGraph       from './systems/NeuralGraph';
import MarketMatrix      from './systems/MarketMatrix';
import WhaleScanner      from './systems/WhaleScanner';
import MemoryVault       from './systems/MemoryVault';
import CodeStudio        from './systems/CodeStudio';
import TacticalTerminal  from './systems/TacticalTerminal';

import './CustomModeRenderer.css';

// ─── Registry ───────────────────────────────────────────────────────────────
const REGISTRY = {
  'Command Surface':     CommandSurface,
  'Mission Board':       MissionBoard,
  'Swarm Operations':    SwarmOperations,
  'Intelligence Stream': IntelligenceStream,
  'Neural Graph':        NeuralGraph,
  'Market Matrix':       MarketMatrix,
  'Whale Scanner':       WhaleScanner,
  'Memory Vault':        MemoryVault,
  'Code Studio':         CodeStudio,
  'Tactical Terminal':   TacticalTerminal,
  'Neural Console':      TacticalTerminal,
};

// ─── Default layout generator by zone ───────────────────────────────────────
function buildDefaultLayout(components) {
  const layout = [];
  const counters = { left: 0, center: 0, right: 0, bottom: 0 };

  components.forEach((comp) => {
    const zone = (comp.zone || 'Main Workspace').toLowerCase();
    let x = 3, w = 6;

    if (zone.includes('left')) {
      x = 0; w = 3;
      layout.push({ i: comp.type, x, y: counters.left, w, h: 14, minW: 2, minH: 6 });
      counters.left += 14;
    } else if (zone.includes('right')) {
      x = 9; w = 3;
      layout.push({ i: comp.type, x, y: counters.right, w, h: 14, minW: 2, minH: 6 });
      counters.right += 14;
    } else if (zone.includes('bottom')) {
      layout.push({ i: comp.type, x: 3, y: 28 + counters.bottom, w: 6, h: 8, minW: 2, minH: 4 });
      counters.bottom += 8;
    } else {
      layout.push({ i: comp.type, x: 3, y: counters.center, w: 6, h: 12, minW: 2, minH: 6 });
      counters.center += 12;
    }
  });

  return layout;
}

// ─── Placeholder for unregistered components ────────────────────────────────
function ComponentPlaceholder({ type }) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg gap-2">
      <div className="w-8 h-8 rounded-lg bg-[#111] border border-[#1f1f1f] flex items-center justify-center">
        <span className="text-[14px]">⚙️</span>
      </div>
      <div className="text-[11px] font-medium text-[#888]">{type}</div>
      <div className="text-[9px] text-[#555] font-mono">Component not yet implemented</div>
    </div>
  );
}

// ─── Single panel wrapper with loading state ─────────────────────────────────
function PanelWrapper({ comp, modeColor }) {
  const [isReady, setIsReady] = useState(false);
  const Component = REGISTRY[comp.type];

  useEffect(() => {
    // Brief loading skeleton before mounting heavy components
    const t = setTimeout(() => setIsReady(true), 150 + Math.random() * 200);
    return () => clearTimeout(t);
  }, [comp.type]);

  return (
    <div className="zaire-panel-wrapper h-full w-full relative">
      {/* Drag handle — appears on hover */}
      <div className="panel-drag-handle absolute top-0 left-0 right-0 h-3 z-30 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.06), transparent)' }} />

      <ComponentErrorBoundary>
        <AnimatePresence mode="wait">
          {!isReady ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[#1a1a1a] bg-[#000] flex items-center gap-2">
                <div className="w-3 h-3 rounded skeleton-pulse" />
                <div className="h-2.5 w-24 rounded skeleton-pulse" />
              </div>
              <ComponentSkeleton rows={4} />
            </motion.div>
          ) : (
            <motion.div key="component" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
              {Component
                ? <Component accent={modeColor || '#00d4ff'} />
                : <ComponentPlaceholder type={comp.type} />
              }
            </motion.div>
          )}
        </AnimatePresence>
      </ComponentErrorBoundary>
    </div>
  );
}

// ─── Main renderer ───────────────────────────────────────────────────────────
export default function CustomModeRenderer({ mode }) {
  const [layout, setLayout] = useState([]);
  const [mounted, setMounted] = useState(false);
  const storageKey = `zaire_layout_${mode?.id}`;

  useEffect(() => {
    if (!mode?.components?.length) return;

    // Try to restore persisted layout
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate — make sure all current components have a layout entry
        const allPresent = mode.components.every(c => parsed.find(l => l.i === c.type));
        if (allPresent) {
          setLayout(parsed);
          setMounted(true);
          return;
        }
      }
    } catch (e) { /* ignore */ }

    // Build fresh default layout
    setLayout(buildDefaultLayout(mode.components));
    setMounted(true);
  }, [mode?.id, mode?.components, storageKey]);

  const handleLayoutChange = useCallback((newLayout) => {
    setLayout(newLayout);
    try { localStorage.setItem(storageKey, JSON.stringify(newLayout)); } catch (e) {}
  }, [storageKey]);

  if (!mounted || !mode) {
    return (
      <div className="h-full w-full bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#00d4ff]/20 border-t-[#00d4ff] rounded-full animate-spin" />
          <span className="text-[10px] font-mono text-[#555]">INITIALIZING {mode?.name?.toUpperCase() || 'MODE'}...</span>
        </div>
      </div>
    );
  }

  if (!mode.components?.length) {
    return (
      <div className="h-full w-full bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#444] text-[12px] mb-2">No components in this mode</div>
          <div className="text-[#333] text-[10px] font-mono">Add components via Mode Architect</div>
        </div>
      </div>
    );
  }

  return (
    <ZaireOSProvider>
      <div className="custom-mode-layout relative h-full" style={{ background: '#050505' }}>
        {/* Ambient background glow */}
        <div className="absolute inset-0 pointer-events-none z-0"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${mode.color || '#00d4ff'}0d 0%, transparent 60%)` }} />

        <div className="relative z-10 h-full overflow-auto">
          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: layout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={28}
            margin={[12, 12]}
            containerPadding={[12, 12]}
            isDraggable
            isResizable
            draggableHandle=".panel-drag-handle"
            onLayoutChange={handleLayoutChange}
            resizeHandles={['se', 'sw', 'ne', 'nw', 'e', 'w', 's', 'n']}
          >
            {mode.components.map((comp) => (
              <div key={comp.type} className="group">
                <PanelWrapper comp={comp} modeColor={mode.color} />
              </div>
            ))}
          </ResponsiveGridLayout>
        </div>
      </div>
    </ZaireOSProvider>
  );
}
