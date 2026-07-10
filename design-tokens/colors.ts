// IlliHealth 카테고리별 컬러 시스템
// 각 색은 의미 단위: 같은 색 = 같은 도메인 (Color = Category 원칙)
// 컬러블라인드 안전을 위해 픽토그램 모양과 항상 이중 인코딩

export const colors = {
  // 파랑: 새 정보·입력 (카메라, OCR, 사진 등록)
  blue: {
    50:  '#EBF2FA',
    100: '#C5DCEF',
    600: '#185FA5',
    800: '#0E3D6B',
  },

  // 초록: 안전·복약·일상 (복약 알람, 잔여량, 상호작용 경고)
  green: {
    50:  '#EDF4E6',
    100: '#C8DFB1',
    600: '#3B6D11',
    800: '#264708',
  },

  // 보라: 보관·지식 (보관함, 설명서, 의료진 QR)
  purple: {
    50:  '#EEEDF9',
    100: '#C9C6EE',
    600: '#534AB7',
    800: '#352F78',
  },

  // 분홍: 신체·기록 (일지, 사진 경과)
  pink: {
    50:  '#F7E9EF',
    100: '#E8BBCA',
    600: '#993556',
    800: '#632237',
  },

  // 노랑·주황: 예방·주의 (백신, 만성질환, 감염병)
  amber: {
    50:  '#FBF2E3',
    100: '#F2D9A9',
    600: '#BA7517',
    800: '#7A4D0F',
  },

  // 빨강: 긴급 (SOS, 응급 모드)
  red: {
    50:  '#F8E8E8',
    100: '#EDB9B9',
    600: '#A32D2D',
    800: '#6B1D1D',
  },

  // 중립 (UI 공통)
  neutral: {
    50:  '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  white: '#FFFFFF',
  black: '#000000',
} as const;

// Tailwind 연동용 플랫 팔레트
export const tailwindColors = {
  'blue-50':    colors.blue[50],
  'blue-100':   colors.blue[100],
  'blue-600':   colors.blue[600],
  'blue-800':   colors.blue[800],
  'green-50':   colors.green[50],
  'green-100':  colors.green[100],
  'green-600':  colors.green[600],
  'green-800':  colors.green[800],
  'purple-50':  colors.purple[50],
  'purple-100': colors.purple[100],
  'purple-600': colors.purple[600],
  'purple-800': colors.purple[800],
  'pink-50':    colors.pink[50],
  'pink-100':   colors.pink[100],
  'pink-600':   colors.pink[600],
  'pink-800':   colors.pink[800],
  'amber-50':   colors.amber[50],
  'amber-100':  colors.amber[100],
  'amber-600':  colors.amber[600],
  'amber-800':  colors.amber[800],
  'red-50':     colors.red[50],
  'red-100':    colors.red[100],
  'red-600':    colors.red[600],
  'red-800':    colors.red[800],
};

// 카테고리 색 매핑 (PictogramCard 등에서 color prop으로 사용)
export type ColorCategory = 'blue' | 'green' | 'purple' | 'pink' | 'amber' | 'red';

export const categoryColorMap: Record<ColorCategory, { bg: string; icon: string; border: string }> = {
  blue:   { bg: colors.blue[50],   icon: colors.blue[600],   border: colors.blue[100] },
  green:  { bg: colors.green[50],  icon: colors.green[600],  border: colors.green[100] },
  purple: { bg: colors.purple[50], icon: colors.purple[600], border: colors.purple[100] },
  pink:   { bg: colors.pink[50],   icon: colors.pink[600],   border: colors.pink[100] },
  amber:  { bg: colors.amber[50],  icon: colors.amber[600],  border: colors.amber[100] },
  red:    { bg: colors.red[50],    icon: colors.red[600],    border: colors.red[100] },
};
