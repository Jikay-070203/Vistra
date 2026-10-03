import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialLandingState,
  applyPreference,
  keepActivity,
  swapActivitySuggestion,
  skipActivity,
  confirmPlan,
  requestAlternative,
  startEditingItem,
  restoreDisplacedActivity,
  moveActivityOrder,
  addTranscriptMessage,
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

test('LP-01 correction: Bấm "Ít di chuyển" không tự động đánh dấu selected và không đủ điều kiện xác nhận (preference-without-selection)', () => {
  const state = createInitialLandingState();
  assert.equal(state.hasSelectedAny, false);

  const lessTravelState = applyPreference(state, 'less_travel');

  // Kiểm tra tất cả hoạt động ngày 1 vẫn ở trạng thái proposed
  for (const act of lessTravelState.days[0].activities) {
    assert.equal(act.decisionStatus, 'proposed', `Hoạt động ${act.id} phải ở trạng thái proposed sau khi đổi ưu tiên`);
  }

  assert.equal(lessTravelState.hasSelectedAny, false, 'hasSelectedAny phải vẫn là false');

  // Thử xác nhận khi chưa bấm "Giữ lại"
  const confirmResult = confirmPlan(lessTravelState);
  assert.equal(confirmResult.success, false, 'Không được phép xác nhận khi người dùng chưa chọn mục nào');
  assert.equal(confirmResult.state.isConfirmed, false);
});

test('LP-01: Giữ lại mục A ("Giữ lại") và bảo toàn khi sửa mục B', () => {
  let state = createInitialLandingState();

  // Người dùng chọn giữ lại Vườn ven hồ (mục A)
  state = keepActivity(state, 'act-d1-lake');
  const actA = state.days[0].activities.find((a) => a.id === 'act-d1-lake');
  assert.equal(actA?.decisionStatus, 'selected', 'Mục A phải có trạng thái selected');
  assert.equal(state.hasSelectedAny, true, 'hasSelectedAny phải là true');

  // Người dùng đổi đề xuất cho mục B (act-d1-distant-view)
  state = swapActivitySuggestion(state, 'act-d1-distant-view');
  const actAfterSwap = state.days[0].activities.find((a) => a.id === 'act-d1-lake');
  assert.equal(actAfterSwap?.decisionStatus, 'selected', 'Mục A vẫn phải giữ nguyên trạng thái selected');

  const actB = state.days[0].activities.find((a) => a.id === 'act-d1-alt-cafe');
  assert.ok(actB, 'Mục B đã được thay thế bằng phương án đề xuất mới');
  assert.equal(actB?.decisionStatus, 'swapped');
  assert.equal(state.hasSelectedAny, true, 'hasSelectedAny vẫn là true vì mục A vẫn được chọn');

  // Bấm lại vào mục A ("Bỏ chọn"): chuyển về proposed, tính lại hasSelectedAny thành false, bảo toàn trạng thái swapped của mục B
  state = keepActivity(state, 'act-d1-lake');
  const actAUnselected = state.days[0].activities.find((a) => a.id === 'act-d1-lake');
  assert.equal(actAUnselected?.decisionStatus, 'proposed', 'Mục A phải trở về proposed sau khi bỏ chọn');
  assert.equal(state.hasSelectedAny, false, 'hasSelectedAny phải trở về false khi không còn mục selected nào');
  const actBStillSwapped = state.days[0].activities.find((a) => a.id === 'act-d1-alt-cafe');
  assert.equal(actBStillSwapped?.decisionStatus, 'swapped', 'Mục B vẫn bảo toàn trạng thái swapped');
  assert.ok(state.changeNote?.includes('Đã bỏ chọn mục "Dạo sương sớm Vườn ven hồ"'), 'changeNote phản ánh bỏ chọn kèm tên đọc được');
});

test('LP-01 correction: Đổi gợi ý khi chỉ có 1 mục đang selected phải cập nhật hasSelectedAny về false (swap-of-only-selection)', () => {
  let state = createInitialLandingState();

  // Chỉ chọn đúng 1 mục duy nhất là act-d1-distant-view
  state = keepActivity(state, 'act-d1-distant-view');
  assert.equal(state.hasSelectedAny, true);

  // Đổi gợi ý cho đúng mục đó sang mục thay thế
  state = swapActivitySuggestion(state, 'act-d1-distant-view');

  // Mục thay thế có trạng thái 'swapped', không phải 'selected'
  const swappedAct = state.days[0].activities.find((a) => a.id === 'act-d1-alt-cafe');
  assert.ok(swappedAct);
  assert.equal(swappedAct?.decisionStatus, 'swapped');

  // hasSelectedAny phải được tính toán lại thành false
  assert.equal(state.hasSelectedAny, false, 'hasSelectedAny phải trở về false sau khi đổi mục selected duy nhất');

  // Thử xác nhận kế hoạch
  const confirmResult = confirmPlan(state);
  assert.equal(confirmResult.success, false, 'Không thể xác nhận khi không còn mục nào được chọn');
});

