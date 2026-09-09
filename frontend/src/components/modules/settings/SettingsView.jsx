import React, { useState } from 'react';
import { useCafe } from '../../../context/CafeContext';
import Card from '../../common/Card';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
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
  Download,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Phone,
  CheckCircle2
} from 'lucide-react';

const inputCls = 'w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none';

export default function SettingsView() {
  const { settings, updateSettings, resetAllDataToDefault, branches, addBranch, updateBranch, deleteBranch, activeBranchId, switchBranch } = useCafe();

  const [activeTab, setActiveTab] = useState('general'); // general | branches
  const [form, setForm] = useState({ ...settings });
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Branch editor state
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchForm, setBranchForm] = useState({ name: '', code: '', address: '', phone: '', email: '', managerName: '', openingHours: '', isActive: true });
  const [branchError, setBranchError] = useState('');
  const [branchBusy, setBranchBusy] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);

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
    downloadAnchor.setAttribute('download', `Petuk_Adda_Cafe_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const openAddBranch = () => {
    setEditingBranch(null);
    setBranchForm({ name: '', code: '', address: '', phone: '', email: '', managerName: '', openingHours: '', isActive: true });
    setBranchError('');
    setBranchModalOpen(true);
  };

  const openEditBranch = (b) => {
    setEditingBranch(b);
    setBranchForm({ name: b.name || '', code: b.code || '', address: b.address || '', phone: b.phone || '', email: b.email || '', managerName: b.managerName || '', openingHours: b.openingHours || '', isActive: b.isActive !== false });
    setBranchError('');
    setBranchModalOpen(true);
  };

  const handleSaveBranch = async (e) => {
    e.preventDefault();
    if (!branchForm.name.trim()) { setBranchError('Branch name is required'); return; }
    setBranchBusy(true);
    setBranchError('');
    try {
      if (editingBranch) {
        await updateBranch(editingBranch.id, { ...branchForm, name: branchForm.name.trim(), code: branchForm.code.trim() || undefined });
      } else {
        await addBranch({ ...branchForm, name: branchForm.name.trim(), code: branchForm.code.trim() || undefined });
      }
      setBranchModalOpen(false);
    } catch (err) {
      setBranchError(err.message || 'Could not save branch');
    } finally {
      setBranchBusy(false);
    }
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
            Configure cafe branding, GSTIN taxes, outlets, thermal receipt headers, and database backups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleExportJSON} size="sm" variant="outline" icon={Download}>
            Backup Data (JSON)
          </Button>
          {activeTab === 'general' && (
            <Button onClick={handleSave} size="sm" icon={Save}>
              Save All Settings
            </Button>
          )}
          {activeTab === 'branches' && (
            <Button onClick={openAddBranch} size="sm" icon={Plus}>
              Add Branch
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {[
          { id: 'general', label: 'General Settings' },
          { id: 'branches', label: `Branches${branches.length > 0 ? ` (${branches.length})` : ''}` }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === t.id
                ? 'bg-[#DD5903] text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-[#DD5903]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'branches' ? (
        <div className="space-y-4">
          <Card title="Outlet Branches" subtitle="Each outlet gets its own tables, orders, and reports slice. Menu & inventory stay shared.">
            {branches.length === 0 ? (
              <p className="text-xs text-gray-500">No branches synced yet — start the backend API to load outlets, or add one below.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {branches.map((b) => (
                  <div key={b.id} className={`p-4 rounded-xl border text-xs space-y-2 ${activeBranchId === b.id ? 'border-[#DD5903] bg-orange-50/50 dark:bg-orange-950/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                          <Store className="w-4 h-4 text-[#DD5903]" /> {b.name}
                        </p>
                        <p className="font-mono text-[10px] text-gray-400">{b.code}</p>
                      </div>
                      <Badge variant={b.isActive !== false ? 'success' : 'error'}>{b.isActive !== false ? 'Active' : 'Closed'}</Badge>
                    </div>
                    {b.address && <p className="flex items-start gap-1.5 text-gray-500"><MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{b.address}</p>}
                    {b.phone && <p className="flex items-center gap-1.5 text-gray-500"><Phone className="w-3.5 h-3.5" />{b.phone}</p>}
                    {b.stats && (
                      <p className="text-gray-500">
                        {b.stats.ordersCount} orders • ₹{Number(b.stats.revenue || 0).toFixed(0)} lifetime • {b.stats.tablesCount} tables ({b.stats.occupiedTables} occupied) • {b.stats.activeOrders} active
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 pt-1">
                      <Button size="sm" variant={activeBranchId === b.id ? 'secondary' : 'outline'} onClick={() => switchBranch(activeBranchId === b.id ? 'all' : b.id)}>
                        {activeBranchId === b.id ? 'Viewing (click: All)' : 'View only this'}
                      </Button>
                      <button onClick={() => openEditBranch(b)} title="Edit branch" className="p-1.5 rounded-lg text-gray-500 hover:text-[#DD5903] hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Pencil className="w-4 h-4" />
                      </button>
                      {b.id !== 'br-main' && (
                        <button
                          onClick={async () => {
                            try {
                              await deleteBranch(b.id);
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          title="Delete branch"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Branch editor modal */}
          {branchModalOpen && (
            <Modal
              isOpen={true}
              onClose={() => setBranchModalOpen(false)}
              title={editingBranch ? `Edit ${editingBranch.name}` : 'Open New Branch'}
              subtitle="Outlets share one menu; tables, orders and reports stay per-branch"
              size="md"
              footer={
                <>
                  <Button variant="secondary" onClick={() => setBranchModalOpen(false)}>Cancel</Button>
                  <Button icon={CheckCircle2} disabled={branchBusy} onClick={handleSaveBranch}>
                    {branchBusy ? 'Saving…' : editingBranch ? 'Save Changes' : 'Open Branch'}
                  </Button>
                </>
              }
            >
              <form onSubmit={handleSaveBranch} className="space-y-3 text-xs">
                {branchError && <p className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600">{branchError}</p>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Branch Name *</label>
                    <input autoFocus value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} placeholder="Petuk Adda — Salt Lake" className={inputCls} />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Code (auto if empty)</label>
                    <input value={branchForm.code} onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value.toUpperCase() })} placeholder="SALTLAKE" className={`${inputCls} font-mono uppercase`} />
                  </div>
                </div>
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Address</label>
                  <input value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} className={inputCls} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Phone</label>
                    <input value={branchForm.phone} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Manager</label>
                    <input value={branchForm.managerName} onChange={(e) => setBranchForm({ ...branchForm, managerName: e.target.value })} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Opening Hours</label>
                  <input value={branchForm.openingHours} onChange={(e) => setBranchForm({ ...branchForm, openingHours: e.target.value })} placeholder="10:00 AM – 10:00 PM" className={inputCls} />
                </div>
                <label className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={branchForm.isActive} onChange={(e) => setBranchForm({ ...branchForm, isActive: e.target.checked })} className="w-4 h-4 accent-[#DD5903]" />
                  Branch is open for orders
                </label>
              </form>
            </Modal>
          )}
        </div>
      ) : (
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

        {/* Card 1.5: Storefront Homepage Hero Banner */}
        <Card
          title="Storefront Homepage & Hero Banner"
          subtitle="Customize the main welcome text, badges, titles, and banner displayed on customer website"
        >
          <div className="space-y-4 text-xs">
            {/* Live Preview Box */}
            <div className="p-4 rounded-xl bg-[#2A180E] border border-orange-500/30 text-center relative overflow-hidden shadow-inner">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DD5903]/20 border border-[#DD5903]/40 text-[#DD5903] text-[10px] font-bold uppercase tracking-wider mb-2">
                <span>{form.heroBadge || 'ARTISAN COFFEE & GOURMET DINING • SALBONI'}</span>
              </div>
              <h3 className="text-xl sm:text-2xl text-white font-[Playfair_Display,serif] font-normal leading-tight">
                {form.heroTitlePrefix || 'Welcome To'}{' '}
                <span className="italic text-[#F5A623]">{form.heroTitleHighlight || form.cafeName || 'Petuk Adda Cafe'}</span>
              </h3>
              <p className="text-gray-300 text-xs mt-1.5 max-w-xl mx-auto line-clamp-2">
                {form.heroSubtitle || form.tagline || 'Where every sip and bite tells a story.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Tagline Badge Text
                </label>
                <input
                  type="text"
                  placeholder="e.g. ARTISAN COFFEE & GOURMET DINING • SALBONI"
                  value={form.heroBadge || ''}
                  onChange={(e) => setForm({ ...form, heroBadge: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Heading Prefix Text
                </label>
                <input
                  type="text"
                  placeholder="e.g. Welcome To"
                  value={form.heroTitlePrefix || ''}
                  onChange={(e) => setForm({ ...form, heroTitlePrefix: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Highlighted Title / Brand Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Petuk Adda Cafe"
                  value={form.heroTitleHighlight || ''}
                  onChange={(e) => setForm({ ...form, heroTitleHighlight: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-semibold text-[#DD5903]"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Hero Background Image URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={form.heroImage || ''}
                  onChange={(e) => setForm({ ...form, heroImage: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Hero Subtitle / Description
              </label>
              <textarea
                rows={2}
                placeholder="Where every sip and bite tells a story..."
                value={form.heroSubtitle || ''}
                onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none resize-none"
              />
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
      )}

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
