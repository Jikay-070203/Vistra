'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { DayItinerary, MOCK_PLANNER_DAYS } from '@/data/mockData';
import { getNowFormattedVN, formatDateTimeVN } from '@/lib/dateUtils';

export interface ChatSource {
  id: string;
  title: string;
  authorOrDomain: string;
  snippet: string;
  type: 'local_guide' | 'weather_station' | 'community_tip' | 'dossier';
  url?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sources?: ChatSource[];
  affectedChange?: string;
}

export interface DemoPlan {
  id: string;
  conversationId: string;
  title: string;
  destination: string;
  origin: string; // Starting point
  duration: string;
  dates: string;
  travelers: string;
  budget: string;
  coverImage: string;
  lastUpdated: string;
  status: 'draft' | 'confirmed';
  isPublished: boolean;
  publishedAt?: string;
  authorName?: string;
  authorAvatar?: string;
  likesCount?: number;
  tags: string[];
  days: DayItinerary[];
  chatMessages: ChatMessage[];
  sources: ChatSource[];
  provinces: string[];
  createdAt?: string;
  confirmedAt?: string;
}

interface DemoPlanContextType {
  plans: DemoPlan[];
  activePlanId: string;
  isLoaded: boolean;
  setActivePlanId: (id: string) => void;
  getActivePlan: () => DemoPlan;
  getPlanById: (id: string) => DemoPlan | undefined;
  addChatMessage: (planId: string, userText: string) => void;
  confirmPlan: (planId: string) => void;
  publishPlan: (planId: string) => void;
  unpublishPlan: (planId: string) => void;
  createDraftFromInput: (input: {
    origin: string;
    dates: string;
    duration: string;
    travelers: string;
    budget: string;
    narrative: string;
    selectedDestination?: string;
    clonedDays?: DayItinerary[];
    clonedSources?: ChatSource[];
    coverImage?: string;
  }) => string;
}

// Initial rich fixture dataset supporting 4x4 pagination for /my-trips (>= 17 items)
// and 4x6 grid for /community (>= 24 items)
const INITIAL_SOURCES: ChatSource[] = [
  {
    id: 'src-1',
    title: 'Bản đồ vi khí hậu Đèo Ô Quy Hồ & Nghịch nhiệt thu đông',
    authorOrDomain: 'Trạm khí tượng Hoàng Liên Sơn (Reality Agent)',
    snippet: 'Sương sớm nghịch nhiệt tạo biển mây đậm đặc nhất từ 05:30 đến 07:15. Sau 08:30 gió thung lũng thổi tan sương.',
    type: 'weather_station',
  },
  {
    id: 'src-2',
    title: 'Ghi chép thủ công: Xưởng dệt lanh tự nhiên Tả Van',
    authorOrDomain: 'Nghệ nhân Giàng Thị Mẩy (Local Archive)',
    snippet: 'Kỹ thuật vẽ sáp ong truyền thống trên nền vải chàm dệt tay. Cần đặt trước để chuẩn bị sáp ong rừng ấm nóng.',
    type: 'local_guide',
  },
  {
    id: 'src-3',
    title: 'Cẩm nang tránh đông du lịch bản địa Tây Bắc',
    authorOrDomain: 'Cộng đồng Vistra Atelier Contributor',
    snippet: 'Khu vực thung lũng Mường Hoa vắng người nhất trước 10:00 sáng. Nên di chuyển bằng lối mòn lát đá men suối.',
    type: 'community_tip',
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'user',
    text: 'Tôi muốn chuyến đi Sa Pa 4 ngày thật êm đềm, ngắm biển mây lúc sáng sớm và thăm làng nghề truyền thống mà không bị xô bồ thương mại.',
    timestamp: '14:20',
  },
  {
    id: 'msg-2',
    sender: 'assistant',
    text: 'Chào bạn, Vistra đã đối chiếu vi khí hậu tháng 11: Đèo Ô Quy Hồ có xác suất mây 96% lúc 05:30. Tôi đã bố trí ngày 2 săn mây sớm, sau đó xuôi về Tả Van ăn phở nghệ nhân bên suối và vẽ sáp ong cùng nghệ nhân Giàng Thị Mẩy.',
    timestamp: '14:21',
    sources: [INITIAL_SOURCES[0], INITIAL_SOURCES[1]],
    affectedChange: 'Khởi tạo khung lịch trình 4 ngày 3 đêm tập trung tại Thung lũng Mường Hoa',
  },
];

const BASE_DAYS = MOCK_PLANNER_DAYS;

export const DALAT_SOURCES: ChatSource[] = [
  {
    id: 'src-dl-1',
    title: 'Bản đồ vi khí hậu Đồi chè Cầu Đất & Cao nguyên Lâm Viên',
    authorOrDomain: 'Trạm khí tượng Đà Lạt (Reality Agent)',
    snippet: 'Sương sớm cao nguyên tạo biển mây đẹp nhất từ 05:45 đến 07:00 tại độ cao 1.650m. Gió lộng dịu mát, nắng ấm sau 08:00.',
    type: 'weather_station',
  },
  {
    id: 'src-dl-2',
    title: 'Ghi chép di sản: Quần thể Biệt thự Pháp cổ Ana Mandara',
    authorOrDomain: 'Viện Nghiên cứu Kiến trúc Cổ Đà Lạt (Local Archive)',
    snippet: 'Bộ sưu tập 17 biệt thự kiến trúc Đông Dương xây dựng từ những năm 1920–1930 được bảo tồn nguyên bản giữa rừng thông cổ thụ.',
    type: 'dossier',
  },
  {
    id: 'src-dl-3',
    title: 'Cẩm nang văn hóa cà phê & ẩm thực đêm Đà Lạt',
    authorOrDomain: 'Cộng đồng Vistra Curator',
    snippet: 'Khu vực Tùng Cà phê giữ trọn phong vị hoài niệm. Quán lẩu gà lá é và bánh mì xíu mại nên thưởng thức khi trời chuyển lạnh sau 17:30.',
    type: 'community_tip',
  },
];

