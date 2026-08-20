import React, { useState } from 'react';
import { History, Download, Trash2, Filter, AlertTriangle, CheckCircle2, AlertCircle, FileText, Activity, Search, Sparkles } from 'lucide-react';
import { TriageHistoryRecord, PrescriptionHistoryRecord } from '../types';

interface HistoryViewProps {
  triageHistory: TriageHistoryRecord[];
  prescriptionHistory: PrescriptionHistoryRecord[];
  onClearHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  triageHistory,
  prescriptionHistory,
  onClearHistory
}) => {
  const [activeTab, setActiveTab] = useState<'triage' | 'prescription'>('triage');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Analytics counts
  const totalTriage = triageHistory.length;
  const redCount = triageHistory.filter((t) => t.urgency === 'RED').length;
  const yellowCount = triageHistory.filter((t) => t.urgency === 'YELLOW').length;
  const greenCount = triageHistory.filter((t) => t.urgency === 'GREEN').length;

  const filteredTriage = triageHistory.filter((item) => {
    const matchesUrgency = urgencyFilter === 'ALL' || item.urgency === urgencyFilter;
    const matchesSearch =
      item.symptoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.patientName && item.patientName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesUrgency && matchesSearch;
  });

  const exportCSV = () => {
    if (triageHistory.length === 0) return;
    const headers = ['Timestamp', 'Patient Name', 'Urgency', 'Symptoms', 'Specialist', 'Language'];
    const rows = triageHistory.map((t) => [
      new Date(t.timestamp).toLocaleString(),
      t.patientName || 'Patient',
      t.urgency,
      `"${t.symptoms.replace(/"/g, '""')}"`,
      t.result.recommendedSpecialist || 'General',
      t.language
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PHC_Triage_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div className="card-tech p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00FFFF]/10 border border-[#00FFFF]/30 text-[#00FFFF] flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-syne font-extrabold tracking-tight text-white uppercase">
              PHC Telemetry & Patient History Logs <span className="text-[#00FFFF] font-normal text-sm font-sans">[रोगी इतिहास]</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Local session audit logs for Community Health Workers, ANMs, and Medical Officers. Download CSV reports for daily PHC patient register.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={triageHistory.length === 0}
            className="bg-[#00FFFF] hover:bg-[#33ffff] disabled:opacity-40 text-[#050A1A] font-syne font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl flex items-center gap-2 glow-cyan transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV Log
          </button>
          <button
            onClick={onClearHistory}
            className="bg-[#122245] hover:bg-[#FF3E3E]/20 text-[#FF3E3E] border border-[#FF3E3E]/30 font-mono-tech text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Clear Logs
          </button>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-tech p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold">
            <Activity className="w-5 h-5 text-[#00FFFF]" />
          </div>
          <div>
            <div className="meta-label">TOTAL_EVALS</div>
            <div className="font-syne font-extrabold text-2xl text-white">{totalTriage}</div>
          </div>
        </div>

        <div className="card-tech p-4 flex items-center gap-3 border-[#FF3E3E]/40 glow-red">
          <div className="w-10 h-10 rounded-xl bg-[#FF3E3E]/20 text-[#FF3E3E] flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="meta-label text-[#FF3E3E]">RED (EMERGENCY)</div>
            <div className="font-syne font-extrabold text-2xl text-[#FF3E3E]">{redCount}</div>
          </div>
        </div>

        <div className="card-tech p-4 flex items-center gap-3 border-[#FFB800]/40">
          <div className="w-10 h-10 rounded-xl bg-[#FFB800]/20 text-[#FFB800] flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="meta-label text-[#FFB800]">YELLOW (PRIORITY)</div>
            <div className="font-syne font-extrabold text-2xl text-[#FFB800]">{yellowCount}</div>
          </div>
        </div>

        <div className="card-tech p-4 flex items-center gap-3 border-[#00FF9D]/40">
          <div className="w-10 h-10 rounded-xl bg-[#00FF9D]/20 text-[#00FF9D] flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="meta-label text-[#00FF9D]">GREEN (ROUTINE)</div>
            <div className="font-syne font-extrabold text-2xl text-[#00FF9D]">{greenCount}</div>
          </div>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="card-tech p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('triage')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'triage'
                  ? 'bg-[#00FFFF] text-[#050A1A] glow-cyan font-syne'
                  : 'text-slate-400 hover:text-white bg-[#122245]'
              }`}
            >
              <Activity className="w-4 h-4" />
              Triage Records ({triageHistory.length})
            </button>
            <button
              onClick={() => setActiveTab('prescription')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'prescription'
                  ? 'bg-[#00FFFF] text-[#050A1A] glow-cyan font-syne'
                  : 'text-slate-400 hover:text-white bg-[#122245]'
              }`}
            >
              <FileText className="w-4 h-4" />
              Prescription Records ({prescriptionHistory.length})
            </button>
          </div>

          {activeTab === 'triage' && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter patient or symptom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-[#122245] border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 w-48 sm:w-56 focus:border-[#00FFFF] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1 bg-[#122245] p-1 rounded-xl border border-white/10">
                {['ALL', 'RED', 'YELLOW', 'GREEN'].map((u) => (
                  <button
                    key={u}
                    onClick={() => setUrgencyFilter(u)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono-tech font-bold transition-all cursor-pointer ${
                      urgencyFilter === u
                        ? u === 'RED'
                          ? 'bg-[#FF3E3E] text-white'
                          : u === 'YELLOW'
                          ? 'bg-[#FFB800] text-black'
                          : u === 'GREEN'
                          ? 'bg-[#00FF9D] text-black'
                          : 'bg-[#00FFFF] text-[#050A1A]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Triage Log Table / Cards */}
        {activeTab === 'triage' && (
          <div className="space-y-3">
            {filteredTriage.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <History className="w-8 h-8 mx-auto text-[#00FFFF] opacity-50" />
                <p className="text-xs font-mono-tech">No triage logs found matching the filter.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTriage.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-[#122245]/70 border border-white/10 hover:border-[#00FFFF]/50 rounded-2xl p-4 space-y-3 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-mono-tech text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            rec.urgency === 'RED'
                              ? 'bg-[#FF3E3E] text-white glow-red'
                              : rec.urgency === 'YELLOW'
                              ? 'bg-[#FFB800] text-black'
                              : 'bg-[#00FF9D] text-black'
                          }`}
                        >
                          {rec.urgency}
                        </span>
                        <span className="font-syne font-bold text-white text-sm">
                          {rec.patientName || 'Unnamed Patient'}
                        </span>
                        <span className="text-[10px] font-mono-tech text-[#00FFFF]">
                          [{rec.language}]
                        </span>
                      </div>

                      <span className="text-[10px] font-mono-tech text-slate-400">
                        {new Date(rec.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-slate-300 font-medium leading-relaxed">
                        <strong className="text-[#00FFFF] font-mono-tech">[Symptoms]:</strong> {rec.symptoms}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        <strong className="text-slate-300 font-mono-tech">[Specialist]:</strong> {rec.result.recommendedSpecialist} • {rec.result.urgencyTitleEnglish}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Prescription Log Table / Cards */}
        {activeTab === 'prescription' && (
          <div className="space-y-3">
            {prescriptionHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-[#00FFFF] opacity-50" />
                <p className="text-xs font-mono-tech">No prescription interpretation logs found in this session.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {prescriptionHistory.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-[#122245]/70 border border-white/10 hover:border-[#00FFFF]/50 rounded-2xl p-4 space-y-3 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono-tech text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#00FFFF]/10 border border-[#00FFFF]/40 text-[#00FFFF]">
                          DECODED RX
                        </span>
                        <span className="font-syne font-bold text-white text-sm">
                          {rec.patientName || 'Patient'}
                        </span>
                        <span className="text-[10px] font-mono-tech text-[#00FFFF]">
                          [{rec.language}]
                        </span>
                      </div>

                      <span className="text-[10px] font-mono-tech text-slate-400">
                        {new Date(rec.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1">
                      <p>
                        <strong className="text-[#00FFFF] font-mono-tech">[Medicines Decoded]:</strong>{' '}
                        {rec.result.medicines.map((m) => m.medicineName).join(', ')}
                      </p>
                      {rec.result.doctorNameFromRx && (
                        <p className="text-slate-400 text-[11px]">
                          Doctor: Dr. {rec.result.doctorNameFromRx}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
