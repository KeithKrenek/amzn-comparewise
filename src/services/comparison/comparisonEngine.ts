import { Product } from '../../types';
import { EnhancedSpecification, SpecificationComparison } from '../../types/specifications';
import { specificationMatcher } from '../matching/specificationMatcher';
import { specificationNormalizer } from '../normalization/specificationNormalizer';
import { normalizationService } from '../normalization/normalizationService';

export interface ComparisonOptions {
  highlightThreshold: number;     // Threshold for highlighting differences (0-1)
  includeExplanations: boolean;   // Whether to include AI explanations
  userPreferences?: Record<string, number>; // User-defined importance weights
  maxHighlightedDifferences?: number; // Maximum number of differences to highlight
}

export class ComparisonEngine {
  // Default comparison options
  private defaultOptions: ComparisonOptions = {
    highlightThreshold: 0.5,
    includeExplanations: false,
    maxHighlightedDifferences: 10
  };
  
  // Compare multiple products
  compareProducts(
    products: Product[],
    options: Partial<ComparisonOptions> = {}
  ): Array<SpecificationComparison> {
    // Merge provided options with defaults
    const mergedOptions: ComparisonOptions = {
      ...this.defaultOptions,
      ...options
    };
    
    if (products.length < 2) {
      return []; // Need at least 2 products to compare
    }
    
    // Collect all unique specification names across products
    const allSpecNames = new Set<string>();
    products.forEach(product => {
      product.specifications.forEach(spec => {
        allSpecNames.add(spec.name);
      });
    });
    
    // Create comparison results for each specification
    const comparisons: SpecificationComparison[] = [];
    
    allSpecNames.forEach(specName => {
      // Get this specification from each product
      const specValues = products.map(product => {
        const spec = product.specifications.find(s => 
          s.name === specName || 
          specificationMatcher.areSpecsSemanticallyEquivalent(
            normalizationService.convertToEnhancedSpecifications([s])[0], 
            { 
              name: specName, 
              category: '', 
              id: '', 
              value: '', 
              importance: 0,
              metadata: { confidenceScore: 0, source: 'extraction', lastUpdated: '' },
              valueType: 'text'
            } as EnhancedSpecification
          )
        );
        
        return {
          productId: product.id,
          spec: spec || null
        };
      });
      
      // Skip if fewer than 2 products have this specification
      const productsWithSpec = specValues.filter(sv => sv.spec !== null);
      if (productsWithSpec.length < 2) {
        return;
      }
      
      // Create the comparison
      const comparison: SpecificationComparison = {
        specId: specName.toLowerCase().replace(/\s+/g, '_'),
        name: specName,
        differences: [],
        differenceSignificance: 0
      };
      
      // Calculate normalized values and determine best value
      const normalizedValues: Array<{ productId: string, value: any, normalizedValue: any }> = [];
      
      specValues.forEach(({ productId, spec }) => {
        if (!spec) return;
        
        // Use existing normalized value or normalize the specification
        const normalizedValue = spec.normalizedValue || 
          normalizationService.normalizeSpecifications([spec], 'electronics')[0].normalizedValue;
        
        normalizedValues.push({
          productId,
          value: spec.value,
          normalizedValue
        });
      });
      
      // Determine if this is a numeric specification
      const isNumeric = normalizedValues.some(nv => 
        typeof nv.normalizedValue === 'number' || 
        (typeof nv.normalizedValue === 'object' && nv.normalizedValue && 'value' in nv.normalizedValue)
      );
      
      // For numeric specs, calculate relative differences and find best value
      if (isNumeric) {
        // Extract numeric values
        const numericValues = normalizedValues.map(nv => {
          let value: number;
          if (typeof nv.normalizedValue === 'number') {
            value = nv.normalizedValue;
          } else if (typeof nv.normalizedValue === 'object' && nv.normalizedValue && 'value' in nv.normalizedValue) {
            value = (nv.normalizedValue as any).value;
          } else {
            // Try to extract number from string value
            const match = String(nv.value).match(/[\d.]+/);
            value = match ? parseFloat(match[0]) : NaN;
          }
          return { productId: nv.productId, value };
        }).filter(nv => !isNaN(nv.value));
        
        if (numericValues.length >= 2) {
          // Calculate average
          const sum = numericValues.reduce((acc, nv) => acc + nv.value, 0);
          const avg = sum / numericValues.length;
          
          // Determine if higher or lower is better
          const isHigherBetter = this.isHigherValueBetter(specName);
          
          // Find best value
          let bestValue = isHigherBetter ? -Infinity : Infinity;
          let bestProductId = '';
          
          numericValues.forEach(nv => {
            if (isHigherBetter && nv.value > bestValue) {
              bestValue = nv.value;
              bestProductId = nv.productId;
            } else if (!isHigherBetter && nv.value < bestValue) {
              bestValue = nv.value;
              bestProductId = nv.productId;
            }
          });
          
          // Calculate relative differences and add to comparison
          normalizedValues.forEach(nv => {
            let numValue: number | undefined;
            
            if (typeof nv.normalizedValue === 'number') {
              numValue = nv.normalizedValue;
            } else if (typeof nv.normalizedValue === 'object' && nv.normalizedValue && 'value' in nv.normalizedValue) {
              numValue = (nv.normalizedValue as any).value;
            }
            
            comparison.differences.push({
              productId: nv.productId,
              value: nv.value,
              normalizedValue: nv.normalizedValue,
              relativeDifference: numValue !== undefined ? (numValue - avg) / avg : undefined,
              isBest: nv.productId === bestProductId
            });
          });
          
          // Calculate significance based on the range of values
          const minValue = Math.min(...numericValues.map(nv => nv.value));
          const maxValue = Math.max(...numericValues.map(nv => nv.value));
          
          // If there's a significant difference, mark it as important
          const range = maxValue - minValue;
          const relativeDifference = range / (minValue || 1); // Avoid division by zero
          
          comparison.differenceSignificance = Math.min(
            relativeDifference * this.getSpecificationImportance(specName),
            1.0
          );
        }
      } else {
        // For non-numeric specs, just add the values
        normalizedValues.forEach(nv => {
          comparison.differences.push({
            productId: nv.productId,
            value: nv.value,
            normalizedValue: nv.normalizedValue
          });
        });
        
        // Check if values are different
        const uniqueValues = new Set(normalizedValues.map(nv => String(nv.value)));
        comparison.differenceSignificance = uniqueValues.size > 1 ? 
          0.5 * this.getSpecificationImportance(specName) : 0;
      }
      
      // Only add comparisons with differences
      if (comparison.differenceSignificance > 0) {
        comparisons.push(comparison);
      }
    });
    
    // Sort by significance
    comparisons.sort((a, b) => b.differenceSignificance - a.differenceSignificance);
    
    // Limit to max highlighted differences if specified
    if (mergedOptions.maxHighlightedDifferences) {
      return comparisons.slice(0, mergedOptions.maxHighlightedDifferences);
    }
    
    return comparisons;
  }
  
