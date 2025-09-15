import { ProductDataAdapter } from '../api/adapters/adapter.interface';
import { MockAdapter } from '../api/adapters/mock.adapter';
import { AmazonAdapter } from '../api/adapters/amazon.adapter';
import { Product, SearchQuery, Specification } from '../types';
import { scraperService } from './scraping/scraperService';

class ExtractionService {
  private adapter: ProductDataAdapter;
  private isScraperInitialized: boolean = false;
  private amazonAdapter: AmazonAdapter | null = null;
  private retryAttempts: number = 3;
  
  constructor(adapter: ProductDataAdapter) {
    this.adapter = adapter;
    this.initializeScraper();
  }
  
  // Initialize the scraper service
  private async initializeScraper() {
    try {
      this.isScraperInitialized = await scraperService.initialize();
      console.log('Scraper initialization result:', this.isScraperInitialized);
      
      if (this.isScraperInitialized) {
        this.amazonAdapter = new AmazonAdapter();
      }
    } catch (error) {
      console.error('Error initializing scraper service:', error);
      this.isScraperInitialized = false;
    }
  }
  
  async searchProducts(query: SearchQuery): Promise<Product[]> {
    try {
      // First attempt using the current adapter
      return await this.adapter.searchProducts(query);
    } catch (error) {
      console.error('Error in primary search, trying fallback:', error);
      
      // Fallback to scraperService directly if adapter fails
      if (this.isScraperInitialized) {
        try {
          return await scraperService.searchProducts(query);
        } catch (scraperError) {
          console.error('Scraper fallback failed:', scraperError);
        }
      }
      
      // Last resort: use mock adapter
      const mockAdapter = new MockAdapter();
      return mockAdapter.searchProducts(query);
    }
  }
  
  async getProductDetails(productId: string): Promise<Product | null> {
    try {
      // First attempt using the current adapter
      return await this.adapter.getProductDetails(productId);
    } catch (error) {
      console.error(`Error in primary product details for ${productId}, trying fallback:`, error);
      
      // Fallback to scraperService directly if adapter fails
      if (this.isScraperInitialized) {
        try {
          return await scraperService.getProductDetails(productId);
        } catch (scraperError) {
          console.error('Scraper fallback failed:', scraperError);
        }
      }
      
      // Last resort: use mock adapter
      const mockAdapter = new MockAdapter();
      return mockAdapter.getProductDetails(productId);
    }
  }
  
  async getRelatedProducts(productId: string): Promise<Product[]> {
    try {
      // First attempt using the current adapter
      return await this.adapter.getRelatedProducts(productId);
    } catch (error) {
      console.error(`Error in primary related products for ${productId}, trying fallback:`, error);
      
      // Fallback to scraperService directly if adapter fails
      if (this.isScraperInitialized) {
        try {
          return await scraperService.getRelatedProducts(productId);
        } catch (scraperError) {
          console.error('Scraper fallback failed:', scraperError);
        }
      }
      
      // Last resort: use mock adapter
      const mockAdapter = new MockAdapter();
      return mockAdapter.getRelatedProducts(productId);
    }
  }
  
  async extractSpecifications(productId: string): Promise<Specification[]> {
    try {
      // First attempt using the current adapter
      return await this.adapter.extractSpecifications(productId);
    } catch (error) {
      console.error(`Error in primary specification extraction for ${productId}, trying fallback:`, error);
      
      // Fallback to scraperService directly if adapter fails
      if (this.isScraperInitialized) {
        try {
          return await scraperService.extractSpecifications(productId);
        } catch (scraperError) {
          console.error('Scraper fallback failed:', scraperError);
        }
      }
      
      // Last resort: use mock adapter
      const mockAdapter = new MockAdapter();
      return mockAdapter.extractSpecifications(productId);
    }
  }
  
  async normalizeSpecifications(specs: Specification[]): Promise<Specification[]> {
    return this.adapter.normalizeSpecifications(specs);
  }
  
  // Change the adapter at runtime (useful for testing or switching between mock and real implementations)
  setAdapter(adapter: ProductDataAdapter) {
    this.adapter = adapter;
  }
  
  // Check if the scraper is initialized
  isScraperAvailable(): boolean {
    return scraperService.isAvailable();
  }
  
  // Force switch to real scraper
  useRealScraper(): boolean {
    console.log('Attempting to use real scraper...');
    
    // Set scraper as available
    scraperService.setAvailable(true);
    
    // Switch to Amazon adapter if available
    if (this.amazonAdapter) {
      console.log('Switching to Amazon adapter');
      this.adapter = this.amazonAdapter;
    } else {
      // Create a new Amazon adapter
      console.log('Creating new Amazon adapter');
      this.amazonAdapter = new AmazonAdapter();
      this.adapter = this.amazonAdapter;
    }
    
    console.log('Scraper availability after switch:', scraperService.isAvailable());
    return scraperService.isAvailable();
  }
  
  // Switch to mock adapter
  useMockAdapter(): boolean {
    console.log('Switching to mock adapter...');
    this.adapter = new MockAdapter();
    scraperService.setAvailable(false);
    return true;
  }
}

// Create a singleton instance with the mock adapter for now
export const extractionService = new ExtractionService(new MockAdapter());