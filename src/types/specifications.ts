export interface SpecificationMetadata {
  confidenceScore: number;      // How confident we are in this data (0-1)
  source: 'extraction' | 'inference' | 'user' | 'ai' | 'manual';
  lastUpdated: string;          // ISO timestamp
  alternativeNames?: string[];  // Other common names for this spec
  categoryRelevance?: Record<string, number>; // How relevant in different categories
  extractionMethod?: string;    // Method used to extract this specification
  rawValue?: string;            // Original value before normalization
}

export interface NormalizedValue {
  value: number;
  unit: string;
  originalString: string;
  conversionFactor?: number;
  convertedValue?: number;
  convertedUnit?: string;
  commonName?: string;
  rating?: string;
  width?: number;
  height?: number;
  pixels?: number;
  panelType?: string;
}

export interface EnhancedSpecification {
  id: string;
  name: string;
  displayName?: string;
  value: string | number | boolean;
  normalizedValue?: NormalizedValue | number | boolean | any;
  category: string;
  subcategory?: string;
  importance: number;           // How important this spec is (0-1)
  metadata: SpecificationMetadata;
  valueType: 'numeric' | 'boolean' | 'categorical' | 'text';
  possibleValues?: string[];    // For categorical specs
}

export interface SpecificationComparison {
  specId: string;
  name: string;
  differences: Array<{
    productId: string;
    value: any;
    normalizedValue?: any;
    relativeDifference?: number; // Percentage difference from average
    isBest?: boolean;           // Is this the best value
  }>;
  differenceSignificance: number; // How significant this difference is (0-1)
  explanation?: string;         // AI-generated explanation of difference
}

export interface ProductComparisonResult {
  products: string[];           // Product IDs
  specifications: SpecificationComparison[];
  overallSimilarity: number;    // 0-1 scale, how similar the products are
  recommendation?: string;      // AI-generated recommendation
  bestProduct?: string;         // Product ID of the best product
  bestValue?: string;           // Product ID of the best value product
}

export interface TableColumn {
  id: string;
  label: string;
  width?: string | number;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => React.ReactNode;
}