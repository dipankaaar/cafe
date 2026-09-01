import React, { useState } from 'react';
import { useCafe } from '../../../context/CafeContext';
import Card from '../../common/Card';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import ConfirmDialog from '../../common/ConfirmDialog';
import {
  Tag,
  Plus,
  Search,
  Percent,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  TrendingUp,
  Award,
  Users,
  Copy,
  Clock
} from 'lucide-react';

export default function CouponsView() {
  const { coupons, categories, addCoupon, updateCoupon, toggleCouponStatus } = useCafe();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  // Form State
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscount: 150,
    minOrderValue: 299,
    maxOrderValue: '',
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: '2026-12-31',
    usageLimit: 500,
    perCustomerLimit: 1,
    applicableCategories: [],
    applicableOrderTypes: ['dine-in', 'takeaway', 'delivery'],
    customerEligibility: 'all'
  });

  // Metrics
  const activeCoupons = coupons.filter((c) => c.status === 'active');
  const totalRedemptions = coupons.reduce((sum, c) => sum + c.usedCount, 0);
  const totalDiscountGiven = coupons.reduce((sum, c) => sum + (c.totalDiscountGiven || 0), 0);
  const totalRevenueGenerated = coupons.reduce((sum, c) => sum + (c.revenueGenerated || 0), 0);

  const filteredCoupons = coupons.filter((c) => {
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchSearch =
      searchQuery.trim() === '' ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleOpenAdd = () => {
    setEditingCoupon(null);
    setForm({
      code: '',
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: 20,
      maxDiscount: 150,
      minOrderValue: 299,
      maxOrderValue: '',
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: '2026-12-31',
      usageLimit: 500,
      perCustomerLimit: 1,
      applicableCategories: [],
      applicableOrderTypes: ['dine-in', 'takeaway', 'delivery'],
      customerEligibility: 'all'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount || '',
      minOrderValue: coupon.minOrderValue || 0,
      maxOrderValue: coupon.maxOrderValue || '',
      startDate: coupon.startDate || '',
      expiryDate: coupon.expiryDate || '',
      usageLimit: coupon.usageLimit || '',
      perCustomerLimit: coupon.perCustomerLimit || 1,
      applicableCategories: coupon.applicableCategories || [],
      applicableOrderTypes: coupon.applicableOrderTypes || ['dine-in', 'takeaway', 'delivery'],
      customerEligibility: coupon.customerEligibility || 'all'
    });
    setIsModalOpen(true);
  };

  const handleSaveCoupon = (e) => {
    e.preventDefault();
    if (!form.code.trim()) return;

    if (editingCoupon) {
      updateCoupon(editingCoupon.id, form);
    } else {
      addCoupon(form);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
            Coupon & Discount Engine
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Configure promo campaigns, conditional thresholds, customer caps, and track redemptions.
          </p>
        </div>

        <Button onClick={handleOpenAdd} size="sm" icon={Plus}>
          Create Coupon
        </Button>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs font-bold uppercase text-gray-400">Active Coupons</span>
          <h3 className="text-2xl font-bold font-mono text-gray-900 dark:text-white mt-1">
            {activeCoupons.length} / {coupons.length}
          </h3>
          <p className="text-xs text-emerald-600 font-semibold mt-0.5">Ready for checkout</p>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-bold uppercase text-gray-400">Total Redemptions</span>
          <h3 className="text-2xl font-bold font-mono text-gray-900 dark:text-white mt-1">
            {totalRedemptions} times
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Across all guest orders</p>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-bold uppercase text-gray-400">Discount Conceded</span>
          <h3 className="text-2xl font-bold font-mono text-[#DD5903] mt-1">
            ₹{totalDiscountGiven.toLocaleString()}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Saved by customers</p>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-bold uppercase text-gray-400">Campaign Revenue</span>
          <h3 className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            ₹{totalRevenueGenerated.toLocaleString()}
          </h3>
          <p className="text-xs text-emerald-600 font-semibold mt-0.5">Influenced sales</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs font-semibold">
          {['all', 'active', 'expired', 'disabled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg capitalize whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#DD5903] text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
              }`}
            >
              {st} ({st === 'all' ? coupons.length : coupons.filter((c) => c.status === st).length})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code or name..."
            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 pl-9 pr-3 text-xs text-gray-900 dark:text-white outline-none font-mono"
          />
        </div>
      </Card>

      {/* Coupons Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50 dark:bg-[#141414] border-b border-gray-200 dark:border-gray-800 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Promo Code</th>
                <th className="px-5 py-3.5">Campaign Name</th>
                <th className="px-5 py-3.5">Discount Offer</th>
                <th className="px-5 py-3.5">Min Order</th>
                <th className="px-5 py-3.5">Validity</th>
                <th className="px-5 py-3.5">Usage / Limit</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
              {filteredCoupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                  <td className="px-5 py-3.5">
                    <span className="font-mono font-bold text-sm text-[#DD5903] bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 px-2 py-0.5 rounded">
                      {coupon.code}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-gray-900 dark:text-white">
                    {coupon.name}
                    <p className="text-[10px] text-gray-400 font-normal">{coupon.description}</p>
                  </td>
                  <td className="px-5 py-3.5 font-bold font-mono text-emerald-600">
                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} FLAT`}
                    {coupon.maxDiscount && (
                      <span className="block text-[10px] text-gray-400 font-normal">
                        Capped at ₹{coupon.maxDiscount}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-gray-700 dark:text-gray-300">
                    {coupon.minOrderValue ? `₹${coupon.minOrderValue}` : 'None'}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 font-mono text-[11px]">
                    {coupon.startDate} to {coupon.expiryDate}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-gray-900 dark:text-white font-mono">
                      {coupon.usedCount}
                    </span>
                    {coupon.usageLimit && (
                      <span className="text-gray-400 text-[10px]"> / {coupon.usageLimit}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleCouponStatus(coupon.id)}
                      className="cursor-pointer"
                      title="Click to toggle Active / Disabled"
                    >
                      <Badge
                        variant={
                          coupon.status === 'active'
                            ? 'success'
                            : coupon.status === 'expired'
                            ? 'error'
                            : 'default'
                        }
                        dot
                      >
                        {coupon.status}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-right space-x-1">
                    <button
                      onClick={() => handleOpenEdit(coupon)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                      title="Edit Coupon"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ================= CREATE / EDIT COUPON MODAL ================= */}
      {isModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
          title={editingCoupon ? `Edit Coupon "${editingCoupon.code}"` : 'Create New Promotional Coupon'}
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCoupon}>
                {editingCoupon ? 'Save Changes' : 'Create Coupon'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. MORNINGBREW"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono uppercase font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Early Morning Coffee 30% Off"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Description / Promo Rules
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Terms, exclusions, eligibility..."
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Discount Type
                </label>
                <select
                  value={form.discountType}
                  onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Discount Value {form.discountType === 'percentage' ? '(%)' : '(₹)'} *
                </label>
                <input
                  type="number"
                  required
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Max Discount Cap (₹)
                </label>
                <input
                  type="number"
                  value={form.maxDiscount}
                  onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                  placeholder="Optional cap"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Minimum Order Value (₹)
                </label>
                <input
                  type="number"
                  value={form.minOrderValue}
                  onChange={(e) => setForm({ ...form, minOrderValue: Number(e.target.value) })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Guest Eligibility
                </label>
                <select
                  value={form.customerEligibility}
                  onChange={(e) => setForm({ ...form, customerEligibility: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
                >
                  <option value="all">All Customers</option>
                  <option value="new">First-Time Guests Only</option>
                  <option value="vip">Gold & Platinum Members Only</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Global Usage Limit (Total Redemptions)
                </label>
                <input
                  type="number"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  placeholder="e.g. 500"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Usage Limit Per Customer
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.perCustomerLimit}
                  onChange={(e) => setForm({ ...form, perCustomerLimit: Number(e.target.value) })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
                />
              </div>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
