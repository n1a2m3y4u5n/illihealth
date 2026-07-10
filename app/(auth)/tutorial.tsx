// 튜토리얼 화면 — 최초 가입 후 1회 노출
// 5단계 슬라이드: 사진 → 그림 → 알람 → 기록 → 응급

import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { speak } from '../../lib/voice';
import { usePreferencesStore } from '../../stores/preferences';
import { colors } from '../../design-tokens/colors';
import { typography } from '../../design-tokens/typography';
import { touchTargets } from '../../design-tokens/touch-targets';
import koJson from '../../locales/ko.json';
import enJson from '../../locales/en.json';

const locales = { ko: koJson, en: enJson };

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STEPS = [
  { icon: '📷', colorKey: 'blue' as const, titleKey: 'step1Title', bodyKey: 'step1Body' },
  { icon: '🖼️', colorKey: 'purple' as const, titleKey: 'step2Title', bodyKey: 'step2Body' },
  { icon: '⏰', colorKey: 'green' as const, titleKey: 'step3Title', bodyKey: 'step3Body' },
  { icon: '🩺', colorKey: 'pink' as const, titleKey: 'step4Title', bodyKey: 'step4Body' },
  { icon: '🚨', colorKey: 'red' as const, titleKey: 'step5Title', bodyKey: 'step5Body' },
] as const;

const BG_COLORS: Record<typeof STEPS[number]['colorKey'], string> = {
  blue: colors.blue[50],
  purple: colors.purple[50],
  green: colors.green[50],
  pink: colors.pink[50],
  red: colors.red[50],
};

const ICON_COLORS: Record<typeof STEPS[number]['colorKey'], string> = {
  blue: colors.blue[600],
  purple: colors.purple[600],
  green: colors.green[600],
  pink: colors.pink[600],
  red: colors.red[600],
};

export default function TutorialScreen() {
  const router = useRouter();
  const { language, autoTts } = usePreferencesStore();
  const t = locales[language];

  const [currentStep, setCurrentStep] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const goTo = (index: number): void => {
    scrollRef.current?.scrollTo({ x: SCREEN_WIDTH * index, animated: true });
    setCurrentStep(index);
    if (autoTts) {
      const step = STEPS[index];
      if (!step) return;
      void speak(
        `${t.tutorial[step.titleKey]}. ${t.tutorial[step.bodyKey]}`,
        { lang: language === 'ko' ? 'ko-KR' : 'en-US' }
      );
    }
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const pageIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentStep(pageIndex);
  };

  const handleNext = (): void => {
    if (currentStep < STEPS.length - 1) {
      goTo(currentStep + 1);
    } else {
      router.replace('/(main)/home');
    }
  };

  const handleSkip = (): void => {
    router.replace('/(main)/home');
  };

  return (
    <View style={styles.container}>
      {/* 건너뛰기 */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        accessibilityRole="button"
        accessibilityLabel={t.tutorial.skip}
      >
        <Text style={styles.skipText}>{t.tutorial.skip}</Text>
      </TouchableOpacity>

      {/* 슬라이드 페이지 */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {STEPS.map((step, index) => (
          <View
            key={index}
            style={[styles.slide, { backgroundColor: BG_COLORS[step.colorKey] }]}
          >
            <Text style={styles.slideIcon}>{step.icon}</Text>
            <Text style={[styles.slideTitle, { color: ICON_COLORS[step.colorKey] }]}>
              {t.tutorial[step.titleKey]}
            </Text>
            <Text style={styles.slideBody}>{t.tutorial[step.bodyKey]}</Text>
          </View>
        ))}
      </ScrollView>

      {/* 페이지 점 표시 */}
      <View style={styles.dots}>
        {STEPS.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => goTo(index)}
            accessibilityRole="button"
          >
            <View
              style={[
                styles.dot,
                index === currentStep ? styles.dotActive : styles.dotIdle,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* 다음 / 시작하기 버튼 */}
      <TouchableOpacity
        style={[
          styles.nextButton,
          { backgroundColor: ICON_COLORS[STEPS[currentStep]?.colorKey ?? 'blue'] },
        ]}
        onPress={handleNext}
        accessibilityRole="button"
        accessibilityLabel={currentStep === STEPS.length - 1 ? t.tutorial.done : t.tutorial.next}
      >
        <Text style={styles.nextText}>
          {currentStep === STEPS.length - 1 ? t.tutorial.done : t.tutorial.next}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  skipButton: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    minWidth: touchTargets.minTouchTarget,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[600],
    fontWeight: typography.fontWeights.semibold,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 24,
    paddingTop: 80,
    paddingBottom: 160,
  },
  slideIcon: {
    fontSize: 96,
  },
  slideTitle: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    textAlign: 'center',
  },
  slideBody: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 28,
  },
  dots: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    backgroundColor: colors.neutral[800],
    width: 24,
  },
  dotIdle: {
    backgroundColor: colors.neutral[300],
  },
  nextButton: {
    position: 'absolute',
    bottom: 48,
    left: 40,
    right: 40,
    height: touchTargets.minTouchTarget,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.white,
  },
});