test('LP-01: Không cho phép xác nhận khi chưa giữ mục nào (Empty State Safety)', () => {
  const state = createInitialLandingState();
  assert.equal(state.hasSelectedAny, false);

  const result = confirmPlan(state);
  assert.equal(result.success, false, 'Không thể xác nhận kế hoạch rỗng');
  assert.equal(result.state.isConfirmed, false);
});

test('LP-01: Xác nhận thành công khi đã giữ ít nhất 1 mục, giữ nguyên cờ needs_review và không có fixed timestamp bịa đặt', () => {
  let state = createInitialLandingState();
  state = keepActivity(state, 'act-d1-lake');

  const result = confirmPlan(state);
  assert.equal(result.success, true, 'Xác nhận phải thành công');
  assert.equal(result.state.isConfirmed, true);

  // Kiểm tra cờ dữ kiện không bị xóa mất
  const actCraft = result.state.days[1].activities.find((a) => a.id === 'act-d2-craft');
  assert.equal(actCraft?.reviewFlag, 'needs_review', 'Cờ needs_review vẫn phải tồn tại sau khi xác nhận');
});

test('LP-01: Sửa mục sau khi đã xác nhận phải hủy trạng thái confirmed nhưng giữ các lựa chọn', () => {
  let state = createInitialLandingState();
  state = keepActivity(state, 'act-d1-lake');
  state = confirmPlan(state).state;
  assert.equal(state.isConfirmed, true);

  // Người dùng sửa hoặc bỏ qua một hoạt động khác
  state = skipActivity(state, 'act-d2-craft');
  assert.equal(state.isConfirmed, false, 'Trạng thái xác nhận cũ phải bị hủy khi có chỉnh sửa mới');

  // Mục đã chọn trước đó vẫn còn
  const actA = state.days[0].activities.find((a) => a.id === 'act-d1-lake');
  assert.equal(actA?.decisionStatus, 'selected', 'Mục đã chọn trước đó không bị mất');
});

test('LP-01: Yêu cầu phương án khác kèm lý do và điều hướng chỉnh một phần', () => {
  let state = createInitialLandingState();
  state = requestAlternative(state, 'act-d1-distant-view', 'too_dense');

  assert.ok(state.changeNote?.includes('lịch quá dày'), 'Ghi nhận lý do yêu cầu phương án khác');
  assert.ok(state.days[0].activities.some((a) => a.id === 'act-d1-alt-cafe'));

  // Test startEditingItem
  state = startEditingItem(state, 'act-d1-alt-cafe');
  assert.equal(state.editingItemId, 'act-d1-alt-cafe');
});

test('LP-05: Bấm "Ít di chuyển" khi đã chọn mục A bảo toàn trạng thái selected của mục A, cập nhật route Ngày 1 và không ảnh hưởng Ngày 2/3', () => {
  let state = createInitialLandingState();
  // Giữ lại mục Vườn ven hồ (mục A của Ngày 1)
  state = keepActivity(state, 'act-d1-lake');
  assert.equal(state.days[0].activities[0].decisionStatus, 'selected');
  assert.equal(state.hasSelectedAny, true);

  const day2Before = JSON.stringify(state.days[1]);
  const day3Before = JSON.stringify(state.days[2]);

  // Bấm "Ít di chuyển"
  state = applyPreference(state, 'less_travel');

  // Mục A vẫn phải được giữ là 'selected'
  const actA = state.days[0].activities.find((a) => a.id === 'act-d1-lake');
  assert.equal(actA?.decisionStatus, 'selected', 'Mục A vẫn phải là selected sau khi đổi ưu tiên');

  // Hoạt động mới (chiều linh hoạt) là 'proposed'
  const actRest = state.days[0].activities.find((a) => a.id === 'act-d1-rest-flexible');
  assert.equal(actRest?.decisionStatus, 'proposed', 'Mục mới thay thế là proposed');

  // hasSelectedAny vẫn là true
  assert.equal(state.hasSelectedAny, true);

  // Route ngày 1 chuyển sang less_travel
  assert.equal(state.routes[0].mode, 'less_travel');

  // Ngày 2 và Ngày 3 không đổi
  assert.equal(JSON.stringify(state.days[1]), day2Before, 'Ngày 2 không bị thay đổi');
  assert.equal(JSON.stringify(state.days[2]), day3Before, 'Ngày 3 không bị thay đổi');

  // Bỏ qua một hoạt động khác (act-d1-tea) không làm mất mục A đã chọn
  state = skipActivity(state, 'act-d1-tea');
  const actAfterSkip = state.days[0].activities.find((a) => a.id === 'act-d1-lake');
  assert.equal(actAfterSkip?.decisionStatus, 'selected', 'Mục A vẫn là selected sau khi bỏ qua mục khác');
  const actTea = state.days[0].activities.find((a) => a.id === 'act-d1-tea');
  assert.equal(actTea?.decisionStatus, 'skipped');
  assert.equal(state.hasSelectedAny, true);
});

