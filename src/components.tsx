
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import QRCode from "qrcode";
import { Html5QrcodeScanner } from "html5-qrcode";

export const QRCodeDisplay = ({ text }: { text: string }) => {
  const [src, setSrc] = useState('');
  useEffect(() => {
    QRCode.toDataURL(text, { width: 300, margin: 2 }).then(setSrc);
  }, [text]);
  return src ? <img src={src} className="w-52 h-52 object-contain rounded-3xl" alt="QR Code" /> : <div className="w-52 h-52 bg-slate-100 animate-pulse rounded-3xl" />;
};

export const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children?: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-[4px] animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[92vh]">
        <div className="w-full pt-4 pb-2 cursor-grab active:cursor-grabbing" onClick={onClose}>
          <div className="w-16 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />
        </div>
        <div className="flex items-center justify-between px-8 pt-2 mb-2">
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">{title}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 dark:bg-slate-800 rounded-full active:scale-90 transition-transform"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-8 pb-12">
          <div className="py-4 space-y-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

export const QRScanner = ({ onScan, onClose }: { onScan: (data: string) => void; onClose: () => void }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    scanner.render((result) => {
      onScan(result);
      scanner.clear().catch(() => {});
    }, () => {});
    return () => { scanner.clear().catch(() => {}); };
  }, [onScan]);
  return (
    <div className="fixed inset-0 z-[700] bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 rounded-[2.5rem] overflow-hidden p-4 relative shadow-2xl border border-white/5">
        <button onClick={onClose} className="absolute top-6 right-6 z-10 p-3 bg-white/20 text-white rounded-full backdrop-blur-md active:scale-90"><X size={24} /></button>
        <div id="reader" className="w-full"></div>
      </div>
    </div>
  );
};
