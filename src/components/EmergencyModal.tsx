import React from 'react';
import { ShieldAlert, PhoneCall, X, CheckSquare, Printer } from 'lucide-react';

interface EmergencyModalProps {
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#050A1A]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#0A1430] border-2 border-[#FF3E3E] rounded-3xl shadow-2xl max-w-xl w-full p-6 space-y-5 relative my-8 glow-red">
        
        {/* Header Alert */}
        <div className="flex items-start justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FF3E3E] text-white flex items-center justify-center font-black animate-pulse glow-red">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-mono-tech font-extrabold uppercase text-[#FF3E3E] tracking-widest block">
                [RED_LEVEL_EMERGENCY_OVERRIDE]
              </span>
              <h2 className="text-xl font-syne font-extrabold text-white leading-tight">
                Immediate Hospital Escalation Required
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl border border-white/10 bg-[#122245] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Emergency Hotlines */}
        <div className="bg-[#FF3E3E]/10 border border-[#FF3E3E]/40 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-mono-tech font-bold text-[#FF3E3E] uppercase tracking-wider flex items-center gap-2">
            <PhoneCall className="w-4 h-4" />
            Emergency Referral Hotlines (South Asia / APAC):
          </h3>

          <div className="grid grid-cols-2 gap-2.5 text-xs font-mono-tech">
            <a
              href="tel:108"
              className="bg-[#FF3E3E] hover:bg-[#ff5555] text-white p-3 rounded-xl font-bold flex items-center justify-between shadow-sm transition-all glow-red"
            >
              <span>🚑 Ambulance</span>
              <span className="text-base font-extrabold">108</span>
            </a>

            <a
              href="tel:112"
              className="bg-[#122245] hover:bg-[#1a3366] text-[#00FFFF] border border-[#00FFFF]/40 p-3 rounded-xl font-bold flex items-center justify-between shadow-sm transition-all glow-cyan"
            >
              <span>🚨 Helpline</span>
              <span className="text-base font-extrabold">112</span>
            </a>

            <a
              href="tel:102"
              className="bg-[#0A1430] border border-white/10 text-white p-3 rounded-xl font-bold flex items-center justify-between hover:border-[#FFB800] transition-all"
            >
              <span>🤰 Maternal / Child</span>
              <span className="text-sm">102</span>
            </a>

            <a
              href="tel:1800116117"
              className="bg-[#0A1430] border border-white/10 text-white p-3 rounded-xl font-bold flex items-center justify-between hover:border-[#FF3E3E] transition-all"
            >
              <span>☠️ Poison Center</span>
              <span className="text-xs">1800-116-117</span>
            </a>
          </div>
        </div>

        {/* PHC Transfer Checklist */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono-tech font-bold text-[#00FFFF] uppercase tracking-wider flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4" />
            Field Transfer & Stabilization Checklist:
          </h3>

          <div className="space-y-2 text-xs text-slate-200">
            <div className="p-3 bg-[#122245] border border-white/10 rounded-xl flex items-start gap-2.5">
              <span className="font-mono-tech font-bold text-[#FF3E3E]">01.</span>
              <span><strong>Ambulance Dispatch:</strong> Call 108 immediately and inform nearest Civil/District Hospital triage team.</span>
            </div>

            <div className="p-3 bg-[#122245] border border-white/10 rounded-xl flex items-start gap-2.5">
              <span className="font-mono-tech font-bold text-[#FF3E3E]">02.</span>
              <span><strong>Airway & Breathing:</strong> Supply supplemental oxygen if SpO2 &lt; 92% or patient displays severe respiratory distress.</span>
            </div>

            <div className="p-3 bg-[#122245] border border-white/10 rounded-xl flex items-start gap-2.5">
              <span className="font-mono-tech font-bold text-[#FF3E3E]">03.</span>
              <span><strong>Vascular Line:</strong> Secure wide-bore IV cannula for fluid resuscitation if patient is in shock or dehydrated.</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-[#122245] text-slate-200 hover:text-white border border-white/10 rounded-xl text-xs font-mono-tech flex items-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#00FFFF]" />
            Print Transfer Slip
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#00FFFF] text-[#050A1A] font-syne font-extrabold uppercase rounded-xl text-xs glow-cyan transition-all cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>

      </div>
    </div>
  );
};
