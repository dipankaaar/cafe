import React, { useState, useMemo, useEffect } from 'react';
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
  Globe,
  Tag,
  ArrowUpDown,
  Check,
  X,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { formatINR } from '../../../utils/formatters';

export default function MenuManagementView({ initialModule = 'menu' }) {
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

  // Navigation tab: 'table' | 'online' | 'categories' | 'addons'
  const [activeTab, setActiveTab] = useState(() => {
    if (initialModule === 'menu-online') return 'online';
    if (initialModule === 'menu-categories') return 'categories';
    if (initialModule === 'menu-addons') return 'addons';
    return 'table';
  });

  // Synchronize activeTab when initialModule changes from Sidebar navigation
  useEffect(() => {
    if (initialModule === 'menu-online') setActiveTab('online');
    else if (initialModule === 'menu-categories') setActiveTab('categories');
    else if (initialModule === 'menu-addons') setActiveTab('addons');
    else if (initialModule === 'menu-table' || initialModule === 'menu') setActiveTab('table');
  }, [initialModule]);

  // Search, Filter & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'available' | 'unavailable' | 'channel_active' | 'channel_inactive'
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'category'

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  // Quick Price Edit Modal
  const [quickPriceProduct, setQuickPriceProduct] = useState(null);
  const [quickTablePrice, setQuickTablePrice] = useState('');
  const [quickOnlinePrice, setQuickOnlinePrice] = useState('');

  // Category & Addon Modals
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState(null);
  const [addonToDelete, setAddonToDelete] = useState(null);
  const [addonName, setAddonName] = useState('');
  const [addonPrice, setAddonPrice] = useState(40);
  const [addonCategory, setAddonCategory] = useState('Coffee');

  // Product Form State
  const [prodForm, setProdForm] = useState({
    name: '',
    category: categories[0]?.id || 'cat-1',
    description: '',
    costPrice: 50,
    tablePrice: 180,
    onlinePrice: 199,
    tableEnabled: true,
    onlineEnabled: true,
    isVeg: true,
    prepTimeMinutes: 5,
    isAvailable: true,
    isFeatured: false,
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=60',
    variants: [],
    inventoryIngredients: []
  });
  const [variantName, setVariantName] = useState('');
  const [variantPrice, setVariantPrice] = useState(0);
  const [recipeIngredientId, setRecipeIngredientId] = useState('');
  const [recipeQty, setRecipeQty] = useState(0.1);
  const [imageError, setImageError] = useState('');

  // Helper getters
  const getTablePrice = (p) => (p.tablePrice !== undefined && p.tablePrice !== null && p.tablePrice !== '' ? Number(p.tablePrice) : Number(p.sellingPrice ?? p.price ?? 0));
  const getOnlinePrice = (p) => (p.onlinePrice !== undefined && p.onlinePrice !== null && p.onlinePrice !== '' ? Number(p.onlinePrice) : Number(p.sellingPrice ?? p.price ?? 0));
  const isTableActive = (p) => (p.tableEnabled !== undefined ? Boolean(p.tableEnabled) : (p.table_enabled !== undefined ? Boolean(p.table_enabled) : true));
  const isOnlineActive = (p) => (p.onlineEnabled !== undefined ? Boolean(p.onlineEnabled) : (p.online_enabled !== undefined ? Boolean(p.online_enabled) : true));

  // Tab counts
  const tableCount = products.filter(isTableActive).length;
  const onlineCount = products.filter(isOnlineActive).length;

  // Filter & Sort Products for active channel
  const filteredProducts = useMemo(() => {
    if (activeTab !== 'table' && activeTab !== 'online') return [];

    return products
      .filter((p) => {
        // Channel filter: strictly show items configured for this channel unless viewing inactive
        if (activeTab === 'table') {
          if (statusFilter === 'channel_inactive') {
            if (isTableActive(p)) return false;
          } else {
            if (!isTableActive(p)) return false;
          }
        } else if (activeTab === 'online') {
          if (statusFilter === 'channel_inactive') {
            if (isOnlineActive(p)) return false;
          } else {
            if (!isOnlineActive(p)) return false;
          }
        }

        // Category filter
        const matchCat = selectedCategory === 'all' || p.category === selectedCategory;

        // Search query
        const q = searchQuery.trim().toLowerCase();
        const matchSearch =
          q === '' ||
          p.name.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q);

        // Availability filter
        let matchStatus = true;
        if (statusFilter === 'available') matchStatus = p.isAvailable === true;
        if (statusFilter === 'unavailable') matchStatus = p.isAvailable === false;

        return matchCat && matchSearch && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
        if (sortBy === 'price-asc') {
          const priceA = activeTab === 'table' ? getTablePrice(a) : getOnlinePrice(a);
          const priceB = activeTab === 'table' ? getTablePrice(b) : getOnlinePrice(b);
          return priceA - priceB;
        }
        if (sortBy === 'price-desc') {
          const priceA = activeTab === 'table' ? getTablePrice(a) : getOnlinePrice(a);
          const priceB = activeTab === 'table' ? getTablePrice(b) : getOnlinePrice(b);
          return priceB - priceA;
        }
        if (sortBy === 'category') {
          return (a.category || '').localeCompare(b.category || '');
        }
        return 0;
      });
  }, [products, activeTab, selectedCategory, searchQuery, statusFilter, sortBy]);

  // Image Upload handler
  const handleImageFile = (file) => {
    setImageError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('Please choose an image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setImageError('Image is large (>3MB). Prefer compressed images or direct URLs.');
    }
    const reader = new FileReader();
    reader.onload = () => setProdForm((f) => ({ ...f, image: reader.result }));
    reader.onerror = () => setImageError('Could not read image file.');
    reader.readAsDataURL(file);
  };

  // Open Add Product modal
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdForm({
      name: '',
      category: categories[0]?.id || 'cat-1',
      description: '',
      costPrice: 50,
      tablePrice: 180,
      onlinePrice: 199,
      tableEnabled: activeTab === 'table' ? true : false,
      onlineEnabled: activeTab === 'online' ? true : false,
      isVeg: true,
      prepTimeMinutes: 5,
      isAvailable: true,
      isFeatured: false,
      image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=60',
      variants: [],
      inventoryIngredients: []
    });
    setVariantName('');
    setVariantPrice(0);
    setImageError('');
    setIsProductModalOpen(true);
  };

  // Open Edit Product modal
  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setProdForm({
      name: prod.name,
      category: prod.category,
      description: prod.description || '',
      costPrice: prod.costPrice || 0,
      tablePrice: getTablePrice(prod),
      onlinePrice: getOnlinePrice(prod),
      tableEnabled: isTableActive(prod),
      onlineEnabled: isOnlineActive(prod),
      isVeg: prod.isVeg !== false,
      prepTimeMinutes: prod.prepTimeMinutes || 5,
      isAvailable: prod.isAvailable !== false,
      isFeatured: Boolean(prod.isFeatured),
      image: prod.image || '',
      variants: Array.isArray(prod.variants) ? prod.variants : [],
      inventoryIngredients: Array.isArray(prod.inventoryIngredients) ? prod.inventoryIngredients : []
    });
    setVariantName('');
    setVariantPrice(0);
    setImageError('');
    setIsProductModalOpen(true);
  };

  // Save Product (Create or Update)
  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!prodForm.name.trim()) return;

    const payload = {
      ...prodForm,
      tablePrice: Number(prodForm.tablePrice || 0),
      onlinePrice: Number(prodForm.onlinePrice || 0),
      sellingPrice: Number(prodForm.onlinePrice || prodForm.tablePrice || 0),
      tableEnabled: Boolean(prodForm.tableEnabled),
      onlineEnabled: Boolean(prodForm.onlineEnabled)
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
    } else {
      addProduct(payload);
    }
    setIsProductModalOpen(false);
  };

  // Quick Price Edit
  const handleOpenQuickPrice = (prod) => {
    setQuickPriceProduct(prod);
    setQuickTablePrice(String(getTablePrice(prod)));
    setQuickOnlinePrice(String(getOnlinePrice(prod)));
  };

  const handleSaveQuickPrice = (e) => {
    e.preventDefault();
    if (!quickPriceProduct) return;

    const newTablePrice = parseFloat(quickTablePrice);
    const newOnlinePrice = parseFloat(quickOnlinePrice);

    if (isNaN(newTablePrice) && isNaN(newOnlinePrice)) return;

    updateProduct(quickPriceProduct.id, {
      tablePrice: isNaN(newTablePrice) ? getTablePrice(quickPriceProduct) : newTablePrice,
      onlinePrice: isNaN(newOnlinePrice) ? getOnlinePrice(quickPriceProduct) : newOnlinePrice,
      sellingPrice: !isNaN(newOnlinePrice) ? newOnlinePrice : newTablePrice
    });

    setQuickPriceProduct(null);
  };

  // Quick Channel Toggle
  const handleToggleChannel = (prod, channel) => {
    if (channel === 'table') {
      const current = isTableActive(prod);
      updateProduct(prod.id, { tableEnabled: !current });
    } else if (channel === 'online') {
      const current = isOnlineActive(prod);
      updateProduct(prod.id, { onlineEnabled: !current });
    }
  };

  // Quick Availability Toggle
  const handleToggleAvailability = (prod) => {
    updateProduct(prod.id, { isAvailable: !prod.isAvailable });
  };

  // Category Save
  const handleSaveCategory = (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: catName.trim(),
        slug: catName.trim().toLowerCase().replace(/\s+/g, '-')
      });
    } else {
      addCategory({
        name: catName.trim(),
        slug: catName.trim().toLowerCase().replace(/\s+/g, '-')
      });
    }
    setCatName('');
    setEditingCategory(null);
    setIsCatModalOpen(false);
  };

  // Addon Save
  const handleSaveAddon = (e) => {
    e.preventDefault();
    if (!addonName.trim()) return;
    if (editingAddon) {
      updateAddon(editingAddon.id, {
        name: addonName.trim(),
        price: Number(addonPrice),
        category: addonCategory
      });
    } else {
      addAddon({
        name: addonName.trim(),
        price: Number(addonPrice),
        category: addonCategory
      });
    }
    setAddonName('');
    setAddonPrice(40);
    setEditingAddon(null);
    setIsAddonModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* ================= TOP HEADER ================= */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
            <span>Menu Management</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Separate table dining & online ordering menus with independent prices, availability, and instant controls.
          </p>
        </div>

        {/* Primary Action Button */}
        {(activeTab === 'table' || activeTab === 'online') ? (
          <Button onClick={handleOpenAddProduct} size="sm" icon={Plus}>
            {activeTab === 'table' ? 'Add Item to Table Menu' : 'Add Item to Online Menu'}
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

      {/* ================= PRIMARY TWO SECTIONS: [ TABLE MENU ] [ ONLINE MENU ] ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-800 pb-3">
        {/* Main Two Sections Tabs */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#181818] p-1.5 rounded-xl border border-gray-200 dark:border-gray-800">
          <button
            onClick={() => { setActiveTab('table'); setStatusFilter('all'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'table'
                ? 'bg-[#DD5903] text-white shadow-md shadow-orange-950/40'
                : 'text-gray-600 dark:text-gray-300 hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Table Menu</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'table' ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
              {tableCount}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('online'); setStatusFilter('all'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'online'
                ? 'bg-[#DD5903] text-white shadow-md shadow-orange-950/40'
                : 'text-gray-600 dark:text-gray-300 hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Online Menu</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'online' ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
              {onlineCount}
            </span>
          </button>
        </div>

        {/* Secondary Management Tabs: Categories & Addons */}
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('addons')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'addons'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Variants & Add-ons ({addons.length})</span>
          </button>
        </div>
      </div>

      {/* ================= TABLE MENU / ONLINE MENU CONTENT ================= */}
      {(activeTab === 'table' || activeTab === 'online') && (
        <div className="space-y-4">
          
          {/* Section Banner Note */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#DD5903] text-white flex items-center justify-center font-bold flex-shrink-0">
                {activeTab === 'table' ? <UtensilsCrossed className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">
                  {activeTab === 'table' ? 'Dining Room & Table Menu Items' : 'Online Ordering & Delivery Menu Items'}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {activeTab === 'table'
                    ? 'Only items enabled for table dining are shown here. Customers at tables will see the Table Price.'
                    : 'Only items enabled for online orders are shown here. Customers ordering online will see the Online Price.'}
                </p>
              </div>
            </div>

            {/* Quick Channel Stats */}
            <div className="hidden md:flex items-center gap-4 text-right">
              <div>
                <span className="text-[10px] text-gray-400 uppercase block font-semibold">Active in this Menu</span>
                <span className="text-sm font-bold font-mono text-[#DD5903]">
                  {activeTab === 'table' ? tableCount : onlineCount} items
                </span>
              </div>
            </div>
          </div>

          {/* Filters & Search Bar */}
          <Card className="p-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 text-xs custom-scrollbar">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#DD5903] text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                All Categories ({products.filter(activeTab === 'table' ? isTableActive : isOnlineActive).length})
              </button>
              {categories.map((c) => {
                const count = products.filter(
                  (p) => p.category === c.id && (activeTab === 'table' ? isTableActive(p) : isOnlineActive(p))
                ).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === c.id
                        ? 'bg-[#DD5903] text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {c.name} ({count})
                  </button>
                );
              })}
            </div>

            {/* Right Tools: Search & Sort & Status Filter */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto justify-end">
              {/* Availability Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white outline-none"
              >
                <option value="all">All Status</option>
                <option value="available">In Stock Only</option>
                <option value="unavailable">Out of Stock Only</option>
              </select>

              {/* Sort By Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white outline-none"
              >
                <option value="default">Sort: Default</option>
                <option value="name-asc">Name (A → Z)</option>
                <option value="name-desc">Name (Z → A)</option>
                <option value="price-asc">Price (Low → High)</option>
                <option value="price-desc">Price (High → Low)</option>
                <option value="category">Category</option>
              </select>

              {/* Search Bar */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeTab === 'table' ? 'Table' : 'Online'} items...`}
                  className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 pl-8 pr-3 text-xs text-gray-900 dark:text-white outline-none"
                />
              </div>
            </div>
          </Card>

          {/* ================= FOOD ITEMS TABLE ================= */}
          <Card className="overflow-hidden p-0 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[850px]">
                <thead className="bg-gray-50 dark:bg-[#141414] border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3.5">Food Item</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">
                      <span className={activeTab === 'table' ? 'text-[#DD5903] font-extrabold' : ''}>
                        Table Price
                      </span>
                    </th>
                    <th className="px-4 py-3.5">
                      <span className={activeTab === 'online' ? 'text-[#DD5903] font-extrabold' : ''}>
                        Online Price
                      </span>
                    </th>
                    <th className="px-4 py-3.5">Availability</th>
                    <th className="px-4 py-3.5">Table Status</th>
                    <th className="px-4 py-3.5">Online Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3 text-gray-400">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                          No items found in {activeTab === 'table' ? 'Table Menu' : 'Online Menu'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                          {searchQuery || selectedCategory !== 'all'
                            ? 'Try clearing your search or category filters.'
                            : `Add new items to the ${activeTab === 'table' ? 'Table Menu' : 'Online Menu'} using the button above.`}
                        </p>
                        <div className="mt-4">
                          <Button onClick={handleOpenAddProduct} size="sm" icon={Plus}>
                            {activeTab === 'table' ? 'Add Item to Table Menu' : 'Add Item to Online Menu'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      const categoryObj = categories.find((c) => c.id === product.category);
                      const tableP = getTablePrice(product);
                      const onlineP = getOnlinePrice(product);
                      const tableActive = isTableActive(product);
                      const onlineActive = isOnlineActive(product);

                      return (
                        <tr
                          key={product.id}
                          className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                        >
                          {/* Food Item Image & Details */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative flex-shrink-0">
                                <img
                                  src={product.image || 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=60'}
                                  alt={product.name}
                                  className="w-11 h-11 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=60';
                                  }}
                                />
                                <span
                                  title={product.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                                  className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#141414] ${
                                    product.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                                  }`}
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-gray-900 dark:text-white text-xs truncate max-w-[200px]">
                                    {product.name}
                                  </span>
                                  {product.isFeatured && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                                      Popular
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-400 line-clamp-1 max-w-xs mt-0.5">
                                  {product.description || 'No description provided.'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                            {categoryObj?.name || 'General'}
                          </td>

                          {/* Table Price */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-mono font-bold text-xs ${
                                  activeTab === 'table'
                                    ? 'text-[#DD5903] text-sm bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded border border-orange-200 dark:border-orange-900/40'
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                ₹{tableP}
                              </span>
                              <button
                                onClick={() => handleOpenQuickPrice(product)}
                                title="Quick change price"
                                className="opacity-60 hover:opacity-100 text-gray-400 hover:text-[#DD5903] cursor-pointer p-0.5"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* Online Price */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-mono font-bold text-xs ${
                                  activeTab === 'online'
                                    ? 'text-[#DD5903] text-sm bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded border border-orange-200 dark:border-orange-900/40'
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                ₹{onlineP}
                              </span>
                              <button
                                onClick={() => handleOpenQuickPrice(product)}
                                title="Quick change price"
                                className="opacity-60 hover:opacity-100 text-gray-400 hover:text-[#DD5903] cursor-pointer p-0.5"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* Item Availability Toggle */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleAvailability(product)}
                              className="cursor-pointer"
                              title="Click to toggle In Stock / Out of Stock"
                            >
                              <Badge variant={product.isAvailable ? 'success' : 'danger'} dot>
                                {product.isAvailable ? 'In Stock' : 'Out of Stock'}
                              </Badge>
                            </button>
                          </td>

                          {/* Table Menu Status Toggle */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleChannel(product, 'table')}
                              className="cursor-pointer flex items-center gap-1.5"
                              title="Click to toggle Table Menu status"
                            >
                              {tableActive ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                  <Check className="w-3 h-3" /> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">
                                  <X className="w-3 h-3" /> Inactive
                                </span>
                              )}
                            </button>
                          </td>

                          {/* Online Menu Status Toggle */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleChannel(product, 'online')}
                              className="cursor-pointer flex items-center gap-1.5"
                              title="Click to toggle Online Menu status"
                            >
                              {onlineActive ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                                  <Check className="w-3 h-3" /> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">
                                  <X className="w-3 h-3" /> Inactive
                                </span>
                              )}
                            </button>
                          </td>

                          {/* Action Buttons */}
                          <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                            <button
                              onClick={() => handleOpenQuickPrice(product)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-[#DD5903] hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                              title="Change Price"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditProduct(product)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                              title="Full Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => duplicateProduct(product.id)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                              title="Duplicate Item"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setProductToDelete(product)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>

        </div>
      )}

      {/* ================= TAB 2: CATEGORIES ================= */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 text-xs">
            <p className="text-gray-600 dark:text-gray-400">
              Manage menu classifications (Beverage, Snacks, Main Course, etc.) that structure both Table and Online menus.
            </p>
            <Button onClick={() => { setEditingCategory(null); setCatName(''); setIsCatModalOpen(true); }} size="sm" icon={Plus}>
              New Category
            </Button>
          </div>

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
                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                    title="Edit category"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCategoryToDelete(cat)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                    title="Delete category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: VARIANTS & ADD-ONS ================= */}
      {activeTab === 'addons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 text-xs">
            <p className="text-gray-600 dark:text-gray-400">
              Manage customizable extras, milk substitutes, and add-on toppings for food & drink orders.
            </p>
            <Button onClick={() => { setEditingAddon(null); setAddonName(''); setAddonPrice(40); setIsAddonModalOpen(true); }} size="sm" icon={Plus}>
              New Add-on
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {addons.map((add) => (
              <Card key={add.id} className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">{add.name}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Category: <span className="font-semibold">{add.category}</span>
                  </p>
                  <span className="text-xs font-bold text-[#DD5903] font-mono mt-1 block">
                    +₹{add.price}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingAddon(add);
                      setAddonName(add.name);
                      setAddonPrice(add.price);
                      setAddonCategory(add.category);
                      setIsAddonModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                    title="Edit Add-on"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setAddonToDelete(add)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                    title="Delete Add-on"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ================= ADD / EDIT PRODUCT MODAL ================= */}
      {isProductModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsProductModalOpen(false)}
          title={editingProduct ? `Edit "${editingProduct.name}"` : 'Add New Food Item'}
          subtitle="Configure food attributes, independent Table & Online pricing, and channel availability."
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsProductModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveProduct}>
                {editingProduct ? 'Save Changes' : 'Create Item'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
            {/* Row 1: Name & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Food Name *
                </label>
                <input
                  type="text"
                  required
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  placeholder="e.g. Chicken Biryani / Paneer Butter Masala"
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

            {/* Description */}
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

            {/* Image Upload / URL */}
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Food Image — URL or File Upload
              </label>
              <div className="flex items-center gap-3">
                {prodForm.image ? (
                  <img
                    src={prodForm.image}
                    alt="preview"
                    className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : null}
                <input
                  type="text"
                  value={prodForm.image}
                  onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                  placeholder="https://... or click Upload"
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono text-[11px]"
                />
                <label className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold cursor-pointer whitespace-nowrap hover:bg-gray-200 dark:hover:bg-gray-700">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageFile(e.target.files?.[0])}
                  />
                </label>
              </div>
              {imageError && <p className="text-[11px] text-amber-600 mt-1">{imageError}</p>}
            </div>

            {/* ================= INDEPENDENT PRICING & CHANNELS CARD ================= */}
            <div className="p-4 rounded-xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <span>Channel Pricing & Menu Availability</span>
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Set different prices for restaurant dining vs online ordering. Enable or disable each menu channel independently.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. TABLE MENU BOX */}
                <div className={`p-3 rounded-xl border transition-all ${
                  prodForm.tableEnabled
                    ? 'bg-white dark:bg-[#181818] border-orange-300 dark:border-orange-800 shadow-xs'
                    : 'bg-gray-100/60 dark:bg-gray-900/60 border-gray-200 dark:border-gray-800 opacity-70'
                }`}>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className={`w-4 h-4 ${prodForm.tableEnabled ? 'text-[#DD5903]' : 'text-gray-400'}`} />
                      <span className="font-bold text-xs text-gray-900 dark:text-white">Table Menu</span>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prodForm.tableEnabled}
                        onChange={(e) => setProdForm({ ...prodForm, tableEnabled: e.target.checked })}
                        className="rounded text-[#DD5903] focus:ring-[#DD5903]"
                      />
                      <span className="font-bold text-[11px]">
                        {prodForm.tableEnabled ? 'ON' : 'OFF'}
                      </span>
                    </label>
                  </div>

                  {prodForm.tableEnabled ? (
                    <div>
                      <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                        Table Price (₹) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                        <input
                          type="number"
                          required={prodForm.tableEnabled}
                          value={prodForm.tablePrice}
                          onChange={(e) => setProdForm({ ...prodForm, tablePrice: e.target.value })}
                          placeholder="e.g. 180"
                          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-7 pr-3 py-2 text-gray-900 dark:text-white outline-none font-mono font-bold text-sm"
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">Price charged for dining at tables.</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic py-3 text-center">
                      Disabled for Table / Dine-in Menu
                    </p>
                  )}
                </div>

                {/* 2. ONLINE MENU BOX */}
                <div className={`p-3 rounded-xl border transition-all ${
                  prodForm.onlineEnabled
                    ? 'bg-white dark:bg-[#181818] border-blue-300 dark:border-blue-800 shadow-xs'
                    : 'bg-gray-100/60 dark:bg-gray-900/60 border-gray-200 dark:border-gray-800 opacity-70'
                }`}>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <Globe className={`w-4 h-4 ${prodForm.onlineEnabled ? 'text-blue-500' : 'text-gray-400'}`} />
                      <span className="font-bold text-xs text-gray-900 dark:text-white">Online Menu</span>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prodForm.onlineEnabled}
                        onChange={(e) => setProdForm({ ...prodForm, onlineEnabled: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-bold text-[11px]">
                        {prodForm.onlineEnabled ? 'ON' : 'OFF'}
                      </span>
                    </label>
                  </div>

                  {prodForm.onlineEnabled ? (
                    <div>
                      <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                        Online Price (₹) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                        <input
                          type="number"
                          required={prodForm.onlineEnabled}
                          value={prodForm.onlinePrice}
                          onChange={(e) => setProdForm({ ...prodForm, onlinePrice: e.target.value })}
                          placeholder="e.g. 199"
                          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-7 pr-3 py-2 text-gray-900 dark:text-white outline-none font-mono font-bold text-sm"
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">Price charged for delivery & takeaway.</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic py-3 text-center">
                      Disabled for Online Ordering
                    </p>
                  )}
                </div>

              </div>
            </div>

            {/* General Settings: Cost Price, Prep Time, Availability */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Kitchen Cost Price (₹) (Optional)
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

            {/* Checkbox Toggles: Availability, Veg, Popular */}
            <div className="flex items-center gap-6 pt-2 flex-wrap border-t border-gray-100 dark:border-gray-800">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prodForm.isAvailable}
                  onChange={(e) => setProdForm({ ...prodForm, isAvailable: e.target.checked })}
                  className="rounded text-[#DD5903] focus:ring-[#DD5903]"
                />
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Item In Stock (Available for ordering)
                </span>
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

      {/* ================= QUICK PRICE EDIT MODAL ================= */}
      {quickPriceProduct && (
        <Modal
          isOpen={true}
          onClose={() => setQuickPriceProduct(null)}
          title={`Update Prices — ${quickPriceProduct.name}`}
          subtitle="Change table price and online price independently anytime."
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setQuickPriceProduct(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveQuickPrice}>
                Update Prices
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveQuickPrice} className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
              <img
                src={quickPriceProduct.image || 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=60'}
                alt={quickPriceProduct.name}
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
              />
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{quickPriceProduct.name}</p>
                <p className="text-[11px] text-gray-500">
                  Current: Table ₹{getTablePrice(quickPriceProduct)} • Online ₹{getOnlinePrice(quickPriceProduct)}
                </p>
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1 flex items-center justify-between">
                <span>🍽️ Table Price (₹)</span>
                <span className="text-[10px] text-gray-400 font-normal">Dining at tables</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                <input
                  type="number"
                  step="any"
                  value={quickTablePrice}
                  onChange={(e) => setQuickTablePrice(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-7 pr-3 py-2 text-gray-900 dark:text-white font-mono font-bold text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1 flex items-center justify-between">
                <span>🌐 Online Price (₹)</span>
                <span className="text-[10px] text-gray-400 font-normal">Delivery & Takeaway</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                <input
                  type="number"
                  step="any"
                  value={quickOnlinePrice}
                  onChange={(e) => setQuickOnlinePrice(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-7 pr-3 py-2 text-gray-900 dark:text-white font-mono font-bold text-sm outline-none"
                />
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* ================= CONFIRM DELETE PRODUCT MODAL ================= */}
      {productToDelete && (
        <ConfirmDialog
          isOpen={true}
          title={`Delete "${productToDelete.name}"?`}
          message="Are you sure you want to permanently delete this food item from all menus? This cannot be undone."
          confirmText="Delete Food Item"
          cancelText="Keep Item"
          type="danger"
          onConfirm={() => {
            deleteProduct(productToDelete.id);
            setProductToDelete(null);
          }}
          onCancel={() => setProductToDelete(null)}
        />
      )}

      {/* ================= CATEGORY MODAL ================= */}
      {isCatModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => { setIsCatModalOpen(false); setEditingCategory(null); setCatName(''); }}
          title={editingCategory ? `Edit Category "${editingCategory.name}"` : 'Add New Category'}
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
          <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. Biryani, Beverages, Snacks"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* ================= ADDON MODAL ================= */}
      {isAddonModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => { setIsAddonModalOpen(false); setEditingAddon(null); }}
          title={editingAddon ? `Edit "${editingAddon.name}"` : 'Add New Extra / Add-on'}
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => { setIsAddonModalOpen(false); setEditingAddon(null); }}>
                Cancel
              </Button>
              <Button onClick={handleSaveAddon}>
                {editingAddon ? 'Save Changes' : 'Create Add-on'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveAddon} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Add-on Name *
              </label>
              <input
                type="text"
                required
                value={addonName}
                onChange={(e) => setAddonName(e.target.value)}
                placeholder="e.g. Extra Cheese Slice"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Price (₹) *
              </label>
              <input
                type="number"
                required
                value={addonPrice}
                onChange={(e) => setAddonPrice(Number(e.target.value))}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Classification
              </label>
              <input
                type="text"
                value={addonCategory}
                onChange={(e) => setAddonCategory(e.target.value)}
                placeholder="e.g. Dairy, Toppings, Sides"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* ================= DELETE CONFIRMATIONS ================= */}
      {categoryToDelete && (
        <ConfirmDialog
          isOpen={true}
          title={`Delete Category "${categoryToDelete.name}"?`}
          message="Products assigned to this category will not be deleted, but will become unassigned."
          confirmText="Delete Category"
          type="danger"
          onConfirm={() => {
            deleteCategory(categoryToDelete.id);
            setCategoryToDelete(null);
          }}
          onCancel={() => setCategoryToDelete(null)}
        />
      )}

      {addonToDelete && (
        <ConfirmDialog
          isOpen={true}
          title={`Delete Add-on "${addonToDelete.name}"?`}
          message="Are you sure you want to remove this add-on from available customizers?"
          confirmText="Delete Add-on"
          type="danger"
          onConfirm={() => {
            deleteAddon(addonToDelete.id);
            setAddonToDelete(null);
          }}
          onCancel={() => setAddonToDelete(null)}
        />
      )}

    </div>
  );
}
