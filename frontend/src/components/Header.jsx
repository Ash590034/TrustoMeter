import React, { useState } from 'react';
import { Search, ShoppingCart, User, Menu, Star, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { Link, useNavigate } from 'react-router-dom';

const Header = ({ onCategorySelect, onCartClick }) => {
  const { authUser, isAuthenticated, isModerator, logout, logoutMod, categories } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

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
 

  return (
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
  );
};

export default Header;