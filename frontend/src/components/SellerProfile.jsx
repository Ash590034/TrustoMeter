import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Shield, Package, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import Header from '@/components/Header';

const SellerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchSellerById, seller, isFetchingSeller, fetchProducts, fetchProductsByCategories } = useStore();

  useEffect(() => {
    if (id) {
      fetchSellerById(id);
    }
  }, [id, fetchSellerById]);

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

  const getTrustScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  if (isFetchingSeller) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          onCategorySelect={handleCategorySelect}
          onCartClick={handleCartClick}
        />
        <div className="max-w-4xl mx-auto p-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading seller profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          onCategorySelect={handleCategorySelect}
          onCartClick={handleCartClick}
        />
        <div className="max-w-4xl mx-auto p-4">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Seller not found</h2>
            <Button onClick={() => navigate('/')}>
              Go back to home
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

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Button onClick={() => navigate(-1)} variant="outline" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Seller Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-gray-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{seller.fullName}</h1>
                <p className="text-gray-600">{seller.email}</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Trust Score Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Shield className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Trust Score</p>
                    <p className={`text-2xl font-bold ${getTrustScoreColor(seller.trustScore)}`}>
                      {seller.trustScore}/100
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex justify-center mb-2">
                    <Badge className={`${getTrustBadgeColor(seller.trustBadge)} text-white text-lg px-3 py-1`}>
                      Grade {seller.trustBadge}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Trust Badge</p>
                    <p className="text-lg font-semibold">
                      {seller.trustBadge === 'A' && 'Excellent'}
                      {seller.trustBadge === 'B' && 'Good'}
                      {seller.trustBadge === 'C' && 'Fair'}
                      {seller.trustBadge === 'D' && 'Poor'}
                      {seller.trustBadge === 'F' && 'Failed'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <Package className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Listed Products</p>
                    <p className="text-2xl font-bold">{seller.listedProducts.length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Flagged Products</span>
                <span className={`font-bold ${seller.flaggedProducts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {seller.flaggedProducts}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Member Since</span>
                <span className="font-medium">
                  {new Date(seller.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Trust Score Explanation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About Trust Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    Our trust score is calculated based on various factors including product quality, 
                    customer reviews, transaction history, and compliance with platform policies.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="outline">Grade A: 80-100 (Excellent)</Badge>
                    <Badge variant="outline">Grade B: 60-79 (Good)</Badge>
                    <Badge variant="outline">Grade C: 40-59 (Fair)</Badge>
                    <Badge variant="outline">Grade D: 20-39 (Poor)</Badge>
                    <Badge variant="outline">Grade F: 0-19 (Failed)</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellerProfile;