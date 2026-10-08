export interface SchemaFieldRule {
  name: string;
  type: 'string' | 'number' | 'array';
  required: boolean;
  description: string;
  example: string | number | string[];
}

export interface DemoEntityTable {
  id: string;
  name: string;
  description: string;
  fields: SchemaFieldRule[];
  sampleJson: string;
}

export const DEMO_ENTITY_TABLES: DemoEntityTable[] = [
  {
    id: 'provinces',
    name: 'Danh mục Tỉnh thành (provinces)',
    description: 'Bảng dữ liệu thực thể tỉnh/thành phố phục vụ tra cứu điểm đến',
    fields: [
      { name: 'code', type: 'number', required: true, description: 'Mã tỉnh thành chuẩn (số nguyên)', example: 79 },
      { name: 'name', type: 'string', required: true, description: 'Tên đầy đủ của tỉnh/thành', example: 'TP. Hồ Chí Minh' },
      { name: 'region', type: 'string', required: true, description: 'Vùng miền (Miền Bắc / Miền Trung / Miền Nam)', example: 'Miền Nam' },
      { name: 'description', type: 'string', required: false, description: 'Mô tả ngắn gọn đặc điểm du lịch', example: 'Trung tâm kinh tế và văn hóa năng động' },
    ],
    sampleJson: JSON.stringify(
      [
        { code: 79, name: 'TP. Hồ Chí Minh', region: 'Miền Nam', description: 'Đô thị sôi động, ẩm thực đa dạng' },
        { code: 48, name: 'Đà Nẵng', region: 'Miền Trung', description: 'Thành phố biển đáng sống, cầu Rồng' },
        { code: 1, name: 'Hà Nội', region: 'Miền Bắc', description: 'Thủ đô nghìn năm văn hiến, 36 phố phường' },
      ],
      null,
      2
    ),
  },
  {
    id: 'pois',
    name: 'Điểm tham quan (pois)',
    description: 'Bảng dữ liệu địa điểm du lịch, ẩm thực và trải nghiệm',
    fields: [
      { name: 'id', type: 'string', required: true, description: 'Định danh điểm đến (ví dụ: poi-dn-01)', example: 'poi-dn-01' },
      { name: 'name', type: 'string', required: true, description: 'Tên điểm đến / quán ăn / di tích', example: 'Bán đảo Sơn Trà' },
      { name: 'province_code', type: 'number', required: true, description: 'Mã tỉnh thành liên kết', example: 48 },
      { name: 'category', type: 'string', required: true, description: 'Phân loại (Thiên nhiên / Văn hóa / Ẩm thực)', example: 'Thiên nhiên' },
      { name: 'tags', type: 'array', required: false, description: 'Danh sách nhãn phong cách', example: ['checkin', 'ngam-canh'] },
    ],
    sampleJson: JSON.stringify(
      [
        { id: 'poi-dn-01', name: 'Bán đảo Sơn Trà', province_code: 48, category: 'Thiên nhiên', tags: ['ngam-canh', 'bien'] },
        { id: 'poi-dn-02', name: 'Ngũ Hành Sơn', province_code: 48, category: 'Văn hóa', tags: ['hang-dong', 'tam-linh'] },
      ],
      null,
      2
    ),
  },
];

export interface ValidationIssue {
  field?: string;
  message: string;
}

export interface ValidatedRecord {
  index: number;
  data: Record<string, unknown>;
  isValid: boolean;
  issues: ValidationIssue[];
}

export function validateRecordAgainstSchema(
  raw: unknown,
  table: DemoEntityTable,
  index = 0
): ValidatedRecord {
  const issues: ValidationIssue[] = [];

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return {
      index,
      data: {},
      isValid: false,
      issues: [{ message: 'Bản ghi phải là một đối tượng JSON (object) hợp lệ.' }],
    };
  }

  const obj = raw as Record<string, unknown>;

  for (const field of table.fields) {
    const val = obj[field.name];

    if (field.required && (val === undefined || val === null || val === '')) {
      issues.push({
        field: field.name,
        message: `Thiếu trường bắt buộc "${field.name}"`,
      });
      continue;
    }

    if (val !== undefined && val !== null && val !== '') {
      if (field.type === 'number') {
        if (typeof val !== 'number' || Number.isNaN(val)) {
          issues.push({
            field: field.name,
            message: `Trường "${field.name}" phải là kiểu số (number)`,
          });
        }
      } else if (field.type === 'string') {
        if (typeof val !== 'string') {
          issues.push({
            field: field.name,
            message: `Trường "${field.name}" phải là kiểu chuỗi (string)`,
          });
        }
      } else if (field.type === 'array') {
        if (!Array.isArray(val)) {
          issues.push({
            field: field.name,
            message: `Trường "${field.name}" phải là mảng (array)`,
          });
        }
      }
    }
  }

  return {
    index,
    data: obj,
    isValid: issues.length === 0,
    issues,
  };
}
