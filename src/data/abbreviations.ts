import { MedicalAbbreviation } from '../types';

export const MEDICAL_ABBREVIATIONS: MedicalAbbreviation[] = [
  {
    abbr: 'OD',
    fullLatin: 'Omni Die',
    englishMeaning: 'Once daily',
    hindiMeaning: 'दिन में एक बार',
    dosagePattern: '1-0-0 or 0-0-1',
    commonContext: 'Maintenance drugs, vitamins, BP medicines'
  },
  {
    abbr: 'BD / BID',
    fullLatin: 'Bis In Die',
    englishMeaning: 'Twice a day',
    hindiMeaning: 'दिन में दो बार (सुबह और रात)',
    dosagePattern: '1-0-1',
    commonContext: 'Antibiotics, pain relievers, anti-diabetics'
  },
  {
    abbr: 'TDS / TID',
    fullLatin: 'Ter In Die',
    englishMeaning: 'Three times a day',
    hindiMeaning: 'दिन में तीन बार (सुबह, दोपहर, रात)',
    dosagePattern: '1-1-1',
    commonContext: 'Short-acting antibiotics, antacids, muscle relaxants'
  },
  {
    abbr: 'QDS / QID',
    fullLatin: 'Quater In Die',
    englishMeaning: 'Four times a day',
    hindiMeaning: 'दिन में चार बार (हर 6 घंटे में)',
    dosagePattern: '1-1-1-1',
    commonContext: 'Eye drops, severe infection syrups'
  },
  {
    abbr: 'HS',
    fullLatin: 'Hora Somni',
    englishMeaning: 'At bedtime',
    hindiMeaning: 'रात को सोने से ठीक पहले',
    dosagePattern: '0-0-1 (HS)',
    commonContext: 'Sleep aids, cholesterol statins, anti-allergics'
  },
  {
    abbr: 'AC',
    fullLatin: 'Ante Cibum',
    englishMeaning: 'Before meals',
    hindiMeaning: 'खाना खाने से पहले (खाली पेट)',
    dosagePattern: '30 mins before food',
    commonContext: 'Proton pump inhibitors (Pantoprazole), Insulin'
  },
  {
    abbr: 'PC',
    fullLatin: 'Post Cibum',
    englishMeaning: 'After meals',
    hindiMeaning: 'खाना खाने के बाद',
    dosagePattern: 'After breakfast/lunch/dinner',
    commonContext: 'Painkillers (NSAIDs), Iron supplements, Metformin'
  },
  {
    abbr: 'SOS',
    fullLatin: 'Si Opus Sit',
    englishMeaning: 'Take as needed / In emergency',
    hindiMeaning: 'जरूरत पड़ने पर या दर्द/बुखार होने पर',
    dosagePattern: 'As required (Max limit specified)',
    commonContext: 'Fever reducers (Paracetamol), Anti-vomiting (Ondansetron), Inhalers'
  },
  {
    abbr: 'STAT',
    fullLatin: 'Statim',
    englishMeaning: 'Immediately',
    hindiMeaning: 'तुरंत (बिना देरी किए)',
    dosagePattern: 'Single dose right now',
    commonContext: 'Emergency injection, immediate anti-allergic or aspirin'
  },
  {
    abbr: 'BBF',
    fullLatin: 'Before Breakfast',
    englishMeaning: 'Before Morning Breakfast',
    hindiMeaning: 'सुबह नाश्ते से पहले',
    dosagePattern: 'Morning empty stomach',
    commonContext: 'Thyroxine (Thyroid), Anti-ulcer medicines'
  }
];

export interface FirstAidProtocol {
  id: string;
  title: string;
  titleHindi: string;
  icon: string;
  steps: string[];
  stepsHindi: string[];
  doNot: string[];
  doNotHindi: string[];
}

