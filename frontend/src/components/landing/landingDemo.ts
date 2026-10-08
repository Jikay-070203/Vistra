/**
 * VISTRA Landing Editorial Illustration & State Contract
 *
 * File: src/components/landing/landingDemo.ts
 *
 * Ghi chú kiến trúc:
 * - Fixture dữ liệu mẫu và state transitions thuần (pure functions) dùng chung cho 5 sections landing.
 * - Tuân thủ nguyên tắc định tính: dùng mô tả ngữ cảnh, nhịp độ và không gian; không bịa số liệu chính xác.
 * - Nhãn minh họa: "Minh họa cách VISTRA hỗ trợ lập kế hoạch".
 * - ID ổn định cho tất cả các vật thể (clusters, pins, activities, routes, transcript).
 * - Các ví dụ chỉ minh họa câu chuyện thiết kế; không tạo, lưu, xác nhận hoặc chỉnh sửa hành trình thật.
 */

export interface LandingPin {
  id: string;
  name: string;
  category: 'scenic' | 'dining' | 'stay' | 'culture';
  coords: { x: number; y: number }; // Tọa độ % tương đối trên canvas 100x100
  day: 1 | 2 | 3;
  shortLabel: string;
  description: string;
}

export interface LandingCluster {
  id: string;
  title: string;
  badge: string;
  snippet: string;
  pinId: string;
  status: 'scattered' | 'conflicted' | 'grouped' | 'drafted';
  position: { x: number; y: number }; // % trên canvas
  conflictWarning?: string; // Nhãn xung đột định tính ở Beat B
}

export type DecisionStatus = 'proposed' | 'selected' | 'skipped' | 'swapped';
export type ReviewFlag = 'needs_review' | 'flexible' | 'confirmed';

export interface LandingActivity {
  id: string;
  dayNumber: 1 | 2 | 3;
  timeSlot: 'morning' | 'lunch' | 'afternoon' | 'evening';
  timeLabel: string;
  title: string;
  locationName: string;
  pinId: string;
  description: string;
  decisionStatus: DecisionStatus;
  reviewFlag: ReviewFlag;
  reviewNote?: string;
  impactTag?: string; // e.g. "Ít di chuyển", "Khoảng nghỉ thư thả"
  isAlternative?: boolean;
}

export interface LandingDay {
  dayNumber: 1 | 2 | 3;
  dayTitle: string;
  pace: string;
  highlight: string;
  routeSummary: string;
  activities: LandingActivity[];
}

export interface LandingRoutePoint {
  x: number;
  y: number;
  pinId?: string;
}

export interface LandingRouteSegment {
  id: string;
  dayNumber: 1 | 2 | 3;
  mode: 'initial_draft' | 'less_travel' | 'standard';
  points: LandingRoutePoint[];
  svgPath: string; // SVG path d attribute trên viewBox 0 0 100 100
  qualitativeDistance: string; // "Cung đường ngắn nội vùng", "Chặng di chuyển dài hơn"
  isHighlighted?: boolean;
}

export interface LandingTranscriptItem {
  id: string;
  sender: 'ai' | 'user';
  content: string;
  timestampLabel: string;
}

export interface LandingAssetMeta {
  path: string;
  alt: string;
  width: number;
  height: number;
  aspectRatio: string;
  role: 'inspiration' | 'final_journey';
  author: string;
  sourcePageUrl: string;
  imageUrl: string;
  license: string;
  licenseUrl: string;
  attribution: string;
  cropUsage: string;
  sourceNote: string;
}

export interface LandingTripState {
  tripTitle: string;
  disclaimer: string;
  preference: 'default' | 'less_travel';
  days: LandingDay[];
  pins: LandingPin[];
  clusters: LandingCluster[];
  routes: LandingRouteSegment[];
  transcript: LandingTranscriptItem[];
  hasSelectedAny: boolean;
  isConfirmed: boolean;
  editingItemId?: string | null;
  changeNote?: string;
  displacedActivities?: LandingActivity[];
}

// ============================================================================
// HẰNG SỐ ASSETS XÁC MINH NGUỒN GỐC & ĐẦU VÀO MULTIMODAL
// ============================================================================

