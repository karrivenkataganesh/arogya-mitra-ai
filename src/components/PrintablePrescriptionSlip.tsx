import React from 'react';
import { PrescriptionResult } from '../types';
import { Printer, X, Sun, Moon, Coffee, HeartPulse, CheckCircle2 } from 'lucide-react';

interface PrintablePrescriptionSlipProps {
  result: PrescriptionResult;
  onClose: () => void;
}

export const PrintablePrescriptionSlip: React.FC<PrintablePrescriptionSlipProps> = ({
  result,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-6 relative border border-slate-200 my-8">
        
        {/* Header bar for modal controls */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-teal-600" />
            <h2 className="font-bold text-slate-800 text-sm">
              Patient Visual Dosage Guide (मुद्रण योग्य रोगी खुराक पर्चा)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE SLIP CONTENT AREA */}
        <div className="print-area space-y-5 bg-white p-2">
          
          {/* PHC Header */}
          <div className="border-b-2 border-teal-700 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  PRIMARY HEALTHCARE CENTER (PHC)
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Patient Prescription Simplifier & Visual Dosage Card
                </p>
              </div>
            </div>

            <div className="text-right text-xs text-slate-600">
              <p className="font-bold text-slate-800">Date: {new Date().toLocaleDateString()}</p>
              {result.patientNameFromRx && (
                <p className="font-semibold text-teal-800">Patient: {result.patientNameFromRx}</p>
              )}
            </div>
          </div>

          {/* Visual Dosage Table */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-center bg-slate-100 py-1.5 rounded-lg border border-slate-200">
              🌅 Morning / ☀️ Afternoon / 🌙 Night Medicine Schedule (दवाइयों का समय पत्र)
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {result.medicines.map((med, idx) => (
                <div
                  key={med.id || idx}
                  className="border-2 border-slate-300 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50"
                >
                  {/* Medicine Name & Purpose */}
                  <div className="sm:w-1/3">
                    <span className="text-xs font-black text-slate-900 block text-sm">
                      {idx + 1}. {med.medicineName}
                    </span>
                    <span className="text-xs text-slate-600 font-semibold block">
                      ({med.dosageForm}) - {med.purpose}
                    </span>
                    <span className="text-[11px] text-teal-700 font-bold block mt-0.5">
                      {med.simpleInstructions}
                    </span>
                  </div>

                  {/* 3 Time Slots with High Contrast Visual Badges */}
                  <div className="grid grid-cols-3 gap-2 sm:w-2/3 text-center">
                    
                    {/* Morning Slot */}
                    <div
                      className={`p-2 rounded-lg border-2 flex flex-col items-center justify-center ${
                        med.schedule.morning
                          ? 'bg-amber-100 border-amber-400 text-amber-950 font-black'
                          : 'bg-slate-100 border-slate-200 text-slate-300'
                      }`}
                    >
                      <Coffee className="w-4 h-4 mb-0.5" />
                      <span className="text-[10px] uppercase">Morning (सुबह)</span>
                      <span className="text-xs font-bold mt-0.5">
                        {med.schedule.morning ? '💊 1 Dose' : '❌ No'}
                      </span>
                    </div>

                    {/* Afternoon Slot */}
                    <div
                      className={`p-2 rounded-lg border-2 flex flex-col items-center justify-center ${
                        med.schedule.afternoon
                          ? 'bg-amber-100 border-amber-400 text-amber-950 font-black'
                          : 'bg-slate-100 border-slate-200 text-slate-300'
                      }`}
                    >
                      <Sun className="w-4 h-4 mb-0.5" />
                      <span className="text-[10px] uppercase">Afternoon (दोपहर)</span>
                      <span className="text-xs font-bold mt-0.5">
                        {med.schedule.afternoon ? '💊 1 Dose' : '❌ No'}
                      </span>
                    </div>

                    {/* Night Slot */}
                    <div
                      className={`p-2 rounded-lg border-2 flex flex-col items-center justify-center ${
                        med.schedule.night
                          ? 'bg-indigo-100 border-indigo-400 text-indigo-950 font-black'
                          : 'bg-slate-100 border-slate-200 text-slate-300'
                      }`}
                    >
                      <Moon className="w-4 h-4 mb-0.5" />
                      <span className="text-[10px] uppercase">Night (रात)</span>
                      <span className="text-xs font-bold mt-0.5">
                        {med.schedule.night ? '💊 1 Dose' : '❌ No'}
                      </span>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Warnings & Meal Guidance */}
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs space-y-1">
            <span className="font-bold text-amber-900 block">
              ⚠️ Essential Precautions for Patient:
            </span>
            <ul className="grid grid-cols-2 gap-1 text-amber-800 font-medium text-[11px]">
              <li>• Always take medicines with clean water.</li>
              <li>• Complete full course duration.</li>
              <li>• Keep out of reach of children.</li>
              <li>• Return to PHC if fever or vomiting persists.</li>
            </ul>
          </div>

          {/* Footer Signature */}
          <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-xs text-slate-500">
            <p>ArogyaMitra AI - Primary Healthcare Center Assistant</p>
            <p className="font-bold">Medical Officer / Pharmacist Verification Sign</p>
          </div>

        </div>

      </div>
    </div>
  );
};