export const PHC_FIRST_AID_PROTOCOLS: FirstAidProtocol[] = [
  {
    id: 'snake-bite',
    title: 'Snake Bite Emergency First Aid',
    titleHindi: 'सांप के काटने पर तुरंत प्राथमिक उपचार',
    icon: '🐍',
    steps: [
      'Keep patient calm and completely still. Movement speeds up venom spreading.',
      'Immobilize the bitten limb with a loose splint or cloth wrapper at body level.',
      'Remove tight rings, bangles, anklets, or shoes near the bite area before swelling starts.',
      'Transport immediately to PHC or hospital with Anti-Snake Venom (ASV).'
    ],
    stepsHindi: [
      'मरीज को शांत रखें और हिलने-डुलने न दें। हरकत करने से ज़हर तेजी से फैलता है।',
      'काटे गए हाथ या पैर को किसी पट्टी या कपड़े से स्थिर रखें (बहुत कसकर न बांधें)।',
      'सूजन शुरू होने से पहले ही अंगूठी, चूड़ी, कड़ा या जूते उतार दें।',
      'मरीज को तुरंत नजदीकी अस्पताल ले जाएं जहां स्नेक वेनम (ASV) उपलब्ध हो।'
    ],
    doNot: [
      'Do NOT cut or suck the bite wound.',
      'Do NOT apply tight tourniquets or ice.',
      'Do NOT give alcohol, tea, or local herbs.'
    ],
    doNotHindi: [
      'घाव पर कट न लगाएं और न ही मुंह से जहर चूसने की कोशिश करें।',
      'अंग को बहुत कसकर न बांधें और न ही बर्फ लगाएं।',
      'शराब, चाय, या देशी जड़ी-बूटियां न दें।'
    ]
  },
  {
    id: 'dehydration-ors',
    title: 'Severe Diarrhea & Dehydration (ORS Protocol)',
    titleHindi: 'दस्त और डिहाइड्रेशन (ORS घोल विधि)',
    icon: '💧',
    steps: [
      'Mix 1 full packet of WHO-ORS in 1 Liter of clean boiled & cooled water.',
      'Give small frequent sips (1 teaspoon every 1-2 mins for infants, half glass after each loose stool for children).',
      'Continue breastfeeding or light food along with ORS solution.',
      'Give Zinc syrup (20mg daily for 14 days) to children under 5 years.'
    ],
    stepsHindi: [
      '1 लीटर साफ उबले व ठंडे पानी में ORS का 1 पूरा पैकेट अच्छी तरह घोलें।',
      'छोटे बच्चों को हर 1-2 मिनट में 1 चम्मच दें। हर दस्त के बाद आधा गिलास घोल पिलाएं।',
      'ORS के साथ मां का दूध या हल्का सुपाच्य भोजन बंद न करें।',
      '5 साल से छोटे बच्चों को रोजाना 20mg जिंक सिरप (14 दिनों तक) दें।'
    ],
    doNot: [
      'Do NOT stop fluids or milk feedings.',
      'Do NOT mix ORS with juice, milk, or aerated drinks.',
      'Do NOT give anti-diarrheal medicines to young children without doctor advice.'
    ],
    doNotHindi: [
      'पानी या दूध देना बंद न करें।',
      'ORS को दूध, जूस या कोल्ड ड्रिंक्स में न घोलें।',
      'डॉक्टर की सलाह के बिना बच्चों को दस्त रोकने की दवा न दें।'
    ]
  },
  {
    id: 'heat-stroke',
    title: 'Severe Heat Stroke First Aid',
    titleHindi: 'हीट स्ट्रोक (लू लगना) प्राथमिक उपचार',
    icon: '☀️',
    steps: [
      'Move patient to cool, shaded, or ventilated area immediately.',
      'Remove excess heavy clothes and apply cool wet cloths on forehead, armpits, and neck.',
      'Fan vigorously and sprinkle cool water over body.',
      'Sip cool water or ORS if conscious; raise legs slightly.'
    ],
    stepsHindi: [
      'मरीज को तुरंत छायादार, ठंडी या हवादार जगह पर ले जाएं।',
      'भारी कपड़े उतारें और माथे, बगल (armpits) और गर्दन पर ठंडे पानी की पट्टियां रखें।',
      'पंखा चलाएं और शरीर पर ठंडा पानी छिड़कें।',
      'होश में होने पर थोड़ा-थोड़ा ठंडा पानी या ORS घोल पिलाएं।'
    ],
    doNot: [
      'Do NOT force liquids if patient is unconscious or confused.',
      'Do NOT wrap patient in heavy blankets or give antipyretic pills without doctor supervision.'
    ],
    doNotHindi: [
      'बेहोशी की हालत में मुंह में पानी या कुछ भी न डालें।',
      'मरीज को कंबल में न लपेटें।'
    ]
  }
];