export const LANDING_ASSETS: Record<'heroInspiration' | 'finalJourney', LandingAssetMeta> = {
  heroInspiration: {
    path: '/landing/hero-inspiration.jpg',
    alt: 'Mặt hồ Thung lũng Vàng phẳng lặng trong sương sớm và đồi thông xanh ngát',
    width: 1280,
    height: 960,
    aspectRatio: '4:3',
    role: 'inspiration',
    author: 'Nguyễn Tấn Phát',
    sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Golden_Valley_in_morning_fog.jpg',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Golden_Valley_in_morning_fog.jpg/1280px-Golden_Valley_in_morning_fog.jpg',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    attribution: 'Nguyễn Tấn Phát / Wikimedia Commons / CC BY-SA 3.0',
    cropUsage: 'Ảnh cảm hứng du lịch tại Hero (tỉ lệ 4:3); crop vùng trung tâm mặt hồ và sương sớm cho thẻ ghi chú và minh họa cụm địa điểm Vườn ven hồ.',
    sourceNote: 'Tác phẩm "Golden Valley in morning fog.jpg" chụp tại Thung lũng Vàng, Đà Lạt.',
  },
  finalJourney: {
    path: '/landing/final-journey.jpg',
    alt: 'Con đường thông reo rợp bóng dẫn lên Thiền Viện Trúc Lâm, Đà Lạt',
    width: 2816,
    height: 2112,
    aspectRatio: '4:3',
    role: 'final_journey',
    author: 'nhà khoa học',
    sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Đường_lên_Thiền_Viện_Trúc_Lâm-Đà_Lạt.jpg',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/%C4%90%C6%B0%E1%BB%9Dng_l%C3%AAn_Thi%E1%BB%81n_Vi%E1%BB%87n_Tr%C3%BAc_L%C3%A2m-%C4%90%C3%A0_L%E1%BA%A1t.jpg',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    attribution: 'nhà khoa học / Wikimedia Commons / CC BY-SA 3.0',
    cropUsage: 'Khung cảnh kết thúc tại Section 5 (Final Value). Crop ngang 16:9 tập trung vào lối đi rợp bóng thông uốn lượn từ phía dưới lên cánh rừng đón nắng, nối tiếp điểm kết của nét route trên bản đồ.',
    sourceNote: 'Tác phẩm "Đường lên Thiền Viện Trúc Lâm-Đà Lạt.jpg" chụp tại Đà Lạt.',
  },
};

export const HERO_MULTIMODAL_INPUT = {
  eyebrow: 'Lên kế hoạch du lịch cùng AI',
  heading: 'Chuyến đi đáng để mong chờ.',
  supporting: 'Việc lên kế hoạch không cần phải mệt như vậy.',
  multimodalSub: 'Bắt đầu từ một mô tả hoặc hình ảnh truyền cảm hứng.',
  inspirationNote: {
    title: 'Ghi chú mong muốn',
    promptText: 'Chuyến đi 3 ngày thư thả, nhiều thiên nhiên và không gian yên tĩnh, tránh chạy show nhiều điểm.',
    inspirationPhoto: LANDING_ASSETS.heroInspiration.path,
  },
  openQuestions: [
    { id: 'q-food', label: 'Ăn gì?', pinId: 'pin-corner-tea' },
    { id: 'q-transit', label: 'Di chuyển?', pinId: 'pin-lake-garden' },
    { id: 'q-stay', label: 'Nghỉ chân ở đâu?', pinId: 'pin-hillside-lodge' },
  ],
  illustrativePill: 'Các mảnh thông tin mẫu có thể được sắp xếp thành bản nháp',
  scrollCue: 'Bắt đầu từ những mảnh thông tin rời rạc',
};

// ============================================================================
// STABLE PINS (Bản đồ / Planning Table)
// ============================================================================

export const LANDING_PINS: LandingPin[] = [
  {
    id: 'pin-lake-garden',
    name: 'Vườn ven hồ',
    category: 'scenic',
    coords: { x: 26, y: 34 },
    day: 1,
    shortLabel: 'Hồ',
    description: 'Không gian tĩnh lặng, mặt nước sớm mai phản chiếu đồi thông.',
  },
  {
    id: 'pin-corner-tea',
    name: 'Quán trà & cà phê góc phố',
    category: 'dining',
    coords: { x: 38, y: 42 },
    day: 1,
    shortLabel: 'Trà',
    description: 'Quán nhỏ hiên gỗ, trà nóng và bánh mộc mạc địa phương.',
  },
  {
    id: 'pin-sunset-hill',
    name: 'Điểm ngắm hoàng hôn đồi xa',
    category: 'scenic',
    coords: { x: 78, y: 18 },
    day: 1,
    shortLabel: 'Hoàng hôn',
    description: 'Vọng cảnh đón chiều tà trên đỉnh dốc, quãng di chuyển xa hơn trung tâm.',
  },
  {
    id: 'pin-hillside-lodge',
    name: 'Nhà gỗ bên sườn đồi',
    category: 'stay',
    coords: { x: 32, y: 54 },
    day: 1,
    shortLabel: 'Lưu trú',
    description: 'Nơi lưu trú tĩnh mịch giữa vườn cây, tiện nghỉ ngơi giữa các buổi.',
  },
  {
    id: 'pin-creek-village',
    name: 'Làng cổ ven suối',
    category: 'culture',
    coords: { x: 56, y: 64 },
    day: 2,
    shortLabel: 'Làng',
    description: 'Đường lát đá, nếp nhà gỗ truyền thống và bờ suối râm mát.',
  },
  {
    id: 'pin-craft-workshop',
    name: 'Xưởng thủ công truyền thống',
    category: 'culture',
    coords: { x: 68, y: 72 },
    day: 2,
    shortLabel: 'Xưởng',
    description: 'Trải nghiệm làm đồ gốm và đan lát cùng nghệ nhân bản địa.',
  },
  {
    id: 'pin-pine-ridge',
    name: 'Điểm ngắm cảnh đồi thông',
    category: 'scenic',
    coords: { x: 82, y: 46 },
    day: 3,
    shortLabel: 'Đồi thông',
    description: 'Cung đường thông reo khoáng đạt mở lối về thung lũng, điểm kết của lịch trình.',
  },
];

