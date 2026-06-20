import { Platform } from 'react-native';

// ─── Paleta de Cores ────────────────────────────────────────────────────────────
export const COLORS = {
  // Backgrounds
  background: '#060913',
  backgroundAlt: '#0e172a',
  surface: 'rgba(19, 28, 49, 0.55)',
  surfaceSolid: '#131c31',
  surfaceDeep: '#090d16',

  // Borders
  border: 'rgba(255, 255, 255, 0.08)',
  borderSubtle: '#1e293b',
  borderMedium: '#243256',

  // Neon / Accent
  neonCyan: '#00f2fe',
  neonCyanDim: 'rgba(0, 242, 254, 0.25)',
  neonCyanGlow: 'rgba(0, 242, 254, 0.12)',
  accentBlue: '#3b82f6',
  accentBlueDark: '#1d4ed8',
  accentBlueDim: 'rgba(79, 172, 254, 0.02)',

  // Semantic
  success: '#10b981',
  successDim: 'rgba(16, 185, 129, 0.1)',
  successBorder: 'rgba(16, 185, 129, 0.2)',
  successGlowBg: 'rgba(16, 185, 129, 0.08)',
  successGlowBorder: 'rgba(16, 185, 129, 0.15)',

  warning: '#f59e0b',
  warningLight: '#fbbf24',
  warningDim: 'rgba(245, 158, 11, 0.1)',
  warningBorder: 'rgba(245, 158, 11, 0.2)',

  error: '#ef4444',
  errorGlow: 'rgba(239, 68, 68, 0.4)',

  // Premium / Gold
  gold: '#fbbf24',
  goldMedium: '#f59e0b',
  goldDark: '#d97706',
  goldDim: 'rgba(251, 191, 36, 0.1)',
  goldDimAlt: 'rgba(251, 191, 36, 0.12)',
  goldBorder: 'rgba(251, 191, 36, 0.2)',
  goldBorderAlt: 'rgba(251, 191, 36, 0.3)',
  goldShine: 'rgba(255, 255, 255, 0.15)',
  goldShineEnd: 'rgba(255, 255, 255, 0)',

  // Purple (Quiet Hours)
  purple: '#8b5cf6',
  purpleDim: 'rgba(139, 92, 246, 0.08)',
  purpleBorder: 'rgba(139, 92, 246, 0.15)',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#f8fafc',
  textTertiary: '#94a3b8',
  textMuted: '#64748b',
  textDark: '#475569',
  textOnDark: '#0f172a',

  // Misc
  white: '#ffffff',
  transparent: 'transparent',
};

// ─── Tipografia ─────────────────────────────────────────────────────────────────
export const TYPOGRAPHY = {
  fontMono: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  fontMonoBold: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
};

// ─── Espaçamentos ───────────────────────────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 30,
};

// ─── Raios de Borda ─────────────────────────────────────────────────────────────
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 18,
  pill: 20,
  card: 24,
  circle: 50,
};

// ─── Sombras ────────────────────────────────────────────────────────────────────
export const SHADOWS = {
  card: {
    shadowColor: COLORS.neonCyan,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  button: {
    shadowColor: COLORS.accentBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    shadowColor: COLORS.neonCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  premium: {
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
};

// ─── Gradientes ─────────────────────────────────────────────────────────────────
export const GRADIENTS = {
  background: [COLORS.background, COLORS.backgroundAlt],
  neonCyan: [COLORS.neonCyan, COLORS.accentBlue],
  neonCyanSoft: [COLORS.neonCyanGlow, COLORS.accentBlueDim],
  interval: [COLORS.neonCyan, '#4facfe'],
  premium: [COLORS.gold, COLORS.goldMedium, COLORS.goldDark],
  premiumShine: [COLORS.goldShine, COLORS.goldShineEnd],
  syncButton: [COLORS.neonCyan, COLORS.accentBlue],
};
