import React, { useState } from 'react';
import { GatePassDatabaseRecord } from '../types/logistics';
import { exportDatabaseToExcel, exportDatabaseToCSV } from '../utils/excelParser';
import { Download, Search, Trash2, ShieldAlert, FileText } from 'lucide-react';

interface DatabaseAuditViewProps {
  records: GatePassDatabaseRecord[];
  onClearRecords: () => void;
  onSelectVehicle: (plate: string) => void;
}

export const DatabaseAuditView: React.FC<DatabaseAuditViewProps> = ({
  records,
  onClearRecords,
  onSelectVehicle
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const filteredRecords = records.filter(r => {
    const term = searchTerm.toLowerCase();
    return (
      r.vehiclePlate.toLowerCase().includes(term) ||
      r.driverName.toLowerCase().includes(term) ||
      r.tuNumber.toLowerCase().includes(term) ||
      r.storeName.toLowerCase().includes(term) ||
      r.gatePassNumber.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Gate Pass Database & Tracking Registry
            </h2>
            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              {records.length} records logged
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automatic tracking and audit logs matching the VBA database logging system. Prevents duplicate gate pass generation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {records.length > 0 && (
            <>
              <button
                onClick={() => exportDatabaseToCSV(records)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors shadow-2xs"
                title="Export all saved gate pass records as a CSV file"
              >
                <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Download CSV
              </button>

              <button
                onClick={() => exportDatabaseToExcel(records)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors shadow-2xs"
                title="Export all saved gate pass records as an Excel spreadsheet (.xlsx)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Export Database (.xlsx)
              </button>

              {confirmClear ? (
                <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 p-1 rounded-lg">
                  <span className="text-[11px] font-medium text-rose-700 dark:text-rose-300 px-1">Confirm delete?</span>
                  <button
                    onClick={() => {
                      onClearRecords();
                      setConfirmClear(false);
                    }}
                    className="px-2 py-0.5 text-xs font-semibold text-white bg-rose-600 rounded hover:bg-rose-700"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="px-2 py-0.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-800 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear History
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by Gate Pass #, Vehicle Plate, Driver, TU Number, or Store..."
          className="w-full text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent outline-none"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table of Records */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldAlert className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No database records found</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {searchTerm
                ? 'Try adjusting your search criteria.'
                : 'Gate passes will be automatically logged here whenever generated or printed.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                  <th className="py-2.5 px-3">Pass Ref</th>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Vehicle Plate</th>
                  <th className="py-2.5 px-3">Driver</th>
                  <th className="py-2.5 px-3">TU Number</th>
                  <th className="py-2.5 px-3">Destination / Store</th>
                  <th className="py-2.5 px-3 text-right">CTNS</th>
                  <th className="py-2.5 px-3 text-right">QTY</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {r.gatePassNumber}
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      {r.dateTime}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">
                      {r.vehiclePlate}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                      {r.driverName}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">
                      {r.tuNumber}
                    </td>
                    <td className="py-2 px-3 text-slate-800 dark:text-slate-300 max-w-[200px] truncate">
                      {r.storeName}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                      {r.cartons}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                      {r.quantity}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => onSelectVehicle(r.vehiclePlate)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium hover:underline"
                      >
                        View Vehicle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
