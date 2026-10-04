/**
 * VISTRA Admin Data Store & Schema Registry
 * File: frontend/src/lib/adminDataStore.ts
 *
 * Implements ADM-DATA-01..07:
 * - Shared schema registry for 5 entity tables
 * - Referential integrity checks (parent delete blocking, FK checks)
 * - Browser-persisted store via localStorage (key: vistra_data_store_v1)
 * - Batch JSON validation with duplicate ID blocking and Review & Confirm
 */

import { MOCK_DESTINATIONS } from '@/data/mockData';
import { INITIAL_FEEDBACK_TICKETS } from '@/data/mockFeedback';
import { INITIAL_PLANS } from '@/context/DemoPlanContext';

export interface FieldDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'timestamp';
  label: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  foreignTable?: string;
  foreignField?: string;
  required: boolean;
}

export interface TableSchema {
  tableName: 'destinations' | 'plans' | 'itinerary_days' | 'activities' | 'feedback_tickets';
  name: string;
  description: string;
  fields: FieldDefinition[];
  relations: string[];
}

export const SCHEMA_REGISTRY: Record<string, TableSchema> = {
  destinations: {
    tableName: 'destinations',
    name: 'Điểm đến & Danh mục',
    description: 'Bản đồ dữ liệu các điểm đến, tỷ lệ khớp thị giác DNA và thông số giờ vàng.',
    relations: ['plans.destination'],
    fields: [
      { name: 'id', type: 'string', label: 'Mã điểm đến', isPrimary: true, required: true },
      { name: 'name', type: 'string', label: 'Tên điểm đến', required: true },
      { name: 'region', type: 'string', label: 'Vùng miền', required: true },
      { name: 'duration', type: 'string', label: 'Thời lượng khuyến nghị', required: true },
      { name: 'estimatedCost', type: 'string', label: 'Chi phí ước tính', required: true },
      { name: 'visualMatch', type: 'number', label: 'Khớp thị giác (%)', required: true },
      { name: 'budgetMatch', type: 'number', label: 'Khớp ngân sách (%)', required: true },
      { name: 'goldenHour', type: 'string', label: 'Giờ vàng săn ảnh', required: true },
    ],
  },
  plans: {
    tableName: 'plans',
    name: 'Kế hoạch Hành trình',
    description: 'Hồ sơ lịch trình do du khách tạo hoặc lưu từ cộng đồng.',
    relations: ['itinerary_days.planId'],
    fields: [
      { name: 'id', type: 'string', label: 'Mã kế hoạch', isPrimary: true, required: true },
      { name: 'userId', type: 'string', label: 'Mã người dùng', required: true },
      { name: 'title', type: 'string', label: 'Tên chuyến đi', required: true },
      { name: 'destination', type: 'string', label: 'Điểm đến', isForeign: true, foreignTable: 'destinations', foreignField: 'id', required: true },
      { name: 'status', type: 'string', label: 'Trạng thái', required: true },
      { name: 'isPublished', type: 'boolean', label: 'Công khai', required: false },
      { name: 'duration', type: 'string', label: 'Thời lượng', required: true },
      { name: 'budget', type: 'string', label: 'Ngân sách', required: true },
      { name: 'createdAt', type: 'timestamp', label: 'Ngày tạo', required: true },
    ],
  },
  itinerary_days: {
    tableName: 'itinerary_days',
    name: 'Ngày lịch trình & Chặng',
    description: 'Cấu trúc các ngày trong chuyến đi và lịch trình chi tiết.',
    relations: ['plans.id', 'activities.dayId'],
    fields: [
      { name: 'id', type: 'string', label: 'Mã ngày', isPrimary: true, required: true },
      { name: 'planId', type: 'string', label: 'Mã kế hoạch cha', isForeign: true, foreignTable: 'plans', foreignField: 'id', required: true },
      { name: 'dayNumber', type: 'number', label: 'Thứ tự ngày', required: true },
      { name: 'title', type: 'string', label: 'Tiêu đề ngày', required: true },
      { name: 'theme', type: 'string', label: 'Chủ đề / Nhịp điệu', required: true },
    ],
  },
  activities: {
    tableName: 'activities',
    name: 'Hoạt động & Điểm dừng',
    description: 'Chi tiết từng điểm đến, giờ bắt đầu, quán ăn và hoạt động.',
    relations: ['itinerary_days.id'],
    fields: [
      { name: 'id', type: 'string', label: 'Mã hoạt động', isPrimary: true, required: true },
      { name: 'dayId', type: 'string', label: 'Mã ngày cha', isForeign: true, foreignTable: 'itinerary_days', foreignField: 'id', required: true },
      { name: 'time', type: 'string', label: 'Thời gian', required: true },
      { name: 'title', type: 'string', label: 'Tên hoạt động', required: true },
      { name: 'location', type: 'string', label: 'Địa điểm', required: true },
      { name: 'category', type: 'string', label: 'Phân loại', required: true },
      { name: 'cost', type: 'string', label: 'Chi phí dự kiến', required: true },
    ],
  },
  feedback_tickets: {
    tableName: 'feedback_tickets',
    name: 'Hồ sơ Phản hồi & Đóng góp',
    description: 'Phiếu báo lỗi và đánh giá trải nghiệm từ du khách.',
    relations: [],
    fields: [
      { name: 'id', type: 'string', label: 'Mã phiếu', isPrimary: true, required: true },
      { name: 'userName', type: 'string', label: 'Tên du khách', required: true },
      { name: 'userEmail', type: 'string', label: 'Email', required: true },
      { name: 'category', type: 'string', label: 'Danh mục lỗi', required: true },
      { name: 'severity', type: 'string', label: 'Mức ưu tiên', required: true },
      { name: 'status', type: 'string', label: 'Trạng thái xử lý', required: true },
      { name: 'subject', type: 'string', label: 'Tiêu đề phản hồi', required: true },
      { name: 'createdAt', type: 'timestamp', label: 'Thời gian gửi', required: true },
    ],
  },
};

