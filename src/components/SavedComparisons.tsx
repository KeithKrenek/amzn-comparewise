import React, { useState } from 'react';
import { Product } from '../types';
import { Trash2, Save, Clock, Check } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { deleteSavedComparison, saveComparison } from '../store/slices/comparison.slice';

interface SavedComparisonsProps {
  currentProducts: Product[];
  onLoadComparison: (products: Product[]) => void;
}

export const SavedComparisons: React.FC<SavedComparisonsProps> = ({ 
  currentProducts,
  onLoadComparison
}) => {
  const dispatch = useAppDispatch();
  const { savedComparisons } = useAppSelector(state => state.comparison);
  const [newComparisonName, setNewComparisonName] = useState('');
  const [saveMode, setSaveMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Handle saving a new comparison
  const handleSaveComparison = () => {
    if (selectedProductIds.length === 0) return;
    
    const name = newComparisonName.trim() || `Comparison ${savedComparisons.length + 1}`;
    
    // Use the Redux action to save the comparison
    dispatch(saveComparison({ name }));
    
    setNewComparisonName('');
    setSaveMode(false);
  };

  // Handle deleting a saved comparison
  const handleDeleteComparison = (id: string) => {
    dispatch(deleteSavedComparison(id));
  };

  // Handle loading a saved comparison
  const handleLoadComparison = (comparisonId: string, productIds: string[]) => {
    // Find the products that match the saved IDs
    const productsToLoad = currentProducts.filter(product => 
      productIds.includes(product.id)
    );
    
    // If we found all products, load them
    if (productsToLoad.length === productIds.length) {
      onLoadComparison(productsToLoad);
    } else {
      // If some products are missing, load what we can find
      onLoadComparison(productsToLoad);
      
      // Optionally show a warning that some products couldn't be loaded
      if (productsToLoad.length < productIds.length) {
        alert(`Some products from this comparison couldn't be found in the current search results.`);
      }
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Toggle product selection for saving
  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  // Enter save mode
  const enterSaveMode = () => {
    setSaveMode(true);
    // Pre-select currently compared products if any
    setSelectedProductIds([]);
  };

  return (
    <div className="space-y-4">
      {savedComparisons.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <p>No saved comparisons yet.</p>
          <p className="text-sm mt-2">Save your product comparisons to quickly access them later.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
          {savedComparisons.map(comparison => (
            <div 
              key={comparison.id} 
              className="bg-gray-750 rounded-lg p-3 flex justify-between items-center hover:bg-gray-700 transition-colors"
            >
              <div className="flex-grow">
                <h3 className="font-medium">{comparison.name}</h3>
                <div className="flex items-center text-xs text-gray-400 mt-1">
                  <Clock size={12} className="mr-1" />
                  <span>{formatDate(comparison.date)}</span>
                  <span className="mx-2">•</span>
                  <span>{comparison.productIds.length} products</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleLoadComparison(comparison.id, comparison.productIds)}
                  className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-600 rounded-full"
                  title="Load comparison"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => handleDeleteComparison(comparison.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded-full"
                  title="Delete comparison"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {saveMode ? (
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="comparison-name" className="block text-sm font-medium mb-1">
              Comparison Name
            </label>
            <input
              type="text"
              id="comparison-name"
              value={newComparisonName}
              onChange={(e) => setNewComparisonName(e.target.value)}
              placeholder="My Comparison"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Select Products to Save</h4>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
              {currentProducts.map(product => (
                <label 
                  key={product.id} 
                  className="flex items-center p-2 bg-gray-750 rounded-lg hover:bg-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedProductIds.includes(product.id)}
                    onChange={() => toggleProductSelection(product.id)}
                    className="mr-3 accent-blue-500"
                  />
                  <div className="truncate">
                    <div className="truncate font-medium">{product.title}</div>
                    <div className="text-xs text-gray-400">{product.brand}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setSaveMode(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveComparison}
              disabled={selectedProductIds.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Comparison
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={enterSaveMode}
          className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-md flex items-center justify-center"
        >
          <Save size={16} className="mr-2" />
          Save New Comparison
        </button>
      )}
    </div>
  );
};