test('LP-05 corrective: Chọn "Đồi xa" rồi bấm "Ít di chuyển" không làm mất lựa chọn, lưu vào displacedActivities, không tự chọn thay thế và khôi phục được', () => {
  let state = createInitialLandingState();
  // Người dùng chọn "Đón hoàng hôn trên đồi xa" (mục chặng dài ở bản nháp ban đầu)
  state = keepActivity(state, 'act-d1-distant-view');
  assert.equal(state.hasSelectedAny, true);

  // Chuyển sang "Ít di chuyển"
  state = applyPreference(state, 'less_travel');

  // Mục thay thế (Nhà gỗ sườn đồi) không được tự động chọn
  const actRest = state.days[0].activities.find((a) => a.id === 'act-d1-rest-flexible');
  assert.equal(actRest?.decisionStatus, 'proposed', 'Phương án thay thế không được tự động thành selected');

  // Mục "Đồi xa" không bị mất âm thầm, được lưu trong displacedActivities
  assert.equal(state.displacedActivities?.length, 1, 'Mục bị thay thế được giữ trong displacedActivities');
  assert.equal(state.displacedActivities[0].id, 'act-d1-distant-view');
  assert.equal(state.displacedActivities[0].decisionStatus, 'selected');
  assert.ok(state.changeNote?.includes('Đón hoàng hôn trên đồi xa'), 'Có thông báo giải thích rõ ràng');

  // Không cho phép xác nhận kế hoạch khi mục duy nhất đã chọn đang bị displaced khỏi lịch hiện hành
  const confirmResult = confirmPlan(state);
  assert.equal(confirmResult.success, false, 'Không tự động xác nhận khi mục đã chọn bị displaced');

  // Khôi phục: quay về default hoặc khôi phục mục bị displaced
  state = restoreDisplacedActivity(state, 'act-d1-distant-view');
  const restoredAct = state.days[0].activities.find((a) => a.id === 'act-d1-distant-view');
  assert.equal(restoredAct?.decisionStatus, 'selected', 'Mục "Đồi xa" được khôi phục nguyên vẹn trạng thái selected');
  assert.equal(state.displacedActivities?.length, 0, 'displacedActivities được xóa sau khi khôi phục');
  assert.equal(state.hasSelectedAny, true, 'hasSelectedAny trở lại true');
});

