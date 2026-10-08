'use client';

import React from 'react';
import CoCreateChatPanel from '../co-create/CoCreateChatPanel';
import CoCreatePlanEditor from '../co-create/CoCreatePlanEditor';
import { type LandingTripState } from '../landingDemo';
import VistraMap, { MapMarker } from '@/components/shared/VistraMap';
import Icon from '@/components/ui/Icon';

import { appConfig } from '@/config/appConfig';

export interface CoCreateSectionProps {
  tripState: LandingTripState;
  recentChangeNotice?: string | null;
  onTogglePreference: (pref: 'default' | 'less_travel') => void;
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

  // LPF-05: Dynamically derive map markers and route from active draft plan state
  const coCreateMarkers = React.useMemo<MapMarker[]>(() => {
    const isLessTravel = tripState.preference === 'less_travel';
    if (isLessTravel) {
      return [
        {
          id: 'cc-1',
          name: 'Vườn ven hồ Tuyền Lâm',
          title: 'Vườn ven hồ Tuyền Lâm',
          lat: 11.9034,
          lng: 108.435,
          order: 1,
          kind: 'scenic',
          category: 'Cảnh quan',
        },
        {
          id: 'cc-2',
          name: 'Quán trà & cà phê góc phố',
          title: 'Quán trà & cà phê góc phố',
          lat: 11.9404,
          lng: 108.438,
          order: 2,
          kind: 'dining',
          category: 'Ẩm thực',
        },
        {
          id: 'cc-3',
          name: 'Nhà gỗ bên sườn đồi (Gần hơn)',
          title: 'Nhà gỗ bên sườn đồi (Gần hơn)',
          lat: 11.915,
          lng: 108.442,
          order: 3,
          kind: 'stay',
          category: 'Nghỉ dưỡng',
        },
      ];
    }
    return [
      {
        id: 'cc-1',
        name: 'Vườn ven hồ Tuyền Lâm',
        title: 'Vườn ven hồ Tuyền Lâm',
        lat: 11.9034,
        lng: 108.435,
        order: 1,
        kind: 'scenic',
        category: 'Cảnh quan',
      },
      {
        id: 'cc-2',
        name: 'Quán trà & cà phê góc phố',
        title: 'Quán trà & cà phê góc phố',
        lat: 11.9404,
        lng: 108.438,
        order: 2,
        kind: 'dining',
        category: 'Ẩm thực',
      },
      {
        id: 'cc-4',
        name: 'Điểm ngắm hoàng hôn đồi xa (+15km)',
        title: 'Điểm ngắm hoàng hôn đồi xa (+15km)',
        lat: 11.985,
        lng: 108.48,
        order: 3,
        kind: 'scenic',
        category: 'Cảnh quan',
      },
    ];
  }, [tripState.preference]);

  const coCreateRoute = React.useMemo<[number, number][]>(() => {
    return coCreateMarkers.map((m) => [m.lng, m.lat] as [number, number]);
  }, [coCreateMarkers]);

  return (
    <section
      id="cung-xay"
      className="w-full pt-4 pb-12 relative scroll-mt-24"
      aria-label="Cùng xây: Lắng nghe và định hình"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#205BD6]/10 text-[#205BD6] font-label-caps text-xs font-bold uppercase tracking-wider mb-2">
            <span>ĐỒNG SÁNG TẠO</span>
          </div>
          <h2 className="font-headline-lg text-xl sm:text-3xl lg:text-4xl text-[#0E1D4F] font-bold leading-normal tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-full" title="Lắng nghe và định hình">
            Lắng nghe và định hình
          </h2>
          <p className="mt-2 text-xs sm:text-base text-[#4B5875] leading-relaxed">
            Chỉ một chia sẻ nhỏ, hành trình lập tức đổi nhịp — êm ả hơn, vừa vặn hơn.
          </p>
        </div>

        {/* LPUI-08: 3-Column Desktop Layout (Chat 4 cols, Draft 4 cols, Route Map 4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start mt-6">
          {/* Column 1: Dialogue (4 cols on desktop) */}
          <div className="col-span-12 lg:col-span-4 h-full">
            <CoCreateChatPanel
              preference={tripState.preference}
              loopStep={loopStep}
              onTogglePreference={onTogglePreference}
              recentChangeNotice={recentChangeNotice}
            />
          </div>

          {/* Column 2: Plan Editor (4 cols on desktop) */}
          <div className="col-span-12 lg:col-span-4 h-full">
            <CoCreatePlanEditor
              preference={tripState.preference}
              onTogglePreference={onTogglePreference}
            />
          </div>

          {/* Column 3: Interactive Route Map (4 cols on desktop, hidden on small mobile to avoid overload) */}
          <div className="hidden lg:flex lg:col-span-4 h-full flex-col bg-white/90 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 overflow-hidden shadow-xs min-h-[480px]">
            <div className="p-3.5 bg-white/95 border-b border-[#0E1D4F]/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#205BD6]/10 text-[#205BD6] flex items-center justify-center">
                  <Icon name="navigation" className="size-3.5" />
                </div>
                <div>
                  <h4 className="font-headline-sm text-xs font-bold text-[#0E1D4F]">
                    Bản đồ lộ trình tự thích ứng
                  </h4>
                  <p className="text-[10px] text-[#4B5875]">Đồng bộ theo thay đổi hội thoại</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#08B3C6] bg-[#08B3C6]/10 px-2 py-0.5 rounded-full">
                {tripState.preference === 'less_travel' ? 'Ít di chuyển (-40p)' : 'Nguyên bản'}
              </span>
            </div>

            <div className="flex-1 w-full relative min-h-[360px]">
              <VistraMap
                markers={coCreateMarkers}
                route={coCreateRoute}
                center={{ lat: 11.93, lng: 108.445 }}
                zoom={12}
                interactive={true}
                className="w-full h-full"
              />
            </div>

            <div className="p-3 bg-white/95 border-t border-[#0E1D4F]/10 flex items-center justify-between text-[11px] text-[#4B5875]">
              <span className="flex items-center gap-1.5 font-medium text-[#0E1D4F]">
                <Icon name="check_circle" className="size-3.5 text-emerald-600" />
                <span>3 chặng kết nối liền mạch</span>
              </span>
              <span className="text-[#205BD6] font-semibold text-[10px]">Tối ưu vi khí hậu</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
