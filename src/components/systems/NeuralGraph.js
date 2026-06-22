import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, { Background, Controls, applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import 'reactflow/dist/style.css';
import { Network, Cpu, Server, Database, Cloud, Search } from 'lucide-react';
import { ComponentShell, ComponentHeader, ComponentStatusBar } from './ComponentShell';
import { useZaireOS } from '../../engine/ZaireOSContext';

const VIEWS = ['Agents', 'Memory', 'Project'];

const INITIAL_NODES = [
  { id: 'operator', type: 'zaireNode', position: { x: 220, y: 30 }, data: { label: 'Operator', role: 'Command', icon: Cloud, color: '#ededed', abbr: 'OP' } },
  { id: 'Code Architect', type: 'zaireNode', position: { x: 80, y: 160 }, data: { label: 'Code Architect', role: 'Architecture', icon: Network, color: '#3b82f6', abbr: 'CA' } },
  { id: 'Executor Agent', type: 'zaireNode', position: { x: 360, y: 160 }, data: { label: 'Executor Agent', role: 'Execution', icon: Cpu, color: '#10b981', abbr: 'EX' } },
  { id: 'Critic Agent', type: 'zaireNode', position: { x: 220, y: 290 }, data: { label: 'Critic Agent', role: 'Validation', icon: Server, color: '#94a3b8', abbr: 'CR' } },
  { id: 'vector_db', type: 'zaireNode', position: { x: 80, y: 290 }, data: { label: 'Vector DB', role: 'Memory Store', icon: Database, color: '#a78bfa', abbr: 'DB' } },
];

const BASE_EDGES = [
  { id: 'e-op-ca', source: 'operator', target: 'Code Architect', style: { stroke: '#222', strokeWidth: 1.5 } },
  { id: 'e-op-ex', source: 'operator', target: 'Executor Agent', style: { stroke: '#222', strokeWidth: 1.5 } },
  { id: 'e-ca-cr', source: 'Code Architect', target: 'Critic Agent', style: { stroke: '#222', strokeWidth: 1.5 } },
  { id: 'e-ex-cr', source: 'Executor Agent', target: 'Critic Agent', style: { stroke: '#222', strokeWidth: 1.5 } },
  { id: 'e-ca-db', source: 'Code Architect', target: 'vector_db', style: { stroke: '#222', strokeWidth: 1.5 } },
];

function ZaireNode({ data }) {
  const Icon = data.icon;
  return (
    <div className={`bg-[#0a0a0a] border rounded-lg p-2.5 min-w-[110px] relative transition-all`}
      style={{ borderColor: data.active ? `${data.color}60` : '#1a1a1a', boxShadow: data.active ? `0 0 12px ${data.color}20` : 'none' }}>
      {data.active && (
        <div className="absolute top-0 left-0 right-0 h-[1px] overflow-hidden rounded-t-lg">
          <div className="h-full w-1/3 animate-[scanning-laser_1.5s_infinite]"
            style={{ background: `linear-gradient(90deg, transparent, ${data.color}, transparent)` }} />
        </div>
      )}
      <div className="flex items-center gap-2 mb-1">
        <Icon size={11} style={{ color: data.active ? data.color : '#555' }} />
        <span className="text-[10px] font-semibold text-[#ededed] tracking-tight">{data.label}</span>
      </div>
      <div className="text-[8px] font-mono text-[#555] uppercase tracking-widest">{data.role}</div>
      {data.active && <div className="mt-1.5 text-[8px] font-mono text-[#888]">● executing</div>}
      <div className="react-flow__handle react-flow__handle-top" style={{ opacity: 0 }} />
      <div className="react-flow__handle react-flow__handle-bottom" style={{ opacity: 0 }} />
    </div>
  );
}

export default function NeuralGraph({ accent = '#00d4ff' }) {
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [edges, setEdges] = useState(BASE_EDGES);
  const [activeView, setActiveView] = useState('Agents');
  const [search, setSearch] = useState('');
  const { agents, neuralEvents } = useZaireOS();

  const nodeTypes = useMemo(() => ({ zaireNode: ZaireNode }), []);

  // Sync agent activity to node visuals
  useEffect(() => {
    setNodes(nds => nds.map(n => {
      const agent = agents.find(a => a.id === n.id);
      const isActive = agent?.status === 'ACTIVE' || agent?.status === 'EXECUTING';
      return { ...n, data: { ...n.data, active: isActive } };
    }));
  }, [agents]);

  // Animate edges on neural events
  useEffect(() => {
    if (!neuralEvents.length) { setEdges(BASE_EDGES); return; }
    setEdges(BASE_EDGES.map(e => {
      const match = neuralEvents.find(ev => (ev.source === e.source && ev.target === e.target) || (ev.source === e.target && ev.target === e.source));
      return match ? { ...e, animated: true, style: { stroke: accent, strokeWidth: 2 } } : e;
    }));
  }, [neuralEvents, accent]);

  const onNodesChange = useCallback(c => setNodes(n => applyNodeChanges(c, n)), []);
  const onEdgesChange = useCallback(c => setEdges(e => applyEdgeChanges(c, e)), []);
  const onConnect = useCallback(p => setEdges(e => addEdge({ ...p, style: { stroke: '#333' } }, e)), []);

  const filteredNodes = search
    ? nodes.map(n => ({ ...n, hidden: !n.data.label.toLowerCase().includes(search.toLowerCase()) }))
    : nodes;

  return (
    <ComponentShell accent={accent} state="idle">
      <ComponentHeader title="Neural Architecture" icon={Network} status="active" accent={accent}
        subtitle="Live agent topology map" />

      {/* Controls */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1a1a1a] bg-[#000] shrink-0">
        <div className="flex gap-1">
          {VIEWS.map(v => (
            <button key={v} onClick={() => setActiveView(v)}
              className={`px-2.5 py-1 rounded text-[9px] font-mono transition-colors ${activeView === v ? 'bg-[#141414] border border-[#333] text-[#ededed]' : 'text-[#555] hover:text-[#888]'}`}>
              {v}
            </button>
          ))}
        </div>
        <div className="flex-1 flex items-center bg-[#0a0a0a] border border-[#1a1a1a] rounded px-2 py-1 focus-within:border-[#333] transition-colors">
          <Search size={10} className="text-[#555] mr-1.5" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search nodes..."
            className="flex-1 bg-transparent border-none outline-none text-[10px] text-[#ededed] placeholder-[#555]" />
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 min-h-0 relative bg-[#000]">
        <ReactFlow nodes={filteredNodes} edges={edges} onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange} onConnect={onConnect} nodeTypes={nodeTypes}
          fitView proOptions={{ hideAttribution: true }}>
          <Background color="#ffffff" gap={20} size={0.5} opacity={0.03} />
          <Controls showInteractive={false} className="opacity-40 hover:opacity-100 transition-opacity" />
        </ReactFlow>
      </div>

      <ComponentStatusBar accent={accent} items={[
        { label: 'NODES', value: nodes.length },
        { label: 'EDGES', value: edges.length },
        { label: 'ACTIVE', value: agents.filter(a => a.status === 'ACTIVE' || a.status === 'EXECUTING').length, color: accent },
        { label: 'VIEW', value: activeView },
      ]} />
    </ComponentShell>
  );
}
