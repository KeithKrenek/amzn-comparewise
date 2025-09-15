import { Product, Specification } from '../../types';
import { SpecificationComparison } from '../../types/specifications';
import { openAIService } from './openAIService';
import { differenceExplainer } from '../comparison/differenceExplainer';
import { comparisonEngine } from '../comparison/comparisonEngine';
import { normalizationService } from '../normalization/normalizationService';

class AIService {
  private initialized: boolean = false;
  
  // Initialize the AI service
  async initialize(apiKey: string): Promise<boolean> {
    try {
      // Initialize OpenAI service
      const success = openAIService.initialize(apiKey, {
        model: 'gpt-3.5-turbo', // Use gpt-3.5-turbo for better cost efficiency
        temperature: 0.5
      });
      
      this.initialized = success;
      console.log('AI service initialized:', success);
      
      return success;
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
      this.initialized = false;
      return false;
    }
  }
  
  // Check if the service is initialized
  isInitialized(): boolean {
    return this.initialized && openAIService.isInitialized();
  }
  
  // Extract specifications from a product
  async extractSpecifications(product: Product): Promise<Specification[]> {
    if (!this.isInitialized()) {
      console.warn('AI service is not initialized. Using fallback method.');
      return this.fallbackExtractSpecifications(product);
    }
    
    try {
      const extractedSpecs = await openAIService.extractSpecifications(product);
      
      // Normalize the extracted specifications
      return normalizationService.normalizeSpecifications(extractedSpecs);
    } catch (error) {
      console.error('Failed to extract specifications using AI:', error);
      return this.fallbackExtractSpecifications(product);
    }
  }
  
  // Normalize specifications
  async normalizeSpecifications(specs: Specification[]): Promise<Specification[]> {
    if (!this.isInitialized()) {
      console.warn('AI service is not initialized. Using fallback method.');
      return normalizationService.normalizeSpecifications(specs);
    }
    
    try {
      const aiNormalizedSpecs = await openAIService.normalizeSpecifications(specs);
      
      // Apply additional normalization using the normalization service
      return normalizationService.normalizeSpecifications(aiNormalizedSpecs);
    } catch (error) {
      console.error('Failed to normalize specifications using AI:', error);
      return normalizationService.normalizeSpecifications(specs);
    }
  }
  
  // Compare products
  async compareProducts(products: Product[]): Promise<SpecificationComparison[]> {
    if (!this.isInitialized()) {
      console.warn('AI service is not initialized. Using fallback method.');
      return this.fallbackCompareProducts(products);
    }
    
    try {
      // First, ensure all products have normalized specifications
      const normalizedProducts = await Promise.all(
        products.map(async product => {
          if (product.specifications.some(spec => spec.normalizedValue === undefined)) {
            const normalizedSpecs = await this.normalizeSpecifications(product.specifications);
            return {
              ...product,
              specifications: normalizedSpecs
            };
          }
          return product;
        })
      );
      
      // Then use OpenAI to compare the products
      return await openAIService.compareProducts(normalizedProducts);
    } catch (error) {
      console.error('Failed to compare products using AI:', error);
      return this.fallbackCompareProducts(products);
    }
  }
  
  // Generate recommendation
  async generateRecommendation(
    products: Product[],
    userPreferences: Record<string, number> = {}
  ): Promise<string> {
    if (!this.isInitialized()) {
      console.warn('AI service is not initialized. Using fallback method.');
      return this.fallbackGenerateRecommendation(products, userPreferences);
    }
    
    try {
      return await openAIService.generateRecommendation(products, userPreferences);
    } catch (error) {
      console.error('Failed to generate recommendation using AI:', error);
      return this.fallbackGenerateRecommendation(products, userPreferences);
    }
  }
  
  // Explain a specification
  async explainSpecification(specName: string, specValue: string): Promise<string> {
    if (!this.isInitialized()) {
      console.warn('AI service is not initialized. Using fallback method.');
      return this.fallbackExplainSpecification(specName, specValue);
    }
    
    try {
      return await openAIService.explainSpecification(specName, specValue);
    } catch (error) {
      console.error(`Failed to explain specification ${specName} using AI:`, error);
      return this.fallbackExplainSpecification(specName, specValue);
    }
  }
  
