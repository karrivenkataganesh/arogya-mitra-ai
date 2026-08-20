import React, { useState } from 'react';
import { BookOpen, Search, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { MEDICAL_ABBREVIATIONS, PHC_FIRST_AID_PROTOCOLS } from '../data/abbreviations';

export const AbbreviationGuide: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProtocolId, setSelectedProtocolId] = useState<string>('snake-bite');

  const filteredAbbreviations = MEDICAL_ABBREVIATIONS.filter(
    (item) =>
      item.abbr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.englishMeaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.hindiMeaning.includes(searchTerm)
  );

  const selectedProtocol = PHC_FIRST_AID_PROTOCOLS.find((p) => p.id === selectedProtocolId) || PHC_FIRST_AID_PROTOCOLS[0];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="card-tech p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00FFFF]/10 border border-[#00FFFF]/30 text-[#00FFFF] flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-syne font-extrabold tracking-tight text-white uppercase">
              Medical Shorthand & Field First-Aid Index <span className="text-[#00FFFF] font-normal text-sm font-sans">[संक्षेप कोश]</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Quick reference database for prescription abbreviations (OD, BD, TDS, HS, AC, PC) and standard field first-aid protocols for Community Health Workers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Abbreviation Search & Cards */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card-tech p-6 space-y-5">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="meta-label">[Prescription Shorthand Dictionary]</div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search OD, BD, TDS, AC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-[#122245] border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 w-full sm:w-56 focus:border-[#00FFFF] focus:outline-none focus:ring-1 focus:ring-[#00FFFF] font-mono-tech"
                />
              </div>
            </div>

            {/* List of Abbreviations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredAbbreviations.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#122245]/60 border border-white/10 hover:border-[#00FFFF]/50 rounded-2xl p-4 space-y-2 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono-tech font-extrabold text-[#00FFFF] text-sm bg-[#00FFFF]/10 px-2.5 py-0.5 rounded-lg border border-[#00FFFF]/30 glow-cyan">
                      {item.abbr}
                    </span>
                    <span className="text-[10px] font-mono-tech text-slate-400">
                      Pattern: {item.dosagePattern}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-white font-syne">
                      {item.englishMeaning}
                    </p>
                    <p className="text-xs text-[#00FF9D] font-semibold mt-0.5">
                      {item.hindiMeaning}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono-tech italic mt-1">
                      Latin: {item.fullLatin}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Right Column: First Aid Protocols */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card-tech p-6 space-y-5">
            
            <div className="border-b border-white/10 pb-3 flex items-center justify-between">
              <div className="meta-label">[PHC Field First-Aid Protocols]</div>
              <ShieldAlert className="w-4 h-4 text-[#FF3E3E]" />
            </div>

            {/* Protocol Selector Pills */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {PHC_FIRST_AID_PROTOCOLS.map((proto) => (
                <button
                  key={proto.id}
                  onClick={() => setSelectedProtocolId(proto.id)}
                  className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    selectedProtocolId === proto.id
                      ? 'bg-[#00FFFF] text-[#050A1A] border-[#00FFFF] glow-cyan font-syne font-extrabold'
                      : 'bg-[#122245] text-slate-300 border-white/10 hover:border-[#00FFFF]/40'
                  }`}
                >
                  <span>{proto.icon}</span>
                  <span>{proto.title.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* Active Protocol Card */}
            <div className="bg-[#122245]/70 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <span className="text-3xl">{selectedProtocol.icon}</span>
                <div>
                  <h3 className="font-syne font-extrabold text-white text-base">
                    {selectedProtocol.title}
                  </h3>
                  <p className="text-xs text-[#00FFFF] font-mono-tech font-semibold">
                    {selectedProtocol.titleHindi}
                  </p>
                </div>
              </div>

              {/* Recommended Steps */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-[#00FF9D] uppercase tracking-wider font-mono-tech block">
                  ✅ RECOMMENDED FIELD ACTIONS (क्या करें):
                </span>
                <ul className="space-y-2 text-xs">
                  {selectedProtocol.steps.map((step, sIdx) => (
                    <li key={sIdx} className="flex items-start gap-2.5 bg-[#0A1430] p-2.5 rounded-xl border border-[#00FF9D]/20 text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-[#00FF9D] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">{step}</p>
                        <p className="text-[#00FF9D] text-[11px] font-mono-tech mt-0.5">
                          {selectedProtocol.stepsHindi[sIdx]}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Prohibited List */}
              <div className="space-y-2 bg-[#FF3E3E]/10 border border-[#FF3E3E]/30 rounded-xl p-3.5">
                <span className="text-[11px] font-bold text-[#FF3E3E] uppercase tracking-wider font-mono-tech block">
                  🚫 STRICTLY PROHIBITED (क्या न करें):
                </span>
                <ul className="space-y-1.5 text-xs text-slate-200">
                  {selectedProtocol.doNot.map((no, nIdx) => (
                    <li key={nIdx} className="flex items-start gap-2">
                      <span className="text-[#FF3E3E] font-bold">✕</span>
                      <div>
                        <p className="text-white">{no}</p>
                        <p className="text-[#FF3E3E] text-[11px] font-mono-tech">{selectedProtocol.doNotHindi[nIdx]}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
