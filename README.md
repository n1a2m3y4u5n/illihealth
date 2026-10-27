# IlliHealth

글을 읽기 어려운 사용자가 의료정보를 픽토그램과 음성으로 접할 수 있게 하는 모바일 앱입니다.

## 소개

처방전과 약 설명서를 사진으로 찍으면 글자를 읽어(OCR) 픽토그램 순서로 바꾸고, 음성으로 읽어 줍니다. 복약 알림과 건강 기록, 응급 연락처, 의료진과의 QR 공유도 글 없이 쓸 수 있게 만들었습니다. UN SDG 3(건강과 웰빙)을 목표로 하며, SnapCare와 e-ICON으로 이어지는 계열의 모바일 앱입니다. 웹 버전은 [illihealth-web](https://github.com/n1a2m3y4u5n/illihealth-web)입니다.

## 주요 기능

- 로그인: 전화번호와 SMS 인증번호(OTP), 그림 4개를 순서대로 고르는 그림 비밀번호, 생체 인증
- 촬영: 처방전 또는 설명서를 사각형에 맞춰 찍고, OCR과 픽토그램 변환 진행을 단계별로 안내
- 처방 확인: 변환된 픽토그램을 확인하는 화면(`prescription-review`)
- 보관함: 등록된 약 목록과 약 상세
- 복약 알림과 알람 화면
- 건강 기록: 컨디션 기록, 사진 기록
- 약물 상호작용 확인 (Supabase Edge Function)
- 응급 모드: 응급 연락처와 현재 복용 중인 약 요약
- 의료진 QR 공유: 일회용 토큰으로 복약 기록 공유
- 예방: 만성질환 관리, 백신 접종 일정, 감염병 경보
- 음성 출력(TTS)과 음성 명령 입력(STT)
- 한국어, 영어 지원

## 기술

- React Native 0.81, Expo 54 (managed workflow, Expo Router), TypeScript, NativeWind
- Supabase (Auth, DB, Edge Functions), Zustand
- OCR: Tesseract.js, 선택적으로 Google Cloud Vision 폴백
- 음성: expo-speech, expo-speech-recognition
- 테스트: Jest

## 실행 방법

```bash
npm install
cp .env.example .env
```

`.env`에 Supabase 프로젝트의 URL과 anon key를 입력합니다. 다른 항목은 선택입니다.

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_USE_VISION_API=            # true이면 Google Cloud Vision 폴백 사용
EXPO_PUBLIC_GOOGLE_VISION_API_KEY=
```

```bash
npm start            # Expo Go (QR 스캔)
npm run ios          # iOS 시뮬레이터
npm run android      # Android 에뮬레이터
npm test             # Jest 단위 테스트
```

### Supabase 마이그레이션

Supabase 대시보드의 SQL Editor에서 `supabase/migrations/0001_initial.sql`과 `0002_phase23.sql`을 차례로 실행하거나, Supabase CLI를 씁니다.

```bash
supabase link --project-ref <project-ref>
supabase db push
```

Edge Function은 `supabase/functions/`(`epidemic-poll`, `interaction-check`, `share-token`)에 있습니다.

## 픽토그램 엔진 교체

`lib/pictogram.ts`에는 목(mock) 합성기가 연결되어 있습니다. 실제 픽토그램 합성 엔진이 준비되면 파일 맨 아래 export 한 줄만 바꿉니다.

```typescript
// 변경 전
export const composer: PictogramComposer = mockComposer;

// 변경 후
import { realComposer } from './pictogram-engine';
export const composer: PictogramComposer = realComposer;
```

## 프로젝트 구조

```
app/              Expo Router 화면
  (auth)/         인증 흐름 (welcome -> phone -> otp -> 그림 비밀번호)
  (main)/         메인 화면
components/       재사용 UI 컴포넌트
design-tokens/    색, 글꼴, 간격, 터치 영역 상수
lib/              OCR, 인증, 음성, 픽토그램, Supabase 등
stores/           Zustand 상태
locales/          i18n (ko.json, en.json)
supabase/         마이그레이션 SQL, Edge Functions
docs/             ROADMAP, SCHEMA, VOICE_VOCAB
```
