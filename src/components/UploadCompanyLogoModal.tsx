import React, { useState, useRef } from 'react';
import { CompanyBranding } from '../types/logistics';
import { BrandLogo } from './BrandLogo';
import { DEFAULT_BRANDING } from '../data/sampleData';
import {
  Upload,
  Image as ImageIcon,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Eye,
  FileCheck,
  Layers,
  ZoomIn
} from 'lucide-react';

interface UploadCompanyLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  branding: CompanyBranding;
  onSaveLogo: (updatedBranding: CompanyBranding) => void;
}

export const UploadCompanyLogoModal: React.FC<UploadCompanyLogoModalProps> = ({
  isOpen,
  onClose,
  branding,
  onSaveLogo
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(branding.customLogoUrl);
  const [logoHeight, setLogoHeight] = useState<number>(branding.logoHeightPx || 46);
  const [imageDetails, setImageDetails] = useState<{ name: string; size: string; dimensions?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, SVG, JPG, WebP).');
      return;
    }

    const sizeInKb = (file.size / 1024).toFixed(1) + ' KB';

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreviewUrl(dataUrl);

      // Extract image dimensions
      const img = new Image();
      img.onload = () => {
        setImageDetails({
          name: file.name,
          size: sizeInKb,
          dimensions: `${img.naturalWidth} × ${img.naturalHeight} px`
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleApply = () => {
    onSaveLogo({
      ...branding,
      customLogoUrl: previewUrl,
      logoType: previewUrl ? 'custom' : 'trilogi',
      logoHeightPx: logoHeight
    });
    onClose();
  };

  const handleRestoreDefault = () => {
    setPreviewUrl(null);
    setImageDetails(null);
    onSaveLogo({
      ...branding,
      customLogoUrl: null,
      logoType: 'trilogi',
      logoHeightPx: 44
    });
    onClose();
  };

  const currentPreviewBranding: CompanyBranding = {
    ...branding,
    customLogoUrl: previewUrl,
    logoType: previewUrl ? 'custom' : 'trilogi',
    logoHeightPx: logoHeight
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-lg">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Upload Clear Company Logo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload a high-resolution logo image to be applied across all copies of the Gate Pass and printed manifests.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 scale-[1.01]'
                : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/30 dark:bg-slate-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
              onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Click to browse or drag and drop your logo here
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Supports <span className="font-semibold text-slate-700 dark:text-slate-200">PNG</span> (transparent recommended), <span className="font-semibold text-slate-700 dark:text-slate-200">SVG</span>, <span className="font-semibold text-slate-700 dark:text-slate-200">JPG</span>, or <span className="font-semibold text-slate-700 dark:text-slate-200">WebP</span>
            </p>
            <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-2 font-medium">
              High-resolution vector or 300+ DPI images will render sharpest on printed outputs
            </p>
          </div>

          {/* Uploaded File Info Pill */}
          {imageDetails && (
            <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-medium truncate max-w-xs">{imageDetails.name}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">({imageDetails.size})</span>
              </div>
              {imageDetails.dimensions && (
                <span className="font-mono text-[11px] font-semibold bg-emerald-100/70 dark:bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-900 dark:text-emerald-200">
                  {imageDetails.dimensions}
                </span>
              )}
            </div>
          )}

          {/* Height / Scale Slider */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Printed Logo Display Height</span>
              </label>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                {logoHeight}px
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min={28}
                max={80}
                step={2}
                value={logoHeight}
                onChange={(e) => setLogoHeight(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              <button
                type="button"
                onClick={() => setLogoHeight(36)}
                className="hover:text-slate-700 dark:hover:text-slate-200 hover:underline"
              >
                Compact (36px)
              </button>
              <button
                type="button"
                onClick={() => setLogoHeight(46)}
                className="hover:text-slate-700 dark:hover:text-slate-200 hover:underline font-semibold text-slate-600 dark:text-slate-300"
              >
                Standard (46px)
              </button>
              <button
                type="button"
                onClick={() => setLogoHeight(60)}
                className="hover:text-slate-700 dark:hover:text-slate-200 hover:underline"
              >
                Large (60px)
              </button>
              <button
                type="button"
                onClick={() => setLogoHeight(74)}
                className="hover:text-slate-700 dark:hover:text-slate-200 hover:underline"
              >
                Prominent (74px)
              </button>
            </div>
          </div>

          {/* Live Previews */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                Live Printed Output Simulation
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Simulating document layout
              </span>
            </div>

            {/* Simulation of Gate Pass Header Card */}
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 rounded-xl p-3 shadow-xs">
              <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100 dark:border-slate-800 mb-2">
                Simulated Gate Pass Header (A4 Print Preview)
              </div>
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-5 flex items-center overflow-hidden">
                  <BrandLogo branding={currentPreviewBranding} size="md" />
                </div>
                <div className="col-span-4 text-center">
                  <div className="text-sm font-black text-slate-900 dark:text-white tracking-wider">GATE PASS</div>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-semibold">
                    {branding.gatePassPrefix}1042
                  </div>
                </div>
                <div className="col-span-3 text-right">
                  <span className="bg-slate-800 text-white text-[9px] font-bold uppercase px-2 py-1 tracking-wider">
                    SECURITY COPY
                  </span>
                </div>
              </div>
            </div>

            {/* Dark background contrast preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-white shadow-xs">
              <div className="flex items-center gap-2">
                <BrandLogo branding={currentPreviewBranding} size="sm" showSubtitle={false} />
                <span className="text-xs font-bold text-white ml-2">GatePass Pro</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Dark Mode / Navigation Contrast Preview</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleRestoreDefault}
            className="inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restore Default Trilogi Sunburst
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              Apply & Save Company Logo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
