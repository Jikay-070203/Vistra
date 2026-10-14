export interface AdminEntityField {
  name: string;
  type: string;
  required: boolean;
}

export type AdminEntityTableId = 'destinations' | 'plans' | 'itinerary_days' | 'activities' | 'feedback_tickets';

export interface AdminEntityTableView {
  tableName: AdminEntityTableId;
  name: string;
  description: string;
  recordCount: number;
  fields: AdminEntityField[];
}

export interface AdminEntityMetadata {
  tables: AdminEntityTableView[];
}

export interface AdminEntityRecords {
  table: AdminEntityTableId;
  items: Record<string, unknown>[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AdminEntityMutationResult {
  table: AdminEntityTableId;
  id: string;
  updated?: boolean;
  deleted?: boolean;
}

export interface AdminPlaceImportItem {
  source_place_id: string;
  name: string;
  province: string;
  category: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  metadata?: Record<string, unknown>;
  source_updated_at?: string | null;
}

export interface AdminPlaceImageImportItem {
  source_image_id: string;
  source_place_id: string;
  image_url: string;
  thumbnail_url?: string | null;
  license?: string | null;
  author?: string | null;
  width?: number | null;
  height?: number | null;
  file_size_bytes?: number | null;
  sha256?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AdminImportBatch<T> {
  source: string;
  batch_id: string;
  items: T[];
}

export interface AdminImportResult {
  batch_id: string;
  status: 'completed' | 'completed_with_errors' | 'already_processed';
  received: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: { index: number; code: string; message: string }[];
}
