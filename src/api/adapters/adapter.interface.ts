import { Product, SearchQuery, Specification } from '../../types';

export interface ProductDataAdapter {
  searchProducts(query: SearchQuery): Promise<Product[]>;
  getProductDetails(productId: string): Promise<Product | null>;
  getRelatedProducts(productId: string): Promise<Product[]>;
  extractSpecifications(productId: string): Promise<Specification[]>;
  normalizeSpecifications(specs: Specification[]): Promise<Specification[]>;
}