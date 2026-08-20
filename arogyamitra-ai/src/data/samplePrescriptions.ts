export interface SamplePrescription {
  id: string;
  title: string;
  titleHindi: string;
  doctorName: string;
  clinic: string;
  date: string;
  imageUrl: string;
  description: string;
}

// Generate SVG data URLs for high-quality mock handwritten/printed doctor prescription notes
function createPrescriptionSvgDataUrl(doctor: string, ptName: string, age: string, diagnosis: string, notes: string[]): string {
  const noteLines = notes.map((n, i) => `<text x="50" y="${220 + i * 45}" font-family="Dancing Script, Caveat, cursive, sans-serif" font-size="22" font-weight="bold" fill="#1e293b">${i + 1}. ${n}</text>`).join('');
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" style="background:#fefcbf;">
    <!-- Paper background texture -->
    <rect width="600" height="750" fill="#fcfbfa" />
    <rect x="20" y="20" width="560" height="710" fill="none" stroke="#cbd5e1" stroke-width="2" rx="8" />
    
    <!-- Clinic Header -->
    <text x="300" y="55" font-family="'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="bold" fill="#0f766e" text-anchor="middle">${doctor}</text>
    <text x="300" y="75" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" fill="#475569" text-anchor="middle">PRIMARY HEALTHCARE CENTER (PHC) CLINIC</text>
    <text x="300" y="92" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" fill="#64748b" text-anchor="middle">Reg. No: APAC-PHC-88492 | Emergency Helpline: 108</text>
    <line x1="40" y1="105" x2="560" y2="105" stroke="#0f766e" stroke-width="2"/>
    
    <!-- Patient Info -->
    <text x="50" y="130" font-family="sans-serif" font-size="13" font-weight="bold" fill="#334155">Patient: ${ptName}</text>
    <text x="350" y="130" font-family="sans-serif" font-size="13" font-weight="bold" fill="#334155">Age/Sex: ${age}</text>
    <text x="50" y="150" font-family="sans-serif" font-size="13" fill="#475569">Date: ${new Date().toLocaleDateString()}</text>
    <text x="350" y="150" font-family="sans-serif" font-size="13" fill="#0f766e" font-weight="bold">Diagnosis: ${diagnosis}</text>
    
    <line x1="40" y1="165" x2="560" y2="165" stroke="#e2e8f0" stroke-width="1.5"/>
    
    <!-- Rx Symbol -->
    <text x="45" y="195" font-family="Georgia, serif" font-size="34" font-weight="bold" fill="#0f766e">Rx</text>
    
    <!-- Handwritten Medicine Lines -->
    ${noteLines}
    
    <!-- Doctor Advice & Signature -->
    <line x1="40" y1="580" x2="560" y2="580" stroke="#e2e8f0" stroke-width="1.5"/>
    <text x="50" y="610" font-family="sans-serif" font-size="12" font-weight="bold" fill="#475569">Advice: Drink boiled warm water, steam inhalation BD, rest 3 days.</text>
    <text x="50" y="630" font-family="sans-serif" font-size="12" fill="#64748b">Follow up in PHC after 5 days if fever persists.</text>
    
    <path d="M 420 670 Q 450 630 480 660 T 520 640" stroke="#0369a1" stroke-width="3" fill="none"/>
    <text x="450" y="690" font-family="sans-serif" font-size="11" font-weight="bold" fill="#334155">(Medical Officer Signature)</text>
  </svg>`;

  return 'data:image/svg+xml;base64,' + btoa(unescapedSvg(svg));
}

function unescapedSvg(str: string): string {
  return encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
    function toSolidBytes(_match, p1) {
      return String.fromCharCode(parseInt(p1, 16));
    });
}

export const SAMPLE_PRESCRIPTIONS: SamplePrescription[] = [
  {
    id: 'sample-rx-1',
    title: 'Acute Bronchitis & Fever Rx',
    titleHindi: 'श्वसन संक्रमण और बुखार का पर्चा',
    doctorName: 'Dr. Ramesh Sharma, M.B.B.S.',
    clinic: 'PHC Rampur',
    date: '01/08/2026',
    description: 'Contains Amoxicillin 500mg (1-0-1), Paracetamol 650mg (1-1-1 SOS), Pantoprazole 40mg (1-0-0 AC), Levocetirizine 5mg (0-0-1 HS).',
    imageUrl: createPrescriptionSvgDataUrl(
      'Dr. Ramesh Sharma, M.B.B.S.',
      'Sita Devi',
      '32 / F',
      'Acute Upper Respiratory Infection',
      [
        'Tab. Amoxicillin 500mg --- 1-0-1 (BD) x 5 days (PC)',
        'Tab. Dolo (Paracetamol) 650mg --- 1-1-1 (TDS) x 3 days (PC/SOS)',
        'Cap. Pantoprazole 40mg --- 1-0-0 (OD) x 5 days (Empty Stomach / AC)',
        'Tab. Levocetirizine 5mg --- 0-0-1 (HS) x 5 days (Bedtime)'
      ]
    )
  },
  {
    id: 'sample-rx-2',
    title: 'Hypertension & Diabetes Maintenance',
    titleHindi: 'उच्च रक्तचाप और शुगर की दवा',
    doctorName: 'Dr. Ananya Roy, M.D.',
    clinic: 'PHC Sonapur',
    date: '28/07/2026',
    description: 'Metformin 500mg (1-0-1 PC), Telmisartan 40mg (1-0-0 BBF), Glimepiride 1mg (1-0-0 AC).',
    imageUrl: createPrescriptionSvgDataUrl(
      'Dr. Ananya Roy, M.D.',
      'Mohan Lal',
      '58 / M',
      'Type 2 Diabetes & Hypertension',
      [
        'Tab. Metformin 500mg --- 1-0-1 (BD) x 30 days (PC after meals)',
        'Tab. Telmisartan 40mg --- 1-0-0 (OD) x 30 days (Before Breakfast BBF)',
        'Tab. Glimepiride 1mg --- 1-0-0 (OD) x 30 days (15 mins before Breakfast AC)',
        'Tab. Neurobion Forte --- 0-1-0 (OD) x 30 days (After Lunch)'
      ]
    )
  },
  {
    id: 'sample-rx-3',
    title: 'Pediatric Acute Diarrhea & Fever',
    titleHindi: 'बच्चों में दस्त और बुखार की दवा',
    doctorName: 'Dr. K. V. Rao, DCH',
    clinic: 'PHC Chandragiri',
    date: '30/07/2026',
    description: 'ORS Solution (SOS), Syrup Zinc 20mg (1-0-0 OD), Syrup Ondansetron (1 tsp SOS), Syrup Paracetamol (5ml TDS).',
    imageUrl: createPrescriptionSvgDataUrl(
      'Dr. K. V. Rao, DCH',
      'Aarav Kumar',
      '3 yrs / M',
      'Acute Watery Diarrhea & Fever',
      [
        'Sachet ORS --- 1 Litre boiled water, drink frequently (SOS)',
        'Syr. Zinc (20mg/5ml) --- 1-0-0 (5ml OD) x 14 days',
        'Syr. Ondansetron (2mg/5ml) --- 2.5ml SOS before feeding (for vomiting)',
        'Syr. Paracetamol (120mg/5ml) --- 5ml TDS x 3 days (if fever > 100°F)'
      ]
    )
  }
];
