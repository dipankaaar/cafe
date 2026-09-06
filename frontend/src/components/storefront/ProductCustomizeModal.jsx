import React, { useMemo, useState } from 'react';
import { X, Minus, Plus, ShoppingBag, Milk, Droplets, Ruler } from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { formatINR, getProductImage, getProductPrice, handleImageFallback } from '../../utils/formatters';

const SIZE_OPTIONS = [
  { id: 'regular', label: 'Regular', delta: 0 },
  { id: 'medium', label: 'Medium', delta: 30 },
  { id: 'large', label: 'Large', delta: 60 }
];

const MILK_OPTIONS = [
  { id: 'regular', label: 'Regular Milk', delta: 0 },
  { id: 'oat', label: 'Oat Milk', delta: 30 },
  { id: 'almond', label: 'Almond Milk', delta: 40 },
  { id: 'soy', label: 'Soy Milk', delta: 30 }
];

const SYRUP_OPTIONS = [
  { id: 'none', label: 'No Syrup', delta: 0 },
  { id: 'vanilla', label: 'Vanilla', delta: 25 },
  { id: 'caramel', label: 'Caramel', delta: 25 },
  { id: 'hazelnut', label: 'Hazelnut', delta: 30 },
  { id: 'chocolate', label: 'Chocolate', delta: 30 }
];

export default function ProductCustomizeModal({ product, onClose, onConfirm }) {
  const { addons = [] } = useCafe();
  const [size, setSize] = useState('regular');
  const [milk, setMilk] = useState('regular');
  const [syrup, setSyrup] = useState('none');
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [qty, setQty] = useState(1);

  const availableAddons = useMemo(
    () => (addons || []).filter((a) => a.isAvailable !== false).slice(0, 8),
    [addons]
  );

  const basePrice = getProductPrice(product);

  const unitPrice = useMemo(() => {
    const sizeDelta = SIZE_OPTIONS.find((s) => s.id === size)?.delta || 0;
    const milkDelta = MILK_OPTIONS.find((m) => m.id === milk)?.delta || 0;
    const syrupDelta = SYRUP_OPTIONS.find((s) => s.id === syrup)?.delta || 0;
    const addonsTotal = selectedAddons.reduce((sum, id) => {
      const a = availableAddons.find((x) => x.id === id);
      return sum + Number(a?.price || 0);
    }, 0);
    return basePrice + sizeDelta + milkDelta + syrupDelta + addonsTotal;
  }, [basePrice, size, milk, syrup, selectedAddons, availableAddons]);

  if (!product) return null;

  const toggleAddon = (id) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const variantLabel = [
    size !== 'regular' ? SIZE_OPTIONS.find((s) => s.id === size)?.label : null,
    milk !== 'regular' ? MILK_OPTIONS.find((m) => m.id === milk)?.label : null,
    syrup !== 'none' ? `${SYRUP_OPTIONS.find((s) => s.id === syrup)?.label} Syrup` : null
  ].filter(Boolean).join(' • ') || 'Standard';

  const handleConfirm = () => {
    const addonDetails = selectedAddons
      .map((id) => availableAddons.find((x) => x.id === id))
      .filter(Boolean)
      .map((a) => ({ id: a.id, name: a.name, price: Number(a.price || 0) }));
    onConfirm?.(product, qty, variantLabel, addonDetails, unitPrice);
    onClose?.();
  };

  const OptionRow = ({ icon: Icon, title, options, value, onChange }) => (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
        <Icon className="w-3.5 h-3.5 text-[#DD5903]" />
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
              value === opt.id
                ? 'bg-[#DD5903] text-white border-[#DD5903] shadow-md shadow-orange-500/20'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#DD5903]/50'
            }`}
          >
            {opt.label}
            {opt.delta > 0 && <span className="opacity-80"> +{formatINR(opt.delta, { whole: true })}</span>}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" role="dialog" aria-modal="true" aria-label={`Customize ${product.name}`}>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="min-h-screen px-4 py-8 flex items-center justify-center relative z-10">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-scaleUp">
          <div className="relative h-48 sm:h-56 bg-gray-100">
            <img
              src={getProductImage(product)}
              alt={product.name}
              onError={handleImageFallback}
              className="w-full h-full object-cover"
            />
            <button
              onClick={onClose}
              aria-label="Close customization"
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg truncate">{product.name}</h3>
                <p className="text-xs text-white/80">Base {formatINR(basePrice, { whole: true })}</p>
              </div>
              <span className="text-lg font-bold text-white bg-[#DD5903] px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
                {formatINR(unitPrice, { whole: true })}
              </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          <div className="p-5 sm:p-6 space-y-5 max-h-[55vh] overflow-y-auto">
            <OptionRow icon={Ruler} title="Size" options={SIZE_OPTIONS} value={size} onChange={setSize} />
            <OptionRow icon={Milk} title="Milk" options={MILK_OPTIONS} value={milk} onChange={setMilk} />
            <OptionRow icon={Droplets} title="Syrup" options={SYRUP_OPTIONS} value={syrup} onChange={setSyrup} />

            {availableAddons.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Extra Add-ons</p>
                <div className="space-y-2">
                  {availableAddons.map((a) => (
                    <label
                      key={a.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                        selectedAddons.includes(a.id)
                          ? 'border-[#DD5903] bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={selectedAddons.includes(a.id)}
                          onChange={() => toggleAddon(a.id)}
                          className="w-4 h-4 accent-[#DD5903]"
                        />
                        <span className="text-sm font-semibold text-gray-800">{a.name}</span>
                      </span>
                      <span className="text-sm font-bold text-[#DD5903]">+{formatINR(a.price, { whole: true })}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-5 sm:p-6 pt-0 flex items-center gap-3">
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 py-2.5 text-gray-500 hover:bg-gray-100 cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-3 text-sm font-bold min-w-[28px] text-center">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(20, q + 1))}
                className="px-3 py-2.5 text-gray-500 hover:bg-gray-100 cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleConfirm}
              className="flex-1 dinenos-btn !py-3 text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              Add • {formatINR(unitPrice * qty)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
