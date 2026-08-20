export type UrgencyLevel = 'RED' | 'YELLOW' | 'GREEN';

export interface VitalSigns {
  temperature?: string; // e.g. "101.5 °F"
  bpSystolic?: string; // e.g. "140"
  bpDiastolic?: string; // e.g. "90"
  pulseRate?: string; // e.g. "88 bpm"
  spo2?: string; // e.g. "96%"
  respiratoryRate?: string; // e.g. "22 /min"
}

export interface PatientDemographics {
  age?: string;
  gender?: 'male' | 'female' | 'child' | 'infant' | 'other';
  patientId?: string;
  patientName?: string;
}

export interface TriageRequest {
  symptoms: string;
  targetLanguage: string;
  patientDemographics?: PatientDemographics;
  vitals?: VitalSigns;
  audioBase64?: string;
  mimeType?: string;
}

export interface TriageResult {
  urgencyLevel: UrgencyLevel;
  urgencyTitle: string; // Title in target language
  urgencyTitleEnglish: string;
  urgencyReasoning: string; // Detailed explanation in target language
  actionPlan: string[]; // Immediate steps for PHC staff / CHW
  firstAidAdvice: string[]; // Safe non-diagnostic comfort measures while waiting
  redFlagWarnings: string[]; // Escalation symptoms
  recommendedSpecialist: string; // e.g. Cardiologist, Pulmonologist, General Practitioner
  translatedSymptoms: string; // Clear summary of reported symptoms in target language
  disclaimer: string;
  createdAt: string;
}

export type TimingType = 'BEFORE_MEAL' | 'AFTER_MEAL' | 'WITH_MEAL' | 'AS_NEEDED' | 'BEDTIME' | 'ANYTIME';

export interface MedicineDetail {
  id: string;
  rawText: string; // Text extracted from Rx
  medicineName: string; // Standard name
  dosageForm: string; // Tablet, Syrup, Capsule, Ointment, etc.
  abbreviation: string; // OD, BD, TDS, 1-0-1, etc.
  abbreviationDecoded: string; // Plain translation of abbreviation
  simpleInstructions: string; // Direct instructions in target language
  schedule: {
    morning: boolean;
    afternoon: boolean;
    night: boolean;
    timing: TimingType;
  };
  duration: string; // e.g., "5 days"
  purpose: string; // e.g. "For fever and severe throat infection"
  safetyWarnings: string[]; // e.g., ["Do not crush", "Take with plenty of water"]
}

export interface PrescriptionResult {
  is_readable: boolean;
  unreadableReason?: string;
  doctorNoteSummary?: string;
  patientNameFromRx?: string;
  doctorNameFromRx?: string;
  medicines: MedicineDetail[];
  generalAdvice: string[];
  disclaimer: string;
  createdAt: string;
  imageUrl?: string;
}

export interface TriageHistoryRecord {
  id: string;
  timestamp: string;
  symptoms: string;
  patientName?: string;
  urgency: UrgencyLevel;
  result: TriageResult;
  language: string;
}

export interface PrescriptionHistoryRecord {
  id: string;
  timestamp: string;
  patientName?: string;
  result: PrescriptionResult;
  language: string;
}

export interface MedicalAbbreviation {
  abbr: string;
  fullLatin: string;
  englishMeaning: string;
  hindiMeaning: string;
  dosagePattern: string; // e.g., "1-0-1"
  commonContext: string;
}
