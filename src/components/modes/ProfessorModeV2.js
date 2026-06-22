import React, { useState } from 'react';
import { BookOpen, GraduationCap, Edit3, FileText, Network, MessageSquare, Play, HelpCircle, Target, Sparkles, Beaker, FileSignature } from 'lucide-react';
import './ProfessorModeV2.css';

const ProfessorModeV2 = () => {
  const [activeLeft, setActiveLeft] = useState('courses');

  // Dummy State
  const subjects = [
    { name: 'Quantum Computing', active: true },
    { name: 'Neural Networks', active: false },
    { name: 'Linear Algebra', active: false },
    { name: 'Systems Architecture', active: false }
  ];

  const questions = [
    { time: '10:15 AM', user: 'How does decoherence break the wave function?', avatar: 'A' },
    { time: '10:22 AM', user: "Can you show me the math behind Shor's algorithm?", avatar: 'M' },
    { time: '10:25 AM', user: "What's the difference between T1 and T2 relaxation?", avatar: 'S' }
  ];

  return (
    <div className="professor-v2-container">
      {/* LEFT SIDEBAR: Academic Explorer */}
      <div className="professor-v2-sidebar">
        <div className="p-sidebar-nav">
          <button className={activeLeft === 'courses' ? 'active' : ''} onClick={() => setActiveLeft('courses')} title="Curriculum"><BookOpen size={18} /></button>
          <button className={activeLeft === 'notes' ? 'active' : ''} onClick={() => setActiveLeft('notes')} title="Neural Notes"><Edit3 size={18} /></button>
          <button className={activeLeft === 'exams' ? 'active' : ''} onClick={() => setActiveLeft('exams')} title="Evaluations"><FileText size={18} /></button>
        </div>
        
        <div className="p-sidebar-content">
          <div className="p-sidebar-title">
            {activeLeft === 'courses' ? 'CURRICULUM' : activeLeft === 'notes' ? 'NEURAL NOTES' : 'EVALUATIONS'}
          </div>
          
          {activeLeft === 'courses' && (
            <>
              <ul className="p-list">
                {subjects.map(s => (
                  <li key={s.name} className={s.active ? 'active-course' : ''}>
                    <GraduationCap size={16} /> {s.name}
                  </li>
                ))}
              </ul>
              
              <div className="study-plan-card">
                <h4>ACTIVE STUDY PLAN</h4>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Progress</span>
                  <span>65%</span>
                </div>
                <div className="sp-progress"><div className="sp-fill"></div></div>
              </div>
            </>
          )}
          
          {activeLeft === 'notes' && (
            <div className="p-notes-panel">
              <div className="p-note-item">
                <strong>Entanglement</strong><br/>
                Implies correlated states regardless of spatial distance. Crucial for quantum teleportation protocols.
              </div>
              <div className="p-note-item">
                <strong>Bloch Sphere</strong><br/>
                Geometrical representation of the pure state space of a two-level quantum mechanical system (qubit).
              </div>
              <button className="p-action-btn mt-2">
                <Edit3 size={14} /> NEW ATOMIC NOTE
              </button>
            </div>
          )}
          
          {activeLeft === 'exams' && (
            <div className="p-exams-panel">
              <button className="p-action-btn">
                <Sparkles size={14} /> GENERATE PRACTICE EXAM
              </button>
              <div className="mt-4 flex flex-col gap-3">
                <div className="p-exam-item">
                  <span className="p-exam-status passed">[PASSED 94%]</span>
                  <span className="p-exam-title">Midterm: Neural Cores</span>
                </div>
                <div className="p-exam-item">
                  <span className="p-exam-status pending">[PENDING]</span>
                  <span className="p-exam-title">Final: Quantum Computing</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CENTER: Lecture Canvas */}
      <div className="professor-v2-main">
        <div className="p-main-header">
          <div className="p-header-title">
            <Target size={18} /> LECTURE CANVAS // NEURAL ENTANGLEMENT
          </div>
          <div className="p-header-controls">
            <button className="p-gen-btn"><FileSignature size={14} /> Flashcards</button>
            <button className="p-gen-btn"><Beaker size={14} /> Generate Quiz</button>
          </div>
        </div>
        
        <div className="p-canvas-area">
          <div className="harvard-chalkboard-v2">
            <div className="chalk-title">THE DECOHERENCE THRESHOLD</div>
            <div className="chalk-body">
              <p>When a quantum system interacts with its environment in a thermodynamically irreversible way, phase coherence is lost.</p>
              <p className="chalk-math">H = H<sub>sys</sub> ⊗ I<sub>env</sub> + I<sub>sys</sub> ⊗ H<sub>env</sub> + H<sub>int</sub></p>
              <ul className="chalk-list mt-8">
                <li>Interaction Hamiltonian determines the pointer states.</li>
                <li>Superposition decays exponentially with time, leading to classical probability.</li>
                <li>Error correction algorithms require massive physical qubit redundancy.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* BOTTOM: Student Questions & Discussion */}
        <div className="professor-v2-bottom">
          <div className="p-bottom-header"><MessageSquare size={14} /> LIVE STUDENT QUESTIONS</div>
          <div className="p-questions-feed">
            {questions.map((q, i) => (
              <div key={i} className="p-question-item">
                <div className="q-avatar">{q.avatar}</div>
                <div className="q-content">
                  <div className="q-meta">
                    <span className="text-purple-300 font-bold">Student_{q.avatar}</span>
                    <span>{q.time}</span>
                  </div>
                  <div className="q-text">{q.user}</div>
                </div>
                <button className="q-reply-btn">Ask ZAIRE <Play size={10} /></button>
              </div>
            ))}
          </div>
          <div className="p-question-input-wrapper">
            <HelpCircle size={18} className="text-purple-400" />
            <input 
              type="text" 
              placeholder="Ask the Professor anything regarding the lecture..." 
              className="p-question-input" 
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.target.value = '';
              }}
            />
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR: Knowledge Graph */}
      <div className="professor-v2-right">
        <div className="p-right-header"><Network size={16} /> KNOWLEDGE GRAPH</div>
        <div className="p-graph-view">
          {/* Decorative Graph Nodes */}
          <div className="graph-placeholder">
            <div className="g-node g-center">Q-Bits</div>
            <div className="g-node g-n1">Superposition</div>
            <div className="g-node g-n2">Entanglement</div>
            <div className="g-node g-n3">Decoherence</div>
            <div className="g-line g-l1"></div>
            <div className="g-line g-l2"></div>
            <div className="g-line g-l3"></div>
          </div>
          <div className="graph-status">
            <span className="status-dot"></span> SYNCED TO CURRICULUM
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessorModeV2;
