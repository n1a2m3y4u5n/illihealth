import * as bcrypt from 'bcryptjs';
import * as LocalAuthentication from 'expo-local-authentication';
import { supabase } from './supabase';
import { speak } from './voice';

// 픽토그램 PIN에 사용되는 12개 고정 풀
// 동물·과일·도형 mix - 문맹 사용자도 직관적으로 구별 가능
export const PICTO_PIN_POOL = [
  { id: 'apple',    icon: '🍎', label: '사과' },
  { id: 'banana',   icon: '🍌', label: '바나나' },
  { id: 'dog',      icon: '🐶', label: '강아지' },
  { id: 'cat',      icon: '🐱', label: '고양이' },
  { id: 'sun',      icon: '☀️', label: '해' },
  { id: 'moon',     icon: '🌙', label: '달' },
  { id: 'star',     icon: '⭐', label: '별' },
  { id: 'flower',   icon: '🌸', label: '꽃' },
  { id: 'house',    icon: '🏠', label: '집' },
  { id: 'car',      icon: '🚗', label: '차' },
  { id: 'water',    icon: '💧', label: '물' },
  { id: 'fire',     icon: '🔥', label: '불' },
] as const;

export type PictoPinId = typeof PICTO_PIN_POOL[number]['id'];

// 픽토그램 PIN 4개 선택 순서를 해시로 변환
export async function hashPictoPin(sequence: PictoPinId[]): Promise<string> {
  const joined = sequence.join('-');
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(joined, salt);
}

// 픽토그램 PIN 검증
export async function verifyPictoPin(
  sequence: PictoPinId[],
  hash: string
): Promise<boolean> {
  const joined = sequence.join('-');
  return bcrypt.compare(joined, hash);
}

// 전화번호로 SMS OTP 발송 (Supabase Auth)
export async function sendOtp(phone: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithOtp({ phone });
  return { error: error?.message ?? null };
}

// OTP 검증 + 세션 발급
export async function verifyOtp(
  phone: string,
  token: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });
  return { error: error?.message ?? null };
}

// OTP 코드를 TTS로 한 자리씩 읽어줌
export async function readOtpAloud(code: string): Promise<void> {
  const spaced = code.split('').join(' ');
  await speak(`인증번호는 ${spaced} 입니다`, { rate: 0.7, lang: 'ko-KR' });
}

// 픽토그램 PIN을 DB에 저장 (가입 완료)
export async function savePictoPin(
  userId: string,
  phone: string,
  sequence: PictoPinId[]
): Promise<{ error: string | null }> {
  const hash = await hashPictoPin(sequence);

  const { error } = await supabase.from('user_profiles').upsert({
    id: userId,
    phone,
    picto_pin_hash: hash,
    language: 'ko',
  });

  return { error: error?.message ?? null };
}

// 픽토그램 PIN으로 로그인 검증
export async function loginWithPictoPin(
  userId: string,
  sequence: PictoPinId[]
): Promise<{ success: boolean; error: string | null }> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('picto_pin_hash')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? '프로필을 찾을 수 없습니다' };
  }

  const row = data as { picto_pin_hash: string };
  const ok = await verifyPictoPin(sequence, row.picto_pin_hash);
  return { success: ok, error: ok ? null : 'PIN이 일치하지 않습니다' };
}

// 생체 인증 가용 여부 확인
export async function checkBiometricAvailability(): Promise<{
  available: boolean;
  type: 'fingerprint' | 'face' | 'none';
}> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return { available: false, type: 'none' };

  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!enrolled) return { available: false, type: 'none' };

  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const hasFace = types.includes(
    LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
  );

  return {
    available: true,
    type: hasFace ? 'face' : 'fingerprint',
  };
}

// 생체 인증 실행
export async function authenticateWithBiometric(): Promise<{
  success: boolean;
  error: string | null;
}> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: '지문으로 간편 로그인',
    cancelLabel: '그림 비밀번호 사용',
    disableDeviceFallback: false,
  });

  return {
    success: result.success,
    error: result.success ? null : (result.error ?? '생체 인증 실패'),
  };
}
