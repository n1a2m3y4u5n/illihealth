// 팀원 담당 픽토그램 합성 엔진 통합
// Phase 0: Mock 구현. 실제 모듈이 준비되면 mockComposer만 교체.
// 인터페이스는 CLAUDE.md 기준으로 고정.

export interface PictogramItem {
  type: 'medication' | 'instruction' | 'warning' | 'info';
  parts: { morpheme_id: string; props?: Record<string, unknown> }[];
  display_meta: {
    color: 'blue' | 'green' | 'purple' | 'pink' | 'amber' | 'red';
    priority: number;
  };
}

export type PictogramResult =
  | { success: true; sequence: PictogramItem[] }
  | { success: false; unmatched_tokens: string[]; partial_sequence: PictogramItem[] };

export interface PictogramComposer {
  compose(input: {
    text: string;
    lang: string;
    confidence?: number;
    docType?: 'prescription' | 'device_manual';
  }): Promise<PictogramResult>;
}

// 키워드 → morpheme ID 매핑 테이블
const KEYWORD_MAP: Array<{ pattern: RegExp; morpheme_id: string }> = [
  { pattern: /고혈압|혈압/,          morpheme_id: 'condition.hypertension' },
  { pattern: /당뇨|혈당/,           morpheme_id: 'condition.diabetes' },
  { pattern: /알약|정제|정$/,         morpheme_id: 'pill.round.white' },
  { pattern: /빨간?.*알약|빨간?.*정/, morpheme_id: 'pill.round.red' },
  { pattern: /파란?.*알약|파란?.*정/, morpheme_id: 'pill.round.blue' },
  { pattern: /캡슐/,               morpheme_id: 'pill.capsule.blue' },
  { pattern: /1일\s*1회|하루\s*1번/, morpheme_id: 'frequency.once_daily' },
  { pattern: /1일\s*2회|하루\s*2번/, morpheme_id: 'frequency.twice_daily' },
  { pattern: /1일\s*3회|하루\s*3번/, morpheme_id: 'frequency.three_daily' },
  { pattern: /1알|한\s*알/,         morpheme_id: 'count.1' },
  { pattern: /2알|두\s*알/,         morpheme_id: 'count.2' },
  { pattern: /3알|세\s*알/,         morpheme_id: 'count.3' },
  { pattern: /아침/,               morpheme_id: 'time.morning' },
  { pattern: /점심|낮/,            morpheme_id: 'time.noon' },
  { pattern: /저녁/,               morpheme_id: 'time.evening' },
  { pattern: /식전|밥\s*먹기\s*전/, morpheme_id: 'context.before_meal' },
  { pattern: /식후|밥\s*먹은?\s*후/, morpheme_id: 'context.after_meal' },
  { pattern: /식중|밥\s*먹을?\s*때/, morpheme_id: 'context.with_meal' },
  { pattern: /주의|경고/,           morpheme_id: 'warning.caution' },
  { pattern: /금지|하지\s*마세요/,  morpheme_id: 'warning.forbidden' },
];

// 입력 텍스트에서 morpheme 시퀀스를 추출하는 Mock 로직
function buildSequenceFromText(text: string): { items: PictogramItem[]; unmatched: string[] } {
  const matched: string[] = [];
  const parts: { morpheme_id: string }[] = [];

  for (const { pattern, morpheme_id } of KEYWORD_MAP) {
    if (pattern.test(text)) {
      parts.push({ morpheme_id });
      matched.push(morpheme_id);
    }
  }

  // 매칭된 것이 없으면 generic 약 카드 반환
  if (parts.length === 0) {
    return {
      items: [{
        type: 'info',
        parts: [{ morpheme_id: 'info.generic_prescription' }],
        display_meta: { color: 'blue', priority: 1 },
      }],
      unmatched: [text.slice(0, 30)],
    };
  }

  // 타입 분류: 경고는 별도 카드, 나머지는 medication 카드
  const warningParts = parts.filter((p) => p.morpheme_id.startsWith('warning'));
  const medParts = parts.filter((p) => !p.morpheme_id.startsWith('warning'));

  const items: PictogramItem[] = [];

  if (medParts.length > 0) {
    items.push({
      type: 'medication',
      parts: medParts,
      display_meta: { color: 'green', priority: 1 },
    });
  }

  if (warningParts.length > 0) {
    items.push({
      type: 'warning',
      parts: warningParts,
      display_meta: { color: 'red', priority: 0 },
    });
  }

  return { items, unmatched: [] };
}

// Mock 구현체
const mockComposer: PictogramComposer = {
  async compose({ text }) {
    await new Promise((res) => setTimeout(res, 200)); // 처리 지연 시뮬레이션

    const { items, unmatched } = buildSequenceFromText(text);

    if (unmatched.length > 0 && items.length === 0) {
      return {
        success: false,
        unmatched_tokens: unmatched,
        partial_sequence: items,
      };
    }

    return {
      success: true,
      sequence: items,
    };
  },
};

// 단일 export 포인트: 실제 모듈 준비 시 이 줄만 교체
export const composer: PictogramComposer = mockComposer;
