import { Product, Specification } from '../types';

export class AIEnhancementService {
  private apiKey: string;
  private apiEndpoint: string;
  
  constructor(apiKey: string, apiEndpoint = 'https://api.openai.com/v1/chat/completions') {
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint;
  }
  
  // Mock implementation for now - in a real implementation, this would call the OpenAI API
  async enhanceProductSpecifications(product: Product): Promise<Specification[]> {
    // For now, just return the existing specifications with slightly improved confidence
    return product.specifications.map(spec => ({
      ...spec,
      confidenceScore: Math.min(spec.confidenceScore + 0.1, 1.0),
      source: 'ai_enhanced'
    }));
  }
  
  // Extract missing specifications from product description and features
  async extractMissingSpecifications(product: Product): Promise<Specification[]> {
    // In a real implementation, this would use GPT to extract specs from text
    // For now, return a mock implementation
    
    const mockExtractedSpecs: Specification[] = [];
    
    // Check if we're missing common specifications
    const hasProcessor = product.specifications.some(s => 
      s.name.toLowerCase().includes('processor') || s.name.toLowerCase().includes('cpu')
    );
    
    if (!hasProcessor && product.description.includes('processor')) {
      // Try to extract processor info from description
      const processorMatch = product.description.match(/(Intel Core i\d-\d+|AMD Ryzen \d \d+|Apple M\d(?: Pro| Max)?)/i);
      
      if (processorMatch) {
        mockExtractedSpecs.push({
          id: 'processor',
          name: 'Processor',
          value: processorMatch[0],
          category: 'technical',
          confidenceScore: 0.7,
          source: 'ai_extraction'
        });
      }
    }
    
    return mockExtractedSpecs;
  }
  
  // Compare two products and highlight key differences
  async compareProducts(product1: Product, product2: Product): Promise<{
    category: string;
    name: string;
    product1Value: string;
    product2Value: string;
    significance: number; // 0-1 scale of how important this difference is
  }[]> {
    // In a real implementation, this would use GPT to analyze differences
    // For now, return a mock implementation
    
    const differences = [];
    
    // Compare specifications
    const allSpecNames = new Set([
      ...product1.specifications.map(s => s.name),
      ...product2.specifications.map(s => s.name)
    ]);
    
    for (const specName of allSpecNames) {
      const spec1 = product1.specifications.find(s => s.name === specName);
      const spec2 = product2.specifications.find(s => s.name === specName);
      
      if (spec1 && spec2 && spec1.value !== spec2.value) {
        differences.push({
          category: spec1.category,
          name: specName,
          product1Value: spec1.value,
          product2Value: spec2.value,
          significance: this.calculateSignificance(specName, spec1, spec2)
        });
      } else if (spec1 && !spec2) {
        differences.push({
          category: spec1.category,
          name: specName,
          product1Value: spec1.value,
          product2Value: 'Not specified',
          significance: 0.5
        });
      } else if (!spec1 && spec2) {
        differences.push({
          category: spec2.category,
          name: specName,
          product1Value: 'Not specified',
          product2Value: spec2.value,
          significance: 0.5
        });
      }
    }
    
    // Compare price
    if (product1.price.current !== product2.price.current) {
      differences.push({
        category: 'pricing',
        name: 'Price',
        product1Value: `$${product1.price.current.toFixed(2)}`,
        product2Value: `$${product2.price.current.toFixed(2)}`,
        significance: 0.9 // Price is usually very significant
      });
    }
    
    return differences;
  }
  
  // Helper to calculate significance of a specification difference
  private calculateSignificance(specName: string, spec1: Specification, spec2: Specification): number {
    const name = specName.toLowerCase();
    
    // High significance specs
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
    
    // Medium significance specs
    if (
      name.includes('display') || 
      name.includes('screen') || 
      name.includes('battery') || 
      name.includes('weight')
    ) {
      return 0.7;
    }
    
    // Default significance
    return 0.5;
  }
}

// Create a singleton instance
// In a real implementation, the API key would be loaded from environment variables
export const aiEnhancement = new AIEnhancementService('mock-api-key');