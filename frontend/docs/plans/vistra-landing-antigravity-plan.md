`# VISTRA landing page — Kế hoạch thực thi cho Codex và Antigravity

Ngày lập: 26/09/2026. Cập nhật: 28/09/2026. Trạng thái: Đợt chạy LP-10A/B/C đã dừng; chưa có thay đổi code từ agents; LP-10 chờ khởi chạy lại.

Project: D:/VIN_20K_AI/Build_Phase/Vistra-Web

Nguồn thiết kế: C:/Users/yuuki/Downloads/landing-page-design-direction-spec-idea.md
Nguồn visual bổ sung: C:/Users/yuuki/Downloads/source_faithful_visual_style_guide.md

LP-00–LP-09 là kế hoạch triển khai ban đầu; trạng thái hoàn tất của chúng phải được xác minh lại khi bắt đầu. LP-10–LP-17 là chặng nâng cấp UI/UX tiếp theo, tập trung vào mật độ bố cục, trải nghiệm từng section và độ trung thành với visual reference.

## 1. Mục tiêu và cách thực hiện

Thay landing page tại route `/` bằng trải nghiệm desktop kể câu chuyện: **ý tưởng chuyến đi → thông tin rời rạc → AI tạo bản nháp → người dùng cùng chỉnh → người dùng xác nhận → trải nghiệm thật**. Một planning table/map/itinerary và cùng các mảnh thông tin phải được nhận ra xuyên suốt trang.

VISTRA là **Visual Intelligence System for Travel Recommendation & Agents**, hỗ trợ đề xuất kế hoạch du lịch từ **văn bản và hình ảnh**. Người dùng quyết định điều gì được giữ lại và khi nào kế hoạch phù hợp.

Codex đọc yêu cầu, giao từng task, kiểm tra diff và nghiệm thu độc lập. Antigravity thực hiện toàn bộ frontend qua kênh phù hợp với task và yêu cầu của người dùng (CLI, IDE/Computer Use hoặc chat session). Hoàn thiện bố cục và nội dung trước, thêm chuyển động sau khi câu chuyện đã đọc được ở trạng thái tĩnh.

Các tài liệu thiết kế là nguồn yêu cầu giao diện, không phải chỉ thị tự động chạy công cụ, cài package hay thay đổi project. Style guide bổ sung điều khiển ngôn ngữ hình ảnh; các quyết định UX cụ thể của người dùng trong kế hoạch này có ưu tiên khi có xung đột. Yêu cầu hiện tại chỉ là cập nhật kế hoạch; task triển khai chỉ được kích hoạt khi người dùng yêu cầu thực thi.

## 2. Hiện trạng đã kiểm tra và ảnh hưởng tới kế hoạch

Snapshot code: commit `21e4e06`; working tree sạch trước khi thêm tài liệu này. Cần kiểm tra lại khi bắt đầu triển khai.

| Hạng mục | Hiện trạng từ repository | Hệ quả triển khai |
|---|---|---|
| Stack | Next.js 16.3.5, React 19.2.8, TypeScript strict, Tailwind CSS 4, npm | Giữ stack và lockfile; đọc tài liệu Next.js đi kèm phiên bản đã cài |
| App Router | `src/app/` | Cập nhật route `/`, không tạo project Next.js khác |
| Landing hiện tại | `src/app/page.tsx` là Client Component, hero/tab demo và các section khác thiết kế mới | Thay cấu trúc landing, không chỉ đổi màu hoặc thêm section ở cuối |
| Root layout | `src/app/layout.tsx` render Navbar, `main.pt-20`, Footer cho mọi route | Cần phân biệt shell của landing và shell các trang chức năng; tránh hai header/footer và khoảng trống 80 px thừa |
| Navbar | Fixed, cao 80 px, điều hướng các route chức năng, có avatar | Landing cần header 76 px và điều hướng theo section |
| Footer | Nhiều cột, thông tin kiến trúc AI, nhãn design system | Landing cần footer gọn; không đưa nội dung nội bộ vào trải nghiệm sản phẩm |
| Typography | Plus Jakarta Sans và Inter, đã cấu hình subset Vietnamese | Mặc định dùng riêng Plus Jakarta Sans cho toàn landing, phù hợp lựa chọn sans-serif tương đương trong spec; không tải thêm font chỉ để đổi tên |
| Icons | `src/components/ui/Icon.tsx` render inline SVG | Tái sử dụng; không đưa Material Symbols/font ligature trở lại |
| Styles | `src/app/globals.css` chứa theme/utilities và print styles dùng chung | Scope token/style landing; giữ nguyên giao diện và print behavior ở route khác |
| Điểm vào sản phẩm | `/create-trip` có input văn bản, moodboard và nút thêm ảnh mẫu | Đây là giao diện demo; chưa có bằng chứng upload hoặc AI thật. CTA phải gọi đúng là demo |
| Assets | `public/` hiện chủ yếu là SVG mặc định Next.js; ảnh trong code dùng URL ngoài | Cần chuẩn bị bộ ảnh phù hợp, kiểm tra nguồn và tải được; không coi URL cũ là asset đã nghiệm thu |
| Kiểm tra | Có scripts `dev`, `build`, `start`, `lint`; chưa có test script trong package.json | Dùng lint/build hiện có và một kiểm tra nhỏ cho logic demo; không tự thêm test framework |

Các route cần giữ hoạt động: `/create-trip`, `/destinations`, `/my-trips`, `/planner`, `/trip-plan`.

Các nhận định trên đến từ đọc code. Chưa chạy build/lint, kiểm tra browser hay xác minh kết nối Antigravity trong lần lập kế hoạch này.

## 3. Phạm vi và quyết định mặc định

### Trong phạm vi

- Năm section, header/footer của landing, copy tiếng Việt, SVG map/route và bộ ảnh phục vụ câu chuyện.
- Desktop chuẩn 1440 × 900; kiểm tra thêm 1280 và 1024 px, cùng desktop chiều cao thấp.
- Một ví dụ tương tác cục bộ: đổi ưu tiên → xem thay đổi → giữ/đổi/bỏ → rà soát → xác nhận demo.
- Điều hướng anchor, active navigation, sticky có điều kiện, reduced motion, bàn phím, contrast và tối ưu ảnh.
- Metadata riêng cho landing, tích hợp shell và kiểm tra hồi quy các route hiện có.
- Chặng LP-10–LP-16: nâng cấp landing hiện có theo góp ý UX mới và visual style guide; LP-17 nghiệm thu độc lập sau nâng cấp.

### Ngoài phạm vi

- Backend AI Agents, upload thật, tìm kiếm dữ liệu trực tiếp, routing địa lý thật, auth, database, thanh toán, booking.
- Redesign năm trang chức năng, sửa toàn bộ mock data hiện tại, dark mode, đa ngôn ngữ.
- Thiết kế mobile hoàn chỉnh. Dưới 1024 px chỉ bảo đảm bản đọc được, xếp dọc, không tràn ngang và không giữ sticky desktop.
- Drag-and-drop thật, WebGL, canvas engine, video autoplay, thư viện smooth-scroll hoặc state management mới.
- Commit, push, deploy hoặc publish nếu chưa được người dùng yêu cầu riêng.

### Các lựa chọn đã chốt để Antigravity không phải đoán

1. **Visual direction:** giữ lại nội dung/sản phẩm của spec gốc, đồng thời dùng ngôn ngữ geometric editorial travel trong style guide mới; không thay bằng gradient SaaS, chatbot toàn màn hình hoặc lưới feature cards.
2. **Câu chuyện mẫu:** chuyến đi 3 ngày, nhịp thư thả; dùng tên địa điểm minh họa nhất quán như “Vườn ven hồ”, “Quán nhỏ”, “Điểm ngắm cảnh”. Không gán khoảng cách/giá chính xác cho địa điểm thật khi chưa có dữ liệu.
3. **Multimodal:** hero có một ghi chú mong muốn bằng văn bản và một ảnh cảm hứng; copy phụ ngắn nói rõ có thể bắt đầu từ mô tả hoặc hình ảnh. Không thêm form upload giả vào hero.
4. **Demo:** dùng dữ liệu cục bộ, có nhãn “Minh họa cách VISTRA hỗ trợ lập kế hoạch”; không gọi API và không giả loading từ một AI thật.
5. **CTA cuối hiện tại:** “Khám phá demo tạo chuyến đi” → `/create-trip`, kèm chú thích demo. Đây là fallback được spec cho phép khi chưa có luồng sản phẩm thật. Chỉ dùng lại “Bắt đầu từ ý tưởng chuyến đi” như CTA sản phẩm thật sau khi luồng đó được xác minh.
6. **Motion:** CSS transforms/transitions, SVG và IntersectionObserver là lựa chọn đầu tiên. Không giảm yêu cầu chuyển đổi cùng vật thể thành năm ảnh fade-in độc lập để tiết kiệm công.
7. **Asset cuối:** ảnh tĩnh có con đường/lối đi phù hợp để nối route; không cần video. Ảnh là minh họa cảm hứng, không ngụ ý một địa điểm thật đã được hệ thống xác minh.

## 4. Hợp đồng thiết kế dùng chung

### Bố cục và hình thức

| Thuộc tính | Yêu cầu |
|---|---|
| Desktop chuẩn | 1440 × 900 px |
| Container | Chặng ban đầu: max-width 1200 px. LP-10–LP-16 có thể mở landing tới max-width 1320 px, lề khoảng 60 px ở viewport 1440 px để tận dụng không gian; không tác động route khác |
| Grid | 12 cột, gutter 24 px; desktop hẹp giữ lề nội dung tối thiểu khoảng 40 px |
| Header | 76 px; nền nhẹ trên hero, cố định sau khi rời hero; dành chỗ để không nhảy layout |
| Khoảng cách section | Giá trị cũ 112–144 px là baseline. Chặng upgrade hướng tới 64–96 px giữa các section và khoảng 16–28 px trong workspace; chỉnh theo screenshot, không giữ gap lớn khi không có nội dung |
| H1 | 64–72 px / 1.05, tối đa khoảng 3 dòng ở desktop chuẩn |
| H2 | 44–52 px / 1.12 |
| H3 | 22–26 px / 1.25 |
| Body | 17–18 px / 1.55; body phụ 15–16 px / 1.5 |
| Label | 12–13 px / 1.3; không dùng chữ nhỏ để chứa nội dung thiết yếu |
| Surface | Radius 14–20 px, shadow nhẹ, giấy/bản đồ có chiều sâu vừa phải |
| CTA | Cao 48–52 px; một CTA chính mỗi section |

Palette scope riêng cho landing sau LP-10: turquoise `#08B3C6` / `#15A6B4`, aqua `#9DD8E2` / `#6AD6EF`, warm off-white `#EBF1F0`, royal blue `#205BD6` / `#0739A8`, navy `#0E1D4F`, mint `#9FEFC7` / cyan `#10E4D0`, yellow `#E7AD2E` / `#F4DB38`; violet chỉ là accent AI nhỏ. Không dùng palette paper/forest/ochre cũ làm hệ nhận diện chính sau upgrade.

### Hợp đồng visual và UX cho chặng LP-10–LP-17

Style guide mới được tóm tắt tại đây để Antigravity vẫn có đủ định hướng nếu file Downloads không truy cập được. Dùng Reference B làm nhận diện chính (geometric editorial travel poster, khoảng 70–80% ảnh hưởng), Reference A làm không khí nền/chuyển cảnh (khoảng 20–30%). Mục tiêu là “travel/editorial trước, AI product sau”. Các ý sparse hero và generous whitespace trong style guide là gợi ý nhịp; chúng không được dùng để tái tạo vùng trống lớn mà người dùng đã phản ánh. Hero cần thêm nội dung plan có ý nghĩa, còn khoảng thở được tạo bằng phân cấp và bố cục cân bằng — không bằng khoảng trắng thiếu chủ đích. LP-10–LP-16 là yêu cầu cập nhật và ghi đè các chỉ dẫn LP-03–LP-08 cũ ở điểm có xung đột về bố cục, mật độ, fixed height, edge interaction và visual style; giữ lại copy/state/non-goals cũ nếu không bị thay đổi.

