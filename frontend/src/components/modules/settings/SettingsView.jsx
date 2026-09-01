import React, { useState } from 'react';
import { useCafe } from '../../../context/CafeContext';
import Card from '../../common/Card';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import ConfirmDialog from '../../common/ConfirmDialog';
import {
  Settings,
  Save,
  RotateCcw,
  Store,
  Receipt,
  Percent,
  Award,
  ShieldCheck,
  AlertTriangle,
  Download
} from 'lucide-react';

export default function SettingsView() {
  const { settings, updateSettings, resetAllDataToDefault } = useCafe();
  
  const [form, setForm] = useState({ ...settings });
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    updateSettings({
      ...form,
      taxRate: Number(form.taxRate),
      serviceChargeRate: Number(form.serviceChargeRate),
      loyaltyPointsPerHundred: Number(form.loyaltyPointsPerHundred),
      minPointsToRedeem: Number(form.minPointsToRedeem),
      loyaltyPointRedemptionValue: Number(form.loyaltyPointRedemptionValue)
    });
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(localStorage, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Dinenos_Full_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
            Cafe System Settings
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Configure cafe branding, GSTIN taxes, thermal receipt headers, and database backups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleExportJSON} size="sm" variant="outline" icon={Download}>
            Backup Data (JSON)
          </Button>
          <Button onClick={handleSave} size="sm" icon={Save}>
            Save All Settings
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Card 1: Cafe Identity */}
        <Card
          title="Cafe Identity & Receipt Header"
          subtitle="Displayed on printed bills and customer communications"
        >
          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Cafe Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.cafeName}
                  onChange={(e) => setForm({ ...form, cafeName: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Brand Tagline
                </label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Store Physical Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  GSTIN / Tax ID
                </label>
                <input
                  type="text"
                  value={form.taxNumber}
                  onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono uppercase"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Card 2: Billing & Tax Rates */}
        <Card
          title="Taxation & Invoice Rules"
          subtitle="Configuring GST, Service Charges, and Thermal Receipt messages"
        >
          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  GST Rate (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={form.taxRate}
                  onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Dine-In Service Charge (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={form.serviceChargeRate}
                  onChange={(e) => setForm({ ...form, serviceChargeRate: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Invoice Number Prefix
                </label>
                <input
                  type="text"
                  value={form.invoicePrefix}
                  onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono uppercase"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Thermal Receipt Footer Message
              </label>
              <input
                type="text"
                value={form.invoiceFooterMessage}
                onChange={(e) => setForm({ ...form, invoiceFooterMessage: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Card 3: Danger Zone / Reset Database */}
        <Card
          title="Danger Zone: Database Reset"
          subtitle="Reset all orders, stock deductions, and customer changes back to factory seed data"
          className="border-rose-200 dark:border-rose-900/50"
        >
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-xs font-bold text-rose-600 dark:text-rose-400">
                Factory Demo Reset
              </h5>
              <p className="text-xs text-gray-500 mt-0.5">
                Clears all local storage modifications and restores the original comprehensive dataset.
              </p>
            </div>
            <Button
              type="button"
              variant="danger"
              size="sm"
              icon={RotateCcw}
              onClick={() => setIsResetConfirmOpen(true)}
            >
              Reset All Demo Data
            </Button>
          </div>
        </Card>

      </form>

      {/* ================= RESET CONFIRMATION DIALOG ================= */}
      {isResetConfirmOpen && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setIsResetConfirmOpen(false)}
          title="Confirm Factory Demo Reset"
          message="Are you sure you want to reset all cafe database records? All live test orders, inventory adjustments, and reservations will be restored to original seed demo values."
          confirmText="Yes, Reset Everything"
          onConfirm={resetAllDataToDefault}
        />
      )}

    </div>
  );
}
