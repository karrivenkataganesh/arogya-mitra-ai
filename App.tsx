import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TriageView } from './components/TriageView';
import { PrescriptionView } from './components/PrescriptionView';
import { AbbreviationGuide } from './components/AbbreviationGuide';
import { HistoryView } from './components/HistoryView';
import { VoiceView } from './components/VoiceView';
import { EmergencyModal } from './components/EmergencyModal';
import { TriageHistoryRecord, PrescriptionHistoryRecord, TriageResult, PrescriptionResult } from './types';
import { HeartPulse, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'triage' | 'prescription' | 'guide' | 'history' | 'voice'>('triage');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Hindi');
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);

  // History State with localStorage persistence
  const [triageHistory, setTriageHistory] = useState<TriageHistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('arogya_triage_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [prescriptionHistory, setPrescriptionHistory] = useState<PrescriptionHistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('arogya_prescription_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('arogya_triage_history', JSON.stringify(triageHistory));
    } catch (e) {
      console.error(e);
    }
  }, [triageHistory]);

  useEffect(() => {
    try {
      localStorage.setItem('arogya_prescription_history', JSON.stringify(prescriptionHistory));
    } catch (e) {
      console.error(e);
    }
  }, [prescriptionHistory]);

  // Handlers
  const handleSaveTriageRecord = (record: { symptoms: string; patientName?: string; result: TriageResult; language: string }) => {
    const newRecord: TriageHistoryRecord = {
      id: 'triage_' + Date.now(),
      timestamp: new Date().toISOString(),
      symptoms: record.symptoms,
      patientName: record.patientName,
      urgency: record.result.urgencyLevel,
      result: record.result,
      language: record.language
    };
    setTriageHistory((prev) => [newRecord, ...prev]);
  };

  const handleSavePrescriptionRecord = (record: { patientName?: string; result: PrescriptionResult; language: string }) => {
    const newRecord: PrescriptionHistoryRecord = {
      id: 'rx_' + Date.now(),
      timestamp: new Date().toISOString(),
      patientName: record.patientName,
      result: record.result,
      language: record.language
    };
    setPrescriptionHistory((prev) => [newRecord, ...prev]);
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all PHC patient history logs?')) {
      setTriageHistory([]);
      setPrescriptionHistory([]);
      localStorage.removeItem('arogya_triage_history');
      localStorage.removeItem('arogya_prescription_history');
    }
  };

  return (
    <div className="min-h-screen bg-[#050A1A] text-white font-sans flex flex-col antialiased selection:bg-[#00FFFF] selection:text-[#050A1A]">
      
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        onOpenEmergencyModal={() => setShowEmergencyModal(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'triage' && (
          <TriageView
            selectedLanguage={selectedLanguage}
            onSaveToHistory={handleSaveTriageRecord}
            onTriggerEmergencyModal={() => setShowEmergencyModal(true)}
          />
        )}

        {activeTab === 'prescription' && (
          <PrescriptionView
            selectedLanguage={selectedLanguage}
            onSaveToHistory={handleSavePrescriptionRecord}
          />
        )}

        {activeTab === 'guide' && <AbbreviationGuide />}

        {activeTab === 'history' && (
          <HistoryView
            triageHistory={triageHistory}
            prescriptionHistory={prescriptionHistory}
            onClearHistory={handleClearHistory}
          />
        )}

        {activeTab === 'voice' && (
          <VoiceView selectedLanguage={selectedLanguage} />
        )}
      </main>

      {/* Emergency Referral Protocol Modal */}
      {showEmergencyModal && (
        <EmergencyModal onClose={() => setShowEmergencyModal(false)} />
      )}

      {/* Futuristic Cyber Footer */}
      <footer className="bg-[#000000] text-slate-400 border-t border-white/10 py-4 px-6 text-xs">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="meta-label">SYS_STATUS: ACTIVE</div>
            <div className="meta-label opacity-40">VER: 4.2.1-PHC</div>
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 border-l border-white/10 pl-3">
              <HeartPulse className="w-3.5 h-3.5 text-[#00FFFF]" />
              <span>ArogyaMitra AI • Community Medical Support</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center md:text-right max-w-2xl leading-relaxed">
            This is a non-diagnostic organizational tool for PHC workers. Always prioritize doctor evaluation. Live Regional Translation: Enabled.
          </p>
        </div>
      </footer>

    </div>
  );
}
