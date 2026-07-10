import { View, StyleSheet, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SOSButton } from './SOSButton';
import { VoiceButton } from './VoiceButton';
import { colors } from '../design-tokens/colors';

interface ScreenProps extends ViewProps {
  children: React.ReactNode;
  // SOS·VoiceButton 비활성화 옵션 (모달 등 특수 화면)
  hideSos?: boolean;
  hideVoice?: boolean;
}

// 모든 화면 공통 레이아웃
// - 상단 우측: SOS 버튼 고정
// - 하단 중앙: 마이크 FAB 고정
// - children: 화면 본문 영역
export function Screen({ children, hideSos, hideVoice, style, ...rest }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe}>
      {/* 상단 헤더 영역: SOS 버튼 우측 배치 */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        {!hideSos && (
          <View style={styles.headerRight}>
            <SOSButton />
          </View>
        )}
      </View>

      {/* 화면 본문 */}
      <View style={[styles.content, style]} {...rest}>
        {children}
      </View>

      {/* 하단 FAB 영역: 마이크 중앙 배치 */}
      {!hideVoice && (
        <View style={styles.footer}>
          <VoiceButton />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingBottom: 24,
    backgroundColor: colors.neutral[50],
  },
});
