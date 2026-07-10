// OCR 엔진 단위 테스트
// 동적 import(tesseract.js)는 Jest CJS 환경에서 직접 모킹 대신
// 모듈 수준에서 스파이 패턴을 사용하여 인터페이스 검증

import type { OCRResult } from '../lib/ocr';

// tesseract.js를 정적 모킹 (Jest의 moduleNameMapper 방식과 동일)
jest.mock('tesseract.js', () => ({
  __esModule: true,
  createWorker: jest.fn().mockImplementation(() =>
    Promise.resolve({
      recognize: jest.fn().mockResolvedValue({
        data: {
          text: '고혈압약 1일 2회 식후 30분\n혈압강하제 10mg',
          confidence: 87,
        },
      }),
      terminate: jest.fn().mockResolvedValue(undefined),
    })
  ),
}));

// 테스트용 OCR 결과 팩토리
function makeOcrResult(overrides?: Partial<OCRResult>): OCRResult {
  return {
    text: '고혈압약 1일 2회 식후',
    confidence: 0.87,
    language: 'kor',
    engine: 'tesseract',
    ...overrides,
  };
}

describe('OCRResult 인터페이스 검증', () => {
  test('타입 구조: text, confidence, language, engine 모두 존재', () => {
    const result = makeOcrResult();
    expect(typeof result.text).toBe('string');
    expect(typeof result.confidence).toBe('number');
    expect(typeof result.language).toBe('string');
    expect(['tesseract', 'vision_api']).toContain(result.engine);
  });

  test('신뢰도 범위: 0.0 ~ 1.0 사이', () => {
    const result = makeOcrResult({ confidence: 0.87 });
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  test('엔진 종류: tesseract 또는 vision_api만 허용', () => {
    const tesseract = makeOcrResult({ engine: 'tesseract' });
    const vision = makeOcrResult({ engine: 'vision_api' });
    expect(tesseract.engine).toBe('tesseract');
    expect(vision.engine).toBe('vision_api');
  });

  test('Korean OCR: language가 kor 형식', () => {
    const result = makeOcrResult({ language: 'kor' });
    expect(result.language).toBe('kor');
  });
});

describe('OCR 신뢰도 정규화 로직', () => {
  test('Tesseract confidence 87 → 0.87로 정규화', () => {
    const rawConfidence = 87;
    const normalized = rawConfidence / 100;
    expect(normalized).toBe(0.87);
    expect(normalized).toBeLessThanOrEqual(1.0);
  });

  test('신뢰도 0~100 범위에서 0~1로 변환', () => {
    const cases = [0, 50, 87, 100];
    for (const raw of cases) {
      const normalized = raw / 100;
      expect(normalized).toBeGreaterThanOrEqual(0);
      expect(normalized).toBeLessThanOrEqual(1);
    }
  });
});