  // Find the most significant differences between products
  findSignificantDifferences(
    products: Product[],
    options: Partial<ComparisonOptions> = {}
  ): Array<SpecificationComparison> {
    const comparisons = this.compareProducts(products, options);
    
    // Filter by significance threshold
    const mergedOptions: ComparisonOptions = {
      ...this.defaultOptions,
      ...options
    };
    
    return comparisons.filter(
      comparison => comparison.differenceSignificance >= mergedOptions.highlightThreshold
    );
  }
  
  // Calculate overall similarity between products (0-1)
  calculateProductSimilarity(product1: Product, product2: Product): number {
    // Convert to enhanced specifications
    const enhancedSpecs1 = normalizationService.convertToEnhancedSpecifications(product1.specifications);
    const enhancedSpecs2 = normalizationService.convertToEnhancedSpecifications(product2.specifications);
    
    // Get matching specifications
    const matches = specificationMatcher.findMatchingSpecifications(enhancedSpecs1, enhancedSpecs2);
    
    // Count matching values
    let matchingValues = 0;
    let totalComparisons = 0;
    
    matches.forEach((spec2Id, spec1Id) => {
      const spec1 = product1.specifications.find(s => s.id === spec1Id);
      const spec2 = product2.specifications.find(s => s.id === spec2Id);
      
      if (spec1 && spec2) {
        totalComparisons++;
        
        // Check if values are similar
        if (spec1.value === spec2.value) {
          matchingValues++;
        } else if (spec1.normalizedValue && spec2.normalizedValue) {
          // Compare normalized values
          if (JSON.stringify(spec1.normalizedValue) === JSON.stringify(spec2.normalizedValue)) {
            matchingValues++;
          }
        }
      }
    });
    
    // Calculate similarity score
    if (totalComparisons === 0) return 0;
    return matchingValues / totalComparisons;
  }
  
