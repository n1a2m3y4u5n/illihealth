# IlliHealth

개도국 문맹 사용자의 의료 정보 접근성을 픽토그램·음성으로 보장하는 모바일 앱.  
UN SDG 3 (건강과 웰빙) 달성 목표. React Native + Expo (managed workflow).

---

## 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 Supabase 프로젝트의 URL과 anon key를 입력합니다:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 앱 실행

```bash
# iOS 시뮬레이터
npm run ios

# Android 에뮬레이터
npm run android

# Expo Go (QR 코드 스캔)
npm start
```

---

## Supabase 마이그레이션 적용

### 방법 A — Supabase 웹 대시보드 (권장, 빠름)

1. [supabase.com](https://supabase.com) → 프로젝트 선택
2. **SQL Editor** → **New Query**
3. `supabase/migrations/0001_initial.sql` 내용을 붙여넣기
4. **RUN** 클릭

완료 후 **Table Editor**에서 14개 테이블이 생성됐는지 확인:
- `user_profiles`, `prescriptions`, `medications`, `medication_schedules`
- `medication_logs`, `health_logs`, `progress_photos`, `vaccinations`
- `chronic_conditions`, `device_manuals`, `share_tokens`, `emergency_contacts`
- `interaction_warnings`, `alarm_schedules`

### 방법 B — Supabase CLI

```bash
# Supabase CLI 설치
npm install -g supabase

# 프로젝트 연결
supabase link --project-ref your-project-ref

# 마이그레이션 적용
supabase db push
```

---

## 테스트 실행

```bash
npm test
```

단위 테스트 항목:
- `__tests__/pictogram.test.ts` — 팀원 모듈 Mock 검증
- `__tests__/ocr.test.ts` — OCR 인터페이스 검증

---

## 팀원 모듈 교체 방법

픽토그램 합성 엔진이 준비되면:

```typescript
// lib/pictogram.ts 맨 아래 한 줄만 변경
// 변경 전:
export const composer: PictogramComposer = mockComposer;

// 변경 후:
import { realComposer } from './pictogram-engine'; // 팀원 제공 모듈
export const composer: PictogramComposer = realComposer;
```

---

## 빌드 로드맵

| Phase | 상태 | 내용 |
|---|---|---|
| 0 — Foundation | ✅ 완료 | 앱 셸, 인증, Supabase, OCR, TTS, 픽토그램 UI 프레임워크 |
| 1 — Core Loop | 🔲 대기 | 진단서 OCR, 보관함, 복약 알람, 일지 |
| 2 — Voice+Safety | 🔲 대기 | STT, 설명서 OCR, 오프라인, 상호작용 경고, 응급, QR |
| 3 — Polish | 🔲 대기 | 만성질환, 사진 경과, 백신, 감염병, 튜토리얼 |

상세 로드맵: `docs/ROADMAP.md`

---

## 프로젝트 구조

```
illihealth/
├── app/              # Expo Router 화면
│   ├── (auth)/       # 인증 플로우 (welcome → phone → otp → pin)
│   └── (main)/       # 메인 화면 (홈 + stub 화면들)
├── components/       # 재사용 UI 컴포넌트
├── design-tokens/    # 컬러·타이포·스페이싱·터치 타깃 상수
├── lib/              # 비즈니스 로직 (ocr, auth, voice, pictogram, supabase)
├── stores/           # Zustand 상태 관리
├── locales/          # i18n (ko.json, en.json)
├── supabase/         # 마이그레이션 SQL + Edge Functions
└── docs/             # ROADMAP, SCHEMA, VOICE_VOCAB
```
