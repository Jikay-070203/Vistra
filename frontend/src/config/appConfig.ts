/**
 * VISTRA Application Configuration
 * File: frontend/src/config/appConfig.ts
 *
 * Single project-wide configuration source for landing page timings,
 * scroll thresholds, and demo metrics.
 * Every affected component imports its tunable parameters from here.
 */

export interface MetricConfig {
  value: string;
  label: string;
  subtext: string;
  isMock: boolean;
  mockNotice: string;
}

export interface AppConfig {
  hero: {
    planningTimeOptimization: MetricConfig;
    planAcceptanceRate: MetricConfig;
  };
  header: {
    /** Scroll offset in pixels before morphing from full-width to floating (unit: px) */
    morphScrollThresholdPx: number;
    /** Background alpha for top full-width state (0.0 - 1.0) */
    topBackgroundAlpha: number;
    /** Background alpha for scrolled floating state (0.0 - 1.0) */
    scrolledBackgroundAlpha: number;
    /** Floating header width ratio (approx 60vw) */
    floatingWidthVw: number;
  };
  overview: {
    /** Auto-cycle duration per card in milliseconds (MANDATORY DEFAULT: exactly 20 seconds = 20000ms) */
    cardDurationMs: number;
    /** Inactivity delay before resuming auto-cycle after user interaction (unit: ms) */
    inactivityResumeDelayMs: number;
  };
  draftGraph: {
    /** Normalized scroll progress threshold to transition from Chaotic to PRUNE state (0.0 - 1.0) */
    chaoticToPruneProgress: number;
    /** Normalized scroll progress threshold to transition from PRUNE to DRAFT state (0.0 - 1.0) */
    pruneToDraftProgress: number;
    /** Maximum allowed degree per node in pruned / draft route line */
    maxNodeDegree: number;
  };
  coCreate: {
    /** Auto-loop duration between Before and After action-affect states (unit: ms) */
    loopCycleMs: number;
  };
  confirm: {
    /** Auto-loop duration per option reveal in Confirm section (unit: ms) */
    optionCycleMs: number;
  };
  journey: {
    /** Time spent highlighting each destination step in the confirmed journey preview (unit: ms) */
    stepDurationMs: number;
    /** Inactivity delay before resuming journey auto-progression after user hovers or inspects (unit: ms) */
    inactivityResumeDelayMs: number;
  };
}

export const appConfig: AppConfig = {
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
    // Reduced from 4000ms to 2200ms for faster, livelier presentation while maintaining clarity
    stepDurationMs: 2200,
    inactivityResumeDelayMs: 4000,
  },
};

export default appConfig;
