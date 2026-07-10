// 약 상세 화면 — 복약 스케줄, 기록 타임라인, 잔여량
// 보라 색군

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../../../components/Screen';
import { supabase } from '../../../lib/supabase';
import { speak } from '../../../lib/voice';
import { usePreferencesStore } from '../../../stores/preferences';
import { useAuthStore } from '../../../stores/auth';
import { colors } from '../../../design-tokens/colors';
import { typography } from '../../../design-tokens/typography';

// DB 조회 타입
interface MedicationDetail {
  id: string;
  name: string;
  pictogram_morpheme_id: string | null;
  dosage_per_time: number;
  duration_days: number | null;
  remaining_count: number | null;
  active: boolean;
  started_at: string | null;
}

interface ScheduleRow {
  id: string;
  time_of_day: string;
  with_meal: string | null;
}

interface LogRow {
  id: string;
  taken_at: string;
  skipped: boolean;
}

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

export default function MedicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language, autoTts } = usePreferencesStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [medication, setMedication] = useState<MedicationDetail | null>(null);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);

  useEffect(() => {
    if (!id) return;
    void loadData(id);
  }, [id]);

  const loadData = async (medId: string): Promise<void> => {
    if (!user) { setLoading(false); return; }

    // 약 상세
    const { data: med } = await supabase
      .from('medications')
      .select('id, name, pictogram_morpheme_id, dosage_per_time, duration_days, remaining_count, active, started_at')
      .eq('id', medId)
      .eq('user_id', user.id)
      .single();

    // 복약 스케줄
    const { data: sched } = await supabase
      .from('medication_schedules')
      .select('id, time_of_day, with_meal')
      .eq('medication_id', medId);

    // 최근 7일 복약 기록
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: logData } = await supabase
      .from('medication_logs')
      .select('id, taken_at, skipped')
      .eq('medication_id', medId)
      .gte('taken_at', sevenDaysAgo.toISOString())
      .order('taken_at', { ascending: false });

    if (med) setMedication(med as MedicationDetail);
    if (sched) setSchedules(sched as ScheduleRow[]);
    if (logData) setLogs(logData as LogRow[]);
    setLoading(false);

    // 진입 TTS
    if (autoTts && med) {
      await speak((med as MedicationDetail).name, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
    }
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.purple[600]} />
        </View>
      </Screen>
    );
  }

  if (!medication) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 큰 픽토그램 */}
        <View style={styles.heroBox}>
          <Text style={styles.heroIcon}>{morphemeToEmoji(medication.pictogram_morpheme_id)}</Text>
          <Text style={styles.heroName}>{medication.name}</Text>
        </View>

        {/* 복약 스케줄 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏰</Text>
          {schedules.map((s) => (
            <View key={s.id} style={styles.scheduleRow}>
              <Text style={styles.scheduleTime}>{s.time_of_day.slice(0, 5)}</Text>
              {s.with_meal && (
                <Text style={styles.scheduleWith}>{s.with_meal}</Text>
              )}
            </View>
          ))}
        </View>

        {/* 잔여량 */}
        {medication.remaining_count !== null && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💊</Text>
            <Text style={styles.remaining}>{medication.remaining_count}알</Text>
          </View>
        )}

        {/* 최근 7일 복약 기록 타임라인 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅</Text>
          {logs.length === 0 ? (
            <Text style={styles.emptyText}>-</Text>
          ) : (
            logs.map((log) => {
              const d = new Date(log.taken_at);
              const label = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
              return (
                <View key={log.id} style={styles.logRow}>
                  <Text style={styles.logDot}>{log.skipped ? '⬜' : '✅'}</Text>
                  <Text style={styles.logTime}>{label}</Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingBottom: 32,
    gap: 24,
  },
  heroBox: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
  },
  heroIcon: {
    fontSize: 80,
  },
  heroName: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.purple[600],
    textAlign: 'center',
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: typography.fontSizes['2xl'],
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.purple[50],
    borderRadius: 12,
    padding: 12,
  },
  scheduleTime: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.purple[800],
  },
  scheduleWith: {
    fontSize: typography.fontSizes.sm,
    color: colors.purple[600],
  },
  remaining: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.green[600],
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logDot: {
    fontSize: typography.fontSizes.base,
  },
  logTime: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[700],
  },
  emptyText: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[400],
  },
  errorIcon: {
    fontSize: 64,
  },
});
