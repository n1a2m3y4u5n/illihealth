// 컨디션 기록 화면 — 복약 후 기분·통증 부위 입력
// mood 이모지 선택 + 신체 부위 탭 → health_logs 저장

import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { BigCheckButton } from '../../components/BigCheckButton';
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

const MOOD_OPTIONS = [
  { value: 5, emoji: '😄' },
  { value: 4, emoji: '🙂' },
  { value: 3, emoji: '😐' },
  { value: 2, emoji: '😕' },
  { value: 1, emoji: '😢' },
] as const;

const BODY_PARTS = [
  { id: 'head', emoji: '🧠' },
  { id: 'chest', emoji: '🫀' },
  { id: 'stomach', emoji: '🫃' },
  { id: 'arm', emoji: '💪' },
  { id: 'leg', emoji: '🦵' },
  { id: 'back', emoji: '🔙' },
] as const;

type BodyPartId = typeof BODY_PARTS[number]['id'];

export default function LogConditionScreen() {
  const router = useRouter();
  const { relatedMedicationLogId } = useLocalSearchParams<{ relatedMedicationLogId?: string }>();
  const { language, autoTts } = usePreferencesStore();
  const { user } = useAuthStore();
  const t = locales[language];

  const [mood, setMood] = useState<number | null>(null);
  const [painAreas, setPainAreas] = useState<BodyPartId[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (autoTts) {
      void speak(t.log.conditionEnterTts, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
    }
  }, []);

  const toggleBodyPart = (id: BodyPartId): void => {
    setPainAreas((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleDone = useCallback(async (): Promise<void> => {
    if (saving || !user || mood === null) return;
    setSaving(true);

    const { error } = await supabase.from('health_logs').insert({
      user_id: user.id,
      related_medication_log_id: relatedMedicationLogId ?? null,
      mood_score: mood,
      pain_areas: painAreas,
    });

    if (!error && autoTts) {
      await speak(t.log.doneTts, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
    }

    router.replace('/(main)/home');
  }, [saving, user, mood, painAreas, relatedMedicationLogId, autoTts, language, t, router]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.prompt}>{t.log.moodPrompt}</Text>
        <View style={styles.moodRow}>
          {MOOD_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.moodButton, mood === opt.value && styles.moodButtonSelected]}
              onPress={() => setMood(opt.value)}
              accessibilityRole="button"
              accessibilityLabel={String(opt.value)}
            >
              <Text style={styles.moodEmoji}>{opt.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.prompt}>{t.log.bodyPrompt}</Text>
        <View style={styles.bodyGrid}>
          {BODY_PARTS.map((part) => (
            <TouchableOpacity
              key={part.id}
              style={[
                styles.bodyButton,
                painAreas.includes(part.id) && styles.bodyButtonSelected,
              ]}
              onPress={() => toggleBodyPart(part.id)}
              accessibilityRole="button"
              accessibilityLabel={part.id}
            >
              <Text style={styles.bodyEmoji}>{part.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {saving ? (
          <ActivityIndicator size="large" color={colors.pink[600]} />
        ) : (
          <BigCheckButton
            onPress={() => { void handleDone(); }}
            label={t.log.done}
            size={touchTargets.minTouchTarget * 1.2}
            disabled={mood === null}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 16,
    gap: 24,
  },
  prompt: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[700],
    textAlign: 'center',
    marginTop: 8,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  moodButton: {
    width: touchTargets.minTouchTarget,
    height: touchTargets.minTouchTarget,
    borderRadius: touchTargets.minTouchTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodButtonSelected: {
    borderColor: colors.pink[600],
    backgroundColor: colors.pink[50],
  },
  moodEmoji: {
    fontSize: 36,
  },
  bodyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  bodyButton: {
    width: touchTargets.minCardSize,
    height: touchTargets.minCardSize,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bodyButtonSelected: {
    borderColor: colors.pink[600],
    backgroundColor: colors.pink[50],
  },
  bodyEmoji: {
    fontSize: 44,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
});