// ============================================================================
// 5 NHÓM THÔNG TIN RỜI RẠC (Section 2: Beat A & B)
// ============================================================================

export const LANDING_CLUSTERS: LandingCluster[] = [
  {
    id: 'cluster-places',
    title: 'Địa điểm & Cảnh quan',
    badge: 'Từ ảnh cảm hứng',
    snippet: 'Vườn ven hồ sương sớm, đồi thông cao nguyên và làng cổ ven suối.',
    pinId: 'pin-lake-garden',
    status: 'scattered',
    position: { x: 22, y: 28 },
    conflictWarning: 'Hai điểm tham quan cách xa nhau trong cùng buổi chiều.',
  },
  {
    id: 'cluster-dining',
    title: 'Ẩm thực & Nghỉ chân',
    badge: 'Gợi ý bản địa',
    snippet: 'Quán trà góc phố yên tĩnh, mâm cơm ấm cúng vùng cao.',
    pinId: 'pin-corner-tea',
    status: 'scattered',
    position: { x: 42, y: 38 },
  },
  {
    id: 'cluster-stay',
    title: 'Lưu trú đề xuất',
    badge: 'Phù hợp nhịp thư thả',
    snippet: 'Nhà gỗ sườn đồi thoáng đãng, gần cụm điểm sáng ngày đầu.',
    pinId: 'pin-hillside-lodge',
    status: 'scattered',
    position: { x: 30, y: 58 },
  },
  {
    id: 'cluster-transit',
    title: 'Cung đường di chuyển',
    badge: 'Đoạn nối cần cân đối',
    snippet: 'Chặng lên đồi xa mất nhiều thời gian, dễ gây cập rập buổi chiều.',
    pinId: 'pin-sunset-hill',
    status: 'conflicted',
    position: { x: 68, y: 22 },
    conflictWarning: 'Chưa đủ thời gian nghỉ ngơi nếu giữ cả 3 điểm trong ngày đầu.',
  },
  {
    id: 'cluster-pace',
    title: 'Nhịp độ mong muốn',
    badge: 'Ưu tiên người dùng',
    snippet: 'Dành nhiều khoảng thở tự do, giảm tối đa thời gian ngồi xe.',
    pinId: 'pin-lake-garden',
    status: 'scattered',
    position: { x: 50, y: 52 },
  },
];

// ============================================================================
// HOẠT ĐỘNG BAN ĐẦU (INITIAL DRAFT) VÀ BIẾN THỂ ÍT DI CHUYỂN
// ============================================================================

const DRAFT_ACTIVITIES_DAY_1: LandingActivity[] = [
  {
    id: 'act-d1-lake',
    dayNumber: 1,
    timeSlot: 'morning',
    timeLabel: '08:30 – 10:30',
    title: 'Dạo sương sớm Vườn ven hồ',
    locationName: 'Vườn ven hồ',
    pinId: 'pin-lake-garden',
    description: 'Tản bộ ven mặt nước tĩnh lặng, đón nắng sớm xuyên tán thông.',
    decisionStatus: 'proposed',
    reviewFlag: 'flexible',
    reviewNote: 'Thời điểm ngắm sương đẹp nhất vào sáng sớm.',
    impactTag: 'Gần điểm hẹn',
  },
  {
    id: 'act-d1-tea',
    dayNumber: 1,
    timeSlot: 'lunch',
    timeLabel: '11:00 – 13:00',
    title: 'Nghỉ trưa & thưởng trà hiên gỗ',
    locationName: 'Quán trà & cà phê góc phố',
    pinId: 'pin-corner-tea',
    description: 'Thưởng thức trà nóng và các món nhẹ bản địa trong không gian mộc mạc.',
    decisionStatus: 'proposed',
    reviewFlag: 'flexible',
    reviewNote: 'Quán trà nhỏ địa phương, có thể ghé theo cảm hứng.',
    impactTag: 'Cùng khu vực',
  },
  {
    id: 'act-d1-distant-view',
    dayNumber: 1,
    timeSlot: 'afternoon',
    timeLabel: '14:30 – 17:30',
    title: 'Đón hoàng hôn trên đồi xa',
    locationName: 'Điểm ngắm hoàng hôn đồi xa',
    pinId: 'pin-sunset-hill',
    description: 'Ngắm nhìn toàn cảnh thung lũng từ trên cao khi chiều buông.',
    decisionStatus: 'proposed',
    reviewFlag: 'needs_review',
    reviewNote: 'Đường dốc và cách xa cụm sáng, cần kiểm tra thời tiết chiều.',
    impactTag: 'Chặng di chuyển dài',
  },
];

