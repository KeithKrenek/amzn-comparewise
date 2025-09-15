import React, { useState, useRef, useEffect } from 'react';
import { SortOption } from '../types';
import { ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';

interface SortDropdownProps {
  onSort: (option: SortOption) => void;
  currentSort: SortOption | null;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({ onSort, currentSort }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Common sort options
  const sortOptions: { label: string; value: string }[] = [
    { label: 'Price', value: 'price' },
    { label: 'Rating', value: 'rating' },
    { label: 'Brand', value: 'brand' },
    { label: 'Processor', value: 'processor' },
    { label: 'RAM', value: 'ram' },
    { label: 'Storage', value: 'storage' },
    { label: 'Screen Size', value: 'screen_size' },
  ];

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSort = (columnId: string, direction: 'asc' | 'desc') => {
    onSort({ columnId, direction });
    setIsOpen(false);
  };

  const toggleDirection = () => {
    if (!currentSort) return;
    
    onSort({
      columnId: currentSort.columnId,
      direction: currentSort.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm"
      >
        <span>
          {currentSort 
            ? `Sort by: ${sortOptions.find(o => o.value === currentSort.columnId)?.label || currentSort.columnId}` 
            : 'Sort by'}
        </span>
        <ChevronDown size={16} className="ml-2" />
      </button>

      {currentSort && (
        <button
          onClick={toggleDirection}
          className="ml-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-md"
          title={`Currently sorted ${currentSort.direction === 'asc' ? 'ascending' : 'descending'}`}
        >
          {currentSort.direction === 'asc' ? (
            <ArrowUp size={16} />
          ) : (
            <ArrowDown size={16} />
          )}
        </button>
      )}

      {isOpen && (
        <div className="absolute z-10 mt-2 w-48 bg-gray-800 rounded-md shadow-lg">
          <ul className="py-1">
            {sortOptions.map((option) => (
              <li key={option.value}>
                <button
                  className="flex justify-between items-center w-full px-4 py-2 text-left text-sm hover:bg-gray-700"
                  onClick={() => handleSort(option.value, 'asc')}
                >
                  <span>{option.label}</span>
                  <div className="flex space-x-1">
                    <ArrowUp 
                      size={14} 
                      className={`${currentSort?.columnId === option.value && currentSort?.direction === 'asc' 
                        ? 'text-blue-400' 
                        : 'text-gray-400'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSort(option.value, 'asc');
                      }}
                    />
                    <ArrowDown 
                      size={14} 
                      className={`${currentSort?.columnId === option.value && currentSort?.direction === 'desc' 
                        ? 'text-blue-400' 
                        : 'text-gray-400'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSort(option.value, 'desc');
                      }}
                    />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};