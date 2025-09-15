import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { differenceExplainer } from '../services/comparison/differenceExplainer';

interface WhyThisMattersProps {
  specName: string;
  significance: number;
  category?: string;
}

export const WhyThisMatters: React.FC<WhyThisMattersProps> = ({
  specName,
  significance,
  category = 'electronics'
}) => {
  const [showExplanation, setShowExplanation] = useState(false);
  
  const toggleExplanation = () => {
    setShowExplanation(!showExplanation);
  };
  
  const explanation = differenceExplainer.explainImpact(specName, significance, category);
  
  return (
    <div className="relative">
      <button
        onClick={toggleExplanation}
        className="inline-flex items-center text-blue-400 hover:text-blue-300"
        title="Why this matters"
      >
        <HelpCircle size={16} className="mr-1" />
        <span className="text-sm">Why this matters</span>
      </button>
      
      {showExplanation && (
        <div className="absolute z-50 left-0 mt-2 p-3 bg-gray-800 rounded-md border border-gray-700 text-sm w-64 shadow-lg">
          <p className="text-gray-300">{explanation}</p>
        </div>
      )}
    </div>
  );
};