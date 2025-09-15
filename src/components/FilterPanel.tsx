// src/components/FilterPanel.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { Product, Filter, FilterType } from '../types';
import { Search, FilterX } from 'lucide-react';
import { useAppDispatch } from '../store/hooks';
import { setAvailableFilters } from '../store/slices/filters.slice';
import RangeSlider from './RangeSlider';

interface FilterPanelProps {
  products: Product[];
  onFilterChange: (filters: Filter[]) => void;
  activeFilters: Filter[];
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ 
  products, 
  onFilterChange,
  activeFilters
}) => {
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['technical', 'physical']));

  // Generate available filters based on product specifications
  const availableFilters = useMemo(() => {
    if (!products.length) return [];
    
    const specMap = new Map<string, {
      name: string;
      values: Set<any>;
      type: FilterType;
      category: string;
      range?: { min: number; max: number };
    }>();
    
    products.forEach(product => {
      (product.specifications || []).forEach(spec => {
        if (!spec.name || spec.confidenceScore < 0.7) return;
        const key = spec.name.toLowerCase();
        if (!specMap.has(key)) {
          let type: FilterType = 'categorical';
          if (typeof spec.normalizedValue === 'boolean') {
            type = 'boolean';
          } else if (typeof spec.normalizedValue === 'number' ||
                     (typeof spec.normalizedValue === 'object' && spec.normalizedValue !== null && typeof spec.normalizedValue.value === 'number')) {
            type = 'range';
          }
          specMap.set(key, {
            name: spec.name,
            values: new Set(),
            type,
            category: spec.category || 'other',
            range: type === 'range' ? { min: Infinity, max: -Infinity } : undefined
          });
        }
        const filter = specMap.get(key)!;
        filter.values.add(spec.value);
        if (filter.type === 'range' && filter.range) {
          let numValue: number;
          if (typeof spec.normalizedValue === 'number') {
            numValue = spec.normalizedValue;
          } else if (typeof spec.normalizedValue === 'object' && spec.normalizedValue !== null && typeof spec.normalizedValue.value === 'number') {
            numValue = spec.normalizedValue.value;
          } else if (typeof spec.value === 'string') {
            const match = spec.value.match(/[\d.]+/);
            numValue = match ? parseFloat(match[0]) : NaN;
          } else {
            numValue = NaN;
          }
          if (!isNaN(numValue)) {
            filter.range.min = Math.min(filter.range.min, numValue);
            filter.range.max = Math.max(filter.range.max, numValue);
          }
        }
      });
    });
    
    const filters = Array.from(specMap.entries())
      .map(([id, { name, values, type, category, range }]) => ({
        id,
        name,
        type,
        category,
        values: Array.from(values),
        range,
      }))
      .sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.name.localeCompare(b.name);
      });
    
    return filters;
  }, [products]);
  
  // Update available filters in Redux store
  useEffect(() => {
    if (availableFilters.length > 0) {
      dispatch(setAvailableFilters(availableFilters));
    }
  }, [availableFilters, dispatch]);
  
  const filteredFilters = searchTerm 
    ? availableFilters.filter(filter => 
        filter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        filter.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : availableFilters;
  
  const filtersByCategory = useMemo(() => {
    const grouped: Record<string, typeof filteredFilters> = {};
    filteredFilters.forEach(filter => {
      if (!grouped[filter.category]) {
        grouped[filter.category] = [];
      }
      grouped[filter.category].push(filter);
    });
    return grouped;
  }, [filteredFilters]);
  
  const handleFilterChange = (filter: Filter, active: boolean) => {
    if (active) {
      onFilterChange([...activeFilters, filter]);
    } else {
      onFilterChange(activeFilters.filter(f => f.id !== filter.id || f.value !== filter.value));
    }
  };
  
  const handleRangeFilterChange = (filterId: string, range: [number, number]) => {
    if (range[0] > range[1]) {
      console.warn('Invalid range:', range);
      return;
    }
    const filtersWithoutRange = activeFilters.filter(f => !(f.id === filterId && f.type === 'range'));
    onFilterChange([
      ...filtersWithoutRange,
      { id: filterId, type: 'range', value: range }
    ]);
  };
  
  const isFilterActive = (filterId: string, value: any): boolean => {
    return activeFilters.some(f => f.id === filterId && (f.type === 'range' ? false : f.value === value));
  };
  
  const getActiveRange = (filterId: string): [number, number] | null => {
    const rangeFilter = activeFilters.find(f => f.id === filterId && f.type === 'range');
    return rangeFilter ? rangeFilter.value as [number, number] : null;
  };
  
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };
  
  const handleClearFilters = () => {
    onFilterChange([]);
  };
  
  const activeFilterCount = activeFilters.length;
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Filters</h2>
          {activeFilterCount > 0 && (
            <button 
              onClick={handleClearFilters}
              className="flex items-center text-sm text-gray-300 hover:text-white"
            >
              <FilterX size={14} className="mr-1" /> 
              Clear ({activeFilterCount})
            </button>
          )}
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="search"
            className="block w-full p-2 pl-10 text-sm bg-gray-700 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search specifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="p-4">
        {Object.entries(filtersByCategory).map(([category, filters]) => (
          <div key={category} className="mb-4">
            <button
              className="flex items-center justify-between w-full p-2 text-left hover:bg-gray-750 bg-gray-700 rounded-md mb-2"
              onClick={() => toggleCategory(category)}
            >
              <span className="font-medium capitalize">{category}</span>
              <span className="text-xs bg-gray-600 px-2 py-1 rounded-full">
                {filters.length}
              </span>
            </button>
            {expandedCategories.has(category) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filters.map(filter => (
                  <div key={filter.id} className="bg-gray-750 p-3 rounded-md">
                    <div className="text-sm font-medium mb-2">{filter.name}</div>
                    
                    {filter.type === 'boolean' && (
                      <div className="space-y-2 ml-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isFilterActive(filter.id, true)}
                            onChange={(e) => 
                              handleFilterChange({ id: filter.id, type: 'boolean', value: true }, e.target.checked)
                            }
                            className="mr-2 accent-blue-500"
                          />
                          <span>Yes</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isFilterActive(filter.id, false)}
                            onChange={(e) => 
                              handleFilterChange({ id: filter.id, type: 'boolean', value: false }, e.target.checked)
                            }
                            className="mr-2 accent-blue-500"
                          />
                          <span>No</span>
                        </label>
                      </div>
                    )}
                    
                    {filter.type === 'categorical' && (
                      <div className="space-y-2 ml-2 max-h-32 overflow-y-auto">
                        {filter.values
                          .filter(v => v !== null && v !== undefined)
                          .sort()
                          .map((value, i) => (
                            <label key={i} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={isFilterActive(filter.id, value)}
                                onChange={(e) => 
                                  handleFilterChange({ id: filter.id, type: 'categorical', value }, e.target.checked)
                                }
                                className="mr-2 accent-blue-500"
                              />
                              <span className="truncate">{String(value)}</span>
                            </label>
                          ))}
                      </div>
                    )}
                    
                    {filter.type === 'range' && filter.range && (
                      <div className="ml-2 mt-4">
                        <RangeSlider 
                          min={filter.range.min}
                          max={filter.range.max}
                          value={getActiveRange(filter.id) || [filter.range.min, filter.range.max]}
                          onChange={(newRange) => handleRangeFilterChange(filter.id, newRange)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterPanel;
