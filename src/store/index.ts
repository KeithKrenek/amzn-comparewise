import { configureStore } from '@reduxjs/toolkit';
import productsReducer from './slices/products.slice';
import filtersReducer from './slices/filters.slice';
import uiReducer from './slices/ui.slice';
import comparisonReducer from './slices/comparison.slice';

export const store = configureStore({
  reducer: {
    products: productsReducer,
    filters: filtersReducer,
    ui: uiReducer,
    comparison: comparisonReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;