export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'Hindi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'English', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'Bengali', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'Tamil', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'Telugu', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'Marathi', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'Gujarati', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'Kannada', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'Malayalam', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'Punjabi', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'Urdu', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
  { code: 'Nepali', name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵' },
  { code: 'Sinhala', name: 'Sinhala', nativeName: 'සිංහල', flag: '🇱🇰' },
  { code: 'Odia', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' }
];
