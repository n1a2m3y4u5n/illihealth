import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../design-tokens/colors';
import { touchTargets } from '../design-tokens/touch-targets';

interface BigCheckButtonProps {
  onPress: () => void;
  label?: string;
  disabled?: boolean;
  size?: number;
}

// 큰 ✓ 확인 버튼 — Big-target 원칙 (≥64dp)
// 초록(#3B6D11): 안전·완료·복약 도메인
export function BigCheckButton({
  onPress,
  label,
  disabled = false,
  size = touchTargets.minTouchTarget,
}: BigCheckButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label ?? '확인'}
      accessibilityRole="button"
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Text style={styles.icon}>✓</Text>
      {label !== undefined && label.length > 0 && (
        <Text style={styles.label}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.green[600],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.green[800],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  icon: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
});