const LESS_TRAVEL_ACTIVITIES_DAY_1: LandingActivity[] = [
  {
    id: 'act-d1-lake',
    dayNumber: 1,
    timeSlot: 'morning',
    timeLabel: '08:30 – 10:30',
    title: 'Dạo sương sớm Vườn ven hồ',
    locationName: 'Vườn ven hồ',
    pinId: 'pin-lake-garden',
    description: 'Tản bộ ven mặt nước tĩnh lặng, đón nắng sớm xuyên tán thông.',
    decisionStatus: 'proposed',
    reviewFlag: 'flexible',
    reviewNote: 'Thời điểm ngắm sương đẹp nhất vào sáng sớm.',
    impactTag: 'Ít di chuyển',
  },
  {
    id: 'act-d1-tea',
    dayNumber: 1,
    timeSlot: 'lunch',
    timeLabel: '11:00 – 13:00',
    title: 'Nghỉ trưa & thưởng trà hiên gỗ',
    locationName: 'Quán trà & cà phê góc phố',
    pinId: 'pin-corner-tea',
    description: 'Thưởng thức trà nóng và các món nhẹ bản địa trong không gian mộc mạc.',
    decisionStatus: 'proposed',
    reviewFlag: 'flexible',
    reviewNote: 'Cùng cụm bán kính gần với điểm sáng.',
    impactTag: 'Gần nơi ở',
  },
  {
    id: 'act-d1-rest-flexible',
    dayNumber: 1,
    timeSlot: 'afternoon',
    timeLabel: '14:00 – 17:00',
    title: 'Chiều thư thả tại Nhà gỗ sườn đồi',
    locationName: 'Nhà gỗ bên sườn đồi',
    pinId: 'pin-hillside-lodge',
    description: 'Nhận phòng, đọc sách bên hiên hoặc dạo vườn tự do, không phải di chuyển xa.',
    decisionStatus: 'proposed',
    reviewFlag: 'flexible',
    reviewNote: 'Thời gian hoàn toàn tự do theo cảm hứng.',
    impactTag: 'Thêm khoảng nghỉ',
  },
];

const COMMON_ACTIVITIES_DAY_2: LandingActivity[] = [
  {
    id: 'act-d2-village',
    dayNumber: 2,
    timeSlot: 'morning',
    timeLabel: '09:00 – 11:30',
    title: 'Tản bộ qua Làng cổ ven suối',
    locationName: 'Làng cổ ven suối',
    pinId: 'pin-creek-village',
    description: 'Ghé thăm những nếp nhà gỗ xưa, nghe tiếng suối reo và tìm hiểu đời sống mộc mạc.',
    decisionStatus: 'proposed',
    reviewFlag: 'flexible',
    reviewNote: 'Nên mang giày mềm bám đá ven bờ suối.',
    impactTag: 'Không gian xanh',
  },
  {
    id: 'act-d2-craft',
    dayNumber: 2,
    timeSlot: 'afternoon',
    timeLabel: '14:00 – 16:30',
    title: 'Trải nghiệm tại Xưởng thủ công',
    locationName: 'Xưởng thủ công truyền thống',
    pinId: 'pin-craft-workshop',
    description: 'Tự tay làm một vật lưu niệm gốm nhỏ cùng các nghệ nhân bản địa.',
    decisionStatus: 'proposed',
    reviewFlag: 'needs_review',
    reviewNote: 'Cần kiểm tra giờ mở cửa theo mùa tại xưởng.',
    impactTag: 'Văn hóa bản địa',
  },
];

const COMMON_ACTIVITIES_DAY_3: LandingActivity[] = [
  {
    id: 'act-d3-pine-ridge',
    dayNumber: 3,
    timeSlot: 'morning',
    timeLabel: '08:30 – 11:00',
    title: 'Đón gió sớm tại Điểm ngắm cảnh đồi thông',
    locationName: 'Điểm ngắm cảnh đồi thông',
    pinId: 'pin-pine-ridge',
    description: 'Hít thở không khí khoáng đạt và ngắm thung lũng thông trải dài phía dưới.',
    decisionStatus: 'proposed',
    reviewFlag: 'flexible',
    reviewNote: 'Góc nhìn nối dài sang thung lũng mở ra chuyến đi thực tế.',
    impactTag: 'Điểm nhấn kết thúc',
  },
  {
    id: 'act-d3-farewell',
    dayNumber: 3,
    timeSlot: 'lunch',
    timeLabel: '11:30 – 13:30',
    title: 'Bữa trưa ấm cúng & dạo bước chào tạm biệt',
    locationName: 'Quán nhỏ ven đồi thông',
    pinId: 'pin-pine-ridge',
    description: 'Dành chút thời gian tĩnh lặng trước khi khởi hành trở về.',
    decisionStatus: 'proposed',
    reviewFlag: 'flexible',
    reviewNote: 'Thời gian dừng chân thư thả trước khi rời thị trấn.',
    impactTag: 'Thư thái',
  },
];

