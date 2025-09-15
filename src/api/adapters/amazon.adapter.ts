import { ProductDataAdapter } from './adapter.interface';
import { Product, SearchQuery, Specification } from '../../types';
import AISpecificationNormalizer from '../../services/normalization/AISpecificationNormalizer';
import { scraperManager } from '../../services/scraping/scraperManager';

export class AmazonAdapter implements ProductDataAdapter {
  private cachedProducts: Map<string, Product> = new Map();
  private cachedSearches: Map<string, Product[]> = new Map();
  
  constructor() {
    console.log('AmazonAdapter initialized');
  }
  
  // Generate a cache key for search queries
  private getSearchCacheKey(query: SearchQuery): string {
    return `${query.keyword || ''}_${query.category || ''}_${query.page || 1}_${query.limit || 10}_${JSON.stringify(query.sort || {})}`;
  }
  
  // Search for products
  async searchProducts(query: SearchQuery): Promise<Product[]> {
    try {
      // Check cache first
      const cacheKey = this.getSearchCacheKey(query);
      if (this.cachedSearches.has(cacheKey)) {
        console.log('Returning cached search results');
        return this.cachedSearches.get(cacheKey) || [];
      }
      
      // Use the scraperManager to get products
      console.log('Fetching products from scraperManager');
      const products = await scraperManager.searchProducts(query);

      // Normalize specifications for each product
      for (const product of products) {
        if (product.specifications && product.specifications.length > 0) {
          const normalizedSpecs = await AISpecificationNormalizer.normalizeSpecifications(
            product.specifications
          );
          product.specifications = normalizedSpecs;
        }
        this.cachedProducts.set(product.id, product);
      }
      
      // Cache the results
      this.cachedSearches.set(cacheKey, products);
      
      return products;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }
  
  // Get product details
  async getProductDetails(productId: string): Promise<Product | null> {
    try {
      // Check cache first
      if (this.cachedProducts.has(productId)) {
        const cachedProduct = this.cachedProducts.get(productId);
        
        // If the cached product has specifications, return it
        if (cachedProduct && cachedProduct.specifications && cachedProduct.specifications.length > 0) {
          console.log('Returning cached product details');
          return cachedProduct;
        }
      }
      
      // Use scraperManager to get product details
      console.log('Fetching product details from scraperManager');
      const product = await scraperManager.getProductDetails(productId);
      
      if (product) {
        if (product.specifications && product.specifications.length > 0) {
          const normalizedSpecs = await AISpecificationNormalizer.normalizeSpecifications(
            product.specifications
          );
          product.specifications = normalizedSpecs;
        }
        this.cachedProducts.set(productId, product);
        return product;
      }
      return null;
    } catch (error) {
      console.error(`Error getting product details for ${productId}:`, error);
      throw error;
    }
  }
  
  // Get related products
  async getRelatedProducts(productId: string): Promise<Product[]> {
    try {
      // Use scraperManager to get related products
      console.log('Fetching related products from scraperManager');
      const products = await scraperManager.getRelatedProducts(productId);
      
      for (const product of products) {
        if (product.specifications && product.specifications.length > 0) {
          const normalizedSpecs = await AISpecificationNormalizer.normalizeSpecifications(
            product.specifications
          );
          product.specifications = normalizedSpecs;
        }
        this.cachedProducts.set(product.id, product);
      }
      
      return products;
    } catch (error) {
      console.error(`Error getting related products for ${productId}:`, error);
      throw error;
    }
  }
  
  // Extract specifications from a product
  async extractSpecifications(productId: string): Promise<Specification[]> {
    try {
      // Get product details to extract specifications
      const product = await this.getProductDetails(productId);
      
      if (!product) {
        return [];
      }
      
      const rawSpecs = product.specifications.map(spec => ({
        ...spec,
        confidenceScore: Math.min(spec.confidenceScore + 0.1, 1.0),
        source: 'ai_enhanced'
      }));
      
      const normalizedSpecs = await AISpecificationNormalizer.normalizeSpecifications(rawSpecs);
      return normalizedSpecs;
    } catch (error) {
      console.error(`Error extracting specifications for ${productId}:`, error);
      throw error;
    }
  }
  
  // Normalize specifications
  async normalizeSpecifications(specs: Specification[]): Promise<Specification[]> {
    try {
      const normalizedSpecs = await AISpecificationNormalizer.normalizeSpecifications(specs);
      return normalizedSpecs;
    } catch (error) {
      console.error('Error normalizing specifications:', error);
      return specs;
    }
  }
}