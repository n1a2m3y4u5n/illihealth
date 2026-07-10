import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { categoryColorMap, type ColorCategory } from '../design-tokens/colors';
import { touchTargets } from '../design-tokens/touch-targets';
import { typography } from '../design-tokens/typography';

interface PictogramCardProps {
  // 카드 배경/테두리/아이콘 색 결정
  color: ColorCategory;
  // 표시할 이모지 또는 텍스트 픽토그램 (SVG 교체 전 임시)
  icon: string;
  // 보조 텍스트 (옵션, 픽토그램만으로도 동작)
  label?: string;
  // 탭 핸들러
  onPress?: () => void;
  // 카드 크기 (기본: minCardSize = 100dp)
  size?: number;
  // 비활성화 여부
  disabled?: boolean;
}

// 픽토그램 카드 — 색군(color prop)으로 도메인을 직관적으로 표현
// Big-target 원칙: 기본 100dp 이상
export function PictogramCard({
  color,
  icon,
  label,
  onPress,
  size = touchTargets.minCardSize,
  disabled = false,
}: PictogramCardProps) {
  const palette = categoryColorMap[color];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label ?? icon}
      accessibilityRole="button"
      style={[
        styles.card,
        {
          width: size,
          height: size,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Text style={[styles.icon, { color: palette.icon }]}>{icon}</Text>
      </View>
      {label !== undefined && label.length > 0 && (
        <Text
          style={[styles.label, { color: palette.icon }]}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    // 그림자 (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    // 그림자 (Android)
    elevation: 3,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: touchTargets.iconLarge,
  },
  label: {
    marginTop: 6,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    textAlign: 'center',
  },
});
