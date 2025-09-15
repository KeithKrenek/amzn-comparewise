import { Specification } from '../../types';
import { EnhancedSpecification } from '../../types/specifications';
import { specificationNormalizer } from './specificationNormalizer';

export class NormalizationService {
  // Convert standard specifications to enhanced specifications
  convertToEnhancedSpecifications(specs: Specification[]): EnhancedSpecification[] {
    return specs.map(spec => ({
      id: spec.id,
      name: spec.name,
      value: spec.value,
      normalizedValue: spec.normalizedValue,
      category: spec.category,
      importance: this.calculateImportance(spec),
      metadata: {
        confidenceScore: spec.confidenceScore || 0.7,
        source: (spec.source as any) || 'extraction',
        lastUpdated: new Date().toISOString()
      },
      valueType: this.determineValueType(spec)
    }));
  }
  
  // Normalize a batch of specifications
  normalizeSpecifications(specs: Specification[], productCategory: string = 'electronics'): Specification[] {
    // Convert to enhanced specifications
    const enhancedSpecs = this.convertToEnhancedSpecifications(specs);
    
    // Normalize the specifications
    const normalizedEnhancedSpecs = specificationNormalizer.normalizeSpecifications(
      enhancedSpecs,
      productCategory
    );
    
    // Convert back to standard specifications
    return normalizedEnhancedSpecs.map(enhancedSpec => ({
      id: enhancedSpec.id,
      name: enhancedSpec.name,
      value: enhancedSpec.value,
      category: enhancedSpec.category,
      confidenceScore: enhancedSpec.metadata.confidenceScore,
      normalizedValue: enhancedSpec.normalizedValue,
      source: enhancedSpec.metadata.source
    }));
  }
  
  // Determine the value type of a specification
  private determineValueType(spec: Specification): 'numeric' | 'boolean' | 'categorical' | 'text' {
    const value = spec.value;
    const name = spec.name.toLowerCase();
    
    // Check for boolean values
    if (
      typeof value === 'boolean' ||
      value === 'Yes' ||
      value === 'No' ||
      value === 'True' ||
      value === 'False'
    ) {
      return 'boolean';
    }
    
    // Check for numeric values
    if (typeof value === 'number') {
      return 'numeric';
    }
    
    if (typeof value === 'string') {
      // Check if it's a number with a unit
      if (/^\d+(\.\d+)?\s*[a-zA-Z]+$/.test(value)) {
        return 'numeric';
      }
      
      // Check for common numeric specs
      if (
        name.includes('size') ||
        name.includes('weight') ||
        name.includes('dimension') ||
        name.includes('capacity') ||
        name.includes('battery') ||
        name.includes('storage') ||
        name.includes('memory') ||
        name.includes('ram') ||
        name.includes('resolution') ||
        name.includes('refresh rate')
      ) {
        return 'numeric';
      }
      
      // Check for categorical specs
      if (
        name.includes('color') ||
        name.includes('material') ||
        name.includes('type') ||
        name.includes('model') ||
        name.includes('brand') ||
        name.includes('operating system') ||
        name.includes('os')
      ) {
        return 'categorical';
      }
    }
    
    // Default to text
    return 'text';
  }
  
  // Calculate importance of a specification
  private calculateImportance(spec: Specification): number {
    const name = spec.name.toLowerCase();
    
    // High importance specs
    if (
      name.includes('processor') ||
      name.includes('cpu') ||
      name.includes('ram') ||
      name.includes('memory') ||
      name.includes('storage') ||
      name.includes('gpu') ||
      name.includes('graphics')
    ) {
      return 0.9;
    }
    
    // Medium-high importance specs
    if (
      name.includes('display') ||
      name.includes('screen') ||
      name.includes('battery') ||
      name.includes('resolution')
    ) {
      return 0.8;
    }
    
    // Medium importance specs
    if (
      name.includes('weight') ||
      name.includes('dimension') ||
      name.includes('camera') ||
      name.includes('connectivity') ||
      name.includes('ports')
    ) {
      return 0.7;
    }
    
    // Lower importance specs
    if (
      name.includes('color') ||
      name.includes('material') ||
      name.includes('audio') ||
      name.includes('speaker')
    ) {
      return 0.5;
    }
    
    // Default importance
    return 0.6;
  }
}

// Create a singleton instance
export const normalizationService = new NormalizationService();