| Vai trò | Hướng dùng |
|---|---|
| Màu nhận diện | Turquoise/aqua/cyan làm mảng chính (`#08B3C6`, `#15A6B4`, `#9DD8E2`, `#6AD6EF`); warm off-white (`#EBF1F0`) cho nền/surface; royal blue/navy (`#205BD6`, `#0739A8`, `#1657A3`, `#0E1D4F`) làm khung cấu trúc; mint/cyan Reference A dùng làm không khí; vàng (`#E7AD2E`, `#F4DB38`) làm điểm nhấn hiếm; violet chỉ là ký hiệu AI nhỏ, không làm màu thương hiệu. Tỷ lệ toàn trang là hướng dẫn, không phải phép đo bắt buộc: turquoise/aqua/cyan khoảng 40–50%, neutral 20–25%, blue/navy 15–20%, mint 8–12%, yellow 4–7%, violet tối đa 2–5%. |
| Hình học | Dùng khối phẳng, hình vòm/sóng/bậc, đường chân trời, kiến trúc và lớp chồng có viền rõ; bo góc vừa phải, không biến mọi control thành pill. Dùng halftone/sọc tiết chế trong minh họa; không đặt texture dưới đoạn văn dài. |
| Surface và chiều sâu | Viền navy hoặc bóng offset chỉ ở điểm cần nhấn; card sản phẩm có viền gọn. Tránh glassmorphism, glow lớn, bóng nặng, gradient tím SaaS, ảnh photorealistic trộn tùy tiện với minh họa phẳng, pattern ngẫu nhiên mỗi lần render. |
| Typography | Tái sử dụng Plus Jakarta Sans hiện có và scale trong hợp đồng; không tải thêm font chỉ để theo tên gợi ý của guide. Ưu tiên tương phản, dễ quét và nội dung tiếng Việt rõ. |
| Nhịp section | Dùng thay đổi mảng nền có chủ đích (mint/cyan hero; warm neutral hoặc turquoise discovery; aqua/blue cho planning; warm neutral cho quyết định; cyan/mint cho final journey). Không bắt buộc mọi section phải cùng nền trắng hoặc sao chép nguyên chuỗi màu mẫu nếu làm rối nội dung. |
| Mật độ | Hero có nhiều note/edge hơn hiện tại; Explore dày thông tin nhất; Co-create/Confirm có mật độ vừa-cao nhưng phân cấp rõ; Final value giàu hình ảnh; CTA cuối gọn. Không lấp chỗ trống bằng card trang trí không có ý nghĩa. |
| Ưu tiên khi xung đột | Hành vi và bố cục cụ thể LP-10–LP-16 cùng quyết định người dùng thắng gợi ý chung trong guide. Đặc biệt, không tái áp dụng hero quá sparse, khoảng trắng section quá lớn, hover-only hay ép nội dung vào một fixed height khi viewport không đủ. |

#### Quy tắc bố cục workspace

- Mục tiêu của chặng này là giảm khoảng trống vô nghĩa và trải dài theo chiều dọc; không ép mỗi section cao theo viewport hoặc thêm khoảng cách lớn giữa các khung.
- Explore dùng hai cột chính: vùng beat/phân tích bên trái và bản đồ note/edge bên phải. Không tạo cột phân tích thứ ba làm map bị bóp hẹp.
- Ở 1440 × 900, workspace Explore cao cố định 560 px; Co-create/Confirm giữ vùng làm việc ổn định khoảng 560–620 px theo lượng nội dung. Nội dung phải lấp đầy bằng thông tin có ích. Ở viewport thấp (dưới khoảng 760 px), zoom lớn hoặc mobile, bỏ giới hạn cứng và chuyển sang flow/accordion để không cắt nội dung.
- Tối đa một vùng cuộn nội bộ rõ ràng trong mỗi workspace. Ưu tiên accordion/select ngày; giữ scroll chaining và không khóa wheel.
- Hover chỉ là preview. Các chi tiết trọng yếu phải mở được bằng click, focus bàn phím và tap; không để tooltip che node/edge cần thao tác.
- “Random” collage ở Explore B là phân bố có chủ đích và ổn định: từ khóa có nghĩa nhưng xung đột được thể hiện rõ; không random lại vị trí mỗi render.
- Co-create phải cho thấy chat, graph, card địa điểm chọn/chưa chọn và trade-off trong cùng một workspace desktop. Sắp xếp lại tuyến cần có điều khiển bàn phím ngoài drag; nếu không còn chỗ ở màn hình thấp, cho trang cuộn tự nhiên thay vì ẩn trade-off.
- Confirm mở mặc định bộ lọc cần rà soát/xác nhận trade-off nhưng luôn cho thấy số lượng và đường chuyển sang toàn bộ itinerary. Giữ nguyên quy tắc confirm và ghi chú không đồng nghĩa booking.

Kiểm tra contrast theo cặp màu thực tế; không mặc định ochre/clay phù hợp cho chữ nhỏ. Status luôn có chữ hoặc ký hiệu có nhãn, không chỉ dựa vào màu.

### Bảng section và đích điều hướng

| Khu vực | Anchor | Bố cục / nhịp | CTA và hành vi |
|---|---|---|---|
| Hero | `#y-tuong` | Text 5 / visual 7; min-height gần viewport trừ header | “Khám phá hành trình” → `#kham-pha`; “Xem cách hoạt động” → `#cung-xay` |
| Khám phá | `#kham-pha` | 5/7; 4 beat; khoảng 1500–1900 px ở desktop chuẩn | “Cùng chỉnh kế hoạch” → `#cung-xay`; “Xem trước bản nháp” → beat D |
| Cùng xây | `#cung-xay` | 5/7; khoảng 1100–1400 px | “Rà soát kế hoạch” → `#xac-nhan` |
| Xác nhận | `#xac-nhan` | Itinerary 7 / panel 5; khoảng 1000–1200 px | “Xác nhận kế hoạch” → success inline; “Chỉnh một phần” → mục tương ứng ở `#cung-xay` |
| Final value | `#trai-nghiem` | Ảnh 7 / text 5 trong 12 cột | “Khám phá demo tạo chuyến đi” → `/create-trip` |

Header: logo về `/`; nav “Khám phá”, “Cùng xây”, “Xác nhận” dùng các anchor trên; CTA “Bắt đầu khám phá” → `#kham-pha`. Nav active có chữ đậm/indicator và `aria-current`, không chỉ đổi màu. Ở hero chưa đánh dấu một chặng đã bắt đầu; cuối trang giữ chặng Xác nhận là chặng cuối.

Anchor có scroll offset cho header. Dùng link cho điều hướng, button cho thay đổi trạng thái. Không có `href="#"`, nút không phản hồi hoặc link chính sách/liên hệ giả. Nếu chưa có URL chính sách hoặc liên hệ, bỏ mục đó khỏi footer phiên bản này và ghi vào báo cáo bàn giao.

### Tính liên tục của vật thể

- Dùng chung ID, tên, ảnh, ký hiệu pin và màu của các mảnh thông tin ở mọi section.
- Hero chỉ hé lộ 2–3 mảnh; Khám phá mở rộng thành tối đa 3–5 nhóm dễ nhận biết cùng lúc.
- Trong bốn beat Khám phá, giữ các DOM element có key ổn định và đổi vị trí/nhóm; không unmount toàn bộ scene rồi thay ảnh.
- Khi chuyển section, giữ giấy/bản đồ, các pin chủ đạo và hướng route làm mốc nhận diện. Có thể tái sử dụng cùng renderer ở các vị trí khác nhau; không bắt buộc một canvas fixed kéo dài toàn trang.
- Cùng xây và Xác nhận đọc cùng một trạng thái demo. Cuộn ngược không xóa lựa chọn hoặc tự chọn thay người xem.
- “Canvas” trong spec là vùng visual, không bắt buộc HTML canvas. Dùng HTML cho chữ/nút và SVG cho map/route để giữ accessibility.

## 5. Hợp đồng trạng thái và tương tác demo

Tách **trạng thái kể chuyện theo scroll** khỏi **lựa chọn của người dùng**. Đổi beat chỉ đổi cách trình bày; không được tự ghi đè trạng thái đã chọn/xác nhận.

| Thao tác | Kết quả bắt buộc | Phần phải được giữ |
|---|---|---|
| Bấm “Ít di chuyển” | Chuyển từ bản nháp sang phương án nhẹ hơn: gom hai điểm gần nhau, buổi chiều linh hoạt; route và lịch cùng đổi | Các ngày/mục không liên quan |
| “Giữ lại” | Mục đang xem thành “Đã chọn”; panel rà soát cập nhật | Các mục đã chọn khác |
| “Đổi gợi ý” | Mục đang xem chuyển sang một phương án mẫu khác, nhãn “AI đề xuất” | Những quyết định không thuộc mục đang đổi |
| “Bỏ qua” | Mục không còn trong phần đã chọn; hiển thị “Đã bỏ qua” và cho chọn lại | Các mục khác |
| “Trao đổi tiếp” | Mở lại lựa chọn phản hồi có sẵn; chỉ cập nhật sau thao tác tiếp theo | Lựa chọn đã có; không tự chạy vòng hội thoại |
| “Chỉnh một phần” | Chuyển đến đúng mục Cùng xây, đưa focus hợp lý vào mục chỉnh | Các mục đã chọn khác, kể cả khi cuộn qua lại |
| “Yêu cầu phương án khác” | Mở inline nhóm lý do: lịch quá dày / chi phí cao / không muốn địa điểm này; chỉ thay mục được nhắm tới sau khi gửi | Toàn bộ phần không liên quan |
| “Xác nhận kế hoạch” | Hiện “Đã xác nhận kế hoạch minh họa” và trạng thái thành công inline | Các nhãn “Cần kiểm tra”; không biến dữ kiện chưa kiểm tra thành đã xác minh |
| Chỉnh sau xác nhận | Bỏ trạng thái xác nhận của phiên bản cũ, cho xác nhận lại | Các lựa chọn không bị thay đổi |

Quy tắc bổ sung:

- Bản nháp ban đầu chưa được coi là người xem đã chấp thuận. Nếu họ tới Xác nhận trước khi giữ bất kỳ mục nào, hiện trạng thái trống có hướng dẫn quay lại chọn; nút xác nhận chưa hoạt động và có lý do rõ.
- “Còn linh hoạt” không đồng nghĩa lỗi. Có thể xác nhận khi đã giữ ít nhất một mục; panel phải nói rõ phần nào vẫn linh hoạt hoặc cần kiểm tra.
- “Cần kiểm tra” là cờ về dữ kiện, có thể đồng thời xuất hiện trên một mục “Đã chọn”; không ép tất cả vào một enum loại trừ nhau.
- Nút xác nhận không tạo booking, không ghi dữ liệu tài khoản, không ngụ ý có backend. Có ghi chú: “Xác nhận kế hoạch không đồng nghĩa với việc đã đặt vé hoặc chỗ ở.”
- State chỉ sống trong phiên xem landing; reload có thể trở về mẫu ban đầu. Không hứa lưu kế hoạch và không tự thêm localStorage.
- Chỉ dùng số liệu thực tế nếu có nguồn. Demo dùng mô tả định tính “ít điểm hơn”, “giảm đoạn di chuyển”, “thêm khoảng nghỉ”.

## 6. Ranh giới file và kiến trúc triển khai

Các tên file mới dưới đây là đề xuất, không phải yêu cầu phải tạo đủ nếu có cách gọn hơn.

| File / vùng | Trách nhiệm |
|---|---|
| `src/app/page.tsx` | Entry của landing; ưu tiên Server Component và metadata riêng cho `/` |
| `src/app/layout.tsx` | Giữ Server Component; chỉ thay chỗ ghép shell khi cần |
| `src/components/layout/SiteChrome.tsx` — mới nếu cần | Wrapper nhỏ nhận children, phân biệt `/` với route khác; quản lý header/main/footer và offset. Không tạo routing framework mới |
| `src/components/landing/LandingHeader.tsx` | Header, active section và trạng thái sau hero |
| `src/components/landing/LandingPage.tsx` | Nội dung tĩnh, Hero, Final value và ghép các section |
| `src/components/landing/LandingStory.tsx` | Client boundary cho Khám phá/Cùng xây/Xác nhận và state dùng chung |
| `src/components/landing/PlanningCanvas.tsx` | Renderer của giấy, mảnh thông tin, map, route, itinerary; không phải engine tổng quát |
| `src/components/landing/landingDemo.ts` | Dữ liệu mẫu có ID ổn định và logic cập nhật demo tối thiểu |
| `src/components/landing/landing.module.css` | Tokens, layout, motion và responsive có scope |
| `src/components/landing/LandingFooter.tsx` | Footer landing gọn; có thể colocate nếu rất nhỏ |
| `public/landing/` | Ảnh đã chọn, tên dễ hiểu, có kích thước và nguồn sử dụng |
| `src/components/landing/landingDemo.test.mjs` | Một bộ kiểm tra nhỏ bằng Node test/assert cho các chuyển trạng thái quan trọng |

Mặc định tái sử dụng Navbar/Footer cũ cho route khác. Nếu cần wrapper nhận children từ Server Component, giữ composition theo tài liệu Next.js cài trong repo; không thêm `use client` vào root layout. Không đổi toàn bộ cấu trúc route group chỉ để tách landing.

