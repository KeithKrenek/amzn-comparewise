import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Product, SearchQuery, SortOption } from '../../types';
import { extractionService } from '../../services/extractionService';

interface ProductsState {
  items: Product[];
  loading: boolean;
  error: string | null;
  searchQuery: SearchQuery;
  sortOption: SortOption | null;
}

const initialState: ProductsState = {
  items: [],
  loading: false,
  error: null,
  searchQuery: { keyword: '' },
  sortOption: null,
};

export const searchProducts = createAsyncThunk(
  'products/search',
  async (query: SearchQuery, { rejectWithValue }) => {
    try {
      return await extractionService.searchProducts(query);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to search products');
    }
  }
);

export const getProductDetails = createAsyncThunk(
  'products/getDetails',
  async (productId: string, { rejectWithValue }) => {
    try {
      return await extractionService.getProductDetails(productId);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to get product details');
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<SearchQuery>) => {
      state.searchQuery = action.payload;
    },
    setSortOption: (state, action: PayloadAction<SortOption | null>) => {
      state.sortOption = action.payload;
    },
    clearProducts: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSearchQuery, setSortOption, clearProducts } = productsSlice.actions;
export default productsSlice.reducer;