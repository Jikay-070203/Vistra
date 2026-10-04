/**
 * VISTRA Application Configuration
 * File: frontend/src/config/appConfig.ts
 *
 * Single project-wide configuration source for landing page timings,
 * scroll thresholds, admin settings, and demo metrics.
 */

export interface MetricConfig {
  value: string;
  label?: string;
  subtext: string;
  isMock?: boolean;
  mockNotice: string;
}

export const appConfig = {
  hero: {
    planningTimeOptimization: {
      value: "85%",
      label: "Tiết kiệm thời gian",
      subtext: "giảm thiểu sàng lọc thông tin rải rác",
      isMock: true,
      mockNotice: "Dữ liệu mô phỏng demo — chưa phải số liệu kiểm chứng",
    },
    planAcceptanceRate: {
      value: "94%",
      label: "Khớp ý định thực tế",
      subtext: "điểm đến giữ lại sau khi thảo luận",
      isMock: true,
      mockNotice: "Dữ liệu mô phỏng demo — chưa phải số liệu kiểm chứng",
    },
  },
  header: {
    morphScrollThresholdPx: 80,
    topBackgroundAlpha: 0.8,
    scrolledBackgroundAlpha: 0.6,
    floatingWidthVw: 60,
  },
  overview: {
    // Exactly 20 seconds per card per specification requirement
    cardDurationMs: 20000,
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
    optionCycleMs: 7500,
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
  adminAuth: {
    cookieName: 'vistra_admin_session',
    sessionDurationSeconds: 86400, // 24 hours
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
