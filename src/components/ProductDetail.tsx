import React, { useState } from 'react';
import { Product } from '../types';
import { Star, X, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
  onAddToComparison: (product: Product) => void;
  isInComparison: boolean;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ 
  product, 
  onClose,
  onAddToComparison,
  isInComparison
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['technical', 'physical'])
  );

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Group specifications by category
  const specsByCategory = product.specifications.reduce((acc, spec) => {
    if (!acc[spec.category]) {
      acc[spec.category] = [];
    }
    acc[spec.category].push(spec);
    return acc;
  }, {} as Record<string, typeof product.specifications>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Product Details</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <div className="overflow-auto flex-grow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product image */}
            <div className="flex flex-col items-center">
              <div className="h-64 w-64 bg-gray-700 p-4 rounded-lg mb-4">
                <img 
                  src={product.images[0]?.large || 'https://via.placeholder.com/400'} 
                  alt={product.title}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex space-x-4">
                <button 
                  onClick={() => onAddToComparison(product)}
                  disabled={isInComparison}
                  className={`px-4 py-2 rounded-md ${
                    isInComparison 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isInComparison ? 'Added to Comparison' : 'Add to Comparison'}
                </button>
                <a 
                  href={`https://amazon.com/dp/${product.id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md flex items-center"
                >
                  <ExternalLink size={16} className="mr-2" />
                  View on Amazon
                </a>
              </div>
            </div>
            
            {/* Product info */}
            <div>
              <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
              <p className="text-gray-400 mb-4">{product.brand}</p>
              
              {product.rating && (
                <div className="flex items-center mb-4">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="ml-1">{product.rating.value.toFixed(1)}</span>
                  <span className="ml-1 text-sm text-gray-400">({product.rating.count} ratings)</span>
                </div>
              )}
              
              <div className="mb-6">
                <span className="text-2xl font-bold">{formatPrice(product.price.current)}</span>
                {product.price.original && product.price.original > product.price.current && (
                  <span className="ml-2 text-lg text-gray-400 line-through">
                    {formatPrice(product.price.original)}
                  </span>
                )}
              </div>
              
              {product.features.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Key Features</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {product.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          {/* Description */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-300">{product.description}</p>
          </div>
          
          {/* Specifications */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Specifications</h3>
            
            {Object.entries(specsByCategory).map(([category, specs]) => (
              <div key={category} className="mb-4 border border-gray-700 rounded-lg overflow-hidden">
                <div 
                  className="bg-gray-700 p-3 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleCategory(category)}
                >
                  <h4 className="font-medium capitalize">{category}</h4>
                  {expandedCategories.has(category) ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </div>
                
                {expandedCategories.has(category) && (
                  <div className="p-3">
                    <table className="w-full">
                      <tbody>
                        {specs.map(spec => (
                          <tr key={spec.id} className="border-b border-gray-700 last:border-0">
                            <td className="py-2 pr-4 font-medium">{spec.name}</td>
                            <td className="py-2 pl-4">
                              <div className="flex items-center">
                                <span>{spec.value}</span>
                                <div 
                                  className={`ml-2 w-2 h-2 rounded-full ${
                                    spec.confidenceScore > 0.8 ? 'bg-green-500' : 
                                    spec.confidenceScore > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  title={`Confidence: ${Math.round(spec.confidenceScore * 100)}%`}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};