test('LP-05 reciprocal: Chọn mục chỉ có ở "Ít di chuyển" (Nhà gỗ), chuyển về default, khôi phục lại và assert được chọn, displaced list xóa, ngày 2/3 nguyên vẹn', () => {
  let state = createInitialLandingState();
  // Chọn thêm mục A (Vườn ven hồ) để kiểm tra việc bảo toàn lựa chọn khác
  state = keepActivity(state, 'act-d1-lake');

  // Chuyển sang "Ít di chuyển"
  state = applyPreference(state, 'less_travel');
  assert.equal(state.days[0].activities[0].decisionStatus, 'selected');

  // Người dùng chọn hoạt động chỉ có ở Ít di chuyển: Nhà gỗ sườn đồi
  state = keepActivity(state, 'act-d1-rest-flexible');
  assert.equal(state.days[0].activities[2].id, 'act-d1-rest-flexible');
  assert.equal(state.days[0].activities[2].decisionStatus, 'selected');

  const day2Before = JSON.stringify(state.days[1]);
  const day3Before = JSON.stringify(state.days[2]);

  // Chuyển về "default" (bản nháp ban đầu)
  state = applyPreference(state, 'default');

  // Mục Vườn ven hồ (mục chung) vẫn là selected
  assert.equal(state.days[0].activities[0].id, 'act-d1-lake');
  assert.equal(state.days[0].activities[0].decisionStatus, 'selected');

  // Mục Đồi xa (thay thế ở default) là proposed, không bị tự động chọn
  const actDistant = state.days[0].activities.find((a) => a.id === 'act-d1-distant-view');
  assert.equal(actDistant?.decisionStatus, 'proposed');

  // Mục Nhà gỗ sườn đồi được lưu vào displacedActivities với trạng thái selected
  assert.equal(state.displacedActivities?.length, 1);
  assert.equal(state.displacedActivities[0].id, 'act-d1-rest-flexible');
  assert.equal(state.displacedActivities[0].decisionStatus, 'selected');
  assert.ok(state.changeNote?.includes('Chiều thư thả tại Nhà gỗ sườn đồi'));

  // Khôi phục mục Nhà gỗ sườn đồi
  state = restoreDisplacedActivity(state, 'act-d1-rest-flexible');

  // Assert: ưu tiên quay lại less_travel
  assert.equal(state.preference, 'less_travel');

  // Assert: mục Nhà gỗ sườn đồi được chọn trở lại
  const restoredRest = state.days[0].activities.find((a) => a.id === 'act-d1-rest-flexible');
  assert.equal(restoredRest?.decisionStatus, 'selected', 'Nhà gỗ sườn đồi phải là selected trở lại');

  // Assert: mục Vườn ven hồ vẫn là selected
  const actLake = state.days[0].activities.find((a) => a.id === 'act-d1-lake');
  assert.equal(actLake?.decisionStatus, 'selected', 'Lựa chọn Vườn ven hồ vẫn được bảo toàn');

  // Assert: displaced list được xóa sạch
  assert.equal(state.displacedActivities?.length, 0, 'displacedActivities phải rỗng sau khi khôi phục');

  // Assert: ngày 2 và 3 vẫn hoàn toàn nguyên vẹn
  assert.equal(JSON.stringify(state.days[1]), day2Before, 'Ngày 2 giữ nguyên');
  assert.equal(JSON.stringify(state.days[2]), day3Before, 'Ngày 3 giữ nguyên');
});

