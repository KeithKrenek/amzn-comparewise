import React from 'react';
import { Product } from '../types';
import { Star, BarChart2, ExternalLink, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  viewMode: 'grid' | 'list';
  isSelected?: boolean;
  onSelect?: (product: Product, selected: boolean) => void;
  onViewDetails?: (product: Product) => void;
  onAddToComparison?: (product: Product) => void;
  isInComparison?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  viewMode, 
  isSelected = false,
  onSelect,
  onViewDetails,
  onAddToComparison,
  isInComparison = false
}) => {
  const { title, brand, price, rating, images } = product;
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSelect) {
      onSelect(product, e.target.checked);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(product);
    }
  };

  const handleAddToComparison = () => {
    if (onAddToComparison && !isInComparison) {
      onAddToComparison(product);
    }
  };

  const cardClasses = `
    bg-gray-800 rounded-lg overflow-hidden shadow-lg 
    transition-all duration-200
    ${isSelected ? 'ring-2 ring-blue-500' : 'hover:shadow-xl'}
  `;

  if (viewMode === 'list') {
    return (
      <div className={cardClasses}>
        <div className="flex">
          <div className="w-32 h-32 flex-shrink-0 bg-gray-700 p-2 relative">
            {onSelect && (
              <div className="absolute top-2 left-2 z-10">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={handleSelectChange}
                  className="w-4 h-4 accent-blue-500"
                />
              </div>
            )}
            <img 
              src={images[0]?.small || 'https://via.placeholder.com/150'} 
              alt={title}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="p-4 flex-grow">
            <h3 className="text-lg font-semibold line-clamp-2">{title}</h3>
            <p className="text-sm text-gray-400 mb-2">{brand}</p>
            
            {rating && (
              <div className="flex items-center mb-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="ml-1 text-sm">{rating.value.toFixed(1)}</span>
                <span className="ml-1 text-xs text-gray-400">({rating.count})</span>
              </div>
            )}
            
            <div className="mt-2">
              <span className="text-lg font-bold">{formatPrice(price.current)}</span>
              {price.original && price.original > price.current && (
                <span className="ml-2 text-sm text-gray-400 line-through">
                  {formatPrice(price.original)}
                </span>
              )}
            </div>

            <div className="mt-4 flex space-x-2">
              <button 
                onClick={handleViewDetails}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded flex items-center"
              >
                <Eye size={14} className="mr-1" />
                Details
              </button>
              <button 
                onClick={handleAddToComparison}
                disabled={isInComparison}
                className={`px-3 py-1 text-sm rounded flex items-center ${
                  isInComparison 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <BarChart2 size={14} className="mr-1" />
                {isInComparison ? 'Added' : 'Compare'}
              </button>
              <a 
                href={`https://amazon.com/dp/${product.id}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded flex items-center"
              >
                <ExternalLink size={14} className="mr-1" />
                View
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cardClasses}>
      <div className="h-48 bg-gray-700 p-4 relative">
        {onSelect && (
          <div className="absolute top-2 left-2 z-10">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleSelectChange}
              className="w-4 h-4 accent-blue-500"
            />
          </div>
        )}
        <img 
          src={images[0]?.small || 'https://via.placeholder.com/300'} 
          alt={title}
          className="w-full h-full object-contain"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold line-clamp-2">{title}</h3>
        <p className="text-sm text-gray-400 mb-2">{brand}</p>
        
        {rating && (
          <div className="flex items-center mb-2">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="ml-1 text-sm">{rating.value.toFixed(1)}</span>
            <span className="ml-1 text-xs text-gray-400">({rating.count})</span>
          </div>
        )}
        
        <div className="mt-2">
          <span className="text-lg font-bold">{formatPrice(price.current)}</span>
          {price.original && price.original > price.current && (
            <span className="ml-2 text-sm text-gray-400 line-through">
              {formatPrice(price.original)}
            </span>
          )}
        </div>

        <div className="mt-4 flex space-x-2">
          <button 
            onClick={handleViewDetails}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded flex items-center"
          >
            <Eye size={14} className="mr-1" />
            Details
          </button>
          <button 
            onClick={handleAddToComparison}
            disabled={isInComparison}
            className={`px-3 py-1 text-sm rounded flex items-center ${
              isInComparison 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <BarChart2 size={14} className="mr-1" />
            {isInComparison ? 'Added' : 'Compare'}
          </button>
          <a 
            href={`https://amazon.com/dp/${product.id}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded flex items-center"
          >
            <ExternalLink size={14} className="mr-1" />
            View
          </a>
        </div>
      </div>
    </div>
  );
};