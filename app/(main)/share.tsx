// QR 공유 화면 — 의료진에게 복약 기록 공유
// Supabase Edge Function으로 일회용 토큰 생성 → QR 코드 표시

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Screen } from '../../components/Screen';
import { speak } from '../../lib/voice';
import { supabase } from '../../lib/supabase';
import { usePreferencesStore } from '../../stores/preferences';
import { useAuthStore } from '../../stores/auth';
import { colors } from '../../design-tokens/colors';
import { typography } from '../../design-tokens/typography';
import { touchTargets } from '../../design-tokens/touch-targets';

// QR에 담길 URL 베이스 — 의료진 포털
const SHARE_BASE_URL = 'https://illihealth.app/share/';

// 토큰 유효 시간 (분)
const TOKEN_EXPIRY_MINUTES = 30;

export default function ShareScreen() {
  const { language, autoTts } = usePreferencesStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (autoTts) {
      void speak(
        language === 'ko' ? 'QR 코드를 의료진에게 보여주세요' : 'Show this QR code to your doctor',
        { lang: language === 'ko' ? 'ko-KR' : 'en-US' }
      );
    }
    void generateToken();
  }, []);

  // 만료 타이머
  useEffect(() => {
    if (!expiresAt) return;
    const now = Date.now();
    const ms = expiresAt.getTime() - now;
    if (ms <= 0) { setExpired(true); return; }
    const timer = setTimeout(() => setExpired(true), ms);
    return () => clearTimeout(timer);
  }, [expiresAt]);

  const generateToken = async (): Promise<void> => {
    if (!user) return;
    setLoading(true);
    setExpired(false);
    setToken(null);

    try {
      // share_tokens 테이블에 직접 삽입 (Edge Function 없이도 동작)
      const expiresAtDate = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

      const { data, error } = await supabase
        .from('share_tokens')
        .insert({
          user_id: user.id,
          expires_at: expiresAtDate.toISOString(),
          used: false,
        })
        .select('token')
        .single();

      if (!error && data) {
        const tokenValue = (data as { token: string }).token;
        setToken(tokenValue);
        setExpiresAt(expiresAtDate);
      }
    } catch {
      // 토큰 생성 실패 시 무시
    } finally {
      setLoading(false);
    }
  };

  const qrValue = token ? `${SHARE_BASE_URL}${token}` : '';

  const formatExpiry = (): string => {
    if (!expiresAt) return '';
    const h = String(expiresAt.getHours()).padStart(2, '0');
    const m = String(expiresAt.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  return (
    <Screen>
      <View style={styles.container}>
        {/* 타이틀 아이콘 */}
        <Text style={styles.icon}>🏥</Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.purple[600]} />
        ) : expired || !token ? (
          // 만료됨 or 생성 실패
          <View style={styles.expiredBox}>
            <Text style={styles.expiredIcon}>⏰</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => { void generateToken(); }}
              accessibilityRole="button"
            >
              <Text style={styles.refreshText}>🔄</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // QR 코드 표시
          <View style={styles.qrBox}>
            <QRCode
              value={qrValue}
              size={220}
              backgroundColor={colors.white}
              color={colors.neutral[900]}
            />
            {/* 만료 시각 */}
            <View style={styles.expiryRow}>
              <Text style={styles.expiryLabel}>⏱️</Text>
              <Text style={styles.expiryTime}>{formatExpiry()}</Text>
            </View>
          </View>
        )}

        {/* 새 토큰 생성 버튼 */}
        {!loading && token && !expired && (
          <TouchableOpacity
            style={styles.regenerateButton}
            onPress={() => { void generateToken(); }}
            accessibilityRole="button"
          >
            <Text style={styles.regenerateIcon}>🔄</Text>
          </TouchableOpacity>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  icon: {
    fontSize: 64,
  },
  qrBox: {
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expiryLabel: {
    fontSize: typography.fontSizes.base,
  },
  expiryTime: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[600],
  },
  expiredBox: {
    alignItems: 'center',
    gap: 16,
  },
  expiredIcon: {
    fontSize: 64,
  },
  refreshButton: {
    width: touchTargets.minTouchTarget,
    height: touchTargets.minTouchTarget,
    borderRadius: touchTargets.minTouchTarget / 2,
    backgroundColor: colors.purple[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshText: {
    fontSize: 32,
  },
  regenerateButton: {
    width: touchTargets.minTouchTarget,
    height: touchTargets.minTouchTarget,
    borderRadius: touchTargets.minTouchTarget / 2,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  regenerateIcon: {
    fontSize: 28,
  },
});
