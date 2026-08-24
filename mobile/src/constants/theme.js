// Website Color Palette & Typography Tokens for Mobile (MediSyst HMS)
export const COLORS = {
  // Primary Royal Blue Palette (Matching Website Tailwind Config)
  primary: '#0052CC', // Royal Blue Primary (primary-600)
  primary50: '#E6F0FF',
  primary100: '#CCE0FF',
  primary200: '#99C2FF',
  primary500: '#0066FF',
  primary600: '#0052CC',
  primary700: '#003D99',
  primary900: '#001433',

  // Clinical Surfaces (Matching Website Tailwind Config)
  surface: '#F8F9FB', // Main body background
  container: '#FFFFFF', // Card / Modal container background
  onSurface: '#1A1C1E', // Main heading / text color
  outline: '#D9DADC', // Border color
  muted: '#64748B', // Subtitle & secondary text color
  heroBg: '#0F172A', // Slate 900 Hero Section background

  // Success / Emerald Palette
  success50: '#F0FDF4',
  success100: '#DCFCE7',
  success500: '#22C55E',
  success600: '#16A34A',

  // Warning / Amber Palette
  warning50: '#FFFBEB',
  warning100: '#FEF3C7',
  warning500: '#F59E0B',

  // Danger / Red Palette
  danger50: '#FEF2F2',
  danger100: '#FEE2E2',
  danger500: '#EF4444',
  danger600: '#DC2626',
  dangerDark: '#450A0A',
  dangerBorder: '#991B1B',

  // Purple AI Accent Palette
  purple50: '#FAF5FF',
  purple100: '#F3E8FF',
  purple600: '#9333EA',
  purple700: '#7E22CE',

  // Basic shortcuts
  background: '#F8F9FB',
  cardBg: '#FFFFFF',
  textPrimary: '#1A1C1E',
  textSecondary: '#475569',
  textMuted: '#64748B',
  border: '#D9DADC',
  borderLight: '#F1F5F9',
};

// Website Typography Weights & Letter Spacing
export const TYPOGRAPHY = {
  fontFamily: 'System', // Standard iOS/Android system font closely matching Inter
  
  // Headings
  h1: { fontSize: 28, fontWeight: '900', color: '#1A1C1E', letterSpacing: -0.8 },
  h2: { fontSize: 22, fontWeight: '800', color: '#1A1C1E', letterSpacing: -0.5 },
  h3: { fontSize: 18, fontWeight: '800', color: '#1A1C1E', letterSpacing: -0.3 },
  h4: { fontSize: 15, fontWeight: '800', color: '#1A1C1E' },
  
  // Body text
  bodyLarge: { fontSize: 14, fontWeight: '500', color: '#475569', lineHeight: 22 },
  bodyMedium: { fontSize: 13, fontWeight: '500', color: '#475569', lineHeight: 19 },
  bodySmall: { fontSize: 12, fontWeight: '500', color: '#64748B', lineHeight: 16 },

  // Badges & Buttons
  button: { fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },
  badge: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
};

// Website Card Radius & Shadows
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    elevation: 0,
  },
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#0052CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
  },
};

export const RADII = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 9999,
};
