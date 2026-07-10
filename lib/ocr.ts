// OCR 엔진 래퍼
// 기본: Tesseract.js (오프라인 우선)
// 옵션: EXPO_PUBLIC_USE_VISION_API=true 시 Google Cloud Vision 폴백
// 하이브리드 모드: 두 결과의 신뢰도를 비교하여 높은 쪽 반환

export interface OCRResult {
  text: string;
  confidence: number;   // 0.0 ~ 1.0
  language: string;     // 'kor', 'eng' 등
  engine: 'tesseract' | 'vision_api';
}

// Tesseract.js로 OCR 수행
async function recognizeWithTesseract(imageUri: string, lang: string): Promise<OCRResult> {
  // React Native 환경에서 Tesseract.js는 웹 워커를 사용하지 못함
  // Expo는 File System API를 통해 이미지를 base64로 변환 후 처리
  // Phase 0에서는 인터페이스만 확정하고 실제 trained data는 Phase 1에서 번들
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker(lang);

  try {
    const result = await worker.recognize(imageUri);
    return {
      text: result.data.text,
      confidence: result.data.confidence / 100,
      language: lang,
      engine: 'tesseract',
    };
  } finally {
    await worker.terminate();
  }
}

// Google Cloud Vision API로 OCR 수행 (네트워크 필요)
async function recognizeWithVisionApi(imageUri: string): Promise<OCRResult> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    throw new Error('Google Vision API 키가 설정되지 않았습니다');
  }

  // base64 이미지 변환 (React Native의 fetch API 활용)
  const response = await fetch(imageUri);
  const blob = await response.blob();
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const visionResponse = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: base64 },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        }],
      }),
    }
  );

  if (!visionResponse.ok) {
    throw new Error(`Vision API 오류: ${visionResponse.status}`);
  }

  const data = (await visionResponse.json()) as {
    responses: Array<{
      fullTextAnnotation?: { text: string };
      textAnnotations?: Array<{ description: string; confidence?: number }>;
    }>;
  };

  const fullText = data.responses[0]?.fullTextAnnotation?.text ?? '';
  const rawConf = data.responses[0]?.textAnnotations?.[0]?.confidence;
  const confidence = typeof rawConf === 'number' ? rawConf : 0.85;

  return {
    text: fullText,
    confidence,
    language: 'kor',
    engine: 'vision_api',
  };
}

// 공개 API: 이미지 URI를 받아 OCR 결과 반환
export async function recognize(imageUri: string, lang = 'kor'): Promise<OCRResult> {
  const useVisionApi = process.env.EXPO_PUBLIC_USE_VISION_API === 'true';

  if (!useVisionApi) {
    return recognizeWithTesseract(imageUri, lang);
  }

  // 하이브리드 모드: 두 결과 병렬 실행 후 신뢰도 높은 쪽 반환
  const [tesseractResult, visionResult] = await Promise.allSettled([
    recognizeWithTesseract(imageUri, lang),
    recognizeWithVisionApi(imageUri),
  ]);

  const tessOk = tesseractResult.status === 'fulfilled' ? tesseractResult.value : null;
  const visionOk = visionResult.status === 'fulfilled' ? visionResult.value : null;

  if (tessOk && visionOk) {
    return tessOk.confidence >= visionOk.confidence ? tessOk : visionOk;
  }
  if (tessOk) return tessOk;
  if (visionOk) return visionOk;

  throw new Error('OCR 엔진 오류: 두 엔진 모두 실패했습니다');
}
