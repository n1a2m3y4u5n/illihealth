// 예방 허브 화면 — 만성질환 / 백신 / 감염병 경보
// 노랑·주황 색군

import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { PictogramCard } from '../../components/PictogramCard';
import { speak } from '../../lib/voice';
import { usePreferencesStore } from '../../stores/preferences';
import koJson from '../../locales/ko.json';
import enJson from '../../locales/en.json';

const locales = { ko: koJson, en: enJson };

export default function PreventionScreen() {
  const router = useRouter();
  const { language, autoTts } = usePreferencesStore();
  const t = locales[language];

  useEffect(() => {
    if (autoTts) {
      void speak(t.prevention.enterTts, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
    }
  }, []);

  return (
    <Screen>
      <View style={styles.grid}>
        <PictogramCard
          color="amber"
          icon="🩺"
          label={t.prevention.chronic}
          onPress={() => router.push('/(main)/chronic' as never)}
          size={140}
        />
        <PictogramCard
          color="amber"
          icon="💉"
          label={t.prevention.vaccine}
          onPress={() => router.push('/(main)/vaccine' as never)}
          size={140}
        />
        <PictogramCard
          color="red"
          icon="🦠"
          label={t.prevention.epidemic}
          onPress={() => router.push('/(main)/epidemic' as never)}
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
