export const COLORS = {
  primary: '#4f46e5', // Indigo 600
  primaryLight: '#818cf8', // Indigo 400
  secondary: '#64748b', // Slate 500
  background: '#f8fafc', // Slate 50
  white: '#ffffff',
  textMain: '#1e293b', // Slate 800
  textSecondary: '#475569', // Slate 600
  textMuted: '#94a3b8', // Slate 400
  border: '#e2e8f0', // Slate 200
  success: '#10b981', // Emerald 500
  warning: '#f59e0b', // Amber 500
  danger: '#ef4444', // Red 500
  indigo50: '#eef2ff',
  indigo100: '#e0e7ff',
  emerald50: '#ecfdf5',
  amber50: '#fffbeb',
  red50: '#fef2f2',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const RADIUS = {
  xs: 3,
  sm: 4,
  md: 6,
  lg: 10,
  xl: 14,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02, // Further reduced for minimal look
    shadowRadius: 1,
    elevation: 0.5,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, // Reduced from 0.08
    shadowRadius: 3,
    elevation: 2, // Reduced from 4
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
};
