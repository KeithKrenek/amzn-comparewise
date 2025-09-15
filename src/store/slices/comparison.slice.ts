import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '../../types';

interface SavedComparison {
  id: string;
  name: string;
  date: string;
  productIds: string[];
}

interface ComparisonState {
  selectedProducts: Product[];
  savedComparisons: SavedComparison[];
}

const initialState: ComparisonState = {
  selectedProducts: [],
  savedComparisons: [],
};

// Load saved comparisons from localStorage if available
const loadSavedComparisons = (): SavedComparison[] => {
  try {
    const savedData = localStorage.getItem('savedComparisons');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      // Validate the parsed data structure
      if (Array.isArray(parsed) && parsed.every(item => 
        typeof item === 'object' && 
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.date === 'string' &&
        Array.isArray(item.productIds)
      )) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error loading saved comparisons:', error);
  }
  return [];
};

const comparisonSlice = createSlice({
  name: 'comparison',
  initialState: {
    ...initialState,
    savedComparisons: loadSavedComparisons(),
  },
  reducers: {
    addProductToComparison: (state, action: PayloadAction<Product>) => {
      // Check if product is already in comparison
      const exists = state.selectedProducts.some(p => p.id === action.payload.id);
      
      // Add product if not already in comparison and if we have less than 4 products
      if (!exists && state.selectedProducts.length < 4) {
        state.selectedProducts.push(action.payload);
      }
    },
    removeProductFromComparison: (state, action: PayloadAction<string>) => {
      state.selectedProducts = state.selectedProducts.filter(p => p.id !== action.payload);
    },
    clearComparison: (state) => {
      state.selectedProducts = [];
    },
    saveComparison: (state, action: PayloadAction<{ name: string }>) => {
      const newComparison: SavedComparison = {
        id: Date.now().toString(),
        name: action.payload.name,
        date: new Date().toISOString(),
        productIds: state.selectedProducts.map(p => p.id),
      };
      
      state.savedComparisons.push(newComparison);
      
      // Save to localStorage
      try {
        localStorage.setItem('savedComparisons', JSON.stringify(state.savedComparisons));
      } catch (error) {
        console.error('Error saving comparisons to localStorage:', error);
      }
    },
    deleteSavedComparison: (state, action: PayloadAction<string>) => {
      state.savedComparisons = state.savedComparisons.filter(c => c.id !== action.payload);
      
      // Update localStorage
      try {
        localStorage.setItem('savedComparisons', JSON.stringify(state.savedComparisons));
      } catch (error) {
        console.error('Error updating saved comparisons in localStorage:', error);
      }
    },
    loadSavedComparison: (state, action: PayloadAction<Product[]>) => {
      state.selectedProducts = action.payload;
    },
  },
});

export const { 
  addProductToComparison, 
  removeProductFromComparison, 
  clearComparison,
  saveComparison,
  deleteSavedComparison,
  loadSavedComparison
} = comparisonSlice.actions;
export default comparisonSlice.reducer;