export const DALAT_DAYS: DayItinerary[] = [
  {
    dayNumber: 1,
    dayOfWeek: 'Thứ Sáu',
    date: '28 Th10',
    title: 'Đón ngõ thông reo & Biệt thự Pháp cổ',
    pace: 'Thư thái',
    highlight: 'Nhận phòng Ana Mandara Villas & Cà phê Tùng hoài niệm',
    weather: 'Đà Lạt 16°C · Trời trong lành, se lạnh về chiều tối',
    activities: [
      {
        id: 'dl-d1-a1',
        timeStart: '09:00',
        timeEnd: '11:30',
        title: 'Di chuyển từ Sân bay Liên Khương về Trung tâm Đà Lạt',
        category: 'Di chuyển',
        description: 'Xe trung chuyển đón tại sảnh đến, chạy dọc cao tốc Prenn ngắm nhìn những đồi thông xanh ngắt trải dài uốn lượn.',
        location: 'Sân bay Liên Khương → Trung tâm Đà Lạt (30 km)',
        tags: ['Xe đón riêng', 'Ngắm đèo Prenn'],
        isLocked: true,
        coordinates: { lat: 11.7516, lng: 108.3735 },
      },
      {
        isTransit: true,
        transit: {
          duration: '15 phút',
          type: 'Ô tô',
          distance: '2.0 km',
          description: 'Về khu nghỉ dưỡng Ana Mandara Villas nhận phòng',
        },
      },
      {
        id: 'dl-d1-a2',
        timeStart: '12:00',
        timeEnd: '14:00',
        title: 'Bữa trưa ẩm thực địa phương & Thưởng trà Atiso',
        category: 'Ẩm thực',
        description: 'Thưởng thức cơm niêu và canh bông Atiso hầm sườn heo thanh mát, đặc sản bồi bổ khí huyết vùng ôn đới.',
        location: 'Nhà hàng Le Petit, Lê Lai, Đà Lạt',
        tags: ['Đặc sản Đà Lạt', 'Canh Atiso'],
        coordinates: { lat: 11.9392, lng: 108.4285 },
      },
      {
        id: 'dl-d1-a3',
        timeStart: '15:30',
        timeEnd: '17:30',
        title: 'Dạo bộ quanh Hồ Xuân Hương & Nhâm nhi cà phê Tùng cổ kính',
        category: 'Văn hóa & Cà phê',
        description: 'Tản bộ ven hồ đón làn gió se lạnh, ghé quán Cà phê Tùng thưởng thức ly cà phê phin đậm đà trong điệu nhạc Trịnh hoài niệm.',
        location: 'Khu Hòa Bình, Phường 1, Đà Lạt',
        tags: ['Cà phê phố cổ', 'Dạo ven hồ'],
        coordinates: { lat: 11.9424, lng: 108.4377 },
      },
    ],
  },
  {
    dayNumber: 2,
    dayOfWeek: 'Thứ Bảy',
    date: '29 Th10',
    title: 'Sương sớm Đồi chè & Dấu ấn Di sản',
    pace: 'Cân bằng',
    highlight: 'Săn mây bình minh Đồi chè Cầu Đất & Ga xe lửa cổ',
    weather: 'Đà Lạt 14°C · Sương sớm bồng bềnh, nắng vàng từ 07:30',
    activities: [
      {
        id: 'dl-d2-a1',
        timeStart: '05:30',
        timeEnd: '07:30',
        title: 'Săn mây bình minh tại Đồi chè Cầu Đất & Tuabin gió',
        category: 'Cảnh quan & Nhiếp ảnh',
        description: 'Đón bình minh rực rỡ trên thảm chè xanh ngát lấp lánh sương mai, ngắm nhìn thung lũng mây trôi bềnh bồng quanh tuabin gió.',
        location: 'Đồi chè Cầu Đất, Trạm Hành, Đà Lạt',
        tags: ['Săn mây bình minh', 'Đồi chè 100 tuổi'],
        isLocked: true,
        coordinates: { lat: 11.8587, lng: 108.5375 },
      },
      {
        isTransit: true,
        transit: {
          duration: '30 phút',
          type: 'Ô tô',
          distance: '18 km',
          description: 'Trở về trung tâm Đà Lạt dùng điểm tâm',
        },
      },
      {
        id: 'dl-d2-a2',
        timeStart: '08:30',
        timeEnd: '10:00',
        title: 'Điểm tâm bánh mì xíu mại Hoàng Diệu nóng hổi',
        category: 'Ẩm thực',
        description: 'Thưởng thức chén xíu mại thơm phức cay ấm cùng bánh mì giòn rụm và ly sữa đậu nành nóng giữa tiết trời sớm mai se lạnh.',
        location: '26 Hoàng Diệu, Đà Lạt',
        tags: ['Điểm tâm bản địa', 'Sữa đậu nành nóng'],
        coordinates: { lat: 11.9442, lng: 108.4321 },
      },
      {
        id: 'dl-d2-a3',
        timeStart: '10:30',
        timeEnd: '12:30',
        title: 'Khám phá Ga Đà Lạt & Dinh Bảo Đại I trong rừng thông',
        category: 'Di sản & Kiến trúc',
        description: 'Chiêm ngưỡng kiến trúc Art Deco độc đáo mô phỏng đỉnh núi Lang Biang tại nhà ga cổ nhất Đông Dương và thăm Dinh I tráng lệ.',
        location: 'Đường Quang Trung & Trần Quang Diệu, Đà Lạt',
        tags: ['Kiến trúc Pháp cổ', 'Đầu máy hơi nước'],
        coordinates: { lat: 11.9416, lng: 108.4552 },
      },
    ],
  },
  {
    dayNumber: 3,
    dayOfWeek: 'Chủ Nhật',
    date: '30 Th10',
    title: 'Hồ Tuyền Lâm & Bình yên rừng thiền',
    pace: 'Thư thái',
    highlight: 'Chèo SUP đón sương Hồ Tuyền Lâm & Thiền Viện Trúc Lâm',
    weather: 'Đà Lạt 15°C · Nắng nhẹ xuyên đồi thông',
    activities: [
      {
        id: 'dl-d3-a1',
        timeStart: '06:30',
        timeEnd: '09:00',
        title: 'Chèo SUP lướt sương mai trên mặt nước Hồ Tuyền Lâm',
        category: 'Trải nghiệm thiên nhiên',
        description: 'Cảm nhận sự tĩnh lặng tuyệt đối khi mặt hồ phủ sương khói mờ ảo, chèo thuyền giữa làn nước xanh ngọc bích ven rừng thông râm mát.',
        location: 'Khu du lịch Hồ Tuyền Lâm, Đà Lạt',
        tags: ['Chèo SUP', 'Mặt hồ tĩnh mịch'],
        coordinates: { lat: 11.8906, lng: 108.4372 },
      },
      {
        id: 'dl-d3-a2',
        timeStart: '10:00',
        timeEnd: '12:00',
        title: 'Vãn cảnh Thiền Viện Trúc Lâm giữa rừng thông xanh ngút ngàn',
        category: 'Tâm linh & Thư giãn',
        description: 'Đi cáp treo ngắm toàn cảnh đồi thông, dạo bước trong khuôn viên thanh tịnh ngát hương hoa trà và ngắm nhìn hồ từ trên cao.',
        location: 'Đồi Phụng Hoàng, Đà Lạt',
        tags: ['Cáp treo', 'Vườn hoa thiền viện'],
        coordinates: { lat: 11.9038, lng: 108.4354 },
      },
      {
        id: 'dl-d3-a3',
        timeStart: '18:00',
        timeEnd: '20:30',
        title: 'Bữa tối Lẩu gà lá é Tao Ngộ cay nồng ấm cúng',
        category: 'Ẩm thực',
        description: 'Nồi lẩu gà nghi ngút khói với vị chua thanh thơm đặc trưng của lá é, ớt xiêm xanh cay nồng xua tan cái lạnh đêm cao nguyên.',
        location: 'Số 5 đường 3 Tháng 4, Đà Lạt',
        tags: ['Lẩu gà lá é', 'Ấm áp đêm đông'],
        coordinates: { lat: 11.9298, lng: 108.4446 },
      },
    ],
  },
  {
    dayNumber: 4,
    dayOfWeek: 'Thứ Hai',
    date: '31 Th10',
    title: 'Cẩm tú cầu & Tạm biệt Cao nguyên',
    pace: 'Nhẹ nhàng',
    highlight: 'Khám phá cánh đồng hoa Cẩm Tú Cầu Trại Mát & Mua quà bản địa',
    weather: 'Đà Lạt 17°C · Nắng dịu mát mẻ',
    activities: [
      {
        id: 'dl-d4-a1',
        timeStart: '08:30',
        timeEnd: '10:30',
        title: 'Chụp ảnh tại Cánh đồng hoa Cẩm Tú Cầu Trại Mát',
        category: 'Cảnh quan',
        description: 'Dạo giữa thảm hoa tú cầu bạt ngàn muôn màu sắc nép mình bên sườn đồi bậc thang đặc trưng của vùng Trại Mát.',
        location: 'Tổ 1, Thôn Lộc Quý, Trại Mát, Đà Lạt',
        tags: ['Hoa cẩm tú cầu', 'Nhiếp ảnh lưu niệm'],
        coordinates: { lat: 11.9378, lng: 108.5086 },
      },
      {
        id: 'dl-d4-a2',
        timeStart: '11:00',
        timeEnd: '12:30',
        title: 'Chọn quà đặc sản dâu tây tươi & Mứt hoa quả Chợ Đà Lạt',
        category: 'Mua sắm bản địa',
        description: 'Ghé các sạp hàng uy tín chọn dâu tây New Zealand hái tươi tại vườn, trà oolong hương hoa sói và mứt hồng sấy dẻo truyền thống.',
        location: 'Chợ Đà Lạt, Đường Nguyễn Thị Minh Khai',
        tags: ['Dâu tây tươi', 'Đặc sản làm quà'],
        coordinates: { lat: 11.9424, lng: 108.4377 },
      },
    ],
  },
];

