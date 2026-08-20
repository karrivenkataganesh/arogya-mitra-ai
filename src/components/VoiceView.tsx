import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Radio,
  Sparkles,
  AlertCircle,
  Square,
  Play,
  HeartPulse,
  RefreshCw,
  MessageSquare,
  Bot,
  User,
  Zap,
  ShieldCheck
} from 'lucide-react';

interface VoiceViewProps {
  selectedLanguage: string;
}

interface TranscriptMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const VoiceView: React.FC<VoiceViewProps> = ({ selectedLanguage }) => {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceName, setVoiceName] = useState<string>('Zephyr');
  const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([]);
  const [userText, setUserText] = useState<string>('');

  // Audio & WS Refs
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef<number>(0);
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll transcriptions
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopLiveSession();
    };
  }, []);

  const floatTo16BitPCM = (input: Float32Array): ArrayBuffer => {
    const output = new DataView(new ArrayBuffer(input.length * 2));
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return output.buffer;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const pcmToAudioBuffer = (
    base64Data: string,
    audioCtx: AudioContext,
    sampleRate = 24000
  ): AudioBuffer => {
    const binaryString = window.atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const dataView = new DataView(bytes.buffer);
    const numSamples = Math.floor(len / 2);
    const audioBuffer = audioCtx.createBuffer(1, numSamples, sampleRate);
    const channelData = audioBuffer.getChannelData(0);

    for (let i = 0; i < numSamples; i++) {
      const int16 = dataView.getInt16(i * 2, true);
      channelData[i] = int16 < 0 ? int16 / 0x8000 : int16 / 0x7fff;
    }

    return audioBuffer;
  };

  const queueAudioPlayback = (base64Audio: string) => {
    if (!outputAudioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      outputAudioCtxRef.current = new AudioCtx({ sampleRate: 24000 });
    }

    const audioCtx = outputAudioCtxRef.current;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    try {
      const buffer = pcmToAudioBuffer(base64Audio, audioCtx, 24000);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);

      const currentTime = audioCtx.currentTime;
      const startTime = Math.max(currentTime, nextStartTimeRef.current);
      source.start(startTime);
      nextStartTimeRef.current = startTime + buffer.duration;

      activeSourcesRef.current.push(source);
      setIsSpeaking(true);

      source.onended = () => {
        const index = activeSourcesRef.current.indexOf(source);
        if (index > -1) {
          activeSourcesRef.current.splice(index, 1);
        }
        if (activeSourcesRef.current.length === 0) {
          setIsSpeaking(false);
        }
      };
    } catch (e) {
      console.error('Error decoding/playing PCM audio chunk:', e);
    }
  };

  const stopAndClearPlayback = () => {
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Ignored
      }
    });
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
    setIsSpeaking(false);
  };

  const startLiveSession = async () => {
    setErrorMessage(null);
    setStatus('connecting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const inputAudioCtx = new AudioCtx({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputAudioCtx;

      const outputAudioCtx = new AudioCtx({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputAudioCtx;
      nextStartTimeRef.current = outputAudioCtx.currentTime;

      const source = inputAudioCtx.createMediaStreamSource(stream);
      const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMuted || status !== 'connected') return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16Buffer = floatTo16BitPCM(inputData);
        const base64Audio = arrayBufferToBase64(pcm16Buffer);

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              realtimeInput: {
                mediaChunks: [
                  {
                    mimeType: 'audio/pcm;rate=16000',
                    data: base64Audio
                  }
                ]
              }
            })
          );
        }
      };

      source.connect(processor);
      processor.connect(inputAudioCtx.destination);

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            setup: {
              language: selectedLanguage,
              voice: voiceName
            }
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'ready') {
            setStatus('connected');
            setIsListening(true);
          } else if (data.type === 'interrupted') {
            stopAndClearPlayback();
          } else if (data.type === 'audio') {
            if (data.data) {
              queueAudioPlayback(data.data);
            }
          } else if (data.type === 'transcript') {
            setTranscripts((prev) => [
              ...prev,
              {
                id: 'tx_' + Date.now(),
                sender: data.sender || 'assistant',
                text: data.text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]);
          } else if (data.type === 'error') {
            setErrorMessage(data.error || 'Live connection error occurred.');
            setStatus('error');
          } else if (data.type === 'close') {
            stopLiveSession();
          }
        } catch (e) {
          console.error('Error handling WebSocket message:', e);
        }
      };

      ws.onerror = (e) => {
        console.error('WebSocket Error:', e);
        setErrorMessage('Failed to connect to Live API server WebSocket.');
        setStatus('error');
      };

      ws.onclose = () => {
        if (status !== 'error') {
          setStatus('disconnected');
        }
        setIsListening(false);
      };
    } catch (err: any) {
      console.error('Microphone or WS initialization error:', err);
      setErrorMessage(
        err.message || 'Microphone access denied or audio device error. Please allow mic permissions.'
      );
      setStatus('error');
    }
  };

  const stopLiveSession = () => {
    stopAndClearPlayback();

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus('disconnected');
    setIsListening(false);
    setIsSpeaking(false);
  };

  const handleSendTextMessage = () => {
    if (!userText.trim() || status !== 'connected' || !wsRef.current) return;
    const textToSend = userText.trim();
    setUserText('');

    wsRef.current.send(JSON.stringify({ text: textToSend }));

    setTranscripts((prev) => [
      ...prev,
      {
        id: 'tx_' + Date.now(),
        sender: 'user',
        text: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handlePresetPrompt = (prompt: string) => {
    if (status !== 'connected') {
      startLiveSession().then(() => {
        setTimeout(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ text: prompt }));
            setTranscripts((prev) => [
              ...prev,
              {
                id: 'tx_' + Date.now(),
                sender: 'user',
                text: prompt,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]);
          }
        }, 1200);
      });
    } else {
      wsRef.current?.send(JSON.stringify({ text: prompt }));
      setTranscripts((prev) => [
        ...prev,
        {
          id: 'tx_' + Date.now(),
          sender: 'user',
          text: prompt,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="card-tech p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF00FF]/10 border border-[#FF00FF]/30 text-[#FF00FF] flex items-center justify-center font-bold glow-magenta">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <h2 className="text-xl font-syne font-extrabold tracking-tight text-white uppercase">
              Gemini 3.1 Live Voice Stream <span className="text-[#FF00FF] font-normal text-sm font-sans">[लाइव आवाज]</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Hands-free bidirectional real-time audio assistant for rapid patient triage, verbal prescription reading, and field guidance in {selectedLanguage}.
          </p>
        </div>

        {/* Status Indicator Pill */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-[#122245] border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-mono-tech text-white">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                status === 'connected'
                  ? 'bg-[#00FF9D] animate-ping'
                  : status === 'connecting'
                  ? 'bg-[#FFB800] animate-pulse'
                  : status === 'error'
                  ? 'bg-[#FF3E3E]'
                  : 'bg-slate-500'
              }`}
            />
            <span className="uppercase">
              {status === 'connected'
                ? 'ONLINE_STREAM_ACTIVE'
                : status === 'connecting'
                ? 'CONNECTING_GEMINI_LIVE...'
                : status === 'error'
                ? 'STREAM_ERROR'
                : 'STREAM_IDLE'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Voice Orb & Controls */}
        <div className="lg:col-span-5 space-y-5">
          <div className="card-tech p-6 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[400px]">
            
            {/* Visualizer Background Pulse */}
            {status === 'connected' && (
              <div
                className={`absolute inset-0 transition-opacity duration-500 pointer-events-none flex items-center justify-center ${
                  isSpeaking ? 'opacity-40' : isListening ? 'opacity-25' : 'opacity-10'
                }`}
              >
                <div className="w-80 h-80 rounded-full bg-[#FF00FF] blur-3xl animate-pulse" />
              </div>
            )}

            {/* Central Animated Mic Orb */}
            <div className="relative z-10 mb-6">
              <div
                className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                  status === 'connected'
                    ? isSpeaking
                      ? 'bg-[#FF00FF] text-white scale-110 glow-magenta ring-8 ring-[#FF00FF]/30'
                      : isListening
                      ? 'bg-[#00FFFF] text-[#050A1A] scale-105 glow-cyan ring-8 ring-[#00FFFF]/30'
                      : 'bg-[#122245] text-white ring-4 ring-white/10'
                    : status === 'connecting'
                    ? 'bg-[#FFB800]/20 text-[#FFB800] animate-pulse border-2 border-[#FFB800]'
                    : status === 'error'
                    ? 'bg-[#FF3E3E]/20 text-[#FF3E3E] border-2 border-[#FF3E3E]'
                    : 'bg-[#122245] text-slate-400 border border-white/10'
                }`}
              >
                {status === 'connecting' ? (
                  <RefreshCw className="w-12 h-12 animate-spin text-[#FFB800]" />
                ) : status === 'connected' ? (
                  isSpeaking ? (
                    <Volume2 className="w-14 h-14 animate-bounce" />
                  ) : (
                    <Mic className="w-14 h-14 animate-pulse" />
                  )
                ) : (
                  <Radio className="w-12 h-12 text-[#00FFFF]" />
                )}
              </div>

              {/* Status Badge below Orb */}
              {status === 'connected' && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#050A1A] text-white text-[10px] font-mono-tech font-bold px-3 py-1 rounded-full shadow border border-white/20 whitespace-nowrap flex items-center gap-1.5 glow-cyan">
                  <Sparkles className="w-3 h-3 text-[#00FFFF]" />
                  {isSpeaking ? 'ASSISTANT_SPEAKING...' : isListening ? 'LISTENING_TO_MIC...' : 'READY — SPEAK NOW'}
                </div>
              )}
            </div>

            {/* Status Title & Instructions */}
            <div className="relative z-10 space-y-1 max-w-sm">
              <h3 className="text-xl font-syne font-extrabold text-white">
                {status === 'connected'
                  ? 'Neural Voice Channel Connected'
                  : status === 'connecting'
                  ? 'Initializing Live WebSocket Stream...'
                  : 'Start Hands-Free Voice Channel'}
              </h3>
              <p className="text-xs text-slate-400">
                {status === 'connected'
                  ? 'Speak naturally in regional language. ArogyaMitra AI streams back natural spoken speech in real-time.'
                  : 'Click below to initiate bidirectional low-latency audio streaming powered by Gemini 3.1 Live API.'}
              </p>
            </div>

            {/* Main Action Buttons */}
            <div className="relative z-10 mt-6 w-full max-w-xs space-y-3">
              {status === 'disconnected' || status === 'error' ? (
                <button
                  onClick={startLiveSession}
                  className="w-full bg-[#00FFFF] hover:bg-[#33ffff] text-[#050A1A] font-syne font-extrabold text-xs uppercase py-4 px-6 rounded-2xl glow-cyan transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 tracking-wider"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Start Live Voice Session
                </button>
              ) : status === 'connecting' ? (
                <button
                  disabled
                  className="w-full bg-[#122245] text-slate-400 font-mono-tech text-xs py-4 px-6 rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed border border-white/10"
                >
                  <RefreshCw className="w-4 h-4 animate-spin text-[#00FFFF]" />
                  CONNECTING_TO_LIVE_API...
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-mono-tech font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                      isMuted
                        ? 'bg-[#FF3E3E]/20 text-[#FF3E3E] border-[#FF3E3E]'
                        : 'bg-[#122245] text-slate-300 border-white/10 hover:border-[#00FFFF]'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-4 h-4 text-[#FF3E3E]" /> : <Mic className="w-4 h-4 text-[#00FFFF]" />}
                    {isMuted ? 'MIC_MUTED' : 'MUTE_MIC'}
                  </button>

                  <button
                    onClick={stopLiveSession}
                    className="flex-1 bg-[#FF3E3E] hover:bg-[#ff5555] text-white font-syne font-extrabold text-xs uppercase py-3 px-4 rounded-xl glow-red transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    End Session
                  </button>
                </div>
              )}
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="relative z-10 mt-4 p-3 bg-[#FF3E3E]/10 border border-[#FF3E3E]/40 rounded-xl text-[#FF3E3E] text-xs flex items-start gap-2 text-left w-full">
                <AlertCircle className="w-4 h-4 text-[#FF3E3E] shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}
          </div>

          {/* Quick Voice Starters */}
          <div className="card-tech p-4 space-y-3">
            <div className="meta-label">[Quick Spoken Prompts / 1-Click Questions]</div>
            <div className="grid grid-cols-1 gap-2">
              {[
                "मरीज को 102° बुखार और तेज ठंड लग रही है, प्राथमिक उपचार बताएं?",
                "What does '1-0-1 TDS after food' mean on a doctor prescription?",
                "सांप के काटने पर पीएचसी में क्या प्राथमिक कदम उठाने चाहिए?",
                "How to care for a toddler with mild dehydration and fever?"
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePresetPrompt(prompt)}
                  className="text-left text-xs bg-[#122245] hover:bg-[#1a3366] text-slate-300 hover:text-white border border-white/10 rounded-xl p-3 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span className="font-mono-tech line-clamp-1">"{prompt}"</span>
                  <MessageSquare className="w-3.5 h-3.5 text-[#00FFFF] group-hover:scale-110 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Transcripts & Text Fallback */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="card-tech p-5 flex-1 flex flex-col min-h-[500px]">
            
            {/* Transcript Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#00FFFF]" />
                <div className="meta-label">[Live Speech Transcription Feed]</div>
              </div>
              {transcripts.length > 0 && (
                <button
                  onClick={() => setTranscripts([])}
                  className="text-xs text-slate-400 hover:text-white font-mono-tech flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Clear Feed
                </button>
              )}
            </div>

            {/* Transcript Messages List */}
            <div
              ref={transcriptScrollRef}
              className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-[400px] min-h-[280px]"
            >
              {transcripts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#00FFFF]/10 border border-[#00FFFF]/30 text-[#00FFFF] flex items-center justify-center glow-cyan">
                    <Bot className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white font-syne uppercase">
                      No Spoken Turns Yet
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Start the live voice session and speak into your microphone, or type a text message below.
                    </p>
                  </div>
                </div>
              ) : (
                transcripts.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.sender === 'assistant' && (
                      <div className="w-7 h-7 rounded-lg bg-[#00FFFF]/20 border border-[#00FFFF] text-[#00FFFF] flex items-center justify-center shrink-0 text-xs font-bold mt-1 glow-cyan">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#FF00FF] text-white rounded-tr-none glow-magenta font-medium'
                          : 'bg-[#122245] text-slate-200 border border-white/10 rounded-tl-none font-medium'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1 border-b border-white/10 pb-0.5 opacity-80 font-mono-tech text-[10px]">
                        <span>
                          {msg.sender === 'user' ? 'USER_VOICE' : 'AROGYAMITRA_AI'}
                        </span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>

                    {msg.sender === 'user' && (
                      <div className="w-7 h-7 rounded-lg bg-[#FF00FF]/20 border border-[#FF00FF] text-[#FF00FF] flex items-center justify-center shrink-0 text-xs font-bold mt-1 glow-magenta">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Bottom Text Fallback */}
            <div className="pt-3 border-t border-white/10 mt-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendTextMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={userText}
                  onChange={(e) => setUserText(e.target.value)}
                  placeholder={
                    status === 'connected'
                      ? "Type text query or speak aloud into mic..."
                      : "Start voice session to enable live chat stream..."
                  }
                  disabled={status !== 'connected'}
                  className="flex-1 bg-[#122245] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-[#00FFFF] focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={status !== 'connected' || !userText.trim()}
                  className="bg-[#00FFFF] hover:bg-[#33ffff] disabled:opacity-40 text-[#050A1A] font-syne font-extrabold text-xs uppercase px-5 py-2.5 rounded-xl glow-cyan transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
                >
                  Send
                </button>
              </form>
            </div>
          </div>

          {/* Protocol Note */}
          <div className="card-tech p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#00FFFF] shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 space-y-1">
              <p className="font-syne font-bold text-white uppercase">
                Low-Latency Multimodal Stream
              </p>
              <p>
                WebSocket connection transmits bi-directional raw 16kHz PCM audio to <span className="text-[#00FFFF] font-mono-tech">gemini-3.1-flash-live-preview</span>.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
