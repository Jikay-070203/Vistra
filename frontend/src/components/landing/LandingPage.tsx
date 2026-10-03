'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import styles from './landing.module.css';
import {
  createInitialLandingState,
  applyPreference,
  keepActivity,
  swapActivitySuggestion,
  skipActivity,
  restoreDisplacedActivity,
  confirmPlan,
  startEditingItem,
  requestAlternative,
  moveActivityOrder,
  addTranscriptMessage,
  type LandingTripState,
  type LandingActivity,
} from './landingDemo';
import LandingHero from './hero/LandingHero';
import OverviewSection from './overview/OverviewSection';
import ExploreSection from './sections/ExploreSection';
import CoCreateSection from './sections/CoCreateSection';
import ConfirmSection from './sections/ConfirmSection';
import FinalValueSection from './sections/FinalValueSection';

export default function LandingPage() {
  // LP-05 / LP-13 Cùng xây Interactive State
  const [tripState, setTripState] = React.useState<LandingTripState>(() => createInitialLandingState());
  const [recentChangeNotice, setRecentChangeNotice] = React.useState<string | null>(null);
  const [coCreateDayView, setCoCreateDayView] = React.useState<1 | 2 | 3>(1);

  // LP-06 / LP-14 Confirmation & Partial Edit State
  const [activeReasonPickerId, setActiveReasonPickerId] = React.useState<string | null>(null);
  const [confirmFeedback, setConfirmFeedback] = React.useState<{ success: boolean; message: string } | null>(null);
  const [confirmFilterView, setConfirmFilterView] = React.useState<'cautions' | 'all'>('cautions');
  const [confirmSelectedDay, setConfirmSelectedDay] = React.useState<1 | 2 | 3>(1);

  const handleTogglePreference = React.useCallback((pref: 'default' | 'less_travel') => {
    setTripState((prev) => applyPreference(prev, pref));
    setConfirmFeedback(null);
    setRecentChangeNotice(
      pref === 'less_travel'
        ? 'Đã áp dụng ưu tiên "Ít di chuyển": gom 2 điểm gần nhau vào buổi sáng, chiều linh hoạt.'
        : 'Đã hoàn về bản nháp ban đầu của AI.'
    );
  }, []);

  const handleKeepActivity = React.useCallback((activityId: string) => {
    setTripState((prev) => keepActivity(prev, activityId));
    setConfirmFeedback(null);
    setRecentChangeNotice('Đã giữ lại mục đã chọn. Lựa chọn này được bảo toàn khi đổi các phần khác.');
  }, []);

  const handleSwapActivity = React.useCallback((activityId: string) => {
    setTripState((prev) => swapActivitySuggestion(prev, activityId));
    setConfirmFeedback(null);
    setRecentChangeNotice('AI đã đề xuất phương án thay thế nhẹ hơn cho buổi chiều.');
  }, []);

  const handleSkipActivity = React.useCallback((activityId: string) => {
    setTripState((prev) => skipActivity(prev, activityId));
    setConfirmFeedback(null);
    setRecentChangeNotice('Đã bỏ qua hoạt động. Bạn có thể chọn lại bất cứ lúc nào.');
  }, []);

  const handleRestoreDisplacedActivity = React.useCallback((activityId: string) => {
    setTripState((prev) => restoreDisplacedActivity(prev, activityId));
    setConfirmFeedback(null);
    setRecentChangeNotice('Đã khôi phục lựa chọn vào lịch trình Ngày 1.');
  }, []);

  const handleConfirmPlan = React.useCallback(() => {
    const result = confirmPlan(tripState);
    if (result.success) {
      setTripState(result.state);
      setConfirmFeedback({ success: true, message: result.message });
      setRecentChangeNotice(result.message);
    } else {
      setConfirmFeedback({ success: false, message: result.message });
    }
  }, [tripState]);

  const handleStartEditing = React.useCallback((act: LandingActivity) => {
    setTripState((prev) => startEditingItem(prev, act.id));
    setCoCreateDayView(act.dayNumber as 1 | 2 | 3);
    setConfirmSelectedDay(act.dayNumber as 1 | 2 | 3);
    setRecentChangeNotice(`Đang tập trung chỉnh sửa mục "${act.title}" tại phần Cùng xây.`);
    setTimeout(() => {
      const el = document.getElementById(`activity-${act.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const firstBtn = el.querySelector('button');
        firstBtn?.focus();
      } else {
        const sec = document.getElementById('cung-xay');
        sec?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  }, []);

  const handleRequestAlternativeWithReason = React.useCallback(
    (activityId: string, reason: 'too_dense' | 'high_cost' | 'not_preferred') => {
      setTripState((prev) => requestAlternative(prev, activityId, reason));
      setActiveReasonPickerId(null);
      setConfirmFeedback(null);
      const reasonLabel =
        reason === 'too_dense'
          ? 'Lịch quá dày'
          : reason === 'high_cost'
          ? 'Chi phí cao'
          : 'Không muốn địa điểm này';
      setRecentChangeNotice(`Đã đổi phương án khác vì lý do: ${reasonLabel}.`);
    },
    []
  );

  const handleMoveActivity = React.useCallback(
    (activityId: string, direction: 'up' | 'down') => {
      const next = moveActivityOrder(tripState, coCreateDayView, activityId, direction);
      setTripState(next);
      if (next.changeNote) {
        setRecentChangeNotice(next.changeNote);
      }
    },
    [tripState, coCreateDayView]
  );

  const handleSendMessage = React.useCallback((content: string) => {
    setTripState((prev) => {
      const withUser = addTranscriptMessage(prev, 'user', content, 'Định hướng vừa gửi');
      const withAi = addTranscriptMessage(
        withUser,
        'ai',
        `Đã ghi nhận yêu cầu: "${content}". Bạn có thể đổi thứ tự, chọn "Giữ lại", "Đổi gợi ý" hoặc chuyển ưu tiên "Ít di chuyển" trên bảng kế hoạch bên phải.`,
        'Phản hồi'
      );
      return withAi;
    });
    setRecentChangeNotice(`Đã ghi nhận yêu cầu: "${content}". Hãy dùng các nút thao tác trên bảng kế hoạch để điều chỉnh.`);
  }, []);

  const allActivities = React.useMemo(() => tripState.days.flatMap((d) => d.activities), [tripState.days]);
  const selectedActivities = React.useMemo(() => allActivities.filter((a) => a.decisionStatus === 'selected'), [allActivities]);
  const selectedCount = selectedActivities.length;
  const flexibleCount = React.useMemo(
    () => allActivities.filter((a) => a.decisionStatus === 'proposed' || a.decisionStatus === 'swapped').length,
    [allActivities]
  );
  const needsReviewCount = React.useMemo(
    () => allActivities.filter((a) => a.reviewFlag === 'needs_review' && a.decisionStatus !== 'skipped').length,
    [allActivities]
  );

  return (
    <div className={`w-full ${styles.landingRoot}`}>
      {/* SECTION 1: HERO (#y-tuong) */}
      <LandingHero />

      {/* SECTION 1.5: TỔNG QUAN (#tong-quan) (V4-003A & V4-003B) */}
      <OverviewSection />

      {/* SECTION 2: KHÁM PHÁ & BẢN NHÁP (#kham-pha) (V4-004A, V4-005A, V4-005B) */}
      <ExploreSection />

      {/* SECTION 3: CÙNG XÂY (#cung-xay) */}
      <CoCreateSection
        tripState={tripState}
        recentChangeNotice={recentChangeNotice}
        coCreateDayView={coCreateDayView}
        onTogglePreference={handleTogglePreference}
        onKeepActivity={handleKeepActivity}
        onSwapActivity={handleSwapActivity}
        onSkipActivity={handleSkipActivity}
        onRestoreDisplacedActivity={handleRestoreDisplacedActivity}
        onSetCoCreateDayView={setCoCreateDayView}
        onMoveActivity={handleMoveActivity}
        onSendMessage={handleSendMessage}
      />

      {/* SECTION 4: XÁC NHẬN (#xac-nhan) */}
      <ConfirmSection
        tripState={tripState}
        selectedCount={selectedCount}
        flexibleCount={flexibleCount}
        needsReviewCount={needsReviewCount}
        selectedActivities={selectedActivities}
        activeReasonPickerId={activeReasonPickerId}
        confirmFeedback={confirmFeedback}
        onStartEditing={handleStartEditing}
        onToggleReasonPicker={(id: string) => setActiveReasonPickerId((prev) => (prev === id ? null : id))}
        onCloseReasonPicker={() => setActiveReasonPickerId(null)}
        onRequestAlternativeWithReason={handleRequestAlternativeWithReason}
        onConfirmPlan={handleConfirmPlan}
        onKeepActivity={handleKeepActivity}
        filterView={confirmFilterView}
        onFilterViewChange={setConfirmFilterView}
        selectedDay={confirmSelectedDay}
        onSelectDay={setConfirmSelectedDay}
      />

      {/* SECTION 5: FINAL VALUE (#trai-nghiem) */}
      <FinalValueSection tripState={tripState} />

      {/* INDEPENDENT CALL-TO-ACTION SECTION (#bat-dau) */}
      <section
        id="bat-dau"
        className="w-full py-20 bg-transparent border-t border-[#0E1D4F]/10 relative overflow-hidden"
        aria-label="Khởi tạo ý tưởng chuyến đi"
      >
        <div className="max-w-4xl mx-auto px-6 text-center flex flex-col items-center gap-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#08B3C6]/15 border border-[#08B3C6]/30 text-xs font-bold text-[#088D9C] uppercase tracking-wider">
            <Icon name="sparkles" className="size-3.5" />
            <span>Hành trình trong tầm tay</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-extrabold text-[#0E1D4F] tracking-tight leading-tight">
            Sẵn sàng biến ý tưởng thành hành trình thực tế?
          </h2>

          <p className="text-base text-[#4B5875] max-w-2xl leading-relaxed">
            Chỉ cần vài bức ảnh cảm hứng hoặc những dòng ghi chú nhỏ, VISTRA sẽ giúp bạn gom cụm, tinh chỉnh và phác thảo lộ trình riêng biệt.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/create-trip"
              className="px-8 py-4 bg-[#205BD6] hover:bg-[#0739A8] text-white text-base font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2.5"
            >
              <span>Bắt đầu ý tưởng chuyến đi</span>
              <Icon name="arrow_forward" className="size-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
