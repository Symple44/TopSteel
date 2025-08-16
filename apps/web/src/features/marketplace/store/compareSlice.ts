import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '../components/products/ProductCard';

export interface CompareState {
  products: Product[];
  maxProducts: number;
  isOpen: boolean;
}

const initialState: CompareState = {
  products: [],
  maxProducts: 4,
  isOpen: false
};

export const compareSlice = createSlice({
  name: 'compare',
  initialState,
  reducers: {
    addToCompare: (state, action: PayloadAction<Product>) => {
      const product = action.payload;
      
      // Check if product already exists
      const exists = state.products.some(p => p.id === product.id);
      if (exists) return;
      
      // Check max products limit
      if (state.products.length >= state.maxProducts) {
        // Remove the first product if at max
        state.products.shift();
      }
      
      state.products.push(product);
      
      // Open comparison panel if we have at least 2 products
      if (state.products.length >= 2) {
        state.isOpen = true;
      }
    },

    removeFromCompare: (state, action: PayloadAction<string>) => {
      const productId = action.payload;
      state.products = state.products.filter(p => p.id !== productId);
      
      // Close panel if less than 2 products
      if (state.products.length < 2) {
        state.isOpen = false;
      }
    },

    toggleCompare: (state, action: PayloadAction<Product>) => {
      const product = action.payload;
      const existingIndex = state.products.findIndex(p => p.id === product.id);
      
      if (existingIndex !== -1) {
        // Remove if exists
        state.products.splice(existingIndex, 1);
        if (state.products.length < 2) {
          state.isOpen = false;
        }
      } else {
        // Add if doesn't exist
        if (state.products.length >= state.maxProducts) {
          state.products.shift();
        }
        state.products.push(product);
        if (state.products.length >= 2) {
          state.isOpen = true;
        }
      }
    },

    clearCompare: (state) => {
      state.products = [];
      state.isOpen = false;
    },

    setCompareOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },

    replaceProduct: (state, action: PayloadAction<{ oldId: string; newProduct: Product }>) => {
      const { oldId, newProduct } = action.payload;
      const index = state.products.findIndex(p => p.id === oldId);
      
      if (index !== -1) {
        // Check if new product already exists
        const exists = state.products.some(p => p.id === newProduct.id);
        if (!exists) {
          state.products[index] = newProduct;
        }
      }
    },

    setMaxProducts: (state, action: PayloadAction<number>) => {
      state.maxProducts = Math.max(2, Math.min(6, action.payload));
      
      // Remove excess products if needed
      if (state.products.length > state.maxProducts) {
        state.products = state.products.slice(0, state.maxProducts);
      }
    }
  }
});

// Actions
export const {
  addToCompare,
  removeFromCompare,
  toggleCompare,
  clearCompare,
  setCompareOpen,
  replaceProduct,
  setMaxProducts
} = compareSlice.actions;

// Selectors
export const selectCompareProducts = (state: { compare: CompareState }) => state.compare.products;
export const selectCompareCount = (state: { compare: CompareState }) => state.compare.products.length;
export const selectIsCompareOpen = (state: { compare: CompareState }) => state.compare.isOpen;
export const selectMaxCompareProducts = (state: { compare: CompareState }) => state.compare.maxProducts;

export const selectIsInCompare = (productId: string) => 
  (state: { compare: CompareState }) => 
    state.compare.products.some(p => p.id === productId);

export const selectCanAddToCompare = (state: { compare: CompareState }) =>
  state.compare.products.length < state.compare.maxProducts;

export const selectCompareCategories = (state: { compare: CompareState }) => {
  const categories = new Set(state.compare.products.map(p => p.category));
  return Array.from(categories);
};

export default compareSlice.reducer;