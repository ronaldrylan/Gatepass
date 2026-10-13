import React, { useState, useMemo } from 'react';
import { GatePassDatabaseRecord, CompanyBranding } from '../types/logistics';
import { DEFAULT_BRANDING } from '../data/sampleData';
import { exportFleetOverviewPDF } from '../utils/pdfExport';
import {
  CheckCircle2,
  TrendingUp,
  Store,
  PackageCheck,
  ArrowRight,
  Clock,
  Truck,
  BarChart2,
  Download,
  Boxes,
  MapPin,
  Sparkles
} from 'lucide-react';

interface PerformanceOverviewWidgetProps {
  records: GatePassDatabaseRecord[];
  branding?: CompanyBranding;
  onViewDatabase: () => void;
  onSelectVehicle?: (plate: string) => void;
}

export const PerformanceOverviewWidget: React.FC<PerformanceOverviewWidgetProps> = ({
  records,
  branding = DEFAULT_BRANDING,
  onViewDatabase,
  onSelectVehicle
}) => {
  const [timeframe, setTimeframe] = useState<'today' | 'all'>('today');
  const [isExporting, setIsExporting] = useState(false);

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const todayDateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

  // Filter records based on timeframe
  const filteredRecords = useMemo(() => {
    if (timeframe === 'all') return records;
    return records.filter(r => r.dateTime && r.dateTime.includes(todayDateStr));
  }, [records, timeframe, todayDateStr]);

  const metrics = useMemo(() => {
    // Unique gate passes
    const uniquePassNumbers = new Set(filteredRecords.map(r => r.gatePassNumber));
    const totalProcessedPasses = uniquePassNumbers.size;

    // Unique vehicles
    const uniqueVehicles = new Set(filteredRecords.map(r => r.vehiclePlate.trim().toUpperCase()));
    const vehicleCount = uniqueVehicles.size;

    // Total Cartons across unique passes
    const totalCartons = filteredRecords.reduce((sum, r) => sum + (Number(r.cartons) || 0), 0);
    const totalQuantity = filteredRecords.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);

    // Total store visits (each record is a store visit/delivery drop)
    const totalStoreVisits = filteredRecords.length;

    // Average cartons per vehicle
    const avgCartonsPerVehicle = vehicleCount > 0 ? (totalCartons / vehicleCount) : 0;

    // Most recent gate pass logged
    const latestRecord = filteredRecords[0] || null;

    return {
      totalProcessedPasses,
      vehicleCount,
      totalCartons,
      totalQuantity,
      totalStoreVisits,
      avgCartonsPerVehicle,
      latestRecord
    };
  }, [filteredRecords]);

  // Calculate Top-5 vehicles by carton volume processed
  const topVehicles = useMemo(() => {
    const map = new Map<string, {
      vehiclePlate: string;
      driverName: string;
      tuNumber: string;
      totalCartons: number;
      totalQuantity: number;
      storeVisits: Set<string>;
      gatePasses: Set<string>;
    }>();

    filteredRecords.forEach(r => {
      const plate = (r.vehiclePlate || '').trim();
      if (!plate) return;
      const cleanPlate = plate.toUpperCase();

      if (!map.has(cleanPlate)) {
        map.set(cleanPlate, {
          vehiclePlate: plate,
          driverName: r.driverName || 'N/A',
          tuNumber: r.tuNumber || 'N/A',
          totalCartons: 0,
          totalQuantity: 0,
          storeVisits: new Set(),
          gatePasses: new Set()
        });
      }

      const item = map.get(cleanPlate)!;
      item.totalCartons += Number(r.cartons) || 0;
      item.totalQuantity += Number(r.quantity) || 0;
      if (r.storeName) item.storeVisits.add(r.storeName.trim());
      if (r.gatePassNumber) item.gatePasses.add(r.gatePassNumber.trim());
      if (r.driverName && item.driverName === 'N/A') item.driverName = r.driverName;
      if (r.tuNumber && item.tuNumber === 'N/A') item.tuNumber = r.tuNumber;
    });

    const list = Array.from(map.values()).map(v => ({
      ...v,
      storeCount: v.storeVisits.size,
      passCount: v.gatePasses.size
    }));

    return list.sort((a, b) => b.totalCartons - a.totalCartons).slice(0, 5);
  }, [filteredRecords]);

  const maxVehicleCartons = topVehicles.length > 0 ? Math.max(...topVehicles.map(v => v.totalCartons)) : 1;

  const hasAnyRecords = records.length > 0;
  const hasFilteredRecords = filteredRecords.length > 0;

  const handleDownloadPDF = () => {
    setIsExporting(true);
    try {
      const timeframeText = timeframe === 'today' ? `Today (${todayDateStr})` : 'Cumulative Audit History';
      exportFleetOverviewPDF(branding, timeframeText, metrics, topVehicles);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs transition-colors space-y-5">
      {/* Header with Title, Period Switcher, PDF Download & Link to Database */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-linear-to-br from-indigo-500 via-blue-600 to-cyan-500 text-white rounded-xl shadow-xs flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Performance Overview
              </h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                Live Dispatch
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {timeframe === 'today' ? `Date: ${todayDateStr}` : 'Cumulative Audit History'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time throughput metrics calculated from verified records in the Gate Pass Audit Database.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented Timeframe Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs shadow-2xs">
            <button
              onClick={() => setTimeframe('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeframe === 'today'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Today ({todayDateStr})
            </button>
            <button
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeframe === 'all'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Records ({records.length})
            </button>
          </div>

          {/* Download Fleet Overview PDF Button with vibrant styling */}
          <button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-98 rounded-xl shadow-xs transition-all disabled:opacity-50"
            title="Download executive summary statistics and top-5 vehicles as a PDF management report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Generating PDF...' : 'Export Overview PDF'}</span>
          </button>

          <button
            onClick={onViewDatabase}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline px-2 py-1 rounded-lg"
          >
            <span>Audit Registry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3 Core Metric Cards with Distinct Harmonic Color Themes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Total Processed Gate Passes (Emerald & Mint Theme) */}
        <div className="relative overflow-hidden rounded-xl border border-emerald-200/80 dark:border-emerald-800/40 bg-linear-to-br from-emerald-50/90 via-teal-50/40 to-white dark:from-emerald-950/30 dark:via-slate-900/80 dark:to-slate-900 p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
              Dispatched Passes
            </span>
            <div className="p-2 bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-200/60 dark:border-emerald-700/50">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
                {metrics.totalProcessedPasses}
              </span>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                passes logged
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>
                <strong className="font-semibold text-slate-900 dark:text-white">{metrics.vehicleCount}</strong> unique vehicle{metrics.vehicleCount === 1 ? '' : 's'} dispatched
              </span>
            </div>
          </div>
          <div className="pt-2.5 border-t border-emerald-200/50 dark:border-emerald-900/30 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
            <span>Verified in database</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              {metrics.totalQuantity.toLocaleString()} total units
            </span>
          </div>
        </div>

        {/* Metric 2: Average Cartons per Vehicle (Indigo & Royal Blue Theme) */}
        <div className="relative overflow-hidden rounded-xl border border-blue-200/80 dark:border-blue-800/40 bg-linear-to-br from-blue-50/90 via-indigo-50/40 to-white dark:from-blue-950/30 dark:via-slate-900/80 dark:to-slate-900 p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider">
              Avg Cartons / Vehicle
            </span>
            <div className="p-2 bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200/60 dark:border-blue-700/50">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
                {metrics.vehicleCount > 0
                  ? metrics.avgCartonsPerVehicle.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                  : '0.0'}
              </span>
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                CTNS / veh
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>
                Total payload:{' '}
                <strong className="font-mono font-semibold text-slate-900 dark:text-white">
                  {metrics.totalCartons.toLocaleString()} CTNS
                </strong>
              </span>
            </div>
          </div>
          <div className="pt-2.5 border-t border-blue-200/50 dark:border-blue-900/30 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
            <span>Payload distribution</span>
            <span className="font-semibold text-blue-700 dark:text-blue-400">
              {metrics.vehicleCount > 0 ? `${Math.round(metrics.totalCartons / Math.max(metrics.totalStoreVisits, 1))} CTNS/store` : '-'}
            </span>
          </div>
        </div>

        {/* Metric 3: Total Daily Store Visits (Violet & Purple Theme) */}
        <div className="relative overflow-hidden rounded-xl border border-violet-200/80 dark:border-violet-800/40 bg-linear-to-br from-violet-50/90 via-purple-50/40 to-white dark:from-violet-950/30 dark:via-slate-900/80 dark:to-slate-900 p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-violet-800 dark:text-violet-400 uppercase tracking-wider">
              Total Destinations
            </span>
            <div className="p-2 bg-violet-500/15 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 rounded-lg border border-violet-200/60 dark:border-violet-700/50">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
                {metrics.totalStoreVisits}
              </span>
              <span className="text-xs font-semibold text-violet-700 dark:text-violet-400">
                store drops
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-500" />
              <span>
                {metrics.totalProcessedPasses > 0
                  ? `${(metrics.totalStoreVisits / metrics.totalProcessedPasses).toFixed(1)} avg stops / route`
                  : 'Awaiting dispatch confirmation'}
              </span>
            </div>
          </div>
          <div className="pt-2.5 border-t border-violet-200/50 dark:border-violet-900/30 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
            <span>Drop fulfillment</span>
            <span className="font-semibold text-violet-700 dark:text-violet-400">
              100% logged
            </span>
          </div>
        </div>
      </div>

      {/* Vehicle Utilization Section (Top-5 high-capacity routes) with rich badges and colored bars */}
      <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-linear-to-br from-amber-500 to-orange-500 text-white rounded-lg shadow-2xs">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Vehicle Fleet Utilization</span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-sans">
                  · Top 5 High-Capacity Routes
                </span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Ranked by carton volume processed to identify high-density dispatch operations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <BarChart2 className="w-4 h-4 text-blue-500" />
            <span>Volume Share</span>
          </div>
        </div>

        {/* Top-5 Vehicles Grid / Table */}
        {topVehicles.length > 0 ? (
          <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/70">
            {topVehicles.map((v, index) => {
              const percentOfMax = maxVehicleCartons > 0 ? Math.round((v.totalCartons / maxVehicleCartons) * 100) : 0;
              const percentOfTotal = metrics.totalCartons > 0 ? Math.round((v.totalCartons / metrics.totalCartons) * 100) : 0;

              // Distinct color styles for rankings
              const rankBadge = [
                'bg-linear-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black shadow-xs ring-1 ring-amber-300',
                'bg-linear-to-r from-slate-700 to-slate-900 dark:from-slate-400 dark:to-slate-200 text-white dark:text-slate-950 font-bold',
                'bg-linear-to-r from-amber-700 to-orange-700 text-white font-bold',
                'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-bold',
                'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold'
              ][index] || 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold';

              const barGradient = [
                'bg-linear-to-r from-amber-500 via-orange-500 to-emerald-500',
                'bg-linear-to-r from-blue-500 to-indigo-600',
                'bg-linear-to-r from-indigo-500 to-purple-600',
                'bg-linear-to-r from-teal-500 to-cyan-600',
                'bg-linear-to-r from-slate-400 to-slate-600'
              ][index] || 'bg-blue-600';

              return (
                <div
                  key={v.vehiclePlate}
                  onClick={() => onSelectVehicle && onSelectVehicle(v.vehiclePlate)}
                  className={`p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    onSelectVehicle ? 'cursor-pointer hover:bg-white dark:hover:bg-slate-800/80' : ''
                  }`}
                  title={onSelectVehicle ? `Click to filter vehicle ${v.vehiclePlate}` : undefined}
                >
                  {/* Left: Rank & Vehicle Information */}
                  <div className="flex items-center gap-3.5 min-w-[220px]">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${rankBadge}`}>
                      {index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-2xs">
                          {v.vehiclePlate}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          TU: {v.tuNumber}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[200px] mt-0.5">
                        <span className="font-medium">{v.driverName}</span> · {v.storeCount} store{v.storeCount === 1 ? '' : 's'}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Relative Capacity Visual Bar */}
                  <div className="flex-1 max-w-sm mx-0 sm:mx-4">
                    <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      <span>
                        Payload share:{' '}
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{percentOfTotal}%</span>
                      </span>
                      <span className="font-mono font-medium text-slate-600 dark:text-slate-300">
                        {v.totalQuantity.toLocaleString()} units
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`${barGradient} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${percentOfMax}%` }}
                      />
                    </div>
                  </div>

                  {/* Right: Cartons & Units Metric */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 text-right">
                    <div>
                      <div className="font-mono font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                        {v.totalCartons.toLocaleString()}{' '}
                        <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase">
                          CTNS
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {v.passCount} pass{v.passCount === 1 ? '' : 'es'}
                      </div>
                    </div>

                    {onSelectVehicle && (
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hidden sm:inline-flex items-center gap-0.5 ml-2">
                        <span>Select</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
            No vehicle utilization records available for {timeframe === 'today' ? `today (${todayDateStr})` : 'the selected period'}. Generate or print gate passes to establish utilization analytics.
          </div>
        )}
      </div>

      {/* Helpful context if no records are logged yet for the selected timeframe */}
      {!hasFilteredRecords && (
        <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              {hasAnyRecords
                ? `No passes logged specifically on ${todayDateStr}. Switch to "All Records" to view historical metrics or generate a pass below.`
                : 'No gate passes logged in Audit Database yet. Generating or printing a gate pass automatically updates these metrics in real-time.'}
            </span>
          </div>
          {hasAnyRecords && timeframe === 'today' && (
            <button
              onClick={() => setTimeframe('all')}
              className="text-xs font-bold text-blue-700 dark:text-blue-400 hover:underline whitespace-nowrap ml-2"
            >
              Switch to All Records
            </button>
          )}
        </div>
      )}

      {/* Quick recent activity pill if records exist */}
      {hasFilteredRecords && metrics.latestRecord && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Latest entry:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {metrics.latestRecord.gatePassNumber}
            </span>
            <span>
              · Vehicle{' '}
              <strong className="font-mono text-slate-900 dark:text-white">
                {metrics.latestRecord.vehiclePlate}
              </strong>{' '}
              ({metrics.latestRecord.driverName})
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
            {metrics.latestRecord.dateTime}
          </span>
        </div>
      )}
    </div>
  );
};
