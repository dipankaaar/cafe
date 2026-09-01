import React, { useState } from 'react';
import { useCafe } from '../../../context/CafeContext';
import Card from '../../common/Card';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import {
  Award,
  Sparkles,
  Gift,
  Coins,
  ArrowRight,
  TrendingUp,
  Settings,
  Users,
  Edit2
} from 'lucide-react';

export default function LoyaltyView() {
  const { customers, settings, updateSettings, updateCustomer } = useCafe();
  
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [pointsPerHundred, setPointsPerHundred] = useState(settings.loyaltyPointsPerHundred || 1);
  const [minPointsToRedeem, setMinPointsToRedeem] = useState(settings.minPointsToRedeem || 50);

  // Manual Adjust Modal
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState(50);
  const [adjustmentReason, setAdjustmentReason] = useState('Google Review Bonus');

  const totalPointsDistributed = customers.reduce((sum, c) => sum + c.loyaltyPoints, 0);

  const tiers = [
    { name: 'Bronze', minSpend: 0, perk: '1x Points on Coffee & Food', color: 'from-amber-700 to-amber-900', count: customers.filter(c => c.tier === 'Bronze').length },
    { name: 'Silver', minSpend: 2500, perk: '1.25x Points + Free Size Upgrades', color: 'from-slate-400 to-slate-600', count: customers.filter(c => c.tier === 'Silver').length },
    { name: 'Gold', minSpend: 5000, perk: '1.5x Points + Free Monthly Pastry', color: 'from-amber-400 to-yellow-600', count: customers.filter(c => c.tier === 'Gold').length },
    { name: 'Platinum VIP', minSpend: 10000, perk: '2x Points + Priority Table Seating + Exclusive Tasting Invites', color: 'from-purple-600 to-indigo-800', count: customers.filter(c => c.tier === 'Platinum').length }
  ];

  const handleSaveRules = (e) => {
    e.preventDefault();
    updateSettings({
      loyaltyPointsPerHundred: Number(pointsPerHundred),
      minPointsToRedeem: Number(minPointsToRedeem)
    });
    setIsRuleModalOpen(false);
  };

  const handleApplyPointsAdjustment = (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    updateCustomer(selectedCustomer.id, {
      loyaltyPoints: Math.max(0, selectedCustomer.loyaltyPoints + Number(adjustmentAmount))
    });

    setSelectedCustomer(null);
    setAdjustmentAmount(50);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
            Loyalty & Rewards Program
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Configurable points engine, guest tier milestones, and redemption perks.
          </p>
        </div>

        <Button onClick={() => setIsRuleModalOpen(true)} size="sm" icon={Settings} variant="outline">
          Configure Program Rules
        </Button>
      </div>

      {/* Program Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-gray-400">Total Active Points</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-[#DD5903] flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold font-mono text-gray-900 dark:text-white mt-2">
            {totalPointsDistributed.toLocaleString()} pts
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Across {customers.length} registered guests</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-gray-400">Earning Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold font-mono text-gray-900 dark:text-white mt-2">
            ₹100 = {settings.loyaltyPointsPerHundred || 1} pt
          </h3>
          <p className="text-xs text-emerald-600 font-semibold mt-0.5">Auto-awarded upon order completion</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-gray-400">Redemption Rule</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold font-mono text-gray-900 dark:text-white mt-2">
            1 pt = ₹1.00
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Min threshold: {settings.minPointsToRedeem || 50} pts</p>
        </Card>
      </div>

      {/* Tier Architecture */}
      <div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">
          Customer Membership Tiers
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl bg-gradient-to-br ${tier.color} text-white shadow-lg flex flex-col justify-between h-44`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider opacity-80">Tier {idx + 1}</span>
                  <Award className="w-5 h-5 opacity-90" />
                </div>
                <h4 className="text-xl font-bold font-['Arapey',serif] mt-1">{tier.name}</h4>
                <p className="text-[11px] opacity-85 mt-1 leading-snug">{tier.perk}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/20 text-xs">
                <span>Min Spend: ₹{tier.minSpend.toLocaleString()}</span>
                <span className="font-bold bg-white/20 px-2 py-0.5 rounded-full">{tier.count} Guests</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Loyalty Balances Table */}
      <Card
        title="Guest Loyalty Leaderboard"
        subtitle="Individual customer point balances and awards"
        className="p-0 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50 dark:bg-[#141414] border-b border-gray-200 dark:border-gray-800 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Customer Name</th>
                <th className="px-5 py-3.5">Current Tier</th>
                <th className="px-5 py-3.5">Points Balance</th>
                <th className="px-5 py-3.5">Redemption Value</th>
                <th className="px-5 py-3.5">Lifetime Spend</th>
                <th className="px-5 py-3.5 text-right">Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                  <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white">
                    {c.name}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={c.tier === 'Platinum' ? 'purple' : c.tier === 'Gold' ? 'primary' : 'default'}>
                      {c.tier}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 font-bold font-mono text-[#DD5903]">
                    {c.loyaltyPoints} pts
                  </td>
                  <td className="px-5 py-3.5 font-mono text-emerald-600 font-semibold">
                    ₹{c.loyaltyPoints * (settings.loyaltyPointRedemptionValue || 1)}
                  </td>
                  <td className="px-5 py-3.5 font-bold font-mono text-gray-900 dark:text-white">
                    ₹{c.totalSpent.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => setSelectedCustomer(c)}
                      className="px-2.5 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-[#DD5903] hover:text-white text-gray-700 dark:text-gray-300 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Adjust Points
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ================= CONFIGURE RULES MODAL ================= */}
      {isRuleModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsRuleModalOpen(false)}
          title="Configure Loyalty Points Formula"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsRuleModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRules}>
                Save Rules
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveRules} className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Points Earned per ₹100 Spent
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={pointsPerHundred}
                onChange={(e) => setPointsPerHundred(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Minimum Points Required for Redemption
              </label>
              <input
                type="number"
                min="10"
                value={minPointsToRedeem}
                onChange={(e) => setMinPointsToRedeem(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* ================= ADJUST CUSTOMER POINTS MODAL ================= */}
      {selectedCustomer && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCustomer(null)}
          title={`Adjust Points for ${selectedCustomer.name}`}
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setSelectedCustomer(null)}>
                Cancel
              </Button>
              <Button onClick={handleApplyPointsAdjustment}>
                Save Adjustment
              </Button>
            </>
          }
        >
          <form onSubmit={handleApplyPointsAdjustment} className="space-y-3.5 text-xs">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-gray-500">Current Balance:</span>
              <p className="text-base font-bold font-mono text-[#DD5903]">
                {selectedCustomer.loyaltyPoints} points
              </p>
            </div>
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Points delta (+ to add, - to deduct)
              </label>
              <input
                type="number"
                required
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Reason / Note
              </label>
              <input
                type="text"
                required
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="e.g. Goodwill bonus, Birthday treat..."
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
              />
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
