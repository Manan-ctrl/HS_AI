import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Volume2, Globe, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';
import { GeminiService } from '../services/gemini';

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: "Hello! I'm Aijaz, your financial co-pilot. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const history = messages.map(m => `${m.role}: ${m.text}`);
    const response = await GeminiService.chat(input, history);

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: response.text,
      groundingUrls: response.groundingUrls
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  const handleTTS = async (text: string) => {
    const base64 = await GeminiService.generateTTSBase64(text);
    if (base64) {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await decodeAudioData(base64, audioCtx);
      if (audioBuffer) {
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.start(0);
      }
    }
  };

  async function decodeAudioData(base64: string, ctx: AudioContext): Promise<AudioBuffer | null> {
    try {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const dataInt16 = new Int16Array(bytes.buffer);
      const numChannels = 1;
      const sampleRate = 24000;
      
      const frameCount = dataInt16.length / numChannels;
      const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
      
      for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
          channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
      }
      return buffer;
    } catch (e) {
      console.error("Decoding error", e);
      return null;
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] flex flex-col bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden relative">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
             <div className="w-10 h-10 bg-gradient-to-tr from-teal-600 to-teal-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
               <Bot size={22} />
             </div>
             <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Aijaz Assistant</h3>
            <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">Smart AI Mode</p>
          </div>
        </div>
      </div>

      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 animate-fade-in-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-md ${
              msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-gradient-to-br from-teal-500 to-teal-700 text-white'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-5 py-3.5 rounded-2xl shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-tr-sm' 
                  : 'bg-white dark:bg-slate-700/80 border border-slate-100 dark:border-slate-600 text-slate-800 dark:text-slate-200 rounded-tl-sm'
              }`}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
              </div>
              
              {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                 <div className="mt-2 text-xs flex flex-wrap gap-2">
                    {msg.groundingUrls.map((url, idx) => (
                      <a 
                        key={idx} 
                        href={url.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors border border-blue-100 dark:border-blue-800"
                      >
                        <Globe size={10} /> {url.title}
                      </a>
                    ))}
                 </div>
              )}

              {msg.role === 'model' && (
                <button 
                  onClick={() => handleTTS(msg.text)}
                  className="mt-1 ml-1 text-slate-400 hover:text-teal-500 transition-colors p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                  title="Read Aloud"
                >
                  <Volume2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-4 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white shadow-md">
              <Sparkles size={14} />
            </div>
            <div className="bg-white dark:bg-slate-700/80 px-6 py-4 rounded-2xl rounded-tl-sm border border-slate-100 dark:border-slate-600 flex items-center gap-1.5 shadow-sm">
               <div className="w-2 h-2 bg-teal-500 rounded-full animate-[bounce_1s_infinite_0ms]"></div>
               <div className="w-2 h-2 bg-teal-500 rounded-full animate-[bounce_1s_infinite_200ms]"></div>
               <div className="w-2 h-2 bg-teal-500 rounded-full animate-[bounce_1s_infinite_400ms]"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-10">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Aijaz anything about your money..."
            className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white placeholder-slate-400 transition-all shadow-inner"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white p-3.5 rounded-2xl transition-all shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 active:scale-95"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;