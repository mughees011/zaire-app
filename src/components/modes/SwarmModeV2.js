import React, { useState } from 'react';
import { Network, Activity, Cpu, BrainCircuit, Zap, ShieldAlert, FileSearch, TerminalSquare, Server, Database, Target, Layers, CheckCircle2, Clock, Code2, Cpu as CpuIcon, PlayCircle } from 'lucide-react';
import './SwarmModeV2.css';

const SwarmModeV2 = () => {
  const [activeTask, setActiveTask] = useState('Build SaaS Landing Page');
  const [selectedAgent, setSelectedAgent] = useState('Developer');

  const tasks = [
    { id: 1, name: 'Build SaaS Landing Page', status: 'RUNNING', progress: 65, active: true },
    { id: 2, name: 'Smart Contract Audit', status: 'COMPLETED', progress: 100, active: false },
    { id: 3, name: 'Sentiment Scraping', status: 'RUNNING', progress: 32, active: true }
  ];

  const missionPipeline = [
    { agent: 'Research', icon: <FileSearch size={24} />, status: 'Completed', color: '#3b82f6', desc: 'Analyzed 12 competitor landing pages.' },
    { agent: 'Planner', icon: <BrainCircuit size={24} />, status: 'Completed', color: '#a855f7', desc: 'Generated React component architecture.' },
    { agent: 'Developer', icon: <TerminalSquare size={24} />, status: 'Running', color: '#10b981', desc: 'Writing TailwindCSS styling for Hero Section.' },
    { agent: 'Critic', icon: <ShieldAlert size={24} />, status: 'Waiting', color: '#f43f5e', desc: 'Awaiting codebase for accessibility and UX audit.' }
  ];

  const agentLogs = [
    { time: '09:21:05', agent: 'RESEARCH', msg: 'Found 12 competitors in the SaaS CRM space. Extracting hero copywriting...' },
    { time: '09:21:45', agent: 'RESEARCH', msg: 'Extracted 144 design tokens. Compiled into JSON schema.' },
    { time: '09:22:12', agent: 'PLANNER', msg: 'Generated component roadmap: [Hero, Features, Pricing, Footer].' },
    { time: '09:23:00', agent: 'DEVELOPER', msg: 'Initiated React scaffold. Writing Hero component.' },
    { time: '09:23:35', agent: 'DEVELOPER', msg: 'Injecting Framer Motion animations into Hero CTA.' },
    { time: '09:24:10', agent: 'DEVELOPER', msg: 'Hero.jsx generated. Writing Pricing.jsx.' },
    { time: '09:24:50', agent: 'DEVELOPER', msg: 'CSS Grid applied. Adjusting responsive breakpoints.' },
    { time: '09:25:20', agent: 'DEVELOPER', msg: 'Compiling module. Awaiting file I/O operations.' }
  ];

  const agentIntel = {
    'Developer': {
      reasoning: 'Decided to use a CSS Grid layout for the pricing section to ensure responsiveness across mobile breakpoints without complex flex wrapping.',
      sources: ['App.js', 'Tailwind Config', 'Framer Motion Docs'],
      decisions: ['Implemented `backdrop-filter: blur` for premium feel', 'Used `<motion.div>` for entering elements'],
      findings: 'Code is currently 420 lines. Splitting into separate reusable React components is advised.',
      files: ['Hero.jsx', 'Pricing.jsx', 'Features.jsx'],
      metrics: { tokens: '45,210', latency: '120ms' }
    },
    'Research': {
      reasoning: 'Competitors predominantly use dark-mode aesthetics to convey "premium/developer-focused" tooling.',
      sources: ['Vercel.com', 'Linear.app', 'Stripe.com'],
      decisions: ['Selected "Inter" as primary font.', 'Selected #00FF88 as primary action color.'],
      findings: 'Top converting SaaS pages have fewer than 3 CTAs above the fold.',
      files: ['research_report.json', 'design_tokens.json'],
      metrics: { tokens: '112,400', latency: '350ms' }
    },
    'Planner': {
      reasoning: 'Separated the monolithic App.js into modular components to allow the Swarm Developer agent to iterate without causing git conflicts.',
      sources: ['React Best Practices', 'ZAIRE Design System'],
      decisions: ['Component 1: Hero.jsx', 'Component 2: Pricing.jsx', 'Component 3: Features.jsx'],
      findings: 'Current project architecture lacks an Error Boundary. Adding to backlog.',
      files: ['architecture.md', 'task_manifest.json'],
      metrics: { tokens: '14,050', latency: '85ms' }
    },
    'Critic': {
      reasoning: 'Awaiting execution output. Will cross-reference Developer code against WCAG AA accessibility standards.',
      sources: ['WCAG Guidelines', 'React A11y Rules'],
      decisions: ['Pending code delivery...'],
      findings: 'Pending code delivery...',
      files: [],
      metrics: { tokens: '0', latency: '0ms' }
    }
  };

  const activeIntel = agentIntel[selectedAgent] || agentIntel['Developer'];
  const swarmMetrics = [
    { label: 'Lab Status', value: 'Experimental' },
    { label: 'Agents Live', value: '4 Nodes' },
    { label: 'Consensus', value: '92%' },
    { label: 'Memory Sync', value: 'Stable' }
  ];

  // Particles
  const particles = Array.from({ length: 30 }).map((_, i) => ({
    id: i, top: Math.random() * 100 + '%', left: Math.random() * 100 + '%',
    duration: Math.random() * 10 + 10 + 's', delay: Math.random() * 5 + 's'
  }));

  return (
    <div className="swarm-v2-container">
      <div className="s-cyber-grid"></div>
      
      <div className="s-particles">
        {particles.map(p => (
          <div key={p.id} className="s-particle" style={{ top: p.top, left: p.left, animationDuration: p.duration, animationDelay: p.delay }}></div>
        ))}
      </div>

      {/* LEFT SIDEBAR */}
      <div className="swarm-v2-sidebar">
        <div className="s-sidebar-header">
          <div className="s-title"><Network size={16} className="text-cyan-400" /> MISSION PROTOCOLS <span className="s-pulse"></span></div>
          <div className="s-sidebar-copy">Experimental lab for multi-agent execution, reasoning handoff, and persistent mission memory.</div>
        </div>
        
        <div className="s-task-list">
          {tasks.map(t => (
            <div 
              key={t.id} 
              className={`s-task-card ${activeTask === t.name ? 'active' : ''}`}
              onClick={() => setActiveTask(t.name)}
            >
              <div className="s-task-glow"></div>
              <div className="s-task-header">
                <span className="s-task-name">{t.name}</span>
                <span className={`s-task-status ${t.status.toLowerCase()}`}>[{t.status}]</span>
              </div>
              <div className="s-progress-bg">
                <div className="s-progress-fill" style={{ width: t.progress + '%' }}></div>
              </div>
              {t.active && <div className="s-task-waves"><span></span><span></span><span></span></div>}
            </div>
          ))}
        </div>

        <div className="s-new-task-btn"><Zap size={16} /> DEPLOY SWARM</div>
      </div>

      {/* CENTER MAIN COLUMN (Scrollable independently) */}
      <div className="swarm-v2-main">
        <div className="s-main-header">
          <div className="s-header-info">
            <p><Target size={12} className="text-cyan-400" /> CURRENT MISSION GOAL</p>
            <h2>{activeTask.toUpperCase()}</h2>
            <div className="s-header-subline">Swarm Mission Control coordinates specialist agents, tracks execution, and keeps shared memory synchronized while the build moves.</div>
          </div>
          <div className="flex gap-4">
            <div className="s-sys-badge"><Cpu size={14} className="text-blue-400" /> CORE: 12%</div>
            <div className="s-sys-badge"><Server size={14} className="text-green-400" /> VRAM: 1.4GB</div>
          </div>
        </div>

        <div className="s-metric-ribbon">
          {swarmMetrics.map((metric) => (
            <div key={metric.label} className="s-metric-card">
              <span className="s-metric-label">{metric.label}</span>
              <span className="s-metric-value">{metric.value}</span>
            </div>
          ))}
        </div>

        {/* Pipeline */}
        <div className="s-pipeline-section">
          <div className="s-pipeline">
            {missionPipeline.map((agent, index) => (
              <div 
                key={agent.agent} 
                className={`s-pipe-node ${selectedAgent === agent.agent ? 'selected' : ''}`}
                onClick={() => setSelectedAgent(agent.agent)}
                style={{ '--agent-color': agent.color }}
              >
                <div className="s-node-status-icon">
                  {agent.status === 'Completed' ? <CheckCircle2 size={16} className="text-green-400" /> : 
                   agent.status === 'Running' ? <Activity size={16} className="text-cyan-400 animate-pulse" /> :
                   <Clock size={16} className="text-gray-500" />}
                </div>
                <div className={`s-pipe-icon ${agent.status.toLowerCase()}`}>
                  {agent.icon}
                </div>
                <div className="s-pipe-details">
                  <span className="s-pipe-name">{agent.agent.toUpperCase()} AGENT</span>
                  <span className="s-pipe-desc">{agent.desc}</span>
                </div>
                {index < missionPipeline.length - 1 && <div className={`s-pipe-connector ${agent.status === 'Completed' ? 'active' : ''}`}></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Vertical Sections (Fills the rest of the height) */}
        <div className="s-mission-grid">
          
          {/* Timeline */}
          <div className="s-timeline-section">
            <div className="s-panel-header"><Activity size={14} className="text-cyan-400" /> MISSION TIMELINE</div>
            <div className="s-timeline-list">
              {agentLogs.map((l, i) => (
                <div key={i} className="s-log-entry">
                  <span className="s-log-time">[{l.time}]</span>
                  <span className={`s-log-agent ${l.agent.toLowerCase()}`}>{l.agent} AGENT</span>
                  <span className="s-log-msg">{l.msg}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Queue & Memory Row */}
          <div className="s-queue-section">
            <div className="s-panel-header"><Layers size={14} className="text-purple-400" /> EXECUTION QUEUE</div>
            <div className="s-queue-list">
              <div className="s-queue-item">
                <div className="s-qi-header"><span className="text-green-400">Developer Agent</span> <span className="s-qi-status text-green-400">[RUNNING]</span></div>
                <div className="s-qi-desc">Building Hero Section (Hero.jsx)</div>
              </div>
              <div className="s-queue-item">
                <div className="s-qi-header"><span className="text-rose-400">Critic Agent</span> <span className="s-qi-status text-gray-400">[WAITING]</span></div>
                <div className="s-qi-desc">Accessibility Audit (Awaiting output)</div>
              </div>
              <div className="s-queue-item">
                <div className="s-qi-header"><span className="text-blue-400">Research Agent</span> <span className="s-qi-status text-blue-400">[COMPLETE]</span></div>
                <div className="s-qi-desc">Competitor Analysis (12 sites analyzed)</div>
              </div>
            </div>
          </div>

          <div className="s-outputs-section">
            <div className="s-panel-header"><Code2 size={14} className="text-yellow-400" /> DELIVERABLES & OUTPUTS</div>
            <div className="s-output-list">
              {['Hero.jsx', 'Pricing.jsx', 'Features.jsx', 'Footer.jsx', 'tailwind.config.js'].map((file, i) => (
                <div key={i} className="s-output-file"><FileSearch size={14} /> {file}</div>
              ))}
            </div>
          </div>

          <div className="s-memory-section">
            <div className="s-panel-header"><Database size={14} className="text-emerald-400" /> PERSISTENT CONTEXT MEMORY</div>
            <div className="s-memory-grid">
              <div className="s-mem-box">
                <span className="s-mem-label">Project Scope</span>
                <span className="s-mem-val">ZAIRE SaaS Web</span>
              </div>
              <div className="s-mem-box">
                <span className="s-mem-label">Competitors Found</span>
                <span className="s-mem-val">12 Profiles</span>
              </div>
              <div className="s-mem-box">
                <span className="s-mem-label">Components Arch</span>
                <span className="s-mem-val">24 Modules</span>
              </div>
              <div className="s-mem-box">
                <span className="s-mem-label">Tasks Completed</span>
                <span className="s-mem-val text-green-400">18 / 22</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* RIGHT SIDEBAR: Dense Cognition Intel */}
      <div className="swarm-v2-right">
        <div className="s-inspector-header">
          <BrainCircuit size={16} className="text-purple-400" /> AGENT COGNITION: {selectedAgent.toUpperCase()}
        </div>
        <div className="s-inspector-content">
          
          <div className="s-intel-section">
            <div className="s-intel-title">REASONING ENGINE</div>
            <div className="s-intel-box">{activeIntel.reasoning}</div>
          </div>

          <div className="s-intel-section">
            <div className="s-intel-title">CRITICAL DECISIONS</div>
            <div className="s-intel-box list">
              {activeIntel.decisions.map((dec, i) => (
                <div key={i} className="s-intel-list-item"><span className="bullet"></span>{dec}</div>
              ))}
            </div>
          </div>

          <div className="s-intel-section">
            <div className="s-intel-title">SOURCES & REFERENCES</div>
            <div className="s-intel-tags">
              {activeIntel.sources.map((src, i) => (
                <span key={i} className="s-intel-tag">{src}</span>
              ))}
            </div>
          </div>

          <div className="s-intel-section">
            <div className="s-intel-title">GENERATED ASSETS</div>
            <div className="s-intel-tags">
              {activeIntel.files.length > 0 ? activeIntel.files.map((file, i) => (
                <span key={i} className="s-intel-tag text-emerald-400 border-emerald-400/30 bg-emerald-400/10"><Code2 size={10} className="inline mr-1"/>{file}</span>
              )) : <span className="text-xs text-gray-500">No output generated yet.</span>}
            </div>
          </div>

          <div className="s-intel-section">
            <div className="s-intel-title">FINDINGS</div>
            <div className="s-intel-box text-rose-300 bg-rose-900/20 border-rose-900/50">{activeIntel.findings}</div>
          </div>

          <div className="s-intel-section mt-auto pt-4">
            <div className="s-intel-title mb-2">AGENT PERFORMANCE METRICS</div>
            <div className="s-metrics-grid">
              <div className="s-metric-item">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest"><CpuIcon size={10} className="inline mr-1"/>Tokens Used</span>
                <span className="s-mi-val">{activeIntel.metrics.tokens}</span>
              </div>
              <div className="s-metric-item">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest"><PlayCircle size={10} className="inline mr-1"/>Avg Latency</span>
                <span className="s-mi-val text-cyan-400">{activeIntel.metrics.latency}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SwarmModeV2;