// ============================================================================
// CÁC TUYẾN ĐƯỜNG MINH HỌA (SVG PATHS TRÊN MAP CANVAS 100x100)
// ============================================================================

export const LANDING_ROUTES: LandingRouteSegment[] = [
  {
    id: 'route-d1-draft',
    dayNumber: 1,
    mode: 'initial_draft',
    points: [
      { x: 26, y: 34, pinId: 'pin-lake-garden' },
      { x: 38, y: 42, pinId: 'pin-corner-tea' },
      { x: 78, y: 18, pinId: 'pin-sunset-hill' },
    ],
    svgPath: 'M 26 34 Q 32 38 38 42 T 78 18',
    qualitativeDistance: 'Đoạn di chuyển dài kéo sang đồi xa',
    isHighlighted: false,
  },
  {
    id: 'route-d1-compact',
    dayNumber: 1,
    mode: 'less_travel',
    points: [
      { x: 26, y: 34, pinId: 'pin-lake-garden' },
      { x: 38, y: 42, pinId: 'pin-corner-tea' },
      { x: 32, y: 54, pinId: 'pin-hillside-lodge' },
    ],
    svgPath: 'M 26 34 Q 34 38 38 42 Q 36 48 32 54',
    qualitativeDistance: 'Gom cụm gần nhau, hành trình êm dịu',
    isHighlighted: true,
  },
  {
    id: 'route-d2',
    dayNumber: 2,
    mode: 'standard',
    points: [
      { x: 32, y: 54, pinId: 'pin-hillside-lodge' },
      { x: 56, y: 64, pinId: 'pin-creek-village' },
      { x: 68, y: 72, pinId: 'pin-craft-workshop' },
    ],
    svgPath: 'M 32 54 Q 44 60 56 64 T 68 72',
    qualitativeDistance: 'Tuyến làng cổ nội vùng râm mát',
  },
  {
    id: 'route-d3',
    dayNumber: 3,
    mode: 'standard',
    points: [
      { x: 32, y: 54, pinId: 'pin-hillside-lodge' },
      { x: 82, y: 46, pinId: 'pin-pine-ridge' },
      { x: 96, y: 40 }, // Điểm phóng ra mép canvas, khớp với vị trí đầu lối mòn trong final-journey.jpg
    ],
    svgPath: 'M 32 54 Q 58 50 82 46 Q 90 43 96 40',
    qualitativeDistance: 'Đường thông reo nối sang khung cảnh thực tế',
  },
];

// ============================================================================
// TRANSCRIPT HỘI THOẠI MINH HỌA (Section 3: Cùng xây)
// ============================================================================

export const LANDING_TRANSCRIPT: LandingTranscriptItem[] = [
  {
    id: 'msg-1',
    sender: 'ai',
    content: 'Đây là bản nháp với ba điểm tham quan trong ngày đầu.',
    timestampLabel: 'Đề xuất ban đầu',
  },
  {
    id: 'msg-2',
    sender: 'user',
    content: 'Ngày đầu nhẹ hơn và ít di chuyển hơn nhé.',
    timestampLabel: 'Định hướng của bạn',
  },
  {
    id: 'msg-3',
    sender: 'ai',
    content: 'Mình đã gom hai điểm gần nhau vào buổi sáng, để buổi chiều linh hoạt hơn.',
    timestampLabel: 'Cập nhật theo ý bạn',
  },
];

// ============================================================================
// KHỞI TẠO STATE & HÀM CHUYỂN TRẠNG THÁI (PURE FUNCTIONS)
// ============================================================================

export function buildDays(preference: 'default' | 'less_travel', day1CustomActivities?: LandingActivity[]): LandingDay[] {
  const day1Activities = day1CustomActivities ?? (preference === 'less_travel' ? LESS_TRAVEL_ACTIVITIES_DAY_1 : DRAFT_ACTIVITIES_DAY_1);

  return [
    {
      dayNumber: 1,
      dayTitle: 'Ngày 1 — Khởi đầu êm dịu',
      pace: preference === 'less_travel' ? 'Thư thả · Ít di chuyển' : 'Vừa phải · Khám phá',
      highlight: preference === 'less_travel' ? 'Vườn ven hồ & Chiều tự do tại nhà gỗ' : 'Vườn ven hồ & Đón hoàng hôn đồi xa',
      routeSummary: preference === 'less_travel' ? 'Gom cụm gần hồ, chiều linh hoạt nghỉ ngơi' : '3 điểm trải rộng, có chặng di chuyển dài',
      activities: day1Activities.map((act) => ({ ...act })),
    },
    {
      dayNumber: 2,
      dayTitle: 'Ngày 2 — Không gian xanh & văn hóa',
      pace: 'Thư thả · Tìm hiểu',
      highlight: 'Làng cổ ven suối & Xưởng thủ công bản địa',
      routeSummary: 'Cung đường râm mát nội vùng ven suối',
      activities: COMMON_ACTIVITIES_DAY_2.map((act) => ({ ...act })),
    },
    {
      dayNumber: 3,
      dayTitle: 'Ngày 3 — Thư thái trước khi về',
      pace: 'Nhẹ nhàng · Tận hưởng',
      highlight: 'Đón gió sớm đồi thông & Bữa trưa chia tay',
      routeSummary: 'Cung đường thông reo mở lối vào cảnh thực tế',
      activities: COMMON_ACTIVITIES_DAY_3.map((act) => ({ ...act })),
    },
  ];
}

