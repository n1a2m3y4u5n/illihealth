// 처방 검토 화면 — OCR + 픽토그램 시퀀스 확인
// 사용자가 맞아요/틀려요 선택 후 DB 저장 또는 수정

import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { BigCheckButton } from '../../components/BigCheckButton';
import { BigXButton } from '../../components/BigXButton';
import { speak } from '../../lib/voice';
import { supabase } from '../../lib/supabase';
import { scheduleMedicationAlarm } from '../../lib/notifications';
import { usePreferencesStore } from '../../stores/preferences';
import { useAuthStore } from '../../stores/auth';
import { colors } from '../../design-tokens/colors';
import { categoryColorMap, type ColorCategory } from '../../design-tokens/colors';
import { typography } from '../../design-tokens/typography';
import { touchTargets } from '../../design-tokens/touch-targets';
import type { PictogramResult, PictogramItem } from '../../lib/pictogram';
import koJson from '../../locales/ko.json';
import enJson from '../../locales/en.json';

const locales = { ko: koJson, en: enJson };

// morpheme_id에서 표시 이모지 추출
function morphemeToEmoji(morphemeId: string): string {
  const map: Record<string, string> = {
    'pill.round.white': '⚪',
    'pill.round.red': '🔴',
    'pill.round.blue': '🔵',
    'pill.capsule.blue': '💊',
    'time.morning': '🌅',
    'time.noon': '🌞',
    'time.evening': '🌙',
    'context.before_meal': '🍽️',
    'context.after_meal': '✅',
    'context.with_meal': '🥢',
    'frequency.once_daily': '1️⃣',
    'frequency.twice_daily': '2️⃣',
    'frequency.three_daily': '3️⃣',
    'count.1': '①',
    'count.2': '②',
    'count.3': '③',
    'warning.caution': '⚠️',
    'warning.forbidden': '🚫',
    'condition.hypertension': '🫀',
    'condition.diabetes': '🩸',
    'info.generic_prescription': '📋',
  };
  return map[morphemeId] ?? '💊';
}

// morpheme_id에서 시각 정보 추출 (알람 등록용)
function extractTimeFromParts(parts: PictogramItem['parts']): string {
  for (const p of parts) {
    if (p.morpheme_id === 'time.morning') return '08:00';
    if (p.morpheme_id === 'time.noon') return '12:00';
    if (p.morpheme_id === 'time.evening') return '20:00';
  }
  return '09:00';
}

// morpheme_id에서 복약 횟수 추출
function extractCountFromParts(parts: PictogramItem['parts']): number {
  for (const p of parts) {
    if (p.morpheme_id === 'count.1') return 1;
    if (p.morpheme_id === 'count.2') return 2;
    if (p.morpheme_id === 'count.3') return 3;
  }
  return 1;
}

