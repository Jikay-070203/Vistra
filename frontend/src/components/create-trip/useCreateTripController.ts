'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDemoPlan } from '@/context/DemoPlanContext';
import { MoodPhoto, PaceType } from './types';

const INITIAL_PHOTOS: MoodPhoto[] = [
  {
    id: 'p1',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPN5yjZ4_2ddr4jbSd40ZJyTlXybQh97VY5fXwC9yQZpYjZ2_OlrtKKKKlSTVAs8kGb29CSu_0FD9TT3XtpN8DS3eOGJIEc8Hfolwsv9NJNBg-fzNCTXMRC6XepNBLp8jiMOgU_B9pbUx7sdT2Zxbt-kZIfGDM3xsW5DCkglFVtg0GHPtF1vDWrjiK2F08F5ALXUGVOKJcyVXvEG2YRY9IIwmeU5ynP7wjBVOShMLL7u70IDnT5eozVw',
    caption: 'Biển mây thung lũng Mường Hoa lúc bình minh',
    tags: ['Thanh bình', 'Sương mù', 'Núi non'],
  },
  {
    id: 'p2',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBId3SEsE_eVNlUFOMkPBrr_5xjm109Sz2r1nwrXTj0qPo7JBw9hsO6oDiqXIu6jUtUaQNQJBK6SfYQa7VM1sHJrRP-o1vM3Ud7XiDtuXAgiwaroG9tY39vYc0qYLfHE3bvMCsfBj-XqjjUiDC2-Eh7BTFWd8wxt0OI-tbivDsgE9eCjh6vZpCKblKWVXoBt2LBNwLdwXHYYlRfnDcqqttso7lj42EIWC0lCGkLtkhsErLA-RIr5YyqBg',
    caption: 'Ban công ngắm cảnh phong cách Indochine hoài niệm',
    tags: ['Cổ điển', 'Ban công ngắm cảnh'],
  },
  {
    id: 'p3',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDw7fycPldv6zjzmXnR_P-Y6m8EPzMPk_w_W3ElQp0yObpBAqZmYUSgldO_JtqNPNIfrrxPfpa0IYxfQi1MVIZjAkWdGBmlCE3WctbelvGM3saJCy0FjGtLpqxIKt2nk6UzAsSLPAmMuC_HuRkBHN_38GunDsJIAisl-Oy5w5mOYZuVJSWG5BjUnXlJ2fb8gjP0-poQNhrZvKMpWCivd2QzVcz01RDCVs2S-qKDufkPlLRQiM7Vmlte-Q',
    caption: 'Lối mòn lát đá và xưởng dệt lanh thủ công bản làng',
    tags: ['Bản làng', 'Lối đi thuận tiện'],
  },
];