export function createInitialLandingState(): LandingTripState {
  const preference = 'default';
  const days = buildDays(preference);

  return {
    tripTitle: 'Hành trình 3 ngày thư thả',
    disclaimer: 'Kế hoạch chuyến đi không đồng nghĩa với việc đã đặt vé hoặc chỗ ở.',
    preference,
    days,
    pins: LANDING_PINS.map((p) => ({ ...p })),
    clusters: LANDING_CLUSTERS.map((c) => ({ ...c })),
    routes: LANDING_ROUTES.map((r) => ({ ...r })),
    transcript: LANDING_TRANSCRIPT.map((t) => ({ ...t })),
    hasSelectedAny: false,
    isConfirmed: false,
    editingItemId: null,
    changeNote: 'Bản nháp ban đầu do AI đề xuất từ mong muốn của bạn.',
    displacedActivities: [],
  };
}

/**
 * Áp dụng ưu tiên "Ít di chuyển" hoặc quay lại mặc định.
 * - Thay đổi bố cục bản nháp Ngày 1 và route Ngày 1; Ngày 2 và Ngày 3 giữ nguyên.
 * - KHÔNG tự động đánh dấu bất kỳ mục nào thành 'selected'. Chỉ giữ lại cờ 'selected' nếu người dùng ĐÃ chọn trước đó.
 * - Nếu một mục đã chọn bị thay thế bởi ưu tiên mới (ví dụ "Đồi xa" bị thay bằng "Nhà gỗ sườn đồi"),
 *   mục đó không bị mất âm thầm mà được lưu vào `displacedActivities` để có thể khôi phục bất cứ lúc nào.
 * - Phương án thay thế mới KHÔNG bị tự động gán là 'selected'.
 * - hasSelectedAny được tính toán lại chính xác theo các hoạt động đang có trong lịch trình.
 */
export function applyPreference(state: LandingTripState, preference: 'default' | 'less_travel'): LandingTripState {
  const currentDay1 = state.days.find((d) => d.dayNumber === 1);
  
  // Thu thập toàn bộ các mục đã từng được chọn (từ ngày 1 hiện hành và từ danh sách displaced trước đó)
  const allPreviouslySelected = [
    ...(currentDay1?.activities ?? []).filter((a) => a.decisionStatus === 'selected'),
    ...(state.displacedActivities ?? []).filter((a) => a.decisionStatus === 'selected'),
  ];
  const preservedSelectedIds = new Set(allPreviouslySelected.map((a) => a.id));

  const baseActivities = preference === 'less_travel' ? LESS_TRAVEL_ACTIVITIES_DAY_1 : DRAFT_ACTIVITIES_DAY_1;

  const updatedDay1Activities: LandingActivity[] = baseActivities.map((act) => {
    const isPreviouslySelected = preservedSelectedIds.has(act.id);
    return {
      ...act,
      decisionStatus: isPreviouslySelected ? 'selected' : 'proposed',
    };
  });

  // Lưu các mục đã chọn bị thay thế (không nằm trong baseActivities của ưu tiên mới)
  const displacedActivities = allPreviouslySelected.filter(
    (act) => !baseActivities.some((b) => b.id === act.id)
  );

  const updatedDays: LandingDay[] = state.days.map((day) => {
    if (day.dayNumber === 1) {
      return {
        ...day,
        pace: preference === 'less_travel' ? 'Thư thả · Ít di chuyển' : 'Vừa phải · Khám phá',
        highlight: preference === 'less_travel' ? 'Vườn ven hồ & Chiều tự do tại nhà gỗ' : 'Vườn ven hồ & Đón hoàng hôn đồi xa',
        routeSummary: preference === 'less_travel' ? 'Gom cụm gần hồ, chiều linh hoạt nghỉ ngơi' : '3 điểm trải rộng, có chặng di chuyển dài',
        activities: updatedDay1Activities,
      };
    }
    return day;
  });

  const updatedRoutes: LandingRouteSegment[] = state.routes.map((route) => {
    if (route.dayNumber === 1) {
      if (preference === 'less_travel') {
        return {
          ...route,
          mode: 'less_travel',
          svgPath: 'M 26 34 Q 34 38 38 42 Q 36 48 32 54',
          qualitativeDistance: 'Gom cụm gần nhau, hành trình êm dịu',
          isHighlighted: true,
        };
      } else {
        return {
          ...route,
          mode: 'initial_draft',
          svgPath: 'M 26 34 Q 32 38 38 42 T 78 18',
          qualitativeDistance: 'Đoạn di chuyển dài kéo sang đồi xa',
          isHighlighted: false,
        };
      }
    }
    return route;
  });

  const hasSelectedAny = updatedDays.some((d) => d.activities.some((a) => a.decisionStatus === 'selected'));

  let changeNote = preference === 'less_travel'
    ? 'Đã áp dụng ưu tiên "Ít di chuyển": gom điểm sáng gần nhau và để buổi chiều linh hoạt.'
    : 'Đã hoàn về bản nháp ban đầu của AI.';

  if (displacedActivities.length > 0) {
    const displacedNames = displacedActivities.map((a) => `"${a.title}"`).join(', ');
    const activePrefName = preference === 'less_travel' ? 'Ít di chuyển' : 'Bản nháp ban đầu';
    changeNote = `Ưu tiên "${activePrefName}" tạm thay thế mục ${displacedNames} bạn đã chọn trước đó. Lựa chọn này được bảo toàn và có thể khôi phục bất cứ lúc nào.`;
  }

  return {
    ...state,
    preference,
    days: updatedDays,
    routes: updatedRoutes,
    displacedActivities,
    hasSelectedAny,
    isConfirmed: false, // Thay đổi ưu tiên yêu cầu người dùng rà soát lại trước khi xác nhận
    changeNote,
  };
}

