import React, { useState } from 'react';
import { Product } from '../../types';
import { SpecificationComparison } from '../../types/specifications';
import { differenceExplainer } from '../../services/comparison/differenceExplainer';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export interface DifferenceVisualizerProps {
  comparisonResults: SpecificationComparison[];
  products: Product[];
  maxDifferences?: number;
  showExplanations?: boolean;
  highlightThreshold?: number;
  onSpecificationClick?: (specId: string) => void;
}

export const DifferenceVisualizer: React.FC<DifferenceVisualizerProps> = ({
  comparisonResults,
  products,
  maxDifferences = 10,
  showExplanations = true,
  highlightThreshold = 0.5,
  onSpecificationClick
}) => {
  const [expandedSpecs, setExpandedSpecs] = useState<Set<string>>(new Set());
  const [showAllDifferences, setShowAllDifferences] = useState(false);
  
  // Sort comparison results by significance
  const sortedResults = [...comparisonResults].sort(
    (a, b) => b.differenceSignificance - a.differenceSignificance
  );
  
  // Limit the number of differences shown
  const displayedResults = showAllDifferences 
    ? sortedResults 
    : sortedResults.slice(0, maxDifferences);
  
  // Toggle expanded state for a specification
  const toggleExpanded = (specId: string) => {
    setExpandedSpecs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(specId)) {
        newSet.delete(specId);
      } else {
        newSet.add(specId);
      }
      return newSet;
    });
  };
  
  // Handle specification click
  const handleSpecClick = (specId: string) => {
    if (onSpecificationClick) {
      onSpecificationClick(specId);
    }
  };
  
  // Format value for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') {
      if ('originalString' in value) return value.originalString;
      return JSON.stringify(value);
    }
    return String(value);
  };
  
  // Get color class based on significance
  const getSignificanceColorClass = (significance: number): string => {
    if (significance >= 0.8) return 'bg-red-900 bg-opacity-20';
    if (significance >= 0.5) return 'bg-orange-900 bg-opacity-20';
    if (significance >= 0.3) return 'bg-yellow-900 bg-opacity-20';
    return 'bg-blue-900 bg-opacity-10';
  };
  
  // Get color class for best value
  const getBestValueColorClass = (isBest: boolean | undefined): string => {
    return isBest ? 'text-green-400 font-medium' : '';
  };
  
  if (comparisonResults.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        No significant differences found between the selected products.
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-2">Key Differences</h3>
      
      <div className="space-y-2">
        {displayedResults.map(comparison => (
          <div 
            key={comparison.specId}
            className={`border border-gray-700 rounded-lg overflow-hidden ${
              comparison.differenceSignificance >= highlightThreshold 
                ? getSignificanceColorClass(comparison.differenceSignificance) 
                : ''
            }`}
          >
            <div 
              className="p-3 flex justify-between items-center cursor-pointer"
              onClick={() => toggleExpanded(comparison.specId)}
            >
              <div className="flex items-center">
                <h4 className="font-medium">{comparison.name}</h4>
                {comparison.differenceSignificance >= highlightThreshold && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-700">
                    Significant
                  </span>
                )}
              </div>
              {expandedSpecs.has(comparison.specId) ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </div>
            
            {expandedSpecs.has(comparison.specId) && (
              <div className="p-3 border-t border-gray-700">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-2 text-left font-medium">Product</th>
                      <th className="py-2 text-left font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.differences.map(diff => {
                      const product = products.find(p => p.id === diff.productId);
                      return (
                        <tr key={diff.productId} className="border-b border-gray-700 last:border-0">
                          <td className="py-2 pr-4">
                            {product ? `${product.brand} ${product.title.substring(0, 30)}...` : diff.productId}
                          </td>
                          <td className={`py-2 pl-4 ${getBestValueColorClass(diff.isBest)}`}>
                            {formatValue(diff.value)}
                            {diff.isBest && (
                              <span className="ml-2 text-xs bg-green-900 text-green-200 px-1 py-0.5 rounded">
                                Best
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {showExplanations && (
                  <div className="mt-4 p-3 bg-gray-750 rounded-md">
                    <div className="flex items-start">
                      <HelpCircle size={16} className="mr-2 mt-1 text-blue-400" />
                      <div>
                        <p className="text-sm text-gray-300">
                          {differenceExplainer.explainDifference(
                            comparison.name,
                            comparison.differences.map(d => d.value),
                            'electronics' // Default category
                          )}
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          {differenceExplainer.explainImpact(
                            comparison.name,
                            comparison.differenceSignificance,
                            'electronics' // Default category
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {sortedResults.length > maxDifferences && (
        <button
          onClick={() => setShowAllDifferences(!showAllDifferences)}
          className="w-full py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-md"
        >
          {showAllDifferences 
            ? `Show Top ${maxDifferences} Differences` 
            : `Show All ${sortedResults.length} Differences`}
        </button>
      )}
      
      {showExplanations && (
        <div className="mt-6 p-4 bg-gray-750 rounded-lg">
          <h4 className="font-medium mb-2">Recommendation</h4>
          <p className="text-gray-300">
            {differenceExplainer.generateRecommendation(
              sortedResults.filter(r => r.differenceSignificance >= highlightThreshold)
            )}
          </p>
        </div>
      )}
    </div>
  );
};