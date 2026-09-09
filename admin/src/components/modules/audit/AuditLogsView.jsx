import React, { useState } from 'react';
import { useCafe } from '../../../context/CafeContext';
import Card from '../../common/Card';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import {
  ScrollText,
  Search,
  Clock,
  Shield,
  Filter,
  Download,
  Terminal
} from 'lucide-react';

export default function AuditLogsView() {
  const { auditLogs } = useCafe();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['Orders', 'Menu', 'Inventory', 'Staff', 'Auth', 'Coupons', 'Expenses', 'Reservations', 'Settings'];

  const filteredLogs = auditLogs.filter((log) => {
    const matchCat = selectedCategory === 'all' || log.category === selectedCategory;
    const matchSearch =
      searchQuery.trim() === '' ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const getActionBadge = (action) => {
    if (action.includes('CREATE') || action.includes('ADD')) {
      return <Badge variant="success" size="sm">{action}</Badge>;
    }
    if (action.includes('DELETE') || action.includes('CANCEL')) {
      return <Badge variant="error" size="sm">{action}</Badge>;
    }
    if (action.includes('UPDATE') || action.includes('ADJUST')) {
      return <Badge variant="primary" size="sm">{action}</Badge>;
    }
    return <Badge variant="info" size="sm">{action}</Badge>;
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
            System Audit Trails & Security Logs
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Immutable chronological ledger of staff actions, order lifecycle transitions, and stock audits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="purple" dot>
            {auditLogs.length} Events Logged
          </Badge>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
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
            placeholder="Search action, details, user..."
            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 pl-9 pr-3 text-xs text-gray-900 dark:text-white outline-none font-mono"
          />
        </div>
      </Card>

      {/* Audit Log Stream Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50 dark:bg-[#141414] border-b border-gray-200 dark:border-gray-800 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">User Identity</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Action Code</th>
                <th className="px-5 py-3.5">Operation Details</th>
                <th className="px-5 py-3.5">Client IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 font-mono text-[11px]">
                  <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white">
                    {log.user}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {log.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {getActionBadge(log.action)}
                  </td>
                  <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300 font-sans text-xs max-w-md">
                    {log.details}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400">
                    {log.ip || '127.0.0.1'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
