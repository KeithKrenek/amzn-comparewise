import { Product, Filter } from '../types';
import { normalizationService } from '../services/normalization/normalizationService';

export const applyFiltersToProducts = (products: Product[], filters: Filter[]): Product[] => {
  if (filters.length === 0) {
    return products;
  }

  // Group filters by ID (which corresponds to specification name)
  const filtersByCategory: Record<string, Filter[]> = {};
  
  filters.forEach(filter => {
    if (!filtersByCategory[filter.id]) {
      filtersByCategory[filter.id] = [];
    }
    filtersByCategory[filter.id].push(filter);
  });

  return products.filter(product => {
    // Product must match at least one filter from each category (AND between categories)
    return Object.entries(filtersByCategory).every(([filterId, categoryFilters]) => {
      // For each category, check if the product matches ANY of the filters (OR within category)
      return categoryFilters.some(filter => {
        // Find matching specification - use consistent ID format
        const spec = product.specifications.find(s => 
          s.name.toLowerCase().replace(/\s+/g, '_') === filter.id || 
          s.name.toLowerCase() === filter.id
        );
        
        // If specification doesn't exist, filter doesn't match
        if (!spec) return false;
        
        // Check based on filter type
        switch (filter.type) {
          case 'boolean':
            // Convert spec value to boolean if needed
            const boolValue = typeof spec.value === 'boolean' 
              ? spec.value 
              : spec.value.toLowerCase() === 'yes' || spec.value.toLowerCase() === 'true';
            return boolValue === filter.value;
            
          case 'categorical':
            // Direct string comparison
            return spec.value === filter.value;
            
          case 'range':
            // Extract numeric value
            let numValue: number;
            
            if (typeof spec.normalizedValue === 'number') {
              numValue = spec.normalizedValue;
            } else if (typeof spec.normalizedValue === 'object' && 
                      spec.normalizedValue !== null &&
                      typeof spec.normalizedValue.value === 'number') {
              numValue = spec.normalizedValue.value;
            } else {
              // Try to extract number from string
              const match = String(spec.value).match(/[\d.]+/);
              numValue = match ? parseFloat(match[0]) : NaN;
            }
            
            if (isNaN(numValue)) return false;
            
            // Check if value is within range
            const [min, max] = filter.value as [number, number];
            return numValue >= min && numValue <= max;
            
          default:
            return false;
        }
      });
    });
  });
};

// Normalize specifications for filtering
export const normalizeSpecificationsForFiltering = (products: Product[]): Product[] => {
  return products.map(product => {
    // Check if any specifications need normalization
    const needsNormalization = product.specifications.some(spec => spec.normalizedValue === undefined);
    
    if (needsNormalization) {
      // Normalize specifications
      const normalizedSpecs = normalizationService.normalizeSpecifications(
        product.specifications,
        'electronics' // Default category
      );
      
      return {
        ...product,
        specifications: normalizedSpecs
      };
    }
    
    return product;
  });
};

// Extract unique values for a specification across all products
export const extractUniqueSpecValues = (
  products: Product[], 
  specName: string
): { values: any[]; type: 'string' | 'number' | 'boolean' } => {
  const values = new Set<any>();
  let valueType: 'string' | 'number' | 'boolean' = 'string';
  
  products.forEach(product => {
    const spec = product.specifications.find(s => 
      s.name.toLowerCase() === specName.toLowerCase()
    );
    
    if (spec) {
      // Determine value type
      if (typeof spec.value === 'number') {
        valueType = 'number';
      } else if (typeof spec.value === 'boolean') {
        valueType = 'boolean';
      }
      
      // Add value to set
      values.add(spec.value);
    }
  });
  
  return {
    values: Array.from(values),
    type: valueType
  };
};

// Get range for a numeric specification
export const getSpecificationRange = (
  products: Product[], 
  specName: string
): { min: number; max: number } | null => {
  let min = Infinity;
  let max = -Infinity;
  let found = false;
  
  products.forEach(product => {
    const spec = product.specifications.find(s => 
      s.name.toLowerCase() === specName.toLowerCase()
    );
    
    if (spec) {
      let numValue: number | undefined;
      
      if (typeof spec.normalizedValue === 'number') {
        numValue = spec.normalizedValue;
      } else if (typeof spec.normalizedValue === 'object' && 
                spec.normalizedValue !== null &&
                typeof spec.normalizedValue.value === 'number') {
        numValue = spec.normalizedValue.value;
      } else if (typeof spec.value === 'string') {
        // Try to extract number from string
        const match = spec.value.match(/[\d.]+/);
        numValue = match ? parseFloat(match[0]) : undefined;
      } else if (typeof spec.value === 'number') {
        numValue = spec.value;
      }
      
      if (numValue !== undefined && !isNaN(numValue)) {
        min = Math.min(min, numValue);
        max = Math.max(max, numValue);
        found = true;
      }
    }
  });
  
  return found ? { min, max } : null;
};