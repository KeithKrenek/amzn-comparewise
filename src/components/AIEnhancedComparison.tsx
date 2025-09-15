import React, { useEffect, useState } from 'react';
import { Product, Specification } from '../types';
import { SpecificationComparison } from '../types/specifications';
import { aiService } from '../services/ai/aiService';
import { Loader, AlertCircle, HelpCircle, ThumbsUp, ThumbsDown } from 'lucide-react';

interface AIEnhancedComparisonProps {
  products: Product[];
  onExplanationGenerated?: (explanation: string) => void;
}

export const AIEnhancedComparison: React.FC<AIEnhancedComparisonProps> = ({
  products,
  onExplanationGenerated
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisonResults, setComparisonResults] = useState<SpecificationComparison[]>([]);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [userFeedback, setUserFeedback] = useState<Record<string, 'helpful' | 'unhelpful' | null>>({});
  
  useEffect(() => {
    if (products.length >= 2 && aiService.isInitialized()) {
      generateComparison();
    }
  }, [products]);
  
  const generateComparison = async () => {
    if (products.length < 2) {
      setError('Need at least two products to compare');
      return;
    }
    
    if (!aiService.isInitialized()) {
      setError('AI service is not initialized');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Generate comparison
      const results = await aiService.compareProducts(products);
      setComparisonResults(results);
      
      // Generate recommendation
      const rec = await aiService.generateRecommendation(products);
      setRecommendation(rec);
      
      // Notify parent component
      if (onExplanationGenerated) {
        onExplanationGenerated(rec);
      }
    } catch (error) {
      console.error('Error generating AI-enhanced comparison:', error);
      setError('Failed to generate comparison');
    } finally {
      setLoading(false);
    }
  };
  
  const getExplanation = async (specName: string, specValue: string) => {
    const key = `${specName}:${specValue}`;
    
    if (explanations[key]) {
      return explanations[key];
    }
    
    try {
      const explanation = await aiService.explainSpecification(specName, specValue);
      setExplanations(prev => ({
        ...prev,
        [key]: explanation
      }));
      return explanation;
    } catch (error) {
      console.error(`Error getting explanation for ${specName}:`, error);
      return `Unable to generate explanation for ${specName}.`;
    }
  };
  
  const handleFeedback = (specId: string, feedback: 'helpful' | 'unhelpful') => {
    setUserFeedback(prev => ({
      ...prev,
      [specId]: feedback
    }));
    
    // In a real implementation, you would send this feedback to your backend
    console.log(`User found explanation for ${specId} ${feedback}`);
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader size={32} className="animate-spin text-blue-500" />
        <p className="text-gray-300">Analyzing products with AI...</p>
        <p className="text-sm text-gray-400">This may take a moment as we compare specifications and generate insights.</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-yellow-500">
        <AlertCircle size={20} className="mr-2" />
        <p>{error}</p>
      </div>
    );
  }
  
  if (comparisonResults.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        <p>No significant differences found or AI analysis not available.</p>
        <button
          onClick={generateComparison}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
          disabled={!aiService.isInitialized() || products.length < 2}
        >
          Generate AI Analysis
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {recommendation && (
        <div className="bg-blue-900 bg-opacity-20 p-4 rounded-lg border border-blue-800">
          <h3 className="text-lg font-semibold mb-2 text-blue-300">AI Recommendation</h3>
          <p className="text-gray-200 whitespace-pre-line">{recommendation}</p>
          
          <div className="mt-4 flex items-center space-x-4">
            <span className="text-sm text-gray-400">Was this recommendation helpful?</span>
            <button 
              onClick={() => handleFeedback('recommendation', 'helpful')}
              className={`p-1 rounded ${userFeedback['recommendation'] === 'helpful' ? 'bg-green-800 text-green-200' : 'hover:bg-gray-700'}`}
              title="Helpful"
            >
              <ThumbsUp size={16} />
            </button>
            <button 
              onClick={() => handleFeedback('recommendation', 'unhelpful')}
              className={`p-1 rounded ${userFeedback['recommendation'] === 'unhelpful' ? 'bg-red-800 text-red-200' : 'hover:bg-gray-700'}`}
              title="Not helpful"
            >
              <ThumbsDown size={16} />
            </button>
          </div>
        </div>
      )}
      
      <h3 className="text-lg font-semibold">Key Differences</h3>
      
      <div className="space-y-4">
        {comparisonResults
          .sort((a, b) => b.differenceSignificance - a.differenceSignificance)
          .map(comparison => (
            <div 
              key={comparison.specId}
              className="border border-gray-700 rounded-lg overflow-hidden"
            >
              <div className="bg-gray-750 p-3 flex justify-between items-center">
                <h4 className="font-medium">{comparison.name}</h4>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-16 h-2 bg-gray-600 rounded-full overflow-hidden"
                    title={`Significance: ${Math.round(comparison.differenceSignificance * 100)}%`}
                  >
                    <div 
                      className="h-full bg-blue-500"
                      style={{ width: `${comparison.differenceSignificance * 100}%` }}
                    ></div>
                  </div>
                  <HelpCircle 
                    size={16} 
                    className="text-gray-400 cursor-help"
                    title="Click for explanation"
                    onClick={async () => {
                      const explanation = await getExplanation(
                        comparison.name, 
                        comparison.differences[0]?.value || ''
                      );
                      alert(explanation);
                    }}
                  />
                </div>
              </div>
              
              <div className="p-3">
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
                
                {comparison.explanation && (
                  <div className="mt-4 p-3 bg-gray-800 rounded-md">
                    <p className="text-sm text-gray-300">{comparison.explanation}</p>
                    
                    <div className="mt-2 flex items-center space-x-4">
                      <span className="text-xs text-gray-400">Was this explanation helpful?</span>
                      <button 
                        onClick={() => handleFeedback(comparison.specId, 'helpful')}
                        className={`p-1 rounded ${userFeedback[comparison.specId] === 'helpful' ? 'bg-green-800 text-green-200' : 'hover:bg-gray-700'}`}
                        title="Helpful"
                      >
                        <ThumbsUp size={14} />
                      </button>
                      <button 
                        onClick={() => handleFeedback(comparison.specId, 'unhelpful')}
                        className={`p-1 rounded ${userFeedback[comparison.specId] === 'unhelpful' ? 'bg-red-800 text-red-200' : 'hover:bg-gray-700'}`}
                        title="Not helpful"
                      >
                        <ThumbsDown size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
      
      <button
        onClick={generateComparison}
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
      >
        Refresh AI Analysis
      </button>
    </div>
  );
};