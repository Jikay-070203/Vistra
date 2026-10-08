import { boolean, list, number, record, string } from '@/schemas/apiSchemaHelpers';
import type { AllergyCatalogItem, ProvinceCatalogItem } from '@/types/catalogApi';

export const allergyCatalogSchema = {
  parse(value: unknown): AllergyCatalogItem[] {
    const root = record(value, 'allergy catalog');
    if (root.type !== 'allergies') throw new TypeError('Unexpected catalog type');
    return list(root.items, 'allergy catalog.items').map((item, index) => {
      const raw = record(item, 'allergy catalog.items[' + index + ']');
      return {
        id: string(raw.id, 'allergy id'),
        label: string(raw.label, 'allergy label'),
        active: boolean(raw.active, 'allergy active'),
      };
    });
  },
};

export const provinceCatalogSchema = {
  parse(value: unknown): ProvinceCatalogItem[] {
    const root = record(value, 'province catalog');
    if (root.type !== 'provinces') throw new TypeError('Unexpected catalog type');
    return list(root.items, 'province catalog.items').map(item => {
      const raw = record(item, 'province catalog item');
      return { id: number(raw.id, 'province.id'), slug: string(raw.slug, 'province.slug'), name: string(raw.name, 'province.name') };
    });
  },
};
