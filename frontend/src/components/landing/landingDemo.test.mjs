import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialLandingState,
  applyPreference,
  LANDING_ASSETS,
  HERO_MULTIMODAL_INPUT,
  LANDING_PINS,
  LANDING_CLUSTERS,
  LANDING_ROUTES,
  createInitialGraphModel,
  validateNewEdge,
} from './landingDemo.ts';

test('LP-01: Cấu trúc ban đầu của Landing Demo Fixture & Asset Verification', () => {
  const state = createInitialLandingState();

  // Kiểm tra thông tin chuyến đi 3 ngày
  assert.equal(state.days.length, 3, 'Lịch trình phải có đúng 3 ngày');
  assert.equal(state.preference, 'default', 'Ưu tiên ban đầu là default (bản nháp AI)');
  assert.equal(state.isConfirmed, false, 'Kế hoạch ban đầu chưa được xác nhận');
  assert.equal(state.hasSelectedAny, false, 'Ban đầu chưa có hoạt động nào được giữ lại');

  // Kiểm tra các hằng số dùng chung
  assert.equal(LANDING_PINS.length, 7, 'Có 7 pins cố định có ID ổn định');
  assert.equal(LANDING_CLUSTERS.length, 5, 'Có 5 nhóm thông tin rời rạc');
  assert.ok(HERO_MULTIMODAL_INPUT.inspirationNote.promptText, 'Hero có ghi chú mong muốn text');
  assert.equal(HERO_MULTIMODAL_INPUT.inspirationNote.inspirationPhoto, '/landing/hero-inspiration.jpg');

  // Kiểm tra nguồn gốc và bản quyền của 2 Commons assets
  assert.equal(LANDING_ASSETS.heroInspiration.path, '/landing/hero-inspiration.jpg');
  assert.equal(LANDING_ASSETS.heroInspiration.author, 'Nguyễn Tấn Phát');
  assert.equal(LANDING_ASSETS.heroInspiration.license, 'CC BY-SA 3.0');
  assert.equal(LANDING_ASSETS.heroInspiration.sourcePageUrl, 'https://commons.wikimedia.org/wiki/File:Golden_Valley_in_morning_fog.jpg');
  assert.equal(LANDING_ASSETS.heroInspiration.width, 1280);
  assert.equal(LANDING_ASSETS.heroInspiration.height, 960);

  assert.equal(LANDING_ASSETS.finalJourney.path, '/landing/final-journey.jpg');
  assert.equal(LANDING_ASSETS.finalJourney.author, 'nhà khoa học');
  assert.equal(LANDING_ASSETS.finalJourney.license, 'CC BY-SA 3.0');
  assert.equal(LANDING_ASSETS.finalJourney.sourcePageUrl, 'https://commons.wikimedia.org/wiki/File:Đường_lên_Thiền_Viện_Trúc_Lâm-Đà_Lạt.jpg');
  assert.equal(LANDING_ASSETS.finalJourney.width, 2816);
  assert.equal(LANDING_ASSETS.finalJourney.height, 2112);

  // Kiểm tra không có cờ factual 'confirmed' nào trong bản nháp ban đầu
  for (const day of state.days) {
    for (const act of day.activities) {
      assert.notEqual(act.reviewFlag, 'confirmed', `Hoạt động ${act.id} không được gán cờ confirmed khi chưa có dữ liệu thật`);
    }
  }
});

test('LP-01: Bấm "Ít di chuyển" chỉ đổi Ngày 1 và Route 1, bảo toàn Ngày 2 và Ngày 3', () => {
  const state = createInitialLandingState();
  const day2Before = JSON.stringify(state.days[1]);
  const day3Before = JSON.stringify(state.days[2]);

  const lessTravelState = applyPreference(state, 'less_travel');

  assert.equal(lessTravelState.preference, 'less_travel');
  assert.equal(lessTravelState.days[0].pace, 'Thư thả · Ít di chuyển');
  assert.equal(lessTravelState.days[0].activities.length, 3);
  assert.equal(lessTravelState.days[0].activities[2].id, 'act-d1-rest-flexible', 'Chiều ngày 1 chuyển thành nghỉ ngơi tự do');
  assert.equal(lessTravelState.routes[0].mode, 'less_travel', 'Route ngày 1 chuyển sang mode less_travel');

  // Ngày 2 và Ngày 3 phải hoàn toàn giữ nguyên
  assert.equal(JSON.stringify(lessTravelState.days[1]), day2Before, 'Ngày 2 không bị thay đổi');
  assert.equal(JSON.stringify(lessTravelState.days[2]), day3Before, 'Ngày 3 không bị thay đổi');
});

