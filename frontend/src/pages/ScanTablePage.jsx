import React, { useState, useRef, useEffect } from 'react';
import { 
  QrCode, 
  Camera, 
  ArrowLeft, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  RotateCw, 
  Store, 
  ChevronRight,
  Utensils
} from 'lucide-react';
import { useCafe } from '../context/CafeContext';
import BrandLogo from '../components/common/BrandLogo';
import QrTableOrderingView from '../components/storefront/QrTableOrderingView';

export default function ScanTablePage({ onNavigate, initialTableToken }) {
  const { tables } = useCafe();

  const [activeTableToken, setActiveTableToken] = useState(initialTableToken || null);
  const [manualTableNumber, setManualTableNumber] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(true);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Camera initialization
  useEffect(() => {
    if (!activeTableToken) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTableToken]);

  const startCamera = async () => {
    setCameraError('');
    setIsCameraActive(false);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraActive(true);
        }
      } else {
        setCameraError('Camera access is not supported on this device/browser. Please enter table number manually.');
      }
    } catch (err) {
      setCameraError('Camera permission was denied or no camera device found. Please enter your table number manually below.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleManualTableSubmit = (e) => {
    e.preventDefault();
    if (!manualTableNumber.trim()) return;

    let token = manualTableNumber.trim();
    if (token.includes('#order/')) token = token.split('#order/')[1];
    else if (token.includes('/order/')) token = token.split('/order/')[1];

    handleSelectTableToken(token);
  };

  const handleSelectTableToken = (token) => {
    stopCamera();
    setActiveTableToken(token);
    // Update hash for deep link persistence if needed
    window.location.hash = `order/${token}`;
  };

  // If a table is active/identified, render the complete digital self-order table experience
  if (activeTableToken) {
    return (
      <QrTableOrderingView
        qrToken={activeTableToken}
        onBackToStorefront={() => {
          setActiveTableToken(null);
          window.location.hash = '';
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white font-['Plus_Jakarta_Sans',sans-serif] pb-20">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#141414]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-gray-300 hover:text-[#DD5903] transition-colors py-1 px-2 rounded-lg hover:bg-white/5 cursor-pointer"
            title="Return to Home"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          <BrandLogo size="small" light={true} />
        </div>

        <button
          onClick={() => onNavigate('/order-online')}
          className="text-xs text-gray-300 hover:text-[#DD5903] font-semibold flex items-center gap-1"
        >
          <span>Need Delivery Instead?</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-10">
        
        {/* Title & Instructions */}
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DD5903]/20 border border-[#DD5903]/40 text-[#DD5903] text-xs font-bold uppercase tracking-wider">
            <QrCode className="w-3.5 h-3.5" />
            <span>Digital Table Self-Order</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-normal font-['Arapey',serif] text-white">
            Scan Table <span className="italic text-[#DD5903]">QR Code</span>
          </h1>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Scan your table QR to view/order from your table. Point your camera at the acrylic tent card located on your dining table.
          </p>
        </div>

        {/* ================= LARGE QR SCANNER VIEWPORT ================= */}
        <div className="max-w-md mx-auto bg-[#161616] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
          
          {/* Decorative scanner frame */}
          <div className="relative aspect-square w-full rounded-2xl bg-black overflow-hidden flex items-center justify-center border-2 border-dashed border-[#DD5903]/50">
            
            {/* Live Camera Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
            />

            {/* Fallback Camera Placeholder if permission denied / loading */}
            {!isCameraActive && (
              <div className="text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#222222] border border-white/10 flex items-center justify-center mx-auto text-[#DD5903]">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Camera Viewfinder</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {cameraError ? cameraError : 'Requesting camera access...'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Retry Camera
                </button>
              </div>
            )}

            {/* Target Corners Overlay */}
            <div className="absolute inset-8 pointer-events-none border-2 border-transparent">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#DD5903] rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#DD5903] rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#DD5903] rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#DD5903] rounded-br-lg" />

              {/* Animated Laser Scan Line */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#DD5903] to-transparent shadow-[0_0_12px_#DD5903] animate-bounce" />
            </div>
          </div>

          <div className="text-center space-y-1">
            <p className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#DD5903]" />
              <span>Align QR code within the frame</span>
            </p>
            <p className="text-[11px] text-gray-400">
              Orders submitted will be routed directly to Petuk Adda Cafe kitchen.
            </p>
          </div>

        </div>

        {/* ================= FALLBACK: ENTER TABLE NUMBER MANUALLY ================= */}
        <div className="max-w-xl mx-auto bg-[#161616] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="text-center space-y-1">
            <h3 className="text-lg font-bold font-['Arapey',serif] text-white">
              Can't scan? Enter Table Number Manually
            </h3>
            <p className="text-xs text-gray-400">
              Type your table number (e.g. <strong className="text-amber-400">T-01, T-02, 1, 2</strong>) or choose from available tables below.
            </p>
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleManualTableSubmit} className="flex gap-2">
            <input
              type="text"
              required
              placeholder="e.g. T-02 or 2"
              value={manualTableNumber}
              onChange={(e) => setManualTableNumber(e.target.value.toUpperCase())}
              className="flex-1 bg-[#101010] border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-[#DD5903] font-mono font-bold"
            />
            <button
              type="submit"
              className="dinenos-btn !py-3 !px-6 text-xs uppercase font-bold tracking-wider cursor-pointer flex items-center gap-1.5 shadow-lg"
            >
              <span>Open Menu</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Table Selector Grid */}
          <div className="space-y-2.5 pt-2 border-t border-white/10">
            <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400">
              Quick Select Available Tables:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {tables.map((tbl) => (
                <button
                  key={tbl.id}
                  type="button"
                  onClick={() => handleSelectTableToken(tbl.tableNumber)}
                  className="p-3 bg-[#111111] hover:bg-[#1f1f1f] border border-white/10 hover:border-[#DD5903] rounded-xl text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm group-hover:text-[#DD5903]">{tbl.tableNumber}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{tbl.zone} • {tbl.capacity} Seats</p>
                </button>
              ))}
            </div>
          </div>
        </div>

      </main>

    </div>
  );
}
