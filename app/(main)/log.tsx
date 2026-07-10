// 건강 일지 화면 — health_logs 타임라인
// 분홍 색군

import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
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
import koJson from '../../locales/ko.json';
import enJson from '../../locales/en.json';

const locales = { ko: koJson, en: enJson };

interface HealthLogRow {
  id: string;
  mood_score: number;
  pain_areas: string[];
  logged_at: string;
}

// mood 점수 → 이모지
function moodEmoji(score: number): string {
  const map: Record<number, string> = { 5: '😄', 4: '🙂', 3: '😐', 2: '😕', 1: '😢' };
  return map[score] ?? '😐';
}

// 신체 부위 → 이모지
function bodyEmoji(id: string): string {
  const map: Record<string, string> = {
    head: '🧠', chest: '🫀', stomach: '🫃',
    arm: '💪', leg: '🦵', back: '🔙',
  };
  return map[id] ?? '❓';
}

export default function LogScreen() {
  const { language, autoTts } = usePreferencesStore();
  const { user } = useAuthStore();
  const t = locales[language];

  const [logs, setLogs] = useState<HealthLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (autoTts) {
      void speak(t.log.enterTts, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
    }
    void fetchLogs();
  }, []);

  const fetchLogs = useCallback(async (): Promise<void> => {
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('health_logs')
      .select('id, mood_score, pain_areas, logged_at')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setLogs(data as HealthLogRow[]);
    }
    setLoading(false);
  }, [user]);

  const formatDate = (iso: string): string => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const renderItem = ({ item }: { item: HealthLogRow }) => (
    <View style={styles.card}>
      {/* 날짜 */}
      <Text style={styles.cardDate}>{formatDate(item.logged_at)}</Text>

      <View style={styles.cardBody}>
        {/* 기분 이모지 */}
        <Text style={styles.moodIcon}>{moodEmoji(item.mood_score)}</Text>

        {/* 통증 부위 이모지 목록 */}
        {item.pain_areas && item.pain_areas.length > 0 && (
          <View style={styles.painRow}>
            {item.pain_areas.map((area) => (
              <Text key={area} style={styles.painIcon}>{bodyEmoji(area)}</Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <Screen>
      <Text style={styles.title}>{t.log.title}</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.pink[600]} />
        </View>
      ) : logs.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🩺</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.pink[600],
    marginBottom: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 80,
  },
  list: {
    gap: 12,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: colors.pink[50],
    borderColor: colors.pink[100],
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  cardDate: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[400],
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  moodIcon: {
    fontSize: 48,
  },
  painRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
  },
  painIcon: {
    fontSize: 28,
  },
});
