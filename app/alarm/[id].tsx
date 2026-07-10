// 풀스크린 복약 알람 화면
// 알람 ID → DB에서 medication 정보 조회 → 복약 확인 또는 스누즈

import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { BigCheckButton } from '../../components/BigCheckButton';
import { speak } from '../../lib/voice';
import { supabase } from '../../lib/supabase';
import { scheduleSnoozeAlarm } from '../../lib/notifications';
import { usePreferencesStore } from '../../stores/preferences';
import { useAuthStore } from '../../stores/auth';
import { colors } from '../../design-tokens/colors';
import { typography } from '../../design-tokens/typography';
import { touchTargets } from '../../design-tokens/touch-targets';
import koJson from '../../locales/ko.json';
import enJson from '../../locales/en.json';

const locales = { ko: koJson, en: enJson };

// DB 조회 결과 타입
interface ScheduleRow {
  id: string;
  time_of_day: string;
  medication_id: string;
  medications: {
    id: string;
    name: string;
    pictogram_morpheme_id: string | null;
    dosage_per_time: number;
  };
}

export default function AlarmScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { language, autoTts } = usePreferencesStore();
  const { user } = useAuthStore();
  const t = locales[language];

  const [loading, setLoading] = useState(true);
  const [scheduleRow, setScheduleRow] = useState<ScheduleRow | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!id) return;
    void loadSchedule(id);
  }, [id]);

  const loadSchedule = async (scheduleId: string): Promise<void> => {
    const { data, error } = await supabase
      .from('medication_schedules')
      .select('id, time_of_day, medication_id, medications(id, name, pictogram_morpheme_id, dosage_per_time)')
      .eq('id', scheduleId)
      .single();

    if (error || !data) {
      setLoading(false);
      return;
    }

    setScheduleRow(data as unknown as ScheduleRow);
    setLoading(false);

    // 진입 TTS
    if (autoTts) {
      const med = (data as unknown as ScheduleRow).medications;
      await speak(t.alarm.title, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
      await speak(`${med.name} ${med.dosage_per_time}알`, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
    }
  };

  // 복약 완료 처리
  const handleTaken = async (): Promise<void> => {
    if (acting || !scheduleRow || !user) return;
    setActing(true);

    const { data: logData, error } = await supabase
      .from('medication_logs')
      .insert({
        user_id: user.id,
        medication_id: scheduleRow.medication_id,
        schedule_id: scheduleRow.id,
        skipped: false,
        via: 'tap',
      })
      .select('id')
      .single();

    if (error) {
      setActing(false);
      return;
    }

    if (autoTts) {
      await speak(t.alarm.takenTts, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
    }

    const logId = (logData as { id: string }).id;
    // 컨디션 기록 화면으로 이동
    router.replace({
      pathname: '/log/condition',
      params: { relatedMedicationLogId: logId },
    });
  };

  // 스누즈 처리
  const handleSnooze = async (): Promise<void> => {
    if (acting || !scheduleRow) return;
    setActing(true);

    await scheduleSnoozeAlarm(
      scheduleRow.id,
      scheduleRow.medications.name,
      scheduleRow.medications.dosage_per_time,
      15
    );

    if (autoTts) {
      await speak(t.alarm.snoozeTts, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
    }

    router.back();
  };

  if (loading) {
    return (
      <Screen hideSos>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.green[600]} />
        </View>
      </Screen>
    );
  }

  if (!scheduleRow) {
    return (
      <Screen hideSos>
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
        </View>
      </Screen>
    );
  }

  const med = scheduleRow.medications;

  return (
    <Screen hideSos>
      <View style={styles.container}>
        {/* 시계 픽토그램 */}
        <Text style={styles.clockIcon}>⏰</Text>

        {/* 약 픽토그램 */}
        <View style={styles.pillBox}>
          <Text style={styles.pillIcon}>💊</Text>
          {/* 복약 개수 점 표시 */}
          <View style={styles.dots}>
            {Array.from({ length: med.dosage_per_time }).map((_, i) => (
              <View key={i} style={styles.dot} />
            ))}
          </View>
        </View>

        {/* 시각 표시 */}
        <Text style={styles.timeText}>{scheduleRow.time_of_day.slice(0, 5)}</Text>

        {/* 알람 타이틀 */}
        <Text style={styles.title}>{t.alarm.title}</Text>

        {/* 하단 버튼 영역 */}
        <View style={styles.buttonRow}>
          {/* 스누즈 버튼 */}
          <TouchableOpacity
            style={styles.snoozeButton}
            onPress={() => { void handleSnooze(); }}
            disabled={acting}
            accessibilityRole="button"
            accessibilityLabel={t.alarm.snooze}
          >
            <Text style={styles.snoozeIcon}>⏱️</Text>
            <Text style={styles.snoozeText}>{t.alarm.snooze}</Text>
          </TouchableOpacity>

          {/* 복약 확인 버튼 (화면 2/3 폭) */}
          <BigCheckButton
            onPress={() => { void handleTaken(); }}
            label={t.alarm.taken}
            size={touchTargets.minTouchTarget * 1.5}
            disabled={acting}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingBottom: 32,
  },
  clockIcon: {
    fontSize: 64,
  },
  pillBox: {
    alignItems: 'center',
    gap: 12,
  },
  pillIcon: {
    fontSize: 120,
    lineHeight: 130,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.green[600],
  },
  timeText: {
    fontSize: typography.fontSizes['3xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.green[800],
  },
  title: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 16,
  },
  snoozeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: touchTargets.minTouchTarget,
    height: touchTargets.minTouchTarget,
    borderRadius: touchTargets.minTouchTarget / 2,
    backgroundColor: colors.neutral[200],
    gap: 4,
  },
  snoozeIcon: {
    fontSize: 24,
  },
  snoozeText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[700],
    fontWeight: typography.fontWeights.semibold,
  },
  errorIcon: {
    fontSize: 64,
  },
});
