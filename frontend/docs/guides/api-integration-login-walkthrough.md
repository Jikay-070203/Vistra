# Agent playbook: implement API frontend (login và workspace làm mẫu)

Tài liệu này là hướng dẫn để agent tích hợp API vào một frontend hiện có. Login minh họa luồng auth đặc thù; WorkspaceService minh họa API domain thông thường. Hãy thay tên file, thư mục, HTTP client, state manager và schema theo repo đích.

**Không áp đặt cấu trúc của project nguồn lên repo đích.** Trước khi sửa, hãy tìm quy ước đang tồn tại và tái sử dụng chúng. Chỉ tạo tầng/file còn thiếu để triển khai API.

## 1. Luồng cần đạt

~~~~mermaid
flowchart LR
    UI[Form hoặc màn hình] -->|input| Owner[Hook / Context / Store nếu cần]
    Owner --> Service[Domain service]
    Service -->|endpoint + typed request| Client[Shared API client]
    Client --> Backend[Backend API]
    Backend -->|JSON response| Client
    Client -->|response hoặc lỗi chuẩn hóa| Service
    Service -->|payload theo convention| Owner
    Owner -->|state, session, điều hướng| UI
~~~~

Trách nhiệm từng lớp:

| Lớp | Trách nhiệm |
| --- | --- |
| UI | Nhận input, validate phía client khi phù hợp, gọi hàm nghiệp vụ, hiển thị loading/success/error. Không tự ghép URL hay tự quản lý token. |
| Hook / Context / Store | Giữ state theo phạm vi cần thiết. Dùng Context/store khi nhiều màn hình cần cùng state hoặc thao tác cập nhật session toàn cục; API chỉ phục vụ một màn hình có thể gọi từ hook/component. |
| Domain service | Đặt tên thao tác theo nghiệp vụ, gọi shared client, gắn request/response types, diễn giải envelope nếu cần. |
| Shared API client | Tập trung base URL, fetch/Axios, JSON serialization, headers, auth/refresh, HTTP status và lỗi chung. |
| Endpoint và types | Giữ endpoint cùng contract dữ liệu ở một chỗ theo convention của repo. |

## 2. Khảo sát repo đích trước khi sửa

Đọc hướng dẫn của repo như AGENTS.md/README, package manifest và một service tương tự. Dùng source đang chạy làm chuẩn nếu tài liệu cũ không khớp.

Trả lời các câu sau trước khi chọn cấu trúc:

- Project dùng Next.js, React, Vue hay framework khác? Entry point và route nằm ở đâu?
- HTTP client là native fetch, Axios hay wrapper/library khác? Đã có base URL, interceptors/middleware, token refresh hoặc error type chưa?
- Endpoint constants, API types và domain services đang nằm ở đâu?
- API tương tự unwrap response.data hay trả nguyên envelope cho caller?
- Auth/session hiện được quản lý bởi Context, store, cookie, thư viện auth hay server?
- Component/hook hiện được gọi service như thế nào? Tìm caller thật, không suy ra chỉ từ file backend.
- Lệnh lint/typecheck/build nào thật sự có trong package manifest?

Dùng cấu trúc hiện hữu. Nếu repo chưa có pattern nào, có thể đề xuất cấu trúc tối thiểu theo trách nhiệm:

~~~~text
src/
  constants/
    endpoints.ts   # endpoint constants
  types/
    api.ts         # API envelope và lỗi chung
    auth.ts        # request/response login
    workspace.ts   # ví dụ request/response domain
  services/
    api.ts         # shared client
    auth/authService.ts
    workspace/workspaceService.ts
  features/        # UI theo tính năng nếu repo đã tổ chức theo feature
  contexts/         # state toàn cục nếu cần
  hooks/            # logic React cục bộ/tái sử dụng nếu cần
~~~~

Tên thư mục chỉ là gợi ý, không phải yêu cầu. Ví dụ, repo có thể dùng api/, lib/, store/, composables/, modules/ hoặc cấu trúc khác. Không tạo thêm một shared client, error layer, Context hay store nếu repo đã có giải pháp tương đương.

## 3. Chốt API contract trước khi viết code

Với login, xác nhận các mục sau từ OpenAPI/backend hoặc người phụ trách API:

| Mục | Ví dụ cần xác nhận |
| --- | --- |
| Method và path | POST /api/v1/auth/login |
| Auth | Public hay cần credential/cookie đặc biệt? |
| Request body | email, password; kiểu dữ liệu và quy tắc validate |
| Success response | Envelope hay payload trực tiếp? Có access token, refresh token, user, expiresAt không? |
| Error response | HTTP status, message, validation errors có shape gì? |
| Side effect sau thành công | Lưu session theo cơ chế hiện tại, nạp profile, điều hướng tới đâu? |

Path /api/v1/auth/login và field bên dưới là ví dụ theo luồng login đã phân tích; phải đối chiếu contract của repo đích trước khi dùng. Không đoán field, endpoint, role, token format, expiration hay redirect.

## 4. Khai báo types và endpoint

Nếu repo đã có type tương đương, mở rộng/tái sử dụng type đó. Nếu API dùng envelope chung, mô tả envelope và lỗi một lần.

Tệp mẫu src/types/api.ts:

~~~~ts
export interface ApiResponse<T> {
  isSuccess: boolean;
  message: string;
  data: T;
  validationErrors?: Record<string, string[]>;
  responseTime?: string;
}

export interface PaginatedData<T> {
  items: T[];
  pageIndex: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export class ApiError extends Error {
  readonly validationErrors?: Record<string, string[]>;

  constructor(message: string, validationErrors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.validationErrors = validationErrors;
  }
}
~~~~

Tệp mẫu src/types/auth.ts; User là schema ví dụ từ project nguồn, phải thay field theo response backend đích:

~~~~ts
export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: string;
  isEmailVerified: boolean;
  subscriptionLevel: string;
  telegramChatId: string | null;
  isTelegramLinked: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Các field phải khớp response thực tế của backend.
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}
~~~~

ApiResponse<T> chỉ là ví dụ khi backend thật sự trả envelope như vậy. Nếu client đã unwrap envelope hoặc backend trả payload trực tiếp, dùng type phù hợp và không bọc response hai lần. TypeScript generic không validate JSON ở runtime và không tự đổi kiểu dữ liệu.

Đặt path trong endpoint constant nếu đó là convention của repo:

Các import ví dụ bên dưới dùng alias @/ và biến môi trường của Next.js; đổi theo cấu hình framework/repo đích.

~~~~ts
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
  },
  WORKSPACE: {
    MY_WORKSPACES: '/api/v1/workspace/my-workspaces',
    BASE: '/api/v1/workspace',
    BY_ID: (id: number) => '/api/v1/workspace/' + id,
    APPLY: (shareCode: string) => '/api/v1/workspace/apply/' + shareCode,
  },
} as const;
~~~~

Giữ riêng endpoint backend và frontend route. Không dùng route màn hình như /login thay cho API path, hoặc ngược lại.

## 5. Gọi qua shared client và domain service

Ưu tiên shared client có sẵn. Đừng chép việc serialize JSON, thêm Authorization header, refresh token hoặc chuyển HTTP error vào component/service mới.

### Client JSON tối thiểu nếu repo đích chưa có

Đây là client tham khảo cho API trả JSON envelope kiểu ApiResponse<T>. Nó hỗ trợ JSON/FormData và Bearer token trong localStorage, nhưng không triển khai refresh/retry, cookie auth, binary download hay response 204. Chỉ dùng khi repo thật sự chưa có client; thay getAccessToken bằng auth manager của repo và bổ sung theo contract trước khi dùng production.

Tệp mẫu src/services/api.ts:

~~~~ts
import { ApiError } from '@/types/api';
import type { ApiResponse } from '@/types/api';

// ponytail: JSON envelope + Web Storage bearer only; add refresh/cookie/binary handling when the target API requires it.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  // Thay bằng auth/session manager sẵn có nếu project có.
  return window.localStorage.getItem('accessToken');
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? value as Record<string, unknown>
    : null;
}

function isValidationErrors(value: unknown): value is Record<string, string[]> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every(
    (messages) => Array.isArray(messages) && messages.every((item) => typeof item === 'string')
  );
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  if (!API_BASE_URL) throw new Error('NEXT_PUBLIC_API_URL is not configured');

  const headers = new Headers(options.headers);
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (options.body != null && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', 'Bearer ' + token);
  }

  const baseUrl = API_BASE_URL.replace(/\/+$/, '');
  const path = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  const response = await fetch(baseUrl + path, { ...options, headers });
  const payload: unknown = await response.json().catch(() => null);
  const record = asRecord(payload);
  const message = typeof record?.message === 'string'
    ? record.message
    : 'API error ' + response.status;
  const validationErrors = isValidationErrors(record?.validationErrors)
    ? record.validationErrors
    : undefined;

  if (!response.ok || record?.isSuccess === false) {
    throw new ApiError(message, validationErrors);
  }
  if (!record || record.isSuccess !== true || !('data' in record)) {
    throw new ApiError('Response does not match ApiResponse<T>');
  }

  return payload as ApiResponse<T>;
}