export type TableName = keyof typeof SCHEMA_REGISTRY;

export interface DataStoreState {
  destinations: Record<string, unknown>[];
  plans: Record<string, unknown>[];
  itinerary_days: Record<string, unknown>[];
  activities: Record<string, unknown>[];
  feedback_tickets: Record<string, unknown>[];
  [key: string]: Record<string, unknown>[];
}

const STORAGE_KEY = 'vistra_data_store_v1';
const DATA_STORE_CHANGE_EVENT = 'vistra-datastore-change';

/**
 * Generate seed state from existing application data fixtures
 */
function createDefaultStoreState(): DataStoreState {
  // 1. Destinations
  const destinations = MOCK_DESTINATIONS.map((d) => ({
    id: d.id,
    name: d.name,
    region: d.region,
    duration: d.duration,
    estimatedCost: d.estimatedCost,
    visualMatch: d.visualMatch,
    budgetMatch: d.budgetMatch,
    goldenHour: d.goldenHour,
  }));

  // 2. Plans
  const plans = INITIAL_PLANS.map((p) => ({
    id: p.id,
    userId: 'USR-101',
    title: p.title,
    destination: p.destination,
    status: p.status,
    isPublished: p.isPublished,
    duration: p.duration,
    budget: p.budget,
    createdAt: p.createdAt || '01/10/2026',
  }));

  // 3. Itinerary Days & 4. Activities
  const itinerary_days: Record<string, unknown>[] = [];
  const activities: Record<string, unknown>[] = [];

  INITIAL_PLANS.forEach((plan) => {
    plan.days.forEach((day) => {
      const dayId = `DAY-${plan.id}-${day.dayNumber}`;
      itinerary_days.push({
        id: dayId,
        planId: plan.id,
        dayNumber: day.dayNumber,
        title: day.title,
        theme: (day as unknown as { theme?: string }).theme || day.title,
      });

      day.activities.forEach((act, actIdx) => {
        const a = act as Record<string, unknown>;
        const transit = a.transit as Record<string, unknown> | undefined;
        activities.push({
          id: `ACT-${plan.id}-D${day.dayNumber}-${actIdx + 1}`,
          dayId: dayId,
          time: a.time || transit?.duration || '',
          title: a.title || transit?.type || 'Hoạt động',
          location: a.location || transit?.departure || '',
          category: a.category || 'Di chuyển',
          cost: a.cost || 0,
        });
      });
    });
  });

  // 5. Feedback Tickets
  const feedback_tickets = INITIAL_FEEDBACK_TICKETS.map((t) => ({
    id: t.id,
    userName: t.userName || 'Ẩn danh',
    userEmail: t.userEmail || 'no-email@vistra.vn',
    category: t.category,
    severity: t.severity,
    status: t.status,
    subject: t.subject,
    createdAt: t.createdAt,
  }));

  return {
    destinations,
    plans,
    itinerary_days,
    activities,
    feedback_tickets,
  };
}

