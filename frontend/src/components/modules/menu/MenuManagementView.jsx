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
    addProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
    addCategory,
    updateCategory,
    addAddon,
    updateAddon
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
    image: 'https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/latte.jpg'
  });

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catName, setCatName] = useState('');

  // Addon Modal State
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
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
      image: 'https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/latte.jpg'
    });
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
      image: prod.image
    });
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
    addCategory({ name: catName, slug: catName.toLowerCase().replace(/\s+/g, '-') });
    setCatName('');
    setIsCatModalOpen(false);
  };

  const handleSaveAddon = (e) => {
    e.preventDefault();
    if (!addonName.trim()) return;
    addAddon({ name: addonName, price: Number(addonPrice), category: addonCategory });
    setAddonName('');
    setAddonPrice(40);
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
          <Button onClick={() => setIsCatModalOpen(true)} size="sm" icon={Plus}>
            New Category
          </Button>
        ) : (
          <Button onClick={() => setIsAddonModalOpen(true)} size="sm" icon={Plus}>
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
              <Badge variant="success">Active</Badge>
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
                Image Web URL
              </label>
              <input
                type="url"
                value={prodForm.image}
                onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                placeholder="https://..."
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
              />
            </div>

            <div className="flex items-center gap-6 pt-2">
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
          onClose={() => setIsCatModalOpen(false)}
          title="Add New Menu Category"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsCatModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCategory}>
                Save Category
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
          onClose={() => setIsAddonModalOpen(false)}
          title="Add Custom Add-on / Modifier"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsAddonModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAddon}>
                Save Add-on
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

    </div>
  );
}
