import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../design-tokens/colors';
import { typography } from '../design-tokens/typography';

// 오늘 날짜에 따른 날씨 픽토그램 (간단 버전)
function getWeatherIcon(hour: number): string {
  if (hour >= 6 && hour < 12) return '🌤️';
  if (hour >= 12 && hour < 18) return '☀️';
  if (hour >= 18 && hour < 21) return '🌆';
  return '🌙';
}

// 오늘 날짜 픽토그램 헤더 컴포넌트
// 상단 중앙에 날짜·시간·날씨 픽토그램 표시
export function TodayContext() {
  const now = new Date();
  const hour = now.getHours();

  // 월·일 표시
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // 요일 픽토그램
  const weekdayIcons = ['☀️', '🌙', '🔥', '💧', '🌲', '⭐', '🪐'];
  const weekdayIcon = weekdayIcons[now.getDay()] ?? '📅';

  const weatherIcon = getWeatherIcon(hour);

  return (
    <View style={styles.container}>
      {/* 날짜 픽토그램 */}
      <View style={styles.row}>
        <Text style={styles.dateIcon}>{weekdayIcon}</Text>
        <Text style={styles.dateText}>{month}/{day}</Text>
        <Text style={styles.weatherIcon}>{weatherIcon}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateIcon: {
    fontSize: 28,
  },
  dateText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[800],
  },
  weatherIcon: {
    fontSize: 28,
  },
});
