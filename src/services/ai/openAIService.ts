import axios from 'axios';
import { Specification, Product } from '../../types';
import { SpecificationComparison } from '../../types/specifications';

// OpenAI API configuration
interface OpenAIConfig {
  apiKey: string;
  model: string;
  baseURL: string;
  maxTokens: number;
  temperature: number;
}

// Response from OpenAI API
interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Cache entry for AI responses
interface CacheEntry {
  response: any;
  timestamp: number;
  expiresAt: number;
}

export class OpenAIService {
  private config: OpenAIConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private initialized: boolean = false;
  
  constructor() {
    // Default configuration
    this.config = {
      apiKey: '',
      model: 'gpt-3.5-turbo',
      baseURL: 'https://api.openai.com/v1',
      maxTokens: 1000,
      temperature: 0.7
    };
  }
  
  // Initialize the service with API key
  initialize(apiKey: string, options?: Partial<OpenAIConfig>): boolean {
    try {
      if (!apiKey) {
        console.error('OpenAI API key is required');
        return false;
      }
      
      this.config = {
        ...this.config,
        ...options,
        apiKey
      };
      
      this.initialized = true;
      console.log('OpenAI service initialized successfully');
      
      // Load cache from localStorage
      this.loadCache();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize OpenAI service:', error);
      this.initialized = false;
      return false;
    }
  }
  
  // Check if the service is initialized
  isInitialized(): boolean {
    return this.initialized;
  }
  
