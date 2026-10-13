import React from 'react';
import { VehicleGatePassData, CompanyBranding } from '../types/logistics';
import { BrandLogo } from './BrandLogo';

interface GatePassDocumentProps {
  data: VehicleGatePassData;
  branding: CompanyBranding;
  copyTitle?: 'SECURITY COPY' | 'OFFICE COPY' | 'DRIVER COPY' | string;
  showAllThreeCopies?: boolean;
}

export const SingleGatePassCopy: React.FC<{
  data: VehicleGatePassData;
  branding: CompanyBranding;
  copyTitle: string;
}> = ({ data, branding, copyTitle }) => {
  // VBA specifies at least 12 rows, but flexible when available vehicle entries go beyond 12
  const minRows = 12;
  const rowCount = Math.max(minRows, data.stores.length);
  const isExpanded = data.stores.length > 12;

  // Adaptive typography and padding to maintain single-page elegance for 13-16 rows, and smooth flow for >16
  const textSizeClass = rowCount <= 12 ? 'text-[11px]' : rowCount <= 16 ? 'text-[10.5px]' : 'text-[10px]';
  const containerPaddingClass = rowCount <= 12 ? 'p-4 print:p-3' : rowCount <= 16 ? 'p-3 print:p-2' : 'p-3 print:p-2';
  const rowPyClass = rowCount <= 12 ? 'py-1' : 'py-0.5';

  return (
    <div
      className={`w-full max-w-[800px] mx-auto bg-white border-2 border-slate-900 text-slate-900 font-sans shadow-sm print:shadow-none print:m-0 print:border-2 print:border-black leading-tight transition-all ${containerPaddingClass} ${textSizeClass}`}
    >
      {/* Top Header Block */}
      <div className="grid grid-cols-12 border-b-2 border-slate-900 pb-2 items-center">
        {/* Brand Zone */}
        <div className="col-span-4 flex items-center">
          <BrandLogo branding={branding} size={rowCount > 16 ? 'sm' : 'md'} />
        </div>

        {/* Title */}
        <div className="col-span-4 flex flex-col items-center justify-center text-center">
          <h1 className="text-xl font-black tracking-wider text-slate-900">GATE PASS</h1>
          <div className="flex items-center gap-1.5 flex-wrap justify-center mt-0.5">
            <span className="text-[10px] text-slate-500 font-mono font-semibold tracking-wider">
              {data.gatePassNumber}
            </span>
            {isExpanded && (
              <span
                className="text-[9px] bg-blue-50 text-blue-800 font-mono font-bold px-1.5 py-0.2 rounded border border-blue-200 print:border-slate-400 print:text-black print:bg-white"
                title={`Expanded from 12 standard rows to ${data.stores.length} available vehicle entries`}
              >
                Flexible Paper ({data.stores.length} Entries)
              </span>
            )}
          </div>
        </div>

        {/* Copy Badge */}
        <div className="col-span-4 flex items-center justify-end">
          <div className="bg-slate-700 text-white font-bold text-xs uppercase px-4 py-2 tracking-widest text-center shadow-xs">
            {copyTitle}
          </div>
        </div>
      </div>

      {/* Sub Header (Destination & Timestamp) */}
      <div className="grid grid-cols-12 border-b border-slate-900 py-1.5 text-xs">
        <div className="col-span-6 font-bold flex items-center">
          TO: {branding.facilityName}
        </div>
        <div className="col-span-3 text-center font-bold flex items-center justify-center border-l border-slate-400">
          DATE & TIME
        </div>
        <div className="col-span-3 text-right font-mono font-semibold flex items-center justify-end border-l border-slate-400 pr-1">
          {data.timestamp}
        </div>
      </div>

      {/* Store Items Table - Automatically flexes to accommodate all available entries */}
      <div className="mt-2 border border-slate-900">
        {/* Table Header */}
        <div className="grid grid-cols-12 bg-slate-600 text-white font-bold text-center py-1 text-[11px] border-b border-slate-900">
          <div className="col-span-2 border-r border-slate-500">
            SI.NO {isExpanded ? `(1-${rowCount})` : ''}
          </div>
          <div className="col-span-2 border-r border-slate-500">CTNS</div>
          <div className="col-span-2 border-r border-slate-500">QTY</div>
          <div className="col-span-6">Store / Area / Customer Name</div>
        </div>

        {/* Data Rows (Automatically flexes to rowCount: min 12, or exactly available vehicle entries) */}
        {Array.from({ length: rowCount }).map((_, idx) => {
          const store = data.stores[idx];
          const isEven = idx % 2 === 1;

          return (
            <div
              key={idx}
              className={`grid grid-cols-12 text-center border-b border-slate-300 ${rowPyClass} ${
                isEven ? 'bg-slate-50/50' : 'bg-white'
              } break-inside-avoid print:break-inside-avoid`}
            >
              <div className="col-span-2 border-r border-slate-300 font-mono font-semibold">
                {idx + 1}
              </div>
              <div className="col-span-2 border-r border-slate-300 font-mono font-semibold">
                {store ? store.cartons : ''}
              </div>
              <div className="col-span-2 border-r border-slate-300 font-mono font-semibold">
                {store ? store.quantity : ''}
              </div>
              <div className="col-span-6 text-center px-2 truncate font-medium">
                {store ? (
                  <span>
                    {store.storeName}
                    {store.isIBT && (
                      <span className="ml-1 text-[10px] font-bold text-amber-600 uppercase">
                        [IBT]
                      </span>
                    )}
                  </span>
                ) : (
                  ''
                )}
              </div>
            </div>
          );
        })}

        {/* Total Summary Row */}
        <div className="grid grid-cols-12 bg-slate-700 text-white font-bold text-center py-1.5 text-xs break-inside-avoid print:break-inside-avoid">
          <div className="col-span-2 border-r border-slate-600">Total</div>
          <div className="col-span-2 border-r border-slate-600 font-mono text-amber-300">
            {data.totalCartons}
          </div>
          <div className="col-span-2 border-r border-slate-600 font-mono text-amber-300">
            {data.totalQuantity}
          </div>
          <div className="col-span-6 text-center px-2 text-[10px] font-normal text-slate-300 flex items-center justify-center gap-1.5">
            <span>
              {data.stores.length} Destination{data.stores.length !== 1 ? 's' : ''} Listed
            </span>
            {isExpanded && (
              <span className="font-semibold text-amber-300">
                • {data.stores.length} Entries Flexibly Rendered
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Driver & Logistics Info Grid */}
      <div className="mt-2 grid grid-cols-12 gap-3 items-end break-inside-avoid print:break-inside-avoid">
        {/* Info Table */}
        <div className="col-span-7 border border-slate-400 text-[11px]">
          <div className="grid grid-cols-12 border-b border-slate-300">
            <div className="col-span-5 bg-slate-100 font-bold px-2 py-0.5 border-r border-slate-300">
              Vehicle :
            </div>
            <div className="col-span-7 px-2 py-0.5 font-mono font-bold text-slate-900 text-center">
              {data.vehiclePlate}
            </div>
          </div>
          <div className="grid grid-cols-12 border-b border-slate-300">
            <div className="col-span-5 bg-slate-100 font-bold px-2 py-0.5 border-r border-slate-300">
              Driver :
            </div>
            <div className="col-span-7 px-2 py-0.5 font-semibold text-slate-900 text-center">
              {data.driverName || 'N/A'}
            </div>
          </div>
          <div className="grid grid-cols-12 border-b border-slate-300">
            <div className="col-span-5 bg-slate-100 font-bold px-2 py-0.5 border-r border-slate-300">
              Delivery Man :
            </div>
            <div className="col-span-7 px-2 py-0.5 font-mono text-slate-900 text-center">
              {data.driverMobile || 'N/A'}
            </div>
          </div>
          <div className="grid grid-cols-12 border-b border-slate-300">
            <div className="col-span-5 bg-slate-100 font-bold px-2 py-0.5 border-r border-slate-300">
              E Code
            </div>
            <div className="col-span-7 px-2 py-0.5 font-mono text-slate-900 text-center">
              {data.driverEcode || 'N/A'}
            </div>
          </div>
          <div className="grid grid-cols-12">
            <div className="col-span-5 bg-slate-100 font-bold px-2 py-0.5 border-r border-slate-300">
              Transportation Unit
            </div>
            <div className="col-span-7 px-2 py-0.5 font-mono font-bold text-slate-900 text-center">
              {data.tuNumber || 'N/A'}
            </div>
          </div>
        </div>

        {/* Right Facility Origin */}
        <div className="col-span-5 text-right pb-1">
          <p className="font-bold text-xs text-slate-800 tracking-tight">
            {branding.locationFooter}
          </p>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
            Seq Ref: #{data.gatePassNumber}
          </p>
        </div>
      </div>

      {/* Signature Strip (Matching Yellow Footer from screenshot & VBA) */}
      <div className="mt-3 grid grid-cols-3 bg-[#FEFCE8] border border-slate-400 py-2 text-center text-xs font-bold divide-x divide-slate-400 break-inside-avoid print:break-inside-avoid">
        <div className="flex flex-col items-center justify-between h-11 px-1">
          <span className="text-[11px] text-slate-800">Load By</span>
          <span className="w-4/5 border-t border-dashed border-slate-500 pt-0.5 text-[9px] font-normal text-slate-500">
            Sign & Date
          </span>
        </div>
        <div className="flex flex-col items-center justify-between h-11 px-1">
          <span className="text-[11px] text-slate-800">Driver Signature</span>
          <span className="w-4/5 border-t border-dashed border-slate-500 pt-0.5 text-[9px] font-normal text-slate-500">
            Name / Sign
          </span>
        </div>
        <div className="flex flex-col items-center justify-between h-11 px-1">
          <span className="text-[11px] text-slate-800">Authorised By</span>
          <span className="w-4/5 border-t border-dashed border-slate-500 pt-0.5 text-[9px] font-normal text-slate-500">
            Security Clearance
          </span>
        </div>
      </div>
    </div>
  );
};

export const GatePassDocument: React.FC<GatePassDocumentProps> = ({
  data,
  branding,
  copyTitle = 'SECURITY COPY',
  showAllThreeCopies = false
}) => {
  const copies: ('SECURITY COPY' | 'OFFICE COPY' | 'DRIVER COPY')[] = [
    'SECURITY COPY',
    'OFFICE COPY',
    'DRIVER COPY'
  ];

  if (showAllThreeCopies) {
    return (
      <div className="flex flex-col gap-8 print:gap-0">
        {copies.map((copy, index) => (
          <div
            key={copy}
            className={`${
              index < copies.length - 1 ? 'print:break-after-page print:page-break' : ''
            }`}
          >
            <SingleGatePassCopy
              data={data}
              branding={branding}
              copyTitle={copy}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <SingleGatePassCopy
      data={data}
      branding={branding}
      copyTitle={copyTitle}
    />
  );
};
