import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Radio, AlertCircle } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

const VoiceAssistant: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [volume, setVolume] = useState(0);
  const isRunningRef = useRef(false);
  
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  
  const stopSession = () => {
    isRunningRef.current = false;
    
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => {
         try { session.close(); } catch(e) {}
      }).catch(() => {});
      sessionPromiseRef.current = null;
    }
    
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
    
    if (inputAudioCtxRef.current) {
      try { inputAudioCtxRef.current.close(); } catch(e) {}
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      try { outputAudioCtxRef.current.close(); } catch(e) {}
      outputAudioCtxRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (status !== 'error') setStatus('idle');
    setVolume(0);
  };

  const startSession = async () => {
    if (isRunningRef.current) return;
    
    setErrorMessage('');
    setStatus('connecting');
    isRunningRef.current = true;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      
      if (inputCtx.state === 'suspended') await inputCtx.resume();
      if (outputCtx.state === 'suspended') await outputCtx.resume();

      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = 0;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const analyzer = inputCtx.createAnalyser();
      const source = inputCtx.createMediaStreamSource(stream);
      source.connect(analyzer);
      const dataArray = new Uint8Array(analyzer.frequencyBinCount);
      
      const updateVolume = () => {
        if (!isRunningRef.current) return;
        analyzer.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setVolume(avg);
        requestAnimationFrame(updateVolume);
      };
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: 'You are Aijaz, a helpful and professional financial voice assistant. Keep answers concise. Use Indian Rupees for currency.'
        },
        callbacks: {
          onopen: () => {
            if (!isRunningRef.current) return;
            setStatus('active');
            updateVolume();

            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              if (!isRunningRef.current) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const pcm16 = floatTo16BitPCM(inputData);
              const base64Data = arrayBufferToBase64(pcm16);
              
              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => {
                    try {
                        session.sendRealtimeInput({
                            media: { mimeType: 'audio/pcm;rate=16000', data: base64Data }
                        });
                    } catch(err) { console.error(err); }
                }).catch(() => {});
              }
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
             if (!isRunningRef.current) return;
             const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio) {
                try {
                  const audioBuffer = await decodeAudioData(base64Audio, outputCtx);
                  const currentTime = outputCtx.currentTime;
                  if (nextStartTimeRef.current < currentTime) nextStartTimeRef.current = currentTime;
                  const sourceNode = outputCtx.createBufferSource();
                  sourceNode.buffer = audioBuffer;
                  sourceNode.connect(outputCtx.destination);
                  sourceNode.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += audioBuffer.duration;
                  sourcesRef.current.add(sourceNode);
                  sourceNode.onended = () => sourcesRef.current.delete(sourceNode);
                } catch (err) { console.error(err); }
             }
             if (msg.serverContent?.interrupted) {
               sourcesRef.current.forEach(s => { try { s.stop(); } catch(e){} });
               sourcesRef.current.clear();
               nextStartTimeRef.current = 0;
             }
          },
          onclose: () => {
             if (isRunningRef.current) stopSession();
          },
          onerror: (e) => {
             setErrorMessage("Connection failed. Check network or API Key.");
             setStatus('error');
             isRunningRef.current = false;
             if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
          }
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (error: any) {
      setErrorMessage(error.message || "Access error.");
      setStatus('error');
      isRunningRef.current = false;
    }
  };

  const handleRetry = () => {
    setStatus('idle');
    setErrorMessage('');
  };

  const floatTo16BitPCM = (input: Float32Array) => {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output.buffer;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decodeAudioData = async (base64: string, ctx: AudioContext) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const dataInt16 = new Int16Array(bytes.buffer);
    const numChannels = 1;
    const sampleRate = 24000;
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
       const channelData = buffer.getChannelData(channel);
       for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] bg-slate-900 rounded-2xl relative overflow-hidden">
      {status === 'active' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className="w-64 h-64 bg-teal-500/20 rounded-full animate-ping absolute"></div>
           <div className="w-96 h-96 bg-teal-500/10 rounded-full animate-pulse absolute"></div>
        </div>
      )}
      <div className="z-10 text-center space-y-8 p-6">
        <div className="relative">
          <button 
            onClick={status === 'active' || status === 'connecting' ? stopSession : status === 'error' ? handleRetry : startSession}
            disabled={status === 'connecting'}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl relative z-20 ${
              status === 'active' ? 'bg-rose-500 hover:bg-rose-600 scale-110' : 
              status === 'connecting' ? 'bg-amber-500 cursor-not-allowed' : 
              status === 'error' ? 'bg-slate-700' : 'bg-teal-600 hover:bg-teal-500 hover:scale-105'
            }`}
          >
            {status === 'active' ? <MicOff size={48} className="text-white" /> : 
             status === 'error' ? <AlertCircle size={48} className="text-red-400" /> : <Mic size={48} className="text-white" />}
            {status === 'connecting' && <div className="absolute inset-0 rounded-full border-4 border-t-white border-white/20 animate-spin"></div>}
          </button>
          {status === 'active' && <div className="absolute inset-0 rounded-full border-4 border-white/30 transition-all duration-75" style={{ transform: `scale(${1 + volume / 100})` }}></div>}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {status === 'idle' && "Tap to Speak"}
            {status === 'connecting' && "Connecting..."}
            {status === 'active' && "Listening..."}
            {status === 'error' && "Connection Failed"}
          </h2>
          <p className="text-slate-400 max-w-sm mx-auto h-12 flex items-center justify-center text-sm">
            {status === 'error' ? errorMessage : "Aijaz financial voice assistant is ready."}
          </p>
        </div>
        {status === 'active' && (
           <div className="flex items-center justify-center gap-2 text-teal-400 text-sm">
             <Radio size={16} className="animate-pulse" />
             <span>Live Audio Feed</span>
           </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAssistant;