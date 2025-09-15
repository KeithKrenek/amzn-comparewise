import { Product } from '../../types';
import { comparisonEngine } from '../comparison/comparisonEngine';

export interface ScoringOptions {
  weights: Record<string, number>;      // Specification importance weights
  boostFactors?: Record<string, number>; // Additional boost for certain aspects
  normalization?: 'minmax' | 'zscore' | 'none';
  considerMissingSpecsAs?: 'average' | 'minimum' | 'ignore';
}

export interface ScoreExplanation {
  overallScore: number;
  categoryScores: Record<string, number>;
  specScores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  missingSpecs: string[];
}

export class ProductScorer {
  // Default weights for different specification types
  private defaultWeights: Record<string, number> = {
    processor: 0.9,
    cpu: 0.9,
    ram: 0.8,
    memory: 0.8,
    storage: 0.7,
    gpu: 0.7,
    graphics: 0.7,
    display: 0.6,
    screen: 0.6,
    battery: 0.6,
    weight: 0.5,
    dimensions: 0.4,
    ports: 0.3,
    connectivity: 0.3,
    camera: 0.3,
    audio: 0.2,
    keyboard: 0.2,
    touchpad: 0.2
  };
  
  // Calculate overall score for a product based on preferences
  calculateScore(product: Product, options: Partial<ScoringOptions> = {}): number {
    // Merge with default options
    const mergedOptions: ScoringOptions = {
      weights: { ...this.defaultWeights, ...(options.weights || {}) },
      boostFactors: options.boostFactors || {},
      normalization: options.normalization || 'none',
      considerMissingSpecsAs: options.considerMissingSpecsAs || 'ignore'
    };
    
    // Use the comparison engine to calculate a score
    const { score } = comparisonEngine.calculateProductScore(product, mergedOptions.weights);
    
    return score;
  }
  
  // Calculate scores for multiple products
  calculateScores(
    products: Product[],
    options: Partial<ScoringOptions> = {}
  ): Record<string, number> {
    const scores: Record<string, number> = {};
    
    // Calculate raw scores
    products.forEach(product => {
      scores[product.id] = this.calculateScore(product, options);
    });
    
    // Apply normalization if requested
    if (options.normalization && options.normalization !== 'none') {
      const scoreValues = Object.values(scores);
      
      if (options.normalization === 'minmax' && scoreValues.length > 0) {
        const min = Math.min(...scoreValues);
        const max = Math.max(...scoreValues);
        const range = max - min;
        
        if (range > 0) {
          for (const [id, score] of Object.entries(scores)) {
            scores[id] = (score - min) / range;
          }
        }
      } else if (options.normalization === 'zscore' && scoreValues.length > 1) {
        // Calculate mean
        const mean = scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length;
        
        // Calculate standard deviation
        const squaredDiffs = scoreValues.map(score => Math.pow(score - mean, 2));
        const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / scoreValues.length;
        const stdDev = Math.sqrt(variance);
        
        if (stdDev > 0) {
          for (const [id, score] of Object.entries(scores)) {
            scores[id] = (score - mean) / stdDev;
          }
        }
      }
    }
    
    return scores;
  }
  
  // Calculate score for a specific aspect (e.g., performance, value)
  calculateAspectScore(
    product: Product,
    aspect: string,
    options: Partial<ScoringOptions> = {}
  ): number {
    // Define aspect-specific weights
    const aspectWeights: Record<string, Record<string, number>> = {
      performance: {
        processor: 1.0,
        cpu: 1.0,
        ram: 0.9,
        memory: 0.9,
        storage: 0.7,
        gpu: 0.9,
        graphics: 0.9
      },
      display: {
        display: 1.0,
        screen: 1.0,
        resolution: 0.9,
        refresh_rate: 0.8,
        color: 0.7,
        brightness: 0.7
      },
      portability: {
        weight: 1.0,
        dimensions: 0.9,
        battery: 1.0,
        thickness: 0.8
      },
      value: {
        // Value is calculated differently
      }
    };
    
    // For value aspect, calculate performance score and divide by price
    if (aspect.toLowerCase() === 'value') {
      const performanceScore = this.calculateAspectScore(product, 'performance', options);
      return product.price.current > 0 ? performanceScore / (product.price.current / 1000) : 0;
    }
    
    // For other aspects, use aspect-specific weights
    const aspectWeightMap = aspectWeights[aspect.toLowerCase()];
    if (!aspectWeightMap) {
      return this.calculateScore(product, options); // Fall back to overall score
    }
    
    // Calculate with aspect-specific weights
    return this.calculateScore(product, {
      ...options,
      weights: { ...this.defaultWeights, ...aspectWeightMap, ...(options.weights || {}) }
    });
  }
  