export function useCreateTripController() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumePlanId = searchParams.get('resumePlanId');
  const { createDraftFromInput, getPlanById, setActivePlanId } = useDemoPlan();

  const existingPlan = resumePlanId ? getPlanById(resumePlanId) : undefined;

  const [photos, setPhotos] = useState<MoodPhoto[]>(INITIAL_PHOTOS);

  const [narrative, setNarrative] = useState(
    'Tôi muốn một nơi giống như những bức ảnh này. Núi non yên tĩnh, thời tiết mát mẻ, chụp ảnh đẹp, khoảng 4 ngày, không quá đông đúc. Ưu tiên đồ ăn địa phương chuẩn vị và những điểm ngắm cảnh tĩnh lặng hơn là các điểm du lịch thương mại.'
  );

  const [pace, setPace] = useState<PaceType>('Thư thái');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Structured form parameters (UX-10 / F05)
  const [startCity, setStartCity] = useState('Hà Nội, Việt Nam');
  const [startDate, setStartDate] = useState('2026-11-18');
  const [endDate, setEndDate] = useState('2026-11-21');
  const [budgetMin, setBudgetMin] = useState('10.000.000');
  const [budgetMax, setBudgetMax] = useState('15.000.000');
  const [adultsCount, setAdultsCount] = useState(2);
  const [elderlyCount, setElderlyCount] = useState(0);
  const [childrenCount, setChildrenCount] = useState(0);
  const [dietaryNote, setDietaryNote] = useState('Ưu tiên ẩm thực bản địa, hạn chế món cay');
  const [mobilityNote, setMobilityNote] = useState('Thể lực tốt, ưu tiên lối đi dạo bậc đá nhẹ nhàng');

  // Compute combined strings for backward compatibility
  const computedDates = `${startDate.slice(8, 10)}–${endDate.slice(8, 10)} Th${startDate.slice(5, 7)}`;
  const computedDuration = '4 ngày / 3 đêm';
  const computedTravelers = `${adultsCount} Người lớn${elderlyCount > 0 ? `, ${elderlyCount} Người cao tuổi` : ''}${childrenCount > 0 ? `, ${childrenCount} Trẻ em` : ''}`;
  const computedBudget = `${budgetMin} – ${budgetMax} VND`;

  const handleAddPhoto = () => {
    const newPhoto: MoodPhoto = {
      id: `p-${Date.now()}`,
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCCq4LoWJv6LIWDiWBi2YoJT_8MBz1oXRtey5TupfI-I_ITtEG3JQaokAyT-ADtXxZyF6xQXMvJEKQqHbYe5Dl4ST0AbMIel6Fwv9j8RmUyJ1t2FjrTVEz-7WLFEEEESRTawdQufbO3E9D6-3rWDTKxW_GlTsYkcVL6Z8MlzYe3wpBoAty1Dn2dp92he6lD5rA6IT2x53nhiTIcBZ31Mu5E48oUyrWIM8nVwicxAykmhYIRotTl-as8w',
      caption: 'Guồng nước mộc bên dòng suối bản Cát Cát',
      tags: ['Thiên nhiên', 'Dòng suối', 'Bản địa'],
    };
    setPhotos([...photos, newPhoto]);
    setToastMessage('Đã thêm 1 ảnh cảm hứng vào Moodboard.');
  };

  const handleRemovePhoto = (id: string) => {
    if (photos.length <= 1) {
      setToastMessage('Cần giữ ít nhất 1 ảnh cảm hứng để AI phân tích.');
      return;
    }
    setPhotos(photos.filter((p) => p.id !== id));
    setToastMessage('Đã gỡ ảnh khỏi Moodboard.');
  };

  // Primary Action: Create draft or resume existing draft and navigate to active planner workspace
  const handleStartPlanning = () => {
    if (existingPlan) {
      // Resume selected draft: set as active and navigate without creating a duplicate
      setActivePlanId(existingPlan.id);
      router.push('/planner');
    } else {
      const fullNarrative = `${narrative}\n[Ràng buộc bổ sung: ${computedTravelers} · Chế độ ăn: ${dietaryNote} · Thể lực: ${mobilityNote} · Phong cách: ${pace}]`;
      createDraftFromInput({
        origin: startCity,
        dates: computedDates,
        duration: computedDuration,
        travelers: computedTravelers,
        budget: computedBudget,
        narrative: fullNarrative,
        selectedDestination: 'Sa Pa, Lào Cai',
      });
      router.push('/planner');
    }
  };

  return {
    existingPlan,
    photos,
    narrative,
    setNarrative,
    pace,
    setPace,
    toastMessage,
    setToastMessage,
    startCity,
    setStartCity,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    budgetMin,
    setBudgetMin,
    budgetMax,
    setBudgetMax,
    adultsCount,
    setAdultsCount,
    elderlyCount,
    setElderlyCount,
    childrenCount,
    setChildrenCount,
    dietaryNote,
    setDietaryNote,
    mobilityNote,
    setMobilityNote,
    dates: computedDates,
    duration: computedDuration,
    travelers: computedTravelers,
    budget: computedBudget,
    handleAddPhoto,
    handleRemovePhoto,
    handleStartPlanning,
  };
}
