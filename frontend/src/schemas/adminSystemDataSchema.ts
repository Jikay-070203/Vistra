import { boolean, list, number, objectList, oneOf, record, string } from '@/schemas/apiSchemaHelpers';
import type { AdminEntityMetadata, AdminEntityRecords, AdminEntityTableView } from '@/types/adminSystemDataApi';

const entityTableIds = ['destinations', 'plans', 'itinerary_days', 'activities', 'feedback_tickets'] as const;

function parseMetadata(value: unknown): AdminEntityMetadata {
  const envelope = record(value, 'admin entity metadata response');
  const data = record(envelope.data, 'admin entity metadata data');
  const tables = list(data.tables, 'admin entity metadata tables').map((entry, index): AdminEntityTableView => {
    const table = record(entry, `tables[${index}]`);
    const recordCount = number(table.recordCount, `tables[${index}].recordCount`);
    if (recordCount < 0) throw new TypeError(`tables[${index}].recordCount must not be negative`);
    return {
      tableName: oneOf(table.tableName, entityTableIds, `tables[${index}].tableName`),
      name: string(table.name, `tables[${index}].name`),
      description: string(table.description, `tables[${index}].description`),
      recordCount,
      fields: list(table.fields, `tables[${index}].fields`).map((rawField, fieldIndex) => {
        const field = record(rawField, `tables[${index}].fields[${fieldIndex}]`);
        return {
          name: string(field.name, `fields[${fieldIndex}].name`),
          type: string(field.type, `fields[${fieldIndex}].type`),
          required: boolean(field.required, `fields[${fieldIndex}].required`),
        };
      }),
    };
  });
  return { tables };
}

function parseRecords(value: unknown): AdminEntityRecords {
  const envelope = record(value, 'admin entity records response');
  const data = record(envelope.data, 'admin entity records data');
  const page = number(data.page, 'records.page');
  const pageSize = number(data.pageSize, 'records.pageSize');
  const total = number(data.total, 'records.total');
  if (page < 1 || pageSize < 1 || total < 0) throw new TypeError('records pagination values are out of range');
  return {
    table: oneOf(data.table, entityTableIds, 'records.table'),
    items: objectList(data.items, 'records.items'),
    page,
    pageSize,
    total,
  };
}

export const adminEntityMetadataSchema = { parse: parseMetadata };
export const adminEntityRecordsSchema = { parse: parseRecords };
