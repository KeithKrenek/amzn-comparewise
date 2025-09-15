import { Product, SearchQuery, Specification } from '../../types';
import { scraperManager } from './scraperManager';

class ScraperService {
  constructor() {
    // Initialize the scraper manager on creation
    this.initialize();
  }
  
  // Initialize the scraper service
  async initialize(): Promise<boolean> {
    try {
      // Initialize scraper with a CORS proxy
      // In a production environment, you should use a backend service instead
      console.log('Initializing scraper service...');
      const success = await scraperManager.initializeScraper({
        requestDelay: 2000,  // 2 seconds between requests to avoid rate limiting
        maxRetries: 3
      });
      
      return success;
    } catch (error) {
      console.error('Scraper service initialization failed:', error);
      return false;
    }
  }
  
  // Check if the scraper is initialized
  isAvailable(): boolean {
    return scraperManager.isAvailable();
  }
  
  // Set the initialization status (used for testing)
  setAvailable(available: boolean): void {
    scraperManager.setAvailable(available);
  }
  
  // Search for products
  async searchProducts(query: SearchQuery): Promise<Product[]> {
    return scraperManager.searchProducts(query);
  }
  
  // Get product details
  async getProductDetails(productId: string): Promise<Product | null> {
    return scraperManager.getProductDetails(productId);
  }
  
  // Get related products
  async getRelatedProducts(productId: string): Promise<Product[]> {
    return scraperManager.getRelatedProducts(productId);
  }
  
  // Extract specifications from a product
  async extractSpecifications(productId: string): Promise<Specification[]> {
    return scraperManager.extractSpecifications(productId);
  }
}

// Create a singleton instance
export const scraperService = new ScraperService();