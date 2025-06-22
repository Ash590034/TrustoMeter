
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, AlertTriangle, Star, User, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import toast from 'react-hot-toast';
import Header from '@/components/Header';

const FlaggedItemDetail = () => {
  const { type, id } = useParams(); // type will be 'product' or 'review'
  const navigate = useNavigate();
  const { 
    flaggedItems, 
    dismissFlaggedProduct, 
    approveFlaggedProduct, 
    dismissFlaggedReview, 
    approveFlaggedReview,
    isUpdatingFlags,
    fetchProducts,
    fetchProductsByCategories
  } = useStore();

  const item = type === 'product' 
    ? flaggedItems.flaggedProducts?.find(p => p._id === id)
    : flaggedItems.flaggedReviews?.find(r => r._id === id);

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

  const handleApprove = async () => {
    try {
      if (type === 'product') {
        await approveFlaggedProduct(id);
        toast.success('Product approved successfully');
      } else {
        await approveFlaggedReview(id);
        toast.success('Review approved successfully');
      }
      navigate('/moderator/dashboard');
    } catch (error) {
      toast.error('Failed to approve item');
    }
  };

  const handleDismiss = async () => {
    try {
      if (type === 'product') {
        await dismissFlaggedProduct(id);
        toast.success('Product dismissed successfully');
      } else {
        await dismissFlaggedReview(id);
        toast.success('Review dismissed successfully');
      }
      navigate('/moderator/dashboard');
    } catch (error) {
      toast.error('Failed to dismiss item');
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

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          onCategorySelect={handleCategorySelect}
          onCartClick={handleCartClick}
        />
        <div className="max-w-7xl mx-auto p-4">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Item not found</h2>
            <Button onClick={() => navigate('/moderator/dashboard')}>
              Go back to dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onCategorySelect={handleCategorySelect}
        onCartClick={handleCartClick}
      />

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <Button onClick={() => navigate('/moderator/dashboard')} variant="outline" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-center space-x-2 mb-6">
          {type === 'product' ? <Package className="h-6 w-6" /> : <User className="h-6 w-6" />}
          <h1 className="text-3xl font-bold">
            Flagged {type === 'product' ? 'Product' : 'Review'} Details
          </h1>
          <Badge variant="destructive">Flagged</Badge>
        </div>

        {type === 'product' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Image */}
            <div className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {item.images && item.images.length > 0 ? (
                  <img
                    src={item.images[0]?.url}
                    alt={item.name}
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
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{item.name}</h2>
                <div className="text-2xl font-bold text-orange-600 mb-4">
                  ₹{item.price?.toLocaleString() || 0}
                </div>
                <Badge variant="outline" className="mb-4">{item.category}</Badge>
              </div>

              {/* Trust Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <span>Trust Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Trust Score:</span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-lg font-bold ${getTrustScoreColor(item.analysis?.trustScore || 0)}`}>
                          {item.analysis?.trustScore || 0}/100
                        </span>
                        {(() => {
                          const trustInfo = getTrustBadge(item.analysis?.trustScore || 0);
                          return (
                            <Badge className={`${trustInfo.color} text-white`}>
                              Grade {trustInfo.badge}
                            </Badge>
                          );
                        })()}
                      </div>
                    </div>
                    
                    {item.analysis?.summary && (
                      <div>
                        <span className="font-medium">Summary:</span>
                        <p className="text-gray-700 mt-1">{item.analysis.summary}</p>
                      </div>
                    )}

                    {item.analysis?.redFlags && item.analysis.redFlags.length > 0 && (
                      <div>
                        <span className="font-medium text-red-600 flex items-center mb-2">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Red Flags:
                        </span>
                        <ul className="list-disc list-inside text-red-700 space-y-1">
                          {item.analysis.redFlags.map((flag, index) => (
                            <li key={index} className="text-sm">{flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-700">{item.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <Button
                  onClick={handleApprove}
                  disabled={isUpdatingFlags}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Approve Product
                </Button>
                <Button
                  onClick={handleDismiss}
                  disabled={isUpdatingFlags}
                  variant="destructive"
                >
                  Dismiss Product
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Review Details */
          <div className="max-w-4xl">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Review Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <User className="h-8 w-8 text-gray-400" />
                      <div>
                        <h3 className="font-semibold text-lg">{item.user}</h3>
                        <div className="flex items-center space-x-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < item.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">
                      Trust: {item.trustScore}
                    </Badge>
                  </div>

                  {/* Review Content */}
                  <div>
                    <h4 className="font-medium mb-2">Review Comment:</h4>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{item.comment}</p>
                  </div>

                  {/* Flagged Reasons */}
                  {item.reasons && item.reasons.length > 0 && (
                    <div>
                      <span className="font-medium text-red-600 flex items-center mb-2">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Flagged Reasons:
                      </span>
                      <ul className="list-disc list-inside text-red-700 space-y-1 bg-red-50 p-4 rounded-lg">
                        {item.reasons.map((reason, index) => (
                          <li key={index} className="text-sm">{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-4 pt-4">
                    <Button
                      onClick={handleApprove}
                      disabled={isUpdatingFlags}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Approve Review
                    </Button>
                    <Button
                      onClick={handleDismiss}
                      disabled={isUpdatingFlags}
                      variant="destructive"
                    >
                      Dismiss Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlaggedItemDetail;