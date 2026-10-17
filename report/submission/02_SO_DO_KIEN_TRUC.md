# BÁO CÁO DỰ ÁN CAPSTONE · ĐỘI P-103
# PHẦN 2: SƠ ĐỒ KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE DIAGRAMS)

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG (HIGH-LEVEL SYSTEM ARCHITECTURE)

Hệ thống **VISTRA** được thiết kế theo mô hình **Kiến trúc phân tầng hướng dịch vụ (Multi-tiered Service-Oriented Architecture)**, kết hợp giữa mô hình RESTful API hiện đại và pipeline AI hỗ trợ hội thoại có bộ nhớ, truy xuất đa phương thức và lập lịch trình bằng công cụ:

![Sơ đồ kiến trúc tổng thể VISTRA AI Travel Platform](system_architecture.png)

> **Phạm vi cập nhật:** Chỉ cập nhật thành phần AI theo mã nguồn VISTRA ngày 17/10/2026: diễn giải hội thoại, Jev routing, Voyage/BM25, SigLIP2, OpenAI và TravelOrchestrator. Kiến trúc frontend/backend, API, mô hình dữ liệu, dịch vụ hạ tầng và triển khai được giữ nguyên theo tài liệu gốc; các phần đó không được kiểm định lại trong lần cập nhật này.

```mermaid
graph TB
    subgraph PresentationTier["1. TẦNG TRÌNH DIỄN (PRESENTATION TIER)"]
        UI_Web["Website User UI<br/>(Next.js 15 · React 19 · TypeScript)"]
        UI_Admin["Website Admin Portal<br/>(Duyệt địa điểm · Dataset · Quản lý AI)"]
    end

    subgraph ApiAgentTier["2. TẦNG API & ĐIỀU PHỐI AGENT (ORCHESTRATION TIER)"]
        API_Gateway["FastAPI Gateway / Reverse Proxy<br/>(Authentication, Rate Limiting, CORS)"]
        
        subgraph AIEngine["Pipeline AI dùng chung"]
            Chat["ChatService<br/>(Tải bộ nhớ và điều phối hội thoại)"]
            Interpreter["ConversationInterpreter<br/>(Diễn giải ý định & Ngữ cảnh hội thoại)"]
            Dispatch["Pipeline điều phối<br/>(Ý định và ràng buộc ứng dụng)"]
            JevRouter["Jev Routing<br/>(Trả lời trực tiếp / Truy xuất · Text / Hybrid)"]
            VisualSearch["SigLIP2 Visual Retrieval<br/>(Tìm ảnh địa điểm tương đồng)"]
            Retrieval["SearchService & TravelTools<br/>(Hướng dẫn, Địa điểm, Thời tiết, Di chuyển)"]
            Planner["TravelOrchestrator & Planner<br/>(Tool loop có giới hạn · Evidence notebook)"]
            Generation["DirectGenerator / RAGGenerator<br/>(OpenAI · gpt-6-luna theo cấu hình)"]
            Checks["Kiểm tra đầu ra<br/>(Grounding cho RAG · Ràng buộc cho lịch trình)"]
        end
    end

    subgraph DataStorageTier["3. TẦNG LƯU TRỮ DỮ LIỆU (DATA & VECTOR STORAGE TIER)"]
        Postgres[(PostgreSQL Production Database<br/>22 bảng dữ liệu quan hệ chuẩn 3NF)]
        Qdrant[(Qdrant Vector Engine<br/>Collections: wikivoyage, scraped_images)]
        Cloudinary[(Cloudinary Media Store<br/>Lưu trữ ảnh người dùng & Moodboard)]
    end

    subgraph ExternalServices["4. TẦNG DỊCH VỤ BÊN NGOÀI (EXTERNAL SERVICES)"]
        LLM_API["🧠 LLM API"]
        Service_OSM["OpenStreetMap (Overpass HTTP API)"]
        Service_Weather["Open-Meteo API (Thời tiết & Khí hậu)"]
        Service_ORS["OpenRouteService (Khoảng cách & Lộ trình xe)"]
        Service_FX["Frankfurter Currency API (Tỷ giá tiền tệ)"]
    end

    %% Luồng liên kết
    UI_Web -->|HTTPS / REST / Session Cookie| API_Gateway
    UI_Admin -->|HTTPS / Bearer Token| API_Gateway

    API_Gateway --> Chat
    Chat --> Interpreter
    Interpreter --> Dispatch
    Dispatch -->|Trả lời trực tiếp| Generation
    Dispatch -->|Hỏi đáp có nguồn| Retrieval
    Dispatch -->|Tạo hoặc sửa lịch trình| Planner
    Dispatch -.->|Tham vấn khi cần| JevRouter
    Retrieval -.->|Chọn text hoặc hybrid khi cần| JevRouter
    Retrieval --> VisualSearch
    Retrieval --> Generation
    Planner --> Retrieval
    Generation --> Checks
    Planner --> Checks
    Checks --> Chat
    Chat -->|Kết quả| API_Gateway

    Chat --> Postgres
    Retrieval --> Postgres
    Retrieval --> Qdrant
    VisualSearch --> Qdrant

    Interpreter -.-> LLM_API
    Generation -.-> LLM_API
    Planner -.-> LLM_API
    Retrieval -.-> Service_Weather
    Retrieval -.->|Tùy chọn, cần ORS_API_KEY| Service_ORS
```

---

## 2. PIPELINE HỘI THOẠI VÀ ĐIỀU PHỐI AI (AI ORCHESTRATION PIPELINE)

Pipeline hội thoại của VISTRA được điều phối bằng Python qua `ChatService`, `run_chat_pipeline()` và `run_pipeline()`. Mỗi lượt xử lý kết hợp tin nhắn hiện tại với bộ nhớ hội thoại để chọn cách phản hồi: xác nhận thông tin cá nhân, trả lời trực tiếp, hỏi đáp dựa trên nguồn hoặc tạo/chỉnh sửa lịch trình. Các bước diễn giải và sinh nội dung sử dụng OpenAI với model được cấu hình trong `config.yaml`, hiện tại là `gpt-6-luna`.

```mermaid
flowchart TD
    Start([Tin nhắn và định danh phiên]) --> Input[ChatService<br/>Kiểm tra đầu vào]
    Input --> Memory[Tải bộ nhớ từ PostgreSQL<br/>Lịch sử gần đây, tóm tắt, sở thích và trip_state]
    Memory --> Interpret[ConversationInterpreter<br/>Diễn giải ý định, tạo truy vấn độc lập<br/>và cập nhật yêu cầu chuyến đi]
    Interpret --> Dispatch{Chọn nhánh xử lý<br/>Theo ý định và tham số yêu cầu}
    Dispatch -.->|Tham vấn khi cần| ResponseRouter[JevResponseRouter<br/>Chọn trả lời trực tiếp hoặc truy xuất]

    Dispatch -->|Xác nhận hoặc cập nhật bộ nhớ| Ack[Phản hồi bằng logic ứng dụng]
    Dispatch -->|Trả lời trực tiếp| Direct[DirectGenerator<br/>Sinh câu trả lời từ tin nhắn và bộ nhớ]

    Dispatch -->|Hỏi đáp có nguồn| Scope[JevLocationExtractor và LocationResolver<br/>Xác định điểm đến và phạm vi truy xuất]
    Scope --> Search[JevRouter và SearchService<br/>Chọn text hoặc hybrid và tìm bằng chứng]
    Search --> Context[Tạo ngữ cảnh có nguồn<br/>Văn bản, ảnh và thời tiết theo yêu cầu]
    Context --> RAG[RAGGenerator<br/>Sinh câu trả lời dựa trên bằng chứng]
    RAG --> Grounding[Kiểm tra grounding<br/>Tham chiếu nguồn, ngôn ngữ và định dạng]
    Grounding -->|Hoàn thiện nội dung khi cần| RAG

    Dispatch -->|Tạo hoặc chỉnh sửa lịch trình| Requirements[Tổng hợp yêu cầu chuyến đi<br/>Điểm đến, ngày, ngân sách, sở thích<br/>và lịch trình hiện có]
    Requirements --> Tools[TravelOrchestrator<br/>Chọn và gọi các công cụ theo nhu cầu]
    Tools --> Notebook[Ghi kết quả công cụ vào evidence notebook]
    Notebook -->|Tiếp tục thu thập theo cấu hình| Tools
    Notebook -->|Tổng hợp bằng chứng| Planner[Planner<br/>Chọn địa điểm và sinh lịch trình có cấu trúc]
    Planner --> Schedule[Sắp lịch và kiểm tra ràng buộc<br/>Nguồn, ngày, giờ mở cửa, di chuyển và chi phí]
    Schedule -->|Tinh chỉnh theo kết quả kiểm tra và cấu hình| Planner
    Schedule --> PlanResult[Gắn nguồn và kết xuất lịch trình]

    Ack --> Output[Kiểm tra an toàn đầu ra]
    Direct --> Output
    Grounding --> Output
    PlanResult --> Output
    Output --> Save[ChatService commit lượt hội thoại<br/>Lưu tin nhắn, tóm tắt, trip_state và sở thích<br/>trong một transaction PostgreSQL]
    Save --> Client([Trả kết quả tới API hoặc giao diện<br/>JSON cho Developer API, SSE cho demo UI])
```

### 2.1. Nạp bộ nhớ và diễn giải hội thoại

`ChatService` tải lịch sử gần đây, tóm tắt phiên, sở thích dài hạn và trạng thái chuyến đi từ PostgreSQL. `ConversationInterpreter` dùng ngữ cảnh này để xác định ý định, diễn giải câu hỏi nối tiếp thành truy vấn độc lập và cập nhật thông tin như điểm đến, thời gian, ngân sách, sở thích hoặc ngày cần chỉnh sửa. Các yêu cầu xác nhận và cập nhật bộ nhớ có thể được phản hồi trực tiếp bằng logic ứng dụng.

### 2.2. Chọn cách trả lời và truy xuất bằng chứng

Pipeline chọn nhánh xử lý theo ý định hội thoại và các tham số yêu cầu. `JevResponseRouter` hỗ trợ quyết định giữa trả lời trực tiếp và truy xuất khi cần. Yêu cầu tạo hoặc chỉnh sửa lịch trình được nhận diện từ hội thoại và chuyển tới `TravelOrchestrator`.

| Nhánh | Xử lý chính |
|---|---|
| **Trả lời trực tiếp** | `DirectGenerator` tạo câu trả lời từ tin nhắn hiện tại và bộ nhớ hội thoại. |
| **Hỏi đáp có nguồn** | `JevLocationExtractor` và các bộ giải quyết địa danh xác định phạm vi. `JevRouter` hỗ trợ chọn `text` hoặc `hybrid`. `SearchService` thu thập bằng chứng, sau đó `RAGGenerator` sinh và kiểm tra câu trả lời. |
| **Tạo/chỉnh sửa lịch trình** | `TravelOrchestrator` kết hợp yêu cầu hiện tại, sở thích và lịch trình trước đó để thu thập bằng chứng, lập lịch và thực hiện chỉnh sửa theo phạm vi được yêu cầu. |

Nhánh `text` truy xuất Wikivoyage bằng dense embedding Voyage và BM25, hợp nhất thứ hạng bằng RRF. Nhánh `hybrid` thực hiện tìm kiếm văn bản và ảnh đồng thời, dùng SigLIP2 cho phần ảnh, bổ sung metadata và xếp lại ảnh theo khoảng cách đến tài liệu điểm đến phù hợp. Bằng chứng thời tiết từ Open-Meteo được bổ sung theo yêu cầu và cấu hình. `RAGGenerator` sử dụng ngữ cảnh có nguồn để soạn câu trả lời, kiểm tra grounding, ngôn ngữ cùng định dạng và hoàn thiện nội dung theo phản hồi kiểm tra.

### 2.3. Thu thập bằng chứng và lập lịch trình

`TravelOrchestrator` chuẩn hóa yêu cầu chuyến đi và điều phối các công cụ trong vòng lặp có kiểm soát. Planner lựa chọn công cụ theo bằng chứng đã có và các thông tin cần thu thập. Kết quả mỗi lần gọi được kiểm tra cấu trúc và ghi vào **evidence notebook**, tạo ngữ cảnh chung cho quá trình lập lịch.

| Công cụ | Vai trò trong pipeline |
|---|---|
| `GuideSearch` | Truy xuất hướng dẫn điểm đến và bằng chứng văn bản/ảnh theo nhánh được chọn. |
| `AttractionSearch` | Chọn địa điểm tham quan từ dữ liệu đã lập chỉ mục. |
| `RestaurantSearch` | Thu thập nhà hàng và thông tin liên quan cho các bữa ăn. |
| `AccommodationSearch` | Thu thập cơ sở lưu trú và các thuộc tính phục vụ lập lịch. |
| `WeatherSearch` | Bổ sung bằng chứng thời tiết cho ngày và địa điểm của chuyến đi. |
| `DistanceMatrix` | Thu thập khoảng cách và thời gian di chuyển qua OpenRouteService khi được cấu hình. |

Từ notebook, `Planner` sinh lịch trình có cấu trúc. Các module `scheduling` và `validation` sắp xếp hoạt động theo thời gian và kiểm tra danh tính nguồn, điểm đến, số ngày, giờ mở cửa, di chuyển, sự đa dạng địa điểm và chi phí có bằng chứng. Quá trình hoàn thiện kết hợp logic sắp lịch bằng Python với bước tinh chỉnh của Planner theo cấu hình. Khi chỉnh sửa theo ngày, pipeline giữ phạm vi chỉnh sửa gắn với yêu cầu hội thoại. Kết quả được gắn nguồn và kết xuất thành nội dung lịch trình.

### 2.4. Lưu trạng thái và trả kết quả

Sau khi kiểm tra đầu ra, `ChatService` lưu tin nhắn người dùng, câu trả lời, tóm tắt hội thoại, trạng thái chuyến đi và thay đổi sở thích trong một transaction PostgreSQL có quản lý version. Kết quả được chuyển tới lớp API/giao diện: Developer API trả JSON, còn demo UI sử dụng SSE để hiển thị nội dung và kết quả. Bộ nhớ đã lưu tiếp tục được sử dụng ở lượt hội thoại kế tiếp.

---

## 3. KIẾN TRÚC TRUY XUẤT THÔNG TIN LAI (MULTIMODAL HYBRID RAG)

VISTRA sử dụng **Multimodal Hybrid Retrieval Pipeline** để cung cấp bằng chứng văn bản và hình ảnh cho câu trả lời. Nhánh văn bản hợp nhất dense search và BM25 bằng RRF (`k=60`); nhánh ảnh dùng SigLIP2 để tìm bằng mô tả hoặc ảnh tham chiếu. Trong chế độ `hybrid`, hai nhánh tìm kiếm chạy đồng thời, giữ kết quả riêng và xếp lại ảnh theo khoảng cách tới tài liệu điểm đến phù hợp có tọa độ. Cơ chế này giúp giảm phát biểu thiếu căn cứ, không bảo đảm loại bỏ hoàn toàn sai lệch.

```mermaid
flowchart LR
    subgraph QueryInput["Đầu vào truy vấn"]
        Q_Text["Từ khóa / Câu hỏi người dùng"]
        Q_Image["Ảnh cảm hứng (User Photos)"]
    end

    subgraph Encoders["Bộ mã hóa (Embedders)"]
        DenseEnc["voyageai/voyage-4-nano cục bộ<br/>(SentenceTransformer · Dense Vector 2048-dim)"]
        SparseEnc["FastEmbed Qdrant/BM25<br/>(Sparse Lexical Tokens)"]
        VisionEnc["google/siglip2-base-patch16-224 cục bộ<br/>(Vector ảnh hoặc mô tả · 768-dim)"]
    end

    subgraph StorageIndex["Kho lưu trữ Vector & Thuộc tính"]
        Qdrant_Text[("Qdrant: wikivoyage_voyage<br/>Dense + Sparse Index")]
        Qdrant_Images[("Qdrant: google_maps_images<br/>SigLIP2 768-dim Vector")]
        SQL_Meta[("PostgreSQL / SQLite<br/>Bảng places, tags, opening_hours")]
    end

    subgraph RankFusion["Xử lý kết quả truy xuất"]
        RRF["Reciprocal Rank Fusion (RRF k=60)<br/>Hợp nhất dense + BM25 của văn bản"]
        Filter["Phạm vi truy xuất<br/>Địa danh cho văn bản/ảnh<br/>Danh mục và địa điểm yêu cầu/loại trừ cho nhánh ảnh"]
        Enrich["Làm giàu kết quả ảnh<br/>Bằng metadata hiện có"]
        DistanceRank["Xếp lại ảnh theo khoảng cách địa lý<br/>Giữ thứ tự tương đồng nếu thiếu tham chiếu"]
    end

    subgraph FinalResult["Tập ứng viên chất lượng cao"]
        Candidates["Bằng chứng văn bản và ảnh giữ riêng<br/>Mặc định tối đa 20 đoạn văn bản và 20 địa điểm ảnh<br/>Dữ liệu thiếu được giữ là chưa biết"]
    end

    Q_Text --> Filter
    Filter --> DenseEnc
    Filter --> SparseEnc
    Filter --> VisionEnc
    Q_Image --> VisionEnc

    DenseEnc -->|Dense Search| Qdrant_Text
    SparseEnc -->|BM25 Search| Qdrant_Text
    VisionEnc -->|Cosine Similarity| Qdrant_Images

    Qdrant_Text --> RRF
    Qdrant_Images --> Enrich
    SQL_Meta -->|Metadata Enrichment| Enrich
    Enrich --> DistanceRank
    RRF -->|Tài liệu điểm đến có tọa độ| DistanceRank
    RRF --> Candidates
    DistanceRank --> Candidates
```