/**
 * Read current data store from localStorage or initialize with seed defaults
 */
export function getAdminDataStore(): DataStoreState {
  if (typeof window === 'undefined') {
    return createDefaultStoreState();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createDefaultStoreState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      Array.isArray(parsed.destinations) &&
      Array.isArray(parsed.plans) &&
      Array.isArray(parsed.itinerary_days) &&
      Array.isArray(parsed.activities) &&
      Array.isArray(parsed.feedback_tickets)
    ) {
      return parsed as DataStoreState;
    }
  } catch {
    // If corrupt, fallback to defaults
  }

  const initial = createDefaultStoreState();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch {}
  return initial;
}

/**
 * Save data store to localStorage and dispatch change event
 */
export function saveAdminDataStore(store: DataStoreState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent(DATA_STORE_CHANGE_EVENT, { detail: store }));
  } catch (err) {
    console.error('Failed to save data store to localStorage:', err);
  }
}

/**
 * Subscribe to store changes across components and storage events
 */
export function subscribeAdminDataStore(callback: (store: DataStoreState) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (e: Event) => {
    const customEvent = e as CustomEvent<DataStoreState>;
    callback(customEvent.detail || getAdminDataStore());
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback(getAdminDataStore());
    }
  };

  window.addEventListener(DATA_STORE_CHANGE_EVENT, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener(DATA_STORE_CHANGE_EVENT, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}

/**
 * REFERENTIAL INTEGRITY CHECK (ADM-DATA-02)
 * Check if a record can be safely deleted or if child records depend on it.
 */
export function canDeleteRecord(
  tableName: TableName,
  id: string
): { canDelete: boolean; reason?: string; dependentCount?: number; childTable?: string } {
  const store = getAdminDataStore();

  if (tableName === 'destinations') {
    // Check if any plans reference this destination (by id or by name)
    const targetDest = store.destinations.find((d) => String(d.id) === id);
    const destName = targetDest ? String(targetDest.name) : '';
    const referencingPlans = store.plans.filter(
      (p) => String(p.destination) === id || (destName && String(p.destination).toLowerCase().includes(destName.toLowerCase()))
    );

    if (referencingPlans.length > 0) {
      return {
        canDelete: false,
        reason: `Không thể xóa điểm đến này vì đang có ${referencingPlans.length} kế hoạch hành trình (bảng plans) liên kết trực tiếp.`,
        dependentCount: referencingPlans.length,
        childTable: 'plans',
      };
    }
  }

  if (tableName === 'plans') {
    // Check if any itinerary_days reference this planId
    const referencingDays = store.itinerary_days.filter((d) => String(d.planId) === id);
    if (referencingDays.length > 0) {
      return {
        canDelete: false,
        reason: `Không thể xóa kế hoạch này vì đang có ${referencingDays.length} ngày hành trình (bảng itinerary_days) tham chiếu trực tiếp.`,
        dependentCount: referencingDays.length,
        childTable: 'itinerary_days',
      };
    }
  }

  if (tableName === 'itinerary_days') {
    // Check if any activities reference this dayId
    const referencingActivities = store.activities.filter((a) => String(a.dayId) === id);
    if (referencingActivities.length > 0) {
      return {
        canDelete: false,
        reason: `Không thể xóa ngày hành trình này vì đang có ${referencingActivities.length} hoạt động (bảng activities) tham chiếu trực tiếp.`,
        dependentCount: referencingActivities.length,
        childTable: 'activities',
      };
    }
  }

  // feedback_tickets and activities have no child entities that block deletion
  return { canDelete: true };
}

/**
 * Delete a record after verifying referential integrity
 */
export function deleteRecord(
  tableName: TableName,
  id: string
): { success: boolean; error?: string } {
  const check = canDeleteRecord(tableName, id);
  if (!check.canDelete) {
    return { success: false, error: check.reason };
  }

  const store = getAdminDataStore();
  const list = store[tableName];
  const updatedList = list.filter((r) => String(r.id) !== id);

  store[tableName] = updatedList;
  saveAdminDataStore(store);
  return { success: true };
}

/**
 * Add a new record to a table with primary key uniqueness check
 */
export function addRecord(
  tableName: TableName,
  record: Record<string, unknown>
): { success: boolean; error?: string } {
  const store = getAdminDataStore();
  const list = store[tableName];

  if (!record.id || String(record.id).trim() === '') {
    return { success: false, error: 'Mã định danh (id) là bắt buộc.' };
  }

  const duplicate = list.find((r) => String(r.id) === String(record.id));
  if (duplicate) {
    return { success: false, error: `Mã [${record.id}] đã tồn tại trong bảng ${tableName}.` };
  }

  // Foreign key check
  const schema = SCHEMA_REGISTRY[tableName];
  for (const field of schema.fields) {
    if (field.isForeign && field.foreignTable) {
      const val = record[field.name];
      if (val) {
        const foreignList = store[field.foreignTable as TableName] || [];
        const exists = foreignList.some((fr) => String(fr[field.foreignField || 'id']) === String(val));
        if (!exists) {
          return {
            success: false,
            error: `Khóa ngoại [${field.name}=${val}] không tồn tại trong bảng [${field.foreignTable}].`,
          };
        }
      }
    }
  }

  store[tableName] = [record, ...list];
  saveAdminDataStore(store);
  return { success: true };
}

/**
 * Update an existing record in a table
 */
export function updateRecord(
  tableName: TableName,
  id: string,
  updates: Record<string, unknown>
): { success: boolean; error?: string } {
  const store = getAdminDataStore();
  const list = store[tableName];

  const index = list.findIndex((r) => String(r.id) === id);
  if (index === -1) {
    return { success: false, error: `Không tìm thấy bản ghi với mã [${id}].` };
  }

  const schema = SCHEMA_REGISTRY[tableName];
  for (const field of schema.fields) {
    if (field.isForeign && field.foreignTable && updates[field.name] !== undefined) {
      const val = updates[field.name];
      if (val) {
        const foreignList = store[field.foreignTable as TableName] || [];
        const exists = foreignList.some((fr) => String(fr[field.foreignField || 'id']) === String(val));
        if (!exists) {
          return {
            success: false,
            error: `Khóa ngoại [${field.name}=${val}] không tồn tại trong bảng [${field.foreignTable}].`,
          };
        }
      }
    }
  }

  list[index] = { ...list[index], ...updates };
  store[tableName] = [...list];
  saveAdminDataStore(store);
  return { success: true };
}

/**
 * BATCH JSON IMPORT VALIDATION (ADM-DATA-06)
 * Validates syntax, duplicates against store, internal batch duplicates, and foreign keys.
 */
export interface ValidatedRecordItem {
  index: number;
  data: Record<string, unknown>;
  isValid: boolean;
  errors: string[];
}

export interface BatchValidationResult {
  isSyntaxValid: boolean;
  syntaxError?: string;
  records: ValidatedRecordItem[];
  validCount: number;
  invalidCount: number;
  hasDuplicates: boolean;
  hasInvalidFk: boolean;
  duplicateIds: string[];
}

export function validateBatchJson(tableName: TableName, rawJson: string): BatchValidationResult {
  const schema = SCHEMA_REGISTRY[tableName];
  const store = getAdminDataStore();
  const existingIds = new Set(store[tableName].map((r) => String(r.id)));

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    return {
      isSyntaxValid: false,
      syntaxError: err instanceof Error ? err.message : 'Cú pháp JSON không hợp lệ',
      records: [],
      validCount: 0,
      invalidCount: 0,
      hasDuplicates: false,
      hasInvalidFk: false,
      duplicateIds: [],
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      isSyntaxValid: false,
      syntaxError: 'Dữ liệu nhập vào phải là một mảng JSON (ví dụ: [ { ... }, { ... } ])',
      records: [],
      validCount: 0,
      invalidCount: 0,
      hasDuplicates: false,
      hasInvalidFk: false,
      duplicateIds: [],
    };
  }

  const seenBatchIds = new Set<string>();
  const duplicateIds: string[] = [];
  const validatedRecords: ValidatedRecordItem[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const rawItem = parsed[i];
    const errors: string[] = [];

    if (typeof rawItem !== 'object' || rawItem === null) {
      errors.push('Bản ghi không phải là một đối tượng JSON hợp lệ');
      validatedRecords.push({
        index: i + 1,
        data: {},
        isValid: false,
        errors,
      });
      continue;
    }

    const item = rawItem as Record<string, unknown>;
    const itemId = item.id !== undefined && item.id !== null ? String(item.id).trim() : '';

    // Check Primary Key existence
    if (!itemId) {
      errors.push('Thiếu mã định danh bắt buộc (id)');
    } else {
      // Check duplicate within batch (ADM-DATA-06C)
      if (seenBatchIds.has(itemId)) {
        errors.push(`Mã trùng lặp nội bộ trong lô nhập: "${itemId}"`);
        if (!duplicateIds.includes(itemId)) duplicateIds.push(itemId);
      } else {
        seenBatchIds.add(itemId);
      }

      // Check duplicate against existing DB (ADM-DATA-06C)
      if (existingIds.has(itemId)) {
        errors.push(`Mã đã tồn tại trong cơ sở dữ liệu: "${itemId}"`);
        if (!duplicateIds.includes(itemId)) duplicateIds.push(itemId);
      }
    }

    // Check required fields & types against schema
    for (const field of schema.fields) {
      if (field.name === 'id') continue;
      const val = item[field.name];

      if (field.required && (val === undefined || val === null || val === '')) {
        errors.push(`Thiếu trường bắt buộc: "${field.name}" (${field.label})`);
      } else if (val !== undefined && val !== null) {
        if (field.type === 'number' && typeof val !== 'number') {
          errors.push(`Trường "${field.name}" phải là kiểu số (number)`);
        } else if (field.type === 'boolean' && typeof val !== 'boolean') {
          errors.push(`Trường "${field.name}" phải là kiểu đúng/sai (boolean)`);
        }
      }

      // Foreign key check (ADM-DATA-06D)
      if (field.isForeign && field.foreignTable && val) {
        const foreignList = store[field.foreignTable as TableName] || [];
        const exists = foreignList.some((fr) => String(fr[field.foreignField || 'id']) === String(val));
        if (!exists) {
          errors.push(`Khóa ngoại "${field.name}" = "${val}" không tồn tại trong bảng [${field.foreignTable}]`);
        }
      }
    }

    validatedRecords.push({
      index: i + 1,
      data: item,
      isValid: errors.length === 0,
      errors,
    });
  }

  const validCount = validatedRecords.filter((r) => r.isValid).length;
  const invalidCount = validatedRecords.filter((r) => !r.isValid).length;
  const hasDuplicates = duplicateIds.length > 0;
  const hasInvalidFk = validatedRecords.some((r) =>
    r.errors.some((e) => e.includes('Khóa ngoại'))
  );

  return {
    isSyntaxValid: true,
    records: validatedRecords,
    validCount,
    invalidCount,
    hasDuplicates,
    hasInvalidFk,
    duplicateIds,
  };
}

/**
 * Execute batch import for valid records
 */
export function executeBatchImport(
  tableName: TableName,
  records: Record<string, unknown>[]
): { importedCount: number } {
  const store = getAdminDataStore();
  const currentList = store[tableName];

  store[tableName] = [...records, ...currentList];
  saveAdminDataStore(store);

  return { importedCount: records.length };
}
