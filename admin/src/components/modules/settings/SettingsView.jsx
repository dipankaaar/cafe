import React, { useState } from 'react';
import { useCafe } from '../../../context/CafeContext';
import Card from '../../common/Card';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import ConfirmDialog from '../../common/ConfirmDialog';
import { api } from '../../../services/api';
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
  Smartphone,
  RefreshCw,
  QrCode,
  CheckCircle2
} from 'lucide-react';

export default function SettingsView() {
  const { settings, updateSettings, resetAllDataToDefault } = useCafe();
  
  const [form, setForm] = useState({ ...settings });
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // WhatsApp Baileys integration state
  const [waStatus, setWaStatus] = useState({ status: 'CONNECTING', connected: false });
  const [waQrDataUrl, setWaQrDataUrl] = useState('');
  const [isLoadingWa, setIsLoadingWa] = useState(false);
  const [pairingPhone, setPairingPhone] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [isPairingLoading, setIsPairingLoading] = useState(false);
  const [pairingError, setPairingError] = useState('');

  const fetchWhatsAppStatus = async () => {
    setIsLoadingWa(true);
    try {
      const res = await api.getWhatsAppStatus();
      const data = res?.data || res;
      setWaStatus(data || { status: 'DISCONNECTED', connected: false });
      if (data?.qrDataUrl) {
        setWaQrDataUrl(data.qrDataUrl);
      }
    } catch (e) {
      console.warn('Could not fetch WhatsApp status:', e);
    } finally {
      setIsLoadingWa(false);
    }
  };

  React.useEffect(() => {
    fetchWhatsAppStatus();
    const interval = setInterval(fetchWhatsAppStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRequestPairingCode = async (e) => {
    e.preventDefault();
    if (!pairingPhone || pairingPhone.length < 10) {
      setPairingError('Please enter a valid 10-digit phone number');
      return;
    }
    setIsPairingLoading(true);
    setPairingError('');
    try {
      const res = await api.requestWhatsAppPairing(pairingPhone);
      const code = res?.data?.code || res?.code;
      if (code) {
        setPairingCode(code);
      }
    } catch (err) {
      setPairingError(err?.message || 'Could not request pairing code');
    } finally {
      setIsPairingLoading(false);
    }
  };

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

        {/* Card 2.5: WhatsApp Baileys Gateway & OTP Bot */}
        <Card
          title="WhatsApp Baileys Gateway & OTP Bot"
          subtitle="Direct WhatsApp Web integration for automated mobile OTP login & order dispatch alerts"
        >
          <div className="space-y-4 text-xs">
            {/* Status Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${waStatus.connected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : waStatus.status === 'SCAN_QR' ? 'bg-amber-500 animate-pulse' : 'bg-gray-400'}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 dark:text-white">Status:</span>
                    <Badge variant={waStatus.connected ? 'success' : waStatus.status === 'SCAN_QR' ? 'warning' : 'neutral'}>
                      {waStatus.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {waStatus.connected
                      ? 'WhatsApp Bot is linked and actively delivering customer verification OTPs.'
                      : waStatus.status === 'SCAN_QR'
                      ? 'Scan the QR code below using your WhatsApp (Linked Devices) to activate.'
                      : 'Connecting to WhatsApp Baileys socket...'}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={RefreshCw}
                onClick={fetchWhatsAppStatus}
                disabled={isLoadingWa}
              >
                {isLoadingWa ? 'Checking...' : 'Refresh Status'}
              </Button>
            </div>

            {/* QR Code Display when pairing */}
            {!waStatus.connected && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* QR Code */}
                <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-center flex flex-col items-center justify-center">
                  <h6 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-[#DD5903]" />
                    <span>Scan with WhatsApp</span>
                  </h6>
                  {waQrDataUrl ? (
                    <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 inline-block my-2">
                      <img src={waQrDataUrl} alt="WhatsApp QR Code" className="w-44 h-44 object-contain" />
                    </div>
                  ) : (
                    <div className="w-44 h-44 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 text-center p-4 my-2">
                      <span>Waiting for QR from Baileys engine...</span>
                    </div>
                  )}
                  <p className="text-[11px] text-gray-500 mt-1 max-w-xs">
                    Open WhatsApp on your phone ➔ Linked Devices ➔ Link a Device ➔ Scan this QR code.
                  </p>
                </div>

                {/* Pairing Code Alternative */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-xl flex flex-col justify-between">
                  <div>
                    <h6 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-500" />
                      <span>Link with Phone Number (Pairing Code)</span>
                    </h6>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
                      Alternative: Enter your WhatsApp phone number to receive an 8-character pairing code.
                    </p>

                    <div className="flex gap-2">
                      <input
                        type="tel"
                        maxLength="10"
                        value={pairingPhone}
                        onChange={(e) => setPairingPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="10-digit number"
                        className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs outline-none"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleRequestPairingCode}
                        disabled={isPairingLoading || pairingPhone.length < 10}
                      >
                        {isPairingLoading ? 'Generating...' : 'Get Code'}
                      </Button>
                    </div>

                    {pairingError && <p className="text-rose-500 text-[11px] mt-1.5">{pairingError}</p>}

                    {pairingCode && (
                      <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-center">
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase block">
                          Your Pairing Code:
                        </span>
                        <span className="text-xl font-mono font-black text-emerald-700 dark:text-emerald-300 tracking-widest">
                          {pairingCode}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700 text-[11px] text-gray-500">
                    💡 Simulated OTP delivery is always enabled as fallback so your app never fails even when WhatsApp is offline.
                  </div>
                </div>
              </div>
            )}
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
