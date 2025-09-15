import React, { useState, useEffect } from 'react';
import { Product, Specification } from '../types';
import { X, ChevronDown, ChevronUp, ExternalLink, Star, AlertCircle, Save, BarChart2, LineChart, Zap } from 'lucide-react';
import { useAppDispatch } from '../store/hooks';
import { saveComparison } from '../store/slices/comparison.slice';
import { comparisonEngine } from '../services/comparison/comparisonEngine';
import { DifferenceVisualizer } from './visualization/DifferenceVisualizer';
import { SpecificationComparison } from '../types/specifications';
import { RadarChart } from './visualization/RadarChart';
import { PricePerformanceChart } from './visualization/PricePerformanceChart';
import { productScorer } from '../services/scoring/productScorer';
import { AIEnhancedComparison } from './AIEnhancedComparison';
import { aiService } from '../services/ai/aiService';
import { FeatureImpactAnalyzer } from './FeatureImpactAnalyzer';
import { WhyThisMatters } from './WhyThisMatters';
import { SpecificationExplainer } from './SpecificationExplainer';

interface ComparisonDrawerProps {
  products: Product[];
  onClose: () => void;
  onRemoveProduct: (productId: string) => void;
  onSaveComparison?: () => void;
}

export const ComparisonDrawer: React.FC<ComparisonDrawerProps> = ({ 
  products, 
  onClose,
  onRemoveProduct,
  onSaveComparison
}) => {
  const dispatch = useAppDispatch();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['technical', 'physical'])
  );
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [comparisonName, setComparisonName] = useState('');
  const [viewMode, setViewMode] = useState<'standard' | 'differences' | 'charts' | 'ai' | 'impact'>('standard');
  const [comparisonResults, setComparisonResults] = useState<SpecificationComparison[]>([]);
  const [selectedChart, setSelectedChart] = useState<'radar' | 'price-performance'>('radar');
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);

  // Generate comparison results when products change
  useEffect(() => {
    if (products.length >= 2) {
      const results = comparisonEngine.compareProducts(products);
      setComparisonResults(results);
    } else {
      setComparisonResults([]);
    }
  }, [products]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Group specifications by category
  const getSpecificationsByCategory = () => {
    const categories: Record<string, Set<string>> = {};
    
    // Collect all specification names by category
    products.forEach(product => {
      product.specifications.forEach(spec => {
        if (!categories[spec.category]) {
          categories[spec.category] = new Set();
        }
        categories[spec.category].add(spec.name);
      });
    });
    
    // Convert to sorted array
    return Object.entries(categories).map(([category, specNames]) => ({
      category,
      specifications: Array.from(specNames).sort()
    }));
  };

  const specificationsByCategory = getSpecificationsByCategory();

  // Get specification value for a product
  const getSpecValue = (product: Product, specName: string) => {
    const spec = product.specifications.find(s => s.name === specName);
    return spec ? spec.value : '-';
  };

  // Get specification confidence score
  const getSpecConfidence = (product: Product, specName: string) => {
    const spec = product.specifications.find(s => s.name === specName);
    return spec ? spec.confidenceScore : 0;
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Highlight differences between products
  const shouldHighlight = (specName: string): boolean => {
    const values = new Set();
    products.forEach(product => {
      const spec = product.specifications.find(s => s.name === specName);
      if (spec) {
        values.add(spec.value);
      }
    });
    // Highlight if there are different values
    return values.size > 1;
  };

  // Determine if a spec value is the best among compared products
  const isBestValue = (product: Product, specName: string): boolean => {
    if (products.length < 2) return false;
    
    const spec = product.specifications.find(s => s.name === specName);
    if (!spec) return false;
    
    // Get all values for this spec
    const allSpecs = products
      .map(p => p.specifications.find(s => s.name === specName))
      .filter(Boolean) as Specification[];
    
    if (allSpecs.length < 2) return false;
    
    // Try to determine if higher or lower is better
    const isHigherBetter = comparisonEngine.isHigherValueBetter(specName);
    
    // For numeric values
    if (typeof spec.normalizedValue === 'number') {
      const currentValue = spec.normalizedValue;
      
      if (isHigherBetter) {
        // Check if this is the highest value
        return !allSpecs.some(s => 
          typeof s.normalizedValue === 'number' && s.normalizedValue > currentValue
        );
      } else {
        // Check if this is the lowest value
        return !allSpecs.some(s => 
          typeof s.normalizedValue === 'number' && s.normalizedValue < currentValue
        );
      }
    }
    
    return false;
  };

  // Handle saving comparison
  const handleSaveComparison = () => {
    const name = comparisonName.trim() || `Comparison ${new Date().toLocaleDateString()}`;
    dispatch(saveComparison({ name }));
    setShowSaveDialog(false);
    setComparisonName('');
    
    // Call the parent's save handler if provided
    if (onSaveComparison) {
      onSaveComparison();
    }
  };

  // Performance scorer for radar chart
  const getPerformanceScore = (product: Product) => {
    return productScorer.calculateScore(product);
  };

  // Radar chart dimensions
  const radarDimensions = [
    {
      id: 'processor',
      label: 'Processor',
      valueAccessor: (product: Product) => {
        const spec = product.specifications.find(s => 
          s.name.toLowerCase().includes('processor') || s.name.toLowerCase().includes('cpu')
        );
        return spec ? spec.confidenceScore * 10 : 0;
      },
      betterDirection: 'higher' as const
    },
    {
      id: 'memory',
      label: 'Memory',
      valueAccessor: (product: Product) => {
        const spec = product.specifications.find(s => 
          s.name.toLowerCase().includes('ram') || s.name.toLowerCase().includes('memory')
        );
        if (!spec) return 0;
        
        const match = String(spec.value).match(/(\d+)\s*GB/i);
        return match ? parseInt(match[1]) : 0;
      },
      betterDirection: 'higher' as const
    },
    {
      id: 'storage',
      label: 'Storage',
      valueAccessor: (product: Product) => {
        const spec = product.specifications.find(s => 
          s.name.toLowerCase().includes('storage') || s.name.toLowerCase().includes('ssd') || s.name.toLowerCase().includes('hdd')
        );
        if (!spec) return 0;
        
        const match = String(spec.value).match(/(\d+)\s*(GB|TB)/i);
        if (!match) return 0;
        
        const size = parseInt(match[1]);
        const unit = match[2].toUpperCase();
        
        return unit === 'TB' ? size * 1024 : size; // Convert to GB
      },
      betterDirection: 'higher' as const
    },
    {
      id: 'display',
      label: 'Display',
      valueAccessor: (product: Product) => {
        const spec = product.specifications.find(s => 
          s.name.toLowerCase().includes('display') || s.name.toLowerCase().includes('screen')
        );
        return spec ? spec.confidenceScore * 10 : 0;
      },
      betterDirection: 'higher' as const
    },
    {
      id: 'battery',
      label: 'Battery',
      valueAccessor: (product: Product) => {
        const spec = product.specifications.find(s => 
          s.name.toLowerCase().includes('battery')
        );
        if (!spec) return 0;
        
        const match = String(spec.value).match(/(\d+(?:\.\d+)?)\s*hours?/i);
        return match ? parseFloat(match[1]) : 0;
      },
      betterDirection: 'higher' as const
    },
    {
      id: 'weight',
      label: 'Weight',
      valueAccessor: (product: Product) => {
        const spec = product.specifications.find(s => 
          s.name.toLowerCase().includes('weight')
        );
        if (!spec) return 0;
        
        // Extract weight in pounds
        const match = String(spec.value).match(/(\d+(?:\.\d+)?)\s*(pounds|lbs)/i);
        if (!match) return 0;
        
        return parseFloat(match[1]);
      },
      betterDirection: 'lower' as const
    }
  ];

  // Handle AI recommendation
  const handleAIExplanation = (explanation: string) => {
    setAiRecommendation(explanation);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Product Comparison</h2>
          <div className="flex items-center space-x-2">
            <div className="flex border border-gray-600 rounded-md overflow-hidden">
              <button 
                onClick={() => setViewMode('standard')}
                className={`px-3 py-1 text-sm ${viewMode === 'standard' ? 'bg-gray-600' : 'bg-gray-700 hover:bg-gray-650'}`}
              >
                Standard View
              </button>
              <button 
                onClick={() => setViewMode('differences')}
                className={`px-3 py-1 text-sm ${viewMode === 'differences' ? 'bg-gray-600' : 'bg-gray-700 hover:bg-gray-650'}`}
              >
                Differences
              </button>
              <button 
                onClick={() => setViewMode('charts')}
                className={`px-3 py-1 text-sm ${viewMode === 'charts' ? 'bg-gray-600' : 'bg-gray-700 hover:bg-gray-650'}`}
              >
                Charts
              </button>
              <button 
                onClick={() => setViewMode('impact')}
                className={`px-3 py-1 text-sm flex items-center ${viewMode === 'impact' ? 'bg-gray-600' : 'bg-gray-700 hover:bg-gray-650'}`}
              >
                Impact Analysis
              </button>
              {aiService.isInitialized() && (
                <button 
                  onClick={() => setViewMode('ai')}
                  className={`px-3 py-1 text-sm flex items-center ${viewMode === 'ai' ? 'bg-gray-600' : 'bg-gray-700 hover:bg-gray-650'}`}
                >
                  <Zap size={14} className="mr-1" />
                  AI Analysis
                </button>
              )}
            </div>
            <button 
              onClick={() => setShowSaveDialog(true)}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center"
            >
              <Save size={16} className="mr-1" />
              Save
            </button>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
              <X size={24} />
            </button>
          </div>
        </div>
        
        <div className="overflow-auto flex-grow p-4">
          {viewMode === 'standard' && (
            <div className="min-w-max">
              {/* Product headers */}
              <div className="grid grid-cols-[200px_repeat(auto-fill,minmax(200px,1fr))] border-b border-gray-700">
                <div className="p-4 font-semibold">Product</div>
                {products.map(product => (
                  <div key={product.id} className="p-4 relative">
                    <button 
                      onClick={() => onRemoveProduct(product.id)}
                      className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-700"
                      aria-label="Remove product"
                    >
                      <X size={16} />
                    </button>
                    <div className="h-32 flex justify-center mb-2">
                      <img 
                        src={product.images[0]?.small || 'https://via.placeholder.com/150'} 
                        alt={product.title}
                        className="h-full object-contain"
                      />
                    </div>
                    <h3 className="font-semibold line-clamp-2">{product.title}</h3>
                    <p className="text-sm text-gray-400">{product.brand}</p>
                    <a 
                      href={`https://amazon.com/dp/${product.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-2 text-sm text-blue-400 hover:text-blue-300 flex items-center"
                    >
                      <ExternalLink size={12} className="mr-1" />
                      View on Amazon
                    </a>
                  </div>
                ))}
              </div>
              
              {/* Price row */}
              <div className="grid grid-cols-[200px_repeat(auto-fill,minmax(200px,1fr))] border-b border-gray-700">
                <div className="p-4 font-semibold bg-gray-750">Price</div>
                {products.map(product => {
                  // Check if this is the lowest price
                  const isLowestPrice = products.length > 1 && 
                    !products.some(p => p.price.current < product.price.current);
                  
                  return (
                    <div key={product.id} className="p-4 bg-gray-750">
                      <div className={`font-bold text-lg ${isLowestPrice ? 'text-green-400' : ''}`}>
                        {formatPrice(product.price.current)}
                        {isLowestPrice && products.length > 1 && (
                          <span className="ml-2 text-xs bg-green-900 text-green-200 px-2 py-0.5 rounded">
                            Best Price
                          </span>
                        )}
                      </div>
                      {product.price.original && product.price.original > product.price.current && (
                        <div className="text-sm text-gray-400 line-through">
                          {formatPrice(product.price.original)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Rating row */}
              <div className="grid grid-cols-[200px_repeat(auto-fill,minmax(200px,1fr))] border-b border-gray-700">
                <div className="p-4 font-semibold">Rating</div>
                {products.map(product => {
                  // Check if this is the highest rating
                  const isHighestRating = product.rating && products.length > 1 && 
                    !products.some(p => p.rating && p.rating.value > (product.rating?.value || 0));
                  
                  return (
                    <div key={product.id} className="p-4">
                      {product.rating ? (
                        <div className="flex items-center">
                          <Star className={`w-5 h-5 ${isHighestRating ? 'text-yellow-400' : 'text-yellow-600'} fill-current`} />
                          <span className={`ml-1 ${isHighestRating ? 'text-yellow-400 font-bold' : ''}`}>
                            {product.rating.value.toFixed(1)}
                          </span>
                          <span className="ml-1 text-sm text-gray-400">
                            ({product.rating.count})
                          </span>
                          {isHighestRating && (
                            <span className="ml-2 text-xs bg-yellow-900 text-yellow-200 px-2 py-0.5 rounded">
                              Top Rated
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">No ratings</span>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Specifications by category */}
              {specificationsByCategory.map(({ category, specifications }) => (
                <div key={category} className="border-b border-gray-700">
                  {/* Category header */}
                  <div 
                    className="grid grid-cols-[200px_repeat(auto-fill,minmax(200px,1fr))] bg-gray-700 cursor-pointer"
                    onClick={() => toggleCategory(category)}
                  >
                    <div className="p-4 font-semibold flex items-center justify-between">
                      <span className="capitalize">{category}</span>
                      {expandedCategories.has(category) ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </div>
                    {products.map(product => (
                      <div key={product.id} className="p-4"></div>
                    ))}
                  </div>
                  
                  {/* Specifications */}
                  {expandedCategories.has(category) && specifications.map(specName => {
                    const highlight = shouldHighlight(specName);
                    return (
                      <div 
                        key={specName} 
                        className={`grid grid-cols-[200px_repeat(auto-fill,minmax(200px,1fr))] border-t border-gray-700 ${
                          highlight ? 'bg-blue-900 bg-opacity-20' : ''
                        }`}
                      > <div className="p-4 pl-8 text-gray-300 flex items-center">
                          <span>{specName}</span>
                          {highlight && (
                            <div 
                              className="ml-2 w-2 h-2 rounded-full bg-blue-400"
                              title="Values differ between products"
                            ></div>
                          )}
                          {highlight && (
                            <div className="ml-2">
                              <WhyThisMatters 
                                specName={specName}
                                significance={0.7}
                                category={category}
                              />
                            </div>
                          )}
                        </div>
                        {products.map(product => {
                          const confidence = getSpecConfidence(product, specName);
                          const isBest = isBestValue(product, specName);
                          
                          return (
                            <div key={product.id} className="p-4 flex items-center">
                              <div className={isBest ? 'text-green-400 font-medium' : ''}>
                                {getSpecValue(product, specName)}
                                {isBest && (
                                  <span className="ml-2 text-xs bg-green-900 text-green-200 px-1 py-0.5 rounded">
                                    Best
                                  </span>
                                )}
                              </div>
                              {confidence > 0 && confidence < 0.8 && (
                                <div 
                                  className="ml-2 text-yellow-500"
                                  title={`Confidence: ${Math.round(confidence * 100)}%`}
                                >
                                  <AlertCircle size={14} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
              
              {/* Add specification explainer at the bottom */}
              <div className="mt-6 p-4 bg-gray-750 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Need Help Understanding Specifications?</h3>
                <p className="text-gray-300 mb-4">
                  Click on "What is this?" next to any specification to get a plain-language explanation of what it means and why it matters.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {['Processor', 'RAM', 'Storage', 'Display', 'Battery Life', 'Graphics'].map(spec => (
                    <div key={spec} className="bg-gray-700 p-3 rounded-lg">
                      <h4 className="font-medium mb-2">{spec}</h4>
                      <SpecificationExplainer specName={spec} specValue="" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {viewMode === 'differences' && (
            <DifferenceVisualizer 
              comparisonResults={comparisonResults}
              products={products}
              showExplanations={true}
              highlightThreshold={0.5}
            />
          )}
          
          {viewMode === 'charts' && (
            <div className="space-y-6">
              <div className="flex justify-center space-x-4 mb-4">
                <button
                  onClick={() => setSelectedChart('radar')}
                  className={`px-4 py-2 rounded-md flex items-center ${
                    selectedChart === 'radar' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <BarChart2 size={16} className="mr-2" />
                  Radar Chart
                </button>
                <button
                  onClick={() => setSelectedChart('price-performance')}
                  className={`px-4 py-2 rounded-md flex items-center ${
                    selectedChart === 'price-performance' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <LineChart size={16} className="mr-2" />
                  Price-Performance
                </button>
              </div>
              
              {selectedChart === 'radar' && (
                <div className="bg-gray-750 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-center">Performance Comparison</h3>
                  <RadarChart 
                    products={products}
                    dimensions={radarDimensions}
                    width={600}
                    height={500}
                  />
                </div>
              )}
              
              {selectedChart === 'price-performance' && (
                <div className="bg-gray-750 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-center">Price-Performance Analysis</h3>
                  <PricePerformanceChart 
                    products={products}
                    performanceScorer={getPerformanceScore}
                    width={600}
                    height={500}
                    highlightBest={true}
                  />
                </div>
              )}
            </div>
          )}
          
          {viewMode === 'impact' && (
            <FeatureImpactAnalyzer 
              comparisonResults={comparisonResults}
              products={products}
            />
          )}
          
          {viewMode === 'ai' && (
            <AIEnhancedComparison 
              products={products}
              onExplanationGenerated={handleAIExplanation}
            />
          )}
        </div>
        
        {/* Save comparison dialog */}
        {showSaveDialog && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Save Comparison</h3>
              <div className="mb-4">
                <label htmlFor="comparison-name" className="block text-sm font-medium mb-2">
                  Comparison Name
                </label>
                <input
                  type="text"
                  id="comparison-name"
                  value={comparisonName}
                  onChange={(e) => setComparisonName(e.target.value)}
                  placeholder="My Comparison"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveComparison}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};