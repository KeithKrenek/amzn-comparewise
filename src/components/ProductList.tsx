import React, { useState, useEffect, useRef } from 'react';
import { Product, SortOption } from '../types';
import { ProductCard } from './ProductCard';
import { ProductTableView } from './ProductTableView';
import { LayoutGrid, LayoutList, BarChart2, Table as TableIcon } from 'lucide-react';
import { SortDropdown } from './SortDropdown';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setViewMode, setScrollPosition } from '../store/slices/ui.slice';

interface ProductListProps {
  products: Product[];
  loading: boolean;
  onSort?: (option: SortOption) => void;
  currentSort?: SortOption | null;
  selectedProducts: Product[];
  onAddToComparison: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  onToggleComparison: () => void;
  onShowSavedComparisons: () => void;
}

export const ProductList: React.FC<ProductListProps> = ({ 
  products, 
  loading,
  onSort,
  currentSort,
  selectedProducts,
  onAddToComparison,
  onViewDetails,
  onToggleComparison,
  onShowSavedComparisons
}) => {
  const dispatch = useAppDispatch();
  const { viewMode, scrollPosition } = useAppSelector(state => state.ui);
  const containerRef = useRef<HTMLDivElement>(null);

  // Save scroll position before view changes or sorting
  useEffect(() => {
    const handleScroll = () => {
      dispatch(setScrollPosition(window.scrollY));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [dispatch]);

  // Restore scroll position after view changes or sorting
  useEffect(() => {
    if (scrollPosition > 0) {
      window.scrollTo({ top: scrollPosition, behavior: 'instant' });
    }
  }, [viewMode, currentSort, scrollPosition]);

  const handleProductSelect = (product: Product, selected: boolean) => {
    if (selected) {
      onAddToComparison(product);
    }
  };

  const handleSelectById = (productId: string, selected: boolean) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      handleProductSelect(product, selected);
    }
  };

  const isInComparison = (productId: string): boolean => {
    return selectedProducts.some(p => p.id === productId);
  };

  const handleSort = (option: SortOption) => {
    // Save current scroll position before sorting
    dispatch(setScrollPosition(window.scrollY));
    
    if (onSort) {
      onSort(option);
    }
  };

  // Handle view mode change with scroll position preservation
  const changeViewMode = (mode: 'grid' | 'list' | 'table') => {
    // Save current scroll position before changing view
    dispatch(setScrollPosition(window.scrollY));
    dispatch(setViewMode(mode));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold mb-2">No products found</h2>
        <p className="text-gray-400">Try searching for something else or adjusting your filters</p>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold">Products ({products.length})</h2>
        <div className="flex flex-wrap items-center gap-4">
          {onSort && (
            <SortDropdown onSort={handleSort} currentSort={currentSort || null} />
          )}
          
          <button
            onClick={onShowSavedComparisons}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm"
          >
            Saved Comparisons
          </button>
          
          {selectedProducts.length > 0 && (
            <button 
              onClick={onToggleComparison}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white"
            >
              <BarChart2 size={18} className="mr-2" />
              Compare ({selectedProducts.length})
            </button>
          )}
          
          <div className="flex space-x-2">
            <button
              onClick={() => changeViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-700' : 'bg-gray-800'}`}
              aria-label="Grid view"
              title="Grid view"
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => changeViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-700' : 'bg-gray-800'}`}
              aria-label="List view"
              title="List view"
            >
              <LayoutList size={20} />
            </button>
            <button
              onClick={() => changeViewMode('table')}
              className={`p-2 rounded ${viewMode === 'table' ? 'bg-gray-700' : 'bg-gray-800'}`}
              aria-label="Table view"
              title="Table view"
            >
              <TableIcon size={20} />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'grid' && (
        <VirtualizedGrid 
          products={products}
          selectedProducts={selectedProducts}
          onSelect={handleProductSelect}
          onViewDetails={onViewDetails}
          onAddToComparison={onAddToComparison}
        />
      )}

      {viewMode === 'list' && (
        <VirtualizedList
          products={products}
          selectedProducts={selectedProducts}
          onSelect={handleProductSelect}
          onViewDetails={onViewDetails}
          onAddToComparison={onAddToComparison}
        />
      )}

      {viewMode === 'table' && (
        <ProductTableView
          products={products}
          loading={loading}
          onSort={handleSort} // Use our wrapped sort handler
          currentSort={currentSort}
          selectedProductIds={selectedProducts.map(p => p.id)}
          onSelectProduct={handleSelectById}
          onViewDetails={onViewDetails}
          onAddToComparison={onAddToComparison}
          isInComparison={isInComparison}
        />
      )}
    </div>
  );
};

// Virtualized Grid Component
const VirtualizedGrid: React.FC<{
  products: Product[];
  selectedProducts: Product[];
  onSelect: (product: Product, selected: boolean) => void;
  onViewDetails: (product: Product) => void;
  onAddToComparison: (product: Product) => void;
}> = ({ products, selectedProducts, onSelect, onViewDetails, onAddToComparison }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Calculate number of columns based on container width
  const getColumnCount = (width: number) => {
    if (width < 640) return 1; // sm
    if (width < 768) return 2; // md
    if (width < 1024) return 3; // lg
    return 4; // xl
  };
  
  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);
  
  const columnCount = getColumnCount(containerWidth);
  const rowCount = Math.ceil(products.length / columnCount);
  
  // Calculate row heights (fixed for simplicity)
  const rowHeight = 400; // Approximate height of a product card
  
  return (
    <div ref={containerRef} className="w-full">
      <div 
        style={{ 
          height: `${rowCount * rowHeight}px`,
          position: 'relative'
        }}
      >
        {products.map((product, index) => {
          const row = Math.floor(index / columnCount);
          const col = index % columnCount;
          
          return (
            <div 
              key={product.id}
              style={{
                position: 'absolute',
                top: row * rowHeight,
                left: `${(col / columnCount) * 100}%`,
                width: `${(1 / columnCount) * 100}%`,
                height: `${rowHeight}px`,
                padding: '0.75rem'
              }}
            >
              <ProductCard 
                product={product} 
                viewMode="grid"
                isSelected={selectedProducts.some(p => p.id === product.id)}
                onSelect={onSelect}
                onViewDetails={onViewDetails}
                onAddToComparison={onAddToComparison}
                isInComparison={selectedProducts.some(p => p.id === product.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Virtualized List Component
const VirtualizedList: React.FC<{
  products: Product[];
  selectedProducts: Product[];
  onSelect: (product: Product, selected: boolean) => void;
  onViewDetails: (product: Product) => void;
  onAddToComparison: (product: Product) => void;
}> = ({ products, selectedProducts, onSelect, onViewDetails, onAddToComparison }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Fixed row height for list view
  const rowHeight = 150; // Approximate height of a product card in list view
  
  return (
    <div ref={containerRef} className="space-y-4">
      {products.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          viewMode="list"
          isSelected={selectedProducts.some(p => p.id === product.id)}
          onSelect={onSelect}
          onViewDetails={onViewDetails}
          onAddToComparison={onAddToComparison}
          isInComparison={selectedProducts.some(p => p.id === product.id)}
        />
      ))}
    </div>
  );
};