  // Infer missing specifications
  async inferMissingSpecifications(product: Product): Promise<Specification[]> {
    if (!this.isInitialized()) {
      console.warn('AI service is not initialized. Cannot infer missing specifications.');
      return product.specifications;
    }
    
    try {
      // Use OpenAI to infer missing specifications from product description and features
      const prompt = `
        Product: ${product.title}
        Brand: ${product.brand}
        Description: ${product.description}
        Features: ${product.features.join('\n')}
        
        Based on the above information, infer any missing specifications that are not already in the product's specification list.
        Current specifications: ${product.specifications.map(spec => `${spec.name}: ${spec.value}`).join(', ')}
        
        Return only the inferred specifications in JSON format.
      `;
      
      const inferredSpecs = await openAIService.makeRequest(
        [
          { role: 'system', content: 'You are an AI assistant that infers missing product specifications from descriptions and features.' },
          { role: 'user', content: prompt }
        ],
        { cacheKey: `infer_specs_${product.id}` }
      );
      
      if (Array.isArray(inferredSpecs)) {
        // Mark these specifications as inferred
        const markedSpecs = inferredSpecs.map(spec => ({
          ...spec,
          source: 'inference',
          confidenceScore: 0.7 // Lower confidence for inferred specs
        }));
        
        // Normalize the inferred specifications
        return normalizationService.normalizeSpecifications(markedSpecs);
      }
      
      return product.specifications;
    } catch (error) {
      console.error('Failed to infer missing specifications:', error);
      return product.specifications;
    }
  }
  
  // Fallback methods (used when AI service is not available)
  
  private fallbackExtractSpecifications(product: Product): Specification[] {
    // Return existing specifications
    return normalizationService.normalizeSpecifications(product.specifications);
  }
  
  private fallbackCompareProducts(products: Product[]): SpecificationComparison[] {
    if (products.length < 2) return [];
    
    // Use the comparison engine for fallback
    return comparisonEngine.compareProducts(products);
  }
  
  private fallbackGenerateRecommendation(
    products: Product[],
    userPreferences: Record<string, number> = {}
  ): string {
    if (products.length === 0) {
      return 'No products to recommend.';
    }
    
    // Simple recommendation based on price
    const sortedByPrice = [...products].sort((a, b) => a.price.current - b.price.current);
    const cheapest = sortedByPrice[0];
    const mostExpensive = sortedByPrice[sortedByPrice.length - 1];
    
    // Get significant differences
    const comparisons = comparisonEngine.findSignificantDifferences(products);
    
    // Generate recommendation using the difference explainer
    const recommendation = differenceExplainer.generateRecommendation(comparisons);
    
    return `Based on the available products, here are some recommendations:
    
    Best Value: ${cheapest.brand} ${cheapest.title}
    This product offers the lowest price at $${cheapest.price.current.toFixed(2)}.
    
    Premium Option: ${mostExpensive.brand} ${mostExpensive.title}
    This product offers the highest price at $${mostExpensive.price.current.toFixed(2)}, which may indicate higher quality or more features.
    
    ${recommendation}
    
    For a more personalized recommendation, please initialize the AI service.`;
  }
  
  private fallbackExplainSpecification(specName: string, specValue: string): string {
    // Generic explanations for common specifications
    const lowerName = specName.toLowerCase();
    
    if (lowerName.includes('processor') || lowerName.includes('cpu')) {
      return `The processor (${specValue}) is the brain of the device, handling all calculations and operations. A faster processor generally means better performance.`;
    } else if (lowerName.includes('ram') || lowerName.includes('memory')) {
      return `RAM (${specValue}) is the short-term memory of the device. More RAM allows the device to handle more applications simultaneously without slowing down.`;
    } else if (lowerName.includes('storage')) {
      return `Storage (${specValue}) determines how many files, applications, and data you can store on the device. More storage means more space for your files.`;
    } else if (lowerName.includes('display') || lowerName.includes('screen')) {
      return `The display (${specValue}) is what you look at when using the device. Higher resolution and better technology generally mean a clearer, more vibrant image.`;
    } else if (lowerName.includes('battery')) {
      return `Battery life (${specValue}) indicates how long the device can run on a single charge. Longer battery life means more usage time before needing to recharge.`;
    } else if (lowerName.includes('weight')) {
      return `Weight (${specValue}) affects the portability of the device. Lighter devices are generally easier to carry around.`;
    }
    
    return `${specName} (${specValue}) is a specification of the product that may affect its performance or usability.`;
  }
}

// Create a singleton instance
export const aiService = new AIService();