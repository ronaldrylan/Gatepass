import React from 'react';
import { StoreCheckingPaper, CompanyBranding } from '../types/logistics';
import { BrandLogo } from './BrandLogo';

interface CheckingPaperDocumentProps {
  manifests: StoreCheckingPaper[];
  branding: CompanyBranding;
}

export const SingleStoreCheckingPaper: React.FC<{
  manifest: StoreCheckingPaper;
  branding: CompanyBranding;
  currentIndex?: number;
  totalCount?: number;
}> = ({ manifest, branding, currentIndex, totalCount }) => {
  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const sigLabels = [
    'Checking',
    'Driver SIGN',
    'Loading Supr SIGN',
    'Loading BAY No',
    'Planner SIGN',
    'TU'
  ];

  return (
    <div className="w-full max-w-[1020px] mx-auto bg-white border border-slate-900 p-4 shadow-sm print:shadow-none print:p-2 print:border-black print:m-0 font-sans text-slate-900 text-xs leading-tight">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-2">
        <BrandLogo branding={branding} size="md" />
        <div className="text-center">
          <h2 className="text-base font-black tracking-wide uppercase text-slate-900">
            VEHICLE MANIFEST & CHECKING PAPER
          </h2>
          <p className="text-[11px] font-semibold text-slate-600">
            Destination: <span className="font-bold text-slate-900">{manifest.storeName}</span>{' '}
            {manifest.shipToCode && `(${manifest.shipToCode})`}
          </p>
        </div>
        <div className="text-right">
          <span className="font-bold text-xs bg-slate-100 border border-slate-300 px-2 py-1 rounded-sm">
            Plate: {manifest.vehiclePlate}
          </span>
          {currentIndex !== undefined && totalCount !== undefined && (
            <p className="text-[10px] text-slate-500 mt-1">
              Location {currentIndex} of {totalCount}
            </p>
          )}
        </div>
      </div>

      {/* Vehicle & Logistics Subheader */}
      <div className="grid grid-cols-4 gap-2 bg-slate-100 p-2 border border-slate-300 mb-2 text-[11px]">
        <div>
          <span className="font-bold text-slate-600">Vehicle Plate:</span>{' '}
          <span className="font-mono font-bold text-slate-900">{manifest.vehiclePlate}</span>
        </div>
        <div>
          <span className="font-bold text-slate-600">Driver:</span>{' '}
          <span className="font-semibold text-slate-900">{manifest.driverName || 'N/A'}</span>
        </div>
        <div>
          <span className="font-bold text-slate-600">Mobile:</span>{' '}
          <span className="font-mono text-slate-900">{manifest.driverMobile || 'N/A'}</span>
        </div>
        <div>
          <span className="font-bold text-slate-600">TU Number:</span>{' '}
          <span className="font-mono font-bold text-slate-900">{manifest.tuNumber || 'N/A'}</span>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto border border-slate-900">
        <table className="w-full border-collapse text-center text-[10px]">
          <thead>
            <tr className="bg-slate-300 text-slate-900 font-bold border-b border-slate-400">
              <th className="py-1 px-1 border-r border-slate-400">OBDO</th>
              <th className="py-1 px-1 border-r border-slate-400">OBD</th>
              <th className="py-1 px-1 border-r border-slate-400">Ship-To</th>
              <th className="py-1 px-2 border-r border-slate-400 text-center">
                Ship-To Party Description
              </th>
              <th className="py-1 px-1 border-r border-slate-400">QTY</th>
              <th className="py-1 px-1 border-r border-slate-400">DP</th>
              <th className="py-1 px-1 border-r border-slate-400">DNP</th>
              <th className="py-1 px-1 border-r border-slate-400">CTNS</th>
              <th className="py-1 px-1 border-r border-slate-400">P- Status</th>
              <th className="py-1 px-1 border-r border-slate-400">Business Unit</th>
              <th className="py-1 px-1 border-r border-slate-400">VEHICLE</th>
              <th className="py-1 px-1 border-r border-slate-400">DRIVER</th>
              <th className="py-1 px-1 border-r border-slate-400">Mobile No</th>
              <th className="py-1 px-1">TU</th>
            </tr>
          </thead>
          <tbody>
            {manifest.rows.map((row, idx) => (
              <tr
                key={idx}
                className={`border-b border-slate-300 ${
                  idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'
                }`}
              >
                <td className="py-1 px-1 border-r border-slate-300 font-mono">{row.obdo}</td>
                <td className="py-1 px-1 border-r border-slate-300 font-mono">{row.obd}</td>
                <td className="py-1 px-1 border-r border-slate-300 font-mono">{row.shipTo}</td>
                <td className="py-1 px-2 border-r border-slate-300 text-center truncate max-w-[200px] font-medium">
                  {row.shipToDesc}
                </td>
                <td className="py-1 px-1 border-r border-slate-300 font-mono font-semibold">
                  {row.qty}
                </td>
                <td className="py-1 px-1 border-r border-slate-300 font-mono">{row.dp}</td>
                <td className="py-1 px-1 border-r border-slate-300 font-mono font-semibold text-rose-600">
                  {row.dnp}
                </td>
                <td className="py-1 px-1 border-r border-slate-300 font-mono font-semibold">
                  {row.ctns}
                </td>
                <td className="py-1 px-1 border-r border-slate-300 text-[9px] uppercase font-semibold">
                  {row.pStatus}
                </td>
                <td className="py-1 px-1 border-r border-slate-300">{row.businessUnit}</td>
                <td className="py-1 px-1 border-r border-slate-300 font-mono">{row.vehicle}</td>
                <td className="py-1 px-1 border-r border-slate-300 truncate max-w-[90px]">
                  {row.driver}
                </td>
                <td className="py-1 px-1 border-r border-slate-300 font-mono text-[9px]">
                  {row.mobile}
                </td>
                <td className="py-1 px-1 font-mono">{row.tu}</td>
              </tr>
            ))}

            {/* Total Row (VBA sets yellow background RGB(255, 255, 0)) */}
            <tr className="bg-yellow-200 font-bold border-b border-slate-400 text-slate-900 text-center">
              <td colSpan={4} className="py-1.5 px-2 text-center border-r border-slate-400 uppercase">
                Location Subtotal:
              </td>
              <td className="py-1.5 px-1 border-r border-slate-400 font-mono text-xs">
                {manifest.totalQty}
              </td>
              <td className="py-1.5 px-1 border-r border-slate-400 font-mono text-xs">
                {manifest.totalDP}
              </td>
              <td className="py-1.5 px-1 border-r border-slate-400 font-mono text-xs text-rose-700">
                {manifest.totalDNP}
              </td>
              <td className="py-1.5 px-1 border-r border-slate-400 font-mono text-xs">
                {manifest.totalCTNS}
              </td>
              <td colSpan={6} className="py-1.5 px-2 text-center text-[9px] text-slate-700 italic">
                Items inspected for {manifest.storeName}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Official Signatures & Verification Block (VBA Table layout) */}
      <div className="mt-3 grid grid-cols-12 gap-4">
        <div className="col-span-8">
          <div className="border border-slate-400 text-[10px]">
            {/* Signature Header Row */}
            <div className="grid grid-cols-4 bg-yellow-200 border-b border-slate-400 font-bold text-center py-1">
              <div className="border-r border-slate-400">Date: {todayFormatted}</div>
              <div className="border-r border-slate-400">Name</div>
              <div className="border-r border-slate-400">Sign</div>
              <div>CTNS / Remarks</div>
            </div>

            {/* Signature Rows */}
            {sigLabels.map((label, sIdx) => (
              <div
                key={label}
                className={`grid grid-cols-4 text-center border-b border-slate-300 py-1 items-center ${
                  sIdx % 2 === 1 ? 'bg-slate-50' : 'bg-white'
                }`}
              >
                <div className="font-bold bg-yellow-100/70 border-r border-slate-300 py-0.5 text-slate-800 text-[9px]">
                  {label}
                </div>
                <div className="border-r border-slate-300 h-5"></div>
                <div className="border-r border-slate-300 h-5"></div>
                <div className="h-5"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Verification Summary Note */}
        <div className="col-span-4 flex flex-col justify-between border border-slate-300 bg-slate-50 p-2 text-[10px]">
          <div>
            <h4 className="font-bold text-slate-800 uppercase mb-1">Checking Protocol</h4>
            <p className="text-slate-600 leading-tight">
              All physical cartons must be tallied against packed quantity (DP). Discrepancy
              cartons (DNP: <span className="font-bold text-rose-600">{manifest.totalDNP}</span>)
              must be escalated to the Loading Supervisor prior to vehicle departure.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-200 text-[9px] text-slate-500 flex justify-between items-center">
            <span>{branding.facilityName}</span>
            <span className="font-mono">Checked OK [ ]</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CheckingPaperDocument: React.FC<CheckingPaperDocumentProps> = ({
  manifests,
  branding
}) => {
  if (manifests.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No checking paper records to display.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 print:gap-0">
      {manifests.map((manifest, index) => (
        <div
          key={`${manifest.vehiclePlate}-${manifest.storeName}-${index}`}
          className={`${
            index < manifests.length - 1 ? 'print:break-after-page print:page-break' : ''
          }`}
        >
          <SingleStoreCheckingPaper
            manifest={manifest}
            branding={branding}
            currentIndex={index + 1}
            totalCount={manifests.length}
          />
        </div>
      ))}
    </div>
  );
};