test('LP-06: Xác nhận và chỉnh một phần: Bắt đầu trống không thể xác nhận → Giữ mục A → Xác nhận thành công → Chỉnh mục B kèm lý do → Hủy cờ confirmed, bảo toàn mục A, cờ needs_review giữ nguyên → Xác nhận lại thành công', () => {
  let state = createInitialLandingState();

  // 1. Ban đầu chưa giữ mục nào -> không thể xác nhận (Empty State)
  const initialConfirm = confirmPlan(state);
  assert.equal(initialConfirm.success, false, 'Không thể xác nhận khi chưa giữ mục nào');
  assert.equal(state.isConfirmed, false);
  assert.ok(initialConfirm.message.includes('Chưa có mục nào được giữ lại'));

  // 2. Người dùng giữ lại mục A (Vườn ven hồ)
  state = keepActivity(state, 'act-d1-lake');
  assert.equal(state.hasSelectedAny, true);
  assert.ok(state.changeNote?.includes('Dạo sương sớm Vườn ven hồ'), 'keepActivity changeNote phải dùng tên hoạt động đọc được');
  assert.ok(!state.changeNote?.includes('act-d1-lake'), 'keepActivity changeNote không được chứa raw internal ID');

  // 3. Người dùng bấm "Xác nhận kế hoạch" -> thành công inline
  const confirmResult = confirmPlan(state);
  assert.equal(confirmResult.success, true, 'Xác nhận thành công khi đã có ít nhất 1 mục được chọn');
  state = confirmResult.state;
  assert.equal(state.isConfirmed, true);
  assert.ok(confirmResult.message.includes('không đồng nghĩa với việc đã đặt vé hoặc chỗ ở'));

  // 4. Người dùng bấm "Chỉnh một phần" vào mục B (act-d1-distant-view)
  state = startEditingItem(state, 'act-d1-distant-view');
  assert.equal(state.editingItemId, 'act-d1-distant-view');
  assert.ok(state.changeNote?.includes('Đón hoàng hôn trên đồi xa'), 'startEditingItem changeNote phải dùng tên hoạt động đọc được');
  assert.ok(!state.changeNote?.includes('act-d1-distant-view'), 'startEditingItem changeNote không được chứa raw internal ID');

  // 5. Người dùng yêu cầu phương án khác với lý do "lịch quá dày" (too_dense)
  state = requestAlternative(state, 'act-d1-distant-view', 'too_dense');

  // Assert: isConfirmed tự động hủy về false vì có thay đổi mới
  assert.equal(state.isConfirmed, false, 'Chỉnh sửa mới phải hủy trạng thái xác nhận cũ');

  // Assert: Mục A đã chọn trước đó vẫn được bảo toàn
  const actA = state.days[0].activities.find((a) => a.id === 'act-d1-lake');
  assert.equal(actA?.decisionStatus, 'selected', 'Mục A vẫn giữ nguyên trạng thái selected');

  // Assert: Mục B đã được thay thế bằng phương án mới với ghi chú lý do
  const actB = state.days[0].activities.find((a) => a.id === 'act-d1-alt-cafe');
  assert.ok(actB, 'Mục B được thay thế bằng phương án mới');
  assert.equal(actB?.decisionStatus, 'swapped');
  assert.ok(state.changeNote?.includes('lịch quá dày'), 'Lý do được ghi nhận trong changeNote');
  assert.ok(state.changeNote?.includes('Đón hoàng hôn trên đồi xa'), 'requestAlternative changeNote phải dùng tên hoạt động đọc được');
  assert.ok(!state.changeNote?.includes('act-d1-distant-view'), 'requestAlternative changeNote không được chứa raw internal ID');

  // Assert: Cờ needs_review ở Ngày 2 vẫn hiển thị nguyên vẹn
  const needsReviewAct = state.days[1].activities.find((a) => a.id === 'act-d2-craft');
  assert.equal(needsReviewAct?.reviewFlag, 'needs_review', 'Cờ needs_review không bị xóa mất');

  // 6. Xác nhận lại phiên bản mới sau khi chỉnh sửa
  const reConfirm = confirmPlan(state);
  assert.equal(reConfirm.success, true, 'Có thể xác nhận lại phiên bản mới');
  assert.equal(reConfirm.state.isConfirmed, true);
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

test('LP-13: Cùng xây: Thao tác sắp xếp thứ tự hoạt động (moveActivityOrder) và hội thoại demo (addTranscriptMessage)', () => {
  let state = createInitialLandingState();

  // 1. Kiểm tra thứ tự ban đầu ngày 1: Hồ (0) -> Trà (1) -> Đồi xa (2)
  assert.equal(state.days[0].activities[0].id, 'act-d1-lake');
  assert.equal(state.days[0].activities[1].id, 'act-d1-tea');
  assert.equal(state.days[0].activities[2].id, 'act-d1-distant-view');

  // 2. Chuyển Quán trà (index 1) lên trước (move up) -> Trà (0) -> Hồ (1)
  state = moveActivityOrder(state, 1, 'act-d1-tea', 'up');
  assert.equal(state.days[0].activities[0].id, 'act-d1-tea', 'Quán trà phải lên vị trí đầu tiên');
  assert.equal(state.days[0].activities[1].id, 'act-d1-lake', 'Vườn ven hồ xuống vị trí thứ hai');
  assert.ok(state.changeNote?.includes('lên trước'), 'Ghi nhận thông báo đổi thứ tự');

  // 3. Thử move up trên phần tử đầu tiên (index 0) không làm thay đổi thứ tự hay lỗi (Boundary check)
  const stateNoChange = moveActivityOrder(state, 1, 'act-d1-tea', 'up');
  assert.equal(stateNoChange.days[0].activities[0].id, 'act-d1-tea');

  // 4. Chuyển Quán trà xuống sau (move down) -> Hồ (0) -> Trà (1)
  state = moveActivityOrder(state, 1, 'act-d1-tea', 'down');
  assert.equal(state.days[0].activities[0].id, 'act-d1-lake', 'Vườn ven hồ trở lại vị trí đầu');
  assert.equal(state.days[0].activities[1].id, 'act-d1-tea', 'Quán trà trở lại vị trí thứ hai');

  // 5. Kiểm tra addTranscriptMessage
  const transcriptBeforeCount = state.transcript.length;
  state = addTranscriptMessage(state, 'user', 'Muốn buổi chiều thư thái hơn', 'Vừa gửi');
  assert.equal(state.transcript.length, transcriptBeforeCount + 1);
  const lastMsg = state.transcript[state.transcript.length - 1];
  assert.equal(lastMsg.sender, 'user');
  assert.equal(lastMsg.content, 'Muốn buổi chiều thư thái hơn');

  // 6. Đổi thứ tự khi đã confirm phải hủy trạng thái confirmed
  state = keepActivity(state, 'act-d1-lake');
  state = confirmPlan(state).state;
  assert.equal(state.isConfirmed, true);

  state = moveActivityOrder(state, 1, 'act-d1-lake', 'down');
  assert.equal(state.isConfirmed, false, 'Đổi thứ tự mới phải hủy cờ confirmed cũ để người dùng rà soát lại');
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



