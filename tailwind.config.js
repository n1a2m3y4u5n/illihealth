const { tailwindColors } = require('./design-tokens/colors');
const { typography } = require('./design-tokens/typography');
const { spacing } = require('./design-tokens/spacing');
const { touchTargets } = require('./design-tokens/touch-targets');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ...tailwindColors,
        // 중립
        'neutral-50':  '#F9FAFB',
        'neutral-100': '#F3F4F6',
        'neutral-200': '#E5E7EB',
        'neutral-400': '#9CA3AF',
        'neutral-600': '#4B5563',
        'neutral-800': '#1F2937',
        'neutral-900': '#111827',
      },
      fontSize: {
        xs:   [String(typography.fontSizes.xs)  + 'px', { lineHeight: '1.5' }],
        sm:   [String(typography.fontSizes.sm)  + 'px', { lineHeight: '1.5' }],
        base: [String(typography.fontSizes.base) + 'px', { lineHeight: '1.5' }],
        lg:   [String(typography.fontSizes.lg)  + 'px', { lineHeight: '1.4' }],
        xl:   [String(typography.fontSizes.xl)  + 'px', { lineHeight: '1.3' }],
        '2xl': [String(typography.fontSizes['2xl']) + 'px', { lineHeight: '1.2' }],
        '3xl': [String(typography.fontSizes['3xl']) + 'px', { lineHeight: '1.1' }],
      },
      spacing: {
        '0':  String(spacing[0]),
        '1':  String(spacing[1]),
        '2':  String(spacing[2]),
        '3':  String(spacing[3]),
        '4':  String(spacing[4]),
        '5':  String(spacing[5]),
        '6':  String(spacing[6]),
        '8':  String(spacing[8]),
        '10': String(spacing[10]),
        '12': String(spacing[12]),
        '16': String(spacing[16]),
        '20': String(spacing[20]),
        '24': String(spacing[24]),
        // 터치 타깃 상수
        'touch-min':  String(touchTargets.minTouchTarget),
        'card-min':   String(touchTargets.minCardSize),
        'fab':        String(touchTargets.fabSize),
        'sos':        String(touchTargets.sosSize),
      },
      minWidth: {
        'touch': String(touchTargets.minTouchTarget),
        'card':  String(touchTargets.minCardSize),
      },
      minHeight: {
        'touch': String(touchTargets.minTouchTarget),
        'card':  String(touchTargets.minCardSize),
      },
    },
  },
  plugins: [],
};
