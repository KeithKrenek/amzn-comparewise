import { RobustAmazonScraper } from './robustScraper';
import { Product, SearchQuery, Specification } from '../../types';
import { mockProducts } from '../../data/mockProducts';

interface ScraperManagerOptions {
  useProxy?: boolean;
  proxyUrl?: string;
  requestDelay?: number;
  maxRetries?: number;
  cacheTimeout?: number; // In milliseconds
}

export class ScraperManager {
  private scraper: RobustAmazonScraper | null = null;
  private isInitialized: boolean = false;
  private useRealScraper: boolean = false;
  private searchCache: Map<string, { data: Product[], timestamp: number }> = new Map();
  private productCache: Map<string, { data: Product, timestamp: number }> = new Map();
  private cacheTimeout: number;
  
  constructor(options: ScraperManagerOptions = {}) {
    this.cacheTimeout = options.cacheTimeout || 3600000; // Default: 1 hour
    
    if (options.useProxy) {
      this.initializeScraper({
        proxyUrl: options.proxyUrl,
        requestDelay: options.requestDelay,
        maxRetries: options.maxRetries
      });
    }
  }
  
  // Initialize the scraper
  async initializeScraper(options: {
    proxyUrl?: string;
    requestDelay?: number;
    maxRetries?: number;
  } = {}): Promise<boolean> {
    try {
      console.log('Initializing robust scraper...');
      
      this.scraper = new RobustAmazonScraper({
        proxyUrl: options.proxyUrl,
        requestDelay: options.requestDelay || 1000,
        maxRetries: options.maxRetries || 3
      });
      
      this.isInitialized = true;
      this.useRealScraper = true;
      
      console.log('Scraper initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize scraper:', error);
      this.isInitialized = false;
      this.useRealScraper = false;
      return false;
    }
  }
  
  // Check if the scraper is initialized
  isAvailable(): boolean {
    return this.isInitialized && this.useRealScraper;
  }
  
  // Set availability (for testing or forced fallback)
  setAvailable(available: boolean): void {
    this.useRealScraper = available;
    console.log(`Scraper availability set to: ${available}`);
  }
  
  // Generate cache key
  private getSearchCacheKey(query: SearchQuery): string {
    return `${query.keyword || ''}_${query.category || ''}_${query.page || 1}_${query.limit || 10}_${JSON.stringify(query.sort || {})}`;
  }
  
  // Clear expired cache entries
  private cleanCache(): void {
    const now = Date.now();
    
    // Clean search cache
    this.searchCache.forEach((entry, key) => {
      if (now - entry.timestamp > this.cacheTimeout) {
        this.searchCache.delete(key);
      }
    });
    
    // Clean product cache
    this.productCache.forEach((entry, key) => {
      if (now - entry.timestamp > this.cacheTimeout) {
        this.productCache.delete(key);
      }
    });
  }
  
  // Search for products
  async searchProducts(query: SearchQuery): Promise<Product[]> {
    try {
      // Clean expired cache entries
      this.cleanCache();
      
      // Check cache first
      const cacheKey = this.getSearchCacheKey(query);
      const cachedData = this.searchCache.get(cacheKey);
      
      if (cachedData) {
        console.log('Using cached search results for:', query.keyword);
        return cachedData.data;
      }
      
      // If scraper is available, use it
      if (this.isAvailable() && this.scraper) {
        console.log('Using real scraper for search:', query.keyword);
        try {
          const products = await this.scraper.searchProducts(
            query.keyword || '',
            query.limit || 10
          );
          
          // Cache results
          this.searchCache.set(cacheKey, {
            data: products,
            timestamp: Date.now()
          });
          
          // Cache individual products too
          products.forEach(product => {
            this.productCache.set(product.id, {
              data: product,
              timestamp: Date.now()
            });
          });
          
          console.log(`Found ${products.length} products via real scraper`);
          return products;
        } catch (error) {
          console.error('Real scraper failed, falling back to mock data:', error);
          // Fallback to mock data if real scraper fails
          const mockData = this.getMockSearchResults(query);
          return mockData;
        }
      } else {
        // Use mock data if scraper is not available
        console.log('Using mock data for search:', query.keyword);
        return this.getMockSearchResults(query);
      }
    } catch (error) {
      console.error('Error in searchProducts:', error);
      return this.getMockSearchResults(query);
    }
  }
  
