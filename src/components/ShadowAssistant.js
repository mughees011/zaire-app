import React, { useEffect, useReducer, useRef } from 'react';
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';
import { Bot, X, Send, Command, Zap, Bug } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function createShadowMessage(id, role, content) {
  return { id, role, content };
}

const initialShadowState = {
  isOpen: false,
  input: '',
  streamedText: '',
  messages: [
    createShadowMessage('shadow-0', 'assistant', "Shadow Assistant active, sir. Awaiting tactical commands.")
  ]
};

function shadowReducer(state, action) {
  switch (action.type) {
    case 'toggle_open':
      return { ...state, isOpen: !state.isOpen };
    case 'close':
      return { ...state, isOpen: false };
    case 'set_input':
      return { ...state, input: action.value };
    case 'append_stream':
      return { ...state, streamedText: state.streamedText + action.delta };
    case 'append_message':
      return { ...state, messages: [...state.messages, action.message] };
    case 'finalize_stream':
      if (!action.message) {
        return { ...state, streamedText: '' };
      }
      return {
        ...state,
        streamedText: '',
        messages: [...state.messages, action.message]
      };
    default:
      return state;
  }
}

const ShadowAssistant = ({ socket }) => {
  const [state, dispatch] = useReducer(shadowReducer, initialShadowState);
  const scrollRef = useRef(null);
  const streamedTextRef = useRef('');
  const messageIdRef = useRef(1);
  const isTypingRef = useRef(false);
  const { isOpen, input, messages, streamedText } = state;

  const getNextMessageId = () => {
    const nextId = messageIdRef.current;
    messageIdRef.current += 1;
    return `shadow-${nextId}`;
  };

  useEffect(() => {
    if (socket) {
      socket.on('shadow_text_delta', (delta) => {
        isTypingRef.current = true;
        dispatch({ type: 'append_stream', delta });
      });

      socket.on('shadow_text_complete', () => {
        isTypingRef.current = false;
        dispatch({
          type: 'finalize_stream',
          message: streamedTextRef.current
            ? createShadowMessage(getNextMessageId(), 'assistant', streamedTextRef.current)
            : null
        });
        streamedTextRef.current = '';
      });
    }

    return () => {
      if (socket) {
        socket.off('shadow_text_delta');
        socket.off('shadow_text_complete');
      }
    };
  }, [socket]);

  useEffect(() => {
    streamedTextRef.current = streamedText;
  }, [streamedText]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamedText]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    dispatch({
      type: 'append_message',
      message: createShadowMessage(getNextMessageId(), 'user', userMessage)
    });
    socket.emit('shadow_request', { prompt: userMessage, context: { page: 'HOME' } });
    dispatch({ type: 'set_input', value: '' });
  };

  const handleCommand = (cmd) => {
    dispatch({ type: 'set_input', value: cmd });
    // Auto-send commands if they start with / and don't need additional input
    if (cmd === '/bughunter') {
        dispatch({
          type: 'append_message',
          message: createShadowMessage(getNextMessageId(), 'user', cmd)
        });
        socket.emit('shadow_request', { prompt: cmd });
        dispatch({ type: 'set_input', value: '' });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-96 overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  <Bot className="size-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-white uppercase">Shadow Assistant</h3>
                  <p className="text-[10px] text-cyan-400/70 font-mono">NEURAL_BRIDGE_ACTIVE</p>
                </div>
              </div>
              <button onClick={() => dispatch({ type: 'close' })} className="rounded-full p-1 hover:bg-white/10 transition-colors">
                <X className="size-4 text-white/50" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="h-[400px] overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10"
            >
              {messages.map((m) => (
                <div key={m.id} className={cn(
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
                    <span className="ml-1 inline-block size-1.5 bg-cyan-400 align-middle animate-pulse" />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 p-3 border-t border-white/10 bg-black/20 overflow-x-auto no-scrollbar">
              <button onClick={() => handleCommand('/ultraplan ')} className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-white/5 px-3 py-1.5 text-[10px] font-bold text-white/60 hover:bg-white/10 hover:text-cyan-400 transition-all border border-white/5 uppercase">
                <Zap className="size-3" /> UltraPlan
              </button>
              <button onClick={() => handleCommand('/bughunter')} className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-white/5 px-3 py-1.5 text-[10px] font-bold text-white/60 hover:bg-white/10 hover:text-cyan-400 transition-all border border-white/5 uppercase">
                <Bug className="size-3" /> BugHunter
              </button>
              <button onClick={() => handleCommand('/teleport ')} className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-white/5 px-3 py-1.5 text-[10px] font-bold text-white/60 hover:bg-white/10 hover:text-cyan-400 transition-all border border-white/5 uppercase">
                <Command className="size-3" /> Teleport
              </button>
            </div>

            {/* Input */}
            <div className="p-4 bg-white/5">
              <div className="relative flex items-center">
                <input
                  id="shadow-assistant-input"
                  name="shadow-assistant-input"
                  value={input}
                  onChange={(e) => dispatch({ type: 'set_input', value: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Execute command or ask..."
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 pr-12 text-sm text-white placeholder:text-white/20 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
                <button 
                  onClick={handleSend}
                  className="absolute right-2 rounded-lg bg-cyan-500 p-2 text-black hover:bg-cyan-400 transition-colors"
                >
                  <Send className="size-4" />
                </button>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      <m.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => dispatch({ type: 'toggle_open' })}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-500",
          isOpen ? "bg-white text-black rotate-90" : "bg-cyan-500 text-black"
        )}
      >
        {isOpen ? <X className="size-6" /> : <Bot className="size-7" />}
        {!isOpen && (
            <div className="absolute -inset-1 rounded-full bg-cyan-400/20 animate-ping pointer-events-none" />
        )}
      </m.button>
      </LazyMotion>
    </div>
  );
};

export default ShadowAssistant;
