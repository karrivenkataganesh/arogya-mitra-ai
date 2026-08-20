import React from 'react';
import {
  Activity,
  FileText,
  BookOpen,
  History,
  Languages,
  ShieldAlert,
  HeartPulse,
  Mic,
  PhoneCall
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../data/languages';

interface NavbarProps {
  activeTab: 'triage' | 'prescription' | 'guide' | 'history' | 'voice';
  setActiveTab: (tab: 'triage' | 'prescription' | 'guide' | 'history' | 'voice') => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  onOpenEmergencyModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedLanguage,
  setSelectedLanguage,
  onOpenEmergencyModal
}) => {
  return (
    <header className="bg-[#0A1430] text-white border-b border-white/10 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-3 gap-3">
          
          {/* Brand Identity */}
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => setActiveTab('triage')}
            >
              <div className="w-11 h-11 rounded-xl bg-[#00FFFF]/10 border border-[#00FFFF] flex items-center justify-center text-[#00FFFF] glow-cyan transition-all group-hover:scale-105">
                <HeartPulse className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-syne font-extrabold text-2xl tracking-tight uppercase text-white">
                    ArogyaMitra <span className="text-[#00FFFF] italic">AI</span>
                  </h1>
                  <span className="text-[10px] font-mono-tech bg-[#00FFFF]/10 text-[#00FFFF] font-bold px-2 py-0.5 rounded border border-[#00FFFF]/30">
                    आरोग्यमित्र
                  </span>
                </div>
                <div className="meta-label text-[10px] text-[#00FFFF]/80 font-mono-tech uppercase tracking-wider">
                  Community Medical Support [PHC Triage]
                </div>
              </div>
            </div>

            {/* Mobile Emergency Button */}
            <div className="lg:hidden flex items-center gap-2">
              <button
                onClick={onOpenEmergencyModal}
                className="emergency-pill"
                title="Emergency Hotline"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                108
              </button>
            </div>
          </div>

          {/* Navigation Dock */}
          <div className="flex items-center gap-1.5 p-1.5 bg-[#122245] rounded-2xl border border-white/10 overflow-x-auto no-scrollbar shadow-inner">
            <button
              onClick={() => setActiveTab('triage')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'triage'
                  ? 'bg-[#00FFFF] text-[#050A1A] font-bold glow-cyan'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              1. Symptom Triage
            </button>

            <button
              onClick={() => setActiveTab('prescription')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'prescription'
                  ? 'bg-[#00FFFF] text-[#050A1A] font-bold glow-cyan'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              2. Prescription
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'guide'
                  ? 'bg-[#00FFFF] text-[#050A1A] font-bold glow-cyan'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              3. Shorthand
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'history'
                  ? 'bg-[#00FFFF] text-[#050A1A] font-bold glow-cyan'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              4. Logs
            </button>

            <button
              onClick={() => setActiveTab('voice')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'voice'
                  ? 'bg-[#FF00FF] text-white font-bold glow-magenta'
                  : 'text-[#FF00FF] hover:bg-[#FF00FF]/10'
              }`}
            >
              <Mic className="w-3.5 h-3.5 animate-pulse" />
              5. Live Assistant
            </button>
          </div>

          {/* Right Utilities: Language & Desktop Emergency Pill */}
          <div className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0">
            {/* Language Selector */}
            <div className="flex items-center gap-2 bg-[#122245] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white">
              <Languages className="w-4 h-4 text-[#00FFFF] shrink-0" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1 text-xs"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-[#0A1430] text-white">
                    {lang.flag} {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop Emergency Hotline Button */}
            <button
              onClick={onOpenEmergencyModal}
              className="hidden lg:flex emergency-pill cursor-pointer transition-all hover:scale-105"
            >
              <ShieldAlert className="w-4 h-4" />
              EMERGENCY: 108
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
