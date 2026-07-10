import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../design-tokens/colors';
import { touchTargets } from '../design-tokens/touch-targets';

// SOS 응급 버튼 — 모든 화면 상단 우측에 고정
// 탭 시 응급 모드로 이동 (Phase 2에서 화면 구현)
export function SOSButton() {
  const router = useRouter();

  function handlePress() {
    // Phase 2에서 실제 응급 모드 화면 연결
    // 지금은 라우트 stub
    try {
      router.push('/(main)/emergency' as never);
    } catch {
      // 화면이 아직 없으므로 무시
    }
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      accessibilityLabel="응급"
      accessibilityRole="button"
      style={styles.button}
    >
      <Text style={styles.label}>SOS</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: touchTargets.sosSize,
    height: touchTargets.sosSize,
    borderRadius: touchTargets.sosSize / 2,
    backgroundColor: colors.red[600],
    alignItems: 'center',
    justifyContent: 'center',
    // 그림자 (iOS)
    shadowColor: colors.red[800],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    // 그림자 (Android)
    elevation: 6,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
