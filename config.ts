/**
 * Application Configuration
 *
 * This file centralizes environment-based configuration for the two deployment modes:
 * - 'free': PlatformLifter.app (no authentication, limited features)
 * - 'paid': Platform Coach (full authentication and features)
 */

export type AppMode = 'free' | 'paid';

/**
 * Determines which version of the app is running
 * Set via VITE_APP_MODE environment variable
 */
export const APP_MODE: AppMode = (import.meta.env.VITE_APP_MODE as AppMode) || 'paid';

// Debug logging - remove after confirming it works
console.log('[Config] APP_MODE:', APP_MODE);
console.log('[Config] IS_FREE_VERSION:', APP_MODE === 'free');
console.log('[Config] Environment VITE_APP_MODE:', import.meta.env.VITE_APP_MODE);

/**
 * Whether this is the free version (PlatformLifter)
 */
export const IS_FREE_VERSION = APP_MODE === 'free';

/**
 * Whether this is the paid version (Platform Coach)
 */
export const IS_PAID_VERSION = APP_MODE === 'paid';

/**
 * Clerk configuration (only used in paid version)
 */
export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

/**
 * URL to redirect users to when they want to upgrade from free to paid
 * Should point to the pricing page of Platform Coach
 */
export const UPGRADE_URL = import.meta.env.VITE_UPGRADE_URL || 'https://platformcoach.app';

/**
 * Branding configuration based on app mode
 */
export const BRANDING = {
  appName: IS_FREE_VERSION ? 'Platform Lifter' : 'Platform Coach',
  appTitle: IS_FREE_VERSION ? 'Platform Lifter - Free Powerlifting Tools' : 'Platform Coach',
  backgroundGradient: IS_FREE_VERSION
    ? 'bg-gradient-to-br from-orange-500 to-red-600'
    : 'bg-gradient-to-br from-[#0066FF] to-[#0044AA]',
  themeColor: IS_FREE_VERSION ? '#f97316' : '#0066ff', // orange-500 vs blue
};

/**
 * Feature flags for free vs paid versions
 */
export const FEATURES = {
  // Always available features
  competitionPlannerLite: true,
  workoutTimerBasic: true,
  warmupGenerator: true,
  oneRmCalculatorBasic: true,
  velocityProfileTest: true,

  // Paid-only features (requires authentication)
  savePlans: IS_PAID_VERSION,
  exportPdf: IS_PAID_VERSION,
  exportCsv: IS_PAID_VERSION,
  gameDayMode: IS_PAID_VERSION,
  competitionPlannerPro: IS_PAID_VERSION,
  oneRmCalculatorAdvanced: IS_PAID_VERSION, // Training Load feature
  velocityProfileGenerate: IS_PAID_VERSION,
  techniqueScore: IS_PAID_VERSION,
  workoutTimerAdvanced: IS_PAID_VERSION, // Custom presets
};

/**
 * PWA manifest configuration
 * Note: For production, you should generate separate manifest.json files
 * or dynamically serve them based on the domain
 */
export const PWA_CONFIG = {
  name: BRANDING.appName,
  shortName: IS_FREE_VERSION ? 'PL' : 'PC',
  description: IS_FREE_VERSION
    ? 'Free powerlifting tools for athletes and coaches'
    : 'The essential toolkit for competitive powerlifters and coaches',
};
