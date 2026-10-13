import React, { useState } from 'react';
import { CompanyBranding } from '../types/logistics';
import { BrandLogo } from './BrandLogo';
import { Settings, X, Upload, RotateCcw, Check } from 'lucide-react';
import { DEFAULT_BRANDING } from '../data/sampleData';

interface BrandingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  branding: CompanyBranding;
  onSave: (branding: CompanyBranding) => void;
}

export const BrandingSettingsModal: React.FC<BrandingSettingsModalProps> = ({
  isOpen,
  onClose,
  branding,
  onSave
}) => {
  const [formData, setFormData] = useState<CompanyBranding>({ ...branding });
  const [logoPreview, setLogoPreview] = useState<string | null>(branding.customLogoUrl);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setLogoPreview(url);
        setFormData({ ...formData, customLogoUrl: url, logoType: 'custom' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetToTrilogi = () => {
    setFormData({
      ...formData,
      customLogoUrl: null,
      logoType: 'trilogi',
      companyName: DEFAULT_BRANDING.companyName,
      companySubtitle: DEFAULT_BRANDING.companySubtitle,
      facilityName: DEFAULT_BRANDING.facilityName,
      locationFooter: DEFAULT_BRANDING.locationFooter
    });
    setLogoPreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Company Branding & Sequential Tracking Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Live Preview Box */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl">
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Printed Header & Logo Preview
            </label>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <BrandLogo branding={formData} size="md" />
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                  {formData.gatePassPrefix}
                  {formData.nextSequenceNumber.toString().padStart(4, '0')}
                </span>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Next Generated Pass</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Company Subtitle / Tagline
              </label>
              <input
                type="text"
                value={formData.companySubtitle}
                onChange={(e) => setFormData({ ...formData, companySubtitle: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Destination Header & Facility Footer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Gate Security Destination (TO:)
              </label>
              <input
                type="text"
                value={formData.facilityName}
                onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })}
                placeholder="e.g. MEGA DC SECURITY"
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Location Origin Footer
              </label>
              <input
                type="text"
                value={formData.locationFooter}
                onChange={(e) => setFormData({ ...formData, locationFooter: e.target.value })}
                placeholder="e.g. (From TRILOGI - MEGA DC)"
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Sequential Tracking Numbers */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Gate Pass Number Prefix
              </label>
              <input
                type="text"
                value={formData.gatePassPrefix}
                onChange={(e) => setFormData({ ...formData, gatePassPrefix: e.target.value })}
                placeholder="e.g. GP-2026-"
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Next Sequence Counter
              </label>
              <input
                type="number"
                value={formData.nextSequenceNumber}
                onChange={(e) =>
                  setFormData({ ...formData, nextSequenceNumber: parseInt(e.target.value, 10) || 1 })
                }
                min={1}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Custom Logo Upload & Reset */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Custom Clear Logo Image (PNG, SVG, JPG)
              </label>
              {formData.customLogoUrl && (
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  Custom Logo Active
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 transition-colors">
                <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Upload Clear Logo</span>
                <input
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>

              {(logoPreview || formData.customLogoUrl) && (
                <button
                  type="button"
                  onClick={handleResetToTrilogi}
                  className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 hover:text-amber-800 font-medium"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restore Trilogi Sunburst
                </button>
              )}
            </div>

            {formData.customLogoUrl && (
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Print Height:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={28}
                    max={80}
                    step={2}
                    value={formData.logoHeightPx || 46}
                    onChange={(e) => setFormData({ ...formData, logoHeightPx: parseInt(e.target.value, 10) })}
                    className="w-32 accent-blue-600"
                  />
                  <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 w-10 text-right">
                    {formData.logoHeightPx || 46}px
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg text-white bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 shadow-sm transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Save Branding Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
