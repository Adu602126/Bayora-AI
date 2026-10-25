// useHaptics — micro-haptic feedback utility
// Wraps navigator.vibrate with semantic patterns

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const PATTERNS: Record<HapticStyle, number | number[]> = {
  selection: 10,
  light:     25,
  medium:    50,
  heavy:     80,
  success:   [30, 50, 30],
  warning:   [100, 60, 100],
  error:     [200, 80, 200, 80, 400],
};

export function haptic(style: HapticStyle = 'light') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(PATTERNS[style]);
  }
}

// React hook version
export function useHaptics() {
  return haptic;
}
