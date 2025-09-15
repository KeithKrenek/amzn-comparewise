import { AIProcessingResult } from './aiProcessor';

export class AICacheService {
  private cache: Map<string, { result: AIProcessingResult; timestamp: number }> = new Map();
  
  constructor() {
    // Load cache from localStorage on initialization
    this.loadCache();
    
    // Set up periodic cache cleanup
    setInterval(() => this.cleanupCache(24), 3600000); // Clean up every hour
  }
  
  // Store AI processing result
  async storeResult(requestHash: string, result: AIProcessingResult): Promise<void> {
    this.cache.set(requestHash, {
      result,
      timestamp: Date.now()
    });
    
    // Save to localStorage
    this.saveCache();
  }
  
  // Retrieve cached result if available
  async getCachedResult(requestHash: string): Promise<AIProcessingResult | null> {
    const cached = this.cache.get(requestHash);
    
    if (cached) {
      return cached.result;
    }
    
    return null;
  }
  
  // Generate a hash for a request to use as cache key
  generateRequestHash(request: any): string {
    // In a real implementation, this would use a proper hashing function
    // For simplicity, we'll just stringify and truncate
    try {
      const str = JSON.stringify(request);
      return str.substring(0, 100); // Truncate to avoid excessively long keys
    } catch (error) {
      console.error('Error generating request hash:', error);
      return `error_${Date.now()}`;
    }
  }
  
  // Clear outdated cache entries
  async cleanupCache(maxAgeHours: number): Promise<number> {
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    let removedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > maxAgeMs) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    // Save updated cache
    if (removedCount > 0) {
      this.saveCache();
    }
    
    return removedCount;
  }
  
  // Private methods for persistence
  
  private saveCache(): void {
    try {
      // Convert Map to object for serialization
      const serializable: Record<string, { result: AIProcessingResult; timestamp: number }> = {};
      
      for (const [key, value] of this.cache.entries()) {
        serializable[key] = value;
      }
      
      localStorage.setItem('aiCache', JSON.stringify(serializable));
    } catch (error) {
      console.error('Error saving AI cache to localStorage:', error);
    }
  }
  
  private loadCache(): void {
    try {
      const cached = localStorage.getItem('aiCache');
      
      if (cached) {
        const parsed = JSON.parse(cached);
        
        for (const [key, value] of Object.entries(parsed)) {
          this.cache.set(key, value as { result: AIProcessingResult; timestamp: number });
        }
      }
    } catch (error) {
      console.error('Error loading AI cache from localStorage:', error);
    }
  }
}

// Create a singleton instance
export const aiCache = new AICacheService();