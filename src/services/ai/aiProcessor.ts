import { Product, Specification } from '../../types';
import { SpecificationComparison } from '../../types/specifications';
import { differenceExplainer } from '../comparison/differenceExplainer';

export interface AIProcessingRequest {
  taskType: 'extraction' | 'normalization' | 'comparison' | 'explanation';
  content: string;
  context?: Record<string, any>;
  priority: 'high' | 'medium' | 'low';
}

export interface AIProcessingResult {
  taskId: string;
  result: any;
  confidence: number;
  processingTime: number;
  modelUsed: string;
  tokenUsage?: { prompt: number; completion: number; total: number };
}

// Cache for AI processing results
interface CacheEntry {
  result: AIProcessingResult;
  timestamp: number;
}

export class AIProcessor {
  private cache: Map<string, CacheEntry> = new Map();
  private taskQueue: Map<string, Promise<AIProcessingResult>> = new Map();
  private processingTasks: Set<string> = new Set();
  private maxConcurrentTasks: number = 3;
  
  constructor() {
    // Load cache from localStorage if available
    this.loadCacheFromStorage();
    
    // Set up periodic cache cleanup
    setInterval(() => this.cleanupCache(24), 3600000); // Clean up every hour
  }
  
  // Queue a task for processing
  async queueTask(request: AIProcessingRequest): Promise<string> {
    // Generate a task ID
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Check if a similar task has been processed before
    const cachedTaskId = await this.findSimilarProcessedTask(request);
    if (cachedTaskId) {
      return cachedTaskId;
    }
    
    // Create a promise for this task
    const taskPromise = this.processTask(taskId, request);
    
    // Add to queue
    this.taskQueue.set(taskId, taskPromise);
    
    // Try to process immediately if possible
    this.tryProcessNextTasks();
    
    return taskId;
  }
  
  // Get results for a specific task
  async getTaskResult(taskId: string): Promise<AIProcessingResult | null> {
    // Check if task is in cache
    const cachedEntry = this.cache.get(taskId);
    if (cachedEntry) {
      return cachedEntry.result;
    }
    
    // Check if task is in queue
    const taskPromise = this.taskQueue.get(taskId);
    if (taskPromise) {
      try {
        return await taskPromise;
      } catch (error) {
        console.error(`Error processing task ${taskId}:`, error);
        return null;
      }
    }
    
    return null;
  }
  
  // Check if a similar task has been processed before
  async findSimilarProcessedTask(request: AIProcessingRequest): Promise<string | null> {
    // Generate a hash for the request
    const requestHash = this.generateRequestHash(request);
    
    // Check if we have a cached result for this hash
    for (const [taskId, entry] of this.cache.entries()) {
      const entryHash = this.generateRequestHash({
        taskType: request.taskType,
        content: entry.result.result.originalContent || '',
        context: entry.result.result.context || {},
        priority: 'medium'
      });
      
      if (entryHash === requestHash) {
        return taskId;
      }
    }
    
    return null;
  }
  
  // Process a batch of tasks together
  async processBatch(requests: AIProcessingRequest[]): Promise<Map<string, AIProcessingResult>> {
    const results = new Map<string, AIProcessingResult>();
    const taskIds: string[] = [];
    
    // Queue all tasks
    for (const request of requests) {
      const taskId = await this.queueTask(request);
      taskIds.push(taskId);
    }
    
    // Wait for all tasks to complete
    await Promise.all(taskIds.map(async (taskId) => {
      const result = await this.getTaskResult(taskId);
      if (result) {
        results.set(taskId, result);
      }
    }));
    
    return results;
  }
  
  // Extract specifications from product description
  async extractSpecifications(productDescription: string, category: string): Promise<Specification[]> {
    // In a real implementation, this would call an AI model
    // For now, we'll use a mock implementation
    
    const taskId = await this.queueTask({
      taskType: 'extraction',
      content: productDescription,
      context: { category },
      priority: 'high'
    });
    
    const result = await this.getTaskResult(taskId);
    
    if (result) {
      return result.result.specifications || [];
    }
    
    return [];
  }
  
