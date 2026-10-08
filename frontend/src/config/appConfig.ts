/**
 * VISTRA Application Configuration
 * File: frontend/src/config/appConfig.ts
 *
 * Single project-wide configuration source for landing page timings,
 * scroll thresholds, and admin settings.
 */

export const appConfig = {
  header: {
    morphScrollThresholdPx: 80,
    topBackgroundAlpha: 0.8,
    scrolledBackgroundAlpha: 0.6,
    floatingWidthVw: 60,
  },
  overview: {
    // LP-UX-04: Tune overview autoplay in one place.
    cardDurationMs: 5500,
    inactivityResumeDelayMs: 6000,
  },
  draftGraph: {
    chaoticToPruneProgress: 0.35,
    pruneToDraftProgress: 0.70,
    maxNodeDegree: 2,
  },
  coCreate: {
    loopCycleMs: 7000,
  },
  confirm: {
    // 5 seconds per specification requirement (LPUI-09)
    optionCycleMs: 5000,
  },
  auth: {
    // Default allowed email suffix for registration (REG-01)
    emailAllowedSuffix: '@gmail.com',
  },
  journey: {
    stepDurationMs: 2200,
    inactivityResumeDelayMs: 4000,
  },
  revenueGranularity: {
    // If range in days <= dailyMaxDays, display daily data
    dailyMaxDays: 31,
    // If range in days <= weeklyMaxDays, display weekly data
    weeklyMaxDays: 180,
    // If range in days > weeklyMaxDays, display monthly data
  },
  systemHealth: {
    latencySpikeThresholdMs: 2500,
  },
  pagination: {
    adminDefaultPageSize: 10,
    travelerDefaultPageSize: 12,
  },
};

export default appConfig;