  // Make a request to the OpenAI API
  async makeRequest(
    messages: Array<{ role: string; content: string }>,
    options?: Partial<{
      model: string;
      temperature: number;
      maxTokens: number;
      cacheKey: string;
      cacheTTL: number; // Time to live in seconds
    }>
  ): Promise<any> {
    if (!this.initialized) {
      throw new Error('OpenAI service is not initialized');
    }
    
    const cacheKey = options?.cacheKey || this.generateCacheKey(messages);
    
    // Check cache first
    if (cacheKey && this.cache.has(cacheKey)) {
      const cachedEntry = this.cache.get(cacheKey)!;
      
      // Check if cache entry is still valid
      if (cachedEntry.expiresAt > Date.now()) {
        console.log('Using cached response for:', cacheKey);
        return cachedEntry.response;
      } else {
        // Remove expired cache entry
        this.cache.delete(cacheKey);
      }
    }
    
    try {
      const response = await axios.post<OpenAIResponse>(
        `${this.config.baseURL}/chat/completions`,
        {
          model: options?.model || this.config.model,
          messages,
          max_tokens: options?.maxTokens || this.config.maxTokens,
          temperature: options?.temperature || this.config.temperature
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );
      
      const result = response.data.choices[0].message.content;
      
      // Parse JSON if the result looks like JSON
      let parsedResult: any;
      try {
        if (result.trim().startsWith('{') || result.trim().startsWith('[')) {
          parsedResult = JSON.parse(result);
        } else {
          parsedResult = result;
        }
      } catch (error) {
        console.warn('Failed to parse JSON response:', error);
        parsedResult = result;
      }
      
      // Cache the result if cacheKey is provided
      if (cacheKey) {
        const cacheTTL = options?.cacheTTL || 3600; // Default: 1 hour
        this.cache.set(cacheKey, {
          response: parsedResult,
          timestamp: Date.now(),
          expiresAt: Date.now() + (cacheTTL * 1000)
        });
        
        // Save cache to localStorage
        this.saveCache();
      }
      
      return parsedResult;
    } catch (error: any) {
      console.error('OpenAI API request failed:', error.response?.data || error.message);
      throw new Error(`OpenAI API request failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  
  // Extract specifications from product description
  async extractSpecifications(product: Product): Promise<Specification[]> {
    const cacheKey = `extract_specs_${product.id}`;
    
    try {
      const messages = [
        {
          role: 'system',
          content: `You are an AI assistant specialized in extracting product specifications from text descriptions. 
          Extract all technical specifications from the provided product description and features.
          Return the specifications in a JSON array format with the following structure:
          [
            {
              "id": "unique_id_based_on_name",
              "name": "Specification Name",
              "value": "Specification Value",
              "category": "technical|physical|administrative|other",
              "confidenceScore": 0.0-1.0,
              "source": "extraction"
            }
          ]
          Focus on extracting specifications related to:
          - Technical specs (processor, memory, storage, graphics)
          - Physical attributes (dimensions, weight, color)
          - Display characteristics (size, resolution, technology)
          - Battery information
          - Connectivity options
          - Audio features
          - Camera specifications`
        },
        {
          role: 'user',
          content: `Extract specifications from the following product:
          
          Title: ${product.title}
          Brand: ${product.brand}
          Description: ${product.description}
          Features: ${product.features.join('\n')}`
        }
      ];
      
      const result = await this.makeRequest(messages, {
        temperature: 0.2, // Lower temperature for more deterministic results
        cacheKey,
        cacheTTL: 86400 // Cache for 24 hours
      });
      
      // Ensure the result is an array
      if (Array.isArray(result)) {
        // Add IDs if missing
        return result.map(spec => ({
          ...spec,
          id: spec.id || spec.name.toLowerCase().replace(/\s+/g, '_'),
          source: spec.source || 'extraction'
        }));
      } else {
        console.error('Unexpected response format from OpenAI:', result);
        return [];
      }
    } catch (error) {
      console.error('Failed to extract specifications:', error);
      return [];
    }
  }
  
  // Normalize specifications
  async normalizeSpecifications(specs: Specification[]): Promise<Specification[]> {
    if (specs.length === 0) return [];
    
    const cacheKey = `normalize_specs_${this.generateCacheKey(specs.map(s => s.name + s.value))}`;
    
    try {
      const messages = [
        {
          role: 'system',
          content: `You are an AI assistant specialized in normalizing product specifications.
          For each specification, add a normalizedValue property that standardizes the value for comparison.
          For numeric values, convert to a standard unit and provide the numeric value.
          For storage, convert to MB.
          For dimensions, convert to mm.
          For weight, convert to grams.
          Return the specifications in a JSON array with the same structure as the input, but with added normalizedValue.`
        },
        {
          role: 'user',
          content: `Normalize the following specifications:
          
          ${JSON.stringify(specs, null, 2)}`
        }
      ];
      
      const result = await this.makeRequest(messages, {
        temperature: 0.2,
        cacheKey,
        cacheTTL: 86400 // Cache for 24 hours
      });
      
      // Ensure the result is an array
      if (Array.isArray(result)) {
        return result;
      } else {
        console.error('Unexpected response format from OpenAI:', result);
        return specs; // Return original specs on error
      }
    } catch (error) {
      console.error('Failed to normalize specifications:', error);
      return specs; // Return original specs on error
    }
  }
  
  // Compare products and explain differences
  async compareProducts(products: Product[]): Promise<SpecificationComparison[]> {
    if (products.length < 2) return [];
    
    const productIds = products.map(p => p.id).join('_');
    const cacheKey = `compare_products_${productIds}`;
    
    try {
      const messages = [
        {
          role: 'system',
          content: `You are an AI assistant specialized in comparing product specifications.
          Compare the provided products and identify key differences in their specifications.
          For each significant difference, explain why it matters and how it might affect the user experience.
          Return the comparison results in a JSON array with the following structure:
          [
            {
              "specId": "unique_id_based_on_name",
              "name": "Specification Name",
              "differences": [
                {
                  "productId": "product_id",
                  "value": "specification value",
                  "normalizedValue": "normalized value if available",
                  "isBest": true/false
                }
              ],
              "differenceSignificance": 0.0-1.0,
              "explanation": "Explanation of why this difference matters"
            }
          ]`
        },
        {
          role: 'user',
          content: `Compare the following products:
          
          ${JSON.stringify(products.map(p => ({
            id: p.id,
            title: p.title,
            brand: p.brand,
            specifications: p.specifications
          })), null, 2)}`
        }
      ];
      
      const result = await this.makeRequest(messages, {
        temperature: 0.5,
        maxTokens: 2000,
        cacheKey,
        cacheTTL: 86400 // Cache for 24 hours
      });
      
      // Ensure the result is an array
      if (Array.isArray(result)) {
        return result;
      } else {
        console.error('Unexpected response format from OpenAI:', result);
        return [];
      }
    } catch (error) {
      console.error('Failed to compare products:', error);
      return [];
    }
  }
  
  // Generate recommendation based on user preferences
  async generateRecommendation(
    products: Product[],
    userPreferences: Record<string, number> = {}
  ): Promise<string> {
    if (products.length === 0) return 'No products to recommend.';
    
    const productIds = products.map(p => p.id).join('_');
    const preferencesKey = Object.entries(userPreferences)
      .map(([k, v]) => `${k}:${v}`)
      .join('_');
    const cacheKey = `recommendation_${productIds}_${preferencesKey}`;
    
    try {
      const messages = [
        {
          role: 'system',
          content: `You are an AI assistant specialized in recommending products based on user preferences.
          Analyze the provided products and user preferences to generate a personalized recommendation.
          Explain why the recommended product(s) would be a good fit for the user.
          Keep your response concise and focused on the most important factors.`
        },
        {
          role: 'user',
          content: `Generate a recommendation for the following products based on these preferences:
          
          User Preferences:
          ${Object.entries(userPreferences).map(([key, value]) => `${key}: ${value}`).join('\n')}
          
          Products:
          ${JSON.stringify(products.map(p => ({
            id: p.id,
            title: p.title,
            brand: p.brand,
            price: p.price,
            specifications: p.specifications
          })), null, 2)}`
        }
      ];
      
      const result = await this.makeRequest(messages, {
        temperature: 0.7,
        cacheKey,
        cacheTTL: 86400 // Cache for 24 hours
      });
      
      return typeof result === 'string' ? result : JSON.stringify(result);
    } catch (error) {
      console.error('Failed to generate recommendation:', error);
      return 'Unable to generate recommendation at this time.';
    }
  }
  
  // Explain a specification in simple terms
  async explainSpecification(specName: string, specValue: string): Promise<string> {
    const cacheKey = `explain_spec_${specName}_${specValue}`;
    
    try {
      const messages = [
        {
          role: 'system',
          content: `You are an AI assistant specialized in explaining technical specifications in simple terms.
          Explain the provided specification in a way that's easy to understand for non-technical users.
          Include information about what this specification means, why it matters, and how it affects the user experience.
          Keep your explanation concise and informative.`
        },
        {
          role: 'user',
          content: `Explain this specification in simple terms:
          
          Specification: ${specName}
          Value: ${specValue}`
        }
      ];
      
      const result = await this.makeRequest(messages, {
        temperature: 0.7,
        cacheKey,
        cacheTTL: 604800 // Cache for 7 days
      });
      
      return typeof result === 'string' ? result : JSON.stringify(result);
    } catch (error) {
      console.error(`Failed to explain specification ${specName}:`, error);
      return `${specName} is a technical specification of the product with value ${specValue}.`;
    }
  }
  
  // Generate a cache key for a request
  private generateCacheKey(data: any): string {
    // Convert data to string and hash it
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return `openai_${hash}`;
  }
  
  // Save cache to localStorage
  private saveCache(): void {
    try {
      // Convert Map to object for serialization
      const cacheObject: Record<string, CacheEntry> = {};
      
      this.cache.forEach((value, key) => {
        cacheObject[key] = value;
      });
      
      localStorage.setItem('openai_cache', JSON.stringify(cacheObject));
    } catch (error) {
      console.error('Failed to save cache to localStorage:', error);
    }
  }
  
  // Load cache from localStorage
  private loadCache(): void {
    try {
      const cachedData = localStorage.getItem('openai_cache');
      
      if (cachedData) {
        const cacheObject = JSON.parse(cachedData);
        
        // Convert object back to Map
        Object.entries(cacheObject).forEach(([key, value]) => {
          // Only load non-expired cache entries
          if ((value as CacheEntry).expiresAt > Date.now()) {
            this.cache.set(key, value as CacheEntry);
          }
        });
        
        console.log(`Loaded ${this.cache.size} cache entries from localStorage`);
      }
    } catch (error) {
      console.error('Failed to load cache from localStorage:', error);
    }
  }
  
  // Clear cache
  clearCache(): void {
    this.cache.clear();
    localStorage.removeItem('openai_cache');
    console.log('Cache cleared');
  }
}

// Create a singleton instance
export const openAIService = new OpenAIService();