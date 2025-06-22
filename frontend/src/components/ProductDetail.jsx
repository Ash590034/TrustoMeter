
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Shield, AlertTriangle, User, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useStore } from '@/store/useStore';
import toast from 'react-hot-toast';
import Header from '@/components/Header';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    products, 
    addReview, 
    isReviewing, 
    fetchProductReviews, 
    reviews, 
    isAuthenticated, 
    isModerator,
    fetchProducts,
    fetchProductsByCategories,
    fetchSellerById,
    seller,
    isFetchingSeller
  } = useStore();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showFullDescription, setShowFullDescription] = useState(false);

  const product = products.find(p => p._id === id);

  useEffect(() => {
    if (!product && products.length === 0) {
      fetchProducts();

    }
    if (id) {
      fetchProductReviews(id);
      fetchSellerById(id);
    }
  }, [id, product, products.length, fetchProducts, fetchProductReviews]);

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to leave a review.');
      return;
    }

    if (comment.trim().length < 10) {
      toast.error('Please write at least 10 characters.');
      return;
    }

    try {
      await addReview(id, { rating, comment });
      setComment('');
      setRating(5);
      toast.success('Review submitted successfully!');
      fetchProductReviews(id);
    } catch (error) {
      toast.error('Failed to submit review. Please try again.');
    }
  };

  const getTrustScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getTrustBadge = (score) => {
    if (score >= 80) return { badge: 'A', color: 'bg-green-500' };
    if (score >= 60) return { badge: 'B', color: 'bg-blue-500' };
    if (score >= 40) return { badge: 'C', color: 'bg-yellow-500' };
    if (score >= 20) return { badge: 'D', color: 'bg-orange-500' };
    return { badge: 'F', color: 'bg-red-500' };
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

   const handleSellerClick = () => {
    if (product?.createdBy) {
      navigate(`/seller/${product.createdBy}`);
    }
  };

   const getDisplayDescription = () => {
    if (!product?.description) return '';
    
    const maxLength = 150;
    if (product.description.length <= maxLength || showFullDescription) {
      return product.description;
    }
    
    return product.description.substring(0, maxLength) + '...';
  };

  const shouldShowSeeMore = () => {
    return product?.description && product.description.length > 150;
  };


  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          onCategorySelect={handleCategorySelect}
          onCartClick={handleCartClick}
        />
        <div className="max-w-7xl mx-auto p-4">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Product not found</h2>
            <Button onClick={() => navigate('/')}>
              Go back to home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const trustInfo = getTrustBadge(product.analysis?.trustScore || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onCategorySelect={handleCategorySelect}
        onCartClick={handleCartClick}
      />

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <Button onClick={() => navigate('/')} variant="outline" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[currentImageIndex]?.url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=600&fit=crop';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image Available
                </div>
              )}
            </div>
            
            {product.images && product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <img
                    key={image._id}
                    src={image.url}
                    alt={`${product.name} ${index + 1}`}
                    className={`w-16 h-16 object-cover rounded cursor-pointer border-2 ${
                      index === currentImageIndex ? 'border-blue-500' : 'border-gray-200'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=64&h=64&fit=crop';
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(product.ratings?.average || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600">
                  ({product.ratings?.count || 0} reviews)
                </span>
              </div>
               {seller && (
                <div className="mb-4">
                  <span className="text-gray-600">Sold by:  </span>
                  <Button
                    variant="link"
                    onClick={handleSellerClick}
                    className="p-0 h-auto text-blue-600 hover:text-blue-800 font-medium"
                  >
                   {seller.fullName}
                  </Button>
                </div>
              )}
            </div>

            

           

            {/* Trust Score */}
            { (
              <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <span>Trust Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Trust Score:</span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-lg font-bold ${getTrustScoreColor(product.analysis?.trustScore || 0)}`}>
                        {product.analysis?.trustScore || 0}/100
                      </span>
                      <Badge className={`${trustInfo.color} text-white`}>
                        Grade {trustInfo.badge}
                      </Badge>
                    </div>
                  </div>
                  
                  {product.analysis?.summary && (
                    <div>
                      <span className="font-medium">Summary:</span>
                      <p className="text-gray-700 mt-1">{product.analysis.summary}</p>
                    </div>
                  )}

                  {product.analysis?.redFlags && product.analysis.redFlags.length > 0 && (
                    <div>
                      <span className="font-medium text-red-600 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Warning Signs:
                      </span>
                      <ul className="list-disc list-inside text-red-700 mt-1 space-y-1">
                        {product.analysis.redFlags.map((flag, index) => (
                          <li key={index} className="text-sm">{flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            )}

            {/* Price and Actions */}
            <div className="space-y-4">
              <div className="text-3xl font-bold text-orange-600">
                ₹{product.price?.toLocaleString() || 0}
              </div>
              
              <div className="flex space-x-4">
                <Button size="lg" className="flex-1 bg-orange-400 hover:bg-orange-500">
                  Add to Cart
                </Button>
                <Button size="lg" variant="outline" className="flex-1">
                  Buy Now
                </Button>
              </div>
            </div>

            {/* Product Description */}
             <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <div className="space-y-2">
                <p className="text-gray-700">{getDisplayDescription()}</p>
                {shouldShowSeeMore() && (
                  <Button
                    variant="link"
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="p-0 h-auto text-blue-600 hover:text-blue-800"
                  >
                    {showFullDescription ? 'See Less' : 'See More'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Customer Reviews</h2>

          {/* Add Review */}
          {isAuthenticated  && (
            <Card>
              <CardHeader>
                <CardTitle>Write a Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-6 w-6 cursor-pointer ${
                          star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                        onClick={() => setRating(star)}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Comment</label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this product..."
                    rows={4}
                  />
                </div>
                
                <Button 
                  onClick={handleSubmitReview}
                  disabled={isReviewing || comment.trim().length < 10}
                >
                  {isReviewing ? 'Submitting...' : 'Submit Review'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review._id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-gray-400" />
                      <span className="font-medium">{review.user}</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {
                       (
                        <div className="flex items-center space-x-2">
                      {review.isFlagged  && (
                        <Badge variant="destructive">Flagged</Badge>
                      )}
                      <Badge variant="outline">
                        Trust: {review.trustScore}
                      </Badge>
                    </div>
                      )
                    }
                  </div>
                  
                  <p className="text-gray-700 mb-2">{review.comment}</p>
                  
                  {review.reasons && review.reasons.length  > 0&& isModerator && (
                    <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                      <span className="text-sm font-medium text-red-800">Flagged Reasons:</span>
                      <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                        {review.reasons.map((reason, index) => (
                          <li key={index}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-500 mt-2">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;