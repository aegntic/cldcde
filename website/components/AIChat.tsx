import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Cpu } from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';
import { ChatMessage } from '../types';

const AIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'CLD-9 Online. How can I assist you with your tools today?', timestamp: Date.now() }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(userMsg.text);
      const botMsg: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Connection error.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-mono">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 liquid-glass rounded-lg flex flex-col h-[500px] overflow-hidden">
          {/* Header */}
          <div className="p-3 bg-transparent border-b border-cyber-neon/20 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyber-blue animate-pulse" />
              <span className="font-term font-bold text-cyber-blue tracking-wider text-xl">CLD-9 ASSIST</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-cyber-blue/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] p-3 rounded-md text-sm ${msg.role === 'user'
                      ? 'obsidian-pressed border border-cyber-neon/40 text-cyber-neon rounded-br-none'
                      : 'obsidian text-gray-200 rounded-bl-none'
                    }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-neutral-800 border border-neutral-700 p-3 rounded-md rounded-bl-none">
                  <span className="animate-pulse text-cyber-blue">PROCESSING...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-black/50 border-t border-cyber-blue/30 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about tools..."
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded p-2 text-sm text-white focus:border-cyber-blue focus:outline-none focus:ring-1 focus:ring-cyber-blue placeholder-gray-600"
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="p-2 bg-cyber-blue/20 border border-cyber-blue/50 text-cyber-blue rounded hover:bg-cyber-blue hover:text-black transition disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full obsidian border border-cyber-neon shadow-neon flex items-center justify-center text-cyber-neon hover:text-white transition-all duration-300 group"
        >
          <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      )}
    </div>
  );
};

export default AIChat;