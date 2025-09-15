import React, { useEffect } from 'react';
import { SearchBar } from './components/SearchBar';
import { ProductList } from './components/ProductList';
import { FilterPanel } from './components/FilterPanel';
import { ThemeProvider } from './components/ThemeProvider';
import { ProductDetail } from './components/ProductDetail';
import { ComparisonDrawer } from './components/ComparisonDrawer';
import { SavedComparisons } from './components/SavedComparisons';
import { ScraperStatus } from './components/ScraperStatus';
import { AIStatus } from './components/AIStatus';
import { SortOption, Product } from './types';
import { applyFiltersToProducts } from './utils/filterUtils';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { searchProducts, setSortOption } from './store/slices/products.slice';
import { setActiveFilters } from './store/slices/filters.slice';
import { 
  setDetailProductId, 
  setIsComparisonOpen, 
  setShowSavedComparisons 
} from './store/slices/ui.slice';
import { 
  addProductToComparison, 
  removeProductFromComparison, 
  loadSavedComparison 
} from './store/slices/comparison.slice';

function App() {
  const dispatch = useAppDispatch();
  
  // Redux state
  const { items: products, loading, searchQuery, sortOption } = useAppSelector(state => state.products);
  const { activeFilters } = useAppSelector(state => state.filters);
  const { detailProductId, isComparisonOpen, showSavedComparisons } = useAppSelector(state => state.ui);
  const { selectedProducts } = useAppSelector(state => state.comparison);

  // Apply filters to search results
  const filteredProducts = applyFiltersToProducts(products, activeFilters);

  // Get detail product from products array
  const detailProduct = detailProductId 
    ? products.find(p => p.id === detailProductId) || null 
    : null;

  // Handle search
  const handleSearch = (keyword: string) => {
    dispatch(searchProducts({ keyword }));
    // Reset filters when performing a new search
    dispatch(setActiveFilters([]));
  };

  // Handle sort
  const handleSort = (option: SortOption) => {
    dispatch(setSortOption(option));
    dispatch(searchProducts({ ...searchQuery, sort: option }));
  };

  // Handle filter change
  const handleFilterChange = (filters: any[]) => {
    dispatch(setActiveFilters(filters));
  };

  // Handle view details
  const handleViewDetails = (product: Product) => {
    dispatch(setDetailProductId(product.id));
  };

  // Handle close details
  const handleCloseDetails = () => {
    dispatch(setDetailProductId(null));
  };

  // Handle add to comparison
  const handleAddToComparison = (product: Product) => {
    dispatch(addProductToComparison(product));
  };

  // Handle remove from comparison
  const handleRemoveFromComparison = (productId: string) => {
    dispatch(removeProductFromComparison(productId));
  };

  // Handle toggle comparison drawer
  const handleToggleComparison = () => {
    dispatch(setIsComparisonOpen(!isComparisonOpen));
  };

  // Handle show saved comparisons
  const handleShowSavedComparisons = () => {
    dispatch(setShowSavedComparisons(true));
  };

  // Handle close saved comparisons
  const handleCloseSavedComparisons = () => {
    dispatch(setShowSavedComparisons(false));
  };

  // Handle load comparison
  const handleLoadComparison = (products: Product[]) => {
    dispatch(loadSavedComparison(products));
    dispatch(setShowSavedComparisons(false));
    dispatch(setIsComparisonOpen(true));
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <header className="bg-gray-800 p-4 shadow-md">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Amazon Product Comparison Tool</h1>
              <div className="flex items-center space-x-4">
                <ScraperStatus />
                <AIStatus apiKey="" />
              </div>
            </div>
            <SearchBar onSearch={handleSearch} />
          </div>
        </header>
        
        <main className="container mx-auto p-4">
          {products.length > 0 && (
            <FilterPanel 
              products={products} 
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
            />
          )}
          
          <ProductList 
            products={filteredProducts} 
            loading={loading}
            onSort={handleSort}
            currentSort={sortOption}
            selectedProducts={selectedProducts}
            onAddToComparison={handleAddToComparison}
            onViewDetails={handleViewDetails}
            onToggleComparison={handleToggleComparison}
            onShowSavedComparisons={handleShowSavedComparisons}
          />
        </main>

        {detailProduct && (
          <ProductDetail 
            product={detailProduct}
            onClose={handleCloseDetails}
            onAddToComparison={handleAddToComparison}
            isInComparison={selectedProducts.some(p => p.id === detailProduct.id)}
          />
        )}

        {isComparisonOpen && (
          <ComparisonDrawer 
            products={selectedProducts} 
            onClose={() => dispatch(setIsComparisonOpen(false))}
            onRemoveProduct={handleRemoveFromComparison}
            onSaveComparison={() => dispatch(setShowSavedComparisons(true))}
          />
        )}

        {showSavedComparisons && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Saved Comparisons</h2>
                <button 
                  onClick={handleCloseSavedComparisons}
                  className="p-1 rounded-full hover:bg-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <SavedComparisons 
                currentProducts={products}
                onLoadComparison={handleLoadComparison}
              />
            </div>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;