import { Specification } from '../types';

export class SpecificationExtractorService {
  // Extract specifications from raw text
  extractSpecifications(rawText: string): Specification[] {
    const specs: Specification[] = [];
    
    // Common specification patterns
    const patterns = [
      // Memory/Storage pattern: "8GB RAM", "512GB SSD"
      {
        regex: /(\d+)\s*(GB|TB|MB)\s*(RAM|Memory|Storage|SSD|HDD)/gi,
        category: 'technical',
        nameGroup: 3,
        valueGroup: 0,
        confidence: 0.9,
        normalize: (match: RegExpMatchArray) => {
          const value = parseInt(match[1]);
          const unit = match[2].toLowerCase();
          // Convert to MB
          let normalizedValue = value;
          if (unit === 'gb') {
            normalizedValue = value * 1024;
          } else if (unit === 'tb') {
            normalizedValue = value * 1024 * 1024;
          }
          return normalizedValue;
        }
      },
      // Processor pattern: "Intel Core i7-1185G7", "Apple M1 Pro"
      {
        regex: /(Intel Core i\d-\d+|AMD Ryzen \d \d+|Apple M\d(?: Pro| Max)?)/gi,
        category: 'technical',
        name: 'Processor',
        valueGroup: 1,
        confidence: 0.85
      },
      // Display pattern: "13.3-inch Retina display", "15.6-inch FHD"
      {
        regex: /(\d+(?:\.\d+)?)["-]\s*inch\s*([\w\s]+(?:display|screen))/gi,
        category: 'technical',
        name: 'Display',
        valueGroup: 0,
        confidence: 0.8
      },
      // Battery pattern: "Up to 10 hours battery life"
      {
        regex: /(?:up to|battery life of)?\s*(\d+(?:\.\d+)?)\s*hours?(?:\s*battery life)?/gi,
        category: 'technical',
        name: 'Battery Life',
        valueGroup: 1,
        confidence: 0.7,
        normalize: (match: RegExpMatchArray) => parseInt(match[1])
      },
      // Weight pattern: "3.1 pounds", "1.4 kg"
      {
        regex: /(\d+(?:\.\d+)?)\s*(pounds|lbs|kg|kilograms)/gi,
        category: 'physical',
        name: 'Weight',
        valueGroup: 0,
        confidence: 0.85,
        normalize: (match: RegExpMatchArray) => {
          const value = parseFloat(match[1]);
          const unit = match[2].toLowerCase();
          // Convert to grams
          if (unit.includes('pound') || unit === 'lbs') {
            return value * 453.592; // pounds to grams
          } else if (unit.includes('kg')) {
            return value * 1000; // kg to grams
          }
          return value;
        }
      },
      // Dimensions pattern: "12.8 x 8.9 x 0.6 inches"
      {
        regex: /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(inches|cm|mm)/gi,
        category: 'physical',
        name: 'Dimensions',
        valueGroup: 0,
        confidence: 0.8,
        normalize: (match: RegExpMatchArray) => {
          const length = parseFloat(match[1]);
          const width = parseFloat(match[2]);
          const height = parseFloat(match[3]);
          const unit = match[4].toLowerCase();
          
          // Convert to mm
          let factor = 1;
          if (unit.includes('inch')) {
            factor = 25.4;
          } else if (unit === 'cm') {
            factor = 10;
          }
          
          return {
            length: length * factor,
            width: width * factor,
            height: height * factor,
            unit: 'mm'
          };
        }
      }
    ];
    
    // Apply each pattern to the raw text
    patterns.forEach(pattern => {
      const regex = new RegExp(pattern.regex);
      let match;
      
      while ((match = regex.exec(rawText)) !== null) {
        const value = pattern.valueGroup !== undefined 
          ? match[pattern.valueGroup] 
          : match[0];
        
        const name = pattern.name || 
          (pattern.nameGroup !== undefined ? match[pattern.nameGroup] : '');
        
        const normalizedValue = pattern.normalize 
          ? pattern.normalize(match) 
          : undefined;
        
        specs.push({
          id: name.toLowerCase().replace(/\s+/g, '_'),
          name,
          value,
          category: pattern.category,
          confidenceScore: pattern.confidence,
          normalizedValue,
          source: 'extraction'
        });
      }
    });
    
    return specs;
  }
  
  // Enhance specifications with additional context and normalization
  enhanceSpecifications(specs: Specification[]): Specification[] {
    return specs.map(spec => {
      const enhanced = { ...spec };
      
      // If no normalized value exists, try to create one
      if (enhanced.normalizedValue === undefined) {
        if (typeof enhanced.value === 'string') {
          // Try to extract numeric values
          const numMatch = enhanced.value.match(/(\d+(?:\.\d+)?)/);
          if (numMatch) {
            enhanced.normalizedValue = parseFloat(numMatch[1]);
          }
        }
      }
      
      // Improve confidence based on known patterns
      if (enhanced.name.toLowerCase().includes('processor') || 
          enhanced.name.toLowerCase().includes('cpu')) {
        enhanced.confidenceScore = Math.max(enhanced.confidenceScore, 0.9);
      }
      
      return enhanced;
    });
  }
  
  // Merge specifications from multiple sources, prioritizing higher confidence
  mergeSpecifications(specSets: Specification[][]): Specification[] {
    const mergedSpecs: Record<string, Specification> = {};
    
    // Process each set of specifications
    specSets.forEach(specs => {
      specs.forEach(spec => {
        const key = `${spec.category}_${spec.name.toLowerCase()}`;
        
        // If spec doesn't exist yet or has higher confidence, use it
        if (!mergedSpecs[key] || mergedSpecs[key].confidenceScore < spec.confidenceScore) {
          mergedSpecs[key] = { ...spec };
        }
      });
    });
    
    return Object.values(mergedSpecs);
  }
}

// Create a singleton instance
export const specificationExtractor = new SpecificationExtractorService();