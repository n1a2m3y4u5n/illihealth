// TTS + STT 래퍼
// TTS: expo-speech (기기 내장)
// STT: expo-speech-recognition

import * as Speech from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  lang?: string;
  onDone?: () => void;
  onError?: (error: string) => void;
}

// TTS: 텍스트를 음성으로 읽어줌
export async function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    Speech.speak(text, {
      rate: options.rate ?? 0.9,
      pitch: options.pitch ?? 1.0,
      language: options.lang ?? 'ko-KR',
      onDone: () => {
        options.onDone?.();
        resolve();
      },
      onError: (error) => {
        const msg = error instanceof Error ? error.message : String(error);
        options.onError?.(msg);
        reject(new Error(msg));
      },
    });
  });
}

// 현재 TTS 중지
export function stopSpeaking(): void {
  Speech.stop();
}

// OTP 코드를 한 자리씩 읽어줌
export async function speakOtp(code: string, lang = 'ko-KR'): Promise<void> {
  const spaced = code.split('').join(', ');
  return speak(spaced, { rate: 0.7, lang });
}

// STT: 음성을 텍스트로 변환 (최대 6초 대기)
export async function listen(lang = 'ko-KR'): Promise<string> {
  const hasPermission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  if (!hasPermission.granted) {
    throw new Error('마이크 권한이 없습니다');
  }

  return new Promise((resolve, reject) => {
    let transcript = '';
    let settled = false;

    const settle = (result: string | Error): void => {
      if (settled) return;
      settled = true;
      ExpoSpeechRecognitionModule.stop();
      if (result instanceof Error) reject(result);
      else resolve(result);
    };

    // 결과 이벤트 — 중간 결과 포함
    ExpoSpeechRecognitionModule.addListener('result', (event) => {
      if (event.results.length > 0) {
        transcript = event.results[0]?.transcript ?? '';
      }
      if (!event.isFinal) return;
      settle(transcript);
    });

    ExpoSpeechRecognitionModule.addListener('error', (event) => {
      settle(new Error(event.message ?? 'STT 오류'));
    });

    ExpoSpeechRecognitionModule.addListener('end', () => {
      settle(transcript);
    });

    ExpoSpeechRecognitionModule.start({
      lang,
      interimResults: true,
      maxAlternatives: 1,
      continuous: false,
    });

    // 10초 타임아웃
    setTimeout(() => settle(transcript), 10000);
  });
}

// STT 이벤트 훅 — 컴포넌트에서 사용
export { useSpeechRecognitionEvent };
