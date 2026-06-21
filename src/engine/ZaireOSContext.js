import React, { createContext, useContext, useState, useCallback } from 'react';

const ZaireOSContext = createContext();

export function ZaireOSProvider({ children }) {
  // 1. Mission State
  const [missions, setMissions] = useState([
    { id: 'm1', title: 'Compile Component Schema', agent: 'Code Architect', status: 'running', priority: 'High', progress: 82, eta: '2 min' },
    { id: 'm2', title: 'Security Audit', agent: 'Critic Agent', status: 'waiting', priority: 'Critical', progress: 0, eta: '--' },
  ]);

  // 2. Swarm State
  const [agents, setAgents] = useState([
    { id: 'Code Architect', status: 'EXECUTING', objective: 'Compile Component Schema', thoughts: [] },
    { id: 'Critic Agent', status: 'WAITING', objective: 'Standby for code completion', thoughts: [] },
    { id: 'Executor Agent', status: 'WAITING', objective: 'Standby for deployment', thoughts: [] }
  ]);

  // 3. Neural Events (for graph wires and intelligence stream)
  const [neuralEvents, setNeuralEvents] = useState([]);
  
  // 4. Command Logs (for Command Surface)
  const [commandLogs, setCommandLogs] = useState([
    { id: 1, sender: 'system', text: 'ZAIRE OS Initialized. Swarm connected.' }
  ]);

  const addNeuralEvent = useCallback((event) => {
    setNeuralEvents(prev => [...prev, { id: Date.now(), ...event }]);
    // Auto clear event after it "travels"
    setTimeout(() => {
      setNeuralEvents(prev => prev.filter(e => e.id !== event.id));
    }, 3000);
  }, []);

  const dispatchCommand = useCallback((commandText) => {
    // 1. Log user command
    setCommandLogs(prev => [...prev, { id: Date.now(), sender: 'operator', text: commandText }]);

    // 2. Simulate AI parsing the command
    setTimeout(() => {
      setCommandLogs(prev => [...prev, { id: Date.now() + 1, sender: 'system', text: `Directive received: Parsing intent for "${commandText}"` }]);
      
      // 3. Trigger Swarm Activity
      setAgents(prev => prev.map(a => 
        a.id === 'Executor Agent' 
          ? { ...a, status: 'ACTIVE', objective: `Executing: ${commandText}`, thoughts: [{ time: new Date().toLocaleTimeString(), text: 'Spawning new mission node.' }] }
          : a
      ));

      // 4. Fire Neural Event
      addNeuralEvent({ source: 'operator', target: 'Executor Agent', type: 'directive' });

      // 5. Spawn new Mission
      setTimeout(() => {
        const newMissionId = `m${Date.now()}`;
        setMissions(prev => [...prev, {
          id: newMissionId,
          title: commandText,
          agent: 'Executor Agent',
          status: 'running',
          priority: 'Normal',
          progress: 0,
          eta: 'Calculating...'
        }]);

        setCommandLogs(prev => [...prev, { id: Date.now() + 2, sender: 'system', text: `Mission deployed to Swarm.` }]);
        
        // Simulate mission progress
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 20;
          setMissions(prev => prev.map(m => m.id === newMissionId ? { ...m, progress: Math.min(100, progress) } : m));
          if (progress >= 100) {
            clearInterval(progressInterval);
            setMissions(prev => prev.map(m => m.id === newMissionId ? { ...m, status: 'done' } : m));
            setAgents(prev => prev.map(a => a.id === 'Executor Agent' ? { ...a, status: 'WAITING', objective: 'Standby' } : a));
            addNeuralEvent({ source: 'Executor Agent', target: 'operator', type: 'completion' });
            setCommandLogs(prev => [...prev, { id: Date.now() + 3, sender: 'system', text: `Mission Complete: ${commandText}` }]);
          }
        }, 1500);

      }, 1000);

    }, 500);
  }, [addNeuralEvent]);

  return (
    <ZaireOSContext.Provider value={{
      missions, setMissions,
      agents, setAgents,
      neuralEvents,
      commandLogs,
      dispatchCommand
    }}>
      {children}
    </ZaireOSContext.Provider>
  );
}

export function useZaireOS() {
  return useContext(ZaireOSContext);
}
