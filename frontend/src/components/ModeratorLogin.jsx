import React from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ModeratorLogin = () => {
  const { loginMod, isLoggingIn } = useStore();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
      await loginMod(data);
      toast.success('Logged in successfully!');
      navigate('/moderator/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/">
            <h1 className="text-3xl font-bold text-gray-900">Amazon</h1>
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Moderator Sign In
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link to="/moderator/register" className="font-medium text-blue-600 hover:text-blue-500">
              create a moderator account
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Moderator Login</span>
              <Badge className="bg-purple-600 text-white">Admin</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Signing In...' : 'Sign In as Moderator'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-orange-600 hover:text-orange-500">
                Sign in as User instead
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ModeratorLogin;