export function get<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

export function post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function del<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}
~~~~

Nếu client trả ApiResponse<T>, domain service có thể unwrap payload:

~~~~ts
import { post } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/endpoints';
import type { LoginRequest, AuthResponse } from '@/types/auth';

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await post<AuthResponse>(
    API_ENDPOINTS.AUTH.LOGIN,
    data
  );

  if (response.isSuccess && response.data) {
    return response.data;
  }

  throw new Error(response.message || 'Login failed');
}
~~~~

Nếu shared client đã trả AuthResponse sau khi unwrap, service nhận và trả payload trực tiếp. Chọn đúng một tầng unwrap theo convention hiện có.

### Đối chiếu: workspaceService là API domain thông thường

Hai service trong source cho thấy một API client chung không bắt buộc mọi domain phải trả cùng hình dạng:

| Luồng | Service trả về | Cách caller xử lý |
| --- | --- | --- |
| Login | authService.login trả AuthResponse, đã lấy response.data. | AuthContext lưu session và cập nhật user. |
| Workspace CRUD | create/update/delete/apply trả ApiResponse<Workspace> hoặc ApiResponse<void>. | Caller kiểm tra response.isSuccess và đọc response.data khi cần. |
| Danh sách workspace | getMyWorkspaces trả ApiResponse<Workspace[]>; service chuẩn hóa riêng response.data. | Caller vẫn nhận isSuccess/message, còn data có shape thống nhất là mảng. |

WorkspaceService dùng endpoint constants và request/response types riêng: Workspace, CreateWorkspaceRequest, UpdateWorkspaceRequest. Các thao tác CRUD đơn giản chuyển tiếp qua shared client:

Tệp mẫu src/types/workspace.ts; chỉ giữ field mà contract backend thực sự trả/nhận:

~~~~ts
export enum WorkspaceType {
  Web = 1,
  Mobile = 2,
}

export interface Workspace {
  id: number;
  workspaceName: string;
  layoutJson: Record<string, unknown> | null;
  type: WorkspaceType;
  isDefault: boolean;
  shareCode?: string;
}

export interface CreateWorkspaceRequest {
  workspaceName: string;
  layoutJson: Record<string, unknown>;
  type: WorkspaceType;
  isDefault: boolean;
}

export interface UpdateWorkspaceRequest {
  workspaceId: number;
  workspaceName?: string;
  layoutJson?: Record<string, unknown>;
  isDefault?: boolean;
}
~~~~

~~~~ts
import { get, post, put, del } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/endpoints';
import type { ApiResponse, PaginatedData } from '@/types/api';
import type {
  Workspace,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
} from '@/types/workspace';

export async function createWorkspace(
  data: CreateWorkspaceRequest
): Promise<ApiResponse<Workspace>> {
  return post<Workspace>(API_ENDPOINTS.WORKSPACE.BASE, data);
}

export async function updateWorkspace(
  id: number,
  data: UpdateWorkspaceRequest
): Promise<ApiResponse<Workspace>> {
  return put<Workspace>(API_ENDPOINTS.WORKSPACE.BY_ID(id), data);
}

export async function deleteWorkspace(id: number): Promise<ApiResponse<void>> {
  return del<void>(API_ENDPOINTS.WORKSPACE.BY_ID(id));
}
~~~~

Endpoint có tham số động được tạo trong endpoint constants, ví dụ BY_ID(id) hoặc APPLY(shareCode). Service truyền giá trị vào builder thay vì tự nối URL trong component.

getMyWorkspaces trong source chấp nhận mảng Workspace, object phân trang có items và một số object nhóm danh sách. Ví dụ rút gọn dưới đây chỉ xử lý hai dạng phổ biến đầu tiên; thêm nhánh khác vào type và runtime guard nếu contract thật sự có các shape đó. Service chuẩn hóa data thành Workspace[] nhưng giữ metadata envelope:

~~~~ts
type WorkspaceListPayload = Workspace[] | PaginatedData<Workspace>;

function normalizeWorkspaceList(data: WorkspaceListPayload): Workspace[] {
  return Array.isArray(data) ? data : data.items;
}

export async function getMyWorkspaces(): Promise<ApiResponse<Workspace[]>> {
  const response = await get<WorkspaceListPayload>(
    API_ENDPOINTS.WORKSPACE.MY_WORKSPACES
  );

  return {
    ...response,
    data: normalizeWorkspaceList(response.data),
  };
}
~~~~

Đây là mapping thuộc domain để caller nhận một danh sách thống nhất. Không thêm union, key biến thể hoặc fallback chỉ để phòng xa; xác nhận các shape với contract trước. WorkspaceService hiện trả mảng rỗng nếu không nhận ra payload. Với API mới, chỉ dùng fallback này nếu payload sai shape có thể được xem như danh sách rỗng; nếu không, báo lỗi rõ để tránh che contract mismatch.

Các caller workspace trong dashboard gọi service trực tiếp và tự cập nhật state UI; chúng không đi qua AuthContext. Auth Context quản lý session toàn app; API domain thường có thể được gọi từ hook/component sở hữu state.

Trong source ví dụ, các phần này nằm ở constants/endpoints.ts (path), types/workspace.ts (contract), services/workspace/workspaceService.ts (CRUD/normalization), và dashboard components (caller). Tên/path này chỉ giúp nhận diện ví dụ nguồn; repo đích cần được khảo sát riêng.

Service nên:
- Nhận request type rõ ràng và trả payload type rõ ràng.
- Dùng endpoint constant thay vì URL rải trong UI.
- Để lỗi được propagate tới caller sau khi client đã chuẩn hóa.
- Chuyển đổi dữ liệu chỉ khi contract hoặc domain cần mapping thật sự.

Không tạo class/factory/abstraction mới chỉ để bọc một hàm gọi API nếu pattern hiện có không cần chúng.

## 6. Nối service vào UI và auth state

### UI submit

UI gọi hàm được expose từ Context/hook, hoặc gọi service theo pattern của repo. UI chịu trách nhiệm state hiển thị và luôn kết thúc loading:

Nếu app quản lý login qua Context, component lấy hàm như sau:

~~~~tsx
import { useAuth } from '@/contexts/AuthContext';

const { login } = useAuth();
~~~~

~~~~ts
const handleSubmit = async (event: React.FormEvent) => {
  event.preventDefault();
  setError(null);
  setIsLoading(true);

  try {
    await login({ email, password });
  } catch (error: unknown) {
    setError(
      error instanceof Error ? error.message : 'Đăng nhập thất bại.'
    );
  } finally {
    setIsLoading(false);
  }
};
~~~~

### Login dùng Context khi cần cập nhật session toàn cục

Trong luồng mẫu của project nguồn, LoginForm gọi useAuth().login; AuthContext gọi authService.login. Context nhận AuthResponse rồi cập nhật auth state/session, đặt refresh theo expiration và điều hướng theo app.

Skeleton điều phối cho login có thể trông như sau; sessionManager và các hàm điều hướng/refresh là chỗ thay bằng cơ chế thực tế của repo đích:

~~~~ts
import * as authService from '@/services/auth/authService';
import type { LoginRequest } from '@/types/auth';

async function login(credentials: LoginRequest): Promise<void> {
  const auth = await authService.login(credentials);
  await sessionManager.save(auth);
  setUser(auth.user);
  scheduleTokenRefresh(auth.expiresAt);
  navigateAfterLogin();
}
~~~~

Bỏ bước refresh nếu contract không có token expiration/refresh. Nếu shared auth manager tự cập nhật user/session, không ghi lặp lại ở Context.

Khi triển khai ở repo đích:
- Đặt provider đúng phạm vi nếu dùng Context; xác nhận route gọi hook nằm dưới provider.
- Lưu/cập nhật session theo cơ chế repo đang dùng.
- Chỉ thêm bước lấy profile hoặc dữ liệu phụ nếu luồng hiện hữu/API contract yêu cầu.
- Không ép mọi API đi qua Context. Dữ liệu cục bộ nên ở component/hook nếu không cần state toàn cục.

Luồng cụ thể đã phân tích ở project nguồn:

~~~~text
LoginForm.handleSubmit
  -> useAuth().login({ email, password })
  -> AuthContext.login(data)
  -> authService.login(data)
  -> post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, data)
  -> apiRequest<T>() / shared client
  -> backend
~~~~

Tên file thực tế ở repo đích có thể khác; tìm tương đương thay vì sao chép path này.

## 7. Xử lý response, lưu session và lỗi

### Tách envelope khỏi payload

Nếu server trả:

~~~~json
{
  "isSuccess": true,
  "message": "OK",
  "data": {
    "accessToken": "…",
    "refreshToken": "…",
    "expiresAt": "…",
    "user": {}
  }
}
~~~~

thì data nhận được sau parsing là JSON runtime. Generic type chỉ giúp TypeScript kiểm tra cách code truy cập nó; không phải parser hay validator. Khi cần bảo đảm runtime schema, chỉ dùng validator nếu repo đã có hoặc yêu cầu thực sự cần.

Trong luồng mẫu, apiRequest trả envelope, authService lấy response.data, rồi AuthContext nhận AuthResponse. Không có phép đổi field; user được lưu cùng session. Nếu response chứa expiresAt, giữ đúng format contract và parse thành Date chỉ khi cần tính thời gian.

### Chọn nơi lưu theo auth architecture của repo đích

Project nguồn dùng auth storage helper để lưu accessToken, refreshToken, expiresAt và JSON của user; shared API client đọc token để gắn Bearer header. Đây chỉ là mô tả ví dụ, không phải yêu cầu bắt buộc cho repo khác.

Ví dụ source-specific về cách AuthContext lưu payload:

~~~~ts
import { setAuthStorageItem } from '@/lib/authStorage';
import type { AuthResponse } from '@/types/auth';

function saveAuthData(authData: AuthResponse) {
  setAuthStorageItem('accessToken', authData.accessToken);
  setAuthStorageItem('refreshToken', authData.refreshToken);
  setAuthStorageItem('expiresAt', authData.expiresAt);
  setAuthStorageItem('user', JSON.stringify(authData.user));
  setUser(authData.user);
}
~~~~

Khi copy:
- Tái sử dụng auth/session manager hiện có; không tạo thêm một bộ key hoặc lưu trùng state.
- Không đưa API key/server secret vào frontend.
- Bearer token là credential; chọn cookie/session/token storage theo thiết kế backend và chính sách bảo mật của ứng dụng. Web Storage có thể được JavaScript phía client đọc.
- Chỉ lưu field cần cho session; không lưu toàn bộ response nếu không cần.
- Backend vẫn phải kiểm tra quyền; trạng thái đăng nhập ở frontend không thay thế authorization phía server.

### Chuẩn hóa lỗi một lần

- Shared client xử lý HTTP status, parse error body và cung cấp error type chung.
- Domain service chỉ diễn giải lỗi đặc thù nghiệp vụ nếu cần.
- UI hiển thị thông báo phù hợp, giữ loading/error state và không nuốt lỗi.
- Nếu backend trả validation errors, giữ nguyên field errors đủ lâu để UI có thể gắn lỗi đúng input.

## 8. Checklist triển khai cho agent

Trước khi sửa:
- [ ] Đã đọc hướng dẫn repo, manifest và một luồng API tương tự.
- [ ] Đã tìm đúng shared client, type convention, auth manager và caller UI.
- [ ] Đã xác nhận API contract; các điểm chưa rõ được ghi lại, không tự suy đoán.

Khi sửa:
- [ ] Dùng cấu trúc và dependency hiện có; chỉ thêm file/tầng cần thiết.
- [ ] Định nghĩa hoặc tái sử dụng request/response types.
- [ ] Thêm endpoint đúng nhóm nếu repo tập trung endpoint.
- [ ] Domain service gọi shared client và thống nhất cách unwrap.
- [ ] Chọn component/hook/context/store theo phạm vi state thật.
- [ ] Xử lý loading, lỗi, success và lưu session theo architecture hiện hành.

Khi bàn giao:
- [ ] Rà diff để bỏ URL literal, duplicate token handling, type giả định và code không dùng.
- [ ] Chạy đúng các lệnh kiểm tra có sẵn nếu task yêu cầu hoặc repo yêu cầu.
- [ ] Báo rõ file đã đổi, kiểm tra nào đã chạy và phần nào còn phụ thuộc contract/backend.
