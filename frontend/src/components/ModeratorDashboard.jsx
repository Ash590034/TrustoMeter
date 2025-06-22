
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, AlertTriangle, Package, User } from 'lucide-react';
import { useStore } from '@/store/useStore';
import Header from '@/components/Header';


const ModeratorDashboard = () => {
  const {
    isAuthenticated,
    isModerator,
    flaggedItems,
    fetchFlaggedItems,
    isFetchingFlags,
    
    
    fetchProducts,
    fetchProductsByCategories
  } = useStore();

  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !isModerator) {
      navigate('/moderator/login');
      return;
    }
    fetchFlaggedItems();
  }, [isAuthenticated, isModerator, navigate, fetchFlaggedItems]);

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

  const handleViewDetails = (type, id) => {
    navigate(`/moderator/flagged/${type}/${id}`);
  };

  if (!isAuthenticated || !isModerator) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onCategorySelect={handleCategorySelect}
        onCartClick={handleCartClick}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Moderator Dashboard</h1>
          <p className="text-gray-600">Review flagged products and reviews</p>
        </div>

        {isFetchingFlags ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading flagged items...</p>
            </div>
          </div>
        ) : (
          
          <div className="space-y-8">
             
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Flagged Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{flaggedItems.flaggedProducts?.length || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Flagged Reviews</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{flaggedItems.flaggedReviews?.length || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Flagged</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(flaggedItems.flaggedProducts?.length || 0) + (flaggedItems.flaggedReviews?.length || 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Flagged Products */}
            <div>
              <h2 className="text-2xl font-bold mb-4">
                Flagged Products ({flaggedItems.flaggedProducts?.length || 0})
              </h2>
              {flaggedItems.flaggedProducts?.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Package className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-lg font-medium">No flagged products</p>
                      <p className="text-gray-500">All products are currently approved.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {flaggedItems.flaggedProducts?.map((product) => (
                    <Card key={product._id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>
                            <Badge variant="destructive">Flagged</Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                          
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-lg">₹{product.price?.toLocaleString()}</span>
                            <Badge variant="outline">{product.category}</Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Badge variant="destructive" className="text-xs">
                              Trust Score: {product.analysis?.trustScore || 0}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {product.analysis?.redFlags?.length || 0} red flags
                            </span>
                          </div>
                          
                          <Button
                            onClick={() => handleViewDetails('product', product._id)}
                            className="w-full"
                            variant="outline"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Flagged Reviews */}
            <div>
              <h2 className="text-2xl font-bold mb-4">
                Flagged Reviews ({flaggedItems.flaggedReviews?.length || 0})
              </h2>
             {flaggedItems.flaggedReviews?.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <User className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-lg font-medium">No flagged reviews</p>
                      <p className="text-gray-500">All reviews are currently approved.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {flaggedItems.flaggedReviews?.map((review) => (
                    <Card key={review._id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{review.user}</span>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={`text-sm ${
                                      i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                              <Badge variant="destructive">Flagged</Badge>
                            </div>
                            
                            <p className="text-gray-700 line-clamp-2">{review.comment}</p>
                            
                            <div className="flex items-center justify-between text-sm">
                              <Badge variant="outline">
                                Trust: {review.trustScore}
                              </Badge>
                              <span className="text-gray-500">
                                {review.reasons?.length || 0} flagged reasons
                              </span>
                            </div>
                          </div>
                          
                          <Button
                            onClick={() => handleViewDetails('review', review._id)}
                            variant="outline"
                            size="sm"
                            className="ml-4"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModeratorDashboard;