

export interface Price {
  current: number;
  original: number | null;
  currency: string;
}

export interface Rating {
  value: number;
  count: number;
}

export interface Image {
  small: string;
  large: string;
  alt?: string;
}

export interface RawSpecification {
  id: string;
  name: string;
  value: string;
  confidenceScore?: number;
  source?: string;
  category?: string;
}

export interface Specification extends RawSpecification {
  normalizedValue?: any;
}

export interface Product {
  id: string;
  title: string;
  brand: string;
  description?: string;
  price: {
    current: number;
    original?: number;
  };
  rating?: {
    value: number;
    count: number;
  };
  specifications: Specification[];
  images: {
    small?: string;
    large?: string;
  }[];
  features: string[];
}

export interface SearchQuery {
  keyword?: string;
  category?: string;
  page?: number;
  limit?: number;
  sort?: {
    columnId: string;
    direction: 'asc' | 'desc';
  };
}

export interface SortOption {
  columnId: string;
  direction: 'asc' | 'desc';
}

export interface Filter {
  id: string;
  type: FilterType;
  value: any;
}

export interface RangeFilter {
  field: string;
  min: number;
  max: number;
  unit?: string;
}

export type FilterType = 'boolean' | 'categorical' | 'range';

export type ViewMode = 'table' | 'card';