/**
 * Suy diễn tuyến đường từ danh sách hoạt động hiện hành (bỏ qua các mục skipped).
 * Tránh nối đến các điểm không có mặt trên bản đồ và phản ánh chính xác thứ tự sắp xếp.
 */
export function buildRouteSegmentForDay(
  dayNumber: 1 | 2 | 3,
  activities: LandingActivity[],
  pins: LandingPin[] = LANDING_PINS
): LandingRouteSegment | null {
  const unskippedActs = activities.filter((a) => a.decisionStatus !== 'skipped');
  const points: LandingRoutePoint[] = [];

  for (const act of unskippedActs) {
    const pin = pins.find((p) => p.id === act.pinId);
    if (pin) {
      const prev = points[points.length - 1];
      if (!prev || prev.x !== pin.coords.x || prev.y !== pin.coords.y) {
        points.push({ x: pin.coords.x, y: pin.coords.y, pinId: pin.id });
      }
    }
  }

  // Ngày 3 kết nối từ điểm ngắm đồi thông ra mép canvas mở lối vào ảnh final-journey
  if (dayNumber === 3 && points.length > 0) {
    points.push({ x: 96, y: 40 });
  }

  if (points.length < 2) return null;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    d += ` Q ${midX} ${midY} ${curr.x} ${curr.y}`;
  }

  return {
    id: `route-d${dayNumber}`,
    dayNumber,
    mode: 'standard',
    points,
    svgPath: d,
    qualitativeDistance:
      dayNumber === 1
        ? 'Chặng ngày đầu theo các điểm đã chọn'
        : dayNumber === 2
        ? 'Tuyến làng cổ nội vùng râm mát'
        : 'Đường thông reo nối sang khung cảnh thực tế',
    isHighlighted: dayNumber === 1,
  };
}

// ============================================================================
// SHARED GRAPH CONTRACT & VALIDATION (V4-FND-02)
// ============================================================================

export type EntryPointType = 'destination' | 'restaurant' | 'attraction' | 'activity';

export type EntryPointState =
  | 'default'
  | 'highlighted'
  | 'candidate'
  | 'selected'
  | 'ai-suggested'
  | 'dimmed'
  | 'locked-by-user'
  | 'active-journey'
  | 'completed';

export type EdgeState =
  | 'noisy'
  | 'kept'
  | 'removed'
  | 'draft'
  | 'user-added'
  | 'confirmed'
  | 'active'
  | 'completed';

export type PlanState =
  | 'discovery'
  | 'noisyGraph'
  | 'prunedGraph'
  | 'draftRoute'
  | 'userEdited'
  | 'confirmed'
  | 'journey';

export interface EntryPoint {
  id: string;
  type: EntryPointType;
  position: { x: number; y: number };
  label: string;
  state: EntryPointState;
  metadata?: {
    category?: string;
    day?: number;
    timeSlot?: string;
    area?: string;
    estimatedMinutes?: number;
    [key: string]: unknown;
  };
  reasons?: string[];
  caution?: string;
  tradeOffs?: string[];
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  state: EdgeState;
  order?: number;
}

