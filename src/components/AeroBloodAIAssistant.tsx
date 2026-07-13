import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, MessageSquare, X, Send, Bot, User, 
  HelpCircle, RefreshCw, ChevronDown, Compass, Droplet 
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  createdAt: Date;
}

const SUGGESTIONS = [
  { label: '🩸 Compatibility Matrix', query: 'Can you show me the compatibility matrix for all blood groups (who can receive from whom)?' },
  { label: '⏳ Shelf Life Rules', query: 'What is the shelf life and proper storage temperature for different blood components like platelets and red cells?' },
  { label: '🚨 SOS Sourcing Tips', query: 'What are the best strategic steps to mobilize donors or find units during a critical hospital SOS alert?' },
  { label: '🛡️ Donor Eligibility', query: 'What are the basic eligibility criteria for donating blood, and how long is the recovery wait period?' }
];

export default function AeroBloodAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'model',
      text: "Hi! I'm your AeroBlood AI Assistant. I can help with clinical blood compatibility matching, logistics, emergency sourcing strategy, or donor eligibility guidelines. How can I assist you today?",
      createdAt: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      text: textToSend,
      createdAt: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const historyPayload = messages.map(msg => ({
        role: msg.role,
        text: msg.text
      }));

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Server returned an error.');
      }

      const data = await response.json();
      
      const assistantMsg: Message = {
        id: Math.random().toString(36).substring(7),
        role: 'model',
        text: data.text || "I couldn't generate a response. Please check back.",
        createdAt: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("AI Assistant Error:", err);
      setError(err.message || 'Failed to get a response from AeroBlood AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage(inputValue);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'init',
        role: 'model',
        text: "Hi! I'm your AeroBlood AI Assistant. I can help with clinical blood compatibility matching, logistics, emergency sourcing strategy, or donor eligibility guidelines. How can I assist you today?",
        createdAt: new Date()
      }
    ]);
    setError(null);
  };

  return (
    <div id="aeroblood-ai-assistant-container" className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Action Button */}
      <button
        id="ai-assistant-fab"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
          isOpen 
            ? 'bg-slate-900 text-white rotate-90' 
            : 'bg-brand-red-600 text-white hover:bg-brand-red-700 hover:shadow-brand-red-200/50 hover:shadow-2xl'
        }`}
        title="Open AeroBlood AI Assistant"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative">
            <Sparkles className="w-6 h-6 animate-pulse text-white" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
          </div>
        )}
      </button>

      {/* Slide-Up Chat Window */}
      {isOpen && (
        <div 
          id="ai-assistant-panel"
          className="absolute bottom-16 right-0 w-[380px] sm:w-[420px] h-[550px] bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 ease-out"
        >
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-red-600/20 border border-brand-red-500/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-brand-red-500 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight flex items-center gap-1.5 text-white">
                  AeroBlood AI Companion
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Powered by Gemini 3.5 Flash</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={clearChat}
                className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                title="Clear conversation history"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Stats Panel / Banner */}
          <div className="bg-slate-50 border-b border-slate-200/60 px-4 py-2 flex items-center gap-2 text-[11px] text-slate-500">
            <Droplet className="w-3.5 h-3.5 text-brand-red-500 animate-pulse" />
            <span>Secure Medical Intelligence Sandbox & Grid Navigator</span>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.role === 'user' 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-brand-red-50 text-brand-red-600 border border-brand-red-100'
                }`}>
                  {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div className="space-y-1">
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-slate-100 rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200/60 rounded-tl-none'
                  }`}>
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                  <span className="text-[9px] text-slate-400 block px-1">
                    {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 max-w-[85%] mr-auto">
                <div className="w-7 h-7 rounded-full bg-brand-red-50 text-brand-red-600 border border-brand-red-100 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 animate-bounce" />
                </div>
                <div className="bg-white border border-slate-200/60 p-3 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex flex-col gap-1">
                <span className="font-bold">Error communicating with advisor:</span>
                <span>{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions footer (shows when chat only has initial message) */}
          {messages.length === 1 && (
            <div className="p-3 bg-white border-t border-slate-100 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                Quick Prompts:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTIONS.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(sug.query)}
                    className="p-2 border border-slate-200 rounded-xl text-left text-[11px] text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all cursor-pointer truncate"
                    title={sug.query}
                  >
                    {sug.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form Input Area */}
          <div className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              placeholder="Ask about matching rules, shelf lives..."
              className="flex-1 bg-slate-100 border border-transparent hover:border-slate-200 focus:border-brand-red-500 focus:bg-white px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none transition-all disabled:opacity-50"
            />
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={isLoading || !inputValue.trim()}
              className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
