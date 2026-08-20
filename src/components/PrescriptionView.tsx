import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Upload,
  Camera,
  Sparkles,
  AlertCircle,
  Sun,
  Moon,
  Coffee,
  Pill,
  Printer,
  RefreshCw,
  Eye,
  Info,
  Mic,
  MicOff,
  Square,
  FileAudio,
  Radio
} from 'lucide-react';
import { PrescriptionResult } from '../types';
import { SAMPLE_PRESCRIPTIONS, SamplePrescription } from '../data/samplePrescriptions';
import { PrintablePrescriptionSlip } from './PrintablePrescriptionSlip';

interface PrescriptionViewProps {
  selectedLanguage: string;
  onSaveToHistory: (record: { patientName?: string; result: PrescriptionResult; language: string }) => void;
}

export const PrescriptionView: React.FC<PrescriptionViewProps> = ({
  selectedLanguage,
  onSaveToHistory
}) => {
  const [inputMode, setInputMode] = useState<'image' | 'voice'>('image');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedMimeType, setSelectedMimeType] = useState<string>('image/png');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PrescriptionResult | null>(null);
  const [showPrintSlip, setShowPrintSlip] = useState<boolean>(false);

  // Voice & Dictation States
  const [dictatedText, setDictatedText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isAudioRecording, setIsAudioRecording] = useState<boolean>(false);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // File Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedMimeType(file.type || 'image/png');
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Sample Prescription Selection
  const handleSelectSample = (sample: SamplePrescription) => {
    setInputMode('image');
    setImagePreview(sample.imageUrl);
    setSelectedMimeType(sample.imageUrl.startsWith('data:image/svg+xml') ? 'image/svg+xml' : 'image/png');
    setResult(null);
    setError(null);
  };

  // Speech Recognition Control
  const toggleSpeechRecognition = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Browser live speech recognition is not supported in this environment. You can use audio recording or type below.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang =
        selectedLanguage === 'Hindi'
          ? 'hi-IN'
          : selectedLanguage === 'Tamil'
          ? 'ta-IN'
          : selectedLanguage === 'Bengali'
          ? 'bn-IN'
          : selectedLanguage === 'Telugu'
          ? 'te-IN'
          : selectedLanguage === 'Marathi'
          ? 'mr-IN'
          : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        setDictatedText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  // Audio Clip Recording Handler
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setAudioDuration(0);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioBase64(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
        if (timerRef.current) clearInterval(timerRef.current);
      };

      mediaRecorder.start();
      setIsAudioRecording(true);
      setError(null);

      timerRef.current = setInterval(() => {
        setAudioDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setError('Failed to access microphone. Please allow mic permissions.');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isAudioRecording) {
      mediaRecorderRef.current.stop();
      setIsAudioRecording(false);
    }
  };

  // Submit OCR / Voice Interpretation Request
  const handleAnalyzePrescription = async () => {
    if (inputMode === 'image' && !imagePreview) {
      setError('Please upload or select a prescription note photo first.');
      return;
    }

    if (inputMode === 'voice' && !dictatedText.trim() && !audioBase64) {
      setError('Please dictate text or record a voice prescription first.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload: any = {
        targetLanguage: selectedLanguage
      };

      if (inputMode === 'image') {
        payload.imageBase64 = imagePreview;
        payload.mimeType = selectedMimeType;
      } else {
        if (dictatedText.trim()) {
          payload.dictatedText = dictatedText.trim();
        }
        if (audioBase64) {
          payload.audioBase64 = audioBase64;
          payload.mimeType = 'audio/webm';
        }
      }

      const response = await fetch('/api/prescription/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze prescription.');
      }

      const resData = data.result as PrescriptionResult;
      if (inputMode === 'image' && imagePreview) {
        resData.imageUrl = imagePreview;
      }
      setResult(resData);

      onSaveToHistory({
        patientName: resData.patientNameFromRx || 'Prescription Patient',
        result: resData,
        language: selectedLanguage
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while interpreting the prescription.');
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setImagePreview(null);
    setDictatedText('');
    setAudioBase64(null);
    setResult(null);
    setError(null);
    if (isListening) toggleSpeechRecognition();
    if (isAudioRecording) stopAudioRecording();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="card-tech p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00FFFF]/10 border border-[#00FFFF]/30 text-[#00FFFF] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-syne font-extrabold tracking-tight text-white uppercase">
              Prescription Neural Decoder <span className="text-[#00FFFF] font-normal text-sm font-sans">[डॉक्टर पर्चा व्याख्या]</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Upload doctor prescriptions (handwritten/printed) or use voice dictation. Converts abbreviations (OD, BD, TDS, 1-0-1) into plain regional language schedules.
          </p>
        </div>

        {/* 1-Click Sample Notes */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-xs font-mono-tech text-[#00FFFF] shrink-0">Test Samples:</span>
          {SAMPLE_PRESCRIPTIONS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              className="text-[11px] px-3 py-1.5 rounded-xl border border-white/10 bg-[#122245] hover:border-[#00FFFF] text-slate-200 hover:text-white font-mono-tech transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-[#00FFFF]" />
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card-tech p-6 space-y-5">
            
            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#122245] rounded-xl border border-white/10">
              <button
                onClick={() => setInputMode('image')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  inputMode === 'image'
                    ? 'bg-[#00FFFF] text-[#050A1A] glow-cyan font-syne'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Photo Upload
              </button>
              <button
                onClick={() => setInputMode('voice')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  inputMode === 'voice'
                    ? 'bg-[#FF00FF] text-white glow-magenta font-syne'
                    : 'text-[#FF00FF] hover:bg-[#FF00FF]/10'
                }`}
              >
                <Mic className="w-3.5 h-3.5 animate-pulse" />
                Voice Dictation (बोलकर)
              </button>
            </div>

            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="meta-label">
                {inputMode === 'image' ? '[Prescription Photo]' : '[Voice Dictation Mode]'}
              </div>
              {(imagePreview || dictatedText || audioBase64) && (
                <button
                  onClick={resetAll}
                  className="text-xs text-slate-400 hover:text-white font-mono-tech flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Clear / Reset
                </button>
              )}
            </div>

            {/* Mode 1: Image Upload */}
            {inputMode === 'image' && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!imagePreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 hover:border-[#00FFFF] bg-[#122245]/50 hover:bg-[#122245] rounded-2xl p-8 text-center cursor-pointer transition-all group flex flex-col items-center justify-center min-h-[260px]"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#00FFFF]/10 border border-[#00FFFF]/40 text-[#00FFFF] flex items-center justify-center mb-3 group-hover:scale-110 transition-all glow-cyan">
                      <Upload className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-bold text-white font-syne">
                      Click or drag doctor prescription note here
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Supports JPG, PNG, WEBP photos of handwritten or printed medical prescriptions.
                    </p>

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          cameraInputRef.current?.click();
                        }}
                        className="bg-[#0A1430] border border-[#00FFFF]/40 text-[#00FFFF] hover:bg-[#00FFFF] hover:text-[#050A1A] text-xs font-mono-tech px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer glow-cyan"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Take Photo with Camera
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#050A1A] group">
                      <img
                        src={imagePreview}
                        alt="Prescription Preview"
                        className="w-full max-h-[380px] object-contain mx-auto"
                      />
                      <div className="absolute top-2 right-2 bg-[#050A1A]/90 backdrop-blur-md text-[#00FFFF] font-mono-tech text-[10px] font-bold px-2.5 py-1 rounded-md border border-[#00FFFF]/40 glow-cyan">
                        IMAGE_READY
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Mode 2: Voice Dictation */}
            {inputMode === 'voice' && (
              <div className="space-y-4">
                <div className="bg-[#122245] border border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono-tech">
                      <Radio className="w-4 h-4 text-[#FF00FF]" />
                      Spoken Prescription Stream
                    </span>
                    <span className="text-[10px] font-mono-tech text-[#00FFFF]">
                      LANG: {selectedLanguage}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleSpeechRecognition}
                      className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isListening
                          ? 'bg-[#FF3E3E] text-white animate-pulse glow-red'
                          : 'bg-[#FF00FF] text-white hover:opacity-90 glow-magenta font-syne'
                      }`}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-4 h-4" />
                          Stop Listening (रोकें)
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" />
                          Dictate Prescription Aloud
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={isAudioRecording ? stopAudioRecording : startAudioRecording}
                      className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                        isAudioRecording
                          ? 'bg-[#FF3E3E]/20 text-[#FF3E3E] border-[#FF3E3E] animate-pulse glow-red'
                          : 'bg-[#0A1430] text-white border-white/10 hover:border-[#00FFFF]'
                      }`}
                      title="Record Audio Clip"
                    >
                      {isAudioRecording ? (
                        <>
                          <Square className="w-4 h-4 fill-current text-[#FF3E3E]" />
                          <span>{audioDuration}s</span>
                        </>
                      ) : (
                        <>
                          <FileAudio className="w-4 h-4 text-[#00FFFF]" />
                          <span>Audio Clip</span>
                        </>
                      )}
                    </button>
                  </div>

                  {isListening && (
                    <div className="p-2.5 bg-[#FF00FF]/10 border border-[#FF00FF]/30 rounded-xl text-xs text-[#FF00FF] font-semibold flex items-center justify-between animate-pulse">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#FF00FF]" />
                        Listening now in {selectedLanguage}... Speak medicine names & dosage
                      </span>
                      <Mic className="w-4 h-4 text-[#FF00FF] animate-bounce" />
                    </div>
                  )}

                  {audioBase64 && !isAudioRecording && (
                    <div className="p-2.5 bg-[#00FF9D]/10 border border-[#00FF9D]/30 rounded-xl text-xs text-[#00FF9D] font-mono-tech flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FileAudio className="w-4 h-4 text-[#00FF9D]" />
                        VOICE_RECORDED ({audioDuration}s)
                      </span>
                      <button
                        onClick={() => setAudioBase64(null)}
                        className="text-[10px] underline text-[#00FF9D] hover:opacity-80 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Dictated Text Box */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between font-mono-tech">
                    <span>Dictated / Written Prescription Text:</span>
                    <span className="text-[10px] text-slate-500 font-normal">Editable</span>
                  </label>
                  <textarea
                    rows={4}
                    value={dictatedText}
                    onChange={(e) => setDictatedText(e.target.value)}
                    placeholder="e.g. Tab Paracetamol 650mg 1-0-1 TDS x 5 days after food, Cap Amoxicillin 500mg 1-1-1 x 5 days..."
                    className="w-full bg-[#122245] border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:border-[#00FFFF] focus:outline-none focus:ring-1 focus:ring-[#00FFFF] leading-relaxed resize-none"
                  />
                </div>

                {/* Quick Voice Preset Chips */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono-tech text-slate-400 uppercase tracking-wider block">
                    1-Click Dictation Samples:
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      "Tab Paracetamol 650mg 1-0-1 TDS after food x 5 days, Cap Amoxicillin 500mg 1-1-1 x 5 days",
                      "Tab Metformin 500mg BD before breakfast & dinner, Tab Telmisartan 40mg 1-0-0 OD morning for 30 days",
                      "Syrup Cefixime 100mg 5ml BD x 5 days, Syrup Paracetamol 120mg 5ml SOS for fever"
                    ].map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setDictatedText(preset)}
                        className="text-left text-[11px] bg-[#122245] hover:bg-[#1a3366] text-slate-300 hover:text-white border border-white/10 rounded-lg p-2 transition-all cursor-pointer truncate font-mono-tech"
                      >
                        "{preset}"
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Analyze Action Button */}
            <button
              onClick={handleAnalyzePrescription}
              disabled={loading}
              className="w-full bg-[#00FFFF] hover:bg-[#33ffff] disabled:opacity-50 text-[#050A1A] font-syne font-extrabold text-xs uppercase py-4 px-4 rounded-2xl glow-cyan flex items-center justify-center gap-2 transition-all cursor-pointer mt-3 tracking-wider"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#050A1A] border-t-transparent rounded-full animate-spin" />
                  Neural Decoding in {selectedLanguage}...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {inputMode === 'voice'
                    ? 'Decode Voice Prescription & Build Dosage Chart'
                    : 'Decode Prescription & Generate Dosage Chart'}
                </>
              )}
            </button>

            {error && (
              <div className="p-3 bg-[#FF3E3E]/10 border border-[#FF3E3E]/40 rounded-xl text-[#FF3E3E] text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#FF3E3E] shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

          </div>
        </div>

        {/* Right Column: Decoded Output */}
        <div className="lg:col-span-7">
          
          {!result && !loading && (
            <div className="card-tech p-10 flex flex-col items-center justify-center text-center min-h-[500px] h-full">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#00FFFF] flex items-center justify-center mb-6 text-[#00FFFF] opacity-80 glow-cyan">
                <Pill className="w-10 h-10 animate-pulse" />
              </div>
              <h3 className="font-syne font-extrabold text-3xl mb-3 uppercase tracking-tight text-white">
                Prescription Decoder Idle
              </h3>
              <p className="text-slate-400 max-w-lg leading-relaxed text-sm">
                Upload a doctor's prescription photo or dictate audio on the left. Gemini Vision decodes abbreviations (OD, BD, TDS, HS, SOS) and creates visual regional schedules for patients.
              </p>
            </div>
          )}

          {loading && (
            <div className="card-tech p-10 flex flex-col items-center justify-center text-center min-h-[500px] h-full space-y-4">
              <div className="w-16 h-16 border-4 border-[#00FFFF] border-t-transparent rounded-full animate-spin glow-cyan" />
              <div className="space-y-1">
                <div className="meta-label">SYS_PROCESSING: RX_OCR_NEURAL</div>
                <h3 className="font-syne text-xl text-white font-bold">Decoding Prescription Data...</h3>
                <p className="text-xs text-slate-400">Extracting handwriting, converting timing abbreviations into {selectedLanguage}.</p>
              </div>
            </div>
          )}

          {result && (
            <div className="card-tech p-6 space-y-5 animate-in fade-in duration-300">
              
              {!result.is_readable ? (
                <div className="p-5 bg-[#FFB800]/10 border border-[#FFB800]/50 rounded-2xl space-y-3 text-[#FFB800]">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-6 h-6 text-[#FFB800]" />
                    <h3 className="text-lg font-syne font-bold text-white">
                      Prescription Image Unreadable or Blurred
                    </h3>
                  </div>
                  <p className="text-xs text-slate-200">
                    {result.unreadableReason || 'The uploaded photo was too blurry or cut off to extract safe dosage information.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Doctor & Patient Banner */}
                  <div className="bg-[#122245] border border-white/10 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#00FFFF]/10 border border-[#00FFFF]/40 text-[#00FFFF] text-[10px] font-mono-tech font-bold px-2.5 py-0.5 rounded-full uppercase">
                          Decoded RX Slip
                        </span>
                        {result.doctorNameFromRx && (
                          <span className="text-xs text-slate-300 font-mono-tech">
                            Dr. {result.doctorNameFromRx}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-syne font-extrabold mt-1 text-white">
                        {result.patientNameFromRx ? `Patient: ${result.patientNameFromRx}` : 'Patient Prescription Summary'}
                      </h3>
                      {result.doctorNoteSummary && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Note: {result.doctorNoteSummary}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => setShowPrintSlip(true)}
                      className="bg-[#00FFFF] hover:bg-[#33ffff] text-[#050A1A] font-syne font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl flex items-center gap-2 glow-cyan transition-all shrink-0 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      Print Visual Slip
                    </button>
                  </div>

                  {/* Medicines List */}
                  <div className="space-y-3">
                    <div className="meta-label">[Prescribed Medicines & Dosage Instructions]</div>

                    {result.medicines.map((med, idx) => (
                      <div
                        key={med.id || idx}
                        className="bg-[#122245]/70 border border-white/10 hover:border-[#00FFFF]/50 rounded-2xl p-4 space-y-3 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-syne font-bold text-white text-base">
                                {idx + 1}. {med.medicineName}
                              </span>
                              <span className="text-[10px] font-mono-tech bg-white/10 text-[#00FFFF] px-2 py-0.5 rounded">
                                {med.dosageForm}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono-tech mt-0.5">
                              Rx note: "{med.rawText}"
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-mono-tech font-bold bg-[#00FFFF]/10 text-[#00FFFF] px-2.5 py-1 rounded-lg border border-[#00FFFF]/30 inline-block">
                              Abbr: {med.abbreviation}
                            </span>
                            <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                              {med.abbreviationDecoded}
                            </p>
                          </div>
                        </div>

                        {/* Plain Language Instructions */}
                        <div className="bg-[#0A1430] p-3 rounded-xl border border-white/10">
                          <p className="text-xs font-bold text-[#00FFFF]">
                            💡 {med.simpleInstructions}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                            <span>⏱️ Duration: <strong className="text-white font-mono-tech">{med.duration}</strong></span>
                            <span>🎯 Purpose: <strong className="text-white">{med.purpose}</strong></span>
                          </div>
                        </div>

                        {/* Visual Timing Badges */}
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          <span className="text-[10px] font-mono-tech text-slate-400 mr-1">Daily Schedule:</span>
                          
                          <div
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border ${
                              med.schedule.morning
                                ? 'bg-[#FFB800]/15 border-[#FFB800]/40 text-[#FFB800]'
                                : 'bg-white/5 border-white/10 text-slate-600 line-through'
                            }`}
                          >
                            <Coffee className="w-3.5 h-3.5" /> Morning (सुबह)
                          </div>

                          <div
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border ${
                              med.schedule.afternoon
                                ? 'bg-[#FFB800]/15 border-[#FFB800]/40 text-[#FFB800]'
                                : 'bg-white/5 border-white/10 text-slate-600 line-through'
                            }`}
                          >
                            <Sun className="w-3.5 h-3.5" /> Afternoon (दोपहर)
                          </div>

                          <div
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border ${
                              med.schedule.night
                                ? 'bg-[#00FFFF]/15 border-[#00FFFF]/40 text-[#00FFFF]'
                                : 'bg-white/5 border-white/10 text-slate-600 line-through'
                            }`}
                          >
                            <Moon className="w-3.5 h-3.5" /> Night (रात)
                          </div>

                          <span className="text-[10px] font-mono-tech bg-white/10 text-slate-300 px-2 py-0.5 rounded ml-auto">
                            {med.schedule.timing.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Safety Warnings */}
                        {med.safetyWarnings && med.safetyWarnings.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {med.safetyWarnings.map((warn, wIdx) => (
                              <span
                                key={wIdx}
                                className="text-[10px] bg-[#FF3E3E]/10 border border-[#FF3E3E]/30 text-[#FF3E3E] px-2 py-0.5 rounded-md font-mono-tech flex items-center gap-1"
                              >
                                ⚠️ {warn}
                              </span>
                            ))}
                          </div>
                        )}

                      </div>
                    ))}
                  </div>

                  {/* General Advice */}
                  {result.generalAdvice && result.generalAdvice.length > 0 && (
                    <div className="bg-[#00FF9D]/10 border border-[#00FF9D]/30 rounded-2xl p-4 space-y-2">
                      <h4 className="text-xs font-syne font-bold text-[#00FF9D] flex items-center gap-1.5 uppercase">
                        <Info className="w-4 h-4 text-[#00FF9D]" />
                        General Advice & Instructions (सामान्य सलाह):
                      </h4>
                      <ul className="space-y-1 text-xs text-slate-200">
                        {result.generalAdvice.map((adv, aIdx) => (
                          <li key={aIdx} className="flex items-start gap-1.5">
                            <span className="text-[#00FF9D] font-bold">•</span>
                            <span>{adv}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Safety Disclaimer */}
                  <div className="bg-[#0A1430] border border-white/10 rounded-xl p-3 text-center">
                    <p className="text-[11px] text-slate-400">
                      <span className="text-[#00FFFF] font-mono-tech font-bold">[SAFETY_NOTICE]:</span> {result.disclaimer}
                    </p>
                  </div>
                </>
              )}

            </div>
          )}

        </div>

      </div>

      {/* Printable Visual Slip Modal */}
      {showPrintSlip && result && (
        <PrintablePrescriptionSlip
          result={result}
          onClose={() => setShowPrintSlip(false)}
        />
      )}

    </div>
  );
};