---

## 4. QUY TRÌNH TRUY XUẤT THỊ GIÁC CỦA THÀNH PHẦN AI

Thành phần AI hiện tại dùng SigLIP2 để mã hóa ảnh tham chiếu và tìm ảnh địa điểm tương đồng. AI không chiếu vector thành 12 chiều Travel DNA, không sinh hồ sơ DNA hay trọng số phong cách đã xác nhận. Sở thích và yêu cầu chuyến đi được diễn giải từ hội thoại.

Trong sơ đồ dưới đây, các thao tác frontend/backend, endpoint, trường JSON và bảng dữ liệu được giữ nguyên theo hợp đồng kiến trúc gốc. Các tên `dna/analyze`, `dna_analyses`, `suggested_dna` và thanh trượt DNA thuộc phần được giữ nguyên đó, không phải chức năng được xác nhận của AI hiện tại. Kết quả AI được mô tả trong phạm vi truy xuất ảnh và cần được phân biệt với hợp đồng backend này.

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant FE as Frontend Composer
    participant BE as FastAPI Backend
    participant SigLIP as SigLIP2 Vision Model
    participant Retrieval as Image Retrieval Pipeline
    participant Qdrant as Qdrant Image Search
    participant DB as Database (Postgres)

    User->>FE: Chọn hoặc Paste 1-3 ảnh vào Composer
    FE->>FE: Kiểm tra kích thước (< 5MB) và định dạng (JPEG/PNG/WebP)
    FE->>BE: POST /api/v1/dna/analyze (kèm danh sách URL ảnh Cloudinary)
    BE->>BE: Xác thực Session và kiểm tra tính toàn vẹn của ảnh
    BE->>SigLIP: Trích xuất Vector đặc trưng hình ảnh (768-dim)
    SigLIP-->>Retrieval: Trả về vector ảnh 768 chiều
    Retrieval->>Qdrant: Tìm ảnh tương đồng trong phạm vi truy vấn
    Qdrant-->>Retrieval: Các nhóm ảnh địa điểm và điểm tương đồng
    Retrieval->>Retrieval: Làm giàu metadata; trong hybrid, xếp ảnh theo khoảng cách khi có tham chiếu
    Retrieval-->>BE: Kết quả địa điểm tương đồng và bằng chứng ảnh
    BE->>DB: Lưu bản ghi tạm vào bảng dna_analyses (Hết hạn sau 24h)
    BE-->>FE: Trả kết quả JSON (metrics, suggested_dna, analysis_id)
    FE-->>User: Hiển thị các thanh trượt Travel DNA đã được điều chỉnh tự động
    User->>FE: Người dùng tùy chỉnh tinh chỉnh thêm (nếu muốn) và bấm "Tạo chuyến đi"
    FE->>BE: POST /api/v1/trips (gửi kèm trip_data + analysis_id + DNA cuối cùng)
    BE->>DB: Gắn kết Travel DNA vào chuyến đi trong bảng trips
