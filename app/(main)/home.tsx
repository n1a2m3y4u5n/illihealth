import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { PictogramCard } from '../../components/PictogramCard';
import { TodayContext } from '../../components/TodayContext';
import { MedicationStrip } from '../../components/MedicationStrip';
import { speak } from '../../lib/voice';
import { usePreferencesStore } from '../../stores/preferences';
import { useAuthStore } from '../../stores/auth';
import koJson from '../../locales/ko.json';
import enJson from '../../locales/en.json';

const locales = { ko: koJson, en: enJson };

// 홈 화면 — 2×2 픽토그램 카드 그리드
// Screen 컴포넌트로 SOS + VoiceButton 자동 배치
export default function HomeScreen() {
  const router = useRouter();
  const { language, autoTts } = usePreferencesStore();
  const { user } = useAuthStore();
  const t = locales[language];

  useEffect(() => {
    if (autoTts) {
      const greeting = user?.user_metadata?.['name']
        ? `${String(user.user_metadata['name'])}${t.home.greetingNamed}`
        : t.home.greeting;
      speak(greeting, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
    }
  }, []);

  return (
    <Screen>
      {/* 날짜·날씨 픽토그램 헤더 */}
      <TodayContext />

      {/* 지금 먹을 약 알림 스트립 */}
      <MedicationStrip />

      {/* 2×2 픽토그램 카드 그리드 */}
      <View style={styles.grid}>
        {/* 파랑: 카메라 / OCR / 사진 등록 */}
        <PictogramCard
          color="blue"
          icon="📷"
          label={t.home.camera}
          onPress={() => router.push('/(main)/camera')}
          size={140}
        />

        {/* 보라: 보관함 / 설명서 */}
        <PictogramCard
          color="purple"
          icon="📁"
          label={t.home.library}
          onPress={() => router.push('/(main)/library')}
          size={140}
        />

        {/* 분홍: 건강기록 / 일지 */}
        <PictogramCard
          color="pink"
          icon="🩺"
          label={t.home.log}
          onPress={() => router.push('/(main)/log')}
          size={140}
        />

        {/* 노랑: 예방 / 백신 / 만성질환 */}
        <PictogramCard
          color="amber"
          icon="🛡️"
          label={t.home.prevention}
          onPress={() => router.push('/(main)/prevention' as never)}
          size={140}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    alignContent: 'center',
    paddingVertical: 8,
  },
});
