import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, Menu , LogOut } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
const Navigation = () => {
  const location = useLocation();
  const currentPath = location.pathname;
   const { authUser, isAuthenticated, logout , isModerator ,logoutMod } = useStore();

  const handleLogout = () => {
    if(isModerator){
      logoutMod();
    }else{
      logout();
    }
  };

  return (
    <header className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-orange-400">Amazon</h1>
              <span className="text-xs">.com</span>
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              <Link
                to="/shop"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPath === '/' || currentPath === '/shop'
                    ? 'bg-orange-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                Shop
              </Link>
               {isAuthenticated && isModerator && (
                <Link
                  to="/moderator"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentPath === '/moderator'
                      ? 'bg-orange-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  Moderator Dashboard
                </Link>
              )}
            </nav>
          </div>

          {(currentPath === '/' || currentPath === '/shop') && (
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full px-4 py-2 pl-10 pr-4 text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>
            </div>
          )}

          <div className="flex items-center space-x-4">
            
             {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-300">
                  Welcome, {authUser?.name}
                </span>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-orange-600 text-orange-400 hover:bg-orange-600 hover:text-white"
                  >
                    Register
                  </Button>
                </Link>
              </div>
            )}
            <button className="md:hidden p-2 text-gray-300 hover:text-white">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;