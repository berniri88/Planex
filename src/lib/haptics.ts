/**
 * Haptics Utility — Wraps Capacitor Haptics with graceful web fallback.
 * Dynamic loading is used to prevent build-time failures if the module
 * is not accessible in the node_modules due to permission errors.
 */

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const vibrationPatterns: Record<HapticStyle, number | number[]> = {
  light: 5,
  medium: 10,
  heavy: 20,
  success: [10, 30, 10],
  warning: [15, 40, 15],
  error: [20, 50, 20, 50, 20],
};

let hapticsModule: any = null;

// True dynamic import to bypass Vite's static analysis
async function getHaptics() {
  if (hapticsModule) return hapticsModule;
  try {
    const pkg = '@capacitor/haptics';
    const mod = await import(/* @vite-ignore */ pkg);
    hapticsModule = mod.Haptics;
    return hapticsModule;
  } catch (e) {
    return null;
  }
}

/**
 * Trigger a haptic feedback.
 */
export async function hapticFeedback(style: HapticStyle = 'light'): Promise<void> {
  const haptics = await getHaptics();
  
  if (haptics) {
    try {
      switch (style) {
        case 'success': await haptics.notification({ type: 'SUCCESS' }); break;
        case 'warning': await haptics.notification({ type: 'WARNING' }); break;
        case 'error': await haptics.notification({ type: 'ERROR' }); break;
        case 'heavy': await haptics.impact({ style: 'HEAVY' }); break;
        case 'medium': await haptics.impact({ style: 'MEDIUM' }); break;
        default: await haptics.impact({ style: 'LIGHT' }); break;
      }
      return;
    } catch (e) {}
  }

  // Web fallback
  if ('vibrate' in navigator) {
    navigator.vibrate(vibrationPatterns[style]);
  }
}

export async function hapticSelection(): Promise<void> {
  const haptics = await getHaptics();
  if (haptics) {
    try {
      await haptics.selectionStart();
      await haptics.selectionChanged();
      await haptics.selectionEnd();
      return;
    } catch (e) {}
  }
  if ('vibrate' in navigator) {
    navigator.vibrate(5);
  }
}