test('LP-09 regression: Khởi tạo ở trạng thái default (chưa áp dụng ưu tiên), toàn bộ route segments và fixture không chứa số liệu km/phút bịa đặt', () => {
  const state = createInitialLandingState();

  // 1. Trạng thái khởi tạo bắt buộc là default (chưa bật ít di chuyển)
  assert.equal(state.preference, 'default', 'Tải mới phải bắt đầu từ bản nháp ban đầu');
  assert.equal(state.isConfirmed, false, 'Chưa xác nhận');
  assert.equal(state.hasSelectedAny, false, 'Chưa chọn mục nào');

  // 2. Kiểm tra các route segments đều dùng qualitativeDistance định tính, không chứa km hoặc phút
  for (const route of LANDING_ROUTES) {
    assert.ok(route.qualitativeDistance, `Route ${route.id} phải có qualitativeDistance`);
    assert.doesNotMatch(route.qualitativeDistance, /\b\d+\s*(km|phút)\b/i, `Route ${route.id} không được chứa số liệu km/phút`);
  }

  // 3. Kiểm tra cluster conflictWarning không chứa số liệu km/phút bịa đặt
  for (const cluster of LANDING_CLUSTERS) {
    if (cluster.conflictWarning) {
      assert.doesNotMatch(cluster.conflictWarning, /\b\d+\s*(km|phút)\b/i, `Cluster ${cluster.id} không được chứa số liệu km/phút`);
    }
  }

  // 4. Đổi preference qua lại không tự ý xác nhận hoặc chọn mục
  const lessTravelState = applyPreference(state, 'less_travel');
  assert.equal(lessTravelState.preference, 'less_travel');
  assert.equal(lessTravelState.hasSelectedAny, false, 'Đổi preference không tự động chọn mục');
  assert.equal(lessTravelState.isConfirmed, false, 'Đổi preference không tự động xác nhận');

  const defaultState = applyPreference(lessTravelState, 'default');
  assert.equal(defaultState.preference, 'default');
  assert.equal(defaultState.hasSelectedAny, false);
  assert.equal(defaultState.isConfirmed, false);
});

test('V4-FND-02: Khởi tạo mô hình đồ thị PlaceGraphModel dùng chung', () => {
  const graph = createInitialGraphModel();

  // 1. Kiểm tra 7 nodes tương thích hoàn toàn với 7 LANDING_PINS
  assert.equal(graph.nodes.length, 7, 'Đồ thị ban đầu phải có đúng 7 điểm');
  const pinIds = LANDING_PINS.map((p) => p.id);
  for (const node of graph.nodes) {
    assert.ok(pinIds.includes(node.id), `Node ID ${node.id} phải thuộc danh sách LANDING_PINS`);
    assert.ok(node.label, 'Mỗi node phải có nhãn rõ ràng');
    assert.ok(typeof node.position.x === 'number' && typeof node.position.y === 'number', 'Tọa độ x, y hợp lệ');
  }

  // 2. Kiểm tra các cạnh ban đầu (noisy edges)
  assert.ok(graph.edges.length > 0, 'Phải có các cạnh khởi tạo');
  for (const edge of graph.edges) {
    assert.notEqual(edge.sourceId, edge.targetId, 'Không có cạnh tự nối (self-loop)');
    assert.ok(pinIds.includes(edge.sourceId), `Điểm xuất phát ${edge.sourceId} phải tồn tại`);
    assert.ok(pinIds.includes(edge.targetId), `Điểm kết thúc ${edge.targetId} phải tồn tại`);
  }
});

test('V4-FND-02 / V4-006A: Kiểm tra hàm xác thực cạnh (validateNewEdge)', () => {
  const graph = createInitialGraphModel();
  const existingEdges = [
    { id: 'e1', sourceId: 'pin-lake-garden', targetId: 'pin-corner-tea', state: 'noisy' },
  ];

  // 1. Từ chối self-loop
  const selfLoopRes = validateNewEdge('pin-lake-garden', 'pin-lake-garden', existingEdges, graph.nodes);
  assert.equal(selfLoopRes.valid, false);
  assert.equal(selfLoopRes.error, 'SELF_LOOP');

  // 2. Từ chối điểm không tồn tại
  const missingSourceRes = validateNewEdge('unknown-source', 'pin-corner-tea', existingEdges, graph.nodes);
  assert.equal(missingSourceRes.valid, false);
  assert.equal(missingSourceRes.error, 'MISSING_SOURCE');

  const missingTargetRes = validateNewEdge('pin-lake-garden', 'unknown-target', existingEdges, graph.nodes);
  assert.equal(missingTargetRes.valid, false);
  assert.equal(missingTargetRes.error, 'MISSING_TARGET');

  // 3. Từ chối cạnh trùng lặp (cùng chiều hoặc ngược chiều)
  const dupResSame = validateNewEdge('pin-lake-garden', 'pin-corner-tea', existingEdges, graph.nodes);
  assert.equal(dupResSame.valid, false);
  assert.equal(dupResSame.error, 'DUPLICATE_EDGE');

  const dupResRev = validateNewEdge('pin-corner-tea', 'pin-lake-garden', existingEdges, graph.nodes);
  assert.equal(dupResRev.valid, false);
  assert.equal(dupResRev.error, 'DUPLICATE_EDGE');

  // 4. Kiểm tra giới hạn bậc tối đa (maxDegree)
  const degreeRes = validateNewEdge(
    'pin-lake-garden',
    'pin-sunset-hill',
    existingEdges,
    graph.nodes,
    1 // Đã có 1 cạnh nối pin-lake-garden
  );
  assert.equal(degreeRes.valid, false);
  assert.equal(degreeRes.error, 'DEGREE_EXCEEDED');

  // 5. Chấp nhận cạnh hợp lệ
  const validRes = validateNewEdge(
    'pin-corner-tea',
    'pin-sunset-hill',
    existingEdges,
    graph.nodes,
    2
  );
  assert.equal(validRes.valid, true);
});



