// IlliHealth 타이포그래피 토큰
// 저시력 사용자 고려: 최소 14px, 본문 16px

export const typography = {
  fontSizes: {
    xs:   12,
    sm:   14,  // 최소 허용 크기
    base: 16,  // 본문 기본
    lg:   18,  // 소헤딩
    xl:   22,  // 대헤딩
    '2xl': 28, // 화면 타이틀
    '3xl': 36, // 강조 숫자 (알람 시각 등)
  },

  fontWeights: {
    normal:   '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
  },

  lineHeights: {
    tight:  1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;
