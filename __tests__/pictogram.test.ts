// 팀원 모듈 Mock 단위 테스트
// 예시 입력 → 예시 출력 검증

import { composer } from '../lib/pictogram';

describe('PictogramComposer Mock', () => {
  test('고혈압약 1일 2회 식후 → 픽토그램 시퀀스 반환', async () => {
    const result = await composer.compose({
      text: '고혈압약 1일 2회 식후 30분',
      lang: 'ko',
      confidence: 0.95,
      docType: 'prescription',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    const { sequence } = result;
    expect(sequence.length).toBeGreaterThan(0);

    // medication 타입 카드가 있어야 함
    const medCard = sequence.find((item) => item.type === 'medication');
    expect(medCard).toBeDefined();

    // 고혈압 관련 morpheme 포함
    const allMorphemes = sequence.flatMap((item) =>
      item.parts.map((p) => p.morpheme_id)
    );
    expect(allMorphemes.some((id) => id.includes('hypertension') || id.includes('pill'))).toBe(true);

    // 식후 morpheme 포함
    expect(allMorphemes.some((id) => id.includes('after_meal'))).toBe(true);

    // display_meta.color가 유효한 값인지
    const validColors = ['blue', 'green', 'purple', 'pink', 'amber', 'red'];
    for (const item of sequence) {
      expect(validColors).toContain(item.display_meta.color);
      expect(typeof item.display_meta.priority).toBe('number');
    }
  });

  test('알 수 없는 텍스트 → success:false 또는 generic 카드 반환', async () => {
    const result = await composer.compose({
      text: '알 수 없는 의료 텍스트 xyz',
      lang: 'ko',
    });

    // success false 이거나, success true이지만 generic 카드
    if (result.success) {
      expect(result.sequence.length).toBeGreaterThan(0);
    } else {
      expect(result.unmatched_tokens.length).toBeGreaterThan(0);
    }
  });

  test('아침 저녁 시각 키워드 → time morpheme 포함', async () => {
    const result = await composer.compose({
      text: '혈압약 아침 저녁 1알씩',
      lang: 'ko',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    const morphemes = result.sequence.flatMap((item) =>
      item.parts.map((p) => p.morpheme_id)
    );

    expect(morphemes.some((id) => id === 'time.morning' || id === 'time.evening')).toBe(true);
  });

  test('경고 키워드 → warning 타입 카드 포함', async () => {
    const result = await composer.compose({
      text: '이 약은 주의가 필요합니다',
      lang: 'ko',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    const hasWarning = result.sequence.some((item) => item.type === 'warning');
    expect(hasWarning).toBe(true);
  });
});
