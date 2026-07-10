import { create } from 'zustand';

interface PreferencesState {
  // 언어 설정
  language: 'ko' | 'en';
  // 화면 진입 시 자동 TTS 재생 여부
  autoTts: boolean;
  // 폰트 크기 배율 (1.0 = 기본, 1.2 = 크게, 1.5 = 매우 크게)
  fontScale: 1.0 | 1.2 | 1.5;
  // 고대비 모드
  highContrast: boolean;

  // 액션
  setLanguage: (lang: 'ko' | 'en') => void;
  setAutoTts: (enabled: boolean) => void;
  setFontScale: (scale: 1.0 | 1.2 | 1.5) => void;
  setHighContrast: (enabled: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  language: 'ko',
  autoTts: true,
  fontScale: 1.0,
  highContrast: false,

  setLanguage: (language) => set({ language }),
  setAutoTts: (autoTts) => set({ autoTts }),
  setFontScale: (fontScale) => set({ fontScale }),
  setHighContrast: (highContrast) => set({ highContrast }),
}));
