import { create } from 'zustand';
import axios from 'axios';
import { axiosInstance } from '../lib/axiosInstance';

export const useStore = create((set, get) => ({
  // State
  authUser: null,
  isAuthenticated: false,
  isSigningUp: false,
  isLoggingIn: false,
  isGettingUser: false,
  isLoggedOut: false,
  isReviewing: false,
  isModerator: false,
  isFetchingFlags: false,
  isUpdatingFlags: false,
  reviews: [],
  products: [],
  flaggedItems: { flaggedReviews: [], flaggedProducts: [] },
  selectedProduct: null,
    seller: null,
  isFetchingSeller: false,
  loading: false,
  reviewId: null,
  categories: ['electronics', 'clothing', 'books', 'home', 'sports'],

  // Actions
  getCurrentUser: async () => {
    try {
      set({ isGettingUser: true });
      const response = await axiosInstance.get('/users/me');
      set({ authUser: response.data.data });
      set({ isAuthenticated: true });
      set({ isLoggedOut: false });
    } catch (error) {
      console.log(error);
      set({ isAuthenticated: false });
    } finally {
      set({ isGettingUser: false });
    }
  },

  signup: async (data) => {
    try {
      set({ isSigningUp: true });
      set({ isModerator: false });
      const response = await axiosInstance.post('/users/register', data);
      set({ authUser: response.data.data.user });
      set({ isAuthenticated: true });
      set({ isLoggedOut: false });
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    try {
      set({ isLoggingIn: true });
      set({ isModerator: false });
      const response = await axiosInstance.post('/users/login', data);
      set({ authUser: response.data.data.user });
      set({ isAuthenticated: true });
      set({ isLoggedOut: false });
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post('/users/logout');
      localStorage.removeItem('token');
      set({ authUser: null });
      set({ isAuthenticated: false });
      set({ isLoggedOut: true });
      set({ isModerator: false });
    } catch (error) {
      console.log(error);
    }
  },

  signupMod: async (data) => {
    try {
      set({ isSigningUp: true });
      set({ isModerator: true });
      const response = await axiosInstance.post('/moderators/register', data);
      set({ authUser: response.data.data.moderator });
      set({ isAuthenticated: true });
      set({ isLoggedOut: false });
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      set({ isSigningUp: false });
    }
  },

  loginMod: async (data) => {
    try {
      set({ isLoggingIn: true });
      set({ isModerator: true });
      const response = await axiosInstance.post('/moderators/login', data);
      set({ authUser: response.data.data.moderator });
      set({ isAuthenticated: true });
      set({ isLoggedOut: false });
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logoutMod: async () => {
    try {
      await axiosInstance.post('/moderators/logout');
      localStorage.removeItem('token');
      set({ authUser: null });
      set({ isAuthenticated: false });
      set({ isModerator: false });
      set({ isLoggedOut: true });
    } catch (error) {
      console.log(error);
    }
  },

  fetchProducts: async () => {
    set({ loading: true });
    try {
      const response = await axiosInstance.get('/users/products');
      set({ products: response.data.data.products });
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchProductsByCategories: async (category) => {
    try {
      set({ loading: true });
      const response = await axiosInstance.get(`/users/products/category/${category}`);
      set({ products: response.data.data.products });
    } catch (error) {
      console.error('Failed to fetch products category wise:', error);
    } finally {
      set({ loading: false });
    }
  },

  addProduct: async (data) => {
    try {
      set({ loading: true });
      const response = await axiosInstance.post('/users/products', data);
      const newProduct = response.data.data.product;
      set(state => ({
        products: [...state.products, newProduct]
      }));
      return newProduct;
    } catch (error) {
      console.error('Failed to add product:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  addReview: async (productId, review) => {
    try {
      set({ isReviewing: true });
      const response = await axiosInstance.post(`/users/products/${productId}/reviews`, review);
      set({ reviewId: response.data.data.review._id });
      
      // Update the product's reviews in the store
      set(state => ({
        products: state.products.map(product =>
          product._id === productId
            ? { ...product, reviews: [...product.reviews, response.data.data.review] }
            : product
        )
      }));
      
      return response.data.data.review;
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      set({ isReviewing: false });
    }
  },

  fetchProductReviews: async (productId) => {
    try {
      const response = await axiosInstance.get(`/users/products/${productId}/reviews`);
      set({ reviews: response.data.data.reviews });
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  },

  

  fetchFlaggedItems: async () => {
    try {
      set({ isFetchingFlags: true });
      const response = await axiosInstance.get('/moderators/flagged');
      set({
        flaggedItems: {
          flaggedReviews: response.data.data.flaggedReviews,
          flaggedProducts: response.data.data.flaggedProducts
        }
      });
    } catch (error) {
      console.error('Failed to fetch flagged items:', error);
    } finally {
      set({ isFetchingFlags: false });
    }
  },
   fetchSellerById: async (sellerId) => {
    try {
      set({ isFetchingSeller: true });
      const response = await axiosInstance.get(`/users/sellers/${sellerId}`);
      set({ 
        seller: response.data.data.seller, 
        isFetchingSeller: false 
      });
      return response.data;
    } catch (error) {
      set({ isFetchingSeller: false });
      console.error('Error fetching seller:', error);
      throw error;
    }
  },

  setSelectedProduct: (product) => {
    set({ selectedProduct: product });
  },

  dismissFlaggedProduct: async (id) => {
    try {
      set({ isUpdatingFlags: true });
      await axiosInstance.delete(`/moderators/dismiss/product/${id}`);
      set((state) => ({
        flaggedItems: {
          ...state.flaggedItems,
          flaggedProducts: state.flaggedItems.flaggedProducts.filter((ele) => ele._id !== id)
        },
        products: state.products.filter((ele) => ele._id !== id)
      }));
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      set({ isUpdatingFlags: false });
    }
  },

  approveFlaggedProduct: async (id) => {
    try {
      set({ isUpdatingFlags: true });
      await axiosInstance.patch(`/moderators/approve/product/${id}`);
      set((state) => ({
        flaggedItems: {
          ...state.flaggedItems,
          flaggedProducts: state.flaggedItems.flaggedProducts.filter((ele) => ele._id !== id)
        }
      }));
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      set({ isUpdatingFlags: false });
    }
  },

  dismissFlaggedReview: async (id) => {
    try {
      set({ isUpdatingFlags: true });
      await axiosInstance.delete(`/moderators/dismiss/review/${id}`);
      set((state) => ({
        flaggedItems: {
          ...state.flaggedItems,
          flaggedReviews: state.flaggedItems.flaggedReviews.filter((ele) => ele._id !== id)
        }
      }));
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      set({ isUpdatingFlags: false });
    }
  },

  approveFlaggedReview: async (id) => {
    try {
      set({ isUpdatingFlags: true });
      console.log(id);
      
      await axiosInstance.patch(`/moderators/approve/review/${id}`);
      set((state) => ({
        flaggedItems: {
          ...state.flaggedItems,
          flaggedReviews: state.flaggedItems.flaggedReviews.filter((ele) => ele._id !== id)
        }
      }));
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      set({ isUpdatingFlags: false });
    }
  },
}));