const RAW_INITIAL_PLANS = [
  {
    id: 'sapa-cloud-hunt',
    conversationId: 'conv-sapa-01',
    title: 'Sa Pa Mùa Mây & Làng Nghề Bản Địa',
    destination: 'Sa Pa, Lào Cai',
    origin: 'Hà Nội, Việt Nam',
    duration: '4 ngày / 3 đêm',
    dates: '18–21 Th11 (Cuối thu)',
    travelers: '2 Người lớn',
    budget: '14.250.000 VND',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPN5yjZ4_2ddr4jbSd40ZJyTlXybQh97VY5fXwC9yQZpYjZ2_OlrtKKKKlSTVAs8kGb29CSu_0FD9TT3XtpN8DS3eOGJIEc8Hfolwsv9NJNBg-fzNCTXMRC6XepNBLp8jiMOgU_B9pbUx7sdT2Zxbt-kZIfGDM3xsW5DCkglFVtg0GHPtF1vDWrjiK2F08F5ALXUGVOKJcyVXvEG2YRY9IIwmeU5ynP7wjBVOShMLL7u70IDnT5eozVw',
    lastUpdated: '30/09/2026 14:22',
    status: 'draft',
    isPublished: false,
    tags: ['Núi non', 'Săn mây', 'Nghỉ dưỡng', 'Bản làng'],
    days: BASE_DAYS,
    chatMessages: INITIAL_MESSAGES,
    sources: INITIAL_SOURCES,
  },
  {
    id: 'moc-chau-autumn',
    conversationId: 'conv-mocchau-02',
    title: 'Cao nguyên Mộc Châu Mùa Cải Trắng & Đồi Chè',
    destination: 'Mộc Châu, Sơn La',
    origin: 'Hà Nội, Việt Nam',
    duration: '3 ngày / 2 đêm',
    dates: '05–07 Th12',
    travelers: '4 Người lớn',
    budget: '10.400.000 VND',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDw7fycPldv6zjzmXnR_P-Y6m8EPzMPk_w_W3ElQp0yObpBAqZmYUSgldO_JtqNPNIfrrxPfpa0IYxfQi1MVIZjAkWdGBmlCE3WctbelvGM3saJCy0FjGtLpqxIKt2nk6UzAsSLPAmMuC_HuRkBHN_38GunDsJIAisl-Oy5w5mOYZuVJSWG5BjUnXlJ2fb8gjP0-poQNhrZvKMpWCivd2QzVcz01RDCVs2S-qKDufkPlLRQiM7Vmlte-Q',
    lastUpdated: '28/09/2026 18:40',
    status: 'draft',
    isPublished: false,
    tags: ['Hoa cải', 'Thung lũng', 'Cắm trại', 'Đồi chè'],
    days: BASE_DAYS,
    chatMessages: [
      {
        id: 'msg-mc-1',
        sender: 'user',
        text: 'Chúng tôi muốn cắm trại tại Pa Phách và chụp ảnh sương sớm đồi chè trái tim.',
        timestamp: '09:15',
      },
      {
        id: 'msg-mc-2',
        sender: 'assistant',
        text: 'Vistra đề xuất dựng lều tại thung lũng mận Nà Ka tránh gió lộng mùa đông, và ghé bản Pa Phách vào 14:00 chiều khi nắng xuyên qua làn sương mỏng.',
        timestamp: '09:17',
      }
    ],
    sources: INITIAL_SOURCES,
  },
  {
    id: 'dalat-pine-hills',
    conversationId: 'conv-dalat-03',
    title: 'Đà Lạt Sương Mù & Di Sản Biệt Thự Pháp Cổ Điển',
    destination: 'Đà Lạt, Lâm Đồng',
    origin: 'TP. Hồ Chí Minh',
    duration: '4 ngày / 3 đêm',
    dates: '28–31 Th10',
    travelers: '2 Người lớn',
    budget: '13.800.000 VND',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBId3SEsE_eVNlUFOMkPBrr_5xjm109Sz2r1nwrXTj0qPo7JBw9hsO6oDiqXIu6jUtUaQNQJBK6SfYQa7VM1sHJrRP-o1vM3Ud7XiDtuXAgiwaroG9tY39vYc0qYLfHE3bvMCsfBj-XqjjUiDC2-Eh7BTFWd8wxt0OI-tbivDsgE9eCjh6vZpCKblKWVXoBt2LBNwLdwXHYYlRfnDcqqttso7lj42EIWC0lCGkLtkhsErLA-RIr5YyqBg',
    lastUpdated: '25/09/2026 11:20',
    status: 'confirmed',
    isPublished: true,
    publishedAt: '26/09/2026',
    authorName: 'An Bình & Gia Hưng',
    authorAvatar: 'AB',
    likesCount: 142,
    tags: ['Đồi thông', 'Ẩm thực', 'Cổ điển', 'Cà phê'],
    days: DALAT_DAYS,
    chatMessages: [
      {
        id: 'msg-dl-1',
        sender: 'assistant',
        text: 'Lịch trình đã được xác nhận hoàn tất. Ana Mandara Villas và vé bay khứ hồi VN128 đã đối chiếu xong.',
        timestamp: '11:20',
      }
    ],
    sources: DALAT_SOURCES,
  },
  {
    id: 'ninh-binh-heritage',
    conversationId: 'conv-nb-04',
    title: 'Tràng An Sơn Thủy & Cố Đô Hoa Lư Lịch Sử',
    destination: 'Ninh Bình',
    origin: 'Hà Nội, Việt Nam',
    duration: '2 ngày / 1 đêm',
    dates: '14–15 Th08',
    travelers: '2 Người lớn',
    budget: '7.600.000 VND',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDw7fycPldv6zjzmXnR_P-Y6m8EPzMPk_w_W3ElQp0yObpBAqZmYUSgldO_JtqNPNIfrrxPfpa0IYxfQi1MVIZjAkWdGBmlCE3WctbelvGM3saJCy0FjGtLpqxIKt2nk6UzAsSLPAmMuC_HuRkBHN_38GunDsJIAisl-Oy5w5mOYZuVJSWG5BjUnXlJ2fb8gjP0-poQNhrZvKMpWCivd2QzVcz01RDCVs2S-qKDufkPlLRQiM7Vmlte-Q',
    lastUpdated: '16/08/2026 16:30',
    status: 'confirmed',
    isPublished: true,
    publishedAt: '17/08/2026',
    authorName: 'Minh Trang',
    authorAvatar: 'MT',
    likesCount: 98,
    tags: ['Di sản', 'Chèo thuyền', 'Hang động', 'Sơn thủy'],
    days: BASE_DAYS,
    chatMessages: [],
    sources: INITIAL_SOURCES,
  },
  // Additional items 5 to 25 to fulfill 4x4 pagination in /my-trips and 4x6 (24 cards) in /community
  {
    id: 'ha-giang-loop',
    conversationId: 'conv-hg-05',
    title: 'Cao Nguyên Đá Đồng Văn & Hẻm Tu Sản Huyền Thoại',
    destination: 'Hà Giang',
    origin: 'Hà Nội, Việt Nam',
    duration: '4 ngày / 3 đêm',
    dates: '20–24 Th10',
    travelers: '2 Người lớn',
    budget: '12.500.000 VND',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIT1JIDghDUYdb71JnGDzytu8VwAQgW20eSCqJM7TZZWgcZw9K2T17R4v3V8juWKuK4XBIK8I1iqBrZYKCRhrQo1iuE1Vcl1rNVdy2cZ5xm2BkyRHFAbG73m4YtCjKhLQY1WzcHj9vWJx1RfilbVwByJH3DriFXb70dnOq3UTztLWy_OgE0R0sWEtv6usp5vAW-n3h_ork5EPutIJwK1ffapj9W1va7qgvoYtcIDMco8u3ED5GLekbTg',
    lastUpdated: '22/09/2026 09:10',
    status: 'confirmed',
    isPublished: true,
    publishedAt: '23/09/2026',
    authorName: 'Lê Hoàng',
    authorAvatar: 'LH',
    likesCount: 285,
    tags: ['Hẻm vực', 'Đèo Mã Pí Lèng', 'Sông Nho Quế'],
    days: BASE_DAYS,
    chatMessages: [],
    sources: INITIAL_SOURCES,
  },
  {
    id: 'phu-quoc-sunset',
    conversationId: 'conv-pq-06',
    title: 'Phú Quốc Hoàng Hôn Bãi Sao & Rạn San Hô An Thới',
    destination: 'Phú Quốc, Kiên Giang',
    origin: 'TP. Hồ Chí Minh',
    duration: '3 ngày / 2 đêm',
    dates: '10–12 Th11',
    travelers: '2 Người lớn',
    budget: '16.200.000 VND',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCCq4LoWJv6LIWDiWBi2YoJT_8MBz1oXRtey5TupfI-I_ITtEG3JQaokAyT-ADtXxZyF6xQXMvJEKQqHbYe5Dl4ST0AbMIel6Fwv9j8RmUyJ1t2FjrTVEz-7WLFEEEESRTawdQufbO3E9D6-3rWDTKxW_GlTsYkcVL6Z8MlzYe3wpBoAty1Dn2dp92he6lD5rA6IT2x53nhiTIcBZ31Mu5E48oUyrWIM8nVwicxAykmhYIRotTl-as8w',
    lastUpdated: '20/09/2026 15:45',
    status: 'confirmed',
    isPublished: true,
    publishedAt: '21/09/2026',
    authorName: 'Thanh Thảo',
    authorAvatar: 'TT',
    likesCount: 167,
    tags: ['Biển đảo', 'Lặn san hô', 'Hoàng hôn'],
    days: BASE_DAYS,
    chatMessages: [],
    sources: INITIAL_SOURCES,
  },
  {
    id: 'hoi-an-heritage',
    conversationId: 'conv-ha-07',
    title: 'Phố Cổ Hội An Đèn Lồng & Ký Ức Sông Hoài',
    destination: 'Hội An, Quảng Nam',
    origin: 'Đà Nẵng',
    duration: '3 ngày / 2 đêm',
    dates: '15–17 Th11',
    travelers: '2 Người lớn',
    budget: '8.900.000 VND',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBId3SEsE_eVNlUFOMkPBrr_5xjm109Sz2r1nwrXTj0qPo7JBw9hsO6oDiqXIu6jUtUaQNQJBK6SfYQa7VM1sHJrRP-o1vM3Ud7XiDtuXAgiwaroG9tY39vYc0qYLfHE3bvMCsfBj-XqjjUiDC2-Eh7BTFWd8wxt0OI-tbivDsgE9eCjh6vZpCKblKWVXoBt2LBNwLdwXHYYlRfnDcqqttso7lj42EIWC0lCGkLtkhsErLA-RIr5YyqBg',
    lastUpdated: '18/09/2026 17:00',
    status: 'confirmed',
    isPublished: true,
    publishedAt: '19/09/2026',
    authorName: 'Quốc Bảo',
    authorAvatar: 'QB',
    likesCount: 219,
    tags: ['Phố cổ', 'Ẩm thực', 'Chèo thuyền'],
    days: BASE_DAYS,
    chatMessages: [],
    sources: INITIAL_SOURCES,
  },
  {
    id: 'mu-cang-chai-rice',
    conversationId: 'conv-mcc-08',
    title: 'Mù Cang Chải Sóng Vàng Mâm Xôi & Khau Phạ',
    destination: 'Mù Cang Chải, Yên Bái',
    origin: 'Hà Nội, Việt Nam',
    duration: '3 ngày / 2 đêm',
    dates: '01–03 Th10',
    travelers: '2 Người lớn',
    budget: '9.200.000 VND',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDw7fycPldv6zjzmXnR_P-Y6m8EPzMPk_w_W3ElQp0yObpBAqZmYUSgldO_JtqNPNIfrrxPfpa0IYxfQi1MVIZjAkWdGBmlCE3WctbelvGM3saJCy0FjGtLpqxIKt2nk6UzAsSLPAmMuC_HuRkBHN_38GunDsJIAisl-Oy5w5mOYZuVJSWG5BjUnXlJ2fb8gjP0-poQNhrZvKMpWCivd2QzVcz01RDCVs2S-qKDufkPlLRQiM7Vmlte-Q',
    lastUpdated: '15/09/2026 10:15',
    status: 'confirmed',
    isPublished: true,
    publishedAt: '16/09/2026',
    authorName: 'Thu Hà',
    authorAvatar: 'TH',
    likesCount: 312,
    tags: ['Ruộng bậc thang', 'Mùa vàng', 'Đèo Khau Phạ'],
    days: BASE_DAYS,
    chatMessages: [],
    sources: INITIAL_SOURCES,
  },
  {
    id: 'hue-ancient-citadel',
    conversationId: 'conv-hue-09',
    title: 'Cố Đô Huế Lăng Tẩm Trầm Mặc & Nhã Nhạc Cung Đình',
    destination: 'Huế, Thừa Thiên Huế',
    origin: 'Hà Nội, Việt Nam',
    duration: '3 ngày / 2 đêm',
    dates: '22–24 Th11',
    travelers: '2 Người lớn',
    budget: '9.500.000 VND',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDw7fycPldv6zjzmXnR_P-Y6m8EPzMPk_w_W3ElQp0yObpBAqZmYUSgldO_JtqNPNIfrrxPfpa0IYxfQi1MVIZjAkWdGBmlCE3WctbelvGM3saJCy0FjGtLpqxIKt2nk6UzAsSLPAmMuC_HuRkBHN_38GunDsJIAisl-Oy5w5mOYZuVJSWG5BjUnXlJ2fb8gjP0-poQNhrZvKMpWCivd2QzVcz01RDCVs2S-qKDufkPlLRQiM7Vmlte-Q',
    lastUpdated: '12/09/2026 14:00',
    status: 'confirmed',
    isPublished: true,
    publishedAt: '14/09/2026',
    authorName: 'Huyền My',
    authorAvatar: 'HM',
    likesCount: 114,
    tags: ['Lịch sử', 'Sông Hương', 'Ẩm thực cung đình'],
    days: BASE_DAYS,
    chatMessages: [],
    sources: INITIAL_SOURCES,
  },
  {
    id: 'quy-nhon-coastal',
    conversationId: 'conv-qn-10',
    title: 'Quy Nhơn Eo Gió & Kỳ Co Nước Trong Vắt',
    destination: 'Quy Nhơn, Bình Định',
    origin: 'TP. Hồ Chí Minh',
    duration: '4 ngày / 3 đêm',
    dates: '12–15 Th10',
    travelers: '3 Người lớn',
    budget: '11.800.000 VND',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPN5yjZ4_2ddr4jbSd40ZJyTlXybQh97VY5fXwC9yQZpYjZ2_OlrtKKKKlSTVAs8kGb29CSu_0FD9TT3XtpN8DS3eOGJIEc8Hfolwsv9NJNBg-fzNCTXMRC6XepNBLp8jiMOgU_B9pbUx7sdT2Zxbt-kZIfGDM3xsW5DCkglFVtg0GHPtF1vDWrjiK2F08F5ALXUGVOKJcyVXvEG2YRY9IIwmeU5ynP7wjBVOShMLL7u70IDnT5eozVw',
    lastUpdated: '10/09/2026 16:20',
    status: 'confirmed',
    isPublished: true,
    publishedAt: '11/09/2026',
    authorName: 'Gia Bảo',
    authorAvatar: 'GB',
    likesCount: 178,
    tags: ['Eo Gió', 'Kỳ Co', 'Hải sản'],
    days: BASE_DAYS,
    chatMessages: [],
    sources: INITIAL_SOURCES,
  },
  {
    id: 'tam-dao-mist',
    conversationId: 'conv-td-11',
    title: 'Tam Đảo Sương Khói Nhà Thờ Đá & Quán Gió',
    destination: 'Tam Đảo, Vĩnh Phúc',
    origin: 'Hà Nội, Việt Nam',
    duration: '2 ngày / 1 đêm',
    dates: '16–17 Th11',
    travelers: '2 Người lớn',
    budget: '4.800.000 VND',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBId3SEsE_eVNlUFOMkPBrr_5xjm109Sz2r1nwrXTj0qPo7JBw9hsO6oDiqXIu6jUtUaQNQJBK6SfYQa7VM1sHJrRP-o1vM3Ud7XiDtuXAgiwaroG9tY39vYc0qYLfHE3bvMCsfBj-XqjjUiDC2-Eh7BTFWd8wxt0OI-tbivDsgE9eCjh6vZpCKblKWVXoBt2LBNwLdwXHYYlRfnDcqqttso7lj42EIWC0lCGkLtkhsErLA-RIr5YyqBg',
    lastUpdated: '08/09/2026 19:30',
    status: 'draft',
    isPublished: false,
    tags: ['Nghỉ dưỡng gần', 'Thung lũng sương', 'Cuối tuần'],
    days: BASE_DAYS,
    chatMessages: [],
    sources: INITIAL_SOURCES,
  },
  {
    id: 'ba-be-lake',
    conversationId: 'conv-bb-12',
    title: 'Hồ Ba Bể Nước Xanh Ngọc & Thác Bản Giốc Hùng Vĩ',
    destination: 'Bắc Kạn - Cao Bằng',
    origin: 'Hà Nội, Việt Nam',
    duration: '3 ngày / 2 đêm',
    dates: '25–27 Th11',
    travelers: '2 Người lớn',
    budget: '8.400.000 VND',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDw7fycPldv6zjzmXnR_P-Y6m8EPzMPk_w_W3ElQp0yObpBAqZmYUSgldO_JtqNPNIfrrxPfpa0IYxfQi1MVIZjAkWdGBmlCE3WctbelvGM3saJCy0FjGtLpqxIKt2nk6UzAsSLPAmMuC_HuRkBHN_38GunDsJIAisl-Oy5w5mOYZuVJSWG5BjUnXlJ2fb8gjP0-poQNhrZvKMpWCivd2QzVcz01RDCVs2S-qKDufkPlLRQiM7Vmlte-Q',
    lastUpdated: '05/09/2026 11:00',
    status: 'draft',
    isPublished: false,
    tags: ['Hồ trên núi', 'Thác Bản Giốc', 'Homestay Tày'],
    days: BASE_DAYS,
    chatMessages: [],
    sources: INITIAL_SOURCES,
  },
  {
    id: 'phong-nha-caves',
    conversationId: 'conv-pn-13',
    title: 'Phong Nha - Kẻ Bàng Thám Hiểm Hang Én & Động Thiên Đường',
    destination: 'Quảng Bình',
    origin: 'Đà Nẵng',
    duration: '3 ngày / 2 đêm',
    dates: '08–10 Th10',
    travelers: '2 Người lớn',
    budget: '14.500.000 VND',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIT1JIDghDUYdb71JnGDzytu8VwAQgW20eSCqJM7TZZWgcZw9K2T17R4v3V8juWKuK4XBIK8I1iqBrZYKCRhrQo1iuE1Vcl1rNVdy2cZ5xm2BkyRHFAbG73m4YtCjKhLQY1WzcHj9vWJx1RfilbVwByJH3DriFXb70dnOq3UTztLWy_OgE0R0sWEtv6usp5vAW-n3h_ork5EPutIJwK1ffapj9W1va7qgvoYtcIDMco8u3ED5GLekbTg',
    lastUpdated: '02/09/2026 12:45',
    status: 'confirmed',
    isPublished: true,
    publishedAt: '04/09/2026',
    authorName: 'Hải Đăng',
    authorAvatar: 'HD',
    likesCount: 240,
    tags: ['Hang động', 'Thám hiểm', 'Thiên nhiên hoang sơ'],
    days: BASE_DAYS,
    chatMessages: [],
    sources: INITIAL_SOURCES,
  },
  {
    id: 'can-tho-floating',
    conversationId: 'conv-ct-14',
    title: 'Miền Tây Sông Nước Chợ Nổi Cái Răng & Vườn Trái Cây',
    destination: 'Cần Thơ',
    origin: 'TP. Hồ Chí Minh',
    duration: '2 ngày / 1 đêm',
    dates: '18–19 Th11',
    travelers: '4 Người lớn',
    budget: '6.200.000 VND',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCCq4LoWJv6LIWDiWBi2YoJT_8MBz1oXRtey5TupfI-I_ITtEG3JQaokAyT-ADtXxZyF6xQXMvJEKQqHbYe5Dl4ST0AbMIel6Fwv9j8RmUyJ1t2FjrTVEz-7WLFEEEESRTawdQufbO3E9D6-3rWDTKxW_GlTsYkcVL6Z8MlzYe3wpBoAty1Dn2dp92he6lD5rA6IT2x53nhiTIcBZ31Mu5E48oUyrWIM8nVwicxAykmhYIRotTl-as8w',
    lastUpdated: '01/09/2026 08:30',
    status: 'confirmed',
    isPublished: true,
    publishedAt: '03/09/2026',
    authorName: 'Bích Ngọc',
    authorAvatar: 'BN',
    likesCount: 95,
    tags: ['Chợ nổi', 'Sông Tiền', 'Ẩm thực miệt vườn'],
    days: BASE_DAYS,
    chatMessages: [],
    sources: INITIAL_SOURCES,
  },
  {
    id: 'con-dao-heritage',
    conversationId: 'conv-cd-15',
    title: 'Côn Đảo Biển Xanh Tĩnh Lặng & Di Tích Lịch Sử',
    destination: 'Côn Đảo, Bà Rịa - Vũng Tàu',
    origin: 'TP. Hồ Chí Minh',
    duration: '3 ngày / 2 đêm',
    dates: '04–06 Th12',
    travelers: '2 Người lớn',
    budget: '15.800.000 VND',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPN5yjZ4_2ddr4jbSd40ZJyTlXybQh97VY5fXwC9yQZpYjZ2_OlrtKKKKlSTVAs8kGb29CSu_0FD9TT3XtpN8DS3eOGJIEc8Hfolwsv9NJNBg-fzNCTXMRC6XepNBLp8jiMOgU_B9pbUx7sdT2Zxbt-kZIfGDM3xsW5DCkglFVtg0GHPtF1vDWrjiK2F08F5ALXUGVOKJcyVXvEG2YRY9IIwmeU5ynP7wjBVOShMLL7u70IDnT5eozVw',
    lastUpdated: '29/08/2026 14:15',
    status: 'draft',
    isPublished: false,
    tags: ['Biển vắng', 'Lịch sử', 'Rùa biển'],
    days: BASE_DAYS,
    chatMessages: [],
    sources: INITIAL_SOURCES,
  },
  {
    id: 'da-lat-tea-plantation',
    conversationId: 'conv-dl-16',
    title: 'Đồi Chè Cầu Đất & Săn Mây Trại Mát Buổi Bình Minh',
    destination: 'Đà Lạt, Lâm Đồng',
    origin: 'Nha Trang',
    duration: '2 ngày / 1 đêm',
    dates: '21–22 Th11',
    travelers: '2 Người lớn',
    budget: '5.200.000 VND',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDw7fycPldv6zjzmXnR_P-Y6m8EPzMPk_w_W3ElQp0yObpBAqZmYUSgldO_JtqNPNIfrrxPfpa0IYxfQi1MVIZjAkWdGBmlCE3WctbelvGM3saJCy0FjGtLpqxIKt2nk6UzAsSLPAmMuC_HuRkBHN_38GunDsJIAisl-Oy5w5mOYZuVJSWG5BjUnXlJ2fb8gjP0-poQNhrZvKMpWCivd2QzVcz01RDCVs2S-qKDufkPlLRQiM7Vmlte-Q',
    lastUpdated: '28/08/2026 10:00',
    status: 'draft',
    isPublished: false,
    tags: ['Đồi chè', 'Cà phê', 'Săn mây'],
    days: BASE_DAYS,
    chatMessages: [],
    sources: INITIAL_SOURCES,
  },
  // Item 17 (triggers pagination > 16 in /my-trips)
  {
    id: 'pu-luong-retreat',
    conversationId: 'conv-pl-17',
    title: 'Pù Luông Thung Lũng Xanh Bản Đôn & Guồng Nước',
    destination: 'Pù Luông, Thanh Hóa',
    origin: 'Hà Nội, Việt Nam',
    duration: '3 ngày / 2 đêm',
    dates: '14–16 Th10',
    travelers: '2 Người lớn',
    budget: '7.800.000 VND',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBId3SEsE_eVNlUFOMkPBrr_5xjm109Sz2r1nwrXTj0qPo7JBw9hsO6oDiqXIu6jUtUaQNQJBK6SfYQa7VM1sHJrRP-o1vM3Ud7XiDtuXAgiwaroG9tY39vYc0qYLfHE3bvMCsfBj-XqjjUiDC2-Eh7BTFWd8wxt0OI-tbivDsgE9eCjh6vZpCKblKWVXoBt2LBNwLdwXHYYlRfnDcqqttso7lj42EIWC0lCGkLtkhsErLA-RIr5YyqBg',
    lastUpdated: '27/08/2026 15:30',
    status: 'confirmed',
    isPublished: true,
    publishedAt: '28/08/2026',
    authorName: 'Hoàng Yến',
    authorAvatar: 'HY',
    likesCount: 189,
    tags: ['Bản Đôn', 'Guồng nước', 'Nghỉ dưỡng sinh thái'],
    days: BASE_DAYS,
    chatMessages: [],
    sources: INITIAL_SOURCES,
  },
  // Additional community published plans to complete 24 cards
  {
    id: 'ta-xua-cloud-paradise',
    conversationId: 'conv-tx-18',
    title: 'Tà Xùa Thiên Đường Mây Sống Lưng Khủng Long',
    destination: 'Bắc Yên, Sơn La',
    origin: 'Hà Nội, Việt Nam',
    duration: '2 ngày / 1 đêm',
    dates: '11–12 Th11',
    travelers: '2 Người lớn',
    budget: '4.500.000 VND',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDw7fycPldv6zjzmXnR_P-Y6m8EPzMPk_w_W3ElQp0yObpBAqZmYUSgldO_JtqNPNIfrrxPfpa0IYxfQi1MVIZjAkWdGBmlCE3WctbelvGM3saJCy0FjGtLpqxIKt2nk6UzAsSLPAmMuC_HuRkBHN_38GunDsJIAisl-Oy5w5mOYZuVJSWG5BjUnXlJ2fb8gjP0-poQNhrZvKMpWCivd2QzVcz01RDCVs2S-qKDufkPlLRQiM7Vmlte-Q',
    lastUpdated: '25/08/2026 18:20',
    status: 'confirmed',
    isPublished: true,
    publishedAt: '26/08/2026',
    authorName: 'Khánh Linh',
    authorAvatar: 'KL',
    likesCount: 345,
    tags: ['Sống lưng khủng long', 'Săn mây', 'Đỉnh Gió'],
    days: BASE_DAYS,
    chatMessages: [],
    sources: INITIAL_SOURCES,
  },
  {
    id: 'ly-son-volcano',
    conversationId: 'conv-ls-19',
    title: 'Đảo Lý Sơn Miệng Núi Lửa Thới Lới & Cổng Tò Vò',
    destination: 'Lý Sơn, Quảng Ngãi',
    origin: 'Đà Nẵng',
    duration: '3 ngày / 2 đêm',
    dates: '02–04 Th09',
    travelers: '2 Người lớn',
    budget: '7.900.000 VND',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIT1JIDghDUYdb71JnGDzytu8VwAQgW20eSCqJM7TZZWgcZw9K2T17R4v3V8juWKuK4XBIK8I1iqBrZYKCRhrQo1iuE1Vcl1rNVdy2cZ5xm2BkyRHFAbG73m4YtCjKhLQY1WzcHj9vWJx1RfilbVwByJH3DriFXb70dnOq3UTztLWy_OgE0R0sWEtv6usp5vAW-n3h_ork5EPutIJwK1ffapj9W1va7qgvoYtcIDMco8u3ED5GLekbTg',
    lastUpdated: '24/08/2026 16:00',
    status: 'confirmed',
    isPublished: true,
    publishedAt: '25/08/2026',
    authorName: 'Bảo Trâm',
    authorAvatar: 'BT',
    likesCount: 165,
    tags: ['Núi lửa cổ', 'Tỏi Lý Sơn', 'Biển xanh'],
    days: BASE_DAYS,
    chatMessages: [],
    sources: INITIAL_SOURCES,
  },
  {
    id: 'y-ty-cloud-hunter',
    conversationId: 'conv-yt-20',
    title: 'Y Tý Nhà Trình Tường Nấm Rơm & Ngải Thầu Sương Khói',
    destination: 'Bát Xát, Lào Cai',
    origin: 'Hà Nội, Việt Nam',
    duration: '3 ngày / 2 đêm',
    dates: '19–21 Th11',
    travelers: '3 Người lớn',
    budget: '6.900.000 VND',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCCq4LoWJv6LIWDiWBi2YoJT_8MBz1oXRtey5TupfI-I_ITtEG3JQaokAyT-ADtXxZyF6xQXMvJEKQqHbYe5Dl4ST0AbMIel6Fwv9j8RmUyJ1t2FjrTVEz-7WLFEEEESRTawdQufbO3E9D6-3rWDTKxW_GlTsYkcVL6Z8MlzYe3wpBoAty1Dn2dp92he6lD5rA6IT2x53nhiTIcBZ31Mu5E48oUyrWIM8nVwicxAykmhYIRotTl-as8w',
    lastUpdated: '22/08/2026 09:40',
    status: 'confirmed',
    isPublished: true,
    publishedAt: '23/08/2026',
    authorName: 'Đức Trọng',
    authorAvatar: 'DT',
    likesCount: 278,
    tags: ['Nhà trình tường', 'Hà Nhì', 'Ngải Thầu Thượng'],
    days: BASE_DAYS,
    chatMessages: [],
    sources: INITIAL_SOURCES,
  },
  {
    id: 'an-giang-tra-su',
    conversationId: 'conv-ag-21',
    title: 'Rừng Tràm Trà Sư Mùa Nước Nổi & Thất Sơn Màu Nhiệm',
    destination: 'Châu Đốc, An Giang',
    origin: 'Cần Thơ',
    duration: '2 ngày / 1 đêm',
    dates: '28–29 Th10',
    travelers: '2 Người lớn',
    budget: '5.100.000 VND',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPN5yjZ4_2ddr4jbSd40ZJyTlXybQh97VY5fXwC9yQZpYjZ2_OlrtKKKKlSTVAs8kGb29CSu_0FD9TT3XtpN8DS3eOGJIEc8Hfolwsv9NJNBg-fzNCTXMRC6XepNBLp8jiMOgU_B9pbUx7sdT2Zxbt-kZIfGDM3xsW5DCkglFVtg0GHPtF1vDWrjiK2F08F5ALXUGVOKJcyVXvEG2YRY9IIwmeU5ynP7wjBVOShMLL7u70IDnT5eozVw',
    lastUpdated: '20/08/2026 14:10',
    status: 'confirmed',
    isPublished: true,
    publishedAt: '21/08/2026',
    authorName: 'Nhật Quang',
    authorAvatar: 'NQ',
    likesCount: 132,
    tags: ['Rừng tràm', 'Mùa nước nổi', 'Bèo cám'],
    days: BASE_DAYS,
    chatMessages: [],
    sources: INITIAL_SOURCES,
  },
  {
    id: 'bac-ha-market',
    conversationId: 'conv-bh-22',
    title: 'Chợ Phiên Bắc Hà Sắc Màu Thổ Cẩm & Rượu Ngô Bản Phố',
    destination: 'Bắc Hà, Lào Cai',
    origin: 'Hà Nội, Việt Nam',
    duration: '2 ngày / 1 đêm',
    dates: '23–24 Th11',
    travelers: '2 Người lớn',
    budget: '5.600.000 VND',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDw7fycPldv6zjzmXnR_P-Y6m8EPzMPk_w_W3ElQp0yObpBAqZmYUSgldO_JtqNPNIfrrxPfpa0IYxfQi1MVIZjAkWdGBmlCE3WctbelvGM3saJCy0FjGtLpqxIKt2nk6UzAsSLPAmMuC_HuRkBHN_38GunDsJIAisl-Oy5w5mOYZuVJSWG5BjUnXlJ2fb8gjP0-poQNhrZvKMpWCivd2QzVcz01RDCVs2S-qKDufkPlLRQiM7Vmlte-Q',
    lastUpdated: '18/08/2026 11:30',
    status: 'confirmed',
    isPublished: true,
    publishedAt: '19/08/2026',
    authorName: 'Thu Trang',
    authorAvatar: 'TT',
    likesCount: 204,
    tags: ['Chợ phiên', 'H’Mông Hoa', 'Dinh Hoàng A Tưởng'],
    days: BASE_DAYS,
    chatMessages: [],
    sources: INITIAL_SOURCES,
  },
  {
    id: 'lang-co-bay',
    conversationId: 'conv-lc-23',
    title: 'Vịnh Lăng Cô Đầm Lập An & Đèo Hải Vân Hùng Vĩ',
    destination: 'Phú Lộc, Thừa Thiên Huế',
    origin: 'Đà Nẵng',
    duration: '2 ngày / 1 đêm',
    dates: '06–07 Th11',
    travelers: '2 Người lớn',
    budget: '4.900.000 VND',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBId3SEsE_eVNlUFOMkPBrr_5xjm109Sz2r1nwrXTj0qPo7JBw9hsO6oDiqXIu6jUtUaQNQJBK6SfYQa7VM1sHJrRP-o1vM3Ud7XiDtuXAgiwaroG9tY39vYc0qYLfHE3bvMCsfBj-XqjjUiDC2-Eh7BTFWd8wxt0OI-tbivDsgE9eCjh6vZpCKblKWVXoBt2LBNwLdwXHYYlRfnDcqqttso7lj42EIWC0lCGkLtkhsErLA-RIr5YyqBg',
    lastUpdated: '15/08/2026 17:50',
    status: 'confirmed',
    isPublished: true,
    publishedAt: '16/08/2026',
    authorName: 'Văn Hậu',
    authorAvatar: 'VH',
    likesCount: 147,
    tags: ['Đầm Lập An', 'Đèo Hải Vân', 'Hàu nướng'],
    days: BASE_DAYS,
    chatMessages: [],
    sources: INITIAL_SOURCES,
  },
  {
    id: 'ba-na-hills-clouds',
    conversationId: 'conv-bn-24',
    title: 'Bà Nà Hills & Cầu Vàng Bồng Bềnh Trong Sương Sớm',
    destination: 'Đà Nẵng',
    origin: 'Đà Nẵng',
    duration: '2 ngày / 1 đêm',
    dates: '10–11 Th11',
    travelers: '2 Người lớn',
    budget: '6.400.000 VND',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDw7fycPldv6zjzmXnR_P-Y6m8EPzMPk_w_W3ElQp0yObpBAqZmYUSgldO_JtqNPNIfrrxPfpa0IYxfQi1MVIZjAkWdGBmlCE3WctbelvGM3saJCy0FjGtLpqxIKt2nk6UzAsSLPAmMuC_HuRkBHN_38GunDsJIAisl-Oy5w5mOYZuVJSWG5BjUnXlJ2fb8gjP0-poQNhrZvKMpWCivd2QzVcz01RDCVs2S-qKDufkPlLRQiM7Vmlte-Q',
    lastUpdated: '12/08/2026 13:20',
    status: 'confirmed',
    isPublished: true,
    publishedAt: '13/08/2026',
    authorName: 'Phương Anh',
    authorAvatar: 'PA',
    likesCount: 388,
    tags: ['Cầu Vàng', 'Làng Pháp', 'Cáp treo kỷ lục'],
    days: BASE_DAYS,
    chatMessages: [],
    sources: INITIAL_SOURCES,
  },
  {
    id: 'mang-den-pine',
    conversationId: 'conv-md-25',
    title: 'Măng Đen Cao Nguyên Đại Ngàn Thác Pa Sỹ & Đồi Sim',
    destination: 'Kon Plông, Kon Tum',
    origin: 'Pleiku, Gia Lai',
    duration: '3 ngày / 2 đêm',
    dates: '17–19 Th11',
    travelers: '2 Người lớn',
    budget: '6.800.000 VND',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIT1JIDghDUYdb71JnGDzytu8VwAQgW20eSCqJM7TZZWgcZw9K2T17R4v3V8juWKuK4XBIK8I1iqBrZYKCRhrQo1iuE1Vcl1rNVdy2cZ5xm2BkyRHFAbG73m4YtCjKhLQY1WzcHj9vWJx1RfilbVwByJH3DriFXb70dnOq3UTztLWy_OgE0R0sWEtv6usp5vAW-n3h_ork5EPutIJwK1ffapj9W1va7qgvoYtcIDMco8u3ED5GLekbTg',
    lastUpdated: '10/08/2026 15:40',
    status: 'confirmed',
    isPublished: true,
    publishedAt: '11/08/2026',
    authorName: 'Thành Trung',
    authorAvatar: 'TT',
    likesCount: 221,
    tags: ['Khí hậu lạnh', 'Thác Pa Sỹ', 'Rừng nguyên sinh'],
    days: BASE_DAYS,
    chatMessages: [],
    sources: INITIAL_SOURCES,
  },
];

