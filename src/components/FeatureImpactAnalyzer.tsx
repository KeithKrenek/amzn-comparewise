import React, { useState } from 'react';
import { Product } from '../types';
import { SpecificationComparison } from '../types/specifications';
import { differenceExplainer } from '../services/comparison/differenceExplainer';
import { AlertTriangle, ThumbsUp, ThumbsDown, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { SpecificationExplainer } from './SpecificationExplainer';

interface FeatureImpactAnalyzerProps {
  comparisonResults: SpecificationComparison[];
  products: Product[];
  userPreferences?: Record<string, number>;
}

export const FeatureImpactAnalyzer: React.FC<FeatureImpactAnalyzerProps> = ({
  comparisonResults,
  products,
  userPreferences = {}
}) => {
  const [expandedSpecs, setExpandedSpecs] = useState<Set<string>>(new Set());
  
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
  
  // Get significance level class
  const getSignificanceClass = (significance: number): string => {
    if (significance >= 0.7) return 'text-red-400';
    if (significance >= 0.5) return 'text-yellow-400';
    return 'text-blue-400';
  };
  
  // Get significance icon
  const getSignificanceIcon = (significance: number) => {
    if (significance >= 0.7) return <AlertTriangle size={16} className="text-red-400" />;
    if (significance >= 0.5) return <ThumbsUp size={16} className="text-yellow-400" />;
    return <HelpCircle size={16} className="text-blue-400" />;
  };
  
  // Generate recommendation
  const recommendation = differenceExplainer.generateRecommendation(
    comparisonResults.filter(r => r.differenceSignificance >= 0.5),
    userPreferences
  );
  
  if (comparisonResults.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        <p>No significant differences found between the selected products.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Recommendation</h3>
        <p className="text-gray-300 whitespace-pre-line">{recommendation}</p>
      </div>
      
      <h3 className="text-lg font-semibold">Feature Impact Analysis</h3>
      
      <div className="space-y-4">
        {comparisonResults
          .sort((a, b) => b.differenceSignificance - a.differenceSignificance)
          .map(comparison => (
            <div 
              key={comparison.specId}
              className="border border-gray-700 rounded-lg overflow-hidden"
            >
              <div 
                className="p-3 flex justify-between items-center cursor-pointer bg-gray-750"
                onClick={() => toggleExpanded(comparison.specId)}
              >
                <div className="flex items-center">
                  {getSignificanceIcon(comparison.differenceSignificance)}
                  <h4 className="font-medium ml-2">{comparison.name}</h4>
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getSignificanceClass(comparison.differenceSignificance)} bg-opacity-20 border border-current`}>
                    {comparison.differenceSignificance >= 0.7 ? 'Critical' : 
                     comparison.differenceSignificance >= 0.5 ? 'Important' : 'Notable'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-16 h-2 bg-gray-600 rounded-full overflow-hidden"
                    title={`Impact: ${Math.round(comparison.differenceSignificance * 100)}%`}
                  >
                    <div 
                      className={`h-full ${comparison.differenceSignificance >= 0.7 ? 'bg-red-500' : 
                                          comparison.differenceSignificance >= 0.5 ? 'bg-yellow-500' : 
                                          'bg-blue-500'}`}
                      style={{ width: `${comparison.differenceSignificance * 100}%` }}
                    ></div>
                  </div>
                  {expandedSpecs.has(comparison.specId) ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </div>
              </div>
              
              {expandedSpecs.has(comparison.specId) && (
                <div className="p-4 border-t border-gray-700">
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-400 mb-2">What this means:</h5>
                    <p className="text-gray-300">
                      {differenceExplainer.explainDifference(
                        comparison.name,
                        comparison.differences.map(d => d.value),
                        'electronics'
                      )}
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-400 mb-2">Real-world impact:</h5>
                    <p className="text-gray-300">
                      {differenceExplainer.explainImpact(
                        comparison.name,
                        comparison.differenceSignificance,
                        'electronics'
                      )}
                    </p>
                  </div>
                  
                  <div className="mt-4">
                    <SpecificationExplainer 
                      specName={comparison.name}
                      specValue={comparison.differences[0]?.value || ''}
                    />
                  </div>
                  
                  <table className="w-full mt-4">
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
                            <td className={`py-2 pl-4 ${diff.isBest ? 'text-green-400 font-medium' : ''}`}>
                              {diff.value}
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
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};