  // Generate comparison insights
  async generateComparisonInsights(
    productSpecs: Record<string, Specification[]>
  ): Promise<Record<string, string[]>> {
    // In a real implementation, this would call an AI model
    // For now, we'll use the differenceExplainer
    
    const insights: Record<string, string[]> = {};
    const productIds = Object.keys(productSpecs);
    
    if (productIds.length < 2) {
      return insights;
    }
    
    // Get all unique specification names
    const allSpecNames = new Set<string>();
    for (const specs of Object.values(productSpecs)) {
      specs.forEach(spec => allSpecNames.add(spec.name));
    }
    
    // Generate insights for each specification
    for (const specName of allSpecNames) {
      const values = productIds.map(id => {
        const spec = productSpecs[id].find(s => s.name === specName);
        return spec ? spec.value : null;
      }).filter(v => v !== null);
      
      if (values.length >= 2) {
        const explanation = differenceExplainer.explainDifference(specName, values, 'electronics');
        const impact = differenceExplainer.explainImpact(specName, 0.7, 'electronics');
        
        insights[specName] = [explanation, impact];
      }
    }
    
    return insights;
  }
  
  // Explain specification significance
  async explainSpecificationDifference(
    specName: string,
    values: any[],
    productCategory: string
  ): Promise<string> {
    // In a real implementation, this would call an AI model
    // For now, we'll use the differenceExplainer
    
    return differenceExplainer.explainDifference(specName, values, productCategory);
  }
  
  // Private methods
  
  // Process a single task
  private async processTask(taskId: string, request: AIProcessingRequest): Promise<AIProcessingResult> {
    // Wait until this task is allowed to process
    await new Promise<void>(resolve => {
      const checkAndResolve = () => {
        if (this.processingTasks.size < this.maxConcurrentTasks) {
          this.processingTasks.add(taskId);
          resolve();
        } else {
          setTimeout(checkAndResolve, 100);
        }
      };
      checkAndResolve();
    });
    
    try {
      // Record start time
      const startTime = Date.now();
      
      // Process the task based on its type
      let result: any;
      let confidence = 0.8; // Default confidence
      
      switch (request.taskType) {
        case 'extraction':
          result = await this.mockExtraction(request.content, request.context);
          break;
        case 'normalization':
          result = await this.mockNormalization(request.content, request.context);
          break;
        case 'comparison':
          result = await this.mockComparison(request.content, request.context);
          break;
        case 'explanation':
          result = await this.mockExplanation(request.content, request.context);
          break;
        default:
          throw new Error(`Unknown task type: ${request.taskType}`);
      }
      
      // Calculate processing time
      const processingTime = Date.now() - startTime;
      
      // Create result
      const aiResult: AIProcessingResult = {
        taskId,
        result,
        confidence,
        processingTime,
        modelUsed: 'mock-model',
        tokenUsage: {
          prompt: 0,
          completion: 0,
          total: 0
        }
      };
      
      // Cache the result
      this.cache.set(taskId, {
        result: aiResult,
        timestamp: Date.now()
      });
      
      // Save cache to localStorage
      this.saveCacheToStorage();
      
      return aiResult;
    } finally {
      // Remove from processing tasks
      this.processingTasks.delete(taskId);
      this.taskQueue.delete(taskId);
      
      // Try to process next tasks
      this.tryProcessNextTasks();
    }
  }
  
