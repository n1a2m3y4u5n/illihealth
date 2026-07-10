import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../design-tokens/colors';
import { typography } from '../design-tokens/typography';
import { touchTargets } from '../design-tokens/touch-targets';
import { usePreferencesStore } from '../stores/preferences';
import koJson from '../locales/ko.json';
import enJson from '../locales/en.json';

const locales = { ko: koJson, en: enJson };

// Phase 1에서 실제 데이터와 연결. 지금은 mock 데이터로 렌더링.
export interface MedicationItem {
  id: string;
  name: string;
  time: string;    // "09:00" 형식
  count: number;
  icon: string;    // 픽토그램 이모지 (Phase 1에서 morpheme으로 교체)
  color: string;   // hex (design-token 색)
}

// mock 데이터 — Phase 1에서 DB 데이터로 교체
const MOCK_MEDICATIONS: MedicationItem[] = [
  {
    id: 'mock-1',
    name: '혈압약',
    time: '09:00',
    count: 1,
    icon: '💊',
    color: colors.green[600],
  },
];

interface MedicationStripProps {
  // 실제 데이터가 없으면 mock 사용
  medications?: MedicationItem[];
  onTake?: (id: string) => void;
  onSkip?: (id: string) => void;
}

// "지금 먹을 약" 상단 알림 카드
// 복약 알람이 있을 때만 표시
export function MedicationStrip({
  medications = MOCK_MEDICATIONS,
  onTake,
  onSkip,
}: MedicationStripProps) {
  const { language } = usePreferencesStore();
  const t = locales[language];

  if (medications.length === 0) return null;

  const med = medications[0];
  if (!med) return null;

  return (
    <View style={styles.container}>
      <View style={styles.iconArea}>
        <Text style={styles.medIcon}>{med.icon}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.title}>{t.medication.stripTitle}</Text>
        <Text style={styles.time}>
          {med.time} · {med.count}알
        </Text>
      </View>

      <View style={styles.actions}>
        {/* 먹었어요 버튼 */}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.green[600] }]}
          onPress={() => onTake?.(med.id)}
          accessibilityLabel={t.medication.take}
        >
          <Text style={styles.actionIcon}>✓</Text>
        </TouchableOpacity>

        {/* 나중에 버튼 */}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.neutral[200] }]}
          onPress={() => onSkip?.(med.id)}
          accessibilityLabel={t.medication.skip}
        >
          <Text style={[styles.actionIcon, { color: colors.neutral[600] }]}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.green[50],
    borderColor: colors.green[100],
    borderWidth: 2,
    borderRadius: 16,
    padding: 12,
    marginVertical: 8,
    minHeight: touchTargets.minTouchTarget,
  },
  iconArea: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.green[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  medIcon: {
    fontSize: 28,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSizes.sm,
    color: colors.green[800],
    fontWeight: typography.fontWeights.semibold,
  },
  time: {
    fontSize: typography.fontSizes.lg,
    color: colors.green[600],
    fontWeight: typography.fontWeights.bold,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
