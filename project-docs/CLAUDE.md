# IlliHealth — Claude Code 컨텍스트

이 파일은 Claude Code가 모든 세션에서 자동으로 읽는다. 프로젝트 결정의 모든 기준점.

---

## 프로젝트 개요

IlliHealth는 개도국 문맹 사용자의 의료 정보 접근성을 픽토그램·음성으로 보장하는 모바일 앱이다. UN SDG 3 (건강과 웰빙) 달성을 목표로 한다.

### 핵심 가치 흐름
사용자가 진단서 또는 약·의료기기 설명서를 사진으로 찍으면, OCR이 텍스트를 추출하고, 팀원이 담당하는 픽토그램 합성 엔진이 그 텍스트를 픽토그램 시퀀스로 변환한다. 사용자는 글을 한 줄도 읽지 못해도 픽토그램과 음성만으로 진단 이해 → 복약 알람·기록 → 의료진과의 결과 공유의 전체 과정을 수행할 수 있다.

### 핵심 사용자
- 글을 읽지 못하는 사용자 (문맹)
- 개도국 환경 (네트워크 불안정, 저가형 기기)
- 시각이 약하거나 손이 떨리는 사용자 포함

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| 프레임워크 | React Native + Expo (managed workflow) |
| 라우팅 | Expo Router (file-based) |
| 스타일링 | NativeWind v4 (Tailwind CSS for RN) |
| 언어 | TypeScript (strict 모드) |
| OCR | Tesseract.js (오프라인 우선) + Google Cloud Vision (선택적) |
| 음성 TTS | Expo Speech (기기 내장) |
| 음성 STT | Expo Speech Recognition |
| 백엔드 | Supabase (Auth + PostgreSQL + Storage + Realtime + Edge Functions) |
| 푸시 알림 | Expo Notifications + FCM |
| 로컬 DB | WatermelonDB |
| 상태 관리 | Zustand |
| 인증 보조 | expo-local-authentication (생체) |

---

## 5대 디자인 원칙

1. **Pictogram-first**: 모든 핵심 기능을 텍스트 없이 픽토그램만으로 도달 가능해야 한다. 텍스트는 보조이며 사용자가 끌 수 있다.
2. **Big-target**: 모든 인터랙티브 요소는 최소 64×64dp. 카드 단위는 100×100dp 이상.
3. **Color = Category**: 색 자체가 의미 단위. 같은 색 = 같은 도메인.
4. **Voice as Peer**: 음성은 보조가 아니라 터치와 동등한 1차 입력. 모든 화면 하단에 마이크 FAB.
5. **3-Tap Rule**: 홈에서 어떤 기능이든 3번 이내 탭으로 도달.

---

## 카테고리별 컬러 시스템

| 색 | HEX | 의미 | 매핑 기능 |
|---|---|---|---|
| 파랑 | `#185FA5` | 새 정보·입력 | 카메라, OCR, 사진 등록 |
| 초록 | `#3B6D11` | 안전·복약·일상 | 복약 알람, 잔여량, 상호작용 경고 |
| 보라 | `#534AB7` | 보관·지식 | 보관함, 설명서, 의료진 QR |
| 분홍 | `#993556` | 신체·기록 | 일지, 사진 경과 |
| 노랑·주황 | `#BA7517` | 예방·주의 | 백신, 만성질환, 감염병 |
| 빨강 | `#A32D2D` | 긴급 | SOS, 응급 모드 |

각 색은 명도 변형(50/100/600/800 stop)으로 강조도를 조절한다. 컬러블라인드 안전을 위해 모든 정보는 색 + 픽토그램 모양 이중 인코딩.

---

## 화면 구조 (홈 기준)

| 영역 | 위치 | 구성 |
|---|---|---|
| 상단 우측 | 상시 | SOS 응급 버튼 (빨강 원형, 모든 화면 공통) |
| 상단 좌측 | 상시 | 네트워크·배터리 상태 (저시인성) |
| 상단 중앙 | 가변 | 날짜·날씨 픽토그램 |
| 알림 스트립 | 상단 | 지금 먹을 약 카드 (해당 시) |
| 메인 그리드 | 중앙 | 2×2 픽토그램 카드 — 사진(파랑) / 보관함(보라) / 건강기록(분홍) / 예방(노랑) |
| 하단 FAB | 상시 | 대형 마이크 버튼 (화면 폭의 18%) |

---

## 음성 통합 원칙

- 모든 화면 하단에 마이크 FAB 상시 노출
- 모든 버튼·메뉴는 음성 명령으로도 호출 가능
- 알람·확인 등 시스템 안내는 항상 TTS와 픽토그램 병행
- 화면 진입 시 자동 TTS 안내 (사용자 설정으로 끄기 가능)
- 자세한 명령·안내 사전: `docs/VOICE_VOCAB.md`

---

## 인증 시스템

| 단계 | 방식 |
|---|---|
| 최초 가입 | 전화번호 + SMS OTP (OTP를 TTS로 읽어줌) |
| 일상 로그인 | 픽토그램 PIN 4개 (12개 풀에서 순서 선택) |
| 자동 폴백 | 생체 인증 (지문·얼굴) — 가능 시 |
| 인증 복구 | 음성 보조 질문 + SMS OTP |
| 의료시설 연동 | 일회용 QR 의료 카드 |

---

## 팀원 담당 모듈 (블랙박스)

픽토그램 합성 엔진은 팀원이 담당한다. 인터페이스만 합의되어 있다. Phase 0에서 Mock을 만들고, 실제 모듈이 준비되면 교체한다.

