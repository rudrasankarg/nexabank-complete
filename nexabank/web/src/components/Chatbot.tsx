'use client';
import { useChatStore } from '@/store/chatStore';
import { UserCircle, ArrowRight, Loader2 } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';

export default function Chatbot() {
  const { isOpen, toggleChat, closeChat } = useChatStore();
  const [messages, setMessages] = useState([
    { text: "Hello! I'm Nexie, your digital banking assistant. How can I help you regarding our products or services today?", isBot: true }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue;
    const currentMessages = [...messages]; // Capture history BEFORE adding new message
    
    setMessages(prev => [...prev, { text: userMessage, isBot: false }]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Prepare history for Gemini: exclude the greeting [0] and anything after that
      const history = currentMessages.slice(1).map(m => ({
        role: m.isBot ? "model" : "user",
        parts: [{ text: m.text }]
      }));

      console.log("[CHATBOT] Sending message:", userMessage, "with history:", history);

      const { data } = await api.post('/chatbot/chat', { 
        message: userMessage,
        history 
      });

      setMessages(prev => [...prev, { text: data.response, isBot: true }]);
    } catch (err: any) {
      console.error("[CHATBOT] Error in handleSend:", err);
      const errorMessage = err.response?.data?.error || "I'm sorry, I encountered an error. Please try again later.";
      setMessages(prev => [...prev, { text: errorMessage, isBot: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[9999] flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-80 h-96 bg-[#1f2937] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-up mb-4">
          <div className="bg-blue-600 p-4 flex justify-between items-center text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <UserCircle size={18} />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Nexie</h4>
                <p className="text-[11px] text-blue-200">Online 🟢</p>
              </div>
            </div>
            <button onClick={closeChat} className="hover:bg-white/20 p-1.5 rounded transition-colors tooltip" aria-label="Close Chat">
              ✕
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 text-sm scrollbar-thin scrollbar-thumb-white/10">
            {messages.map((msg, i) => (
              <div key={i} className={`shadow-sm p-3 py-2.5 max-w-[85%] ${msg.isBot ? 'bg-[#374151] text-slate-200 self-start rounded-tr-xl rounded-br-xl rounded-bl-xl' : 'bg-blue-600 text-white self-end rounded-tl-xl rounded-bl-xl rounded-br-xl'}`}>
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="bg-[#374151] text-slate-200 self-start rounded-tr-xl rounded-br-xl rounded-bl-xl p-3 py-2.5 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-blue-400" />
                <span className="text-[11px] opacity-70">Nexie is typing...</span>
              </div>
            )}
          </div>
          <div className="p-3 bg-[#111827] border-t border-white/10 flex items-center gap-2">
            <input 
              type="text" 
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
              placeholder={isLoading ? "Please wait..." : "Type a message..."}
              className="flex-1 bg-[#1f2937] border border-white/5 rounded-full px-4 py-2 outline-none text-white text-sm focus:border-blue-500/50 transition-colors disabled:opacity-50" 
            />
            <button onClick={handleSend} disabled={isLoading} className="bg-blue-500 hover:bg-blue-600 text-white p-2.5 rounded-full transition-colors flex items-center justify-center shadow-lg disabled:bg-slate-600">
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <div 
        onClick={toggleChat}
        className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center shadow-2xl shadow-blue-500/40 cursor-pointer hover:bg-blue-400 transition-colors hover:scale-105 active:scale-95"
      >
        <div className="w-6 h-6 rounded border-2 border-white relative mt-1">
          <div className="w-2 h-2 bg-white rounded-full absolute -bottom-1 -left-1"></div>
        </div>
      </div>
    </div>
  );
}
