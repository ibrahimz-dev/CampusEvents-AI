export const Colors = {
  background: '#F5F5F7',
  surface: '#FFFFFF',
  primary: '#1A1A1A',
  primaryLight: '#2C2C2E',

  textPrimary: '#1A1A1A',
  textSecondary: '#8E8E93',
  textMuted: '#C7C7CC',
  textWhite: '#FFFFFF',

  border: '#E5E5EA',
  borderLight: '#F2F2F7',

  categoryWorkshop: { bg: '#F2F2F7', text: '#1A1A1A', border: '#E5E5EA' },
  categoryTalk: { bg: '#F0F0F5', text: '#1A1A1A', border: '#E5E5EA' },
  categoryClub: { bg: '#F0F5F0', text: '#1A1A1A', border: '#E5E5EA' },
  categoryExam: { bg: '#F5F0F0', text: '#1A1A1A', border: '#E5E5EA' },
  categoryOther: { bg: '#F0F0F5', text: '#1A1A1A', border: '#E5E5EA' },

  success: '#34C759',
  successBg: '#E8F8E8',
  error: '#FF3B30',
  errorBg: '#FFE8E5',
  warning: '#FF9F0A',
  warningBg: '#FFF4E0',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const FontSize = {
  caption: 12,
  body: 15,
  label: 13,
  subhead: 17,
  title: 20,
  heading: 28,
  display: 34,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Shadow = {
  level1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  level2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const getCategoryStyle = (category: string) => {
  switch (category) {
    case 'Workshop':
      return Colors.categoryWorkshop;
    case 'Talk':
      return Colors.categoryTalk;
    case 'Club':
      return Colors.categoryClub;
    case 'Exam':
      return Colors.categoryExam;
    default:
      return Colors.categoryOther;
  }
};
