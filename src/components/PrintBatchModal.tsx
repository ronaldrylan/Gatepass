import React, { useState } from 'react';
import { VehicleGatePassData, StoreCheckingPaper, CompanyBranding } from '../types/logistics';
import { GatePassDocument, SingleGatePassCopy } from './GatePassDocument';
import { CheckingPaperDocument } from './CheckingPaperDocument';
import { Printer, X, Eye, FileText, CheckCircle, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { exportGatePassesPDF, exportCheckingPapersPDF } from '../utils/pdfExport';

export type PrintBatchMode = 'gatepasses' | 'checking-papers' | 'single-gatepass';

interface PrintBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: PrintBatchMode;
  gatePasses: VehicleGatePassData[];
  checkingPapers: StoreCheckingPaper[];
  branding: CompanyBranding;
  onConfirmPrinted?: (gatePassNumbers: string[]) => void;
}

export const PrintBatchModal: React.FC<PrintBatchModalProps> = ({
  isOpen,
  onClose,
  mode,
  gatePasses,
  checkingPapers,
  branding,
  onConfirmPrinted
}) => {
  const [activeCopyFilter, setActiveCopyFilter] = useState<'ALL' | 'SECURITY COPY' | 'OFFICE COPY' | 'DRIVER COPY'>('ALL');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    // Notify parent to record print in database if gate passes
    if (mode === 'gatepasses' || mode === 'single-gatepass') {
      const passNumbers = gatePasses.map(g => g.gatePassNumber);
      if (onConfirmPrinted) onConfirmPrinted(passNumbers);
    }

    // Trigger browser print
    window.print();
  };

  const handleSavePdf = () => {
    setIsExportingPdf(true);
    try {
      if (mode === 'gatepasses' || mode === 'single-gatepass') {
        const passNumbers = gatePasses.map(g => g.gatePassNumber);
        if (onConfirmPrinted) onConfirmPrinted(passNumbers);
        exportGatePassesPDF(gatePasses, branding, activeCopyFilter);
      } else if (mode === 'checking-papers') {
        exportCheckingPapersPDF(checkingPapers, branding);
      }
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const totalPagesEstimate = () => {
    if (mode === 'gatepasses' || mode === 'single-gatepass') {
      const multiplier = activeCopyFilter === 'ALL' ? 3 : 1;
      return gatePasses.length * multiplier;
    }
    return checkingPapers.length;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-xs">
      {/* Top Floating Control Bar (hidden during browser printing) */}
      <div className="no-print bg-slate-900 text-white px-6 py-3 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">
              {mode === 'gatepasses' && `Batch Print: ${gatePasses.length} Gate Pass(es)`}
              {mode === 'single-gatepass' && `Gate Pass: ${gatePasses[0]?.vehiclePlate}`}
              {mode === 'checking-papers' && `Batch Manifests: ${checkingPapers.length} Store Location(s)`}
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
              <span>Estimated {totalPagesEstimate()} page(s)</span>
              <span>·</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Company Branding & Logo Attached
              </span>
              {(mode === 'gatepasses' || mode === 'single-gatepass') &&
                gatePasses.some(g => g.stores.length > 12) && (
                  <>
                    <span>·</span>
                    <span className="text-blue-400 font-medium">
                      Flexible Paper (Up to {Math.max(...gatePasses.map(g => g.stores.length))} Rows)
                    </span>
                  </>
                )}
            </p>
          </div>
        </div>

        {/* View / Copy Filters for Gate Passes */}
        {(mode === 'gatepasses' || mode === 'single-gatepass') && (
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setActiveCopyFilter('ALL')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeCopyFilter === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All 3 Copies (Triplicate)
            </button>
            <button
              onClick={() => setActiveCopyFilter('SECURITY COPY')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeCopyFilter === 'SECURITY COPY'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Security Only
            </button>
            <button
              onClick={() => setActiveCopyFilter('OFFICE COPY')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeCopyFilter === 'OFFICE COPY'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Office Only
            </button>
            <button
              onClick={() => setActiveCopyFilter('DRIVER COPY')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeCopyFilter === 'DRIVER COPY'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Driver Only
            </button>
          </div>
        )}

        {/* Zoom & Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 mr-2">
            <button
              onClick={() => setZoomLevel(prev => Math.max(prev - 10, 60))}
              title="Zoom out"
              className="p-1 hover:text-blue-400 text-slate-300"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1 min-w-[42px] text-center text-slate-300">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(prev + 10, 150))}
              title="Zoom in"
              className="p-1 hover:text-blue-400 text-slate-300"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dedicated Save as PDF Button */}
          <button
            onClick={handleSavePdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all disabled:opacity-50"
            title="Download formatted vector PDF document directly to your device"
          >
            <Download className="w-4 h-4" />
            <span>{isExportingPdf ? 'Exporting PDF...' : 'Save as PDF'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-all"
            title="Open browser print dialog"
          >
            <Printer className="w-4 h-4" />
            Print All ({totalPagesEstimate()} Pages)
          </button>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Document Preview Viewport */}
      <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-slate-950/70 print:p-0 print:bg-white print:overflow-visible">
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          className="transition-transform duration-100 max-w-full print:transform-none"
        >
          {/* Gate Pass Rendering */}
          {(mode === 'gatepasses' || mode === 'single-gatepass') && (
            <div className="flex flex-col gap-10 print:gap-0">
              {gatePasses.map((gp, gIdx) => (
                <div
                  key={`${gp.cleanPlate}-${gIdx}`}
                  className={`${gIdx < gatePasses.length - 1 ? 'print:page-break print:break-after-page' : ''}`}
                >
                  {activeCopyFilter === 'ALL' ? (
                    <GatePassDocument
                      data={gp}
                      branding={branding}
                      showAllThreeCopies={true}
                    />
                  ) : (
                    <SingleGatePassCopy
                      data={gp}
                      branding={branding}
                      copyTitle={activeCopyFilter}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Checking Papers Manifests Rendering */}
          {mode === 'checking-papers' && (
            <CheckingPaperDocument
              manifests={checkingPapers}
              branding={branding}
            />
          )}
        </div>
      </div>
    </div>
  );
};