  // Determine if a specification difference is meaningful
  isSpecDifferenceSignificant(
    specName: string,
    values: any[],
    category: string
  ): boolean {
    if (values.length < 2) return false;
    
    // For numeric values, check if the difference is significant
    const numericValues = values
      .map(v => {
        if (typeof v === 'number') return v;
        if (typeof v === 'object' && v && 'value' in v) return v.value;
        if (typeof v === 'string') {
          const match = v.match(/[\d.]+/);
          return match ? parseFloat(match[0]) : NaN;
        }
        return NaN;
      })
      .filter(v => !isNaN(v));
    
    if (numericValues.length >= 2) {
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      
      // Calculate relative difference
      const relativeDifference = (max - min) / (min || 1); // Avoid division by zero
      
      // Get importance of this specification
      const importance = this.getSpecificationImportance(specName);
      
      // Determine significance threshold based on importance
      const threshold = 0.1 / importance; // More important specs need smaller differences
      
      return relativeDifference > threshold;
    }
    
    // For non-numeric values, check if they're different
    const uniqueValues = new Set(values.map(v => String(v)));
    return uniqueValues.size > 1;
  }
  
  // Determine which value is best for a given specification
  determineBestValue(
    specName: string,
    values: any[],
    category: string
  ): any {
    if (values.length === 0) return null;
    
    // For numeric values, determine if higher or lower is better
    const numericValues = values
      .map((v, index) => {
        let numValue: number;
        if (typeof v === 'number') {
          numValue = v;
        } else if (typeof v === 'object' && v && 'value' in v) {
          numValue = v.value;
        } else {
          const match = String(v).match(/[\d.]+/);
          numValue = match ? parseFloat(match[0]) : NaN;
        }
        return { index, value: numValue };
      })
      .filter(v => !isNaN(v.value));
    
    if (numericValues.length > 0) {
      const isHigherBetter = this.isHigherValueBetter(specName);
      
      // Find best value
      numericValues.sort((a, b) => isHigherBetter ? b.value - a.value : a.value - b.value);
      
      return values[numericValues[0].index];
    }
    
    // For non-numeric values, we can't determine which is best
    return null;
  }
  
  // Helper to determine if higher values are better for a spec
  isHigherValueBetter(specName: string): boolean {
    const lowerName = specName.toLowerCase();
    
    // Specs where higher is better
    if (
      lowerName.includes('storage') ||
      lowerName.includes('ram') ||
      lowerName.includes('memory') ||
      lowerName.includes('processor') ||
      lowerName.includes('cpu') ||
      lowerName.includes('resolution') ||
      lowerName.includes('battery') ||
      lowerName.includes('screen size') ||
      lowerName.includes('refresh rate') ||
      lowerName.includes('bandwidth') ||
      lowerName.includes('speed') ||
      lowerName.includes('capacity') ||
      lowerName.includes('cores') ||
      lowerName.includes('threads') ||
      lowerName.includes('cache') ||
      lowerName.includes('frequency') ||
      lowerName.includes('clock') ||
      lowerName.includes('pixel') ||
      lowerName.includes('nits') ||
      lowerName.includes('brightness')
    ) {
      return true;
    }
    
    // Specs where lower is better
    if (
      lowerName.includes('weight') ||
      lowerName.includes('price') ||
      lowerName.includes('thickness') ||
      lowerName.includes('latency') ||
      lowerName.includes('response time') ||
      lowerName.includes('power consumption') ||
      lowerName.includes('heat') ||
      lowerName.includes('temperature') ||
      lowerName.includes('noise')
    ) {
      return false;
    }
    
    // Default to higher is better
    return true;
  }
  