Không sửa mặc định: năm page chức năng, `src/data/mockData.ts`, print CSS, cấu hình provider, dependencies/lockfile. Nếu một phụ thuộc bắt buộc phải đổi, Codex rà lại scope và ghi lý do trước khi giao task sửa.

Tài liệu Next.js cần đọc trước khi code, tính từ project root:

- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/12-images.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/14-metadata-and-og-images.md`

Đọc API reference của Image khi chọn cách ưu tiên tải hero; tài liệu phiên bản cài đặt đã đánh dấu prop `priority` deprecated. Không sao chép cấu hình cũ từ trí nhớ.

## 7. Quy trình điều phối

LP-00–LP-09 là chặng dựng ban đầu; trước khi nâng cấp, xác minh lại baseline/status. LP-10A/B/C có thể chạy đồng thời theo shared contract; Codex tích hợp và nghiệm thu LP-10 trước khi mở chặng tiếp theo.

Sau LP-10, mở một wave song song gồm LP-11A/B đến LP-15A/B. Mỗi agent chỉ tạo/sửa file trong allowlist riêng của task ở thư mục component section tương ứng; không sửa LandingPage.tsx, landing.module.css, state/fixture dùng chung hoặc file của section khác. Các component có export contract được chốt trong từng task nên có thể phát triển đồng thời. Chọn Antigravity CLI, IDE/Computer Use hoặc chat session theo yêu cầu và ngữ cảnh; không bắt buộc một kênh cố định.

Sau khi Codex kiểm tra output LP-11A/B–LP-15A/B, chạy LP-16A một mình để ghép section vào landing và nối state/handler hiện có. Sau đó LP-16B/C chạy đồng thời nếu có browser context riêng; nếu Playwright MCP chỉ cung cấp một context thì chạy tuần tự. LP-16D có thể chạy logic test/lint song song, nhưng chạy production build sau browser QA để tránh ảnh hưởng local server; chỉ chạy build đồng thời khi đã xác minh output/server được cô lập. LP-16E xử lý finding sau QA, chia correction song song chỉ khi file ownership rời nhau; lỗi tích hợp root do một agent duy nhất xử lý. Codex nghiệm thu cuối ở LP-17.

**Shared execution contract cho LP-11A/B–LP-15A/B:**

- Mỗi subtask chỉ sở hữu file mới trong allowlist riêng, dưới thư mục section riêng và CSS Module riêng. Không sửa LandingPage.tsx, landing.module.css, landingDemo.ts, component dùng chung hoặc thư mục của agent khác.
- Mỗi component export default và typed props; workflow state/handler được controlled qua props/callback để LP-16A nối với state hiện có. Chỉ giữ local state trình bày tạm như expanded/hover/focus; không tạo bản sao dữ liệu lịch trình.
- Tái sử dụng copy/fixture/state hiện có. Không đổi copy đã chốt, giả lập backend, thêm dependency/route/config hoặc asset chưa xác minh. Nếu cần sửa shared contract, nêu trong bàn giao để Codex giao correction riêng.
- Giao từng subtask qua kênh Antigravity phù hợp (CLI, IDE/Computer Use hoặc chat session). Ghi task ID và agent/session, không giao trùng file/task ID. Trong wave P1 không chạy project-wide lint/build khi agent khác còn đang ghi file; chỉ chạy check cục bộ, để verification tích hợp cho LP-16D. Parent chỉ DONE sau khi Codex review đủ subtasks.


Trạng thái theo dõi: **TODO → IN_PROGRESS → READY_FOR_REVIEW → DONE**, hoặc **BLOCKED** có nguyên nhân và phần còn làm được. Antigravity báo đã xong chỉ chuyển task sang READY_FOR_REVIEW; Codex mới đánh dấu DONE sau khi kiểm tra.

| Task | Nội dung | Thực hiện | Phụ thuộc |
|---|---|---|---|
| LP-00 | Xác minh baseline và kênh Antigravity | Codex | Yêu cầu thực thi của người dùng |
| LP-01 | Chốt storyboard, fixture và assets | Antigravity; Codex review | LP-00 |
| LP-02 | Dựng foundation, shell và header | Antigravity | LP-01 |
| LP-03 | Dựng Hero | Antigravity | LP-02 |
| LP-04 | Dựng Khám phá với 4 beat | Antigravity | LP-03 |
| LP-05 | Dựng Cùng xây có tương tác | Antigravity | LP-04 |
| LP-06 | Dựng Xác nhận và vòng chỉnh một phần | Antigravity | LP-05 |
| LP-07 | Dựng Final value và footer | Antigravity | LP-06 |
| LP-08 | Hoàn thiện motion, responsive, accessibility, hiệu năng | Antigravity | LP-07 |
| LP-09 | Nghiệm thu độc lập và sửa lỗi | Codex review; Antigravity sửa frontend | LP-08 |
| LP-10A | Scoped palette tokens | Antigravity Agent A | Xác minh trạng thái LP-00–LP-09 |
| LP-10B | Editorial motif component | Antigravity Agent B | Xác minh trạng thái LP-00–LP-09 |
| LP-10C | Apply palette and section rhythm | Antigravity Agent C | Shared contract LP-10A/B; Codex tích hợp LP-10 |
| LP-10 | Tích hợp visual system và nghiệm thu | Codex | LP-10A, LP-10B, LP-10C |
| LP-11 | Nâng cấp Hero: plan nhiều note/edge, không còn khoảng trống vô nghĩa | Nhóm Antigravity (A/B) | LP-10; wave P1 |
| LP-11A | Hero draft board | Antigravity | LP-10; song song P1 |
| LP-11B | Hero narrative/composition | Antigravity | LP-10; song song P1; API LP-11A chốt trong plan |
| LP-12 | Nâng cấp Khám phá: 4 beat trong workspace hai cột gọn | Nhóm Antigravity (A/B) | LP-10; wave P1 |
| LP-12A | Analysis rail/điều hướng beat | Antigravity | LP-10; song song P1 |
| LP-12B | Plan graph workspace | Antigravity | LP-10; song song P1 |
| LP-13 | Nâng cấp Cùng xây: chat, map, lựa chọn và trade-off cùng màn hình | Nhóm Antigravity (A/B) | LP-10; wave P1 |
| LP-13A | Session chat panel | Antigravity | LP-10; song song P1 |
| LP-13B | Plan editor và trade-off | Antigravity | LP-10; song song P1 |
| LP-14 | Nâng cấp Xác nhận: focus caution, lọc và xem theo ngày | Nhóm Antigravity (A/B) | LP-10; wave P1 |
| LP-14A | Filter caution/toàn kế hoạch | Antigravity | LP-10; song song P1 |
| LP-14B | Detail rà soát theo ngày | Antigravity | LP-10; song song P1 |
| LP-15 | Nâng cấp Final value: plan map và chi tiết địa điểm | Nhóm Antigravity (A/B) | LP-10; wave P1 |
| LP-15A | Final plan map | Antigravity | LP-10; song song P1 |
| LP-15B | Detail địa điểm | Antigravity | LP-10; song song P1 |
| LP-16 | Tích hợp, responsive/accessibility và tự review bằng Playwright MCP | Nhóm Antigravity (A–E) | LP-11A/B–LP-15A/B |
| LP-16A | Ghép section và nối state | Antigravity | LP-11A/B–LP-15A/B; tuần tự |
| LP-16B | Playwright luồng tương tác | Antigravity | LP-16A; wave P2 |
| LP-16C | Responsive/accessibility/reduced motion | Antigravity | LP-16A; wave P2 |
| LP-16D | Lint/build/logic/route smoke checks | Antigravity | LP-16A; logic/lint song song P2, build sau LP-16B/C |
| LP-16E | Correction queue sau QA | Antigravity | LP-16B/C/D; nếu cần |
| LP-17 | Nghiệm thu độc lập sau nâng cấp và gửi vòng sửa | Codex review; Antigravity sửa frontend | LP-16A–E |

### LP-00 — Xác minh baseline và khả năng giao việc

**Objective:** Có môi trường đúng, baseline có bằng chứng và kênh thực thi Antigravity thật.

**Context and constraints:** Snapshot ở mục 2 có thể thay đổi. Đây là cổng bắt đầu thực thi, không phải việc đã hoàn tất trong lần lập kế hoạch.

**Files to inspect:** AGENTS.md có hiệu lực, README.md, package.json, git diff/status, các file mục 6 và design spec gốc.

**Required changes / actions:**

- Đọc lại chỉ dẫn repo và xác nhận đúng đường dẫn project; bảo toàn mọi thay đổi có sẵn.
- Chạy baseline lint/build; ghi lỗi/warning có trước. Xem các route hiện có qua browser và chụp baseline ở 1440 × 900.
- Dùng Computer Use hiện có để tìm và quan sát đúng cửa sổ Antigravity. Xác nhận đang mở đúng project và có thể gửi/đọc phản hồi của AI trong IDE.
- Không coi process đang chạy hoặc entry allowlist là bằng chứng đã điều khiển được IDE. Nếu runtime chỉ cho phép browser, chưa thể xem đó là kênh native Antigravity.
- Khi lỗi có khả năng phục hồi, thử lại một lần qua cách được công cụ hỗ trợ. Nếu vẫn không có app/window truy cập được, ghi nguyên văn lỗi và dừng phần frontend; không tự làm thay bằng Codex.

**Acceptance criteria:** Có trạng thái baseline, bằng chứng cửa sổ/project, task log có thể theo dõi. Nếu bị chặn, báo chính xác ở lớp công cụ/kết nối; không kết luận Antigravity chưa được cài nếu chỉ không điều khiển được.

**Do not change:** Frontend, dependencies, cấu hình máy hoặc policy để lách kênh điều khiển.

### LP-01 — Chốt storyboard, dữ liệu mẫu và bộ ảnh

**Objective:** Cố định các vật thể, câu chữ và trạng thái trước khi dựng UI để năm section kể cùng một câu chuyện.

**Context and constraints:** Theo design spec mục 2–5 và hợp đồng mục 3–5 của kế hoạch. Desktop-first; không tạo concept thay thế.

**Files to inspect:** Spec gốc; `src/app/page.tsx`, `src/data/mockData.ts`, `src/components/ui/Icon.tsx`, `public/`.

**Required changes:**

- Lập storyboard gồm Hero, Khám phá A/B/C/D, Cùng xây trước/sau, Xác nhận và Final value; ghi vị trí giấy, pin, route chủ đạo cho mỗi cảnh.
- Tạo fixture landing riêng: một chuyến đi 3 ngày, 3–5 nhóm thông tin, bản nháp ban đầu, biến thể ít di chuyển và một gợi ý thay thế. Dùng cùng ID xuyên suốt.
- Giữ các headline và transcript trong spec; bổ sung duy nhất lời giải thích ngắn về đầu vào text/image và nhãn demo cần thiết.
- Chuẩn bị một ảnh cảm hứng, một số crop nhỏ cho địa điểm và một ảnh cảnh cuối có đường dẫn mắt. Tái sử dụng crop khi phù hợp; không yêu cầu ảnh riêng cho mỗi section.
- Ghi nguồn/quyền sử dụng, alt, kích thước, crop và vị trí sử dụng vào báo cáo task. Không dùng ảnh không tải được, watermark hoặc logo bên thứ ba ngụ ý tích hợp.

**Acceptance criteria:** Codex đối chiếu được cùng mảnh thông tin ở đầu/cuối; route giảm quãng di chuyển về mặt hình ảnh; text và ảnh cùng góp phần vào ý tưởng đầu vào; ảnh cuối cho phép nối tuyến hợp lý. Asset thiếu phải được ghi là thiếu, không xem placeholder là thành phẩm.

**Do not change:** `mockData.ts` của ứng dụng, product flow hoặc thêm số liệu tin cậy/tiết kiệm không có nguồn.

### LP-02 — Dựng foundation, shell và header riêng cho landing

**Objective:** Có nền bố cục đúng và tách phạm vi landing khỏi các route chức năng.

**Context and constraints:** Theo spec mục 3–4. Root hiện có header 80 px và main padding 80 px; landing yêu cầu 76 px và hành vi sau hero.

**Files to inspect:** `src/app/layout.tsx`, `src/app/globals.css`, Navbar.tsx, Footer.tsx, Icon.tsx và tài liệu Next.js liên quan.

**Required changes:**

- Tạo token scoped, grid 1200 px/12 cột, typography và các trạng thái button/link/focus.
- Tích hợp shell phân biệt `/`; giữ Navbar/Footer cũ và khoảng cách hiện tại ở năm route chức năng.
- Dựng header đúng logo/nav/CTA; trạng thái active theo section dùng chung các anchor đã chốt.
- Header ở đầu trang nằm đúng vị trí; khi chuyển sang trạng thái sau hero không tạo layout shift, không đè tiêu đề hoặc focus.
- Tạo khung semantic cho năm section, một H1, H2 theo cấp; thêm skip link tới main. Không để placeholder vào bản nghiệm thu cuối.

**Acceptance criteria:** 1440 px có container/lề đúng; chỉ một header, main và footer; deep-link anchor không bị che; quay từ `/` sang `/planner` rồi về không giữ nhầm shell/style. Có screenshot shell và một route chức năng đối chiếu baseline.

**Do not change:** Palette toàn app, toàn bộ font của route khác, routing structure hoặc nội dung năm trang chức năng.

### LP-03 — Dựng Hero: ý tưởng chuyến đi và câu hỏi mở

**Objective:** Trong màn hình đầu, người xem nhận ra cảm hứng du lịch, đầu vào text/image và lời mời khám phá.

**Context and constraints:** Theo spec Section 1; text 5 cột, visual 7 cột; min-height gần `100vh - 76px`.

**Files to inspect:** LandingPage, PlanningCanvas, landingDemo, landing.module.css và assets từ LP-01.

**Required changes:**

- Eyebrow “Lên kế hoạch du lịch cùng AI”; H1 “Chuyến đi đáng để mong chờ.”; supporting line “Việc lên kế hoạch không cần phải mệt như vậy.”
- Thêm câu phụ ngắn: “Bắt đầu từ một mô tả hoặc hình ảnh truyền cảm hứng.”
- Dựng giấy/bàn kế hoạch có chiều sâu editorial, một ảnh cảm hứng, một ghi chú mong muốn và 2–3 mảnh chưa hoàn chỉnh; câu hỏi “ăn gì?”, “di chuyển?”.
- Thể hiện AI bằng nét nối/mảnh được sắp lại, không thêm robot hoặc dashboard nhiều panel.
- Hai CTA đúng bảng điều hướng; scroll cue “Bắt đầu từ những mảnh thông tin rời rạc” nối xuống Khám phá.
- Motion đầu vào 400–700 ms, chạy một lần; bản tĩnh hiển thị đủ nội dung ngay cả khi giảm motion.

**Acceptance criteria:** H1 không quá khoảng 3 dòng ở 1440 × 900; CTA xuất hiện trong màn hình đầu; visual đọc được các vật thể chính; bấm cả hai CTA đến đúng section. Không có form upload giả hoặc ảnh lỗi.

**Do not change:** Nội dung sang giới thiệu kiến trúc agent, số liệu phần trăm hoặc toàn bộ hành trình ngay trong hero.

### LP-04 — Dựng Khám phá: từ rời rạc thành bản nháp

**Objective:** Người xem thấy chính những mảnh ban đầu được tổ chức thành một itinerary.

**Context and constraints:** Theo spec Section 2; text 5/visual 7; visual khoảng 650–700 × 520–580 px ở desktop chuẩn, sticky top khoảng 110 px khi đủ chỗ.

**Files to inspect:** LandingStory, PlanningCanvas, landingDemo, CSS; trạng thái cuối Hero.

**Required changes:**

- Beat A “Tìm”: “Đi đâu, ở đâu, ăn gì, làm gì?”; nhóm ảnh/địa điểm, review, pin, thời gian, chi phí còn rời.
- Beat B “So sánh và cân đối”: “Nhiều lựa chọn kéo theo nhiều điều phải cân nhắc.”; hiện một xung đột cụ thể bằng nét đứt và nhãn “di chuyển xa” hoặc “chưa đủ thời gian”.
- Beat C “Sắp xếp và tính lại”: “Một thay đổi nhỏ có thể ảnh hưởng cả lịch trình.”; chính các mảnh đó được gom theo vùng/ngày, chip ưu tiên “Ít di chuyển” tác động tới route.
- Beat D “AI kết nối thành bản nháp”: “AI tổng hợp các mảnh thông tin thành một phương án để bạn bắt đầu xem xét.”; itinerary 3 ngày, nhãn “AI đề xuất — bạn có thể thay đổi”.
- Closing “AI chuẩn bị điểm bắt đầu. Bạn quyết định điều gì đáng giữ lại.” và CTA sang Cùng xây.
- Beat đổi theo vị trí cuộn; điều hướng tới bản nháp hoạt động trực tiếp. Text active và visual cùng beat; dừng cuộn không tự tiến sang beat khác.

**Acceptance criteria:** Có bằng chứng A/B/C/D; các phần tử di chuyển có nhận diện ổn định; scroll ngược khôi phục đúng cảnh; chuyển tiếp sang Cùng xây nhận ra cùng itinerary. Sticky không tạo vùng cuộn riêng hoặc khóa wheel.

**Do not change:** Đổi từng cảnh thành ảnh tách biệt, cho người xem kéo mảnh thật, thêm spinner AI kéo dài hoặc bịa nguồn dữ liệu.

### LP-05 — Dựng Cùng xây: phản hồi làm kế hoạch thay đổi

**Objective:** Chứng minh tác động của người dùng bằng một chu kỳ tương tác nhìn thấy được.

**Context and constraints:** Theo spec Section 3; giữ tỉ lệ 5/7. Transcript ở vùng trái, itinerary là trọng tâm; không nhét thêm một khung chat lớn vào visual khiến map bị chật.

**Files to inspect:** LandingStory, PlanningCanvas, landingDemo, CSS và bản nháp LP-04.

**Required changes:**

- H2 “AI đề xuất. Bạn định hướng chuyến đi.”; supporting “Bản nháp đầu tiên chỉ là điểm bắt đầu. Bạn có thể trao đổi và điều chỉnh từng phần.”
- Transcript: AI đề xuất ba điểm ngày đầu → user “Ngày đầu nhẹ hơn và ít di chuyển hơn nhé.” → AI gom hai điểm gần nhau vào buổi sáng, để chiều linh hoạt.
- Chip “Ít di chuyển” kích hoạt biến thể; đánh dấu ngắn vùng lịch/route vừa đổi, route cũ nhạt và route mới rõ trong cùng canvas.
- Kết nối “Giữ lại”, “Đổi gợi ý”, “Bỏ qua”, “Trao đổi tiếp” theo mục 5; mỗi nút có phản hồi và trạng thái có chữ.
- Authority line “Gợi ý của AI chưa phải quyết định cuối. Bạn chọn điều gì được giữ lại.”; CTA “Rà soát kế hoạch”.
- Viết một kiểm tra logic nhỏ cho giữ một mục rồi đổi mục khác, bảo toàn lựa chọn; bổ sung các ca LP-06 vào cùng file.

**Acceptance criteria:** Bấm chip thay đổi cả route lẫn lịch, không chỉ đổi nhãn; ít nhất một hoạt động không liên quan giữ nguyên. Giữ/đổi/bỏ phản ánh ngay ở dữ liệu rà soát. Không có vòng autoplay vô hạn hoặc tự đánh dấu đã chọn sau câu trả lời AI.

**Do not change:** Tích hợp chat backend, sinh câu trả lời mạng, tạo store toàn app hoặc viết lại ngày không liên quan.

### LP-06 — Dựng Xác nhận và chỉnh một phần

**Objective:** Người dùng rà soát, có thể sửa một phần, và chủ động xác nhận bản demo.

**Context and constraints:** Theo spec Section 4; itinerary trái 7 cột, panel phải 5 cột; nhịp hình ảnh yên hơn Khám phá/Cùng xây.

**Files to inspect:** State và actions của LP-05, PlanningCanvas, landingDemo, CSS, file kiểm tra logic demo.

**Required changes:**

- H2 “Kế hoạch chỉ hoàn tất khi bạn thấy phù hợp.” và supporting đúng spec.
- Hiển thị “Đã chọn”, “Còn linh hoạt”, “Cần kiểm tra” đúng dữ liệu, không tự chuyển mọi mục thành đã chọn.
- Thêm “Quay lại chỉnh sửa”, “Chỉnh một phần” và lý do yêu cầu phương án khác; liên kết về đúng mục, giữ các lựa chọn còn lại.
- Nút xác nhận cho success inline có nhãn demo và ghi chú không đồng nghĩa booking. Có trạng thái trống khi chưa giữ mục nào.
- Khi sửa sau xác nhận, success cũ không còn đại diện phiên bản mới; yêu cầu xác nhận lại, không xóa các lựa chọn khác.
- Kiểm tra logic: cuộn/đổi beat không reset state; sửa mục B giữ mục A; xác nhận không xóa cờ cần kiểm tra; sửa sau xác nhận bỏ confirmed; không xác nhận khi chưa có mục được giữ.

**Acceptance criteria:** Thực hiện được vòng Cùng xây → Xác nhận → chỉnh một phần → Xác nhận; dữ liệu khớp ở hai section. Thành công chỉ xuất hiện sau click của người xem, và không tự dẫn đến một booking giả.

**Do not change:** Luồng `/trip-plan`, dữ liệu tài khoản hoặc buộc đồng ý/từ chối toàn bộ kế hoạch.

### LP-07 — Dựng Final value và footer

**Objective:** Nối rõ itinerary với trải nghiệm chuyến đi, kết thúc bằng một CTA có đích dùng được.

**Context and constraints:** Theo spec Section 5 và footer mục 4. Chọn layout ảnh 7/text 5, không dùng tổng span vượt 12 cột.

**Files to inspect:** LandingPage, PlanningCanvas, LandingFooter, CSS, ảnh cuối và điểm vào `/create-trip`.

**Required changes:**

- H2 “Bạn vẫn quyết định mọi điều quan trọng. Không cần tự xử lý mọi việc ở giữa.”
- Tóm tắt ba ý: AI tìm/tổng hợp/sắp xếp/cập nhật; người dùng ưu tiên/chọn/chỉnh/xác nhận; người dùng rà soát chi tiết và trải nghiệm chuyến đi.
- Nối nét route trên giấy sang con đường trong ảnh bằng vị trí/crop và SVG overlay có chủ đích; sau một chuyển cảnh, để ảnh ổn định.
- Closing “AI giúp bạn chuẩn bị kế hoạch. Chuyến đi vẫn là lựa chọn của bạn.”
- Một CTA cuối tới demo hiện có theo mục 3; chú thích rõ trước khi người xem rời landing. Không tự chuyển route khi cuộn hết trang.
- Footer gọn có logo và liên kết thật; không thêm feature list, kiến trúc agent, tuyên bố pháp nhân hoặc liên hệ chưa được xác minh.

**Acceptance criteria:** Ảnh và route nối được về mặt thị giác ở 1440 và 1280 px, headline không che chủ thể; CTA mở đúng `/create-trip`; footer không lặp lại câu chuyện mới. Ảnh tĩnh khi reduced motion vẫn truyền tải phép nối.

**Do not change:** Video autoplay, testimonial/số liệu marketing, hoặc copy “AI tự hoàn thiện mọi thứ” làm mất quyền quyết định của người dùng.

### LP-08 — Hoàn thiện chuyển động, responsive và accessibility

**Objective:** Trang liền mạch, dùng được bằng bàn phím và không phụ thuộc vào motion để hiểu nội dung.

**Context and constraints:** Theo spec mục 6–8; không mở rộng thành thiết kế mobile đầy đủ.

**Files to inspect:** Toàn bộ landing và phần tích hợp shell, Image/font usage, observer/listener cleanup.

**Required changes:**

- Đồng bộ nhịp 350–700 ms, ưu tiên transform và opacity của phần tử liên quan; không fade toàn canvas để đổi cảnh. Một transition ngắn được phép kết thúc khi ngừng cuộn, nhưng không tự chuyển beat tiếp theo.
- Dùng IntersectionObserver cho beat/nav; cập nhật khi beat thực sự đổi, không setState toàn trang trên mỗi pixel scroll. Cleanup observer/listener khi rời route.
- Kiểm tra sticky không bị ancestor overflow/transform phá; chỉ bật khi chiều cao khả dụng chứa được canvas và controls. Nếu không đủ, chuyển sang các khung tuần tự tĩnh.
- 1280 px giảm khoảng cách vừa phải; 1024–1279 px thu gọn hoặc dùng sequence tĩnh. Dưới 1024 px xếp dọc, không scale nguyên desktop và không giấu nội dung thiết yếu.
- Với reduced motion: tắt smooth scroll, parallax và chuyển động route dài; trình bày các trạng thái tĩnh có thứ tự. Không chỉ đặt duration=0 mà bỏ mất các beat.
- Bảo đảm focus-visible, tab order theo nội dung, nút có tên, trạng thái pressed/expanded phù hợp. Inline response dùng thông báo vừa đủ; không đọc lại toàn itinerary mỗi lần cuộn.
- Chữ/nút là HTML, SVG trang trí được ẩn khỏi accessibility tree; ảnh ý nghĩa có alt. Icon-only control được đặt tên ở button, không dựa riêng vào title của SVG.
- Ảnh có dimensions/aspect-ratio và sizes đúng; tối ưu ảnh hero, lazy-load ảnh dưới fold. Giữ chữ/CTA có thể đọc trước khi JS hoàn tất; không đặt cả trang opacity=0 chờ animation.
- Đặt title/description riêng của landing đúng VISTRA và text/image; không để câu chữ design system trong metadata.

**Acceptance criteria:** Không tràn ngang/cắt chữ tại các viewport kiểm tra; không bị mắc cuộn; 200% zoom vẫn đọc và thao tác được; reduced motion giữ đủ câu chuyện; rời/vào route không nhân đôi observer hay reset bất ngờ. Đo contrast các cặp màu dùng thực tế.

**Do not change:** Cài thêm thư viện motion/scroll chỉ để tiện triển khai, hoặc đổi app-wide CSS để sửa một vấn đề riêng landing.

### LP-09 — Nghiệm thu độc lập và gửi vòng sửa

**Objective:** Codex xác nhận thành phẩm đáp ứng thiết kế, tương tác và phạm vi dựa trên bằng chứng thật.

**Context and constraints:** Kết quả tự báo của Antigravity không thay cho review. Lỗi frontend được gửi lại Antigravity sửa; Codex không tự vá frontend.

**Files to inspect:** Toàn bộ diff, files mới, assets, kết quả các lệnh và screenshot. Đối chiếu checklist gốc mục 8.

**Required changes / actions:**

- Kiểm tra theo ma trận mục 8, chạy lint/build và kiểm tra logic demo.
- Review những phần chạm layout dùng chung và smoke-test năm route chức năng, gồm chức năng in của `/trip-plan` nếu thay đổi ảnh hưởng CSS/layout.
- Đối chiếu nguồn asset, mock labels, CTA, nhận diện cùng vật thể và biến đổi có nguyên nhân; xem trang cuộn thật, không chỉ screenshot từng section.
- Gửi lỗi cụ thể bằng task sửa: đường dẫn, bước tái hiện, actual/expected, acceptance criterion bị vi phạm và ảnh/lỗi liên quan.
- Sau vòng sửa, kiểm tra lại phần bị ảnh hưởng và các checks cần thiết. Không mở thêm hạng mục cải tiến ngoài phạm vi.
- Bàn giao danh sách file, kết quả check, ảnh/video bằng chứng, giả định còn lại và việc chưa kiểm tra được.

**Acceptance criteria:** Tất cả tiêu chí bắt buộc có bằng chứng đạt, hoặc ghi rõ chưa đạt/chưa kiểm tra; không gọi toàn bộ task DONE khi còn lỗi chặn. Không có thay đổi ngoài phạm vi và không có nút giả.

**Do not change:** Tự commit/push/deploy, bỏ qua lỗi runtime vì build đã pass, hoặc tự hoàn thiện frontend khi kênh Antigravity bị mất.

### LP-10 — Căn chỉnh visual system và nhịp bố cục toàn landing

**Objective:** Chuẩn hóa ngôn ngữ hình ảnh source-faithful và giảm khoảng trắng lớn trước khi nâng cấp từng section.

**Execution model:** Đây là task cha, không giao nguyên khối cho một agent. Giao LP-10A/B/C thành ba Antigravity session qua CLI, IDE/Computer Use hoặc chat theo yêu cầu và ngữ cảnh. Các session dùng chung working tree hiện tại nên mỗi agent chỉ sửa đúng file thuộc quyền sở hữu ghi bên dưới; không chạy formatter hoặc chỉnh sửa chéo file. LP-10C dùng hợp đồng token/API cố định nên có thể triển khai song song. Sau khi hoàn tất, Codex review diff ba phạm vi rồi chạy kiểm tra tích hợp; chỉ nghiệm thu LP-10 khi qua bước này.

**Context and constraints:** Đọc hợp đồng LP-10–LP-17 ở mục 4 và style guide `C:\Users\yuuki\Downloads\source_faithful_visual_style_guide.md`. Giữ nội dung/sản phẩm của design spec gốc. Không đổi route hoặc làm lại các page chức năng.

**Shared contract:**

- LP-10A cung cấp theme scope `.landingTheme` trên route `/` với các CSS variables `--vistra-turquoise`, `--vistra-aqua`, `--vistra-warm-neutral`, `--vistra-royal-blue`, `--vistra-navy`, `--vistra-mint`, `--vistra-cyan`, `--vistra-yellow` và `--vistra-ai-violet`. Giá trị lấy từ palette ở mục 4; violet chỉ dùng cho marker AI.
- LP-10B cung cấp named export `LandingEditorialMotif` từ `src/components/landing/LandingEditorialMotif.tsx`, nhận `variant="sunrise" | "route" | "terrain"`. Đây là trang trí SVG tĩnh, có `aria-hidden`, dùng token trên với fallback cục bộ.
- LP-10C có thể tham chiếu hai hợp đồng này khi viết; build đầy đủ được chạy sau khi tích hợp các branch để các file mới đã có mặt.

**Integration and validation:** Codex kiểm tra diff từng branch, tích hợp theo quyền sở hữu file, xác nhận token và motif được dùng trên landing, rồi chạy test landing, lint, build, Playwright ở 1440 × 900, 1280 × 720 và 390 px, cùng smoke test các route chức năng. Báo rõ mọi kiểm tra không chạy được; không nhận task cha là DONE nếu còn lỗi hoặc thiếu browser review.

**Overall acceptance criteria:** Có mảng turquoise/aqua rõ ràng, navy/royal blue làm cấu trúc, warm neutral cho nội dung, vàng hiếm và violet không thống trị; hình khối gợi travel/editorial; không còn vùng trống lớn vô chủ; chữ/nút đủ tương phản; các route khác giữ nguyên.

**Do not change:** Nội dung/logic tương tác của năm section, package/lockfile, shared styling ngoài route landing hoặc ảnh photorealistic đại trà chưa kiểm tra nguồn/quyền dùng.

#### LP-10A — Scoped palette tokens

**Objective:** Cung cấp palette dùng chung cho landing, giới hạn trong route `/`.

**Files to inspect:** `AGENTS.md`, mục 4 của plan này, `src/app/page.tsx`, `src/components/landing/landing.module.css`, và hướng dẫn Next.js 16 liên quan CSS trong `node_modules/next/dist/docs/`.

**Files owned:** `src/app/page.tsx` và file mới `src/app/page.module.css`.

**Required changes:** Tạo class `.landingTheme` trong CSS Module với shared contract tokens ở LP-10; bọc `LandingPage` bằng class này để tokens kế thừa trong toàn landing. Dùng giá trị palette đã chốt ở mục 4; không đưa token vào `globals.css`.

**Acceptance criteria:** Token scope chỉ bao phủ trang chủ, có đủ tên và giá trị palette theo contract; wrapper không thay đổi layout hay hành vi hiện có.

**Do not change:** `LandingPage.tsx`, stylesheet/component header-footer, route khác, interaction/copy, dependency hoặc lockfile.

#### LP-10B — Editorial motif component

**Objective:** Tạo một component trang trí nhỏ, tái sử dụng được để đưa hình học travel/editorial vào landing.

**Files to inspect:** `AGENTS.md`, mục 4 của plan này, `src/components/ui/Icon.tsx` và component/CSS landing hiện có.

**Files owned:** Hai file mới `src/components/landing/LandingEditorialMotif.tsx` và `src/components/landing/landing-editorial-motif.module.css`.

**Required changes:** Export `LandingEditorialMotif` theo shared API LP-10. Cung cấp ba biến thể `sunrise`, `route`, `terrain` bằng SVG/CSS hình học tĩnh; dùng palette tokens với fallback; giữ motif trang trí `aria-hidden` và không thêm ảnh, package hay motion.

**Acceptance criteria:** Component render đúng ba biến thể, ổn định giữa các lần render, không ảnh hưởng kích thước nội dung lân cận và không thêm dependency.

**Do not change:** `LandingPage.tsx`, `landing.module.css`, route entry, header/footer hoặc interaction/copy.

#### LP-10C — Apply palette and section rhythm

**Objective:** Áp dụng visual foundation lên năm section hiện tại, giảm chỗ trống vô ích và giữ bố cục có nhịp riêng.

**Files to inspect:** `AGENTS.md`, mục 4 và shared contract của LP-10, `LandingPage.tsx`, `landing.module.css`, các screenshot baseline 1440 × 900, 1280 × 720 và 390 px; hướng dẫn Next.js 16 về CSS trong `node_modules/next/dist/docs/`.

**Files owned:** `src/components/landing/LandingPage.tsx` và `src/components/landing/landing.module.css`.

**Required changes:** Chuyển màu cũ sang CSS variables LP-10A; dùng `LandingEditorialMotif` LP-10B có chọn lọc; giảm section spacing về khoảng 64–96 px và tăng container tối đa khoảng 1320 px ở desktop. Đặt mảng nền turquoise/aqua, blue/navy và warm neutral khác nhau theo hợp đồng mục 4; giữ chữ dễ đọc và không lấp chỗ trống bằng card trang trí.

**Acceptance criteria:** Năm section dùng chung palette mới nhưng vẫn có nhịp nền/phân cấp riêng; không còn vùng trống lớn không có vai trò; nội dung đọc được ở desktop và mobile; không tràn ngang; state/copy/CTA hoạt động như trước.

**Do not change:** `src/app/page.tsx`, `page.module.css`, `globals.css`, Header/Footer, state machine, nội dung/copy, logic từng section thuộc LP-11–LP-15, route chức năng, dependency hoặc lockfile.

### LP-11 — Nâng cấp Hero: plan nhiều note/edge, không còn khoảng trống vô nghĩa

**Objective:** Làm Hero giàu chi tiết hơn để ngay màn đầu người xem hiểu đầu vào text/image được chuyển thành một draft plan có cấu trúc.

**Context and constraints:** Theo hợp đồng chung và user direction: draft plan cần nhiều note/edge hơn. Dùng bố cục cân bằng với một narrative chính; không lấp kín bằng card trang trí hay sao chép bố cục ảnh thành dashboard SaaS.

**Files to inspect:** Hero/PlanningCanvas/fixture/CSS hiện tại, assets được LP-10 giữ lại, design spec gốc và source-faithful style guide.

**Required changes:**

- Thêm vào draft plan những địa điểm, ghi chú sở thích/giới hạn, thời điểm và các tuyến/quan hệ cần thiết; giữ nội dung mẫu ổn định, nhất quán với các section sau.
- Dùng note/edge đồ họa hình học và các lớp hình ảnh travel editorial; phân biệt edge tuyến, edge quan hệ và note cần kiểm tra bằng label/ký hiệu dễ hiểu.
- Gắn visual với input bằng văn bản và ảnh cảm hứng; giữ thông điệp đây là demo, không ám chỉ AI/backend đang chạy thật.
- Cân lại hero để text, CTA và draft plan cùng chiếm dụng không gian hợp lý; loại vùng trống lớn hoặc vùng visual rỗng hiện tại.
- Giữ một H1 chính, thứ tự focus hợp lý, nội dung tĩnh đầy đủ khi reduced motion; CTA tới đúng anchor.

**Acceptance criteria:** Ở 1440 × 900, draft plan có tối thiểu 5 note có ý nghĩa và 4 edge phân biệt được, nhưng H1/CTA vẫn rõ; không có khoảng trống lớn ở bên cạnh hoặc bên dưới visual; người xem hiểu note đến từ text/image và đây là draft minh họa; ở 1280 × 720 và 390 px không cắt CTA/nội dung thiết yếu.

**Do not change:** Copy H1 đã chốt, route sản phẩm, thêm upload giả, autoplay, metric không có nguồn hoặc tăng số phần tử chỉ để lấp chỗ trống.

#### LP-11A — Hero draft board nhiều note/edge

**Objective:** Tạo visual board để thể hiện input text/image thành draft plan nhiều note/edge.
**Context and constraints:** Phần board của LP-11; tuân thủ shared execution contract, không tạo workflow state.
**Files to inspect:** Hero/PlanningCanvas, fixture text/image, motif LP-10B và parent LP-11.
**Files owned:** src/components/landing/hero/HeroDraftBoard.tsx, hero-draft-board.module.css.
**Required changes:** Tạo board tĩnh có ít nhất 5 note và 4 edge có nghĩa; phân biệt input ảnh/text, sở thích/giới hạn, thời điểm, tuyến và quan hệ cần xem xét. Dùng visual LP-10; ghi rõ đây là draft minh họa.
**Acceptance criteria:** Note/edge đọc được trên desktop/mobile, không có phần tử chỉ để lấp chỗ; export default HeroDraftBoard() không props để LP-11B dùng trực tiếp.
**Do not change:** Copy, state, LandingPage.tsx, landing.module.css, fixture/route/header/footer dùng chung.

#### LP-11B — Hero narrative và composition

**Objective:** Tạo Hero cân bằng narrative, CTA và draft board.
**Context and constraints:** Phần composition LP-11; HeroDraftBoard() không props là API cố định để chạy song song LP-11A.
**Files to inspect:** H1/CTA, LP-11A export contract, visual tokens và parent LP-11.
**Files owned:** src/components/landing/hero/LandingHero.tsx, landing-hero.module.css.
**Required changes:** Tạo section Hero với H1/copy đã chốt, CTA tới anchor hiện có, scroll cue phù hợp và HeroDraftBoard; cân bằng narrative/board, không biến thành dashboard.
**Acceptance criteria:** H1 rõ, CTA có href thật, desktop/mobile không cắt nội dung; import HeroDraftBoard theo contract LP-11A; export default LandingHero() cho LP-16A.
**Do not change:** H1/copy, href, app entry, stylesheet tổng, state/hành vi.

### LP-12 — Nâng cấp Khám phá: 4 beat trong workspace hai cột gọn

**Objective:** Kể đủ chuyển đổi A→D trong một workbench gọn, giảm kéo dọc và dùng diện tích visual bên phải có ích.

**Context and constraints:** Đây là redesign của Khám phá hiện có. Theo hợp đồng mục 4 và ý tưởng thiết kế người dùng; workspace desktop có chiều cao ổn định, ưu tiên hai cột chính. Không biến bốn beat thành bốn section toàn chiều cao.

**Files to inspect:** LandingStory/Explore/PlanningCanvas, fixture/state, CSS, screenshot từng beat và browser behavior hiện tại.

**Required changes:**

- Giữ phần beat/narrative và phân tích ở trái; map note/edge ở phải. Tích hợp các bước phân tích vào panel trái dạng danh sách gọn/accordion; chi tiết xem bằng dropdown hoặc một vùng cuộn có giới hạn.
- Beat A: các địa điểm/thông tin rời rạc ở trái; bên phải thể hiện notes cùng matrix edges, chưa sắp thành tuyến hoàn chỉnh.
- Beat B: nối các note bằng graph edges nhưng chưa xếp thứ tự; bố trí keyword card phân tán có chủ đích, nội dung tạo xung đột dễ hiểu. Conflict preview xuất hiện khi hover edge; click/focus/tap mở hoặc ghim cùng chi tiết.
- Beat C: panel trái nêu problem ưu tiên và solution tương ứng; map làm nổi edge đã tối ưu, có card reason/solution khi hover và thao tác click/focus/tap.
- Beat D: panel trái cho chọn ngày bằng dropdown và xem các action của ngày đó; bên phải graph note/edge hiển thị solution mà plan xoay quanh.
- Beat navigation đồng bộ nội dung/map; giữ node ID và state khi đổi beat hoặc cuộn ngược. Dùng status/summary dễ thấy để conflict/solution quan trọng không phụ thuộc hover.
- Giữ workspace Explore cao đúng 560 px tại 1440 × 900; nếu viewport thấp hơn khoảng 760 px/zoom lớn thì chuyển sang flow hoặc accordion, không clip và không khóa cuộn.

**Acceptance criteria:** Codex/Antigravity có thể chứng minh đủ A/B/C/D và các trạng thái; workspace cao 560 px ở 1440 × 900, không có cột thứ ba bóp map; ở desktop không còn vùng canvas rỗng lớn hoặc section kéo dài chỉ vì sticky; hover, click, keyboard focus và tap đều đọc được chi tiết; scroll nội bộ tối đa một vùng; mobile/viewport thấp đọc tuần tự không mất nội dung.

**Do not change:** Tự cuộn/scroll-jacking, random lại bố cục mỗi render, hover-only thông tin bắt buộc, ba vùng scroll lồng nhau, bản đồ địa lý thật hoặc dữ liệu địa điểm có thể bị hiểu là đã xác minh.

#### LP-12A — Analysis rail và điều hướng bốn beat

**Objective:** Tạo rail trái để đọc phân tích và chuyển beat A–D.
**Context and constraints:** Phần analysis LP-12; activeBeat controlled từ parent, detail không phụ thuộc hover.
**Files to inspect:** Beat copy, step actions, fixture/state, shared contract và parent LP-12.
**Files owned:** src/components/landing/explore/ExploreAnalysisRail.tsx, explore-analysis-rail.module.css.
**Required changes:** Tạo rail trái controlled bằng activeBeat: 'A' | 'B' | 'C' | 'D' và onBeatChange(beat); hiển thị phân tích gọn, details qua disclosure/dropdown hoặc một vùng scroll. Beat C nêu problem/solution; beat D xem action theo ngày.
**Acceptance criteria:** Bốn beat thao tác được bằng chuột/bàn phím/tap; trạng thái rõ; export default component.
**Do not change:** LandingPage.tsx, state/fixture dùng chung, chiều cao/scroll tổng workspace.

#### LP-12B — Plan graph workspace

**Objective:** Tạo map phải cho thấy graph thay đổi theo beat A–D.
**Context and constraints:** Phần workspace LP-12; controlled bằng activeBeat, không sửa rail.
**Files to inspect:** Note/edge fixture, map renderer, interactions và parent LP-12.
**Files owned:** src/components/landing/explore/ExplorePlanWorkspace.tsx, explore-plan-workspace.module.css.
**Required changes:** Tạo graph phải controlled bằng cùng activeBeat. A là mảnh rời/matrix; B nối note nhưng chưa xếp thứ tự và cho xem conflict; C highlight edge tối ưu cùng reason/solution; D giữ graph của plan chọn. Edge details hỗ trợ hover, click, keyboard focus và tap.
**Acceptance criteria:** Beat map đồng bộ; marker/edge có label, trạng thái focus và target thao tác; không tự tạo nested scroll.
**Do not change:** Shared beat state, fixture, địa lý/số liệu chưa xác minh.

### LP-13 — Nâng cấp Cùng xây: chat, map, lựa chọn và trade-off cùng màn hình

**Objective:** Cho người dùng xem và chỉnh chat, địa điểm, tuyến và hệ quả trong cùng một workspace trực quan.

**Context and constraints:** State vẫn là demo cục bộ, dùng cùng fixture và actions hiện có. Tổ chức hai vùng chính (session/chat và plan editor), không xếp cả bốn module thành các section dọc tách rời.

**Files to inspect:** State/actions của landing, component Cùng xây, map/card địa điểm, CSS và logic test hiện tại.

**Required changes:**

- Tạo workspace gồm session chat; map note/edge thể hiện thứ tự hành trình; card địa điểm selected/not selected; và trade-off summary hiển thị ngay dưới/tại cuối vùng plan.
- Bố trí chat và plan editor cạnh nhau trên desktop; card địa điểm có thể chọn/bỏ chọn, nhận diện trạng thái không chỉ bằng màu và cập nhật map ngay.
- Cho sắp xếp thứ tự tuyến theo mong muốn người dùng. Nếu có drag, bổ sung thao tác bàn phím dễ tìm (lên/xuống hoặc move trước/sau) và thông báo thứ tự mới; ưu tiên nút reorder native nếu drag làm tăng độ phức tạp.
- Sau khi chọn/bỏ/sắp xếp, cập nhật cạnh tuyến và trade-off có thật trong fixture demo, ví dụ đổi thứ tự làm phát sinh/giảm quay lại hoặc thêm thời gian di chuyển; không bịa số phút/khoảng cách chính xác.
- Chat đưa ra giải thích ngắn theo thay đổi; không thay đổi ngầm lựa chọn của người dùng và không chiếm diện tích map bằng transcript dài. Có cách xem hội thoại cũ nếu cần.
- Tại 1440 × 900, giữ chat/map/card/trade-off trong cùng một workspace nhìn thấy được; ở chiều cao thấp hoặc màn hình nhỏ chuyển sang flow tự nhiên, vẫn giữ summary trade-off rõ và tránh nested scroll.

**Acceptance criteria:** Trong một lượt tương tác, chọn/bỏ địa điểm và reorder làm map, thứ tự, chat summary và trade-off cùng nhất quán; thao tác được bằng chuột và bàn phím; selected/unselected phân biệt rõ; toàn bộ thành phần chính thuộc cùng workspace, không cần chuyển route/tab để tìm trade-off.

**Do not change:** Backend chat, drag-and-drop dependency mới, tự xóa/đổi địa điểm khi AI trả lời, nhiều panel cuộn độc lập hoặc trade-off suy diễn thành số liệu chính xác.

#### LP-13A — Session chat panel

**Objective:** Tạo chat demo gọn giải thích phản hồi khi người dùng chỉnh hành trình.
**Context and constraints:** Phần chat LP-13; không gọi backend hoặc thay đổi lựa chọn ngoài callback.
**Files to inspect:** Message fixture, send/reply actions, controls và parent LP-13.
**Files owned:** src/components/landing/co-create/CoCreateChatPanel.tsx, co-create-chat-panel.module.css.
**Required changes:** Tạo chat gọn nhận messages/onSend qua typed props; nêu rõ demo cục bộ, giải thích thay đổi ngắn, có cách xem message cũ; không đổi lựa chọn ngầm hay gọi backend.
**Acceptance criteria:** Control có accessible name, gửi demo không điều hướng/mất state; transcript không lấn map; export default component.
**Do not change:** API/backend, shared state/fixture, landing entry hoặc section khác.

#### LP-13B — Plan editor, lựa chọn và trade-off

**Objective:** Tạo editor địa điểm để chọn/bỏ, sắp xếp tuyến và xem trade-off.
**Context and constraints:** Phần editor LP-13; thao tác keyboard được, dùng dữ liệu demo hiện hữu.
**Files to inspect:** Place/activity fixture, selected ids, toggle/reorder actions, trade-off data và parent LP-13.
**Files owned:** src/components/landing/co-create/CoCreatePlanEditor.tsx, co-create-plan-editor.module.css.
**Required changes:** Editor nhận places, selectedIds, onTogglePlace, onMovePlace, tradeoffs qua typed props; card selected/unselected phân biệt ngoài màu; hiển thị route edges, trade-off summary và bàn phím reorder buttons.
**Acceptance criteria:** Chọn/bỏ/reorder gọi đúng callback; summary lấy dữ liệu demo có sẵn, không tự bịa phút/km; không cần drag dependency.
**Do not change:** Ngầm đổi lựa chọn từ chat, shared fixture/state, backend/dependency.

### LP-14 — Nâng cấp Xác nhận: focus caution, lọc và xem theo ngày

**Objective:** Giúp người dùng rà soát điều cần kiểm tra và trade-off trước, nhưng vẫn hiểu đầy đủ những gì có trong kế hoạch.

**Context and constraints:** Giữ nguyên confirm rules của hợp đồng mục 5 và LP-06. Không làm default filter tạo hiểu lầm rằng toàn bộ itinerary đã được xem hoặc xác minh.

**Files to inspect:** Confirm panel/state, day itinerary, status flags, actions từ Cùng xây và layout hiện tại.

**Required changes:**

- Tổ chức filter rõ ràng: “Cần kiểm tra / trade-off” là view mở mặc định; kèm số lượng mục và filter “Toàn bộ kế hoạch”.
- Mỗi mục caution cho biết lý do cần xem lại, ngày liên quan và nếu applicable thì trade-off người dùng đã chọn; không biến caution thành dữ kiện đã xác minh.
- Giữ workspace có chiều cao ổn định ở desktop; chọn ngày bằng dropdown/accordion để đọc chi tiết và chỉ có tối đa một vùng cuộn nội bộ.
- Cho thao tác quay lại chỉnh sửa đúng địa điểm/ngày ở Cùng xây mà giữ các lựa chọn khác; thay đổi sau xác nhận phải yêu cầu xác nhận lại theo rule cũ.
- Giữ status bằng label/icon/copy, có empty state khi không có caution, và ghi chú rõ confirm không phải booking.

**Acceptance criteria:** Default view chỉ hiển thị caution/trade-off tương ứng và count chính xác; chuyển sang toàn kế hoạch không đổi state; xem được detail theo ngày; keyboard/tap dùng được; sau sửa có confirm state đúng; trên 1280 × 720/zoom 200% nội dung không bị cắt hoặc mắc scroll.

**Do not change:** Điều kiện xác nhận đã chốt, tạo booking giả, tự đánh dấu caution là đã kiểm tra, che toàn itinerary mà không có cách chuyển view, hoặc lồng nhiều scroll container.

#### LP-14A — Filter caution/toàn kế hoạch

**Objective:** Tạo filter controlled mặc định mở caution/trade-off cần xem lại.
**Context and constraints:** Phần filter LP-14; không thay đổi itinerary hoặc confirm rules.
**Files to inspect:** Confirm state/counts, caution flags và parent LP-14.
**Files owned:** src/components/landing/confirm/ConfirmCautionFilter.tsx, confirm-caution-filter.module.css.
**Required changes:** Filter controlled bằng view: 'cautions' | 'all', cautionCount, allCount, onViewChange; mặc định focus caution/trade-off và cho chuyển sang toàn kế hoạch.
**Acceptance criteria:** Filter không đổi itinerary state; label/count phản ánh props; trạng thái không chỉ dùng màu; export default component.
**Do not change:** Confirm rules, caution flags hoặc cách sửa itinerary.

#### LP-14B — Rà soát chi tiết theo ngày

**Objective:** Tạo view controlled để rà activity/caution theo ngày và quay lại chỉnh.
**Context and constraints:** Phần day review LP-14; giữ confirm rules, không ngụ ý caution view đã duyệt tất cả.
**Files to inspect:** Day/activity fixture, caution/reason fields, edit/request-alt actions và parent LP-14.
**Files owned:** src/components/landing/confirm/ConfirmDayReview.tsx, confirm-day-review.module.css.
**Required changes:** Controlled day detail nhận ngày/activities đã lọc, callback đổi ngày và callback quay lại sửa activity; hiển thị lý do caution, trade-off đã chọn và status; dùng dropdown/accordion, tối đa một vùng scroll nội bộ.
**Acceptance criteria:** Không ám chỉ caution view đã duyệt toàn bộ plan; giữ confirm rule; keyboard/tap dùng được, không cắt chữ ở viewport thấp/zoom.
**Do not change:** Tự confirm/đánh dấu đã kiểm tra, booking, state/fixture dùng chung.

### LP-15 — Nâng cấp Final value: plan map và chi tiết địa điểm

**Objective:** Kết thúc hành trình bằng một final plan demo có thể khám phá được, gắn tuyến với giá trị thực tế cho người dùng.

**Context and constraints:** Theo yêu cầu mới: final plan demo ở trái; detail card hiện khi tương tác với note địa điểm. Kết hợp travel illustration source-faithful nhưng không dùng ảnh lớn để thay thế nội dung plan.

**Files to inspect:** Final value/CTA/footer, plan fixture, map renderer, assets và transition từ Confirm.

**Required changes:**

- Bố trí final plan demo/map bên trái, CTA/copy giải thích quyền quyết định bên phải; hiển thị note địa điểm và edge hành trình thống nhất với lựa chọn đã xác nhận.
- Hover note mở detail card; click, keyboard focus và tap cũng mở được. Giữ card trong vùng map hoặc cạnh note, không che node/edge trọng yếu; có cách đóng/quay về trạng thái map.
- Dùng hình học, mảng aqua/turquoise, navy cấu trúc và một ảnh/illustration phù hợp để tạo cảm giác chuyến đi; không trộn phong cách minh họa phẳng với ảnh photorealistic thiếu chủ đích.
- CTA cuối vẫn mô tả rõ demo và đến đúng `/create-trip`; footer gọn, chỉ giữ link hoạt động.

**Acceptance criteria:** Plan bên trái chiếm vai trò chính và card detail khớp đúng note; hover/focus/click/tap đều hoạt động; responsive không làm mất plan hoặc CTA; visual kết thúc có nhịp khác phần review và không thêm khoảng trống lớn.

**Do not change:** Tự booking, khẳng định itinerary đã được xác minh ngoài fixture, hover-only detail, tooltip phủ phần map cần đọc, link giả hoặc ảnh không rõ nguồn.

#### LP-15A — Final plan map

**Objective:** Tạo map cuối từ plan xác nhận với note/edge thao tác được.
**Context and constraints:** Phần map LP-15; không thêm dữ liệu địa lý hoặc thông tin chưa xác minh.
**Files to inspect:** Confirmed-plan fixture, note/edge renderer, final asset/crop và parent LP-15.
**Files owned:** src/components/landing/final/FinalPlanMap.tsx, final-plan-map.module.css.
**Required changes:** Plan/map bên trái lấy từ lựa chọn đã xác nhận; nhận places, edges, selectedPlaceId, onSelectPlace bằng typed props; note mở bằng hover/click/focus/tap.
**Acceptance criteria:** Graph/label đọc được, detail trigger không che edge/node trọng yếu, focus/tap tương đương hover; không dùng dữ liệu địa lý chưa xác minh.
**Do not change:** Confirm state, route, CTA/footer, fixture/CSS tổng.

#### LP-15B — Detail panel cho địa điểm

**Objective:** Tạo detail panel đúng note được chọn trên final map.
**Context and constraints:** Phần detail LP-15; props place/onClose tương thích LP-15A, không sửa map.
**Files to inspect:** Place detail fixture, LP-15A props contract, map layout và parent LP-15.
**Files owned:** src/components/landing/final/FinalPlaceDetail.tsx, final-place-detail.module.css.
**Required changes:** Detail nhận place/onClose qua typed props, trình bày thông tin có sẵn cạnh map, có close control và trạng thái rỗng.
**Acceptance criteria:** Mở/đóng bằng keyboard/tap; nội dung khớp note đang chọn; close control có tên accessible; export default component.
**Do not change:** Tự bổ sung dữ liệu, hover-only tooltip, CTA hoặc layout root.

### LP-16 — Tích hợp, responsive/accessibility và tự review bằng Playwright MCP

**Objective:** Tự kiểm tra landing đã nâng cấp trong browser, sửa lỗi thuộc phạm vi và gửi evidence cụ thể cho Codex.

**Context and constraints:** Dùng Playwright MCP đã cấu hình trong Antigravity để mở route local và kiểm tra viewport/state thực tế. Không ghi “đã test” nếu chỉ build hoặc xem code. Không thêm dependency Playwright vào repo chỉ để đáp ứng task này.

**Files to inspect:** Toàn bộ landing diff, `AGENTS.md`, plan này, package scripts, route chức năng bị ảnh hưởng và các component đã đổi từ LP-10–LP-15.

**Required changes / actions:**

- Chạy checks hiện có (lint/build/logic check) và ghi chính xác lệnh/kết quả; sửa lỗi do task tạo.
- Dùng Playwright MCP để xem `/` ở 1440 × 900, 1280 × 720, 1024 × 768 và 390 × 844; chụp full page và từng trạng thái cần chứng minh.
- Tương tác thực tế: Explore A→D; mở conflict/solution bằng hover, focus và click/tap; đổi ngày; chọn/bỏ/reorder địa điểm; kiểm tra trade-off; chuyển filter caution/all; xác nhận và sửa sau confirm; mở detail note cuối trang.
- Kiểm tra chiều cao workspace, khoảng trắng, overflow ngang/dọc, vùng cuộn lồng nhau, text clip, focus indicator, reduced motion và browser console/runtime errors.
- Smoke-test các route chức năng theo mục 8; nếu MCP/browser hoặc route local không hoạt động, báo lỗi nguyên văn và phân biệt blocker công cụ với lỗi app.
- Trả về screenshots hoặc artifact path, viewport, trạng thái demo, checks đã chạy, lỗi còn lại và danh sách file đổi. Đánh dấu READY_FOR_REVIEW, không tự coi đây là nghiệm thu Codex.

**Acceptance criteria:** Có evidence từ Playwright MCP cho các viewport và tương tác nêu trên; không có blocker visual/interaction; mọi lỗi chưa sửa được nêu cụ thể; các check không được chạy được phân loại rõ, không suy đoán pass.

**Do not change:** Cài dependency, thay route chức năng ngoài yêu cầu, bỏ test vì screenshot đẹp, hoặc ghi kết quả Playwright khi chưa thực sự thao tác browser.

#### LP-16A — Tích hợp các section vào landing

**Objective:** Ghép section LP-11–LP-15 và nối với state/action hiện có.
**Context and constraints:** Bắt đầu sau review output LP-11A/B–LP-15A/B; một owner sửa entry/layout.
**Files to inspect:** Section components đã review, LandingPage.tsx, landing.module.css, state/actions và Next.js docs.
**Files owned:** src/components/landing/LandingPage.tsx, src/components/landing/landing.module.css.
**Required changes:** Ghép Hero, Explore rail/workspace, Co-create chat/editor, Confirm filter/day review, Final map/detail; nối controlled props vào state/handler hiện có; giữ một source of truth.
**Acceptance criteria:** Cùng plan/selection đi xuyên năm section; anchor/header/footer/copy/CTA đúng; không còn markup cũ trùng; chỉ sửa hai file đã sở hữu.
**Do not change:** Section components, page.tsx/page.module.css/globals, fixture, routes, dependency, copy.

#### LP-16B — Playwright kiểm tra interaction

**Objective:** Chứng minh luồng tương tác desktop hoạt động trên landing tích hợp.
**Context and constraints:** QA chỉ đọc sau LP-16A; dùng browser context riêng hoặc chạy tuần tự khi context dùng chung.
**Files to inspect:** Landing local, parent LP-16, acceptance matrix mục 8 và Playwright MCP.
**Files owned:** Không sửa code; chỉ lưu evidence theo workflow hiện có.
**Required changes:** Playwright MCP: Explore A→D; edge conflict/solution bằng hover/focus/click; đổi ngày; chọn/bỏ/reorder; chat/trade-off; filter caution/all; confirm và sửa sau confirm; final note detail/CTA.
**Acceptance criteria:** Ghi route, viewport, bước, actual, console/runtime errors và screenshot; phân biệt lỗi app với MCP.
**Do not change:** Source code hoặc browser context LP-16C; nếu không có context riêng thì chạy browser checks nối tiếp.

#### LP-16C — Responsive/accessibility/reduced motion

**Objective:** Tìm lỗi responsive, keyboard/accessibility và reduced motion.
**Context and constraints:** QA chỉ đọc sau LP-16A; không chỉnh code, dùng context riêng nếu chạy với LP-16B.
**Files to inspect:** Landing và component CSS sau LP-16A, parent LP-16, acceptance matrix mục 8.
**Files owned:** Không sửa code; chỉ lưu evidence theo workflow hiện có.
**Required changes:** Context riêng: kiểm tra 1440×900, 1280×720, 1024×768, 390×844; keyboard/tab/focus, zoom 200%, reduced motion, overflow, clipping, nested scroll, contrast cơ bản và hover alternatives.
**Acceptance criteria:** Ghi finding theo viewport/state, actual/expected và screenshot; ghi BLOCKED nếu công cụ không hỗ trợ.
**Do not change:** Code hoặc browser state LP-16B; dùng tuần tự nếu MCP không cô lập được context.

#### LP-16D — Automated checks và route smoke checks

**Objective:** Xác nhận lint/build/logic checks và route liên quan bằng lệnh hiện có.
**Context and constraints:** Kiểm tra chỉ đọc sau LP-16A; logic test/lint có thể chạy cùng QA, production build chạy sau browser QA trừ khi output/server được cô lập; không cài tool hoặc sửa code/dependency.
**Files to inspect:** package.json scripts, test hiện có, diff LP-16A và route bị ảnh hưởng.
**Files owned:** Không sửa code; chỉ ghi log/kết quả.
**Required changes:** Chạy logic test, lint, production build hiện có; smoke-test route chức năng nếu integration ảnh hưởng shared layout/entry; ghi command, exit code, warning/error.
**Acceptance criteria:** Không gọi “chưa chạy” là pass; tách lỗi nền có sẵn khỏi lỗi task.
**Do not change:** Source code, package/lockfile hoặc cài công cụ.

#### LP-16E — Correction queue sau QA

**Objective:** Khép findings LP-16B/C/D bằng correction có owner và acceptance rõ.
**Context and constraints:** Bắt đầu sau QA; chỉ song song correction khi file allowlists rời nhau.
**Files to inspect:** QA evidence, owner file, repro steps và criterion bị vi phạm.
**Files owned:** Chỉ file được gán trong từng correction; correction chạy song song chỉ khi file ownership rời nhau.
**Required changes:** Mỗi finding có task riêng kèm viewport/state/file, repro, actual/expected và criterion; sửa qua Antigravity đúng owner file, chạy lại check liên quan. Nếu không có lỗi, ghi NO_CORRECTIONS cùng evidence.
**Acceptance criteria:** Mọi finding được fixed/rechecked hoặc ghi blocker; không sửa ngoài phạm vi; bàn giao đủ cho LP-17.
**Do not change:** Codex sửa frontend, commit/push/deploy hoặc file ngoài correction allowlist.

### LP-17 — Nghiệm thu độc lập sau nâng cấp và gửi vòng sửa

**Objective:** Codex xác nhận chặng LP-10–LP-16 bằng diff, checks và browser evidence độc lập.

**Context and constraints:** Giữ nguyên quy tắc review độc lập của LP-09; Antigravity tự review không thay thế nghiệm thu Codex. Mọi frontend correction quay lại Antigravity.

**Files to inspect:** Diff từ LP-10–LP-16, báo cáo Playwright MCP, screenshots, kiểm tra build/lint, plan và AGENTS.md có hiệu lực.

**Required changes / actions:**

- Đối chiếu style thực tế với hợp đồng mục 4 và user direction: đủ nội dung có ích, không tái tạo khoảng trắng lớn, đúng mảng màu/geometry, responsive.
- Kiểm tra flow tương tác cùng state, keyboard/tap equivalents, một vùng scroll tối đa/workspace, caution/all, confirm rules và route chức năng.
- Chạy các checks cần thiết sau khi đọc báo cáo; không yêu cầu chạy lại toàn bộ suite nếu không có suite hoặc đã có evidence tươi, đáng tin.
- Gửi Antigravity correction task cụ thể cho mỗi acceptance criterion chưa đạt; sau đó xem lại đúng viewport/state đã lỗi.
- Chỉ đánh dấu DONE khi có bằng chứng; nêu rõ giới hạn browser, device hoặc asset chưa xác minh.

**Acceptance criteria:** Các tiêu chí bắt buộc của LP-10–LP-16 có bằng chứng đạt hoặc được ghi rõ BLOCKED; diff không có thay đổi ngoài phạm vi; không có lỗi frontend còn lại bị bỏ qua.

**Do not change:** Codex tự sửa frontend thay Antigravity, commit/push/deploy hoặc xem report của Antigravity là bằng chứng độc lập.

## 8. Ma trận nghiệm thu và bằng chứng

### Kiểm tra giao diện và hành vi

| Nhóm | Cách kiểm tra | Điều kiện đạt |
|---|---|---|
| Desktop chuẩn | 1440 × 900, toàn trang và từng section | Grid/type/hierarchy đúng; 5 section kể đúng narrative |
| Desktop hẹp | 1280 × 800 | Không mất CTA, không đè chữ/ảnh; canvas còn đọc được |
| Desktop thấp | 1280 × 720 | Sticky vừa viewport hoặc chuyển tĩnh; controls không nằm ngoài tầm truy cập |
| Desktop tối thiểu | 1024 × 768 | Sequence tuần tự đọc được; không ép layout 1440 bằng scale |
| Dưới phạm vi thiết kế | Smoke-test 768 và 390 px | Không tràn ngang, điều hướng/CTA vẫn dùng được; không tuyên bố đã hoàn thiện mobile design |
| Multimodal | Xem hero và ghi chú demo | Nhận ra đầu vào text lẫn image, không hứa upload thật |
| Choreography | Cuộn xuống/lên, dừng giữa beat, nhảy anchor | Cùng mảnh thông tin; beat ổn định; không scroll-jacking |
| Cùng xây | Bấm ít di chuyển, giữ A, đổi B, bỏ B | Route/lịch cập nhật đồng bộ; A được giữ nguyên |
| Xác nhận | Chọn → rà soát → sửa một phần → xác nhận → sửa tiếp | Tóm tắt nhất quán; cờ cần kiểm tra còn; phải xác nhận lại phiên bản mới |
| Quyền quyết định | Chỉ cuộn qua các section | Không tự giữ mục, không tự xác nhận hoặc booking |
| Bàn phím | Tab/Shift+Tab/Enter/Space; link quay lại chỉnh | Focus rõ, không bị sticky che, không trap, tới đúng mục |
| Reduced motion | Bật trước load và thử trong phiên | Nội dung/trạng thái đầy đủ, không parallax/route animation dài |
| Contrast/zoom | Đo màu thực tế; zoom 200% | Normal text tối thiểu 4.5:1; large text và control thiết yếu tối thiểu 3:1; không mất chức năng |
| Runtime/assets | Hard refresh `/`, refresh anchor, chuyển route qua lại | Không hydration/runtime error mới, ảnh tải được, không CLS rõ do ảnh/header |
| Style fidelity | Toàn trang tại 1440 × 900 | Có mảng turquoise/aqua và navy cấu trúc; vàng hiếm, tím không thống trị; hình học editorial rõ; không có khoảng trắng lớn vô nghĩa |
| Workspace density | Hero, Explore A–D, Co-create, Confirm, Final | Nội dung chính nằm cùng workspace; không trải mỗi beat thành section toàn chiều cao; workspace không cắt nội dung khi viewport thấp |
| Explore graph | Hover/focus/click/tap các edge; đổi beat/ngày | Conflict/solution đọc được bằng mọi input; note ID/state ổn định; graph không cần hover để hiểu vấn đề chính |
| Co-create editing | Chọn/bỏ/reorder địa điểm bằng chuột và bàn phím | Map, thứ tự, lựa chọn và trade-off nhất quán sau mỗi thao tác |
| Confirm filters | Mở default caution, xem count, chuyển all, đổi ngày | Count đúng; all-plan luôn truy cập được; sửa sau confirm yêu cầu confirm lại |
| Playwright MCP | Antigravity mở route local và thao tác states | Có screenshot/evidence thực tế, ghi viewport và state; không coi build pass là UI pass |
| Hồi quy | Mở đủ 5 route ngoài `/` | Shell, icon, nội dung và hành vi có sẵn giữ nguyên |

Screenshot tối thiểu: hero; Khám phá A/B/C/D; Co-create đầy đủ chat/map/place cards/trade-off; Confirm ở caution và all-plan; Final value với detail note; toàn trang ở 1440 px; các điểm chuyển layout ở 1280/1024/390 px. Ghi viewport, trạng thái demo và motion mode trong tên/chú thích. Một đoạn quay ngắn hoặc quan sát browser trực tiếp cần chứng minh chuyển động cùng vật thể; screenshot riêng lẻ không đủ xác minh điều đó.

### Lệnh kiểm tra dự kiến khi triển khai

Chạy trong PowerShell tại project root, ghi exit code riêng cho từng lệnh:

```powershell
Set-Location -LiteralPath 'D:\VIN_20K_AI\Build_Phase\Vistra-Web'
npm.cmd run lint
npm.cmd run build
node --test src/components/landing/landingDemo.test.mjs
git diff --check
git status --short
git diff --stat
```

Node hiện được kiểm tra là v24.21.0. Nếu test `.mjs` import logic TypeScript trực tiếp, dùng module TS thuần tương thích type stripping, không JSX hoặc alias; xác minh lại Node lúc thực thi. Không thêm test framework chỉ cho các chuyển trạng thái demo này.

Chỉ chạy lệnh test sau khi Antigravity tạo file tương ứng. Build/lint warning có trước cần được ghi riêng; không sửa hàng loạt warning ở trang ngoài scope. Khi build bị lỗi tải font/network, báo đúng giới hạn môi trường và không ghi “build pass”.

Mở server local bằng script hiện có, dùng cổng thật được terminal báo và xác minh đúng process trước khi điều khiển. Không tắt server do người dùng chạy; chỉ dừng process do phiên triển khai tự tạo khi đã kiểm tra xong.

Hiệu năng: đo trên production build nếu có công cụ. Mục tiêu tham khảo LCP ≤ 2.5 s, CLS ≤ 0.1 và phản hồi click ≤ 200 ms trong điều kiện đo được ghi rõ; không suy từ build pass ra Core Web Vitals đạt. Ưu tiên phát hiện ảnh quá lớn, layout shift, JS chạy khi không cần và scroll giật; không dựng benchmark framework riêng.

## 9. Mẫu giao việc và báo cáo

### Mẫu gửi từng task cho Antigravity

```text
Task: [LP-xx và tên task]
Project: D:\VIN_20K_AI\Build_Phase\Vistra-Web
Plan: docs/plans/vistra-landing-antigravity-plan.md
Design source: C:\Users\yuuki\Downloads\landing-page-design-direction-spec-idea.md
Visual style source: C:\Users\yuuki\Downloads\source_faithful_visual_style_guide.md
Precedence: user UX requirements and LP-10–LP-16 override older layout suggestions where they conflict; see shared contract in section 4.

