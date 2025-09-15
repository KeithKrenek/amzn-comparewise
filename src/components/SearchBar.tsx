import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSearchQuery } from '../store/slices/products.slice';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const dispatch = useAppDispatch();
  const { searchQuery } = useAppSelector(state => state.products);
  const [query, setQuery] = useState(searchQuery.keyword || '');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Add to recent searches (avoid duplicates and limit to 5)
      if (!recentSearches.includes(query)) {
        const newRecentSearches = [query, ...recentSearches].slice(0, 5);
        setRecentSearches(newRecentSearches);
        
        // Save recent searches to localStorage
        localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));
      }
      
      // Update search query in Redux
      dispatch(setSearchQuery({ keyword: query }));
      
      // Perform search
      onSearch(query);
    }
  };

  const handleRecentSearch = (search: string) => {
    setQuery(search);
    
    // Update search query in Redux
    dispatch(setSearchQuery({ keyword: search }));
    
    // Perform search
    onSearch(search);
  };

  // Load recent searches from localStorage on component mount
  React.useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches));
      } catch (error) {
        console.error('Error parsing recent searches:', error);
      }
    }
  }, []);

  return (
    <div className="w-full max-w-3xl">
      <form onSubmit={handleSubmit} className="flex w-full">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="search"
            className="block w-full p-3 pl-10 text-sm bg-gray-700 border border-gray-600 rounded-l-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search for products on Amazon..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-r-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-800"
        >
          Search
        </button>
      </form>
      
      {recentSearches.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="text-sm text-gray-400">Recent:</span>
          {recentSearches.map((search, index) => (
            <button
              key={index}
              onClick={() => handleRecentSearch(search)}
              className="text-sm bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
            >
              {search}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};