  // Get importance of a specification (0-1)
  getSpecificationImportance(specName: string): number {
    const lowerName = specName.toLowerCase();
    
    // High importance specs
    if (
      lowerName.includes('processor') ||
      lowerName.includes('cpu') ||
      lowerName.includes('ram') ||
      lowerName.includes('memory') ||
      lowerName.includes('storage') ||
      lowerName.includes('gpu') ||
      lowerName.includes('graphics')
    ) {
      return 0.9;
    }
    
    // Medium importance specs
    if (
      lowerName.includes('display') ||
      lowerName.includes('screen') ||
      lowerName.includes('battery') ||
      lowerName.includes('weight') ||
      lowerName.includes('resolution') ||
      lowerName.includes('camera')
    ) {
      return 0.7;
    }
    
    // Lower importance specs
    if (
      lowerName.includes('ports') ||
      lowerName.includes('connectivity') ||
      lowerName.includes('wireless') ||
      lowerName.includes('bluetooth') ||
      lowerName.includes('audio') ||
      lowerName.includes('speakers')
    ) {
      return 0.5;
    }
    
    // Default importance
    return 0.3;
  }
  
  // Calculate a weighted score for a product based on user preferences
  calculateProductScore(
    product: Product,
    userPreferences: Record<string, number> = {}
  ): { score: number; breakdown: Record<string, number> } {
    const breakdown: Record<string, number> = {};
    let totalScore = 0;
    let totalWeight = 0;
    
    // Group specifications by category
    const specsByCategory: Record<string, typeof product.specifications> = {};
    
    product.specifications.forEach(spec => {
      if (!specsByCategory[spec.category]) {
        specsByCategory[spec.category] = [];
      }
      specsByCategory[spec.category].push(spec);
    });
    
    // Calculate score for each category
    for (const [category, specs] of Object.entries(specsByCategory)) {
      let categoryScore = 0;
      let categoryWeight = 0;
      
      specs.forEach(spec => {
        // Get base importance
        let importance = this.getSpecificationImportance(spec.name);
        
        // Apply user preference if available
        if (userPreferences[spec.name.toLowerCase()]) {
          importance *= userPreferences[spec.name.toLowerCase()];
        }
        
        // Calculate score based on normalized value if available
        let specScore = 0.5; // Default score
        
        if (spec.normalizedValue !== undefined) {
          if (typeof spec.normalizedValue === 'number') {
            // Simple numeric value - use as is
            specScore = Math.min(spec.normalizedValue / 10, 1); // Normalize to 0-1
          } else if (typeof spec.normalizedValue === 'object' && spec.normalizedValue !== null) {
            // Complex normalized value - extract score based on type
            if ('value' in spec.normalizedValue) {
              const value = spec.normalizedValue.value;
              // Scale based on typical values for this spec type
              if (spec.name.toLowerCase().includes('processor')) {
                specScore = Math.min(value / 5, 1); // Assuming 5GHz is high-end
              } else if (spec.name.toLowerCase().includes('ram') || spec.name.toLowerCase().includes('memory')) {
                specScore = Math.min(value / 32, 1); // Assuming 32GB is high-end
              } else if (spec.name.toLowerCase().includes('storage')) {
                specScore = Math.min(value / 1024, 1); // Assuming 1TB is high-end
              } else {
                specScore = Math.min(value / 10, 1); // Generic scaling
              }
            }
          }
        }
        
        // Apply confidence score as a multiplier
        specScore *= spec.confidenceScore || 0.7;
        
        // Add to category score
        categoryScore += specScore * importance;
        categoryWeight += importance;
      });
      
      // Calculate weighted average for category
      const finalCategoryScore = categoryWeight > 0 ? categoryScore / categoryWeight : 0;
      breakdown[category] = finalCategoryScore;
      
      // Add to total score
      totalScore += finalCategoryScore;
      totalWeight += 1; // Each category has equal weight
    }
    
    // Calculate final score
    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    
    return {
      score: finalScore,
      breakdown
    };
  }
}

// Create a singleton instance
export const comparisonEngine = new ComparisonEngine();