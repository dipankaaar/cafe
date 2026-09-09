import React, { useState } from 'react';
import { useCafe } from '../../../context/CafeContext';
import Card from '../../common/Card';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  Truck,
  FileCheck,
  TrendingDown,
  ArrowUpDown,
  CheckCircle,
  Clock,
  PackagePlus,
  DollarSign
} from 'lucide-react';

export default function InventoryView() {
  const {
    inventory,
    suppliers,
    purchases,
    adjustInventoryStock,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    createPurchaseOrder,
    receivePurchaseOrder,
    deletePurchaseOrder
  } = useCafe();

  const [activeTab, setActiveTab] = useState('stock'); // stock, suppliers, purchases
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Stock Adjustment Modal State
  const [adjustingItem, setAdjustingItem] = useState(null);
  const [adjustQty, setAdjustQty] = useState(5);
  const [adjustType, setAdjustType] = useState('add'); // add, deduct
  const [adjustReason, setAdjustReason] = useState('Restock Delivery');

  // New Item Modal State
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    category: 'Coffee',
    currentStock: 10,
    minStock: 5,
    maxStock: 50,
    unit: 'kg',
    costPerUnit: 250,
    supplierId: suppliers[0]?.id || ''
  });

  // New Supplier Modal State
  const [isAddSupModalOpen, setIsAddSupModalOpen] = useState(false);
  const [newSupForm, setNewSupForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    category: 'Coffee Beans',
    leadTimeDays: 2
  });

  // New Purchase Order Modal State
  const [isAddPOModalOpen, setIsAddPOModalOpen] = useState(false);
  const [selectedPOSupplier, setSelectedPOSupplier] = useState(suppliers[0]?.id || '');
  const [selectedPOItem, setSelectedPOItem] = useState(inventory[0]?.id || '');
  const [poQty, setPoQty] = useState(10);
  const [poUnitPrice, setPoUnitPrice] = useState(250);
  const [poReceiveNow, setPoReceiveNow] = useState(true);

  // Edit stock item state
  const [editingItem, setEditingItem] = useState(null);
  const [editItemForm, setEditItemForm] = useState({});
  const [itemToDelete, setItemToDelete] = useState(null);

  // Edit supplier state
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editSupForm, setEditSupForm] = useState({});
  const [supplierToDelete, setSupplierToDelete] = useState(null);

  const openEditItem = (item) => {
    setEditingItem(item);
    setEditItemForm({
      name: item.name,
      category: item.category,
      currentStock: item.currentStock,
      minStock: item.minStock,
      maxStock: item.maxStock,
      unit: item.unit,
      costPerUnit: item.costPerUnit,
      supplierId: item.supplierId || ''
    });
  };

  const handleSaveEditItem = (e) => {
    e.preventDefault();
    if (!editingItem) return;
    updateInventoryItem(editingItem.id, {
      ...editItemForm,
      currentStock: Number(editItemForm.currentStock),
      minStock: Number(editItemForm.minStock),
      maxStock: Number(editItemForm.maxStock),
      costPerUnit: Number(editItemForm.costPerUnit)
    });
    setEditingItem(null);
  };

  const openEditSupplier = (sup) => {
    setEditingSupplier(sup);
    setEditSupForm({
      name: sup.name,
      contactPerson: sup.contactPerson || '',
      phone: sup.phone || '',
      email: sup.email || '',
      category: sup.category || '',
      leadTimeDays: sup.leadTimeDays ?? 2
    });
  };

  const handleSaveEditSupplier = (e) => {
    e.preventDefault();
    if (!editingSupplier) return;
    updateSupplier(editingSupplier.id, { ...editSupForm, leadTimeDays: Number(editSupForm.leadTimeDays) });
    setEditingSupplier(null);
  };

  // Filtered Stock
  const filteredStock = inventory.filter((item) => {
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchSearch =
      searchQuery.trim() === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const lowStockCount = inventory.filter((i) => i.status === 'Low Stock').length;
  const totalValuation = inventory.reduce((sum, i) => sum + i.currentStock * i.costPerUnit, 0);

  // Stock Adjustment handler
  const handleApplyAdjustment = (e) => {
    e.preventDefault();
    if (!adjustingItem) return;

    const delta = adjustType === 'add' ? Number(adjustQty) : -Number(adjustQty);
    adjustInventoryStock(adjustingItem.id, delta, adjustReason);
    setAdjustingItem(null);
  };

  // Add Item handler
  const handleSaveNewItem = (e) => {
    e.preventDefault();
    if (!newItemForm.name) return;

    addInventoryItem(newItemForm);
    setIsAddItemModalOpen(false);
    setNewItemForm({
      name: '',
      category: 'Coffee',
      currentStock: 10,
      minStock: 5,
      maxStock: 50,
      unit: 'kg',
      costPerUnit: 250,
      supplierId: suppliers[0]?.id || ''
    });
  };

  // Add Supplier handler
  const handleSaveNewSupplier = (e) => {
    e.preventDefault();
    if (!newSupForm.name) return;

    addSupplier(newSupForm);
    setIsAddSupModalOpen(false);
    setNewSupForm({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      category: 'Coffee Beans',
      leadTimeDays: 2
    });
  };

  // Create PO handler (create as Pending, optionally receive immediately -> restock + expense)
  const handleCreatePO = (e) => {
    e.preventDefault();
    const supObj = suppliers.find((s) => s.id === selectedPOSupplier);
    const itemObj = inventory.find((i) => i.id === selectedPOItem);

    createPurchaseOrder({
      supplierId: selectedPOSupplier,
      supplierName: supObj?.name || 'Local Vendor',
      items: [
        {
          ingredientId: selectedPOItem,
          name: itemObj?.name || 'Raw Ingredient',
          quantity: Number(poQty),
          unitPrice: Number(poUnitPrice),
          totalPrice: Number(poQty) * Number(poUnitPrice)
        }
      ],
      totalAmount: Number(poQty) * Number(poUnitPrice)
    }, { receive: poReceiveNow });

    setIsAddPOModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
            Inventory & Supply Chain
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Raw material stock levels, automatic order deductions, suppliers, and purchase orders.
          </p>
        </div>

        {/* Dynamic Action Button */}
        {activeTab === 'stock' ? (
          <Button onClick={() => setIsAddItemModalOpen(true)} size="sm" icon={Plus}>
            Add Raw Material
          </Button>
        ) : activeTab === 'suppliers' ? (
          <Button onClick={() => setIsAddSupModalOpen(true)} size="sm" icon={Plus}>
            New Supplier
          </Button>
        ) : (
          <Button onClick={() => setIsAddPOModalOpen(true)} size="sm" icon={PackagePlus}>
            Create Purchase Order
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-xs font-bold uppercase text-gray-400">Total Raw Stock Valuation</span>
          <h3 className="text-2xl font-bold font-mono text-gray-900 dark:text-white mt-1">
            ₹{totalValuation.toLocaleString()}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Across {inventory.length} catalogued items</p>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-bold uppercase text-gray-400">Low Stock Alerts</span>
          <h3 className="text-2xl font-bold font-mono text-amber-500 mt-1">
            {lowStockCount} items
          </h3>
          <p className="text-xs text-amber-600 font-semibold mt-0.5">
            {lowStockCount > 0 ? 'Requires immediate restock' : 'All thresholds healthy'}
          </p>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-bold uppercase text-gray-400">Active Suppliers</span>
          <h3 className="text-2xl font-bold font-mono text-[#DD5903] mt-1">
            {suppliers.length} vendors
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">{purchases.length} Purchase orders executed</p>
        </Card>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2 text-xs font-bold">
        {[
          { id: 'stock', label: `Raw Stock Levels (${inventory.length})`, icon: Boxes },
          { id: 'suppliers', label: `Suppliers (${suppliers.length})`, icon: Truck },
          { id: 'purchases', label: `Purchase Orders (${purchases.length})`, icon: FileCheck }
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

      {/* ================= TAB 1: RAW STOCK LEVELS ================= */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          
          {/* Filters */}
          <Card className="p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 text-xs">
              {['all', 'Coffee', 'Dairy', 'Bakery', 'Syrups', 'Packaging', 'Meat'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap capitalize transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[#DD5903] text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search raw items..."
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 pl-9 pr-3 text-xs text-gray-900 dark:text-white outline-none"
              />
            </div>
          </Card>

          {/* Stock Table */}
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 dark:bg-[#141414] border-b border-gray-200 dark:border-gray-800 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Ingredient / Material</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Current Stock</th>
                    <th className="px-5 py-3.5">Min Alert Threshold</th>
                    <th className="px-5 py-3.5">Cost / Unit</th>
                    <th className="px-5 py-3.5">Stock Valuation</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Quick Stock Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
                  {filteredStock.map((item) => {
                    const valuation = item.currentStock * item.costPerUnit;
                    const isLow = item.currentStock <= item.minStock;

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                        <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white">
                          {item.name}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300 font-semibold">
                          {item.category}
                        </td>
                        <td className="px-5 py-3.5 font-mono font-bold text-gray-900 dark:text-white">
                          {item.currentStock} {item.unit}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-gray-500">
                          {item.minStock} {item.unit}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-gray-700 dark:text-gray-300">
                          ₹{item.costPerUnit} / {item.unit}
                        </td>
                        <td className="px-5 py-3.5 font-mono font-bold text-[#DD5903]">
                          ₹{valuation.toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={isLow ? 'warning' : 'success'} dot>
                            {isLow ? 'Low Stock' : 'In Stock'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setAdjustingItem(item);
                              setAdjustQty(5);
                              setAdjustType('add');
                            }}
                            className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-[#DD5903] hover:text-white text-gray-700 dark:text-gray-300 rounded font-semibold text-xs transition-colors cursor-pointer mr-1"
                          >
                            Adjust Stock
                          </button>
                          <button
                            onClick={() => openEditItem(item)}
                            className="px-2.5 py-1 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white"
                            title="Edit item"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setItemToDelete(item)}
                            className="px-2.5 py-1 text-xs font-semibold text-gray-500 hover:text-rose-600"
                            title="Delete item"
                          >
                            Delete
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

      {/* ================= TAB 2: SUPPLIERS DIRECTORY ================= */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {suppliers.map((sup) => (
            <Card key={sup.id} className="p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#DD5903] tracking-wider">
                    {sup.category}
                  </span>
                  <Badge variant="success">Active</Badge>
                </div>
                <h4 className="text-base font-bold text-gray-900 dark:text-white mt-1">
                  {sup.name}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">Contact: {sup.contactPerson}</p>

                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                  <div>Phone: <strong>{sup.phone}</strong></div>
                  <div>Email: <strong>{sup.email}</strong></div>
                  <div>Lead Time: <strong>{sup.leadTimeDays} Days</strong></div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs">
                <span className="text-gray-500 font-semibold">
                  Total POs: {purchases.filter((p) => p.supplierId === sup.id).length}
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditSupplier(sup)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold">
                    Edit
                  </button>
                  <button onClick={() => setSupplierToDelete(sup)} className="text-gray-500 hover:text-rose-600 font-bold">
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPOSupplier(sup.id);
                      setIsAddPOModalOpen(true);
                    }}
                    className="text-[#DD5903] hover:underline font-bold"
                  >
                    Create PO →
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ================= TAB 3: PURCHASE ORDERS ================= */}
      {activeTab === 'purchases' && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-50 dark:bg-[#141414] border-b border-gray-200 dark:border-gray-800 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">PO Number</th>
                  <th className="px-5 py-3.5">Supplier</th>
                  <th className="px-5 py-3.5">Order Date</th>
                  <th className="px-5 py-3.5">Items & Quantity</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
                {purchases.map((po) => {
                  const isDone = po.status === 'Completed' || po.status === 'Received';
                  return (
                  <tr key={po.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                    <td className="px-5 py-3.5 font-mono font-bold text-gray-900 dark:text-white">
                      {po.poNumber}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900 dark:text-white">
                      {po.supplierName}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {po.orderDate}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                      {po.items.map((i) => `${i.name} (${i.quantity})`).join(', ')}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-emerald-600">
                      ₹{po.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={isDone ? 'success' : 'warning'}>
                        {po.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      {!isDone && (
                        <button
                          onClick={() => receivePurchaseOrder(po.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-xs transition-colors cursor-pointer mr-1"
                          title="Mark received: restocks inventory + records expense"
                        >
                          Receive
                        </button>
                      )}
                      <button
                        onClick={() => deletePurchaseOrder(po.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-gray-500 hover:text-rose-600"
                        title="Delete purchase order"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ================= STOCK ADJUSTMENT MODAL ================= */}
      {adjustingItem && (
        <Modal
          isOpen={true}
          onClose={() => setAdjustingItem(null)}
          title={`Adjust Stock: ${adjustingItem.name}`}
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setAdjustingItem(null)}>
                Cancel
              </Button>
              <Button onClick={handleApplyAdjustment}>
                Save Adjustment
              </Button>
            </>
          }
        >
          <form onSubmit={handleApplyAdjustment} className="space-y-3.5 text-xs">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-gray-500">Current Stock Balance:</span>
              <p className="text-base font-bold font-mono text-[#DD5903]">
                {adjustingItem.currentStock} {adjustingItem.unit}
              </p>
            </div>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Adjustment Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`p-2 rounded-lg font-semibold border text-center transition-colors cursor-pointer ${
                    adjustType === 'add'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-600 font-bold'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  + Add Stock (Restock)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('deduct')}
                  className={`p-2 rounded-lg font-semibold border text-center transition-colors cursor-pointer ${
                    adjustType === 'deduct'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-600 font-bold'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  - Deduct (Wastage / Spoilage)
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Quantity ({adjustingItem.unit})
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                required
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Reason / Logging Note
              </label>
              <input
                type="text"
                required
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Broken packaging, Physical inventory count audit..."
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* ================= ADD RAW MATERIAL MODAL ================= */}
      {isAddItemModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddItemModalOpen(false)}
          title="Add New Raw Material"
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsAddItemModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveNewItem}>
                Create Item
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveNewItem} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={newItemForm.name}
                  onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                  placeholder="e.g. Almond Milk"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Category
                </label>
                <select
                  value={newItemForm.category}
                  onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
                >
                  <option value="Coffee">Coffee</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Syrups">Syrups</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Meat">Meat</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Initial Stock
                </label>
                <input
                  type="number"
                  value={newItemForm.currentStock}
                  onChange={(e) => setNewItemForm({ ...newItemForm, currentStock: Number(e.target.value) })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Min Alert Stock
                </label>
                <input
                  type="number"
                  value={newItemForm.minStock}
                  onChange={(e) => setNewItemForm({ ...newItemForm, minStock: Number(e.target.value) })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Unit (kg, L, pack, pcs)
                </label>
                <input
                  type="text"
                  value={newItemForm.unit}
                  onChange={(e) => setNewItemForm({ ...newItemForm, unit: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Cost Per Unit (₹)
              </label>
              <input
                type="number"
                value={newItemForm.costPerUnit}
                onChange={(e) => setNewItemForm({ ...newItemForm, costPerUnit: Number(e.target.value) })}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* ================= CREATE PO MODAL ================= */}
      {isAddPOModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddPOModalOpen(false)}
          title="Create Purchase Order (PO)"
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsAddPOModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePO}>
                {poReceiveNow ? 'Place & Restock' : 'Save as Pending'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreatePO} className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Select Supplier *
              </label>
              <select
                value={selectedPOSupplier}
                onChange={(e) => setSelectedPOSupplier(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Select Raw Stock Item *
              </label>
              <select
                value={selectedPOItem}
                onChange={(e) => {
                  setSelectedPOItem(e.target.value);
                  const selected = inventory.find((i) => i.id === e.target.value);
                  if (selected) setPoUnitPrice(selected.costPerUnit);
                }}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
              >
                {inventory.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.name} (Current: {inv.currentStock} {inv.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Order Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={poQty}
                  onChange={(e) => setPoQty(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Unit Price (₹)
                </label>
                <input
                  type="number"
                  value={poUnitPrice}
                  onChange={(e) => setPoUnitPrice(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
                />
              </div>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-lg flex justify-between font-bold">
              <span className="text-emerald-700 dark:text-emerald-300">Total PO Value:</span>
              <span className="text-emerald-700 dark:text-emerald-300 font-mono">
                ₹{(Number(poQty) * Number(poUnitPrice)).toLocaleString()}
              </span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={poReceiveNow}
                onChange={(e) => setPoReceiveNow(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              Receive immediately (restock inventory + record purchase expense)
            </label>
            {!poReceiveNow && (
              <p className="text-[11px] text-gray-400">PO will be saved as Pending — use Receive in the table to restock later.</p>
            )}
          </form>
        </Modal>
      )}

      {/* ================= ADD SUPPLIER MODAL ================= */}
      {isAddSupModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddSupModalOpen(false)}
          title="Add New Vendor / Supplier"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsAddSupModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveNewSupplier}>
                Save Supplier
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveNewSupplier} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Vendor Name *
              </label>
              <input
                type="text"
                required
                value={newSupForm.name}
                onChange={(e) => setNewSupForm({ ...newSupForm, name: e.target.value })}
                placeholder="e.g. Blue Tokai Roasters"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={newSupForm.contactPerson}
                onChange={(e) => setNewSupForm({ ...newSupForm, contactPerson: e.target.value })}
                placeholder="e.g. Ramesh Patel"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={newSupForm.phone}
                onChange={(e) => setNewSupForm({ ...newSupForm, phone: e.target.value })}
                placeholder="+91 99887 76655"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Supply Category
              </label>
              <input
                type="text"
                value={newSupForm.category}
                onChange={(e) => setNewSupForm({ ...newSupForm, category: e.target.value })}
                placeholder="e.g. Roasted Coffee Beans"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* ================= EDIT RAW MATERIAL MODAL ================= */}
      {editingItem && (
        <Modal
          isOpen={true}
          onClose={() => setEditingItem(null)}
          title={`Edit: ${editingItem.name}`}
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEditItem}>
                Save Changes
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveEditItem} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Item Name *</label>
                <input type="text" required value={editItemForm.name || ''} onChange={(e) => setEditItemForm({ ...editItemForm, name: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none" />
              </div>
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Category</label>
                <input type="text" value={editItemForm.category || ''} onChange={(e) => setEditItemForm({ ...editItemForm, category: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Current Stock</label>
                <input type="number" step="0.01" value={editItemForm.currentStock ?? 0} onChange={(e) => setEditItemForm({ ...editItemForm, currentStock: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono" />
              </div>
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Min Alert Level</label>
                <input type="number" step="0.01" value={editItemForm.minStock ?? 0} onChange={(e) => setEditItemForm({ ...editItemForm, minStock: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono" />
              </div>
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Unit</label>
                <input type="text" value={editItemForm.unit || ''} onChange={(e) => setEditItemForm({ ...editItemForm, unit: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Max Stock</label>
                <input type="number" step="0.01" value={editItemForm.maxStock ?? 0} onChange={(e) => setEditItemForm({ ...editItemForm, maxStock: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono" />
              </div>
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Cost Per Unit (₹)</label>
                <input type="number" step="0.01" value={editItemForm.costPerUnit ?? 0} onChange={(e) => setEditItemForm({ ...editItemForm, costPerUnit: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono" />
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* ================= EDIT SUPPLIER MODAL ================= */}
      {editingSupplier && (
        <Modal
          isOpen={true}
          onClose={() => setEditingSupplier(null)}
          title={`Edit Supplier: ${editingSupplier.name}`}
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setEditingSupplier(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEditSupplier}>
                Save Changes
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveEditSupplier} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Vendor Name *</label>
              <input type="text" required value={editSupForm.name || ''} onChange={(e) => setEditSupForm({ ...editSupForm, name: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none" />
            </div>
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Contact Person</label>
              <input type="text" value={editSupForm.contactPerson || ''} onChange={(e) => setEditSupForm({ ...editSupForm, contactPerson: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Phone</label>
                <input type="tel" value={editSupForm.phone || ''} onChange={(e) => setEditSupForm({ ...editSupForm, phone: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none" />
              </div>
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Lead Time (days)</label>
                <input type="number" value={editSupForm.leadTimeDays ?? 2} onChange={(e) => setEditSupForm({ ...editSupForm, leadTimeDays: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono" />
              </div>
            </div>
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Email</label>
              <input type="email" value={editSupForm.email || ''} onChange={(e) => setEditSupForm({ ...editSupForm, email: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none" />
            </div>
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Supply Category</label>
              <input type="text" value={editSupForm.category || ''} onChange={(e) => setEditSupForm({ ...editSupForm, category: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none" />
            </div>
          </form>
        </Modal>
      )}

      {itemToDelete && (
        <Modal isOpen={true} onClose={() => setItemToDelete(null)} title={`Delete "${itemToDelete.name}"`} size="sm"
          footer={<><Button variant="secondary" onClick={() => setItemToDelete(null)}>Cancel</Button><Button onClick={() => { deleteInventoryItem(itemToDelete.id); setItemToDelete(null); }}>Yes, Delete</Button></>}>
          <p className="text-xs text-gray-600 dark:text-gray-300">Remove this raw material from inventory? Products linked via recipe will no longer deduct it. This cannot be undone.</p>
        </Modal>
      )}

      {supplierToDelete && (
        <Modal isOpen={true} onClose={() => setSupplierToDelete(null)} title={`Delete "${supplierToDelete.name}"`} size="sm"
          footer={<><Button variant="secondary" onClick={() => setSupplierToDelete(null)}>Cancel</Button><Button onClick={() => { deleteSupplier(supplierToDelete.id); setSupplierToDelete(null); }}>Yes, Delete</Button></>}>
          <p className="text-xs text-gray-600 dark:text-gray-300">Remove this supplier? Past purchase orders are kept. This cannot be undone.</p>
        </Modal>
      )}

    </div>
  );
}
