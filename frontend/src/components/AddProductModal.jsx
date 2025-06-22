import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { toast } from 'react-hot-toast'

import { Plus, X } from 'lucide-react';

const AddProductModal = ({ isOpen, onClose }) => {
  const { addProduct, loading, categories } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    images: [{ url: '' }]
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCategoryChange = (value) => {
    setFormData({
      ...formData,
      category: value
    });
  };

  const handleImageUrlChange = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = { url: value };
    setFormData({
      ...formData,
      images: newImages
    });
  };

  const addImageField = () => {
    setFormData({
      ...formData,
      images: [...formData.images, { url: '' }]
    });
  };

  const removeImageField = (index) => {
    if (formData.images.length > 1) {
      const newImages = formData.images.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        images: newImages
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.description || !formData.price || !formData.category) {
      toast.error("All fields are mandatory");
      return;
    }

    if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      toast.error("Price should be a positive number");
      return;
    }

    const validImages = formData.images.filter(img => img.url.trim() !== '');
    if (validImages.length === 0) {
      toast.error("Please add atleast one image");
      return;
    }

    try {
      await addProduct({
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        category: formData.category,
        images: validImages
      });

      toast.success("Product added successfully")

      // Reset form
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        images: [{ url: '' }]
      });

      onClose();
    } catch (error) {
      toast.error("Failed to add product")
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter product name"
                required
              />
            </div>

            <div>
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="Enter price"
                required
                min="1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your product in detail..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Product Images *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addImageField}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Image
              </Button>
            </div>

            {formData.images.map((image, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  type="url"
                  value={image.url}
                  onChange={(e) => handleImageUrlChange(index, e.target.value)}
                  placeholder="Enter image URL"
                  className="flex-1"
                />
                {formData.images.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeImageField(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            <p className="text-sm text-gray-500">
              Add URLs of product images. The first image will be used as the main image.
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Trust Analysis</h4>
            <p className="text-sm text-blue-800">
              Your product will be automatically analyzed for trust factors including price verification, 
              image authenticity, and description quality. This helps maintain marketplace integrity.
            </p>
          </div>

          <div className="flex space-x-4">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Adding Product...' : 'Add Product'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductModal;
