import React, { useState, useRef } from 'react';
import { parseExcelFile, downloadSampleTemplate, ParseResult } from '../utils/excelParser';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, Download, RefreshCw } from 'lucide-react';

interface DailyDataUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataLoaded: (result: ParseResult, mode: 'replace' | 'append') => void;
  onResetSample: () => void;
}

export const DailyDataUploadModal: React.FC<DailyDataUploadModalProps> = ({
  isOpen,
  onClose,
  onDataLoaded,
  onResetSample
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    if (!file) return;
    setErrorMsg('');
    setLoading(true);
    setFileName(file.name);

    try {
      const result = await parseExcelFile(file);
      if (result.deliveryPlan.length === 0 && result.ibtData.length === 0) {
        setErrorMsg('No recognizable delivery plan or IBT rows found in this file. Please verify sheet headers or check the template.');
        setParseResult(null);
      } else {
        setParseResult(result);
      }
    } catch (err: any) {
      setErrorMsg(`Failed to parse file: ${err.message || 'Unknown error'}`);
      setParseResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleApply = () => {
    if (!parseResult) return;
    onDataLoaded(parseResult, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Upload Daily Logistics Data</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Upload your daily Excel workbook (<code>.xlsx</code> / <code>.xls</code> / <code>.csv</code>).
            The system automatically scans for sheets named <span className="font-semibold text-slate-800 dark:text-slate-100">"FINAL DELIVERY PLAN"</span> and <span className="font-semibold text-slate-800 dark:text-slate-100">"IBT DATA"</span> with columns matching your VBA workflow.
          </p>

          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/30 dark:bg-slate-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />
            <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Click to select or drag and drop Excel file here
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Supports .xlsx, .xls, .csv</p>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-center justify-center gap-2 py-4 text-xs font-medium text-blue-600 dark:text-blue-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Parsing spreadsheet columns and sheets...
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Parsed Summary Preview */}
          {parseResult && (
            <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>File Parsed: {fileName}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-emerald-100 dark:border-emerald-800/40">
                  <div className="font-mono text-base font-bold text-slate-900 dark:text-white">
                    {parseResult.summary.validVehiclesFound}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Ready Vehicles</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-emerald-100 dark:border-emerald-800/40">
                  <div className="font-mono text-base font-bold text-slate-900 dark:text-white">
                    {parseResult.summary.deliveryRowsFound}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Delivery Rows</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-emerald-100 dark:border-emerald-800/40">
                  <div className="font-mono text-base font-bold text-slate-900 dark:text-white">
                    {parseResult.summary.ibtRowsFound}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">IBT Rows</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs pt-1 text-slate-700 dark:text-slate-300">
                <span className="font-medium">Import Mode:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="text-blue-600"
                  />
                  <span>Replace current dataset</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="text-blue-600"
                  />
                  <span>Append to current</span>
                </label>
              </div>
            </div>
          )}

          {/* Quick Actions (Template & Reset) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={downloadSampleTemplate}
              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              Download Excel Template (.xlsx)
            </button>

            <button
              onClick={() => {
                onResetSample();
                onClose();
              }}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline"
            >
              Reset to Original Sample Data
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-3 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            disabled={!parseResult}
            onClick={handleApply}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg text-white transition-colors ${
              parseResult
                ? 'bg-blue-600 hover:bg-blue-700 shadow-sm'
                : 'bg-slate-300 dark:bg-slate-700 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            Load Data into GatePass System
          </button>
        </div>
      </div>
    </div>
  );
};
