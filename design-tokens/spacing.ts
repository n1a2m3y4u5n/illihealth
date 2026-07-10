// IlliHealth 스페이싱 토큰
// 8px 베이스 그리드 기반

export const spacing = {
  0:   0,
  1:   4,   // 0.5 * 8
  2:   8,   // 1 * 8 (기본 단위)
  3:   12,
  4:   16,  // 2 * 8
  5:   20,
  6:   24,  // 3 * 8
  8:   32,  // 4 * 8
  10:  40,
  12:  48,
  16:  64,
  20:  80,
  24:  96,
} as const;

export type SpacingKey = keyof typeof spacing;
