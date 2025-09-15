import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Filter } from '../../types';

interface FiltersState {
  activeFilters: Filter[];
  availableFilters: {
    id: string;
    name: string;
    type: 'boolean' | 'categorical' | 'range';
    category: string;
    values: any[];
    range?: { min: number; max: number };
  }[];
}

const initialState: FiltersState = {
  activeFilters: [],
  availableFilters: [],
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setActiveFilters: (state, action: PayloadAction<Filter[]>) => {
      state.activeFilters = action.payload;
    },
    addFilter: (state, action: PayloadAction<Filter>) => {
      // Check if filter already exists
      const existingFilterIndex = state.activeFilters.findIndex(
        f => f.id === action.payload.id && f.value === action.payload.value
      );
      
      if (existingFilterIndex === -1) {
        state.activeFilters.push(action.payload);
      }
    },
    removeFilter: (state, action: PayloadAction<{ id: string; value: any }>) => {
      state.activeFilters = state.activeFilters.filter(
        f => !(f.id === action.payload.id && f.value === action.payload.value)
      );
    },
    clearFilters: (state) => {
      state.activeFilters = [];
    },
    setAvailableFilters: (state, action: PayloadAction<FiltersState['availableFilters']>) => {
      state.availableFilters = action.payload;
    },
  },
});

export const { 
  setActiveFilters, 
  addFilter, 
  removeFilter, 
  clearFilters,
  setAvailableFilters
} = filtersSlice.actions;
export default filtersSlice.reducer;