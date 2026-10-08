export interface AllergyCatalogItem {
  id: string;
  label: string;
  active: boolean;
}

/** Destination identities supplied by the backend, not administrative codes. */
export interface ProvinceCatalogItem {
  id: number;
  slug: string;
  name: string;
}
