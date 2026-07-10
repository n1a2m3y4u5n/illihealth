// IlliHealth 터치 타깃 토큰
// Big-target 원칙: 문맹·저시력·손 떨림 사용자 배려
// 모든 인터랙티브 요소 ≥64dp, 카드 ≥100dp

export const touchTargets = {
  // 최소 버튼 크기 (64×64dp)
  minTouchTarget: 64,

  // 최소 카드 크기 (100×100dp)
  minCardSize: 100,

  // 하단 FAB (화면 폭의 18% 기준, 상수로 여기엔 참고값만)
  fabSize: 72,

  // SOS 버튼
  sosSize: 56,

  // 픽토그램 아이콘 크기
  iconLarge: 48,
  iconMedium: 32,
  iconSmall: 24,
} as const;
