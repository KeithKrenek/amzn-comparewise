import { ProductDataAdapter } from './adapter.interface';
import { Product, SearchQuery, Specification } from '../../types';
import { mockProducts } from '../../data/mockProducts';
import AISpecificationNormalizer from '../../services/normalization/AISpecificationNormalizer';

export class MockAdapter implements ProductDataAdapter {
  private products: Product[] = mockProducts;
  
  // Simulate search with delay
  async searchProducts(query: SearchQuery): Promise<Product[]> {
    return new Promise((resolve) => {
      setTimeout(async () => {
        let results = [...this.products];
        
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
        
        // Filter by category
        if (query.category) {
          results = results.filter(product => 
            product.specifications.some(spec => 
              spec.category === query.category
            )
          );
        }
        
        // Apply sorting
        if (query.sort) {
          results = this.sortProducts(results, query.sort);
        }
        
        // Apply pagination
        if (query.page && query.limit) {
          const start = (query.page - 1) * query.limit;
          const end = start + query.limit;
          results = results.slice(start, end);
        }
        
        // Normalize specifications for each product
        for (const product of results) {
          if (product.specifications && product.specifications.length > 0) {
            try {
              const normalizedSpecs = await AISpecificationNormalizer.normalizeSpecifications(
                product.specifications
              );
              product.specifications = normalizedSpecs;
            } catch (error) {
              console.error('Error normalizing specifications:', error);
            }
          }
        }
        
        resolve(results);
      }, 800); // Simulate network delay
    });
  }
  
  // Simulate getting product details with delay
  async getProductDetails(productId: string): Promise<Product | null> {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const product = this.products.find(p => p.id === productId) || null;
        if (product && product.specifications && product.specifications.length > 0) {
          try {
            const normalizedSpecs = await AISpecificationNormalizer.normalizeSpecifications(
              product.specifications
            );
            product.specifications = normalizedSpecs;
          } catch (error) {
            console.error('Error normalizing specifications:', error);
          }
        }
        resolve(product);
      }, 500);
    });
  }
  
  // Simulate getting related products
  async getRelatedProducts(productId: string): Promise<Product[]> {
    return new Promise((resolve) => {
      setTimeout(async () => {
        // Get current product
        const currentProduct = this.products.find(p => p.id === productId);
        
        if (!currentProduct) {
          resolve([]);
          return;
        }
        
        // Find products with similar specifications
        const relatedProducts = this.products
          .filter(p => p.id !== productId) // Exclude current product
          .filter(p => p.brand === currentProduct.brand || // Same brand
                      // Or similar price range
                      Math.abs(p.price.current - currentProduct.price.current) < 300)
          .slice(0, 4); // Limit to 4 related products
        
        for (const product of relatedProducts) {
          if (product.specifications && product.specifications.length > 0) {
            try {
              const normalizedSpecs = await AISpecificationNormalizer.normalizeSpecifications(
                product.specifications
              );
              product.specifications = normalizedSpecs;
            } catch (error) {
              console.error('Error normalizing specifications:', error);
            }
          }
        }
        
        resolve(relatedProducts);
      }, 600);
    });
  }
  
  // Simulate extracting specifications from a product
  async extractSpecifications(productId: string): Promise<Specification[]> {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const product = this.products.find(p => p.id === productId);
        if (!product) {
          resolve([]);
          return;
        }
        
        // Simulate AI-enhanced specification extraction
        const enhancedSpecs = product.specifications.map(spec => ({
          ...spec,
          confidenceScore: Math.min(spec.confidenceScore + 0.1, 1.0),
          source: spec.source || 'ai_enhanced'
        }));
        
        try {
          const normalizedSpecs = await AISpecificationNormalizer.normalizeSpecifications(
            enhancedSpecs
          );
          resolve(normalizedSpecs);
        } catch (error) {
          console.error('Error normalizing specifications:', error);
          resolve(enhancedSpecs);
        }
      }, 1000);
    });
  }
  
  // Simulate normalizing specifications
  async normalizeSpecifications(specs: Specification[]): Promise<Specification[]> {
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          const normalizedSpecs = await AISpecificationNormalizer.normalizeSpecifications(
            specs
          );
          resolve(normalizedSpecs);
        } catch (error) {
          console.error('Error normalizing specifications:', error);
          resolve(specs);
        }
      }, 500);
    });
  }
  
  // Helper method to sort products
  private sortProducts(products: Product[], sort: SearchQuery['sort']): Product[] {
    if (!sort) return products;
    
    return [...products].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      // Extract values based on sort field
      switch (sort.columnId) {
        case 'price':
          aValue = a.price.current;
          bValue = b.price.current;
          break;
        case 'rating':
          aValue = a.rating?.value || 0;
          bValue = b.rating?.value || 0;
          break;
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'brand':
          aValue = a.brand;
          bValue = b.brand;
          break;
        default:
          // Try to find in specifications
          const aSpec = a.specifications.find(s => s.name.toLowerCase() === sort.columnId.toLowerCase());
          const bSpec = b.specifications.find(s => s.name.toLowerCase() === sort.columnId.toLowerCase());
          
          aValue = aSpec?.normalizedValue || aSpec?.value || '';
          bValue = bSpec?.normalizedValue || bSpec?.value || '';
      }
      
      // Compare values based on direction
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sort.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // String comparison
      const aStr = String(aValue);
      const bStr = String(bValue);
      
      return sort.direction === 'asc' 
        ? aStr.localeCompare(bStr) 
        : bStr.localeCompare(aStr);
    });
  }
}