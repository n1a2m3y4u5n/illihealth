import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Screen } from '../../components/Screen';
import { BigCheckButton } from '../../components/BigCheckButton';
import { colors } from '../../design-tokens/colors';
import { typography } from '../../design-tokens/typography';
import { speak } from '../../lib/voice';
import { usePreferencesStore } from '../../stores/preferences';
import koJson from '../../locales/ko.json';
import enJson from '../../locales/en.json';

const locales = { ko: koJson, en: enJson };

// 환영 화면 — 픽토그램 + "시작" 버튼
// 최초 진입 시 TTS 안내
export default function WelcomeScreen() {
  const router = useRouter();
  const { language, autoTts } = usePreferencesStore();
  const t = locales[language];

  useEffect(() => {
    if (autoTts) {
      speak(t.auth.welcome, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
    }
  }, []);

  function handleStart() {
    router.push('/(auth)/phone');
  }

  return (
    <Screen hideSos hideVoice>
      <View style={styles.container}>
        {/* 픽토그램 로고 영역 */}
        <View style={styles.logoArea}>
          <Text style={styles.logoIcon}>🏥</Text>
          <Text style={styles.appName}>{t.auth.welcomeSub}</Text>
          <Text style={styles.tagline}>{t.auth.welcome}</Text>
        </View>

        {/* 시작 버튼 */}
        <View style={styles.buttonArea}>
          <BigCheckButton
            onPress={handleStart}
            label={t.auth.start}
            size={96}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 48,
  },
  logoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logoIcon: {
    fontSize: 96,
  },
  appName: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.blue[600],
    letterSpacing: 1,
  },
  tagline: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  buttonArea: {
    alignItems: 'center',
    paddingBottom: 24,
  },
});