```typescript
interface PictogramComposer {
  compose(input: {
    text: string;              // OCR 결과 텍스트
    lang: string;              // 'ko', 'sw', 'hi' 등
    confidence?: number;       // OCR 신뢰도 (선택)
    docType?: 'prescription' | 'device_manual';
  }): Promise<PictogramResult>;
}

type PictogramResult =
  | { success: true; sequence: PictogramItem[] }
  | { success: false; unmatched_tokens: string[]; partial_sequence: PictogramItem[] };

interface PictogramItem {
  type: 'medication' | 'instruction' | 'warning' | 'info';
  parts: { morpheme_id: string; props?: Record<string, unknown> }[];
  display_meta: { color: 'blue' | 'green' | 'purple' | 'pink' | 'amber' | 'red'; priority: number };
}
```

형태소 ID 규칙: `<category>.<shape>.<modifier>` 형식 권장. 예시:
- `pill.round.red` — 빨간 둥근 알약
- `pill.capsule.blue` — 파란 캡슐
- `count.3` — 3알
- `time.morning` — 아침
- `time.evening` — 저녁
- `context.after_meal` — 식후

---

## 18개 기능 → Phase 매핑

| Phase | 기능 |
|---|---|
| 0 — 인프라 | 픽토그램 UI 프레임워크(#14), TTS(#15), 인증, Supabase, OCR 래퍼, 팀원 모듈 Mock |
| 1 — 코어 루프 | 진단서 OCR(#1), 보관함(#3), 복약 알람(#4), 일지(#6) |
| 2 — 확장 | STT(#16), 설명서 OCR(#2), 오프라인 모드(#18), 잔여량(#5), 상호작용 경고(#8), 응급 모드(#9), QR 공유(#13) |
| 3 — 완성 | 만성질환(#12), 사진 경과(#7), 백신(#10), 감염병 경보(#11), 튜토리얼(#17) |

자세한 작업 순서: `docs/ROADMAP.md`. 각 Phase의 구체 작업 프롬프트: `prompts/PHASES.md`.

---

## 파일 구조

```
illihealth/
├── CLAUDE.md                       이 파일
├── app/                            Expo Router 화면
│   ├── (auth)/                     인증 플로우
│   │   ├── welcome.tsx
│   │   ├── phone.tsx
│   │   ├── otp.tsx
│   │   ├── picto-pin-setup.tsx
│   │   └── picto-pin-login.tsx
│   ├── (main)/                     메인 탭
│   │   ├── home.tsx
│   │   ├── camera.tsx
│   │   ├── library.tsx
│   │   ├── log.tsx
│   │   └── share.tsx
│   ├── alarm/[id].tsx              풀스크린 알람
│   ├── log/condition.tsx
│   ├── log/photo.tsx
│   └── _layout.tsx
├── components/                     재사용 UI
│   ├── PictogramCard.tsx
│   ├── BigCheckButton.tsx
│   ├── BigXButton.tsx
│   ├── SOSButton.tsx
│   ├── VoiceButton.tsx
│   ├── Screen.tsx
│   ├── TodayContext.tsx
│   └── MedicationStrip.tsx
├── lib/                            코어 유틸리티
│   ├── ocr.ts                      OCR 래퍼
│   ├── pictogram.ts                팀원 모듈 통합
│   ├── voice.ts                    STT·TTS 래퍼
│   ├── voice-intent.ts             음성 의도 분류
│   ├── supabase.ts                 Supabase 클라이언트
│   ├── sync.ts                     오프라인 동기화
│   ├── notifications.ts            FCM 래퍼
│   └── auth.ts                     인증 헬퍼
├── stores/                         Zustand 스토어
│   ├── auth.ts
│   └── preferences.ts
├── design-tokens/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── touch-targets.ts
├── pictograms/                     정적 픽토그램 SVG (USP·자체 제작)
├── locales/                        i18n (TTS용)
│   ├── ko.json
│   └── en.json
├── supabase/
│   ├── migrations/
│   │   └── 0001_initial.sql
│   └── functions/
│       ├── share-token/
│       ├── interaction-check/
│       └── epidemic-poll/
└── docs/
    ├── ROADMAP.md
    ├── SCHEMA.sql
    └── VOICE_VOCAB.md
```

---

## 코딩 컨벤션

- **언어**: 코드 주석·문서는 모두 한국어. 변수·함수명은 영어.
- **컴포넌트**: PascalCase, 파일명과 일치 (`PictogramCard.tsx` → `export function PictogramCard`)
- **훅**: `use` 접두사 (`useAuth`, `useMedications`)
- **DB 컬럼**: snake_case
- **TypeScript**: strict 모드, `any` 금지, 모든 함수 시그니처에 명시적 타입
- **UI 텍스트**: 최소화. 픽토그램이 우선. 필요한 경우 `locales/`에서 i18n으로 분리. 직접 하드코딩 금지.
- **터치 타깃**: 모든 인터랙티브 요소 ≥64dp. 카드 ≥100dp.
- **색**: 디자인 토큰에서만 import. 하드코딩된 hex 금지.
- **오류 처리**: 사용자에게는 픽토그램 ⚠️ + TTS 안내. 텍스트 오류 메시지 직접 노출 금지.

---

## 참조 문서

| 경로 | 내용 |
|---|---|
| `docs/ROADMAP.md` | 4단계 빌드 로드맵 (Phase 0~3) |
| `docs/SCHEMA.sql` | PostgreSQL 스키마 + RLS 정책 |
| `docs/VOICE_VOCAB.md` | 화면별 음성 명령·TTS 안내 사전 |
| `prompts/PHASES.md` | 각 Phase의 Claude Code 작업 프롬프트 |
