import { VitalSigns } from '../types';

export interface SymptomPreset {
  id: string;
  title: string;
  titleHindi: string;
  category: 'Emergency' | 'Priority' | 'Routine';
  description: string;
  age: string;
  gender: 'male' | 'female' | 'child' | 'infant';
  vitals?: VitalSigns;
  patientName?: string;
}

export const SYMPTOM_PRESETS: SymptomPreset[] = [
  {
    id: 'chest-pain-red',
    title: 'Severe Chest Pain & Cold Sweats',
    titleHindi: 'सीने में तेज दर्द और ठंडा पसीना',
    category: 'Emergency',
    description: 'Patient is experiencing crushing heavy pain in center of chest radiating to left arm and jaw, severe shortness of breath, dizziness, and cold clammy sweating for 30 minutes.',
    age: '54',
    gender: 'male',
    patientName: 'Ramprasad Sharma',
    vitals: {
      temperature: '98.4 °F',
      bpSystolic: '160',
      bpDiastolic: '100',
      pulseRate: '110 bpm',
      spo2: '93%',
      respiratoryRate: '26 /min'
    }
  },
  {
    id: 'high-fever-child-yellow',
    title: 'High Fever & Persistent Vomiting in Child',
    titleHindi: 'बच्चे को तेज बुखार और बार-बार उल्टी',
    category: 'Priority',
    description: '4-year-old child with 102.8°F high fever for 2 days, lethargy, unable to keep liquids down due to 5 episodes of vomiting today, complains of stomach ache.',
    age: '4',
    gender: 'child',
    patientName: 'Aarav Patel',
    vitals: {
      temperature: '102.8 °F',
      bpSystolic: '95',
      bpDiastolic: '60',
      pulseRate: '128 bpm',
      spo2: '97%',
      respiratoryRate: '30 /min'
    }
  },
  {
    id: 'mild-cough-green',
    title: 'Mild Cold, Dry Cough & Running Nose',
    titleHindi: 'हल्का जुकाम, सूखी खांसी और बहती नाक',
    category: 'Routine',
    description: 'Patient has mild dry cough, throat irritation, and clear nasal discharge for 3 days. No breathlessness, eating fine, mild body ache.',
    age: '28',
    gender: 'female',
    patientName: 'Sunita Devi',
    vitals: {
      temperature: '99.1 °F',
      bpSystolic: '118',
      bpDiastolic: '78',
      pulseRate: '76 bpm',
      spo2: '99%',
      respiratoryRate: '16 /min'
    }
  },
  {
    id: 'snake-bite-red',
    title: 'Suspected Snake Bite on Ankle',
    titleHindi: 'टखने पर सांप का काटना',
    category: 'Emergency',
    description: 'Farm worker bitten on right ankle 20 minutes ago while working in paddy field. Local swelling, double fang marks visible, patient feeling drowsy and nauseous.',
    age: '38',
    gender: 'male',
    patientName: 'Ganesh Das',
    vitals: {
      temperature: '98.6 °F',
      bpSystolic: '100',
      bpDiastolic: '65',
      pulseRate: '105 bpm',
      spo2: '95%',
      respiratoryRate: '22 /min'
    }
  }
];

