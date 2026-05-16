import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { QRCodeCanvas } from 'qrcode.react';
import { Icon, icons } from './Icons';

const QRScannerModal = ({ isOpen, onClose, onRegister }) => {
  const [activeTab, setActiveTab] = useState('camera');
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      const scanner = new Html5QrcodeScanner("reader", config, false);
      
      scanner.render((decodedText) => {
        try {
          const data = JSON.parse(decodedText);
          setScanResult(data);
          scanner.clear();
        } catch (e) {
          setError("Invalid QR Code format. Please scan a valid Laptop Inventory QR.");
        }
      }, (err) => {
        // quiet error
      });

      return () => {
        scanner.clear().catch(e => console.error("Scanner clear error", e));
      };
    }
  }, [isOpen, activeTab]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const html5QrCode = new Html5Qrcode("reader-upload");
    try {
      const decodedText = await html5QrCode.scanFile(file, true);
      const data = JSON.parse(decodedText);
      setScanResult(data);
    } catch (err) {
      setError("No QR code found in this image or invalid format.");
    } finally {
      html5QrCode.clear();
    }
  };

  const handleRegister = () => {
    if (scanResult) {
      onRegister(scanResult);
      onClose();
    }
  };

  const resetScan = () => {
    setScanResult(null);
    setError(null);
    if (activeTab === 'camera') {
      // Re-trigger useEffect by toggling tab slightly or just remounting
      setActiveTab('upload');
      setTimeout(() => setActiveTab('camera'), 10);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-2xl bg-surface-950 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
              <Icon d="M3 3h6v6H3V3zm12 0h6v6h-6V3zM3 15h6v6H3v-6zm12 0h6v6h-6v-6zM3 10h1v1H3v-1zm1 1h1v1H4v-1zm1-1h1v1H5v-1zm5 0h1v1h-1v-1zm1 1h1v1h-1v-1zm1-1h1v1h-1v-1zm5 0h1v1h-1v-1zm1 1h1v1h-1v-1zm1-1h1v1h-1v-1zm-5 5h1v1h-1v-1zm1 1h1v1h-1v-1zm1-1h1v1h-1v-1zm5 0h1v1h-1v-1zm1 1h1v1h-1v-1zm1-1h1v1h-1v-1z" className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">QR Inventory Scanner</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-surface-200/40 hover:text-white transition-all">
            <Icon d={icons.close} className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        {!scanResult && (
          <div className="flex px-6 pt-4 gap-2 border-b border-white/5 bg-white/[0.01]">
            <button 
              onClick={() => setActiveTab('camera')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-t-xl transition-all border-b-2 
                ${activeTab === 'camera' ? 'border-brand-500 text-brand-400 bg-brand-500/5' : 'border-transparent text-surface-200/40 hover:text-surface-200/60'}`}
            >
              Scan & Register
            </button>
            <button 
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-t-xl transition-all border-b-2 
                ${activeTab === 'upload' ? 'border-brand-500 text-brand-400 bg-brand-500/5' : 'border-transparent text-surface-200/40 hover:text-surface-200/60'}`}
            >
              Upload QR Image
            </button>
          </div>
        )}

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
              <Icon d={icons.alert} className="w-5 h-5 shrink-0" />
              <span>{error}</span>
              <button onClick={resetScan} className="ml-auto underline font-bold">Try Again</button>
            </div>
          )}

          {!scanResult ? (
            <div className="flex flex-col items-center">
              {activeTab === 'camera' ? (
                <div className="relative w-full max-w-sm aspect-square bg-black/40 rounded-2xl overflow-hidden border border-white/5">
                  <div id="reader" className="w-full h-full"></div>
                  {/* Scanner line animation overlay */}
                  <div className="absolute inset-0 pointer-events-none z-10 border-2 border-brand-500/30">
                    <div className="w-full h-0.5 bg-brand-500 shadow-[0_0_15px_#6366f1] animate-scan-line"></div>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-sm aspect-square border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-8 text-center hover:border-brand-500/40 transition-all group relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" className="w-8 h-8 text-surface-200/40 group-hover:text-brand-400" />
                  </div>
                  <h3 className="text-white font-bold mb-2">Upload QR Code</h3>
                  <p className="text-xs text-surface-200/40">Drag and drop or click to browse image files (PNG, JPG, GIF)</p>
                  <div id="reader-upload" className="hidden"></div>
                </div>
              )}
              <p className="mt-6 text-xs text-surface-200/30 italic">Point your camera at a laptop's QR code to automatically parse its details.</p>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="flex items-center gap-4 mb-6 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Icon d={icons.check} className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-bold">QR Detected Successfully</h3>
                  <p className="text-xs text-emerald-400/60 font-medium">Review the details below before registering.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-white/5 rounded-2xl p-6 border border-white/5">
                {[
                  { label: "Asset ID", value: scanResult.asset_id },
                  { label: "Brand", value: scanResult.brand },
                  { label: "Model", value: scanResult.model },
                  { label: "Processor", value: scanResult.processor },
                  { label: "RAM", value: scanResult.ram },
                  { label: "Storage", value: scanResult.storage },
                  { label: "Status", value: scanResult.status },
                  { label: "Location", value: scanResult.location },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-surface-200/30 uppercase tracking-widest">{item.label}</span>
                    <span className="text-sm text-white font-medium">{item.value || 'N/A'}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={handleRegister}
                  className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-600/20 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Register to Inventory
                </button>
                <button 
                  onClick={resetScan}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all"
                >
                  Rescan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const QRGeneratorModal = ({ isOpen, onClose, laptop }) => {
  const qrRef = useRef(null);

  const downloadQR = () => {
    const canvas = document.getElementById("qr-canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `QR-${laptop.asset_id}-${laptop.brand}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQR = () => {
    const canvas = document.getElementById("qr-canvas");
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    const windowContent = `
      <!DOCTYPE html>
      <html>
        <head><title>Print QR Code</title></head>
        <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">
          <h1 style="margin-bottom:20px;">${laptop.brand} - ${laptop.model}</h1>
          <img src="${dataUrl}" style="width:300px; height:300px;"/>
          <p style="margin-top:20px; font-weight:bold; font-size:24px;">Asset ID: ${laptop.asset_id}</p>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `;
    const printWindow = window.open('', '', 'width=600,height=600');
    printWindow.document.open();
    printWindow.document.write(windowContent);
    printWindow.document.close();
  };

  if (!isOpen || !laptop) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-sm bg-surface-950 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col p-8 items-center text-center">
        <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-surface-200/40 hover:text-white transition-all">
          <Icon d={icons.close} className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-black text-white mb-2 tracking-tight">{laptop.brand}</h2>
        <p className="text-xs text-surface-200/40 font-medium mb-8 uppercase tracking-widest">{laptop.model}</p>

        <div className="p-4 bg-white rounded-[2rem] shadow-[0_0_50px_rgba(255,255,255,0.05)] mb-8">
          <QRCodeCanvas 
            id="qr-canvas"
            value={JSON.stringify(laptop)} 
            size={250}
            level={"H"}
            includeMargin={true}
          />
        </div>

        <div className="w-full space-y-3">
          <button 
            onClick={downloadQR}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2"
          >
            <Icon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" className="w-4 h-4" />
            Download QR Code
          </button>
          <button 
            onClick={printQR}
            className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print QR Code
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
