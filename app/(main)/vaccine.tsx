// 백신 접종 일정 화면 — 노랑 색군
// 표준 백신 목록 + 접종 완료/예정 상태 표시

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

// 기본 백신 목록
const STANDARD_VACCINES = [
  { id: 'flu', emoji: '🤧', monthDue: 10 },
  { id: 'covid', emoji: '🦠', monthDue: 0 },
  { id: 'hepatitisB', emoji: '🫀', monthDue: 0 },
  { id: 'tetanus', emoji: '💉', monthDue: 0 },
  { id: 'pneumococcal', emoji: '🫁', monthDue: 0 },
] as const;

type VaccineId = typeof STANDARD_VACCINES[number]['id'];

interface VaccineRecord {
  id: string;
  vaccine_id: VaccineId;
  vaccinated_at: string;
  next_due_at: string | null;
}

export default function VaccineScreen() {
  const { language, autoTts } = usePreferencesStore();
  const { user } = useAuthStore();
  const t = locales[language];

  const [records, setRecords] = useState<VaccineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (autoTts) {
      void speak(t.prevention.vaccineEnterTts, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
    }
    void fetchRecords();
  }, []);

  const fetchRecords = useCallback(async (): Promise<void> => {
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from('vaccine_records')
      .select('id, vaccine_id, vaccinated_at, next_due_at')
      .eq('user_id', user.id);

    if (data) setRecords(data as VaccineRecord[]);
    setLoading(false);
  }, [user]);

  const handleToggle = async (vaccineId: VaccineId): Promise<void> => {
    if (!user || saving) return;
    setSaving(true);

    const existing = records.find((r) => r.vaccine_id === vaccineId);
    if (existing) {
      await supabase.from('vaccine_records').delete().eq('id', existing.id);
      setRecords((prev) => prev.filter((r) => r.id !== existing.id));
    } else {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from('vaccine_records')
        .insert({ user_id: user.id, vaccine_id: vaccineId, vaccinated_at: now })
        .select('id, vaccine_id, vaccinated_at, next_due_at')
        .single();
      if (data) setRecords((prev) => [...prev, data as VaccineRecord]);
    }

    setSaving(false);
  };

  const isDone = (vaccineId: VaccineId): boolean =>
    records.some((r) => r.vaccine_id === vaccineId);

  const renderItem = ({ item }: { item: typeof STANDARD_VACCINES[number] }) => {
    const done = isDone(item.id);
    return (
      <TouchableOpacity
        style={[styles.card, done && styles.cardDone]}
        onPress={() => { void handleToggle(item.id); }}
        disabled={saving}
        accessibilityRole="button"
        accessibilityLabel={item.id}
      >
        <Text style={styles.cardIcon}>{item.emoji}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.cardId}>{item.id}</Text>
        </View>
        <View style={[styles.statusBadge, done ? styles.badgeDone : styles.badgePending]}>
          <Text style={styles.statusText}>
            {done ? t.prevention.vaccineDone : t.prevention.vaccinePending}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Screen>
      <Text style={styles.title}>{t.prevention.vaccineTitle}</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.amber[600]} />
        </View>
      ) : (
        <FlatList
          data={STANDARD_VACCINES as unknown as typeof STANDARD_VACCINES[number][]}
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
  list: {
    gap: 12,
    paddingBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.amber[50],
    borderColor: colors.amber[100],
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    minHeight: touchTargets.minCardSize,
    gap: 12,
  },
  cardDone: {
    borderColor: colors.green[600],
    backgroundColor: colors.green[50],
  },
  cardIcon: {
    fontSize: 48,
  },
  cardInfo: {
    flex: 1,
  },
  cardId: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[800],
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeDone: {
    backgroundColor: colors.green[600],
  },
  badgePending: {
    backgroundColor: colors.amber[600],
  },
  statusText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.white,
  },
});
