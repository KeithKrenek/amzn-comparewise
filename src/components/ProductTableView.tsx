import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Product, SortOption } from '../types';
import { ArrowUp, ArrowDown, ExternalLink, BarChart2, Eye } from 'lucide-react';
import { Star } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TableColumn } from '../types/specifications';

interface ProductTableViewProps {
  products: Product[];
  loading: boolean;
  onSort?: (option: SortOption) => void;
  currentSort?: SortOption | null;
  selectedProductIds: string[];
  onSelectProduct: (productId: string, selected: boolean) => void;
  onViewDetails: (product: Product) => void;
  onAddToComparison: (product: Product) => void;
  isInComparison: (productId: string) => boolean;
}

export const ProductTableView: React.FC<ProductTableViewProps> = ({
  products,
  loading,
  onSort,
  currentSort,
  selectedProductIds,
  onSelectProduct,
  onViewDetails,
  onAddToComparison,
  isInComparison
}) => {
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const columnsInitialized = useRef(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const tableBodyRef = useRef<HTMLDivElement>(null);

  // Initialize columns only once when products are available
  useEffect(() => {
    if (products.length > 0 && !columnsInitialized.current) {
      const defaultColumns: TableColumn[] = [
        {
          id: 'select',
          label: '',
          width: '40px',
          sortable: false,
          render: (value, product) => (
            <input
              type="checkbox"
              checked={selectedProductIds.includes(product.id)}
              onChange={(e) => onSelectProduct(product.id, e.target.checked)}
              className="w-4 h-4 accent-blue-500"
            />
          )
        },
        {
          id: 'image',
          label: 'Image',
          width: '80px',
          sortable: false,
          render: (value, product) => (
            <div className="flex justify-center">
              <img 
                src={product.images[0]?.small || 'https://via.placeholder.com/60'} 
                alt={product.title}
                className="h-12 w-12 object-contain"
              />
            </div>
          )
        },
        {
          id: 'title',
          label: 'Product',
          sortable: true,
          render: (value, product) => (
            <div>
              <div className="font-medium line-clamp-2">{product.title}</div>
              <div className="text-xs text-gray-400">{product.brand}</div>
            </div>
          )
        },
        {
          id: 'price',
          label: 'Price',
          width: '120px',
          sortable: true,
          render: (value, product) => (
            <div>
              <div className="font-bold">${product.price.current.toFixed(2)}</div>
              {product.price.original && product.price.original > product.price.current && (
                <div className="text-xs text-gray-400 line-through">
                  ${product.price.original.toFixed(2)}
                </div>
              )}
            </div>
          )
        },
        {
          id: 'rating',
          label: 'Rating',
          width: '120px',
          sortable: true,
          render: (value, product) => (
            product.rating ? (
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="ml-1">{product.rating.value.toFixed(1)}</span>
                <span className="ml-1 text-xs text-gray-400">({product.rating.count})</span>
              </div>
            ) : (
              <span className="text-gray-400">No ratings</span>
            )
          )
        },
        {
          id: 'actions',
          label: 'Actions',
          width: '150px',
          sortable: false,
          render: (value, product) => (
            <div className="flex space-x-1">
              <button 
                onClick={() => onViewDetails(product)}
                className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                title="View details"
              >
                <Eye size={16} />
              </button>
              <button 
                onClick={() => onAddToComparison(product)}
                disabled={isInComparison(product.id)}
                className={`p-1 rounded ${
                  isInComparison(product.id) 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                title="Add to comparison"
              >
                <BarChart2 size={16} />
              </button>
              <a 
                href={`https://amazon.com/dp/${product.id}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-1 bg-gray-700 hover:bg-gray-600 rounded inline-flex"
                title="View on Amazon"
              >
                <ExternalLink size={16} />
              </a>
            </div>
          )
        }
      ];

      // Get the first product to extract common specifications
      const firstProduct = products[0];
      
      // Get important specifications (high confidence and from important categories)
      const importantCategories = ['technical', 'physical', 'performance'];
      const specColumns = firstProduct.specifications
        .filter(spec => 
          spec.confidenceScore >= 0.8 && 
          importantCategories.includes(spec.category)
        )
        .slice(0, 5) // Limit to 5 additional spec columns
        .map(spec => ({
          id: `spec_${spec.id}`,
          label: spec.name,
          width: '150px',
          sortable: true,
          accessor: (product: Product) => {
            const productSpec = product.specifications.find(s => s.name === spec.name);
            return productSpec?.value || '-';
          }
        }));
      
      // Add spec columns to the default columns
      const allColumns = [...defaultColumns, ...specColumns];
      setColumns(allColumns);

      // Set all columns visible by default
      setVisibleColumns(new Set(allColumns.map(col => col.id)));
      
      // Mark columns as initialized
      columnsInitialized.current = true;
    }
  }, [products, selectedProductIds, onSelectProduct, onViewDetails, onAddToComparison, isInComparison]);

  // Handle column visibility toggle
  const toggleColumnVisibility = useCallback((columnId: string) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  }, []);

  // Handle sort with memoization to prevent unnecessary re-renders
  const handleSort = useCallback((columnId: string) => {
    if (!onSort) return;
    
    const column = columns.find(col => col.id === columnId);
    if (!column || !column.sortable) return;
    
    if (currentSort?.columnId === columnId) {
      // Toggle direction if already sorted by this column
      onSort({
        columnId,
        direction: currentSort.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      // Default to ascending for new sort column
      onSort({
        columnId,
        direction: 'asc'
      });
    }
  }, [columns, currentSort, onSort]);

  // Close column selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showColumnSelector && 
          tableRef.current && 
          !tableRef.current.contains(event.target as Node)) {
        setShowColumnSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnSelector]);

  // Set up virtualizer for table rows
  const rowVirtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => tableBodyRef.current,
    estimateSize: () => 60, // Estimated row height
    overscan: 5,
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Get visible columns
  const visibleColumnsList = columns.filter(col => visibleColumns.has(col.id));

  return (
    <div className="overflow-x-auto" ref={tableRef}>
      <div className="mb-2 flex justify-end">
        <button
          onClick={() => setShowColumnSelector(!showColumnSelector)}
          className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded"
        >
          Customize Columns
        </button>
        
        {showColumnSelector && (
          <div className="absolute mt-8 right-0 bg-gray-800 border border-gray-700 rounded-md shadow-lg p-3 z-10">
            <div className="text-sm font-medium mb-2">Toggle Columns</div>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {columns.filter(col => col.id !== 'select' && col.id !== 'actions').map(column => (
                <label key={column.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={visibleColumns.has(column.id)}
                    onChange={() => toggleColumnVisibility(column.id)}
                    className="accent-blue-500"
                  />
                  <span>{column.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Table header (fixed) */}
      <div className="border-b border-gray-700">
        <div className="grid" style={{ 
          gridTemplateColumns: visibleColumnsList.map(col => 
            col.width ? `${col.width}` : '1fr'
          ).join(' ') 
        }}>
          {visibleColumnsList.map(column => (
            <div 
              key={column.id}
              className={`px-4 py-2 text-left font-medium text-sm bg-gray-750 ${column.sortable ? 'cursor-pointer hover:bg-gray-700' : ''}`}
              onClick={() => column.sortable && handleSort(column.id)}
            >
              <div className="flex items-center">
                <span>{column.label}</span>
                {column.sortable && currentSort?.columnId === column.id && (
                  <span className="ml-1">
                    {currentSort.direction === 'asc' ? (
                      <ArrowUp size={14} />
                    ) : (
                      <ArrowDown size={14} />
                    )}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Table body (scrollable) */}
      <div 
        ref={tableBodyRef}
        className="overflow-y-auto"
        style={{ height: `${Math.min(products.length * 60, 400)}px` }}
      >
        {products.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400">
            No products found
          </div>
        ) : (
          <div className="relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              const product = products[virtualRow.index];
              return (
                <div
                  key={product.id}
                  className={`border-t border-gray-700 absolute w-full ${
                    selectedProductIds.includes(product.id) 
                      ? 'bg-blue-900 bg-opacity-20' 
                      : virtualRow.index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'
                  } hover:bg-gray-700`}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className="grid h-full" style={{ 
                    gridTemplateColumns: visibleColumnsList.map(col => 
                      col.width ? `${col.width}` : '1fr'
                    ).join(' ') 
                  }}>
                    {visibleColumnsList.map(column => {
                      // Get the value for this cell
                      let value;
                      if (column.id === 'title') {
                        value = product.title;
                      } else if (column.id === 'price') {
                        value = product.price.current;
                      } else if (column.id === 'rating') {
                        value = product.rating?.value || 0;
                      } else if (column.id.startsWith('spec_')) {
                        const specId = column.id.replace('spec_', '');
                        const spec = product.specifications.find(s => s.id === specId);
                        value = spec?.value || '-';
                      } else {
                        value = product[column.id as keyof Product];
                      }
                      
                      return (
                        <div key={`${product.id}-${column.id}`} className="px-4 py-3 flex items-center">
                          {column.render 
                            ? column.render(value, product)
                            : value}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};