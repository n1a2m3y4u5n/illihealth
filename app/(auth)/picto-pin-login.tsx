import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { colors } from '../../design-tokens/colors';
import { typography } from '../../design-tokens/typography';
import { touchTargets } from '../../design-tokens/touch-targets';
import { speak } from '../../lib/voice';
import {
  PICTO_PIN_POOL,
  loginWithPictoPin,
  checkBiometricAvailability,
  authenticateWithBiometric,
  type PictoPinId,
} from '../../lib/auth';
import { usePreferencesStore } from '../../stores/preferences';
import { useAuthStore } from '../../stores/auth';
import koJson from '../../locales/ko.json';
import enJson from '../../locales/en.json';

const locales = { ko: koJson, en: enJson };

// 픽토그램 PIN 로그인 화면
// 생체 인증 가능 시 자동 폴백 제안
export default function PictoPinLoginScreen() {
  const router = useRouter();
  const { language, autoTts } = usePreferencesStore();
  const { user } = useAuthStore();
  const t = locales[language];

  const [selected, setSelected] = useState<PictoPinId[]>([]);
  const [error, setError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    if (autoTts) {
      speak(t.auth.pinLoginTitle, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
    }
    checkBiometrics();
  }, []);

  async function checkBiometrics() {
    const { available } = await checkBiometricAvailability();
    setBiometricAvailable(available);
    if (available) {
      handleBiometric();
    }
  }

  async function handleBiometric() {
    const { success } = await authenticateWithBiometric();
    if (success) {
      router.replace('/(main)/home');
    }
  }

  function handlePick(id: PictoPinId) {
    if (selected.length < 4) {
      const next = [...selected, id];
      setSelected(next);
      if (next.length === 4) {
        handleVerify(next);
      }
    }
  }

  function handleDelete() {
    setSelected((prev) => prev.slice(0, -1));
    setError('');
  }

  async function handleVerify(sequence: PictoPinId[]) {
    if (!user) return;

    const { success, error: verifyError } = await loginWithPictoPin(user.id, sequence);

    if (success) {
      router.replace('/(main)/home');
    } else {
      setError(verifyError ?? 'PIN이 일치하지 않습니다');
      setSelected([]);
      if (autoTts) {
        await speak('그림 순서가 달라요. 다시 해주세요.', { lang: 'ko-KR' });
      }
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        {/* 안내 */}
        <View style={styles.header}>
          <Text style={styles.icon}>🔑</Text>
          <Text style={styles.title}>{t.auth.pinLoginTitle}</Text>
          <Text style={styles.subtitle}>{t.auth.pinLoginSub}</Text>
        </View>

        {/* 선택된 PIN 표시 */}
        <View style={styles.pinDisplay}>
          {Array.from({ length: 4 }).map((_, i) => {
            const item = selected[i]
              ? PICTO_PIN_POOL.find((p) => p.id === selected[i])
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
              style={styles.pictoItem}
              accessibilityLabel={item.label}
            >
              <Text style={styles.pictoIcon}>{item.icon}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>← 지우기</Text>
          </TouchableOpacity>

          {biometricAvailable && (
            <TouchableOpacity style={styles.bioBtn} onPress={handleBiometric}>
              <Text style={styles.bioBtnIcon}>👆</Text>
              <Text style={styles.bioBtnText}>{t.auth.biometricUse}</Text>
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
  bioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 50,
    backgroundColor: colors.blue[600],
    minHeight: touchTargets.minTouchTarget,
  },
  bioBtnIcon: {
    fontSize: 24,
  },
  bioBtnText: {
    fontSize: typography.fontSizes.base,
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.semibold,
  },
});