  // Get product details
  async getProductDetails(productId: string): Promise<Product | null> {
    try {
      // Clean expired cache entries
      this.cleanCache();
      
      // Check cache first
      const cachedProduct = this.productCache.get(productId);
      if (cachedProduct) {
        console.log('Using cached product details for:', productId);
        return cachedProduct.data;
      }
      
      // If scraper is available, use it
      if (this.isAvailable() && this.scraper) {
        console.log('Using real scraper for product details:', productId);
        try {
          const product = await this.scraper.getProductDetails(productId);
          
          if (product) {
            // Cache the product
            this.productCache.set(productId, {
              data: product,
              timestamp: Date.now()
            });
            
            return product;
          } else {
            console.warn(`Real scraper returned null for product ${productId}, falling back to mock data`);
            return this.getMockProductDetails(productId);
          }
        } catch (error) {
          console.error(`Real scraper failed for product ${productId}, falling back to mock data:`, error);
          return this.getMockProductDetails(productId);
        }
      } else {
        // Use mock data if scraper is not available
        console.log('Using mock data for product details:', productId);
        return this.getMockProductDetails(productId);
      }
    } catch (error) {
      console.error(`Error in getProductDetails for ${productId}:`, error);
      return this.getMockProductDetails(productId);
    }
  }
  
  // Get related products
  async getRelatedProducts(productId: string): Promise<Product[]> {
    // Check if scraper is available
    if (this.isAvailable() && this.scraper) {
      console.log('Using real scraper for related products:', productId);
      try {
        // Get the product details first
        const product = await this.getProductDetails(productId);
        if (!product) {
          console.warn(`Could not find product ${productId} for related products`);
          return this.getMockRelatedProducts(productId);
        }
        
        // Search for related products based on brand or category
        const relatedQuery: SearchQuery = {
          keyword: product.brand,
          limit: 5
        };
        
        const similarProducts = await this.searchProducts(relatedQuery);
        
        // Filter out the current product and limit to 4 items
        return similarProducts
          .filter(p => p.id !== productId)
          .slice(0, 4);
      } catch (error) {
        console.error(`Error getting related products for ${productId}:`, error);
        return this.getMockRelatedProducts(productId);
      }
    } else {
      // Use mock data if scraper is not available
      console.log('Using mock data for related products:', productId);
      return this.getMockRelatedProducts(productId);
    }
  }
  
  // Extract specifications from a product
  async extractSpecifications(productId: string): Promise<Specification[]> {
    // Get the product details
    const product = await this.getProductDetails(productId);
    
    if (product) {
      return product.specifications;
    }
    
    return [];
  }
  
  // Mock data methods (used when the scraper service is not available)
  private getMockSearchResults(query: SearchQuery): Product[] {
    // Filter mock products based on query
    let results = [...mockProducts];
    
    // Filter by keyword
    if (query.keyword) {
      const keyword = query.keyword.toLowerCase();
      results = results.filter(product => 
        product.title.toLowerCase().includes(keyword) ||
        product.brand.toLowerCase().includes(keyword) ||
        product.description.toLowerCase().includes(keyword) ||
        product.features.some(feature => feature.toLowerCase().includes(keyword))
      );
    }
    
    // Apply pagination
    if (query.page && query.limit) {
      const start = (query.page - 1) * query.limit;
      const end = start + query.limit;
      results = results.slice(start, end);
    }
    
    return results;
  }
  
  private getMockProductDetails(productId: string): Product | null {
    // Find product by ID
    return mockProducts.find(p => p.id === productId) || null;
  }
  
  private getMockRelatedProducts(productId: string): Product[] {
    // Get current product
    const currentProduct = mockProducts.find(p => p.id === productId);
    
    if (!currentProduct) {
      return [];
    }
    
    // Find products with similar specifications
    return mockProducts
      .filter(p => p.id !== productId) // Exclude current product
      .filter(p => p.brand === currentProduct.brand || // Same brand
                  Math.abs(p.price.current - currentProduct.price.current) < 300) // Or similar price range
      .slice(0, 4); // Limit to 4 related products
  }
}

// Export singleton instance
export const scraperManager = new ScraperManager();