import React, { useState, useEffect, useRef } from 'react';
import { X, Terminal, Code, Activity, Play, Box, Server, Shield, Wifi, WifiOff, Command, Search, ChevronRight, Brain, Zap, Layout, ArrowRight, Bot, FileText, Video, Key } from 'lucide-react';
import { LogEntry } from '../types';
import { DEMO_PRODUCTS, ProductDemo, DemoPrompt } from '../data/demoFlows';
import { aiService, PROVIDERS } from '../services/aiService';
import AIConnectModal from './AIConnectModal';

interface SDKPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SDKPanel: React.FC<SDKPanelProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Demo State
  const [selectedProduct, setSelectedProduct] = useState<ProductDemo | null>(null);
  const [visualState, setVisualState] = useState<string>('idle');
  const [activePromptId, setActivePromptId] = useState<string | null>(null);

  // Command Palette State
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');

  // AI Connection State
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectionState, setConnectionState] = useState(aiService.getState());

  // Subscribe to connection state changes
  useEffect(() => {
    const unsubscribe = aiService.subscribe(setConnectionState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (logs.length === 0) {
        // Authentic Claude Code Boot Sequence
        const bootSequence = async () => {
          setLogs([]);

          // 1. User types command
          await new Promise(r => setTimeout(r, 300));
          setLogs([{ type: 'input', content: 'claude', timestamp: Date.now() }]);

          // 2. Version & Init
          await new Promise(r => setTimeout(r, 600));
          setLogs(prev => [...prev, { type: 'output', content: 'Claude Code v0.2.29 (beta)', timestamp: Date.now() }]);

          // 3. Auth Check
          await new Promise(r => setTimeout(r, 400));
          setLogs(prev => [...prev, { type: 'system', content: 'Checking credentials...', timestamp: Date.now() }]);

          // 4. Success
          await new Promise(r => setTimeout(r, 800));
          setLogs(prev => [...prev, { type: 'success', content: '✓ Authenticated as user@cldcde.cc', timestamp: Date.now() }]);

          // 5. Ready
          await new Promise(r => setTimeout(r, 400));
          setLogs(prev => [...prev, { type: 'system', content: 'Type "help" to see available commands or select a module above.', timestamp: Date.now() }]);

          setTimeout(() => inputRef.current?.focus(), 100);
        };

        bootSequence();
      } else {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const runDemoFlow = async (prompt: DemoPrompt) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setActivePromptId(prompt.id);
    setLogs(prev => [...prev, { type: 'input', content: `run --flow ${prompt.id}`, timestamp: Date.now() }]);

    for (const step of prompt.steps) {
      await new Promise(r => setTimeout(r, step.delay));

      if (step.type === 'log') {
        setLogs(prev => [...prev, {
          type: (step.style as any) || 'output',
          content: step.content,
          timestamp: Date.now()
        }]);
      } else if (step.type === 'visual') {
        setVisualState(step.content);
      }
    }

    setIsProcessing(false);
    setActivePromptId(null);
  };

  const renderVisualArea = () => {
    if (!selectedProduct) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6 animate-fade-in">
          <h2 className="text-2xl font-bold text-white tracking-wider">SELECT MODULE</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
            {DEMO_PRODUCTS.map(product => (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="group p-6 obsidian rounded-lg transition-all text-left relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-cyber-blue/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-cyber-blue font-mono font-bold text-lg">{product.name}</span>
                    {product.icon === 'Brain' && <Brain className="text-gray-400 group-hover:text-white" />}
                    {product.icon === 'Zap' && <Zap className="text-gray-400 group-hover:text-white" />}
                    {product.icon === 'Search' && <Search className="text-gray-400 group-hover:text-white" />}
                    {product.icon === 'Bot' && <Bot className="text-gray-400 group-hover:text-white" />}
                    {product.icon === 'FileText' && <FileText className="text-gray-400 group-hover:text-white" />}
                    {product.icon === 'Video' && <Video className="text-gray-400 group-hover:text-white" />}
                  </div>
                  <p className="text-gray-400 text-sm">{product.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedProduct(null); setVisualState('idle'); }}
              className="text-gray-500 hover:text-white transition"
            >
              <Layout size={20} />
            </button>
            <span className="text-gray-600">/</span>
            <span className="text-cyber-blue font-bold tracking-wide">{selectedProduct.name}</span>
          </div>
          <div className="text-xs text-gray-500 font-mono">VISUAL_CORE: {visualState.toUpperCase()}</div>
        </div>

        <div className="flex-1 liquid-glass rounded-lg p-8 flex items-center justify-center relative overflow-hidden">
          {/* Placeholder for "Full Flex" Visuals */}
          <div className="text-center space-y-4 relative z-10">
            <div className="w-24 h-24 mx-auto bg-cyber-blue/10 rounded-full flex items-center justify-center border border-cyber-blue/30 animate-pulse">
              {visualState === 'idle' && <Activity size={40} className="text-cyber-blue" />}
              {visualState === 'analyzing' && <Search size={40} className="text-cyber-blue animate-bounce" />}
              {visualState === 'architecture' && <Layout size={40} className="text-cyber-blue animate-spin-slow" />}
              {visualState === 'complete' && <Shield size={40} className="text-green-400" />}
            </div>
            <div className="text-2xl font-bold text-white tracking-widest">
              {visualState === 'idle' ? 'SYSTEM READY' : visualState.toUpperCase()}
            </div>
          </div>

          {/* Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]" />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {selectedProduct.prompts.map(prompt => (
            <button
              key={prompt.id}
              onClick={() => runDemoFlow(prompt)}
              disabled={isProcessing}
              className={`p-4 border rounded text-left transition-all relative overflow-hidden ${activePromptId === prompt.id
                ? 'border-cyber-blue bg-cyber-blue/10 text-white'
                : 'obsidian text-gray-400 hover:text-gray-200'
                }`}
            >
              {activePromptId === prompt.id && (
                <div className="absolute inset-0 bg-cyber-blue/5 animate-pulse" />
              )}
              <div className="relative z-10">
                <div className="font-bold text-sm mb-1 flex items-center gap-2">
                  {prompt.label}
                  {activePromptId === prompt.id && <Activity size={12} className="animate-spin" />}
                </div>
                <div className="text-xs opacity-70">{prompt.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-500"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[900px] liquid-glass z-50 transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col font-term ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Header */}
        <div className="h-14 bg-[#020505] border-b border-cyber-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-cyber-blue font-bold tracking-widest text-lg">CLDCDE.CC</span>
            <span className="text-gray-600 text-xs tracking-widest">INTERACTIVE DEMO</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Subtle Model Indicator - click to swap */}
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-mono text-gray-500 hover:text-gray-300 transition group"
              title="Change AI model"
            >
              <span className="opacity-70 group-hover:opacity-100">
                {connectionState.model.replace(':free', '').split('/').pop()}
              </span>
              <ChevronRight size={12} className="opacity-50 group-hover:opacity-100 rotate-90" />
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition hover:rotate-90">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Split Screen Layout */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Top: Visual Area (2/3) */}
          <div className="flex-[2] border-b border-cyber-border bg-[#080c0d] relative">
            {renderVisualArea()}
          </div>

          {/* Bottom: Terminal Area (1/3) */}
          <div className="flex-1 bg-[#050505] flex flex-col min-h-[250px] relative">
            <div className="absolute top-0 left-0 right-0 h-6 bg-[#0a0a0a] border-b border-gray-800 flex items-center px-4 justify-between">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Terminal Output</span>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500/50" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                <div className="w-2 h-2 rounded-full bg-green-500/50" />
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 pt-8 space-y-2 font-mono text-sm text-gray-300 scrollbar-thin"
            >
              {logs.map((log, i) => (
                <div key={i} className="animate-fade-in break-words flex gap-3">
                  <span className="text-gray-600 shrink-0 text-xs mt-0.5">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <div className="flex-1">
                    {log.type === 'input' && (
                      <span className="text-white font-bold">➜ {log.content}</span>
                    )}
                    {log.type === 'output' && <span className="text-gray-300">{log.content}</span>}
                    {log.type === 'system' && <span className="text-cyber-blue italic">{log.content}</span>}
                    {log.type === 'info' && <span className="text-blue-400">{log.content}</span>}
                    {log.type === 'success' && <span className="text-green-400">{log.content}</span>}
                    {log.type === 'warning' && <span className="text-yellow-400">{log.content}</span>}
                    {log.type === 'error' && <span className="text-red-400">{log.content}</span>}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="ml-16 animate-pulse text-cyber-blue/50">_</div>
              )}
            </div>

            {/* Terminal Input */}
            <div className="h-12 border-t border-gray-800 flex items-center px-4 gap-3 bg-[#0a0a0a]">
              <span className="text-green-400 font-mono">➜</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && input.trim() && !isProcessing) {
                    const command = input.trim();
                    setInput('');
                    setLogs(prev => [...prev, { type: 'input', content: command, timestamp: Date.now() }]);

                    if (!connectionState.isConnected) {
                      setLogs(prev => [...prev, {
                        type: 'warning',
                        content: 'Not connected. Click CONNECT to use live Claude responses.',
                        timestamp: Date.now()
                      }]);
                      return;
                    }

                    setIsProcessing(true);
                    try {
                      const response = await aiService.sendMessage(command);
                      setLogs(prev => [...prev, { type: 'output', content: response, timestamp: Date.now() }]);
                    } catch (error: any) {
                      setLogs(prev => [...prev, { type: 'error', content: error.message, timestamp: Date.now() }]);
                    }
                    setIsProcessing(false);
                  }
                }}
                placeholder={connectionState.isConnected ? "Ask AI anything..." : "Connect to enable live responses..."}
                className="flex-1 bg-transparent border-none focus:outline-none text-white font-mono text-sm placeholder-gray-600"
              />
              {connectionState.isConnected && (
                <span className={`text-xs font-mono ${connectionState.model === 'demo' ? 'text-yellow-400' : 'text-green-400'}`}>
                  {connectionState.model === 'demo' ? '[DEMO]' : `[${PROVIDERS[connectionState.provider].name}]`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Connection Modal */}
      <AIConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnected={() => {
          const state = aiService.getState();
          setLogs(prev => [...prev, {
            type: 'success',
            content: `✓ Connected to ${PROVIDERS[state.provider].name} (${state.model})`,
            timestamp: Date.now()
          }]);
        }}
      />
    </>
  );
};

export default SDKPanel;