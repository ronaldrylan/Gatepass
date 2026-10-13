import React, { useState } from 'react';
import { DeliveryPlanRow, IBTDataRow, CompanyBranding, GatePassDatabaseRecord } from '../types/logistics';
import { buildScheduleSummaryData } from '../utils/dataProcessor';
import { exportDeliveryScheduleToExcel } from '../utils/excelParser';
import { exportDeliverySchedulePDF } from '../utils/pdfExport';
import { BrandLogo } from './BrandLogo';
import { DailyDeliveryPerformanceChart } from './DailyDeliveryPerformanceChart';
import { Download, Printer, FileText } from 'lucide-react';

interface DeliveryScheduleReportProps {
  deliveryPlan: DeliveryPlanRow[];
  ibtData: IBTDataRow[];
  branding: CompanyBranding;
  databaseRecords?: GatePassDatabaseRecord[];
  onPrintPreview: () => void;
}

export const DeliveryScheduleReport: React.FC<DeliveryScheduleReportProps> = ({
  deliveryPlan,
  ibtData,
  branding,
  databaseRecords,
  onPrintPreview
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const scheduleData = React.useMemo(() => {
    return buildScheduleSummaryData(deliveryPlan, ibtData);
  }, [deliveryPlan, ibtData]);

  const handleExportExcel = () => {
    exportDeliveryScheduleToExcel(scheduleData.rows, todayFormatted);
  };

  const handleExportPdf = () => {
    setIsExportingPdf(true);
    try {
      exportDeliverySchedulePDF(scheduleData, branding, todayFormatted);
    } catch (err) {
      console.error('Failed to export delivery schedule PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Header in App View (hidden when printing) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Daily Delivery Schedule Summary
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Aggregated delivery schedule for {todayFormatted} across {scheduleData.vehicleGroups.length} vehicles & {scheduleData.rows.length} destinations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-300 dark:border-emerald-800 transition-colors shadow-2xs disabled:opacity-50"
            title="Download formatted delivery schedule as PDF"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isExportingPdf ? 'Exporting PDF...' : 'Save as PDF'}</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export to Excel
          </button>
          <button
            onClick={onPrintPreview}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 rounded-lg transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Schedule
          </button>
        </div>
      </div>

      {/* Daily Delivery Performance Chart (Recharts Last 7 Days from Audit Database) */}
      <DailyDeliveryPerformanceChart records={databaseRecords || []} />

      {/* Printable Sheet View */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-4 rounded-xl shadow-xs print:shadow-none print:border-none print:p-0 transition-colors">
        <div className="mb-3 flex items-center justify-between border-b dark:border-slate-700 pb-2">
          <BrandLogo branding={branding} size="sm" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Generated: {todayFormatted}
          </span>
        </div>

        {/* VBA Title Banner */}
        <div className="bg-[#C6E0B4] text-[#C00000] border-2 border-[#8EA9DB] text-center py-2 font-bold text-base tracking-wide uppercase">
          MORNING DELIVERY SCHEDULE {todayFormatted}
        </div>

        {/* Schedule Table */}
        <div className="overflow-x-auto border-x border-b border-slate-300">
          <table className="w-full text-xs text-center border-collapse">
            <thead>
              <tr className="bg-[#C6E0B4] text-[#C00000] font-bold border-b border-slate-400">
                <th className="py-2 px-2 border-r border-slate-400 w-12">Seq</th>
                <th className="py-2 px-2 border-r border-slate-400 w-24">Ship-To</th>
                <th className="py-2 px-3 border-r border-slate-400 text-center">
                  Ship-To Party Description
                </th>
                <th className="py-2 px-2 border-r border-slate-400 w-24">Business U</th>
                <th className="py-2 px-2 border-r border-slate-400 w-20">P. QTY</th>
                <th className="py-2 px-2 border-r border-slate-400 w-16">CTN</th>
                <th className="py-2 px-2 border-r border-slate-400 w-24">VEHICLE</th>
                <th className="py-2 px-2 w-36">DRIVER</th>
              </tr>
            </thead>
            <tbody>
              {scheduleData.vehicleGroups.map((group) => (
                <React.Fragment key={group.cleanVehicle}>
                  {group.stores.map((store) => (
                    <tr
                      key={`${store.cleanVehicle}-${store.seq}`}
                      className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-1.5 px-2 border-r border-slate-200 font-mono text-slate-600">
                        {store.seq}
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-200 font-mono">
                        {store.shipTo}
                      </td>
                      <td className="py-1.5 px-3 border-r border-slate-200 text-center font-medium text-slate-900">
                        {store.shipToPartyDesc}
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-200 text-slate-600">
                        {store.businessUnit}
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-200 font-mono font-semibold">
                        {store.pQty}
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-200 font-mono font-semibold">
                        {store.ctn}
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-200 font-mono font-bold text-slate-800">
                        {store.vehicle}
                      </td>
                      <td className="py-1.5 px-2 font-medium text-slate-700">
                        {store.driver}
                      </td>
                    </tr>
                  ))}

                  {/* Vehicle Subtotal Row matching VBA */}
                  <tr className="bg-[#C6E0B4] border-b-2 border-slate-400 font-bold text-slate-900">
                    <td colSpan={4} className="py-1.5 px-3 text-center border-r border-slate-400 text-xs">
                      Subtotal Vehicle: {group.vehiclePlate} ({group.driverName})
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-400 font-mono text-sm text-[#C00000]">
                      {group.subTotalQty}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-400 font-mono text-sm text-[#C00000]">
                      {group.subTotalCtn}
                    </td>
                    <td colSpan={2} className="py-1.5 px-2 text-center text-[11px] text-slate-700 font-normal">
                      {group.stores.length} store drops
                    </td>
                  </tr>
                </React.Fragment>
              ))}

              {/* Grand Total Row matching VBA */}
              <tr className="bg-slate-800 text-white font-black text-sm border-t-2 border-slate-900">
                <td colSpan={4} className="py-2.5 px-4 text-center tracking-wider uppercase border-r border-slate-700">
                  Grand Total
                </td>
                <td className="py-2.5 px-2 border-r border-slate-700 font-mono text-amber-300">
                  {scheduleData.grandTotalQty}
                </td>
                <td className="py-2.5 px-2 border-r border-slate-700 font-mono text-amber-300">
                  {scheduleData.grandTotalCtn}
                </td>
                <td colSpan={2} className="py-2.5 px-3 text-center text-xs font-normal text-slate-300">
                  {scheduleData.rows.length} Total Deliveries Scheduled
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