```

---

## 5. MÔ HÌNH THỰC THỂ DỮ LIỆU ĐA TẦNG (DATA DOMAIN ENTITY RELATIONSHIP)

Hệ thống dữ liệu VISTRA bao gồm 22 bảng được tổ chức thành 6 nhóm nghiệp vụ chính:

```mermaid
erDiagram
    DESTINATIONS ||--o{ PLACES : contains
    DESTINATIONS ||--o{ TRIPS : hosts
    SOURCES ||--o{ PLACE_SOURCES : provides
    PLACES ||--o{ PLACE_SOURCES : referenced_by
    PLACES ||--o{ OPENING_INTERVALS : scheduled_in
    PLACES ||--o{ PRICE_ESTIMATES : priced_with
    PLACES ||--o{ PLACE_RATINGS : reviewed_in
    PLACES ||--o{ PLACE_IMAGES : illustrated_by
    PLACES ||--o{ PLACE_TAGS : categorized_by
    TAGS ||--o{ PLACE_TAGS : tags
    
    USERS ||--o{ SESSIONS : authenticates
    USERS ||--o{ TRIPS : creates
    USERS ||--o{ TRAVEL_DNA_PREFERENCES : has
    USERS ||--o{ DNA_ANALYSES : performs
    USERS ||--o{ FEEDBACK_TICKETS : files
    
    TRIPS ||--o{ ITINERARY_VERSIONS : evolves_to
    TRIPS ||--o{ REVISION_PREVIEWS : drafts
    TRIPS ||--o{ EXPENSES : incurs
    TRIPS ||--o{ CHAT_MESSAGES : records
    
    FEEDBACK_TICKETS ||--o{ FEEDBACK_REPLIES : receives
    EVALUATION_DATASETS ||--o{ EVALUATION_CASES : defines
    EVALUATION_DATASETS ||--o{ EVALUATION_RUNS : benchmarks
```

---

## 6. SƠ ĐỒ ĐIỀU PHỐI ĐẦU CUỐI (END-TO-END SEQUENCE DIAGRAM)

Quy trình hoàn chỉnh từ lúc người dùng yêu cầu tạo lịch trình đến khi nhận được kế hoạch chi tiết. Sơ đồ giữ nguyên hợp đồng API và lưu trữ của backend gốc, minh họa trường hợp AI trả được lịch trình. AI hiện tại có thể trả `partial` khi còn dữ liệu chưa biết hoặc `failed` khi bản nháp không vượt qua kiểm tra; trạng thái `failed` không cung cấp lịch trình hợp lệ. `verified` chỉ xác nhận các kiểm tra được triển khai trên bằng chứng đã thu thập, không bảo đảm toàn bộ thông tin thực tế đều đầy đủ và cập nhật:

```mermaid
sequenceDiagram
    actor Traveler as Khách du lịch
    participant Web as Next.js Web App
    participant API as FastAPI Backend
    participant Agent as TravelOrchestrator (Python)
    participant Tools as Routing & Weather Tools
    participant LLM as OpenAI (gpt-6-luna theo cấu hình)
    participant DB as PostgreSQL Database

    Traveler->>Web: Nhập yêu cầu: "Lập lịch trình 3 ngày ở Ninh Bình, thích thiên nhiên, ngân sách 5 triệu"
    Web->>API: POST /trips (khởi tạo chuyến đi)
    API->>DB: Lưu chuyến đi ban đầu (Status: Draft)
    API-->>Web: Trả về trip_id
    
    Web->>API: POST /trips/{trip_id}/generate (kích hoạt AI Agent)
    API->>Agent: Chuyển giao State và yêu cầu lập lịch
    Agent->>DB: Truy vấn POI schedulable tại Ninh Bình
    DB-->>Agent: Trả về danh sách POIs (Tràng An, Tam Cốc, Hang Múa, Bái Đính...)
    
    opt Cần bằng chứng thời tiết và dịch vụ khả dụng
        Agent->>Tools: Gọi Open-Meteo lấy dự báo thời tiết 3 ngày
        Tools-->>Agent: Dự báo: Ngày 1 nắng ráo, Ngày 2 chiều mưa rào
    end
    opt Có ORS_API_KEY và tọa độ phù hợp
        Agent->>Tools: Gọi OpenRouteService tính ma trận khoảng cách giữa các điểm
        Tools-->>Agent: Ma trận thời gian di chuyển (km & phút)
    end
    
    Agent->>Agent: Tập hợp bằng chứng công cụ vào evidence notebook
    Agent->>LLM: Planner sinh lịch trình có cấu trúc từ bằng chứng
    LLM-->>Agent: Bản nháp lịch trình v1 (Stops, Day 1, Day 2, Day 3)
    
    Agent->>Agent: Sắp lịch và kiểm tra nguồn, ngày, giờ mở cửa, di chuyển và chi phí có bằng chứng
    opt Có lỗi ràng buộc và còn lượt sửa theo cấu hình
        Agent->>Agent: Thử sửa bằng logic ứng dụng khi phù hợp
        opt Cần tạo lại bằng model
            Agent->>LLM: Yêu cầu Planner sửa các lỗi được xác định
            LLM-->>Agent: Bản nháp lịch trình sau chỉnh sửa
        end
        Agent->>Agent: Kiểm tra lại bản sửa
    end
    Agent->>Agent: Xác định verified / partial / failed
    
    Agent->>DB: Lưu bản ghi vào bảng itinerary_versions (Version 1)
    Agent-->>API: Trả về Pydantic Itinerary Schema
    API-->>Web: Phản hồi JSON kết quả đầy đủ
    Web-->>Traveler: Hiển thị giao diện Lịch trình trực quan, Bản đồ lộ trình & Chi phí dự toán
```

---

## 7. KIẾN TRÚC TRIỂN KHAI VÀ HẠ TẦNG (DEPLOYMENT & INFRASTRUCTURE)

Hệ thống hỗ trợ 2 môi trường vận hành độc lập: **Môi trường phát triển cục bộ (Local Docker)** và **Môi trường đám mây Production (Railway & Vercel)**:

```mermaid
graph TB
    subgraph ProductionCloud["HẠ TẦNG CLOUD PRODUCTION"]
        subgraph Vercel["Vercel Global Edge Network"]
            FE_Prod["Frontend Next.js App<br/>(Auto SSL, Edge Caching)"]
        end

        subgraph Railway["Railway Cloud Platform"]
            BE_Prod["Backend Docker Container<br/>(FastAPI + Python 3.11, Uvicorn Workers)"]
            PG_Prod[("Managed PostgreSQL Database<br/>(Automated Backups, Connection Pooling)")]
        end

        subgraph ExternalCloud["Cloud Media & Vector Engine"]
            Qdrant_Cloud[("Qdrant Cloud Cluster<br/>(Vector Search Engine)")]
            Cloudinary_Prod["Cloudinary Media CDN<br/>(Image Resizing & Optimization)"]
        end

        FE_Prod -->|HTTPS / API Proxy| BE_Prod
        BE_Prod -->|Internal TCP| PG_Prod
        BE_Prod -->|gRPC / HTTPS| Qdrant_Cloud
        FE_Prod -.->|Upload Direct| Cloudinary_Prod
    end

    subgraph MonitoringObservability["GIÁM SÁT & ĐÁNH GIÁ (OBSERVABILITY)"]
        Langfuse["LangSmith / Langfuse Tracing<br/>(Đo lường Latency, Chi phí Token, Đánh giá LLM)"]
        AILogServer["VinUni Phoenix AI Log Server<br/>(Tự động ghi nhận log đóng góp thành viên)"]
    end

    BE_Prod -.-> Langfuse
    BE_Prod -.-> AILogServer
```

---

## 8. NGUYÊN TẮC BẢO MẬT & ĐẢM BẢO CHẤT LƯỢNG (SECURITY & SAFETY PRINCIPLES)

1. **Bảo vệ khóa bí mật (Secrets Management)**:
   * Toàn bộ API Key (Gemini, OpenAI, Qdrant, Cloudinary) được lưu trữ trong biến môi trường hệ thống, tuyệt đối không commit vào kho mã nguồn Git.
2. **Xác thực phiên an toàn (Secure Session Authentication)**:
   * Cookie xác thực `vistra_session` được gán cờ `HttpOnly`, `SameSite=Lax` và `Secure` trên môi trường Production để ngăn chặn hoàn toàn tấn công XSS và đánh cắp token.
3. **Kiểm tra dữ liệu nghiêm ngặt (Strict Schema Validation)**:
   * 100% dữ liệu đầu vào và đầu ra được thẩm định qua các lớp mô hình Pydantic v2 với cờ `extra="forbid"`, loại bỏ nguy cơ Parameter Tampering hoặc Injection.
4. **Chuẩn hóa Cơ sở dữ liệu PostgreSQL & Qdrant (Database Standardization)**:
   * Hệ thống vận hành hoàn toàn trên nền tảng **PostgreSQL** với 22 bảng dữ liệu quan hệ chuẩn 3NF và **Qdrant Vector Engine** phục vụ tìm kiếm ngữ nghĩa, đảm bảo tính toàn vẹn khóa ngoại, hiệu năng truy vấn cao và khả năng mở rộng quy mô sản xuất.