  // Generate a detailed explanation of a product's score
  explainScore(product: Product, options: Partial<ScoringOptions> = {}): ScoreExplanation {
    // Calculate score and get breakdown
    const { score, breakdown } = comparisonEngine.calculateProductScore(
      product, 
      { ...this.defaultWeights, ...(options.weights || {}) }
    );
    
    // Calculate individual spec scores
    const specScores: Record<string, number> = {};
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const missingSpecs: string[] = [];
    
    // Check for key specifications
    const keySpecs = [
      'processor', 'cpu', 'ram', 'memory', 'storage', 
      'gpu', 'graphics', 'display', 'screen', 'battery'
    ];
    
    // Check for missing key specs
    keySpecs.forEach(keySpec => {
      const hasSpec = product.specifications.some(spec => 
        spec.name.toLowerCase().includes(keySpec)
      );
      
      if (!hasSpec) {
        missingSpecs.push(keySpec);
      }
    });
    
    // Calculate scores for each specification
    product.specifications.forEach(spec => {
      // Get base importance
      let importance = comparisonEngine.getSpecificationImportance(spec.name);
      
      // Apply user preference if available
      if (options.weights && options.weights[spec.name.toLowerCase()]) {
        importance *= options.weights[spec.name.toLowerCase()];
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
      
      // Store the spec score
      specScores[spec.name] = specScore;
      
      // Determine if this is a strength or weakness
      if (specScore >= 0.8 && importance >= 0.7) {
        strengths.push(spec.name);
      } else if (specScore <= 0.4 && importance >= 0.7) {
        weaknesses.push(spec.name);
      }
    });
    
    return {
      overallScore: score,
      categoryScores: breakdown,
      specScores,
      strengths,
      weaknesses,
      missingSpecs
    };
  }
  
  // Find the best product for a specific use case
  findBestProductForUseCase(
    products: Product[],
    useCase: 'gaming' | 'productivity' | 'portability' | 'value' | 'general',
    options: Partial<ScoringOptions> = {}
  ): { product: Product; score: number } | null {
    if (products.length === 0) return null;
    
    // Define use case-specific weights
    const useCaseWeights: Record<string, Record<string, number>> = {
      gaming: {
        gpu: 1.0,
        graphics: 1.0,
        processor: 0.9,
        cpu: 0.9,
        ram: 0.8,
        memory: 0.8,
        refresh_rate: 0.8,
        display: 0.7
      },
      productivity: {
        processor: 1.0,
        cpu: 1.0,
        ram: 0.9,
        memory: 0.9,
        storage: 0.8,
        display: 0.7,
        battery: 0.7
      },
      portability: {
        weight: 1.0,
        dimensions: 0.9,
        battery: 1.0,
        thickness: 0.8
      },
      value: {
        // Value is calculated differently
      },
      general: this.defaultWeights
    };
    
    // Calculate scores based on use case
    const scores: Record<string, number> = {};
    
    if (useCase === 'value') {
      // For value, calculate performance/price ratio
      products.forEach(product => {
        const performanceScore = this.calculateAspectScore(product, 'performance', options);
        scores[product.id] = product.price.current > 0 ? 
          performanceScore / (product.price.current / 1000) : 0;
      });
    } else {
      // For other use cases, use the specific weights
      const weights = { ...useCaseWeights[useCase], ...(options.weights || {}) };
      
      products.forEach(product => {
        scores[product.id] = this.calculateScore(product, { ...options, weights });
      });
    }
    
    // Find the product with the highest score
    let bestProductId = '';
    let bestScore = -Infinity;
    
    for (const [id, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestProductId = id;
      }
    }
    
    const bestProduct = products.find(p => p.id === bestProductId);
    
    if (!bestProduct) return null;
    
    return {
      product: bestProduct,
      score: bestScore
    };
  }
}

// Create a singleton instance
export const productScorer = new ProductScorer();