  // Try to process next tasks in queue
  private tryProcessNextTasks() {
    if (this.processingTasks.size >= this.maxConcurrentTasks) {
      return;
    }
    
    // Get tasks that aren't being processed yet
    const pendingTasks = Array.from(this.taskQueue.entries())
      .filter(([taskId]) => !this.processingTasks.has(taskId));
    
    // Sort by priority (not implemented in this mock version)
    
    // Start processing up to the limit
    const availableSlots = this.maxConcurrentTasks - this.processingTasks.size;
    pendingTasks.slice(0, availableSlots).forEach(([taskId]) => {
      this.processingTasks.add(taskId);
    });
  }
  
  // Generate a hash for a request to use as cache key
  private generateRequestHash(request: AIProcessingRequest): string {
    // Simple hash function for demo purposes
    return `${request.taskType}_${request.content.substring(0, 50)}`;
  }
  
  // Clear outdated cache entries
  private async cleanupCache(maxAgeHours: number): Promise<number> {
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    let removedCount = 0;
    
    for (const [taskId, entry] of this.cache.entries()) {
      if (now - entry.timestamp > maxAgeMs) {
        this.cache.delete(taskId);
        removedCount++;
      }
    }
    
    // Save updated cache to localStorage
    if (removedCount > 0) {
      this.saveCacheToStorage();
    }
    
    return removedCount;
  }
  
  // Save cache to localStorage
  private saveCacheToStorage() {
    try {
      // Convert cache to a serializable format
      const serializedCache: Record<string, { result: AIProcessingResult; timestamp: number }> = {};
      
      for (const [taskId, entry] of this.cache.entries()) {
        serializedCache[taskId] = {
          result: entry.result,
          timestamp: entry.timestamp
        };
      }
      
      localStorage.setItem('aiProcessorCache', JSON.stringify(serializedCache));
    } catch (error) {
      console.error('Error saving AI processor cache to localStorage:', error);
    }
  }
  
  // Load cache from localStorage
  private loadCacheFromStorage() {
    try {
      const serializedCache = localStorage.getItem('aiProcessorCache');
      
      if (serializedCache) {
        const parsed = JSON.parse(serializedCache);
        
        for (const [taskId, entry] of Object.entries(parsed)) {
          this.cache.set(taskId, entry as CacheEntry);
        }
      }
    } catch (error) {
      console.error('Error loading AI processor cache from localStorage:', error);
    }
  }
  
  // Mock implementations for different task types
  
  private async mockExtraction(content: string, context?: Record<string, any>): Promise<any> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Extract some mock specifications
    const specifications: Specification[] = [];
    
    // Look for processor information
    const processorMatch = content.match(/(Intel Core i\d-\d+|AMD Ryzen \d \d+|Apple M\d(?: Pro| Max)?)/i);
    if (processorMatch) {
      specifications.push({
        id: 'processor',
        name: 'Processor',
        value: processorMatch[0],
        category: 'technical',
        confidenceScore: 0.9,
        source: 'ai_extraction'
      });
    }
    
    // Look for RAM information
    const ramMatch = content.match(/(\d+)\s*GB\s*(?:RAM|Memory)/i);
    if (ramMatch) {
      specifications.push({
        id: 'ram',
        name: 'RAM',
        value: `${ramMatch[1]}GB`,
        category: 'technical',
        confidenceScore: 0.9,
        normalizedValue: parseInt(ramMatch[1]) * 1024, // Convert to MB
        source: 'ai_extraction'
      });
    }
    
    // Look for storage information
    const storageMatch = content.match(/(\d+)\s*(GB|TB)\s*(?:SSD|HDD|Storage)/i);
    if (storageMatch) {
      const value = parseInt(storageMatch[1]);
      const unit = storageMatch[2];
      const normalizedValue = unit.toLowerCase() === 'tb' ? value * 1024 : value; // Convert to GB
      
      specifications.push({
        id: 'storage',
        name: 'Storage',
        value: `${storageMatch[1]}${storageMatch[2]} ${storageMatch[3] || 'Storage'}`,
        category: 'technical',
        confidenceScore: 0.9,
        normalizedValue, // In GB
        source: 'ai_extraction'
      });
    }
    
