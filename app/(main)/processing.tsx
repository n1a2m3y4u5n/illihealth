// OCR + 픽토그램 합성 처리 화면
// imageUri 파라미터 → OCR → 픽토그램 변환 → prescription-review 이동

import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { recognize } from '../../lib/ocr';
import { composer } from '../../lib/pictogram';
import { speak } from '../../lib/voice';
import { usePreferencesStore } from '../../stores/preferences';
import { colors } from '../../design-tokens/colors';
import { typography } from '../../design-tokens/typography';
import koJson from '../../locales/ko.json';
import enJson from '../../locales/en.json';

const locales = { ko: koJson, en: enJson };

// 처리 단계
type Stage = 'ocr' | 'pictogram' | 'done' | 'error';

export default function ProcessingScreen() {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const { language, autoTts } = usePreferencesStore();
  const t = locales[language];

  const [stage, setStage] = useState<Stage>('ocr');
  const spinValue = useRef(new Animated.Value(0)).current;

  // 회전 애니메이션
  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, [spinValue]);

  // 처리 파이프라인
  useEffect(() => {
    if (!imageUri) {
      router.back();
      return;
    }
    runPipeline(imageUri);
  }, [imageUri]);

  const runPipeline = async (uri: string): Promise<void> => {
    try {
      // 단계 1: OCR
      setStage('ocr');
      if (autoTts) {
        await speak(t.processing.ocrProgress, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
      }

      const ocrResult = await recognize(uri, language === 'ko' ? 'kor' : 'eng');

      // 단계 2: 픽토그램 합성
      setStage('pictogram');
      if (autoTts) {
        await speak(t.processing.pictogramProgress, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
      }

      const pictogramResult = await composer.compose({
        text: ocrResult.text,
        lang: language === 'ko' ? 'ko' : 'en',
        confidence: ocrResult.confidence,
        docType: 'prescription',
      });

      // 완료 → prescription-review로 이동
      setStage('done');
      router.replace({
        pathname: '/(main)/prescription-review',
        params: {
          imageUri: uri,
          ocrText: ocrResult.text,
          pictogramResult: JSON.stringify(pictogramResult),
        },
      });
    } catch {
      setStage('error');
      if (autoTts) {
        speak(t.error.ocrFail, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
      }
      // 2초 후 카메라로 복귀
      setTimeout(() => router.back(), 2000);
    }
  };

  const spinDeg = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const stageLabel =
    stage === 'ocr'
      ? t.processing.ocrProgress
      : stage === 'pictogram'
      ? t.processing.pictogramProgress
      : stage === 'done'
      ? t.processing.done
      : t.error.ocrFail;

  return (
    <Screen hideSos hideVoice>
      <View style={styles.container}>
        {/* 회전 픽토그램 */}
        <Animated.Text
          style={[styles.spinIcon, { transform: [{ rotate: spinDeg }] }]}
        >
          {stage === 'error' ? '⚠️' : stage === 'ocr' ? '📄' : '🖼️'}
        </Animated.Text>

        {/* 단계 안내 텍스트 */}
        <Text style={styles.stageText}>{stageLabel}</Text>

        {/* 진행 단계 점 표시 */}
        <View style={styles.dots}>
          <View style={[styles.dot, stage === 'ocr' ? styles.dotActive : styles.dotDone]} />
          <View
            style={[
              styles.dot,
              stage === 'pictogram' ? styles.dotActive : stage === 'done' ? styles.dotDone : styles.dotIdle,
            ]}
          />
          <View style={[styles.dot, stage === 'done' ? styles.dotActive : styles.dotIdle]} />
        </View>
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
  spinIcon: {
    fontSize: 80,
  },
  stageText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[700],
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotActive: {
    backgroundColor: colors.blue[600],
  },
  dotDone: {
    backgroundColor: colors.green[600],
  },
  dotIdle: {
    backgroundColor: colors.neutral[300],
  },
});
