// 카메라 화면 — 진단서·설명서 OCR 입력
// 가이드 프레임 안에 문서를 맞춰 촬영 후 processing 화면으로 이동

import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import { speak } from '../../lib/voice';
import { usePreferencesStore } from '../../stores/preferences';
import { colors } from '../../design-tokens/colors';
import { typography } from '../../design-tokens/typography';
import { touchTargets } from '../../design-tokens/touch-targets';
import koJson from '../../locales/ko.json';
import enJson from '../../locales/en.json';

const locales = { ko: koJson, en: enJson };

// 가이드 프레임 사이즈 (진단서 비율 A5 기준 ~ 1:√2)
const SCREEN_WIDTH = Dimensions.get('window').width;
const FRAME_WIDTH = SCREEN_WIDTH * 0.85;
const FRAME_HEIGHT = FRAME_WIDTH * 1.41;

export default function CameraScreen() {
  const router = useRouter();
  const { language, autoTts } = usePreferencesStore();
  const t = locales[language];

  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // 화면 진입 시 TTS 안내
  useEffect(() => {
    if (autoTts) {
      speak(t.camera.enterPrescription, {
        lang: language === 'ko' ? 'ko-KR' : 'en-US',
      });
    }
  }, []);

  // 권한 미승인 시
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.blue[600]} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionIcon}>📷</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
          accessibilityRole="button"
        >
          <Text style={styles.permissionButtonText}>{t.error.cameraPermission}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 촬영 → crop → processing 화면으로 이동
  const handleShutter = async (): Promise<void> => {
    if (capturing || !cameraRef.current) return;
    setCapturing(true);

    try {
      // 사진 촬영
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (!photo) {
        setCapturing(false);
        return;
      }

      // 화면 전체에서 가이드 프레임 영역 계산
      const screenHeight = Dimensions.get('window').height;
      const frameLeft = (SCREEN_WIDTH - FRAME_WIDTH) / 2;
      const frameTop = (screenHeight - FRAME_HEIGHT) / 2;

      // 실제 이미지 좌표로 변환 (카메라 출력 해상도 반영)
      const scaleX = photo.width / SCREEN_WIDTH;
      const scaleY = photo.height / screenHeight;

      const cropRegion = {
        originX: frameLeft * scaleX,
        originY: frameTop * scaleY,
        width: FRAME_WIDTH * scaleX,
        height: FRAME_HEIGHT * scaleY,
      };

      // 가이드 프레임 영역만 크롭
      const cropped = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ crop: cropRegion }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );

      router.push({
        pathname: '/(main)/processing',
        params: { imageUri: cropped.uri },
      });
    } catch {
      // 에러 시 재촬영 안내
      if (autoTts) {
        speak(t.error.ocrFail, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
      }
      setCapturing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 카메라 뷰 */}
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      {/* 반투명 오버레이 (가이드 프레임 바깥) */}
      <View style={styles.overlayTop} />
      <View style={styles.overlayMiddleRow}>
        <View style={styles.overlaySide} />
        {/* 가이드 프레임 (투명) */}
        <View style={styles.frame}>
          {/* 모서리 표시선 */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
        <View style={styles.overlaySide} />
      </View>
      <View style={styles.overlayBottom}>
        {/* 안내 텍스트 */}
        <Text style={styles.guideText}>{t.camera.enterPrescription}</Text>

        {/* 셔터 버튼 */}
        <TouchableOpacity
          style={[styles.shutter, capturing && styles.shutterCapturing]}
          onPress={handleShutter}
          disabled={capturing}
          accessibilityRole="button"
          accessibilityLabel={t.camera.shutter}
        >
          {capturing ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <View style={styles.shutterInner} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const OVERLAY_COLOR = 'rgba(0,0,0,0.55)';
const screenHeight = Dimensions.get('window').height;
const FRAME_TOP = (screenHeight - FRAME_HEIGHT) / 2;
const SIDE_WIDTH = (SCREEN_WIDTH - FRAME_WIDTH) / 2;
const BOTTOM_HEIGHT = screenHeight - FRAME_TOP - FRAME_HEIGHT;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[900],
    gap: 24,
  },
  permissionIcon: {
    fontSize: 64,
  },
  permissionButton: {
    backgroundColor: colors.blue[600],
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    minHeight: touchTargets.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionButtonText: {
    color: colors.white,
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
  },
  // 오버레이 4구역
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: FRAME_TOP,
    backgroundColor: OVERLAY_COLOR,
  },
  overlayMiddleRow: {
    position: 'absolute',
    top: FRAME_TOP,
    left: 0,
    right: 0,
    height: FRAME_HEIGHT,
    flexDirection: 'row',
  },
  overlaySide: {
    width: SIDE_WIDTH,
    backgroundColor: OVERLAY_COLOR,
  },
  frame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BOTTOM_HEIGHT,
    backgroundColor: OVERLAY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 32,
    gap: 20,
  },
  guideText: {
    color: colors.white,
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    textAlign: 'center',
  },
  // 모서리 표시선
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.white,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  // 셔터 버튼
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.blue[600],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.white,
  },
  shutterCapturing: {
    opacity: 0.7,
  },
  shutterInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.white,
  },
});
