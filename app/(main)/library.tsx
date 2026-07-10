// 보관함 화면 — 등록된 약 목록 (보라 색군)
// Supabase에서 medications 조회 → 카드 그리드

import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
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

// DB에서 조회되는 약 정보 타입
interface MedicationRow {
  id: string;
  name: string;
  pictogram_morpheme_id: string | null;
  dosage_per_time: number;
  active: boolean;
  created_at: string;
}

// morpheme_id → 이모지
function morphemeToEmoji(id: string | null): string {
  if (!id) return '💊';
  const map: Record<string, string> = {
    'pill.round.white': '⚪',
    'pill.round.red': '🔴',
    'pill.round.blue': '🔵',
    'pill.capsule.blue': '💊',
    'info.generic_prescription': '📋',
  };
  return map[id] ?? '💊';
}

export default function LibraryScreen() {
  const router = useRouter();
  const { language, autoTts } = usePreferencesStore();
  const { user } = useAuthStore();
  const t = locales[language];

  const [medications, setMedications] = useState<MedicationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (autoTts) {
      speak(t.library.enterTts, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
    }
    void fetchMedications();
  }, []);

  const fetchMedications = useCallback(async (): Promise<void> => {
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('medications')
      .select('id, name, pictogram_morpheme_id, dosage_per_time, active, created_at')
      .eq('user_id', user.id)
      .order('active', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMedications(data as MedicationRow[]);
    }
    setLoading(false);
  }, [user]);

  // 날짜 포맷
  const formatDate = (iso: string): string => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const renderItem = ({ item }: { item: MedicationRow }) => (
    <TouchableOpacity
      style={[styles.card, !item.active && styles.cardInactive]}
      onPress={() => router.push({ pathname: '/(main)/medication/[id]', params: { id: item.id } })}
      accessibilityRole="button"
      accessibilityLabel={item.name}
    >
      {/* 약 픽토그램 */}
      <Text style={styles.cardIcon}>{morphemeToEmoji(item.pictogram_morpheme_id)}</Text>

      {/* 정보 영역 */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
      </View>

      {/* 활성/비활성 표시 점 */}
      <View style={[styles.statusDot, { backgroundColor: item.active ? colors.green[600] : colors.neutral[400] }]} />
      <Text style={[styles.statusText, { color: item.active ? colors.green[600] : colors.neutral[400] }]}>
        {item.active ? t.library.active : t.library.inactive}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Screen>
      {/* 헤더 */}
      <Text style={styles.title}>{t.library.title}</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.purple[600]} />
        </View>
      ) : medications.length === 0 ? (
        // 빈 상태
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📁</Text>
          <Text style={styles.emptyText}>{t.library.empty}</Text>
        </View>
      ) : (
        <FlatList
          data={medications}
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
    color: colors.purple[600],
    marginBottom: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyIcon: {
    fontSize: 80,
  },
  emptyText: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  list: {
    gap: 12,
    paddingBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.purple[50],
    borderColor: colors.purple[100],
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    minHeight: touchTargets.minCardSize,
    gap: 12,
  },
  cardInactive: {
    opacity: 0.5,
  },
  cardIcon: {
    fontSize: 48,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[800],
  },
  cardDate: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
  },
});
