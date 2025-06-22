import React from 'react';
import { Star, Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const {isModerator} = useStore();

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

  const trustInfo = getTrustBadge(product.analysis?.trustScore || 0);

  const handleClick = () => {
    navigate(`/product/${product._id}`);
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200 relative"
      onClick={handleClick}
    >
      {product.isFlagged && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="destructive" className="flex items-center space-x-1">
            <AlertTriangle className="h-3 w-3" />
            <span>Flagged</span>
          </Badge>
        </div>
      )}
      
      <CardContent className="p-4">
        {/* Product Image */}
        <div className="aspect-square mb-4 bg-gray-100 rounded-lg overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0].url}
              alt={product.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&h=300&fit=crop';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2 h-10">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center space-x-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.ratings?.average || 0)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">
              ({product.ratings?.count || 0})
            </span>
          </div>

          {/* Trust Score */}
          {
             (<div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className={`text-sm font-medium ${getTrustScoreColor(product.analysis?.trustScore || 0)}`}>
                Trust: {product.analysis?.trustScore || 0}
              </span>
              <Badge className={`${trustInfo.color} text-white text-xs`}>
                {trustInfo.badge}
              </Badge>
            </div>
          </div>)
          }

          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">
              ₹{product.price?.toLocaleString() || 0}
            </span>
            
          </div>

          {/* Red Flags */}
          {product.analysis?.redFlags && product.analysis.redFlags.length && isModerator > 0 && (
            <div className="mt-2">
              <Badge variant="destructive" className="text-xs">
                ⚠ {product.analysis.redFlags.length} Warning{product.analysis.redFlags.length > 1 ? 's' : ''}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;