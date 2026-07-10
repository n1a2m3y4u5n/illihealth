// 하단 마이크 FAB — 모든 화면 하단 중앙 고정
// Voice as Peer 원칙: 터치와 동등한 1차 입력
// STT 결과 → classifyIntent → 라우팅

import { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, useWindowDimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../design-tokens/colors';
import { listen, speak } from '../lib/voice';
import { classifyIntent } from '../lib/voice-intent';
import { usePreferencesStore } from '../stores/preferences';
import koJson from '../locales/ko.json';
import enJson from '../locales/en.json';

const locales = { ko: koJson, en: enJson };

export function VoiceButton() {
  const { width } = useWindowDimensions();
  const { language } = usePreferencesStore();
  const router = useRouter();
  const t = locales[language];
  const [listening, setListening] = useState(false);

  const size = Math.round(width * 0.18);
  const borderRadius = size / 2;

  async function handlePress(): Promise<void> {
    if (listening) return;
    setListening(true);

    try {
      await speak(t.voice.listening, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
      const sttText = await listen(language === 'ko' ? 'ko-KR' : 'en-US');
      const intent = classifyIntent(sttText);

      switch (intent) {
        case 'navigate.home':
          router.push('/(main)/home');
          break;
        case 'navigate.camera':
          router.push('/(main)/camera');
          break;
        case 'navigate.library':
          router.push('/(main)/library');
          break;
        case 'navigate.log':
          router.push('/(main)/log');
          break;
        case 'navigate.share':
          router.push('/(main)/share');
          break;
        case 'navigate.back':
          router.back();
          break;
        case 'action.sos':
          router.push('/(main)/emergency');
          break;
        default:
          await speak(t.voice.notHeard, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
      }
    } catch {
      // 권한 없거나 STT 실패 — 조용히 무시
    } finally {
      setListening(false);
    }
  }

  return (
    <TouchableOpacity
      onPress={() => { void handlePress(); }}
      accessibilityLabel="음성 명령"
      accessibilityRole="button"
      style={[
        styles.button,
        { width: size, height: size, borderRadius },
        listening && styles.buttonListening,
      ]}
    >
      <Text style={styles.icon}>{listening ? '👂' : '🎤'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.green[600],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.green[800],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonListening: {
    backgroundColor: colors.green[800],
  },
  icon: {
    fontSize: 32,
  },
});
