import React, { useState, useRef, useEffect } from 'react';
import { X, QrCode, Camera, ArrowRight, AlertCircle } from 'lucide-react';

export default function WebsiteQrScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [tokenInput, setTokenInput] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError('');
    setIsScanning(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        setCameraError('Camera access not supported on this browser. You can enter your table token below.');
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('Camera permission denied or camera not found. Please enter your table QR token below.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    let token = tokenInput.trim();
    // If user pasted a full URL like http://.../#order/qrt_...
    if (token.includes('#order/')) {
      token = token.split('#order/')[1];
    } else if (token.includes('/order/')) {
      token = token.split('/order/')[1];
    }

    stopCamera();
    onClose();
    if (onScanSuccess) {
      onScanSuccess(token);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1C1C1C] border border-white/10 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#161616]">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#DD5903]" />
            <h3 className="font-bold text-white text-sm">Scan Table QR Code</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video / Camera View */}
        <div className="p-4 space-y-4">
          <div className="relative w-full h-56 bg-black rounded-xl overflow-hidden flex items-center justify-center border border-white/10">
            {cameraError ? (
              <div className="text-center p-4 space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-xs text-gray-300">{cameraError}</p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-dashed border-[#DD5903] rounded-xl m-8 pointer-events-none animate-pulse flex items-center justify-center">
                  <span className="text-[10px] bg-black/60 px-2 py-0.5 rounded text-white/90">
                    Align Table QR within frame
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Manual Token Fallback */}
          <div className="pt-2 border-t border-white/10">
            <p className="text-xs text-gray-400 mb-2">Or enter your table token / ordering URL:</p>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. qrt_t01_1420"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="flex-1 bg-[#151515] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-[#DD5903]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#DD5903] hover:bg-[#c44e02] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Open</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          <p className="text-[11px] text-gray-500 text-center">
            💡 Tip: You can also scan the physical table tent QR directly using your smartphone's built-in camera or Google Lens without opening this popup.
          </p>
        </div>

      </div>
    </div>
  );
}
