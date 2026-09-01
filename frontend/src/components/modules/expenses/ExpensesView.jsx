import React, { useState } from 'react';
import { useCafe } from '../../../context/CafeContext';
import Card from '../../common/Card';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import {
  Receipt,
  Plus,
  Search,
  DollarSign,
  TrendingDown,
  Trash2,
  Calendar,
  Layers,
  PieChart as PieIcon
} from 'lucide-react';

export default function ExpensesView() {
  const { expenses, orders, addExpense, deleteExpense } = useCafe();
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Utilities');
  const [amount, setAmount] = useState(1500);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const categories = [
    'Rent & Lease',
    'Utilities',
    'Maintenance',
    'Packaging',
    'Marketing',
    'Staff Payroll',
    'General Supplies'
  ];

  const filteredExpenses = expenses.filter((e) => {
    const matchCat = selectedCategory === 'all' || e.category === selectedCategory;
    const matchSearch =
      searchQuery.trim() === '' ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalExpenseSum = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRevenue = orders
    .filter((o) => o.status === 'Completed')
    .reduce((sum, o) => sum + o.grandTotal, 0);
  const estimatedNetProfit = totalRevenue - totalExpenseSum;

  const handleSaveExpense = (e) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    addExpense({
      title,
      category,
      amount: Number(amount),
      paymentMethod,
      date
    });

    setIsAddModalOpen(false);
    setTitle('');
    setAmount(1500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
            Expense Management
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Log overhead operating expenditures, utility bills, maintenance, and track net profits.
          </p>
        </div>

        <Button onClick={() => setIsAddModalOpen(true)} size="sm" icon={Plus}>
          Record Expense
        </Button>
      </div>

      {/* Financial Health KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-xs font-bold uppercase text-gray-400">Total Recorded Expenses</span>
          <h3 className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
            ₹{totalExpenseSum.toLocaleString()}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Across {expenses.length} logged entries</p>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-bold uppercase text-gray-400">Gross Sales Revenue</span>
          <h3 className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{totalRevenue.toLocaleString()}
          </h3>
          <p className="text-xs text-emerald-600 font-semibold mt-0.5">From completed orders</p>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-bold uppercase text-gray-400">Net Estimated Profit</span>
          <h3 className={`text-2xl font-bold font-mono mt-1 ${estimatedNetProfit >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-rose-600'}`}>
            ₹{estimatedNetProfit.toLocaleString()}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Revenue minus Expenses</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 text-xs font-semibold">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#DD5903] text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === c
                  ? 'bg-[#DD5903] text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search expense title..."
            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 pl-9 pr-3 text-xs text-gray-900 dark:text-white outline-none"
          />
        </div>
      </Card>

      {/* Expenses Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50 dark:bg-[#141414] border-b border-gray-200 dark:border-gray-800 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Expense Description</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Payment Method</th>
                <th className="px-5 py-3.5">Logged By</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                  <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white">
                    {exp.title}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant="default">{exp.category}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 font-mono">
                    {exp.date}
                  </td>
                  <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300">
                    {exp.paymentMethod}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">
                    {exp.loggedBy}
                  </td>
                  <td className="px-5 py-3.5 font-mono font-bold text-rose-600 dark:text-rose-400">
                    ₹{exp.amount.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => deleteExpense(exp.id)}
                      className="p-1.5 rounded text-gray-400 hover:text-rose-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ================= RECORD EXPENSE MODAL ================= */}
      {isAddModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddModalOpen(false)}
          title="Record Operating Expense"
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveExpense}>
                Save Expense
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveExpense} className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Expense Title / Purpose *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Electricity Bill — August"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
                >
                  <option value="Bank Transfer">Bank Transfer / NEFT</option>
                  <option value="UPI / QR">UPI / QR</option>
                  <option value="Company Card">Company Card</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
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