    return {
      specifications,
      originalContent: content,
      context
    };
  }
  
  private async mockNormalization(content: string, context?: Record<string, any>): Promise<any> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Parse the content as a specification
    try {
      const spec = JSON.parse(content);
      
      // Apply some normalization based on the spec type
      if (spec.name.toLowerCase().includes('storage')) {
        // Normalize storage values
        const match = spec.value.match(/(\d+)\s*(GB|TB|MB)/i);
        if (match) {
          const value = parseInt(match[1]);
          const unit = match[2].toLowerCase();
          
          let normalizedValue = value;
          if (unit === 'tb') {
            normalizedValue = value * 1024; // Convert to GB
          } else if (unit === 'mb') {
            normalizedValue = value / 1024; // Convert to GB
          }
          
          return {
            ...spec,
            normalizedValue,
            unit: 'GB',
            originalContent: content,
            context
          };
        }
      }
      
      return {
        ...spec,
        originalContent: content,
        context
      };
    } catch (error) {
      return {
        error: 'Failed to parse specification',
        originalContent: content,
        context
      };
    }
  }
  
  private async mockComparison(content: string, context?: Record<string, any>): Promise<any> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 700));
    
    // Parse the content as a list of products
    try {
      const products = JSON.parse(content) as Product[];
      
      if (products.length < 2) {
        return {
          error: 'Need at least two products to compare',
          originalContent: content,
          context
        };
      }
      
      // Generate mock comparison insights
      const insights: Record<string, string> = {};
      
      // Compare processors
      const processors = products.map(p => {
        const processorSpec = p.specifications.find(s => 
          s.name.toLowerCase().includes('processor') || s.name.toLowerCase().includes('cpu')
        );
        return processorSpec ? processorSpec.value : null;
      }).filter(Boolean);
      
      if (processors.length >= 2) {
        insights.processor = differenceExplainer.explainProcessorDifference(processors);
      }
      
      // Compare RAM
      const ramValues = products.map(p => {
        const ramSpec = p.specifications.find(s => 
          s.name.toLowerCase().includes('ram') || s.name.toLowerCase().includes('memory')
        );
        return ramSpec ? ramSpec.value : null;
      }).filter(Boolean);
      
      if (ramValues.length >= 2) {
        insights.ram = differenceExplainer.explainMemoryDifference(ramValues);
      }
      
      return {
        insights,
        originalContent: content,
        context
      };
    } catch (error) {
      return {
        error: 'Failed to parse products',
        originalContent: content,
        context
      };
    }
  }
  
  private async mockExplanation(content: string, context?: Record<string, any>): Promise<any> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Generate a mock explanation
    let explanation = '';
    
    if (content.toLowerCase().includes('processor') || content.toLowerCase().includes('cpu')) {
      explanation = 'The processor (CPU) is the brain of the computer. A faster processor with more cores will generally provide better performance, especially for demanding tasks like video editing, gaming, or running multiple applications simultaneously.';
    } else if (content.toLowerCase().includes('ram') || content.toLowerCase().includes('memory')) {
      explanation = 'RAM (Random Access Memory) is used to temporarily store data that the CPU needs to access quickly. More RAM allows the computer to handle more applications and larger files simultaneously without slowing down.';
    } else if (content.toLowerCase().includes('storage') || content.toLowerCase().includes('ssd') || content.toLowerCase().includes('hdd')) {
      explanation = 'Storage (SSD or HDD) is where all your files, applications, and the operating system are stored. SSDs are much faster than HDDs, providing quicker boot times and application loading. More storage capacity means you can store more files, photos, videos, and applications.';
    } else {
      explanation = `${content} is an important specification that can affect the overall performance and user experience of the product.`;
    }
    
    return {
      explanation,
      originalContent: content,
      context
    };
  }
}

// Create a singleton instance
export const aiProcessor = new AIProcessor();