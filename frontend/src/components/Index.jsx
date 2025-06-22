import React, { useState, useEffect } from 'react';
import { Plus ,Search, ShoppingCart, User, Menu, Star, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import AddProductModal from '@/components/AddProductModal';
import { Link, useNavigate } from 'react-router-dom';

const Index = () => {
  const {
    products,
    loading,
    isAuthenticated,
    isModerator,
    getCurrentUser,
    fetchProducts,
    fetchProductsByCategories,
    authUser,
    logout, logoutMod,
  } = useStore();

  const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

 

  useEffect(() => {
    // Check for existing auth on app load
    
   
    
    // Load initial products
    fetchProducts();
  }, [getCurrentUser, fetchProducts]);
  useEffect(() => {
  if (searchTerm === '') {
    setFilteredProducts([]);
  }
}, [searchTerm]);
   const handleLogout = async () => {
    if (isModerator) {
      await logoutMod();
    } else {
      await logout();
    }
    navigate('/');
  };
   const getTrustBadgeColor = (badge) => {
    switch (badge) {
      case 'A': return 'bg-green-500';
      case 'B': return 'bg-blue-500';
      case 'C': return 'bg-yellow-500';
      case 'D': return 'bg-orange-500';
      case 'F': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
 

  const handleCategorySelect = (category) => {
    if (category === 'all') {
      fetchProducts();
    } else {
      fetchProductsByCategories(category);
    }
  };

  const handleCartClick = () => {
    console.log('Cart clicked');
  };
 const [filteredProducts, setFilteredProducts] = useState([]);
 const handleSearch = () => {
  const filtered = products.filter((ele) =>
    ele.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  setFilteredProducts(filtered);
};


  return (
    <div className="min-h-screen bg-gray-50">
       <header className="bg-gray-900 text-white">
      {/* Main header */}
      <div className="px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link to="/">
              <h1 className="text-2xl font-bold">Amazon</h1>
            </Link>
            {isModerator && (
              <Badge variant="secondary" className="bg-purple-600 text-white">
                Moderator
              </Badge>
            )}
          </div>

          {/* Search */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-12 py-2 bg-white text-black"
              />
              <Button
                size="sm"
                className="absolute right-0 top-0 h-full px-4 bg-orange-400 hover:bg-orange-500"
                onClick={handleSearch}
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <span>Hello, {authUser?.fullName}</span>
                {authUser?.trustScore && (
                  <div className="flex items-center space-x-1">
                    <Shield className="h-4 w-4" />
                    <span>{authUser.trustScore}</span>
                    <Badge className={`${getTrustBadgeColor(authUser.trustBadge)} text-white text-xs`}>
                      {authUser.trustBadge}
                    </Badge>
                  </div>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="ghost" size="sm">
                    Register
                  </Button>
                </Link>
                <Link to="/moderator/login">
                  <Button variant="ghost" size="sm">
                    Moderator
                  </Button>
                </Link>
              </div>
            )}
          </div>
            
            {isModerator && (
              <Link to="/moderator/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <User className="h-5 w-5" />
                  <span>Dashboard</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Categories */}
      
    </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">
            Shop with Confidence on Theseas
          </h1>
          <p className="text-xl mb-6">
            Every product analyzed for trust and authenticity with our AI-powered system
          </p>
          <div className="flex justify-center space-x-4">
            <Button
              size="lg"
              className="bg-orange-500 hover:bg-orange-600"
              onClick={() => fetchProducts()}
            >
              Browse Products
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Featured Products</h2>
          <div className="flex space-x-4">
            {isAuthenticated && !isModerator && (
              <Button
                onClick={() => setShowAddProductModal(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            )}
            <Button
              onClick={() => fetchProducts()}
              variant="outline"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading products...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-gray-600 mb-6">
              Be the first to add a product to the marketplace!
            </p>
            {isAuthenticated && !isModerator && (
              <Button
                onClick={() => setShowAddProductModal(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {( filteredProducts.length > 0 ? filteredProducts : products).map((product) => (
  <ProductCard key={product._id} product={product} />
))}
          </div>
        )}
      </div>

      {/* Trust Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Why Trust Theseas?</h3>
            <p className="text-lg text-gray-600">
              Our AI-powered system analyzes every product and review for authenticity
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">AI-Powered Analysis</h4>
              <p className="text-gray-600">
                Every product is analyzed for price authenticity, image verification, and description consistency.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Trust Scoring</h4>
              <p className="text-gray-600">
                Each product gets a trust score from 0-100 with detailed breakdown of trust factors.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Community Moderation</h4>
              <p className="text-gray-600">
                Human moderators review flagged content to ensure the highest quality standards.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddProductModal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
      />
    </div>
  );
};

export default Index;