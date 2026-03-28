'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Package, 
  Plus, 
  Pencil, 
  Trash2, 
  Search,
  Loader2,
  Leaf,
  WheatOff,
  X,
  Upload,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Settings
} from 'lucide-react';
import { menuApi, Category, MenuItem } from '@/lib/api';

interface CategoryModalProps {
  category: Category | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSave: (data: Partial<Category>) => void;
}

function CategoryModal({ category, isOpen, isLoading, onClose, onSave }: CategoryModalProps) {
  const formKey = category?.id ?? 'new';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isAvailable, setIsAvailable] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setDescription(category.description || '');
      setSortOrder(category.sortOrder ?? 0);
      setIsAvailable(category.isActive ?? true);
      setImageUrl(category.imageUrl || '');
    } else {
      setName('');
      setDescription('');
      setSortOrder(0);
      setIsAvailable(true);
      setImageUrl('');
    }
  }, [formKey]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, description, sortOrder, isActive: isAvailable, imageUrl });
  };

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const { fileUrl } = await menuApi.uploadFile(file, token ?? undefined, 'category');
      setImageUrl(fileUrl);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">
            {category ? 'Edit Category' : 'Add Category'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                isDragging ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {imageUrl ? (
                <div className="relative">
                  <img src={imageUrl} alt="Category" className="w-full h-32 object-cover rounded-lg mx-auto" />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="py-4">
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Drag & drop an image or click to browse</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="category-image-upload"
                      />
                      <label
                        htmlFor="category-image-upload"
                        className="mt-2 inline-block text-sm text-orange-600 cursor-pointer hover:text-orange-700"
                      >
                        Browse files
                      </label>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              min={0}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAvailable(!isAvailable)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isAvailable ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAvailable ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-700">Available</span>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {category ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface MenuItemModalProps {
  item: MenuItem | null;
  categories: Category[];
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSave: (data: Partial<MenuItem>) => void;
}

function MenuItemModal({ item, categories, isOpen, isLoading, onClose, onSave }: MenuItemModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [isVegan, setIsVegan] = useState(false);
  const [isGlutenFree, setIsGlutenFree] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [preparationTime, setPreparationTime] = useState(15);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setDescription(item.description || '');
      setPrice(String(item.price) || '');
      setCategoryId(item.categoryId || '');
      setImageUrl(item.imageUrl || '');
      setIsVegetarian(item.isVegetarian ?? false);
      setIsVegan(item.isVegan ?? false);
      setIsGlutenFree(item.isGlutenFree ?? false);
      setIsAvailable(item.isAvailable ?? true);
      setStockQuantity(item.stockQuantity ?? 0);
      setPreparationTime(item.preparationTime ?? 15);
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setCategoryId('');
      setImageUrl('');
      setIsVegetarian(false);
      setIsVegan(false);
      setIsGlutenFree(false);
      setIsAvailable(true);
      setStockQuantity(0);
      setPreparationTime(15);
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description,
      price: price,
      categoryId,
      imageUrl,
      isVegetarian,
      isVegan,
      isGlutenFree,
      isAvailable,
      stockQuantity,
      preparationTime,
    });
  };

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const { fileUrl } = await menuApi.uploadFile(file, token ?? undefined, 'menu-item');
      setImageUrl(fileUrl);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">
            {item ? 'Edit Menu Item' : 'Add Menu Item'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
              isDragging ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
            }`}
          >
            {imageUrl ? (
              <div className="relative">
                <img src={imageUrl} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="py-4">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Drag & drop an image or</p>
                <label className="cursor-pointer text-orange-600 hover:text-orange-700 text-sm font-medium">
                  browse
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
                {isUploading && <Loader2 className="w-5 h-5 animate-spin mx-auto mt-2 text-orange-500" />}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={isVegetarian}
                onChange={(e) => setIsVegetarian(e.target.checked)}
                className="w-4 h-4 text-orange-500 rounded"
              />
              <span className="text-sm">Vegetarian</span>
            </label>
            <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={isVegan}
                onChange={(e) => setIsVegan(e.target.checked)}
                className="w-4 h-4 text-orange-500 rounded"
              />
              <span className="text-sm">Vegan</span>
            </label>
            <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={isGlutenFree}
                onChange={(e) => setIsGlutenFree(e.target.checked)}
                className="w-4 h-4 text-orange-500 rounded"
              />
              <span className="text-sm">Gluten Free</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
              <input
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (min)</label>
              <input
                type="number"
                value={preparationTime}
                onChange={(e) => setPreparationTime(Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                min={1}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAvailable(!isAvailable)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isAvailable ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAvailable ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-700">Available</span>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {item ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface CustomizationModalProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
  onEditGroup: (group: any) => void;
  onDeleteGroup: (id: string) => void;
  onEditOption: (option: any) => void;
  onDeleteOption: (id: string) => void;
  onAddOption: (groupId: string) => void;
  onAddGroup: () => void;
}

function CustomizationModal({ item, isOpen, onClose, onEditGroup, onDeleteGroup, onEditOption, onDeleteOption, onAddOption, onAddGroup }: CustomizationModalProps) {
  if (!isOpen) return null;

  const groups = item.customizations || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Manage Customizations</h2>
            <p className="text-sm text-gray-500">{item.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {groups.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No customizations yet</p>
              <p className="text-sm text-gray-400 mt-1">Add customization groups to this item</p>
            </div>
          ) : (
            groups.map((group: any) => (
              <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{group.name}</h3>
                    <p className="text-xs text-gray-500">
                      {group.type === 'SINGLE' ? 'Single Select' : 'Multi Select'}
                      {group.isRequired && ' • Required'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onEditGroup(group)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm('Delete this customization group?')) {
                          onDeleteGroup(group.id);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 ml-2 pl-3 border-l-2 border-gray-100">
                  {group.options?.map((option: any) => (
                    <div key={option.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">{option.name}</span>
                        {option.priceModifier > 0 && (
                          <span className="text-xs text-orange-600">+₹{option.priceModifier}</span>
                        )}
                        {option.isDefault && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Default</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => onEditOption(option)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm('Delete this option?')) {
                              onDeleteOption(option.id);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => onAddOption(group.id)}
                    className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1 mt-2"
                  >
                    <Plus className="w-3 h-3" /> Add Option
                  </button>
                </div>
              </div>
            ))
          )}

          <button
            onClick={onAddGroup}
            className="w-full py-2.5 border-2 border-dashed border-gray-300 text-gray-500 font-medium rounded-lg hover:border-orange-500 hover:text-orange-600 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Customization Group
          </button>
        </div>
      </div>
    </div>
  );
}

interface GroupModalProps {
  group: any;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

function GroupModal({ group, isOpen, isLoading, onClose, onSave }: GroupModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'SINGLE' | 'MULTIPLE'>('SINGLE');
  const [isRequired, setIsRequired] = useState(false);
  const [minSelections, setMinSelections] = useState(0);
  const [maxSelections, setMaxSelections] = useState(1);

  useEffect(() => {
    if (group) {
      setName(group.name || '');
      setType(group.type || 'SINGLE');
      setIsRequired(group.isRequired ?? false);
      setMinSelections(group.minSelections ?? 0);
      setMaxSelections(group.maxSelections ?? 1);
    } else {
      setName('');
      setType('SINGLE');
      setIsRequired(false);
      setMinSelections(0);
      setMaxSelections(1);
    }
  }, [group, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {group ? 'Edit' : 'Add'} Customization Group
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., Size, Toppings"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'SINGLE' | 'MULTIPLE')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="SINGLE">Single Select</option>
              <option value="MULTIPLE">Multiple Select</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsRequired(!isRequired)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isRequired ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isRequired ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-700">Required</span>
          </div>
          {type === 'MULTIPLE' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Selections</label>
                <input
                  type="number"
                  value={minSelections}
                  onChange={(e) => setMinSelections(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Selections</label>
                <input
                  type="number"
                  value={maxSelections}
                  onChange={(e) => setMaxSelections(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  min={1}
                />
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ name, type, isRequired, minSelections, maxSelections })}
            disabled={isLoading || !name}
            className="flex-1 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (group ? 'Update' : 'Create')}
          </button>
        </div>
      </div>
    </div>
  );
}

interface OptionModalProps {
  option: any;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

function OptionModal({ option, isOpen, isLoading, onClose, onSave }: OptionModalProps) {
  const [name, setName] = useState('');
  const [priceModifier, setPriceModifier] = useState(0);
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (option) {
      setName(option.name || '');
      setPriceModifier(option.priceModifier ?? 0);
      setIsDefault(option.isDefault ?? false);
    } else {
      setName('');
      setPriceModifier(0);
      setIsDefault(false);
    }
  }, [option, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {option?.name ? 'Edit' : 'Add'} Option
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., Small, Medium, Large"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price Modifier (₹)</label>
            <input
              type="number"
              value={priceModifier}
              onChange={(e) => setPriceModifier(Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              min={0}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDefault(!isDefault)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isDefault ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDefault ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-700">Default Option</span>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ name, priceModifier, isDefault })}
            disabled={isLoading || !name}
            className="flex-1 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (option?.name ? 'Update' : 'Create')}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminMenuPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'categories' | 'items'>('categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [showMenuItemModal, setShowMenuItemModal] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'category' | 'menuItem'; id: string; name: string } | null>(null);

  const [selectedItemForCustomizations, setSelectedItemForCustomizations] = useState<any | null>(null);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any | null>(null);
  const [editingOption, setEditingOption] = useState<any | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showOptionModal, setShowOptionModal] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : undefined;

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => menuApi.getCategories(token ?? undefined),
  });

  const { data: menuItems, isLoading: loadingItems } = useQuery({
    queryKey: ['admin-menu-items'],
    queryFn: () => menuApi.getMenuItems(token ?? undefined),
  });

  useEffect(() => {
    if (menuItems && selectedItemForCustomizations) {
      const itemsArray = Array.isArray(menuItems) ? menuItems : menuItems.items;
      const updatedItem = itemsArray.find((item: any) => item.id === selectedItemForCustomizations.id);
      if (updatedItem) {
        setSelectedItemForCustomizations(updatedItem);
      }
    }
  }, [menuItems, selectedItemForCustomizations?.id]);

  const createCategoryMutation = useMutation({
    mutationFn: (data: Partial<Category>) => menuApi.createCategory(data, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setShowCategoryModal(false);
      setEditingCategory(null);
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) => 
      menuApi.updateCategory(id, data, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setShowCategoryModal(false);
      setEditingCategory(null);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => menuApi.deleteCategory(id, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setDeleteConfirm(null);
    },
  });

  const handleDeleteCategory = (id: string, name: string) => {
    setDeleteConfirm({ type: 'category', id, name });
  };

  const handleDeleteMenuItem = (id: string, name: string) => {
    setDeleteConfirm({ type: 'menuItem', id, name });
  };

  const confirmDelete = () => {
    if (deleteConfirm?.type === 'category') {
      deleteCategoryMutation.mutate(deleteConfirm.id);
    } else if (deleteConfirm?.type === 'menuItem') {
      deleteMenuItemMutation.mutate(deleteConfirm.id);
    }
  };

  const createMenuItemMutation = useMutation({
    mutationFn: (data: Partial<MenuItem>) => menuApi.createMenuItem(data, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] });
      setShowMenuItemModal(false);
      setEditingMenuItem(null);
    },
  });

  const updateMenuItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MenuItem> }) => 
      menuApi.updateMenuItem(id, data, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] });
      setShowMenuItemModal(false);
      setEditingMenuItem(null);
    },
  });

  const deleteMenuItemMutation = useMutation({
    mutationFn: (id: string) => menuApi.deleteMenuItem(id, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] });
    },
  });

  const createCustomizationGroupMutation = useMutation({
    mutationFn: ({ menuItemId, data }: { menuItemId: string; data: any }) => 
      menuApi.createCustomizationGroup(menuItemId, data, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] }).then(() => {
        queryClient.refetchQueries({ queryKey: ['admin-menu-items'] });
      });
    },
  });

  const updateCustomizationGroupMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      menuApi.updateCustomizationGroup(id, data, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] }).then(() => {
        queryClient.refetchQueries({ queryKey: ['admin-menu-items'] });
      });
    },
  });

  const deleteCustomizationGroupMutation = useMutation({
    mutationFn: (id: string) => menuApi.deleteCustomizationGroup(id, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] }).then(() => {
        queryClient.refetchQueries({ queryKey: ['admin-menu-items'] });
      });
    },
  });

  const createCustomizationOptionMutation = useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: any }) => 
      menuApi.createCustomizationOption(groupId, data, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] }).then(() => {
        queryClient.refetchQueries({ queryKey: ['admin-menu-items'] });
      });
    },
  });

  const updateCustomizationOptionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      menuApi.updateCustomizationOption(id, data, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] }).then(() => {
        queryClient.refetchQueries({ queryKey: ['admin-menu-items'] });
      });
    },
  });

  const deleteCustomizationOptionMutation = useMutation({
    mutationFn: (id: string) => menuApi.deleteCustomizationOption(id, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] }).then(() => {
        queryClient.refetchQueries({ queryKey: ['admin-menu-items'] });
      });
    },
  });

  const categoriesArray = Array.isArray(categories) 
    ? categories 
    : (categories as any)?.items || [];
  
  const filteredCategories = categoriesArray.filter((cat: any) => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const itemsArray = Array.isArray(menuItems) 
    ? menuItems 
    : (menuItems as any)?.items || [];
  
  const filteredItems = itemsArray
    .filter((item: any) => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a: any, b: any) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (typeof aVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal || '')
          : (bVal || '').localeCompare(aVal);
      }
      if (typeof aVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (typeof aVal === 'boolean') {
        return sortDirection === 'asc' 
          ? (aVal === bVal ? 0 : aVal ? 1 : -1)
          : (aVal === bVal ? 0 : aVal ? -1 : 1);
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 ml-1 text-orange-600" />
      : <ArrowDown className="w-4 h-4 ml-1 text-orange-600" />;
  };

  const handleOpenCategoryModal = (category?: Category) => {
    setEditingCategory(category || null);
    setShowCategoryModal(true);
  };

  const handleSaveCategory = (data: Partial<Category>) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleOpenMenuItemModal = (item?: MenuItem) => {
    setEditingMenuItem(item || null);
    setShowMenuItemModal(true);
  };

  const handleSaveMenuItem = (data: Partial<MenuItem>) => {
    if (editingMenuItem) {
      updateMenuItemMutation.mutate({ id: editingMenuItem.id, data });
    } else {
      createMenuItemMutation.mutate(data);
    }
  };

  const toggleCategoryAvailability = (id: string, currentStatus: boolean) => {
    updateCategoryMutation.mutate({ id, data: { isActive: !currentStatus } });
  };

  const toggleItemAvailability = (id: string, currentStatus: boolean) => {
    updateMenuItemMutation.mutate({ id, data: { isAvailable: !currentStatus } });
  };

  const toggleVegetarian = (id: string, currentStatus: boolean) => {
    updateMenuItemMutation.mutate({ id, data: { isVegetarian: !currentStatus } });
  };

  const toggleGlutenFree = (id: string, currentStatus: boolean) => {
    updateMenuItemMutation.mutate({ id, data: { isGlutenFree: !currentStatus } });
  };

  const renderCategoriesTab = () => {
    if (loadingCategories) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category: any) => (
            <div
              key={category.id}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {category.imageUrl && (
                <div className="h-32 overflow-hidden">
                  <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-500">{category.description}</p>
                  </div>
                  <button
                    onClick={() => toggleCategoryAvailability(category.id, category.isActive)}
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      category.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {category.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
              <div className="px-4 pb-4 pt-3">
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">Order: {category.sortOrder}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenCategoryModal(category)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(category.id, category.name)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  const renderItemsTab = () => {
    if (loadingItems) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
        </div>
      );
    }

    if (filteredItems.length === 0) {
      return (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No menu items found</p>
          <p className="text-sm text-gray-400 mt-1">Add items to get started</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th 
                className="text-left py-3 px-4 text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">Item <SortIcon column="name" /></div>
              </th>
              <th 
                className="text-left py-3 px-4 text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center">Price <SortIcon column="price" /></div>
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Category</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Flags</th>
              <th 
                className="text-left py-3 px-4 text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('stockQuantity')}
              >
                <div className="flex items-center">Stock <SortIcon column="stockQuantity" /></div>
              </th>
              <th 
                className="text-left py-3 px-4 text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('isAvailable')}
              >
                <div className="flex items-center">Status <SortIcon column="isAvailable" /></div>
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((item: any) => (
              <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">{item.description}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm font-medium">₹{Number(item.price).toFixed(0)}</td>
                <td className="py-3 px-4 text-sm text-gray-500">
                  {categoriesArray.find((c: any) => c.id === item.categoryId)?.name || '-'}
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleVegetarian(item.id, item.isVegetarian)}
                      className={`p-1 rounded ${item.isVegetarian ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}
                      title="Vegetarian"
                    >
                      <Leaf className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleGlutenFree(item.id, item.isGlutenFree)}
                      className={`p-1 rounded ${item.isGlutenFree ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'}`}
                      title="Gluten Free"
                    >
                      <WheatOff className="w-4 h-4" />
                    </button>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm">
                  <span className={item.stockQuantity <= 5 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                    {item.stockQuantity}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => toggleItemAvailability(item.id, item.isAvailable)}
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      item.isAvailable
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </button>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex gap-1 justify-end">
                    <button 
                      onClick={() => {
                        setSelectedItemForCustomizations(item);
                        setShowCustomizationModal(true);
                      }}
                      className="p-1.5 text-orange-500 hover:text-orange-700 rounded"
                      title="Manage Customizations"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleOpenMenuItemModal(item)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteMenuItem(item.id, item.name)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} items
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="px-4 py-2 text-sm font-medium text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
        <p className="text-gray-500 mt-1">Manage categories, menu items, and customizations</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'categories'
                ? 'text-orange-600 border-b-2 border-orange-600 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Categories ({categoriesArray.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'items'
                ? 'text-orange-600 border-b-2 border-orange-600 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Menu Items ({itemsArray.length || 0})
          </button>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            {activeTab === 'categories' ? (
              <button
                onClick={() => handleOpenCategoryModal()}
                className="px-4 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            ) : (
              <button
                onClick={() => setShowMenuItemModal(true)}
                className="px-4 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
        {activeTab === 'categories' ? renderCategoriesTab() : (
            <>
              {renderItemsTab()}
              {renderPagination()}
            </>
          )}
        </div>
      </div>

      <CategoryModal
        category={editingCategory}
        isOpen={showCategoryModal}
        isLoading={createCategoryMutation.isPending || updateCategoryMutation.isPending}
        onClose={() => {
          setShowCategoryModal(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
      />

      <MenuItemModal
        item={editingMenuItem}
        categories={categoriesArray}
        isOpen={showMenuItemModal}
        isLoading={createMenuItemMutation.isPending || updateMenuItemMutation.isPending}
        onClose={() => {
          setShowMenuItemModal(false);
          setEditingMenuItem(null);
        }}
        onSave={handleSaveMenuItem}
      />

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteCategoryMutation.isPending || deleteMenuItemMutation.isPending}
                className="flex-1 py-2.5 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteCategoryMutation.isPending || deleteMenuItemMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showCustomizationModal && selectedItemForCustomizations && (
        <CustomizationModal
          item={selectedItemForCustomizations}
          isOpen={showCustomizationModal}
          onClose={() => {
            setShowCustomizationModal(false);
            setSelectedItemForCustomizations(null);
          }}
          onEditGroup={(group) => {
            setEditingGroup(group);
            setShowGroupModal(true);
          }}
          onDeleteGroup={(id) => {
            if (confirm('Delete this customization group?')) {
              deleteCustomizationGroupMutation.mutate(id);
            }
          }}
          onEditOption={(option) => {
            setEditingOption(option);
            setShowOptionModal(true);
          }}
          onDeleteOption={(id) => {
            if (confirm('Delete this option?')) {
              deleteCustomizationOptionMutation.mutate(id);
            }
          }}
          onAddOption={(groupId) => {
            setEditingOption({ groupId });
            setShowOptionModal(true);
          }}
          onAddGroup={() => {
            setEditingGroup(null);
            setShowGroupModal(true);
          }}
        />
      )}

      {showGroupModal && (
        <GroupModal
          group={editingGroup}
          isOpen={showGroupModal}
          isLoading={createCustomizationGroupMutation.isPending || updateCustomizationGroupMutation.isPending}
          onClose={() => {
            setShowGroupModal(false);
            setEditingGroup(null);
          }}
          onSave={(data) => {
            if (editingGroup) {
              updateCustomizationGroupMutation.mutate({ id: editingGroup.id, data });
            } else {
              createCustomizationGroupMutation.mutate({ menuItemId: selectedItemForCustomizations.id, data });
            }
            setShowGroupModal(false);
            setEditingGroup(null);
          }}
        />
      )}

      {showOptionModal && (
        <OptionModal
          option={editingOption}
          isOpen={showOptionModal}
          isLoading={createCustomizationOptionMutation.isPending || updateCustomizationOptionMutation.isPending}
          onClose={() => {
            setShowOptionModal(false);
            setEditingOption(null);
          }}
          onSave={(data) => {
            console.log('Saving option:', { editingOption, data });
            if (editingOption && editingOption.id) {
              console.log('Updating option with id:', editingOption.id);
              updateCustomizationOptionMutation.mutate({ id: editingOption.id, data });
            } else if (editingOption && editingOption.groupId) {
              console.log('Creating new option for group:', editingOption.groupId);
              createCustomizationOptionMutation.mutate({ groupId: editingOption.groupId, data });
            } else {
              console.error('Invalid editing option state - no id or groupId:', editingOption);
              alert('Error: Cannot save option. Missing ID. Please refresh and try again.');
              setShowOptionModal(false);
              setEditingOption(null);
              return;
            }
            setShowOptionModal(false);
            setEditingOption(null);
          }}
        />
      )}
    </div>
  );
}

export default AdminMenuPage;
