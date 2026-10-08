import type { ProvinceItem } from '@/types/content';

export const provinceListResponseSchema = {
  parse(value: unknown): ProvinceItem[] {
    if (!Array.isArray(value)) {
      throw new TypeError('Province response must be an array.');
    }

    return value.map((item): ProvinceItem => {
      if (typeof item !== 'object' || item === null || Array.isArray(item)) {
        throw new TypeError('Province item must be an object.');
      }

      const province = item as Record<string, unknown>;
      if (
        typeof province.code !== 'number' ||
        typeof province.name !== 'string' ||
        typeof province.codename !== 'string' ||
        typeof province.division_type !== 'string'
      ) {
        throw new TypeError('Province item does not match the expected schema.');
      }

      return {
        code: province.code,
        name: province.name,
        codename: province.codename,
        division_type: province.division_type,
      };
    });
  },
};
