import React, { useState, useEffect } from 'react';
import { HelpCircle, Loader } from 'lucide-react';
import { aiService } from '../services/ai/aiService';

interface SpecificationExplainerProps {
  specName: string;
  specValue: any;
  category?: string;
}

export const SpecificationExplainer: React.FC<SpecificationExplainerProps> = ({
  specName,
  specValue,
  category = 'technical'
}) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  
  const fetchExplanation = async () => {
    if (!showExplanation) {
      setShowExplanation(true);
      
      if (!explanation) {
        setLoading(true);
        try {
          const result = await aiService.explainSpecification(specName, String(specValue));
          setExplanation(result);
        } catch (error) {
          console.error(`Error explaining specification ${specName}:`, error);
          setExplanation(`Unable to generate explanation for ${specName}.`);
        } finally {
          setLoading(false);
        }
      }
    } else {
      setShowExplanation(false);
    }
  };
  
  return (
    <div className="relative">
      <button
        onClick={fetchExplanation}
        className="inline-flex items-center text-blue-400 hover:text-blue-300"
        title={`Explain ${specName}`}
      >
        <HelpCircle size={16} className="mr-1" />
        <span className="text-sm">What is this?</span>
      </button>
      
      {showExplanation && (
        <div className="absolute z-50 left-0 mt-2 p-3 bg-gray-800 rounded-md border border-gray-700 text-sm w-64 shadow-lg">
          {loading ? (
            <div className="flex items-center justify-center py-2">
              <Loader size={16} className="animate-spin text-blue-400 mr-2" />
              <span>Generating explanation...</span>
            </div>
          ) : (
            <p className="text-gray-300">{explanation}</p>
          )}
        </div>
      )}
    </div>
  );
};