import React, { useState } from 'react';
import { useCafe } from '../../../context/CafeContext';
import Card from '../../common/Card';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import ConfirmDialog from '../../common/ConfirmDialog';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  Sparkles,
  Coffee,
  DollarSign,
  Layers,
  UtensilsCrossed,
  Tag
} from 'lucide-react';

export default function MenuManagementView() {
  const {
    products,
    categories,
    addons,
    inventory,
    addProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    addAddon,
    updateAddon,
    deleteAddon
  } = useCafe();

  const [activeTab, setActiveTab] = useState('products'); // products, categories, addons
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Product Modals State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  // Product Form State
  const [prodForm, setProdForm] = useState({
    name: '',
    category: categories[0]?.id || 'cat-1',
    description: '',
    costPrice: 50,
    sellingPrice: 180,
    isVeg: true,
    prepTimeMinutes: 5,
    isAvailable: true,
    isFeatured: false,
    image: 'https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/latte.jpg',
    variants: [],
    inventoryIngredients: []
  });
  const [variantName, setVariantName] = useState('');
  const [variantPrice, setVariantPrice] = useState(0);
  const [recipeIngredientId, setRecipeIngredientId] = useState('');
  const [recipeQty, setRecipeQty] = useState(0.1);
  const [imageError, setImageError] = useState('');

  const handleImageFile = (file) => {
    setImageError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('Please choose an image file (PNG/JPG/WebP).');
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      setImageError('Image is large (>2.5MB). It will still upload as base64, but prefer a URL for big photos.');
    }
    const reader = new FileReader();
    reader.onload = () => setProdForm((f) => ({ ...f, image: reader.result }));
    reader.onerror = () => setImageError('Could not read that file.');
    reader.readAsDataURL(file);
  };

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Addon Modal State
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState(null);
  const [addonToDelete, setAddonToDelete] = useState(null);
  const [addonName, setAddonName] = useState('');
  const [addonPrice, setAddonPrice] = useState(40);
  const [addonCategory, setAddonCategory] = useState('Coffee');

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch =
      searchQuery.trim() === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdForm({
      name: '',
      category: categories[0]?.id || 'cat-1',
      description: '',
      costPrice: 50,
      sellingPrice: 180,
      isVeg: true,
      prepTimeMinutes: 5,
      isAvailable: true,
      isFeatured: false,
      image: 'https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/latte.jpg',
      variants: [],
      inventoryIngredients: []
    });
    setVariantName('');
    setVariantPrice(0);
    setImageError('');
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setProdForm({
      name: prod.name,
      category: prod.category,
      description: prod.description,
      costPrice: prod.costPrice,
      sellingPrice: prod.sellingPrice,
      isVeg: prod.isVeg,
      prepTimeMinutes: prod.prepTimeMinutes,
      isAvailable: prod.isAvailable,
      isFeatured: prod.isFeatured,
      image: prod.image,
      variants: Array.isArray(prod.variants) ? prod.variants : [],
      inventoryIngredients: Array.isArray(prod.inventoryIngredients) ? prod.inventoryIngredients : []
    });
    setVariantName('');
    setVariantPrice(0);
    setImageError('');
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!prodForm.name.trim()) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, prodForm);
    } else {
      addProduct(prodForm);
    }
    setIsProductModalOpen(false);
  };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    if (editingCategory) {
      updateCategory(editingCategory.id, { name: catName.trim(), slug: catName.trim().toLowerCase().replace(/\s+/g, '-') });
    } else {
      addCategory({ name: catName, slug: catName.toLowerCase().replace(/\s+/g, '-') });
    }
    setCatName('');
    setEditingCategory(null);
    setIsCatModalOpen(false);
  };

  const handleSaveAddon = (e) => {
    e.preventDefault();
    if (!addonName.trim()) return;
    if (editingAddon) {
      updateAddon(editingAddon.id, { name: addonName.trim(), price: Number(addonPrice), category: addonCategory });
    } else {
      addAddon({ name: addonName, price: Number(addonPrice), category: addonCategory });
    }
    setAddonName('');
    setAddonPrice(40);
    setEditingAddon(null);
    setIsAddonModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
            Menu Management
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Configure dishes, beverage recipes, pricing margins, categories, and custom add-ons.
          </p>
        </div>

        {/* Action Button */}
        {activeTab === 'products' ? (
          <Button onClick={handleOpenAddProduct} size="sm" icon={Plus}>
            Add Product
          </Button>
        ) : activeTab === 'categories' ? (
          <Button onClick={() => { setEditingCategory(null); setCatName(''); setIsCatModalOpen(true); }} size="sm" icon={Plus}>
            New Category
          </Button>
        ) : (
          <Button onClick={() => { setEditingAddon(null); setAddonName(''); setAddonPrice(40); setIsAddonModalOpen(true); }} size="sm" icon={Plus}>
            New Add-on
          </Button>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2 text-xs font-bold">
        {[
          { id: 'products', label: `Products (${products.length})`, icon: Coffee },
          { id: 'categories', label: `Categories (${categories.length})`, icon: Layers },
          { id: 'addons', label: `Variants & Add-ons (${addons.length})`, icon: Tag }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#DD5903] text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: PRODUCTS TABLE ================= */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          
          {/* Filters */}
          <Card className="p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-[#DD5903] text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                All Categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap ${
                    selectedCategory === c.id
                      ? 'bg-[#DD5903] text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 pl-9 pr-3 text-xs text-gray-900 dark:text-white outline-none"
              />
            </div>
          </Card>

          {/* Product Grid / Table */}
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 dark:bg-[#141414] border-b border-gray-200 dark:border-gray-800 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Product</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Cost Price</th>
                    <th className="px-5 py-3.5">Selling Price</th>
                    <th className="px-5 py-3.5">Margin</th>
                    <th className="px-5 py-3.5">Prep Time</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
                  {filteredProducts.map((product) => {
                    const margin = product.sellingPrice - product.costPrice;
                    const marginPercent = product.sellingPrice > 0 ? (margin / product.sellingPrice) * 100 : 0;
                    const categoryObj = categories.find((c) => c.id === product.category);

                    return (
                      <tr key={product.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.image}
                              alt={product.name}
                              loading="lazy"
                              decoding="async"
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    product.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                                  }`}
                                />
                                <span className="font-bold text-gray-900 dark:text-white">
                                  {product.name}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-400 line-clamp-1 max-w-xs">
                                {product.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300 font-semibold">
                          {categoryObj?.name || 'Beverage'}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-gray-500">
                          ₹{product.costPrice}
                        </td>
                        <td className="px-5 py-3.5 font-mono font-bold text-gray-900 dark:text-white">
                          ₹{product.sellingPrice}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                            ₹{margin} ({marginPercent.toFixed(0)}%)
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">
                          {product.prepTimeMinutes} mins
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() =>
                              updateProduct(product.id, { isAvailable: !product.isAvailable })
                            }
                            className="cursor-pointer"
                          >
                            <Badge variant={product.isAvailable ? 'success' : 'default'} dot>
                              {product.isAvailable ? 'In Stock' : 'Disabled'}
                            </Badge>
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEditProduct(product)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => duplicateProduct(product.id)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="Duplicate Product"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setProductToDelete(product)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

        </div>
      )}

      {/* ================= TAB 2: CATEGORIES ================= */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Card key={cat.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: cat.color || '#DD5903' }}
                >
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">{cat.name}</h4>
                  <p className="text-xs text-gray-400">
                    {products.filter((p) => p.category === cat.id).length} products linked
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setEditingCategory(cat); setCatName(cat.name); setIsCatModalOpen(true); }}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Edit category"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCategoryToDelete(cat)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Delete category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ================= TAB 3: VARIANTS & ADD-ONS ================= */}
      {activeTab === 'addons' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {addons.map((add) => (
            <Card key={add.id} className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#DD5903] tracking-wider">
                  {add.category}
                </span>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                  {add.name}
                </h4>
                <p className="text-xs font-mono text-gray-500 font-semibold mt-1">
                  Extra Price: <span className="text-emerald-600">+₹{add.price}</span>
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="success">Active</Badge>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditingAddon(add); setAddonName(add.name); setAddonPrice(add.price); setAddonCategory(add.category); setIsAddonModalOpen(true); }}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Edit add-on"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setAddonToDelete(add)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Delete add-on"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ================= PRODUCT ADD / EDIT MODAL ================= */}
      {isProductModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsProductModalOpen(false)}
          title={editingProduct ? `Edit ${editingProduct.name}` : 'Create New Menu Product'}
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsProductModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveProduct}>
                {editingProduct ? 'Save Changes' : 'Create Product'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  placeholder="e.g. Vanilla Bean Iced Frappe"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Category *
                </label>
                <select
                  value={prodForm.category}
                  onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Description / Recipe Notes
              </label>
              <textarea
                rows={2}
                value={prodForm.description}
                onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                placeholder="Details, tasting notes, allergens..."
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Cost Price (₹)
                </label>
                <input
                  type="number"
                  value={prodForm.costPrice}
                  onChange={(e) => setProdForm({ ...prodForm, costPrice: Number(e.target.value) })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={prodForm.sellingPrice}
                  onChange={(e) => setProdForm({ ...prodForm, sellingPrice: Number(e.target.value) })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Preparation Time (Mins)
                </label>
                <input
                  type="number"
                  value={prodForm.prepTimeMinutes}
                  onChange={(e) => setProdForm({ ...prodForm, prepTimeMinutes: Number(e.target.value) })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Image — URL or Upload (base64)
              </label>
              <div className="flex items-center gap-3">
                {prodForm.image ? (
                  <img src={prodForm.image} alt="preview" className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />
                ) : null}
                <input
                  type="text"
                  value={prodForm.image}
                  onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                  placeholder="https://... or paste data:image/...;base64,..."
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
                />
                <label className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold cursor-pointer whitespace-nowrap hover:bg-gray-200 dark:hover:bg-gray-700">
                  Upload
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageFile(e.target.files?.[0])} />
                </label>
              </div>
              {imageError ? <p className="text-[11px] text-amber-600 mt-1">{imageError}</p> : null}
            </div>

            {/* Variants (size / modifier options stored on product) */}
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Variants (e.g. Small / Medium / Large with price delta)
              </label>
              {(prodForm.variants || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {(prodForm.variants || []).map((v, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold">
                      {v.name} (+₹{v.price})
                      <button type="button" onClick={() => setProdForm({ ...prodForm, variants: prodForm.variants.filter((_, i) => i !== idx) })} className="text-rose-500 hover:text-rose-700 font-bold">×</button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={variantName}
                  onChange={(e) => setVariantName(e.target.value)}
                  placeholder="Variant name (e.g. Large)"
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
                />
                <input
                  type="number"
                  value={variantPrice}
                  onChange={(e) => setVariantPrice(Number(e.target.value))}
                  placeholder="+₹"
                  className="w-24 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => { if (!variantName.trim()) return; setProdForm({ ...prodForm, variants: [...(prodForm.variants || []), { name: variantName.trim(), price: Number(variantPrice || 0) }] }); setVariantName(''); setVariantPrice(0); }}
                  className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Recipe / stock link: auto-deducts inventory on order completion */}
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Recipe → Stock Link (deducted automatically when order completes)
              </label>
              {(prodForm.inventoryIngredients || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {(prodForm.inventoryIngredients || []).map((ing, idx) => {
                    const invObj = (inventory || []).find((i) => i.id === ing.ingredientId);
                    return (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-200 font-semibold">
                        {invObj?.name || ing.ingredientId}: {ing.quantity}{invObj ? ` ${invObj.unit}` : ''}
                        <button type="button" onClick={() => setProdForm({ ...prodForm, inventoryIngredients: prodForm.inventoryIngredients.filter((_, i) => i !== idx) })} className="text-rose-500 hover:text-rose-700 font-bold">×</button>
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="flex gap-2">
                <select
                  value={recipeIngredientId}
                  onChange={(e) => setRecipeIngredientId(e.target.value)}
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
                >
                  <option value="">Select raw material…</option>
                  {(inventory || []).map((inv) => (
                    <option key={inv.id} value={inv.id}>{inv.name} ({inv.currentStock} {inv.unit})</option>
                  ))}
                </select>
                <input
                  type="number" min="0.01" step="0.01"
                  value={recipeQty}
                  onChange={(e) => setRecipeQty(Number(e.target.value))}
                  placeholder="Qty"
                  className="w-24 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => { if (!recipeIngredientId) return; setProdForm({ ...prodForm, inventoryIngredients: [...(prodForm.inventoryIngredients || []), { ingredientId: recipeIngredientId, quantity: Number(recipeQty || 0) }] }); setRecipeIngredientId(''); setRecipeQty(0.1); }}
                  className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  Link
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Each unit sold deducts the linked quantity from inventory stock.</p>
            </div>

            <div className="flex items-center gap-6 pt-2 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prodForm.isAvailable}
                  onChange={(e) => setProdForm({ ...prodForm, isAvailable: e.target.checked })}
                  className="rounded text-[#DD5903] focus:ring-[#DD5903]"
                />
                <span className="font-semibold text-gray-700 dark:text-gray-300">Available for sale</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prodForm.isVeg}
                  onChange={(e) => setProdForm({ ...prodForm, isVeg: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-semibold text-gray-700 dark:text-gray-300">Vegetarian Item</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prodForm.isFeatured}
                  onChange={(e) => setProdForm({ ...prodForm, isFeatured: e.target.checked })}
                  className="rounded text-[#DD5903] focus:ring-[#DD5903]"
                />
                <span className="font-semibold text-gray-700 dark:text-gray-300">Featured / Popular Badge</span>
              </label>
            </div>
          </form>
        </Modal>
      )}

      {/* ================= NEW CATEGORY MODAL ================= */}
      {isCatModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => { setIsCatModalOpen(false); setEditingCategory(null); setCatName(''); }}
          title={editingCategory ? `Edit Category "${editingCategory.name}"` : 'Add New Menu Category'}
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => { setIsCatModalOpen(false); setEditingCategory(null); setCatName(''); }}>
                Cancel
              </Button>
              <Button onClick={handleSaveCategory}>
                {editingCategory ? 'Save Changes' : 'Save Category'}
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <label className="font-bold text-gray-700 dark:text-gray-300 block">Category Name</label>
            <input
              type="text"
              autoFocus
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g. Specialty Smoothies"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
            />
          </div>
        </Modal>
      )}

      {/* ================= NEW ADDON MODAL ================= */}
      {isAddonModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => { setIsAddonModalOpen(false); setEditingAddon(null); }}
          title={editingAddon ? `Edit Add-on "${editingAddon.name}"` : 'Add Custom Add-on / Modifier'}
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => { setIsAddonModalOpen(false); setEditingAddon(null); }}>
                Cancel
              </Button>
              <Button onClick={handleSaveAddon}>
                {editingAddon ? 'Save Changes' : 'Save Add-on'}
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Modifier Name</label>
              <input
                type="text"
                autoFocus
                value={addonName}
                onChange={(e) => setAddonName(e.target.value)}
                placeholder="e.g. Extra Hazelnut Syrup"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Additional Price (₹)</label>
              <input
                type="number"
                value={addonPrice}
                onChange={(e) => setAddonPrice(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* ================= DELETE CONFIRMATION ================= */}
      {productToDelete && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setProductToDelete(null)}
          title={`Delete ${productToDelete.name}`}
          message="Are you sure you want to remove this product from the cafe menu? This action cannot be undone."
          confirmText="Yes, Delete Product"
          onConfirm={() => deleteProduct(productToDelete.id)}
        />
      )}

      {categoryToDelete && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setCategoryToDelete(null)}
          title={`Delete category "${categoryToDelete.name}"`}
          message="Products linked to this category will remain but show an unlinked category. Continue?"
          confirmText="Yes, Delete Category"
          onConfirm={() => { deleteCategory(categoryToDelete.id); setCategoryToDelete(null); }}
        />
      )}

      {addonToDelete && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setAddonToDelete(null)}
          title={`Delete add-on "${addonToDelete.name}"`}
          message="Are you sure you want to remove this add-on / modifier? This action cannot be undone."
          confirmText="Yes, Delete Add-on"
          onConfirm={() => { deleteAddon(addonToDelete.id); setAddonToDelete(null); }}
        />
      )}

    </div>
  );
}