const PROVINCE_MAP: Record<string, string[]> = {
  'sapa-cloud-hunt': ['Lào Cai'],
  'moc-chau-autumn': ['Sơn La'],
  'dalat-pine-hills': ['Lâm Đồng'],
  'ninh-binh-heritage': ['Ninh Bình'],
  'ha-giang-loop': ['Hà Giang'],
  'phu-quoc-sunset': ['Kiên Giang'],
  'hoi-an-heritage': ['Quảng Nam'],
  'mu-cang-chai-rice': ['Yên Bái'],
  'hue-ancient-citadel': ['Thừa Thiên Huế'],
  'quy-nhon-coastal': ['Bình Định'],
  'tam-dao-mist': ['Vĩnh Phúc'],
  'ba-be-lake': ['Bắc Kạn', 'Cao Bằng'],
  'phong-nha-caves': ['Quảng Bình'],
  'can-tho-floating': ['Cần Thơ'],
  'con-dao-heritage': ['Bà Rịa - Vũng Tàu'],
  'da-lat-tea-plantation': ['Lâm Đồng'],
  'pu-luong-retreat': ['Thanh Hóa'],
  'ta-xua-cloud-paradise': ['Sơn La'],
  'ly-son-volcano': ['Quảng Ngãi'],
  'y-ty-cloud-hunter': ['Lào Cai'],
  'an-giang-tra-su': ['An Giang'],
  'bac-ha-market': ['Lào Cai'],
  'lang-co-bay': ['Thừa Thiên Huế'],
  'ba-na-hills-clouds': ['Đà Nẵng'],
  'mang-den-pine': ['Kon Tum'],
};

export const INITIAL_PLANS: DemoPlan[] = (RAW_INITIAL_PLANS as unknown as DemoPlan[]).map((p) => ({
  ...p,
  status: p.status as 'draft' | 'confirmed',
  provinces: PROVINCE_MAP[p.id] || (p.destination.includes('Đà Lạt') || p.destination.includes('Lâm Đồng') ? ['Lâm Đồng'] : [p.destination.split(',').pop()?.trim() || 'Việt Nam']),
  createdAt: p.lastUpdated,
  confirmedAt: p.status === 'confirmed' ? p.lastUpdated : undefined,
}));

const DemoPlanContext = createContext<DemoPlanContextType | undefined>(undefined);

export function DemoPlanProvider({ children }: { children: React.ReactNode }) {
  const [plans, setPlans] = useState<DemoPlan[]>(INITIAL_PLANS);
  const [activePlanId, setActivePlanId] = useState<string>('sapa-cloud-hunt');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const isMounted = useRef(false);

  // Load from localStorage on client mount deferred to avoid hydration mismatch & cascading renders
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (typeof window !== 'undefined') {
          const savedPlans = localStorage.getItem('vistra_demo_plans');
          const savedActiveId = localStorage.getItem('vistra_demo_active_id');
          if (savedPlans) {
            const parsed = JSON.parse(savedPlans);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const normalized = parsed.map((p: DemoPlan) => ({
                ...p,
                lastUpdated: formatDateTimeVN(p.lastUpdated),
                provinces: Array.isArray(p.provinces) && p.provinces.length > 0
                  ? p.provinces
                  : (p.destination?.includes('Đà Lạt') || p.destination?.includes('Lâm Đồng') ? ['Lâm Đồng'] : [p.destination?.split(',').pop()?.trim() || 'Việt Nam']),
                createdAt: p.createdAt ? formatDateTimeVN(p.createdAt) : formatDateTimeVN(p.lastUpdated),
                confirmedAt: p.confirmedAt ? formatDateTimeVN(p.confirmedAt) : (p.status === 'confirmed' ? formatDateTimeVN(p.lastUpdated) : undefined),
              }));
              setPlans(normalized);
            }
          }
          if (savedActiveId) {
            setActivePlanId(savedActiveId);
          }
        }
      } catch {
        // ignore storage restrictions
      } finally {
        isMounted.current = true;
        setIsLoaded(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Save to localStorage on changes (only after mount and initial state hydration)
  useEffect(() => {
    if (!isMounted.current) return;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('vistra_demo_plans', JSON.stringify(plans));
        localStorage.setItem('vistra_demo_active_id', activePlanId);
      }
    } catch {
      // ignore
    }
  }, [plans, activePlanId]);

  const getActivePlan = (): DemoPlan => {
    return plans.find((p) => p.id === activePlanId) || plans[0];
  };

  const getPlanById = (id: string): DemoPlan | undefined => {
    return plans.find((p) => p.id === id);
  };

  // Add chat message in Planner: updates the same draft plan and truly transforms timeline activities (F02, FIX-03)
  const addChatMessage = (planId: string, userText: string) => {
    const timestamp = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp,
    };

    const targetPlan = plans.find((p) => p.id === planId);
    const destLower = targetPlan ? targetPlan.destination.toLowerCase() : '';
    const isDalat = destLower.includes('đà lạt') || destLower.includes('da lat') || destLower.includes('lâm đồng');

    const lower = userText.toLowerCase();

    // Determine context-aware response for the demo
    let aiResponseText = 'Vistra đã ghi nhận mong muốn của bạn và cập nhật thời lượng các trạm dừng.';
    let affected = 'Điều chỉnh nhịp độ hành trình';
    let newSources: ChatSource[] = [];

    const mentionsPhoGa = lower.includes('phở gà') || (lower.includes('phở') && lower.includes('gà')) || lower.includes('bánh ướt') || lower.includes('bữa sáng');
    const mentionsElderlyRest = lower.includes('nghỉ trưa') || lower.includes('người lớn tuổi') || lower.includes('người già');
    const mentionsCloud = lower.includes('mây') || lower.includes('05:15') || lower.includes('sớm');

    if (isDalat) {
      if (mentionsPhoGa && mentionsElderlyRest) {
        aiResponseText = 'Đã cập nhật Ngày 2: Đổi bữa sáng sang Bánh ướt lòng gà Long ấm nóng và bổ sung trạm nghỉ trưa 90 phút tại khuôn viên Ana Mandara Villas để người lớn tuổi phục hồi thể lực.';
        affected = 'Đổi bánh ướt lòng gà & Thêm trạm nghỉ trưa người lớn tuổi';
        newSources = [DALAT_SOURCES[2]];
      } else if (mentionsPhoGa) {
        aiResponseText = 'Đã cập nhật Ngày 2: Bữa sáng được chuyển sang Bánh ướt lòng gà Long đậm đà và Cà phê Tùng hoài niệm tại khu Hòa Bình.';
        affected = 'Cập nhật món ăn sáng: Bánh ướt lòng gà Long & Cà phê Tùng';
        newSources = [DALAT_SOURCES[2]];
      } else if (mentionsElderlyRest) {
        aiResponseText = 'Đã bổ sung trạm nghỉ trưa 90 phút dành riêng cho người lớn tuổi tại khuôn viên tĩnh lặng của Biệt thự Ana Mandara trước khi tiếp tục các hoạt động chiều.';
        affected = 'Thêm điểm nghỉ trưa cho người lớn tuổi (13:00 - 14:30)';
      } else if (mentionsCloud) {
        aiResponseText = 'Planning Agent đã dời giờ xuất phát lên 05:15 sáng tại Đồi chè Cầu Đất để bạn đón trọn vẹn khoảnh khắc biển mây bồng bềnh phủ trên những luống chè xanh.';
        affected = 'Tối ưu khung giờ săn mây Cầu Đất 05:15 – 07:15';
        newSources = [DALAT_SOURCES[0]];
      } else if (lower.includes('nghỉ') || lower.includes('thong thả') || lower.includes('chậm')) {
        aiResponseText = 'Đã chuyển nhịp độ sang "Thư thái": giãn cách giữa các chặng thêm 45 phút để bạn thoải mái nhâm nhi cà phê ngắm đồi thông.';
        affected = 'Chuyển nhịp độ ngày sang Thư thái (+45p)';
      } else {
        aiResponseText = `Vistra Atelier đã tiếp thu: "${userText}". Chúng tôi đã phân tích lại cung đường cao nguyên và tinh chỉnh các điểm dừng phù hợp với yêu cầu mới.`;
        affected = 'Tinh chỉnh thứ tự các điểm dừng trong bản nháp';
      }
    } else {
      if (mentionsPhoGa && mentionsElderlyRest) {
        aiResponseText = 'Đã cập nhật Ngày 2: Đổi bữa sáng sang Phở gà đồi nghệ nhân ấm nóng và bổ sung trạm nghỉ trưa 90 phút tại không gian tĩnh lặng của Ecolodge để người lớn tuổi phục hồi thể lực.';
        affected = 'Đổi phở gà đồi & Thêm trạm nghỉ trưa người lớn tuổi';
        newSources = [INITIAL_SOURCES[1]];
      } else if (mentionsPhoGa) {
        aiResponseText = 'Đã cập nhật Ngày 2: Bữa sáng được chuyển sang Phở gà đồi nghệ nhân bắp giòn thơm hương thảo quả Tây Bắc.';
        affected = 'Cập nhật món ăn sáng: Phở gà đồi nghệ nhân';
        newSources = [INITIAL_SOURCES[1]];
      } else if (mentionsElderlyRest) {
        aiResponseText = 'Đã bổ sung trạm nghỉ trưa 90 phút dành riêng cho người lớn tuổi tại Ecolodge tĩnh lặng trước khi tiếp tục các hoạt động chiều.';
        affected = 'Thêm điểm nghỉ trưa cho người lớn tuổi (13:00 - 14:30)';
      } else if (mentionsCloud) {
        aiResponseText = 'Planning Agent đã dời giờ xuất phát lên 05:15 sáng tại đèo Ô Quy Hồ để bạn đón trọn vẹn khoảnh khắc biển mây bồng bềnh lúc bình minh.';
        affected = 'Tối ưu khung giờ săn mây 05:15 – 07:15';
        newSources = [INITIAL_SOURCES[0]];
      } else if (lower.includes('nghỉ') || lower.includes('thong thả') || lower.includes('chậm')) {
        aiResponseText = 'Đã chuyển nhịp độ sang "Thư thái": giãn cách giữa các chặng thêm 45 phút để bạn thoải mái nhâm nhi cà phê ngắm cảnh.';
        affected = 'Chuyển nhịp độ ngày sang Thư thái (+45p)';
      } else {
        aiResponseText = `Vistra Atelier đã tiếp thu: "${userText}". Chúng tôi đã phân tích lại cung đường và tinh chỉnh các điểm dừng phù hợp với yêu cầu mới.`;
        affected = 'Tinh chỉnh thứ tự các điểm dừng trong bản nháp';
      }
    }

    const aiMsg: ChatMessage = {
      id: `ai-${Date.now() + 1}`,
      sender: 'assistant',
      text: aiResponseText,
      timestamp,
      affectedChange: affected,
      sources: newSources.length > 0 ? newSources : undefined,
    };

    setPlans((prev) =>
      prev.map((plan) => {
        if (plan.id === planId) {
          // Deep clone days to transform them safely
          const updatedDays = plan.days.map((d) => {
            if (d.dayNumber === 2) {
              const updatedActivities = d.activities.map((act) => {
                if ('isTransit' in act) return act;
                // If user requested food update
                if (mentionsPhoGa && (act.id.includes('a2') || act.category === 'Ẩm thực')) {
                  if (isDalat) {
                    return {
                      ...act,
                      title: 'Bữa sáng Bánh ướt lòng gà Long & Cà phê Tùng',
                      description: 'Thưởng thức bánh ướt lòng gà nóng hổi dẻo mềm với nước mắm pha gia truyền, sau đó ghé Cà phê Tùng lắng nghe giai điệu xưa.',
                      location: 'Số 6 Khu Hòa Bình, Đà Lạt',
                      tags: ['Bánh ướt lòng gà', 'Cà phê Tùng', 'Yêu cầu tùy biến'],
                      coordinates: { lat: 11.9424, lng: 108.4377 },
                    };
                  }
                  return {
                    ...act,
                    title: 'Bữa sáng phở gà đồi nghệ nhân & Cà phê bên suối',
                    description: 'Thưởng thức phở gà đồi bản địa ngọt thịt thơm nồng thảo quả và nhâm nhi cà phê ngắm sương sớm tan dần bên suối Mường Hoa.',
                    tags: ['Phở gà đồi bản địa', 'Cà phê đặc sản', 'Yêu cầu tùy biến'],
                    coordinates: { lat: 22.3021, lng: 103.8931 },
                  };
                }
                // If user requested cloud hunt 05:15
                if (mentionsCloud && act.id.includes('a1')) {
                  if (isDalat) {
                    return {
                      ...act,
                      timeStart: '05:15',
                      timeEnd: '07:15',
                      title: 'Săn biển mây sớm lúc 05:15 tại Đồi Chè Cầu Đất & Tuabin Gió',
                      location: 'Đồi chè Cầu Đất, Trạm Hành, Đà Lạt',
                      coordinates: { lat: 11.8587, lng: 108.5375 },
                    };
                  }
                  return {
                    ...act,
                    timeStart: '05:15',
                    timeEnd: '07:15',
                    title: 'Săn biển mây sớm lúc 05:15 tại Đèo Ô Quy Hồ & Cổng Trời',
                    coordinates: { lat: 22.3551, lng: 103.7744 },
                  };
                }
                return act;
              });

              // If user requested rest for elderly, insert or update rest activity
              if (mentionsElderlyRest && !updatedActivities.some((a) => !('isTransit' in a) && a.title.includes('người lớn tuổi'))) {
                if (isDalat) {
                  updatedActivities.push({
                    id: 'dl-d2-rest-elderly',
                    timeStart: '13:00',
                    timeEnd: '14:30',
                    title: 'Nghỉ trưa & Thưởng trà thảo mộc hoa atiso cho người lớn tuổi',
                    category: 'Thư giãn & Sức khỏe',
                    description: 'Không gian yên bình giữa rừng thông cổ thụ tại Biệt thự Ana Mandara với trà atiso ấm giúp người cao tuổi thư giãn và phục hồi năng lượng.',
                    location: 'Khu biệt thự Ana Mandara Villas Dalat',
                    tags: ['Thân thiện người cao tuổi', 'Trạm nghỉ tĩnh lặng', 'Trà atiso'],
                    coordinates: { lat: 11.9392, lng: 108.4285 },
                  });
                } else {
                  updatedActivities.push({
                    id: 'd2-rest-elderly',
                    timeStart: '13:00',
                    timeEnd: '14:30',
                    title: 'Nghỉ trưa & Thưởng trà thảo mộc phục hồi thể lực cho người lớn tuổi',
                    category: 'Thư giãn & Sức khỏe',
                    description: 'Không gian yên tĩnh tại Ecolodge với giường nằm êm ái, trà thảo mộc atiso ấm giúp người cao tuổi lấy lại năng lượng trước chặng chiều.',
                    location: 'Phòng trà & Nghỉ dưỡng Topas Ecolodge',
                    tags: ['Thân thiện người cao tuổi', 'Trạm nghỉ tĩnh lặng', 'Trà thảo mộc'],
                    coordinates: { lat: 22.2592, lng: 103.9317 },
                  });
                }
              }

              return {
                ...d,
                pace: (mentionsElderlyRest || lower.includes('thong thả')) ? ('Thư thái' as const) : d.pace,
                highlight: mentionsPhoGa
                  ? (isDalat ? 'Bánh ướt lòng gà & Đồi chè Cầu Đất săn mây' : 'Phở gà đồi & Đèo Ô Quy Hồ săn mây')
                  : d.highlight,
                activities: updatedActivities,
              };
            }
            return d;
          });

          return {
            ...plan,
            lastUpdated: getNowFormattedVN(),
            chatMessages: [...plan.chatMessages, userMsg, aiMsg],
            days: updatedDays,
            sources: newSources.length > 0 && !plan.sources.some((s) => s.id === newSources[0].id)
              ? [...plan.sources, newSources[0]]
              : plan.sources,
          };
        }
        return plan;
      })
    );
  };

  // Explicit confirmation: changes status from 'draft' to 'confirmed'
  const confirmPlan = (planId: string) => {
    const now = getNowFormattedVN();
    setPlans((prev) =>
      prev.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              status: 'confirmed',
              lastUpdated: now,
              confirmedAt: now,
            }
          : plan
      )
    );
  };

  // Publish confirmed plan to community
  const publishPlan = (planId: string) => {
    const now = getNowFormattedVN();
    setPlans((prev) =>
      prev.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              isPublished: true,
              publishedAt: now.split(' ')[0],
              authorName: plan.authorName || 'Du khách Vistra (Tôi)',
              authorAvatar: plan.authorAvatar || 'VS',
              likesCount: plan.likesCount || 1,
            }
          : plan
      )
    );
  };

  const unpublishPlan = (planId: string) => {
    setPlans((prev) =>
      prev.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              isPublished: false,
            }
          : plan
      )
    );
  };

  // Create new draft from create-trip inputs or community reuse
  const createDraftFromInput = (input: {
    origin: string;
    dates: string;
    duration: string;
    travelers: string;
    budget: string;
    narrative: string;
    selectedDestination?: string;
    clonedDays?: DayItinerary[];
    clonedSources?: ChatSource[];
    coverImage?: string;
  }): string => {
    const newId = `draft-${Date.now()}`;
    const destination = input.selectedDestination || 'Sa Pa, Lào Cai';
    const isDalat = destination.includes('Đà Lạt') || destination.toLowerCase().includes('da lat') || destination.includes('Lâm Đồng');
    const nowStr = getNowFormattedVN();

    const assignedDays = input.clonedDays
      ? JSON.parse(JSON.stringify(input.clonedDays))
      : isDalat
      ? JSON.parse(JSON.stringify(DALAT_DAYS))
      : BASE_DAYS;

    const assignedSources = input.clonedSources
      ? [...input.clonedSources]
      : isDalat
      ? DALAT_SOURCES
      : INITIAL_SOURCES;

    const assignedCover =
      input.coverImage ||
      (isDalat
        ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuBId3SEsE_eVNlUFOMkPBrr_5xjm109Sz2r1nwrXTj0qPo7JBw9hsO6oDiqXIu6jUtUaQNQJBK6SfYQa7VM1sHJrRP-o1vM3Ud7XiDtuXAgiwaroG9tY39vYc0qYLfHE3bvMCsfBj-XqjjUiDC2-Eh7BTFWd8wxt0OI-tbivDsgE9eCjh6vZpCKblKWVXoBt2LBNwLdwXHYYlRfnDcqqttso7lj42EIWC0lCGkLtkhsErLA-RIr5YyqBg'
        : 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPN5yjZ4_2ddr4jbSd40ZJyTlXybQh97VY5fXwC9yQZpYjZ2_OlrtKKKKlSTVAs8kGb29CSu_0FD9TT3XtpN8DS3eOGJIEc8Hfolwsv9NJNBg-fzNCTXMRC6XepNBLp8jiMOgU_B9pbUx7sdT2Zxbt-kZIfGDM3xsW5DCkglFVtg0GHPtF1vDWrjiK2F08F5ALXUGVOKJcyVXvEG2YRY9IIwmeU5ynP7wjBVOShMLL7u70IDnT5eozVw');

    const derivedProvince = isDalat ? ['Lâm Đồng'] : [destination.split(',')[destination.split(',').length - 1].trim()];

    const newDraft: DemoPlan = {
      id: newId,
      conversationId: `conv-${newId}`,
      title: `${destination} — Hành trình tùy chỉnh`,
      destination,
      origin: input.origin || (isDalat ? 'TP. Hồ Chí Minh' : 'Hà Nội, Việt Nam'),
      duration: input.duration || '4 ngày / 3 đêm',
      dates: input.dates || '18–21 Th11',
      travelers: input.travelers || '2 Người lớn',
      budget: input.budget || '15.000.000 VND',
      coverImage: assignedCover,
      lastUpdated: nowStr,
      createdAt: nowStr,
      status: 'draft',
      isPublished: false,
      tags: ['Tùy chỉnh', 'DNA Du lịch', 'Mới tạo'],
      days: assignedDays,
      chatMessages: [
        {
          id: `msg-init-${Date.now()}`,
          sender: 'user',
          text: input.narrative || 'Khởi tạo kế hoạch từ ảnh moodboard và mong muốn cá nhân.',
          timestamp: 'Vừa xong',
        },
        {
          id: `msg-resp-${Date.now() + 1}`,
          sender: 'assistant',
          text: `Chào bạn, Vistra đã tiếp nhận mong muốn xuất phát từ ${input.origin || (isDalat ? 'TP. Hồ Chí Minh' : 'Hà Nội')} đi ${destination} trong ${input.duration}. Bản nháp đầu tiên đã sẵn sàng để cùng bạn tinh chỉnh!`,
          timestamp: 'Vừa xong',
          affectedChange: `Khởi tạo bản nháp hành trình cho ${destination}`,
        },
      ],
      sources: assignedSources,
      provinces: derivedProvince,
    };

    setPlans((prev) => [newDraft, ...prev]);
    setActivePlanId(newId);
    return newId;
  };

  return (
    <DemoPlanContext.Provider
      value={{
        plans,
        activePlanId,
        isLoaded,
        setActivePlanId,
        getActivePlan,
        getPlanById,
        addChatMessage,
        confirmPlan,
        publishPlan,
        unpublishPlan,
        createDraftFromInput,
      }}
    >
      {children}
    </DemoPlanContext.Provider>
  );
}

export function useDemoPlan() {
  const context = useContext(DemoPlanContext);
  if (!context) {
    throw new Error('useDemoPlan must be used within a DemoPlanProvider');
  }
  return context;
}