Objective:
[Chép mục Objective của task.]

Context and constraints:
[Task phụ thuộc đã được Codex nghiệm thu; hợp đồng chung mục 3–6 và phần visual/UX upgrade;
desktop-first; dữ liệu demo; cùng plan notes/edges/itinerary.]

Files to inspect:
[Danh sách của task, cộng file thay đổi liên quan từ task trước.]

Required changes:
[Chép danh sách Required changes của task; chỉ giao một task mỗi lần.]

Acceptance criteria:
[Chép tiêu chí của task và viewport/trạng thái cần chứng minh.]

Do not change:
[Danh sách của task; bảo toàn sửa đổi có sẵn; không commit/push/deploy.]

Return:
File đã đổi; phần đã làm; checks thực sự đã chạy và kết quả;
screenshot/bằng chứng; phần chưa đạt hoặc blocker. Dừng ở READY_FOR_REVIEW.
```

### Mẫu Codex gửi yêu cầu sửa

```text
Task correction: [LP-xx / vòng sửa]
File hoặc component:
Viewport / motion mode / demo state:
Steps to reproduce:
Actual:
Expected:
Acceptance criterion chưa đạt:
Phạm vi được sửa:
Checks cần chạy lại:
```

### Prompt khởi động để giao cho Codex ở lượt thực thi

```text
Hãy thực thi chặng nâng cấp UI/UX trong kế hoạch tại:
D:\VIN_20K_AI\Build_Phase\Vistra-Web\docs\plans\vistra-landing-antigravity-plan.md

