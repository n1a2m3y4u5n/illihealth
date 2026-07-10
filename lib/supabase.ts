import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// 런타임 환경 변수 누락 경고 (빌드 타임엔 비어있을 수 있음)
if (__DEV__ && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn(
    '[IlliHealth] Supabase 환경 변수가 없습니다. .env.example을 참고하여 .env 파일을 생성해주세요.'
  );
}

// Supabase 클라이언트 — Phase 0에서는 비타입 모드로 초기화
// `supabase gen types typescript` 실행 후 generated/supabase-types.ts로 교체 가능
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
