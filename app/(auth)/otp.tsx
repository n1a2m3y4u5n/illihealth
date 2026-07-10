import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../components/Screen';
import { colors } from '../../design-tokens/colors';
import { typography } from '../../design-tokens/typography';
import { touchTargets } from '../../design-tokens/touch-targets';
import { speak } from '../../lib/voice';
import { verifyOtp, readOtpAloud } from '../../lib/auth';
import { usePreferencesStore } from '../../stores/preferences';
import { useAuthStore } from '../../stores/auth';
import koJson from '../../locales/ko.json';
import enJson from '../../locales/en.json';

const locales = { ko: koJson, en: enJson };

// SMS OTP 입력 화면
// OTP 도착 시 TTS로 코드를 한 자리씩 읽어줌
export default function OtpScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { language, autoTts } = usePreferencesStore();
  const { setSession, setLoading, setError } = useAuthStore();
  const t = locales[language];
  const [code, setCode] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (autoTts) {
      speak(t.auth.otpTitle, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
    }
    // 자동 포커스
    setTimeout(() => inputRef.current?.focus(), 500);
  }, []);

  // OTP 입력 완료 시 자동 제출
  useEffect(() => {
    if (code.length === 6) {
      handleVerify();
    }
  }, [code]);

  // OTP를 TTS로 읽어주는 버튼 핸들러
  async function handleReadAloud() {
    if (code.length > 0) {
      await readOtpAloud(code);
    }
  }

  async function handleVerify() {
    if (!phone || code.length < 6) return;

    setLoading(true);
    setError(null);

    const { error } = await verifyOtp(phone, code);
    setLoading(false);

    if (error) {
      setError(error);
      await speak('인증번호가 맞지 않아요. 다시 확인해주세요.', { lang: 'ko-KR' });
      setCode('');
    } else {
      // 픽토그램 PIN 설정으로 이동
      router.push({ pathname: '/(auth)/picto-pin-setup', params: { phone } });
    }
  }

  return (
    <Screen>
      <View style={styles.container}>
        {/* 안내 픽토그램 */}
        <View style={styles.header}>
          <Text style={styles.icon}>💬</Text>
          <Text style={styles.title}>{t.auth.otpTitle}</Text>
          <Text style={styles.subtitle}>{t.auth.otpSent}</Text>
        </View>

        {/* OTP 입력 박스 */}
        <View style={styles.inputArea}>
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.hiddenInput}
            accessibilityLabel="인증번호 입력"
          />
          <View style={styles.codeBoxRow}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.codeBox,
                  i < code.length ? styles.codeBoxFilled : undefined,
                ]}
              >
                <Text style={styles.codeDigit}>{code[i] ?? ''}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* TTS로 읽어주기 버튼 */}
        <TouchableOpacity
          style={styles.ttsButton}
          onPress={handleReadAloud}
          accessibilityLabel="인증번호 읽어주기"
        >
          <Text style={styles.ttsIcon}>🔊</Text>
          <Text style={styles.ttsLabel}>읽어주세요</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 24,
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
  subtitle: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  inputArea: {
    alignItems: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  codeBoxRow: {
    flexDirection: 'row',
    gap: 8,
  },
  codeBox: {
    width: touchTargets.minTouchTarget,
    height: touchTargets.minTouchTarget + 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBoxFilled: {
    borderColor: colors.blue[600],
    backgroundColor: colors.blue[50],
  },
  codeDigit: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.blue[600],
  },
  ttsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 50,
    backgroundColor: colors.blue[50],
    borderWidth: 2,
    borderColor: colors.blue[100],
    minHeight: touchTargets.minTouchTarget,
  },
  ttsIcon: {
    fontSize: 28,
  },
  ttsLabel: {
    fontSize: typography.fontSizes.base,
    color: colors.blue[600],
    fontWeight: typography.fontWeights.semibold,
  },
});