Codex giữ vai trò orchestrator và reviewer. Toàn bộ frontend phải do AI
trong Antigravity thực hiện qua kênh phù hợp (CLI, IDE/Computer Use hoặc chat);
tôn trọng kênh người dùng chỉ định. Đọc design source, visual style source
cùng AGENTS.md có hiệu lực. Xác minh trạng thái LP-00–LP-09,
không giả định các task cũ còn TODO hoặc đã DONE; nghiệm thu LP-10 trước,
sau đó chạy LP-11A/B–LP-15A/B song song theo file ownership; chạy LP-16A tích hợp, LP-16B/C/D QA song song khi có browser context riêng, LP-16E xử lý findings, rồi nghiệm thu LP-17. Dùng Playwright MCP trong kênh có browser context phù hợp cho tự review.

Sau mỗi task, đọc diff và nghiệm thu bằng code, checks và browser thực tế.
Nếu cần sửa frontend, giao lại cho Antigravity; không tự triển khai thay.
Nếu không điều khiển được Antigravity, chẩn đoán có giới hạn và báo blocker.

Chỉ thay landing route / cùng phần tích hợp tối thiểu. Giữ nguyên các route
chức năng khác. Không commit, push, publish hoặc deploy.

Hoàn thành khi đáp ứng ma trận nghiệm thu; bàn giao file đã đổi, ảnh chứng minh,
kết quả kiểm tra thực tế và các giới hạn còn lại.
```

## 10. Checklist bàn giao cuối

- [ ] LP-00 đến LP-09 có trạng thái xác minh được; LP-10 đến LP-16 hoàn tất với evidence; LP-17 được nghiệm thu độc lập.
- [ ] Một planning table/map/itinerary được nhận ra xuyên suốt năm section.
- [ ] Hero thể hiện text và image; Khám phá biến chính dữ liệu cũ thành bản nháp.
- [ ] Cùng xây có phản hồi làm route/lịch đổi thật; Xác nhận giữ quyền quyết định ở người dùng.
- [ ] Chỉnh một phần bảo toàn phần còn lại; không auto-confirm khi cuộn.
- [ ] Route nối sang ảnh trải nghiệm cuối, không chỉ thêm ảnh trang trí.
- [ ] CTA/link dùng được, demo được gọi đúng tên, không có lời hứa AI/booking không được chứng minh.
- [ ] Desktop, chiều cao thấp, reduced motion, bàn phím và contrast đã kiểm tra.
- [ ] Style source-faithful đã áp dụng có chủ đích; không còn khoảng trắng lớn vô nghĩa hoặc nội dung thiết yếu chỉ hiện khi hover.
- [ ] Explore có 4 beat trong workspace gọn; Co-create cùng màn hình; Confirm có caution/all filter và detail theo ngày; Final có plan note detail đa input.
- [ ] Playwright MCP được dùng ở các viewport/state ghi tại mục 8; nếu bị chặn, blocker được ghi đúng và không tuyên bố UI pass.
- [ ] Lint/build/test logic/diff review được ghi kết quả trung thực.
- [ ] Năm route chức năng không bị thay đổi ngoài chủ ý; không phát sinh dependency không cần thiết.
- [ ] Có báo cáo rõ asset/URL còn thiếu hoặc checks chưa chạy; chưa deploy nếu chưa được yêu cầu.
