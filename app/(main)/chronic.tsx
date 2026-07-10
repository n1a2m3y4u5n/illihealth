// 만성질환 관리 화면 — 노랑 색군
// 사용자의 만성질환 목록 + 각 질환별 최근 건강 기록 요약

import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Screen } from '../../components/Screen';
import { speak } from '../../lib/voice';
import { supabase } from '../../lib/supabase';
import { usePreferencesStore } from '../../stores/preferences';
import { useAuthStore } from '../../stores/auth';
import { colors } from '../../design-tokens/colors';
import { typography } from '../../design-tokens/typography';
import { touchTargets } from '../../design-tokens/touch-targets';
import koJson from '../../locales/ko.json';
import enJson from '../../locales/en.json';

const locales = { ko: koJson, en: enJson };

// 만성질환 대표 픽토그램 매핑
const CONDITION_ICONS: Record<string, string> = {
  hypertension: '🫀',
  diabetes: '🩸',
  asthma: '🫁',
  arthritis: '🦴',
  kidney: '🫘',
  heart: '❤️',
};

// 만성질환 목록 (로컬 정의 — 추후 서버 확장 가능)
const CHRONIC_CONDITIONS = [
  { id: 'hypertension', emoji: '🫀' },
  { id: 'diabetes', emoji: '🩸' },
  { id: 'asthma', emoji: '🫁' },
  { id: 'arthritis', emoji: '🦴' },
  { id: 'kidney', emoji: '🫘' },
  { id: 'heart', emoji: '❤️' },
] as const;

type ConditionId = typeof CHRONIC_CONDITIONS[number]['id'];

interface UserCondition {
  id: string;
  condition_id: ConditionId;
  diagnosed_at: string | null;
}

export default function ChronicScreen() {
  const { language, autoTts } = usePreferencesStore();
  const { user } = useAuthStore();
  const t = locales[language];

  const [userConditions, setUserConditions] = useState<UserCondition[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (autoTts) {
      void speak(t.prevention.chronicEnterTts, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
    }
    void fetchConditions();
  }, []);

  const fetchConditions = useCallback(async (): Promise<void> => {
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from('user_chronic_conditions')
      .select('id, condition_id, diagnosed_at')
      .eq('user_id', user.id);

    if (data) setUserConditions(data as UserCondition[]);
    setLoading(false);
  }, [user]);

  const toggleCondition = async (conditionId: ConditionId): Promise<void> => {
    if (!user || adding) return;
    setAdding(true);

    const existing = userConditions.find((c) => c.condition_id === conditionId);
    if (existing) {
      // 삭제
      await supabase.from('user_chronic_conditions').delete().eq('id', existing.id);
      setUserConditions((prev) => prev.filter((c) => c.id !== existing.id));
    } else {
      // 추가
      const { data } = await supabase
        .from('user_chronic_conditions')
        .insert({ user_id: user.id, condition_id: conditionId })
        .select('id, condition_id, diagnosed_at')
        .single();
      if (data) setUserConditions((prev) => [...prev, data as UserCondition]);
    }

    setAdding(false);
  };

  return (
    <Screen>
      <Text style={styles.title}>{t.prevention.chronicTitle}</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.amber[600]} />
        </View>
      ) : (
        <View style={styles.grid}>
          {CHRONIC_CONDITIONS.map((cond) => {
            const isActive = userConditions.some((uc) => uc.condition_id === cond.id);
            return (
              <TouchableOpacity
                key={cond.id}
                style={[styles.card, isActive && styles.cardActive]}
                onPress={() => { void toggleCondition(cond.id); }}
                disabled={adding}
                accessibilityRole="button"
                accessibilityLabel={cond.id}
              >
                <Text style={styles.cardIcon}>{cond.emoji}</Text>
                {isActive && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.amber[600],
    marginBottom: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    paddingTop: 8,
  },
  card: {
    width: touchTargets.minCardSize,
    height: touchTargets.minCardSize,
    borderRadius: 20,
    backgroundColor: colors.amber[50],
    borderWidth: 2,
    borderColor: colors.amber[100],
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardActive: {
    borderColor: colors.amber[600],
    backgroundColor: colors.amber[100],
  },
  cardIcon: {
    fontSize: 48,
  },
  activeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.amber[600],
  },
});
