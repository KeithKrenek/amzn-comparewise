// src/services/normalization/AISpecificationNormalizer.ts

import { RawSpecification, Specification } from '../../types';

// Make sure your types are defined similar to:
// interface RawSpecification {
//   id: string;
//   name: string;
//   value: string;
//   extractionConfidence?: number;
//   source?: string;
//   // ... other fields as needed
// }
//
// interface Specification extends RawSpecification {
//   normalizedValue?: any;
// }

export class AISpecificationNormalizer {
  // Normalize a single raw specification.
  async normalize(rawSpec: RawSpecification): Promise<Specification> {
    let normalizedValue: any = rawSpec.value;
    
    // Example normalization: convert storage values in GB to MB
    if (/(\d+(?:\.\d+)?)\s*GB/i.test(rawSpec.value)) {
      const match = rawSpec.value.match(/(\d+(?:\.\d+)?)\s*GB/i);
      if (match) {
        normalizedValue = parseFloat(match[1]) * 1024; // GB to MB
      }
    }
    
    // Additional normalization rules can be added here

    return {
      ...rawSpec,
      normalizedValue,
      extractionConfidence: rawSpec.extractionConfidence || 0.9,
      source: rawSpec.source || 'basic_normalization'
    };
  }
  
  // Normalize an array of raw specifications.
  async normalizeSpecifications(rawSpecs: RawSpecification[]): Promise<Specification[]> {
    const normalizedSpecs: Specification[] = [];
    for (const spec of rawSpecs) {
      normalizedSpecs.push(await this.normalize(spec));
    }
    return normalizedSpecs;
  }
}

export default new AISpecificationNormalizer();
