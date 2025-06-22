import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import ProductCard from './ProductCard';


const ShopperUI = () => {
  const {
    products,
    authUser,
    
    loading,
    fetchProducts,
   
  } = useStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Electronics & Accessories
          </h1>
          <p className="text-gray-600">
            {products.length} results for "electronics"
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              
            />
          ))}
        </div>

        {products.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found.</p>
          </div>
        )}
      </div>

     
    </div>
  );
};

export default ShopperUI;