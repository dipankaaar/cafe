import React, { useState } from 'react';
import { useCafe } from '../../../context/CafeContext';
import Card from '../../common/Card';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import Drawer from '../../common/Drawer';
import Modal from '../../common/Modal';
import {
  Users,
  Plus,
  Search,
  Award,
  ShoppingBag,
  DollarSign,
  Phone,
  Mail,
  Calendar,
  Heart,
  Edit2
} from 'lucide-react';

export default function CustomersView() {
  const { customers, orders, addCustomer, updateCustomer } = useCafe();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerForDrawer, setSelectedCustomerForDrawer] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      q === '' ||
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  const getTierBadge = (tier) => {
    switch (tier) {
      case 'Platinum':
        return <Badge variant="purple">Platinum VIP</Badge>;
      case 'Gold':
        return <Badge variant="primary">Gold</Badge>;
      case 'Silver':
        return <Badge variant="info">Silver</Badge>;
      default:
        return <Badge variant="default">Bronze</Badge>;
    }
  };

  const handleSaveCustomer = (e) => {
    e.preventDefault();
    if (!name || !phone) return;

    addCustomer({
      name,
      phone,
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@guest.com`,
      notes
    });

    setIsAddModalOpen(false);
    setName('');
    setPhone('');
    setEmail('');
    setNotes('');
  };

  // Get customer order history
  const customerOrders = selectedCustomerForDrawer
    ? orders.filter((o) => o.customerId === selectedCustomerForDrawer.id)
    : [];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
            Customer Relationship Management (CRM)
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Guest directory, lifetime spending analytics, loyalty points, and purchase history.
          </p>
        </div>

        <Button onClick={() => setIsAddModalOpen(true)} size="sm" icon={Plus}>
          Add Customer
        </Button>
      </div>

      {/* Top Search & Stats */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, email..."
            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 pl-9 pr-3 text-xs text-gray-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-6 text-xs text-gray-500">
          <div>
            Total Registered: <strong className="text-gray-900 dark:text-white">{customers.length}</strong>
          </div>
          <div>
            VIP Members: <strong className="text-[#DD5903]">{customers.filter((c) => ['Gold', 'Platinum'].includes(c.tier)).length}</strong>
          </div>
        </div>
      </Card>

      {/* Customers Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50 dark:bg-[#141414] border-b border-gray-200 dark:border-gray-800 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Customer Name</th>
                <th className="px-5 py-3.5">Phone & Email</th>
                <th className="px-5 py-3.5">Loyalty Tier</th>
                <th className="px-5 py-3.5">Points Balance</th>
                <th className="px-5 py-3.5">Total Orders</th>
                <th className="px-5 py-3.5">Lifetime Spend</th>
                <th className="px-5 py-3.5">Last Visit</th>
                <th className="px-5 py-3.5 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                  <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white">
                    {customer.name}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                    <div>{customer.phone}</div>
                    <div className="text-[10px] text-gray-400">{customer.email}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    {getTierBadge(customer.tier)}
                  </td>
                  <td className="px-5 py-3.5 font-bold font-mono text-[#DD5903]">
                    {customer.loyaltyPoints} pts
                  </td>
                  <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300 font-semibold">
                    {customer.totalOrders} visits
                  </td>
                  <td className="px-5 py-3.5 font-bold font-mono text-gray-900 dark:text-white">
                    ₹{customer.totalSpent.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">
                    {new Date(customer.lastVisit).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => setSelectedCustomerForDrawer(customer)}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-[#DD5903] hover:text-white text-gray-700 dark:text-gray-300 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      View CRM
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ================= CUSTOMER PROFILE DRAWER ================= */}
      {selectedCustomerForDrawer && (
        <Drawer
          isOpen={true}
          onClose={() => setSelectedCustomerForDrawer(null)}
          title={selectedCustomerForDrawer.name}
          subtitle={`Member since 2026 • ${selectedCustomerForDrawer.tier} Tier`}
          size="md"
        >
          <div className="space-y-6 text-xs">
            
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50">
                <span className="text-gray-500">Loyalty Points</span>
                <h4 className="text-xl font-bold font-mono text-[#DD5903] mt-1">
                  {selectedCustomerForDrawer.loyaltyPoints} pts
                </h4>
              </div>
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <span className="text-gray-500">Lifetime Spend</span>
                <h4 className="text-xl font-bold font-mono text-gray-900 dark:text-white mt-1">
                  ₹{selectedCustomerForDrawer.totalSpent.toLocaleString()}
                </h4>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Phone className="w-3.5 h-3.5 text-[#DD5903]" />
                <span>{selectedCustomerForDrawer.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Mail className="w-3.5 h-3.5 text-[#DD5903]" />
                <span>{selectedCustomerForDrawer.email}</span>
              </div>
            </div>

            {/* Guest Notes */}
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Guest Preferences & Allergy Notes
              </label>
              <p className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 italic">
                {selectedCustomerForDrawer.notes || 'No special preferences noted.'}
              </p>
            </div>

            {/* Favorite Drinks */}
            {selectedCustomerForDrawer.favoriteProducts && selectedCustomerForDrawer.favoriteProducts.length > 0 && (
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Frequently Ordered Drinks
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCustomerForDrawer.favoriteProducts.map((p, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-md bg-orange-50 dark:bg-orange-950/40 text-[#DD5903] font-semibold border border-orange-200 dark:border-orange-900/50">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Orders Stream */}
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-[11px] mb-2">
                Order History ({customerOrders.length})
              </h4>
              {customerOrders.length === 0 ? (
                <p className="text-gray-400 py-4 text-center">No past orders recorded for this customer.</p>
              ) : (
                <div className="space-y-2">
                  {customerOrders.map((ord) => (
                    <div key={ord.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-800 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{ord.orderNumber} ({ord.orderType})</p>
                        <p className="text-[10px] text-gray-400">{new Date(ord.orderTime).toLocaleString()}</p>
                      </div>
                      <span className="font-bold font-mono text-[#DD5903]">₹{ord.grandTotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </Drawer>
      )}

      {/* ================= ADD CUSTOMER MODAL ================= */}
      {isAddModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddModalOpen(false)}
          title="Add Customer Profile"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCustomer}>
                Create Profile
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maya Iyer"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98450 12345"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maya@example.com"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Preferences / Allergy Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Oat milk preference, likes window seats..."
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none resize-none"
              />
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
