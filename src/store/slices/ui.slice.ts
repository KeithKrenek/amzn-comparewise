import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type ViewMode = 'grid' | 'list' | 'table';

interface UIState {
  viewMode: ViewMode;
  theme: 'dark' | 'light';
  detailProductId: string | null;
  isComparisonOpen: boolean;
  showSavedComparisons: boolean;
  scrollPosition: number;
}

const initialState: UIState = {
  viewMode: 'grid',
  theme: 'dark',
  detailProductId: null,
  isComparisonOpen: false,
  showSavedComparisons: false,
  scrollPosition: 0,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setViewMode: (state, action: PayloadAction<ViewMode>) => {
      state.viewMode = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
    setDetailProductId: (state, action: PayloadAction<string | null>) => {
      state.detailProductId = action.payload;
    },
    setIsComparisonOpen: (state, action: PayloadAction<boolean>) => {
      state.isComparisonOpen = action.payload;
    },
    setShowSavedComparisons: (state, action: PayloadAction<boolean>) => {
      state.showSavedComparisons = action.payload;
    },
    setScrollPosition: (state, action: PayloadAction<number>) => {
      state.scrollPosition = action.payload;
    },
  },
});

export const { 
  setViewMode, 
  toggleTheme, 
  setDetailProductId, 
  setIsComparisonOpen,
  setShowSavedComparisons,
  setScrollPosition
} = uiSlice.actions;
export default uiSlice.reducer;