import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Command, Zap, Terminal, Search, Bug } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const ShadowAssistant = ({ socket }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Shadow Assistant active, sir. Awaiting tactical commands." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (socket) {
      socket.on('shadow_text_delta', (delta) => {
        setIsTyping(true);
        setStreamedText(prev => prev + delta);
      });

      socket.on('shadow_text_complete', () => {
        setIsTyping(false);
        setMessages(prev => {
           // Avoid empty completions if they happen
           if (!streamedText) return prev;
           return [...prev, { role: 'assistant', content: streamedText }];
        });
        setStreamedText('');
      });
    }

    return () => {
      if (socket) {
        socket.off('shadow_text_delta');
        socket.off('shadow_text_complete');
      }
    };
  }, [socket, streamedText]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamedText]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    socket.emit('shadow_request', { prompt: userMessage, context: { page: 'HOME' } });
    setInput('');
  };

  const handleCommand = (cmd) => {
    setInput(cmd);
    // Auto-send commands if they start with / and don't need additional input
    if (cmd === '/bughunter') {
        setMessages(prev => [...prev, { role: 'user', content: cmd }]);
        socket.emit('shadow_request', { prompt: cmd });
        setInput('');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-96 overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-2 w-2 absolute -top-0.5 -right-0.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  <Bot className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-white uppercase">Shadow Assistant</h3>
                  <p className="text-[10px] text-cyan-400/70 font-mono">NEURAL_BRIDGE_ACTIVE</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="rounded-full p-1 hover:bg-white/10 transition-colors">
                <X className="h-4 w-4 text-white/50" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="h-[400px] overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10"
            >
              {messages.map((m, i) => (
                <div key={i} className={cn(
                  "flex flex-col gap-1",
                  m.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                    m.role === 'user' 
                      ? "bg-cyan-500 text-black font-medium" 
                      : "bg-white/5 text-white/90 border border-white/10"
                  )}>
                    {m.content}
                  </div>
                </div>
              ))}
              {streamedText && (
                <div className="flex flex-col items-start gap-1">
                  <div className="max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed bg-white/5 text-white/90 border border-white/10 whitespace-pre-wrap">
                    {streamedText}
                    <span className="inline-block w-1.5 h-4 bg-cyan-400 ml-1 animate-pulse align-middle" />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 p-3 border-t border-white/10 bg-black/20 overflow-x-auto no-scrollbar">
              <button onClick={() => handleCommand('/ultraplan ')} className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-white/5 px-3 py-1.5 text-[10px] font-bold text-white/60 hover:bg-white/10 hover:text-cyan-400 transition-all border border-white/5 uppercase">
                <Zap className="h-3 w-3" /> UltraPlan
              </button>
              <button onClick={() => handleCommand('/bughunter')} className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-white/5 px-3 py-1.5 text-[10px] font-bold text-white/60 hover:bg-white/10 hover:text-cyan-400 transition-all border border-white/5 uppercase">
                <Bug className="h-3 w-3" /> BugHunter
              </button>
              <button onClick={() => handleCommand('/teleport ')} className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-white/5 px-3 py-1.5 text-[10px] font-bold text-white/60 hover:bg-white/10 hover:text-cyan-400 transition-all border border-white/5 uppercase">
                <Command className="h-3 w-3" /> Teleport
              </button>
            </div>

            {/* Input */}
            <div className="p-4 bg-white/5">
              <div className="relative flex items-center">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Execute command or ask..."
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 pr-12 text-sm text-white placeholder:text-white/20 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
                <button 
                  onClick={handleSend}
                  className="absolute right-2 rounded-lg bg-cyan-500 p-2 text-black hover:bg-cyan-400 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-500",
          isOpen ? "bg-white text-black rotate-90" : "bg-cyan-500 text-black"
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-7 w-7" />}
        {!isOpen && (
            <div className="absolute -inset-1 rounded-full bg-cyan-400/20 animate-ping pointer-events-none" />
        )}
      </motion.button>
    </div>
  );
};

export default ShadowAssistant;