export interface PlaceGraphModel {
  planState: PlanState;
  nodes: EntryPoint[];
  edges: GraphEdge[];
}

export interface EdgeValidationResult {
  valid: boolean;
  error?: 'SELF_LOOP' | 'MISSING_SOURCE' | 'MISSING_TARGET' | 'DUPLICATE_EDGE' | 'DEGREE_EXCEEDED';
  message?: string;
}

export function validateNewEdge(
  sourceId: string,
  targetId: string,
  existingEdges: GraphEdge[],
  existingNodes: EntryPoint[],
  maxDegree?: number
): EdgeValidationResult {
  if (sourceId === targetId) {
    return {
      valid: false,
      error: 'SELF_LOOP',
      message: 'Không thể tạo đường nối từ một địa điểm đến chính nó.',
    };
  }

  const sourceExists = existingNodes.some((n) => n.id === sourceId);
  const targetExists = existingNodes.some((n) => n.id === targetId);
  if (!sourceExists) {
    return {
      valid: false,
      error: 'MISSING_SOURCE',
      message: `Điểm xuất phát '${sourceId}' không tồn tại.`,
    };
  }
  if (!targetExists) {
    return {
      valid: false,
      error: 'MISSING_TARGET',
      message: `Điểm kết thúc '${targetId}' không tồn tại.`,
    };
  }

  const isDuplicate = existingEdges.some(
    (e) =>
      e.state !== 'removed' &&
      ((e.sourceId === sourceId && e.targetId === targetId) ||
        (e.sourceId === targetId && e.targetId === sourceId))
  );
  if (isDuplicate) {
    return {
      valid: false,
      error: 'DUPLICATE_EDGE',
      message: 'Đường nối giữa hai địa điểm này đã tồn tại.',
    };
  }

  if (typeof maxDegree === 'number' && maxDegree > 0) {
    const sourceDegree = existingEdges.filter(
      (e) =>
        e.state !== 'removed' && (e.sourceId === sourceId || e.targetId === sourceId)
    ).length;
    const targetDegree = existingEdges.filter(
      (e) =>
        e.state !== 'removed' && (e.sourceId === targetId || e.targetId === targetId)
    ).length;

    if (sourceDegree >= maxDegree) {
      return {
        valid: false,
        error: 'DEGREE_EXCEEDED',
        message: `Địa điểm '${sourceId}' đã đạt giới hạn ${maxDegree} kết nối.`,
      };
    }
    if (targetDegree >= maxDegree) {
      return {
        valid: false,
        error: 'DEGREE_EXCEEDED',
        message: `Địa điểm '${targetId}' đã đạt giới hạn ${maxDegree} kết nối.`,
      };
    }
  }

  return { valid: true };
}

export function createInitialGraphModel(): PlaceGraphModel {
  const nodes: EntryPoint[] = LANDING_PINS.map((pin) => {
    let type: EntryPoint['type'] = 'destination';
    if (pin.category === 'dining') type = 'restaurant';
    else if (pin.category === 'stay') type = 'activity';
    else if (pin.category === 'culture') type = 'attraction';

    return {
      id: pin.id,
      type,
      position: { x: pin.coords.x, y: pin.coords.y },
      label: pin.name,
      state: 'default',
      metadata: {
        category: pin.category,
        day: pin.day,
        shortLabel: pin.shortLabel,
      },
      reasons: [pin.description],
      caution:
        pin.id === 'pin-sunset-hill'
          ? 'Quãng di chuyển xa hơn trung tâm, cần trừ hao thời gian.'
          : undefined,
      tradeOffs:
        pin.id === 'pin-sunset-hill'
          ? [
              'Đồi xa: Khung cảnh hoàng hôn đẹp, nhưng tốn thêm 35 phút di chuyển',
              'Quán trà: Tiện đường, thư thái nhưng không có view bao quát',
            ]
          : undefined,
    };
  });

  const noisyEdges: GraphEdge[] = [
    { id: 'edge-noisy-1', sourceId: 'pin-lake-garden', targetId: 'pin-corner-tea', state: 'noisy' },
    { id: 'edge-noisy-2', sourceId: 'pin-corner-tea', targetId: 'pin-hillside-lodge', state: 'noisy' },
    { id: 'edge-noisy-3', sourceId: 'pin-corner-tea', targetId: 'pin-sunset-hill', state: 'noisy' },
    { id: 'edge-noisy-4', sourceId: 'pin-hillside-lodge', targetId: 'pin-creek-village', state: 'noisy' },
    { id: 'edge-noisy-5', sourceId: 'pin-creek-village', targetId: 'pin-craft-workshop', state: 'noisy' },
    { id: 'edge-noisy-6', sourceId: 'pin-craft-workshop', targetId: 'pin-pine-ridge', state: 'noisy' },
  ];

  return {
    planState: 'noisyGraph',
    nodes,
    edges: noisyEdges,
  };
}

