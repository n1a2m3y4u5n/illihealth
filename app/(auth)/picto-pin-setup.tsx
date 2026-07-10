import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../components/Screen';
import { colors } from '../../design-tokens/colors';
import { typography } from '../../design-tokens/typography';
import { touchTargets } from '../../design-tokens/touch-targets';
import { speak } from '../../lib/voice';
import { PICTO_PIN_POOL, savePictoPin, type PictoPinId } from '../../lib/auth';
import { usePreferencesStore } from '../../stores/preferences';
import { useAuthStore } from '../../stores/auth';
import koJson from '../../locales/ko.json';
import enJson from '../../locales/en.json';

const locales = { ko: koJson, en: enJson };

// 픽토그램 PIN 설정 화면
// 12개 풀에서 4개를 순서대로 선택
export default function PictoPinSetupScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { language, autoTts } = usePreferencesStore();
  const { user, setPinConfigured } = useAuthStore();
  const t = locales[language];

  // 선택된 PIN 순서 (최대 4개)
  const [selected, setSelected] = useState<PictoPinId[]>([]);
  const [isConfirmStep, setIsConfirmStep] = useState(false);
  const [confirmSelected, setConfirmSelected] = useState<PictoPinId[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (autoTts) {
      speak(t.auth.pinSetupTitle, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
    }
  }, []);

  function handlePick(id: PictoPinId) {
    if (!isConfirmStep) {
      if (selected.length < 4) {
        setSelected((prev) => [...prev, id]);
      }
    } else {
      if (confirmSelected.length < 4) {
        setConfirmSelected((prev) => [...prev, id]);
      }
    }
  }

  function handleDelete() {
    if (!isConfirmStep) {
      setSelected((prev) => prev.slice(0, -1));
    } else {
      setConfirmSelected((prev) => prev.slice(0, -1));
    }
  }

  async function handleNext() {
    if (selected.length < 4) return;
    setIsConfirmStep(true);
    setConfirmSelected([]);
    if (autoTts) {
      await speak('한 번 더 같은 순서로 골라주세요', { lang: 'ko-KR' });
    }
  }

  async function handleConfirm() {
    if (confirmSelected.length < 4) return;

    // 두 선택 순서 비교
    const match = selected.every((id, i) => id === confirmSelected[i]);
    if (!match) {
      setError('순서가 다릅니다. 다시 해주세요.');
      setConfirmSelected([]);
      if (autoTts) {
        await speak('그림 순서가 달라요. 다시 골라주세요.', { lang: 'ko-KR' });
      }
      return;
    }

    if (!user || !phone) return;

    const { error: saveError } = await savePictoPin(user.id, phone, selected);
    if (saveError) {
      setError(saveError);
      return;
    }

    setPinConfigured(true);
    router.replace('/(auth)/tutorial');
  }

  const currentSelection = isConfirmStep ? confirmSelected : selected;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        {/* 안내 */}
        <View style={styles.header}>
          <Text style={styles.icon}>🔐</Text>
          <Text style={styles.title}>
            {isConfirmStep ? '한 번 더 골라주세요' : t.auth.pinSetupTitle}
          </Text>
          <Text style={styles.subtitle}>{t.auth.pinSetupSub}</Text>
        </View>

        {/* 선택된 PIN 표시 (4칸) */}
        <View style={styles.pinDisplay}>
          {Array.from({ length: 4 }).map((_, i) => {
            const item = currentSelection[i]
              ? PICTO_PIN_POOL.find((p) => p.id === currentSelection[i])
              : null;
            return (
              <View
                key={i}
                style={[styles.pinSlot, item ? styles.pinSlotFilled : undefined]}
              >
                <Text style={styles.pinSlotIcon}>{item?.icon ?? '○'}</Text>
              </View>
            );
          })}
        </View>

        {/* 오류 표시 */}
        {error.length > 0 && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {/* 픽토그램 풀 그리드 */}
        <View style={styles.grid}>
          {PICTO_PIN_POOL.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handlePick(item.id)}
              style={[
                styles.pictoItem,
                currentSelection.includes(item.id) ? styles.pictoItemSelected : undefined,
              ]}
              accessibilityLabel={item.label}
            >
              <Text style={styles.pictoIcon}>{item.icon}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 액션 버튼 */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>← 지우기</Text>
          </TouchableOpacity>

          {!isConfirmStep ? (
            <TouchableOpacity
              style={[styles.nextBtn, selected.length < 4 ? styles.nextBtnDisabled : undefined]}
              onPress={handleNext}
              disabled={selected.length < 4}
            >
              <Text style={styles.nextBtnText}>다음 →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextBtn, confirmSelected.length < 4 ? styles.nextBtnDisabled : undefined]}
              onPress={handleConfirm}
              disabled={confirmSelected.length < 4}
            >
              <Text style={styles.nextBtnText}>완료 ✓</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  pinDisplay: {
    flexDirection: 'row',
    gap: 12,
  },
  pinSlot: {
    width: touchTargets.minTouchTarget,
    height: touchTargets.minTouchTarget,
    borderRadius: touchTargets.minTouchTarget / 2,
    borderWidth: 2,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinSlotFilled: {
    borderColor: colors.purple[600],
    backgroundColor: colors.purple[50],
  },
  pinSlotIcon: {
    fontSize: 28,
  },
  errorText: {
    color: colors.red[600],
    fontSize: typography.fontSizes.base,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    maxWidth: 320,
  },
  pictoItem: {
    width: touchTargets.minCardSize,
    height: touchTargets.minCardSize,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.purple[100],
    backgroundColor: colors.purple[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pictoItemSelected: {
    borderColor: colors.purple[600],
    backgroundColor: colors.purple[100],
  },
  pictoIcon: {
    fontSize: 44,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  deleteBtn: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 50,
    backgroundColor: colors.neutral[200],
    minHeight: touchTargets.minTouchTarget,
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[700],
    fontWeight: typography.fontWeights.semibold,
  },
  nextBtn: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 50,
    backgroundColor: colors.purple[600],
    minHeight: touchTargets.minTouchTarget,
    justifyContent: 'center',
  },
  nextBtnDisabled: {
    backgroundColor: colors.neutral[300],
  },
  nextBtnText: {
    fontSize: typography.fontSizes.base,
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
  },
});
