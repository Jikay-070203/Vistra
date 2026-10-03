'use client';

import React from 'react';
import styles from '../landing.module.css';
import LandingEditorialMotif from '../LandingEditorialMotif';
import CoCreateChatPanel from '../co-create/CoCreateChatPanel';
import CoCreatePlanEditor from '../co-create/CoCreatePlanEditor';
import { type LandingTripState } from '../landingDemo';

import { appConfig } from '@/config/appConfig';

export interface CoCreateSectionProps {
  tripState: LandingTripState;
  showChatOptions?: boolean;
  recentChangeNotice?: string | null;
  coCreateDayView: 1 | 2 | 3;
  onTogglePreference: (pref: 'default' | 'less_travel') => void;
  onToggleChatOptions?: () => void;
  onCloseChatOptions?: () => void;
  onKeepActivity: (activityId: string) => void;
  onSwapActivity: (activityId: string) => void;
  onSkipActivity: (activityId: string) => void;
  onRestoreDisplacedActivity: (activityId: string) => void;
  onSetCoCreateDayView: (day: 1 | 2 | 3) => void;
  onMoveActivity?: (activityId: string, direction: 'up' | 'down') => void;
  onSendMessage?: (content: string) => void;
}

export default function CoCreateSection({
  tripState,
  recentChangeNotice,
  onTogglePreference,
}: CoCreateSectionProps) {
  const loopCycleMs = appConfig.coCreate.loopCycleMs || 7000;
  // Loop stages: 0 (Initial plan), 1 (Guest requests change), 2 (Vistra replies & updates plan)
  const [loopStep, setLoopStep] = React.useState<0 | 1 | 2>(0);

  React.useEffect(() => {
    const t1 = setTimeout(() => setLoopStep(1), 2200);
    const t2 = setTimeout(() => {
      setLoopStep(2);
      onTogglePreference('less_travel');
    }, 4200);

    const interval = setInterval(() => {
      setLoopStep(0);
      onTogglePreference('default');
      setTimeout(() => setLoopStep(1), 2200);
      setTimeout(() => {
        setLoopStep(2);
        onTogglePreference('less_travel');
      }, 4200);
    }, loopCycleMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(interval);
    };
  }, [loopCycleMs, onTogglePreference]);

  return (
    <section
      id="cung-xay"
      className={`${styles.section} ${styles.coCreateSection} ${styles.sectionSpacing}`}
      aria-label="Cùng xây: Lắng nghe và định hình"
    >
      <div className={styles.container}>
        {/* Section Header: Friendly Metaphor */}
        <div className={styles.exploreSectionHeader}>
          <div className="flex items-center gap-3 mb-2.5">
            <LandingEditorialMotif variant="route" className={styles.sectionMotif} width={96} height={58} />
          </div>
          <h2 className={styles.h2}>
            Lắng nghe và định hình.
          </h2>
          <p className={styles.exploreIntroText}>
            Chỉ một chia sẻ nhỏ, hành trình lập tức đổi nhịp — êm ả hơn, vừa vặn hơn.
          </p>
        </div>

        {/* Two-Column Workbench (Desktop 1920x1080) */}
        <div className={`${styles.grid12} ${styles.exploreGrid}`}>
          {/* Left Column (5 cols): Automated Demonstration Dialogue */}
          <div className="col-span-12 lg:col-span-5 h-full">
            <CoCreateChatPanel
              preference={tripState.preference}
              loopStep={loopStep}
              onTogglePreference={onTogglePreference}
              recentChangeNotice={recentChangeNotice}
            />
          </div>

          {/* Right Column (7 cols): Before / After Visual Plan */}
          <div className="col-span-12 lg:col-span-7 h-full">
            <CoCreatePlanEditor
              preference={tripState.preference}
              onTogglePreference={onTogglePreference}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