export default function PrescriptionReviewScreen() {
  const router = useRouter();
  const { imageUri, ocrText, pictogramResult: pictogramResultStr } = useLocalSearchParams<{
    imageUri: string;
    ocrText: string;
    pictogramResult: string;
  }>();
  const { language, autoTts } = usePreferencesStore();
  const { user } = useAuthStore();
  const t = locales[language];

  const [saving, setSaving] = useState(false);
  const [sequence, setSequence] = useState<PictogramItem[]>([]);
  // 수정 모드: 삭제 가능
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (!pictogramResultStr) return;
    try {
      const result = JSON.parse(pictogramResultStr) as PictogramResult;
      if (result.success) {
        setSequence(result.sequence);
      } else {
        setSequence(result.partial_sequence);
      }
    } catch {
      // 파싱 실패 시 빈 시퀀스
    }
  }, [pictogramResultStr]);

  // 자동 TTS 카드 읽기
  useEffect(() => {
    if (!autoTts || sequence.length === 0) return;
    const readCards = async (): Promise<void> => {
      for (const item of sequence) {
        if (item.type !== 'medication') continue;
        const time = extractTimeFromParts(item.parts);
        const count = extractCountFromParts(item.parts);
        const [hourStr] = time.split(':');
        const hour = parseInt(hourStr ?? '9', 10);
        const ampm = hour < 12 ? '오전' : '오후';
        const h = hour > 12 ? hour - 12 : hour;
        const utterance = `${ampm} ${h}시${t.review.readback} ${count}${t.review.readbackSuffix}`;
        await speak(utterance, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
      }
    };
    // 화면 진입 후 잠시 대기 후 읽기
    const timer = setTimeout(() => { void readCards(); }, 800);
    return () => clearTimeout(timer);
  }, [sequence, autoTts]);

  // 카드 삭제 (수정 모드)
  const handleRemoveCard = (index: number): void => {
    setSequence((prev) => prev.filter((_, i) => i !== index));
  };

  // 저장 처리
  const handleConfirm = useCallback(async (): Promise<void> => {
    if (saving || !user) return;
    setSaving(true);

    try {
      // 1. 진단서 저장
      const { data: prescription, error: prescError } = await supabase
        .from('prescriptions')
        .insert({
          user_id: user.id,
          image_url: imageUri ?? '',
          ocr_text: ocrText ?? '',
          pictogram_sequence: sequence,
        })
        .select('id')
        .single();

      if (prescError || !prescription) {
        throw new Error(prescError?.message ?? '진단서 저장 실패');
      }

      const prescriptionId = (prescription as { id: string }).id;
      let firstAlarmTime = '';

      // 2. 약 정보 + 스케줄 저장
      for (const item of sequence) {
        if (item.type !== 'medication') continue;

        const pillPart = item.parts.find(
          (p) =>
            p.morpheme_id.startsWith('pill.') ||
            p.morpheme_id === 'info.generic_prescription'
        );
        const morphemeId = pillPart?.morpheme_id ?? 'pill.round.white';
        const timeOfDay = extractTimeFromParts(item.parts);
        const count = extractCountFromParts(item.parts);

        if (!firstAlarmTime) firstAlarmTime = timeOfDay;

        // medications 테이블 삽입
        const { data: medication, error: medError } = await supabase
          .from('medications')
          .insert({
            user_id: user.id,
            prescription_id: prescriptionId,
            name: morphemeId,
            pictogram_morpheme_id: morphemeId,
            dosage_per_time: count,
            active: true,
          })
          .select('id')
          .single();

        if (medError || !medication) continue;

        const medicationId = (medication as { id: string }).id;

        // medication_schedules 삽입
        const { data: schedule, error: schedError } = await supabase
          .from('medication_schedules')
          .insert({
            medication_id: medicationId,
            time_of_day: timeOfDay,
            active: true,
          })
          .select('id')
          .single();

        if (schedError || !schedule) continue;

        const scheduleId = (schedule as { id: string }).id;

        // 3. 알람 등록
        await scheduleMedicationAlarm(
          medicationId,
          scheduleId,
          timeOfDay,
          morphemeId,
          count
        );
      }

      // 저장 완료 TTS
      if (autoTts && firstAlarmTime) {
        const [hourStr] = firstAlarmTime.split(':');
        const hour = parseInt(hourStr ?? '9', 10);
        const ampm = hour < 12 ? '오전' : '오후';
        const h = hour > 12 ? hour - 12 : hour;
        await speak(
          `${t.review.saved} ${t.review.nextAlarm} ${ampm} ${h}시${t.review.nextAlarmSuffix}`,
          { lang: language === 'ko' ? 'ko-KR' : 'en-US' }
        );
      } else if (autoTts) {
        await speak(t.review.saved, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
      }

      router.replace('/(main)/home');
    } catch {
      if (autoTts) {
        speak(t.error.ocrFail, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
      }
      setSaving(false);
    }
  }, [saving, user, imageUri, ocrText, sequence, autoTts, language, t, router]);

  // 틀려요 → 수정 모드 진입
  const handleReject = (): void => {
    setEditMode(true);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 타이틀 */}
        <Text style={styles.title}>{t.review.title}</Text>

        {/* 원본 진단서 썸네일 */}
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.thumbnail} resizeMode="contain" />
        ) : null}

        {/* 픽토그램 카드 목록 */}
        <View style={styles.cardList}>
          {sequence.map((item, index) => {
            const colorCategory = item.display_meta.color as ColorCategory;
            const colorSet = categoryColorMap[colorCategory];
            const mainEmoji = item.parts[0]
              ? morphemeToEmoji(item.parts[0].morpheme_id)
              : '💊';

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.card,
                  { backgroundColor: colorSet.bg, borderColor: colorSet.border },
                ]}
                onLongPress={editMode ? undefined : handleReject}
                disabled={saving}
                accessibilityRole="button"
              >
                {/* 삭제 버튼 (수정 모드) */}
                {editMode && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleRemoveCard(index)}
                    accessibilityLabel="삭제"
                  >
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </TouchableOpacity>
                )}

                {/* 메인 이모지 */}
                <Text style={styles.cardIcon}>{mainEmoji}</Text>

                {/* morpheme 세부 픽토그램 */}
                <View style={styles.cardParts}>
                  {item.parts.slice(1).map((part, pi) => (
                    <Text key={pi} style={styles.partEmoji}>
                      {morphemeToEmoji(part.morpheme_id)}
                    </Text>
                  ))}
                </View>

                {/* 시각 + 개수 */}
                {item.type === 'medication' && (
                  <View style={styles.cardMeta}>
                    <Text style={[styles.cardMetaText, { color: colorSet.icon }]}>
                      {extractTimeFromParts(item.parts)}
                    </Text>
                    <Text style={[styles.cardMetaText, { color: colorSet.icon }]}>
                      {extractCountFromParts(item.parts)}알
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* 하단 액션 버튼 */}
      <View style={styles.actions}>
        <BigXButton
          onPress={handleReject}
          label={t.review.reject}
          size={touchTargets.minTouchTarget}
          disabled={saving}
        />
        <BigCheckButton
          onPress={() => { void handleConfirm(); }}
          label={t.review.confirm}
          size={80}
          disabled={saving}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 24,
    gap: 16,
  },
  title: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
    textAlign: 'center',
    marginTop: 8,
  },
  thumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
  },
  cardList: {
    gap: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    minHeight: touchTargets.minCardSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
  },
  cardIcon: {
    fontSize: 48,
  },
  cardParts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    gap: 8,
  },
  partEmoji: {
    fontSize: 28,
  },
  cardMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  cardMetaText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.red[600],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    paddingVertical: 16,
    paddingBottom: 8,
  },
});