// Helper to generate a completely random patient profile for quick triage testing
export function generateRandomPatientCase(): SymptomPreset {
  const maleNames = ['Ramesh Kumar', 'Arjun Das', 'Bikramjit Singh', 'Mohan Reddy', 'Suresh Prasad', 'Deepak Verma', 'Vikram Patil', 'Harish Chandra'];
  const femaleNames = ['Priya Sharma', 'Anjali Devi', 'Meena Kumari', 'Lakshmi Bai', 'Sunita Rao', 'Kavita Roy', 'Radha Krishnan', 'Fatima Begum'];
  const childNames = ['Aarav Patel', 'Chintu Roy', 'Ananya S.', 'Rohan Das', 'Diya Verma', 'Kabir Kumar'];

  const categories: ('Emergency' | 'Priority' | 'Routine')[] = ['Emergency', 'Priority', 'Routine'];
  const chosenCat = categories[Math.floor(Math.random() * categories.length)];

  let gender: 'male' | 'female' | 'child' = 'male';
  let name = '';
  let age = '35';

  const gRand = Math.random();
  if (gRand < 0.45) {
    gender = 'male';
    name = maleNames[Math.floor(Math.random() * maleNames.length)];
    age = String(Math.floor(Math.random() * 45) + 20);
  } else if (gRand < 0.85) {
    gender = 'female';
    name = femaleNames[Math.floor(Math.random() * femaleNames.length)];
    age = String(Math.floor(Math.random() * 45) + 20);
  } else {
    gender = 'child';
    name = childNames[Math.floor(Math.random() * childNames.length)];
    age = String(Math.floor(Math.random() * 10) + 1);
  }

  let title = '';
  let titleHindi = '';
  let description = '';
  let vitals: VitalSigns = {};

  if (chosenCat === 'Emergency') {
    const cases = [
      {
        title: 'Acute Severe Asthma Attack',
        titleHindi: 'गंभीर सांस का दौरा',
        desc: 'Patient unable to speak full sentences due to severe breathlessness, wheezing audible, chest tight, SpO2 dropping to 88% on room air.',
        vitals: { temperature: '98.8 °F', bpSystolic: '145', bpDiastolic: '92', pulseRate: '122 bpm', spo2: '88%', respiratoryRate: '32 /min' }
      },
      {
        title: 'Severe Dehydration & Dengue Warning',
        titleHindi: 'गंभीर निर्जलीकरण और डेंगू का खतरा',
        desc: 'High fever 103.5°F for 4 days with severe retro-orbital headache, abdominal pain, nosebleed, extreme weakness, and cold extremities.',
        vitals: { temperature: '103.5 °F', bpSystolic: '90', bpDiastolic: '58', pulseRate: '118 bpm', spo2: '94%', respiratoryRate: '24 /min' }
      },
      {
        title: 'Sudden Weakness & Slurred Speech',
        titleHindi: 'अचानक कमजोरी और तुतलाहट (स्ट्रोक का डर)',
        desc: 'Right-sided face drooping, right arm weakness, slurred speech starting 40 minutes ago. History of uncontrolled high blood pressure.',
        vitals: { temperature: '98.4 °F', bpSystolic: '185', bpDiastolic: '110', pulseRate: '98 bpm', spo2: '96%', respiratoryRate: '20 /min' }
      }
    ];
    const item = cases[Math.floor(Math.random() * cases.length)];
    title = item.title;
    titleHindi = item.titleHindi;
    description = `Patient ${name} (${age}y, ${gender}): ${item.desc}`;
    vitals = item.vitals;
  } else if (chosenCat === 'Priority') {
    const cases = [
      {
        title: 'Acute Gastroenteritis & Moderate Fever',
        titleHindi: 'उल्टी-दस्त और तेज बुखार',
        desc: 'Passing frequent watery stools 8 times since morning, cramping stomach pain, nausea, dry mouth, mild dizziness upon standing.',
        vitals: { temperature: '101.2 °F', bpSystolic: '105', bpDiastolic: '70', pulseRate: '102 bpm', spo2: '98%', respiratoryRate: '20 /min' }
      },
      {
        title: 'Uncontrolled Diabetes & Non-healing Foot Wound',
        titleHindi: 'अनियंत्रित शुगर और पैर का घाव',
        desc: 'Deep ulcer on right great toe with purulent discharge for 10 days, high blood sugar reading 290 mg/dL, mild fever, numbness in feet.',
        vitals: { temperature: '100.4 °F', bpSystolic: '138', bpDiastolic: '88', pulseRate: '88 bpm', spo2: '97%', respiratoryRate: '18 /min' }
      },
      {
        title: 'Severe Migraine Headache & Photophobia',
        titleHindi: 'अत्यधिक सिरदर्द और प्रकाश से परेशानी',
        desc: 'Throbbing left-sided headache for 18 hours with severe nausea, sensitivity to light and sound, unable to eat or sleep.',
        vitals: { temperature: '98.6 °F', bpSystolic: '130', bpDiastolic: '84', pulseRate: '84 bpm', spo2: '99%', respiratoryRate: '16 /min' }
      }
    ];
    const item = cases[Math.floor(Math.random() * cases.length)];
    title = item.title;
    titleHindi = item.titleHindi;
    description = `Patient ${name} (${age}y, ${gender}): ${item.desc}`;
    vitals = item.vitals;
  } else {
    const cases = [
      {
        title: 'Upper Respiratory Tract Infection',
        titleHindi: 'गले में खराश और बहती नाक',
        desc: 'Sore throat, sneezing, clear nasal discharge, mild forehead heaviness for 2 days. Normal appetite, no difficulty breathing.',
        vitals: { temperature: '98.9 °F', bpSystolic: '120', bpDiastolic: '80', pulseRate: '74 bpm', spo2: '99%', respiratoryRate: '16 /min' }
      },
      {
        title: 'Mild Dyspepsia / Acidity',
        titleHindi: 'पेट में जलन और गैस',
        desc: 'Burning sensation in upper abdomen after spicy meal, mild bloating, burping, relieved temporarily by antacids.',
        vitals: { temperature: '98.6 °F', bpSystolic: '118', bpDiastolic: '76', pulseRate: '72 bpm', spo2: '99%', respiratoryRate: '14 /min' }
      },
      {
        title: 'Routine Antenatal Checkup (24 Weeks)',
        titleHindi: 'गर्भावस्था की सामान्य जांच',
        desc: '24-week pregnant woman attending routine ANC checkup. Feeling fetal movements well. Mild swelling in feet at end of day.',
        vitals: { temperature: '98.4 °F', bpSystolic: '112', bpDiastolic: '74', pulseRate: '80 bpm', spo2: '99%', respiratoryRate: '16 /min' }
      }
    ];
    const item = cases[Math.floor(Math.random() * cases.length)];
    title = item.title;
    titleHindi = item.titleHindi;
    description = `Patient ${name} (${age}y, ${gender}): ${item.desc}`;
    vitals = item.vitals;
  }

  return {
    id: 'rand_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    title,
    titleHindi,
    category: chosenCat,
    description,
    age,
    gender,
    patientName: name,
    vitals
  };
}

