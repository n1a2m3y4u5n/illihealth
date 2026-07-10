import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { colors } from '../../design-tokens/colors';
import { typography } from '../../design-tokens/typography';
import { touchTargets } from '../../design-tokens/touch-targets';
import { speak } from '../../lib/voice';
import { sendOtp } from '../../lib/auth';
import { usePreferencesStore } from '../../stores/preferences';
import { useAuthStore } from '../../stores/auth';
import koJson from '../../locales/ko.json';
import enJson from '../../locales/en.json';

const locales = { ko: koJson, en: enJson };

// 숫자 키패드 — 문맹 사용자용 큰 버튼
const KEYPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['←', '0', '→'],
];

// 전화번호 입력 화면
// 큰 숫자 버튼만 사용, 키패드 픽토그램 형태
export default function PhoneScreen() {
  const router = useRouter();
  const { language, autoTts } = usePreferencesStore();
  const { setLoading, setError } = useAuthStore();
  const t = locales[language];
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (autoTts) {
      speak(t.auth.phoneTitle, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
    }
  }, []);

  function handleKey(key: string) {
    if (key === '←') {
      setPhone((p) => p.slice(0, -1));
    } else if (key === '→') {
      handleSubmit();
    } else if (phone.length < 11) {
      setPhone((p) => p + key);
    }
  }

  // 전화번호 포매팅 (010-XXXX-XXXX)
  function formatPhone(raw: string): string {
    if (raw.length <= 3) return raw;
    if (raw.length <= 7) return `${raw.slice(0, 3)}-${raw.slice(3)}`;
    return `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7)}`;
  }

  async function handleSubmit() {
    if (phone.length < 10) return;

    setLoading(true);
    setError(null);

    const formatted = `+82${phone.startsWith('0') ? phone.slice(1) : phone}`;
    const { error } = await sendOtp(formatted);

    setLoading(false);

    if (error) {
      setError(error);
      await speak('오류가 발생했습니다. 다시 시도해주세요.', { lang: 'ko-KR' });
    } else {
      router.push({ pathname: '/(auth)/otp', params: { phone: formatted } });
    }
  }

  return (
    <Screen>
      <View style={styles.container}>
        {/* 안내 픽토그램 */}
        <View style={styles.header}>
          <Text style={styles.icon}>📱</Text>
          <Text style={styles.title}>{t.auth.phoneTitle}</Text>
        </View>

        {/* 입력된 번호 표시 */}
        <View style={styles.displayBox}>
          <Text style={styles.displayText}>
            {phone.length > 0 ? formatPhone(phone) : t.auth.phonePlaceholder}
          </Text>
        </View>

        {/* 숫자 키패드 */}
        <View style={styles.keypad}>
          {KEYPAD.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.keyRow}>
              {row.map((key) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => handleKey(key)}
                  style={[
                    styles.key,
                    key === '→' && phone.length >= 10
                      ? styles.keyActive
                      : undefined,
                  ]}
                  accessibilityLabel={key === '←' ? '지우기' : key === '→' ? '다음' : key}
                >
                  <Text style={[
                    styles.keyText,
                    key === '→' && phone.length >= 10 ? styles.keyTextActive : undefined,
                  ]}>
                    {key === '→' ? '→' : key}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    fontSize: 56,
  },
  title: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[800],
    textAlign: 'center',
  },
  displayBox: {
    borderWidth: 2,
    borderColor: colors.blue[100],
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
    minWidth: 240,
    alignItems: 'center',
    backgroundColor: colors.blue[50],
  },
  displayText: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.blue[600],
    letterSpacing: 4,
  },
  keypad: {
    gap: 12,
  },
  keyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  key: {
    width: touchTargets.minTouchTarget + 8,
    height: touchTargets.minTouchTarget + 8,
    borderRadius: (touchTargets.minTouchTarget + 8) / 2,
    backgroundColor: colors.neutral[100],
    borderWidth: 2,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyActive: {
    backgroundColor: colors.blue[600],
    borderColor: colors.blue[800],
  },
  keyText: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[800],
  },
  keyTextActive: {
    color: '#FFFFFF',
  },
});
