// STT 결과를 액션으로 매핑하는 의도 분류기
// docs/VOICE_VOCAB.md의 명령 사전을 기반으로 동작
// Phase 2에서 실제 STT와 연결; 지금은 인터페이스·구조만 정의

export type VoiceIntent =
  | 'navigate.home'
  | 'navigate.camera'
  | 'navigate.library'
  | 'navigate.log'
  | 'navigate.share'
  | 'navigate.back'
  | 'action.sos'
  | 'action.cancel'
  | 'action.retry'
  | 'medication.taken'
  | 'medication.skip'
  | 'medication.snooze'
  | 'confirm'
  | 'unknown';

interface IntentRule {
  keywords: string[];
  synonyms?: string[];
  intent: VoiceIntent;
}

// 전역 명령 + 홈 화면 명령
const INTENT_RULES: IntentRule[] = [
  { keywords: ['홈', '처음', '메인'],          intent: 'navigate.home' },
  { keywords: ['카메라', '사진', '찍을게', '약 등록'], intent: 'navigate.camera' },
  { keywords: ['보관함', '약 보여줘'],           intent: 'navigate.library' },
  { keywords: ['건강', '일지', '기록'],          intent: 'navigate.log' },
  { keywords: ['공유', '병원', 'QR'],           intent: 'navigate.share' },
  { keywords: ['뒤로', '이전'],                 intent: 'navigate.back' },
  { keywords: ['도와줘', '살려줘', '응급', '급해'], intent: 'action.sos' },
  { keywords: ['취소', '아니', '그만'],          intent: 'action.cancel' },
  { keywords: ['다시', '재시도', '한 번 더'],    intent: 'action.retry' },
  { keywords: ['먹었어', '먹었어요', '완료'],    intent: 'medication.taken' },
  { keywords: ['나중에', '이따', '안 먹어'],     intent: 'medication.skip' },
  { keywords: ['스누즈', '잠깐'],               intent: 'medication.snooze' },
  { keywords: ['맞아', '좋아', '응', '맞아요'], intent: 'confirm' },
];

// STT 결과 텍스트 → VoiceIntent 분류
export function classifyIntent(sttText: string): VoiceIntent {
  const normalized = sttText.trim().toLowerCase();

  for (const rule of INTENT_RULES) {
    const allKeywords = [...rule.keywords, ...(rule.synonyms ?? [])];
    if (allKeywords.some((kw) => normalized.includes(kw.toLowerCase()))) {
      return rule.intent;
    }
  }

  return 'unknown';
}
