import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Mic,
  MicOff,
  Send,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  RotateCcw,
  User,
  Thermometer,
  Heart,
  Zap,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Dices,
  Sparkles
} from 'lucide-react';
import { TriageResult, VitalSigns } from '../types';
import { SYMPTOM_PRESETS, SymptomPreset, generateRandomPatientCase } from '../data/symptomPresets';

interface TriageViewProps {
  selectedLanguage: string;
  onSaveToHistory: (record: { symptoms: string; patientName?: string; result: TriageResult; language: string }) => void;
  onTriggerEmergencyModal: () => void;
}

export const TriageView: React.FC<TriageViewProps> = ({
  selectedLanguage,
  onSaveToHistory,
  onTriggerEmergencyModal
}) => {
  const [symptoms, setSymptoms] = useState('');
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'child' | 'infant' | 'other'>('female');
  
  // Vitals State
  const [showVitals, setShowVitals] = useState(false);
  const [vitals, setVitals] = useState<VitalSigns>({
    temperature: '',
    bpSystolic: '',
    bpDiastolic: '',
    pulseRate: '',
    spo2: '',
    respiratoryRate: ''
  });

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // API Call State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TriageResult | null>(null);

  // Audio Text-to-Speech State
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);

  // Speech synthesis effect cleanup
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Voice recording toggle handler
  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64data = reader.result as string;
            setAudioBase64(base64data);
          };
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        setError(null);
      } catch (err) {
        console.error('Microphone error:', err);
        setError('Could not access microphone. Please allow microphone permissions or type symptoms.');
      }
    }
  };

  // Preset Selection
  const applyPreset = (preset: SymptomPreset) => {
    setSymptoms(preset.description);
    setAge(preset.age);
    setGender(preset.gender);
    if (preset.patientName) setPatientName(preset.patientName);
    if (preset.vitals) {
      setVitals(preset.vitals);
      setShowVitals(true);
    }
    setResult(null);
    setError(null);
  };

  // Generate completely random patient data
  const handleGenerateRandomData = () => {
    const randomCase = generateRandomPatientCase();
    applyPreset(randomCase);
  };

  // Submit Triage Request
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!symptoms.trim() && !audioBase64) {
      setError('Please enter patient symptoms or record a voice audio message.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms,
          targetLanguage: selectedLanguage,
          patientDemographics: {
            age,
            gender,
            patientName: patientName || 'Unregistered PHC Patient'
          },
          vitals,
          audioBase64,
          mimeType: 'audio/webm'
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Triage analysis failed');
      }

      setResult(data.result);
      onSaveToHistory({
        symptoms: symptoms || 'Voice recording analyzed',
        patientName: patientName || 'Patient',
        result: data.result,
        language: selectedLanguage
      });

      if (data.result.urgencyLevel === 'RED') {
        onTriggerEmergencyModal();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while assessing triage urgency.');
    } finally {
      setLoading(false);
    }
  };

  // Text-To-Speech Playback
  const playSpeech = () => {
    if (!result) return;
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported on this browser.');
      return;
    }

    if (isPlayingSpeech) {
      window.speechSynthesis.cancel();
      setIsPlayingSpeech(false);
      return;
    }

    const textToRead = `${result.urgencyTitle}. ${result.urgencyReasoning}. ${result.actionPlan.join('. ')}. ${result.firstAidAdvice.join('. ')}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.9;

    utterance.onend = () => setIsPlayingSpeech(false);
    utterance.onerror = () => setIsPlayingSpeech(false);

    setIsPlayingSpeech(true);
    window.speechSynthesis.speak(utterance);
  };

  const resetForm = () => {
    setSymptoms('');
    setPatientName('');
    setAge('');
    setGender('female');
    setVitals({ temperature: '', bpSystolic: '', bpDiastolic: '', pulseRate: '', spo2: '', respiratoryRate: '' });
    setAudioBase64(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Presets */}
      <div className="card-tech p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00FFFF]/10 border border-[#00FFFF]/30 text-[#00FFFF] flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-syne font-extrabold tracking-tight text-white uppercase">
              PHC Triage Engine <span className="text-[#00FFFF] font-normal text-sm font-sans">[रोगी प्राथमिकता]</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Input patient symptoms in regional language via voice or text terminal. Classifies urgency (RED, YELLOW, GREEN) and deploys instant PHC clinical protocols.
          </p>
        </div>

        {/* Quick Test Presets */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <span className="text-xs font-mono-tech text-[#00FFFF] shrink-0">Presets:</span>
          {SYMPTOM_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className={`text-[11px] px-3 py-1.5 rounded-xl border font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                preset.category === 'Emergency'
                  ? 'bg-[#FF3E3E]/10 border-[#FF3E3E]/40 text-[#FF3E3E] hover:bg-[#FF3E3E]/20'
                  : preset.category === 'Priority'
                  ? 'bg-[#FFB800]/10 border-[#FFB800]/40 text-[#FFB800] hover:bg-[#FFB800]/20'
                  : 'bg-[#00FF9D]/10 border-[#00FF9D]/40 text-[#00FF9D] hover:bg-[#00FF9D]/20'
              }`}
            >
              <Zap className="w-3 h-3" />
              {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input Terminal Card */}
        <div className="lg:col-span-5 space-y-5">
          <form onSubmit={handleSubmit} className="card-tech p-6 space-y-5">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="meta-label">[Input Terminal]</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateRandomData}
                  className="text-xs text-[#00FFFF] hover:text-white font-mono-tech flex items-center gap-1.5 bg-[#00FFFF]/10 border border-[#00FFFF]/30 px-2.5 py-1 rounded-lg transition-all"
                >
                  <Dices className="w-3.5 h-3.5" />
                  Auto-Fill Test Case
                </button>
                {result && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs text-[#FF3E3E] hover:underline font-mono-tech flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Patient Info */}
            <div className="space-y-3">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono-tech">
                Patient Information
              </label>
              
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-6">
                  <input
                    type="text"
                    placeholder="Patient Name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full bg-[#122245] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-[#00FFFF] focus:outline-none focus:ring-1 focus:ring-[#00FFFF]"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    placeholder="Age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-[#122245] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-[#00FFFF] focus:outline-none focus:ring-1 focus:ring-[#00FFFF]"
                  />
                </div>
                <div className="col-span-3">
                  <select
                    value={gender}
                    onChange={(e: any) => setGender(e.target.value)}
                    className="w-full bg-[#122245] border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:border-[#00FFFF] focus:outline-none cursor-pointer"
                  >
                    <option value="female" className="bg-[#0A1430]">Female</option>
                    <option value="male" className="bg-[#0A1430]">Male</option>
                    <option value="child" className="bg-[#0A1430]">Child</option>
                    <option value="infant" className="bg-[#0A1430]">Infant</option>
                    <option value="other" className="bg-[#0A1430]">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Vitals Sensors Section */}
            <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0A1430]/50">
              <button
                type="button"
                onClick={() => setShowVitals(!showVitals)}
                className="w-full bg-[#122245]/70 hover:bg-[#122245] px-3.5 py-2.5 text-left flex items-center justify-between text-xs font-semibold text-white transition-all"
              >
                <span className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-[#00FFFF]" />
                  <span className="font-mono-tech text-[11px]">[Vitals Sensors & Measurements]</span>
                </span>
                {showVitals ? <ChevronUp className="w-4 h-4 text-[#00FFFF]" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {showVitals && (
                <div className="p-3.5 bg-[#0A1430] grid grid-cols-3 gap-2.5 border-t border-white/10">
                  <div>
                    <label className="block text-[10px] font-mono-tech text-slate-400 mb-1">Temp (°F)</label>
                    <input
                      type="text"
                      placeholder="e.g. 101.5"
                      value={vitals.temperature || ''}
                      onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                      className="w-full bg-[#122245] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono-tech text-slate-400 mb-1">BP (Systolic)</label>
                    <input
                      type="text"
                      placeholder="e.g. 140"
                      value={vitals.bpSystolic || ''}
                      onChange={(e) => setVitals({ ...vitals, bpSystolic: e.target.value })}
                      className="w-full bg-[#122245] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono-tech text-slate-400 mb-1">BP (Diastolic)</label>
                    <input
                      type="text"
                      placeholder="e.g. 90"
                      value={vitals.bpDiastolic || ''}
                      onChange={(e) => setVitals({ ...vitals, bpDiastolic: e.target.value })}
                      className="w-full bg-[#122245] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono-tech text-slate-400 mb-1">Pulse (bpm)</label>
                    <input
                      type="text"
                      placeholder="e.g. 88"
                      value={vitals.pulseRate || ''}
                      onChange={(e) => setVitals({ ...vitals, pulseRate: e.target.value })}
                      className="w-full bg-[#122245] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono-tech text-slate-400 mb-1">SpO2 (%)</label>
                    <input
                      type="text"
                      placeholder="e.g. 96"
                      value={vitals.spo2 || ''}
                      onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                      className="w-full bg-[#122245] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono-tech text-slate-400 mb-1">Resp Rate</label>
                    <input
                      type="text"
                      placeholder="e.g. 20"
                      value={vitals.respiratoryRate || ''}
                      onChange={(e) => setVitals({ ...vitals, respiratoryRate: e.target.value })}
                      className="w-full bg-[#122245] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Symptoms Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono-tech">
                  Symptoms Analysis ({selectedLanguage})
                </label>
              </div>

              <textarea
                rows={4}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="मरीज को 2 दिन से बहुत तेज बुखार है... Describe symptoms or record voice."
                className="w-full bg-[#122245] border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:border-[#00FFFF] focus:outline-none focus:ring-1 focus:ring-[#00FFFF] resize-none leading-relaxed"
              />

              {/* Voice Recording Control Bar */}
              <div className="flex items-center justify-between bg-[#122245] border border-white/10 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isRecording
                        ? 'bg-[#FF3E3E] text-white animate-bounce glow-red'
                        : 'bg-[#00FFFF] text-[#050A1A] hover:opacity-90 glow-cyan'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <div>
                    <p className="text-xs font-bold text-white">
                      {isRecording ? '🔴 Recording live audio... Speak now' : 'Voice Input (आवाज से दर्ज करें)'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {isRecording
                        ? 'Click mic icon again when done'
                        : audioBase64
                        ? '✓ Audio captured successfully'
                        : 'Hands-free voice transcription for CHWs'}
                    </p>
                  </div>
                </div>

                {audioBase64 && !isRecording && (
                  <span className="text-[10px] font-mono-tech bg-[#00FF9D]/15 text-[#00FF9D] border border-[#00FF9D]/30 px-2 py-1 rounded-md font-semibold">
                    ✓ AUDIO_SAVED
                  </span>
                )}
              </div>
            </div>

            {/* Submit CTA Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00FFFF] hover:bg-[#33ffff] text-[#050A1A] font-syne font-extrabold text-sm uppercase py-4 px-6 rounded-2xl glow-cyan flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed tracking-wider"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#050A1A] border-t-transparent rounded-full animate-spin" />
                  Running Neural Triage...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 12l5 5L20 7"></path>
                  </svg>
                  Begin Urgency Analysis
                </>
              )}
            </button>

            {error && (
              <div className="p-3 bg-[#FF3E3E]/10 border border-[#FF3E3E]/40 rounded-xl text-[#FF3E3E] text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#FF3E3E] shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

          </form>
        </div>

        {/* Right Column: Output / Result Terminal */}
        <div className="lg:col-span-7">
          
          {/* Empty State */}
          {!result && !loading && (
            <div className="card-tech p-10 flex flex-col items-center justify-center text-center min-h-[500px] h-full">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#00FFFF] flex items-center justify-center mb-6 text-[#00FFFF] opacity-80 glow-cyan">
                <Heart className="w-10 h-10 animate-pulse" />
              </div>
              <h3 className="font-syne font-extrabold text-3xl mb-3 uppercase tracking-tight text-white">
                Analysis Queue Empty
              </h3>
              <p className="text-slate-400 max-w-lg leading-relaxed text-sm mb-6">
                Enter patient details or record voice data to generate a Triage Report. AI will categorize urgency into <span className="text-[#FF3E3E] font-bold">RED</span>, <span className="text-[#FFB800] font-bold">YELLOW</span>, or <span className="text-[#00FF9D] font-bold">GREEN</span> status with step-by-step PHC care pathways.
              </p>
              <button
                type="button"
                onClick={handleGenerateRandomData}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#122245] border border-[#00FFFF] text-white text-xs font-mono-tech hover:bg-[#00FFFF] hover:text-[#050A1A] transition-all glow-cyan cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#00FFFF]" />
                Auto-Fill Test Case
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="card-tech p-10 flex flex-col items-center justify-center text-center min-h-[500px] h-full space-y-4">
              <div className="w-16 h-16 border-4 border-[#00FFFF] border-t-transparent rounded-full animate-spin glow-cyan" />
              <div className="space-y-1">
                <div className="meta-label">SYS_PROCESSING: NEURAL_TRIAGE</div>
                <h3 className="font-syne text-xl text-white font-bold">Evaluating Symptoms in {selectedLanguage}...</h3>
                <p className="text-xs text-slate-400">Classifying 3-tier risk stratification, vitals ranges, and red flag escalations.</p>
              </div>
            </div>
          )}

          {/* Full Result State */}
          {result && (
            <div className="card-tech p-6 space-y-5 animate-in fade-in duration-300">
              
              {/* Urgency Status Banner */}
              <div
                className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  result.urgencyLevel === 'RED'
                    ? 'bg-[#FF3E3E]/10 border-[#FF3E3E]/60 text-[#FF3E3E] glow-red'
                    : result.urgencyLevel === 'YELLOW'
                    ? 'bg-[#FFB800]/10 border-[#FFB800]/60 text-[#FFB800]'
                    : 'bg-[#00FF9D]/10 border-[#00FF9D]/60 text-[#00FF9D]'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      result.urgencyLevel === 'RED'
                        ? 'bg-[#FF3E3E] text-white animate-pulse glow-red'
                        : result.urgencyLevel === 'YELLOW'
                        ? 'bg-[#FFB800] text-black font-bold'
                        : 'bg-[#00FF9D] text-black font-bold'
                    }`}
                  >
                    {result.urgencyLevel === 'RED' ? (
                      <AlertTriangle className="w-7 h-7" />
                    ) : result.urgencyLevel === 'YELLOW' ? (
                      <AlertCircle className="w-7 h-7" />
                    ) : (
                      <CheckCircle2 className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tech text-xs uppercase px-2 py-0.5 rounded bg-black/40 border border-current font-bold">
                        STATUS: {result.urgencyLevel} PRIORITY
                      </span>
                      <span className="text-xs text-slate-300 font-medium">
                        Dept: {result.recommendedSpecialist}
                      </span>
                    </div>
                    <h3 className="font-syne font-extrabold text-2xl mt-1 text-white leading-tight">
                      {result.urgencyTitle}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono-tech mt-0.5">
                      {result.urgencyTitleEnglish}
                    </p>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={playSpeech}
                    className="bg-[#122245] hover:bg-[#1c3260] text-white text-xs font-mono-tech px-3.5 py-2.5 rounded-xl border border-white/10 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {isPlayingSpeech ? <VolumeX className="w-4 h-4 text-[#FF3E3E]" /> : <Volume2 className="w-4 h-4 text-[#00FFFF]" />}
                    {isPlayingSpeech ? 'STOP_VOICE' : 'AUDIO_SUMMARY'}
                  </button>

                  {result.urgencyLevel === 'RED' && (
                    <button
                      onClick={onTriggerEmergencyModal}
                      className="emergency-pill cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      108 REFERRAL
                    </button>
                  )}
                </div>
              </div>

              {/* Assessment Reasoning */}
              <div className="bg-[#122245] border border-white/10 rounded-2xl p-4 space-y-1">
                <div className="meta-label">[Clinical Reasoning & Assessment]</div>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {result.urgencyReasoning}
                </p>
              </div>

              {/* Action Plan & First Aid 2-col */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Immediate Action Plan */}
                <div className="bg-[#122245]/60 border border-[#00FFFF]/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[#00FFFF] font-syne font-bold text-xs uppercase tracking-wider">
                    <Zap className="w-4 h-4" />
                    Immediate PHC Staff Protocols
                  </div>
                  <ul className="space-y-2 text-xs text-slate-200">
                    {result.actionPlan.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#00FFFF] text-[#050A1A] text-[11px] font-mono-tech font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-snug">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Safe First Aid & Comfort */}
                <div className="bg-[#122245]/60 border border-[#00FF9D]/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[#00FF9D] font-syne font-bold text-xs uppercase tracking-wider">
                    <Heart className="w-4 h-4" />
                    Waiting Area Comfort & First Aid
                  </div>
                  <ul className="space-y-2 text-xs text-slate-200">
                    {result.firstAidAdvice.map((advice, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#00FF9D] font-bold">•</span>
                        <span className="leading-snug">{advice}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Red Flag Warnings */}
              {result.redFlagWarnings && result.redFlagWarnings.length > 0 && (
                <div className="bg-[#FF3E3E]/10 border border-[#FF3E3E]/40 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-[#FF3E3E] font-syne font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    Red-Flag Escalation Warnings (खतरे के संकेत)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {result.redFlagWarnings.map((warning, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-[#0A1430] p-2.5 rounded-xl border border-[#FF3E3E]/30 text-slate-200">
                        <span className="text-[#FF3E3E] font-bold">⚠️</span>
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Safety Disclaimer */}
              <div className="bg-[#0A1430] border border-white/10 rounded-xl p-3 text-center">
                <p className="text-[11px] text-slate-400">
                  <span className="text-[#00FFFF] font-mono-tech font-bold">[SAFETY_NOTICE]:</span> {result.disclaimer}
                </p>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
