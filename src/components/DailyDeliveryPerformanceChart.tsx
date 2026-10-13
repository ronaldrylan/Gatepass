import React, { useState, useMemo } from 'react';
import { GatePassDatabaseRecord } from '../types/logistics';
import { compute7DayDeliveryPerformance, DailyPerformancePoint } from '../utils/performanceAnalytics';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  AreaChart,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  TrendingUp,
  Package,
  Layers,
  Calendar,
  Award,
  ChevronDown,
  ChevronUp,
  BarChart3,
  FileCheck2,
  Truck,
  Sparkles,
  Info
} from 'lucide-react';

interface DailyDeliveryPerformanceChartProps {
  records: GatePassDatabaseRecord[];
}

type ChartViewType = 'combined' | 'cartons' | 'quantity';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  dataPoint?: DailyPerformancePoint;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as DailyPerformancePoint;

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl p-3.5 text-xs min-w-[210px] pointer-events-none transition-colors">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {data.dayOfWeek}, {data.displayDate}
            </span>
            <span className="block text-[10px] text-slate-400 font-mono">
              {data.fullDate}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {data.gatePassesCount} Pass{data.gatePassesCount === 1 ? '' : 'es'}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <Package className="w-3.5 h-3.5" />
              <span className="font-medium text-slate-700 dark:text-slate-300">Total Cartons:</span>
            </div>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
              {data.totalCartons.toLocaleString()} CTNS
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400">
              <Layers className="w-3.5 h-3.5" />
              <span className="font-medium text-slate-700 dark:text-slate-300">Piece Quantity:</span>
            </div>
            <span className="font-mono font-bold text-violet-700 dark:text-violet-300">
              {data.totalQuantity.toLocaleString()} QTY
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Fleet Dispatches:</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {data.vehiclesCount} Vehicle{data.vehiclesCount === 1 ? '' : 's'} ({data.deliveriesCount} drops)
            </span>
          </div>

          {data.vehiclePlates.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {data.vehiclePlates.slice(0, 4).map((p, idx) => (
                <span
                  key={idx}
                  className="font-mono text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded"
                >
                  #{p}
                </span>
              ))}
              {data.vehiclePlates.length > 4 && (
                <span className="text-[9px] text-slate-400">+{data.vehiclePlates.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const DailyDeliveryPerformanceChart: React.FC<DailyDeliveryPerformanceChartProps> = ({
  records
}) => {
  const [viewType, setViewType] = useState<ChartViewType>('combined');
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [isChartCollapsed, setIsChartCollapsed] = useState(false);

  // Compute 7-day performance data
  const summary = useMemo(() => {
    return compute7DayDeliveryPerformance(records);
  }, [records]);

  const {
    dailyData,
    total7DaysCartons,
    total7DaysQuantity,
    avgDailyCartons,
    avgDailyQuantity,
    peakCartonsDay,
    peakQuantityDay,
    totalGatePasses,
    growthRateCartons
  } = summary;

  return (
    <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden transition-colors">
      {/* Top Banner Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-slate-50/80 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900/90 dark:to-blue-950/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Daily Delivery Performance
              </h3>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                Last 7 Days (Audit Database)
              </span>
              {growthRateCartons !== 0 && (
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    growthRateCartons > 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  {growthRateCartons > 0 ? `+${growthRateCartons}% trend` : `${growthRateCartons}% trend`}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tracking dispatched total cartons and piece quantity trends aggregated from verified gate pass audit records.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Chart View Segmented Selector */}
          <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center text-xs">
            <button
              onClick={() => setViewType('combined')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                viewType === 'combined'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Combined
            </button>
            <button
              onClick={() => setViewType('cartons')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                viewType === 'cartons'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cartons
            </button>
            <button
              onClick={() => setViewType('quantity')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                viewType === 'quantity'
                  ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Quantity
            </button>
          </div>

          {/* Collapse/Expand Toggle */}
          <button
            onClick={() => setIsChartCollapsed(!isChartCollapsed)}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
            title={isChartCollapsed ? 'Expand Performance Chart' : 'Collapse Performance Chart'}
          >
            {isChartCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isChartCollapsed && (
        <>
          {/* Key Metric KPI Highlights Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
            {/* Total Cartons */}
            <div className="bg-white dark:bg-slate-900/90 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">7-Day Cartons</span>
                <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                {total7DaysCartons.toLocaleString()}
                <span className="text-xs font-semibold text-emerald-600/80 dark:text-emerald-400/80 ml-1">CTNS</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                <span>Avg Daily:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {avgDailyCartons.toLocaleString()} / day
                </span>
              </div>
            </div>

            {/* Total Quantity */}
            <div className="bg-white dark:bg-slate-900/90 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">7-Day Quantity</span>
                <Layers className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-violet-700 dark:text-violet-300">
                {total7DaysQuantity.toLocaleString()}
                <span className="text-xs font-semibold text-violet-600/80 dark:text-violet-400/80 ml-1">QTY</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                <span>Avg Daily:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {avgDailyQuantity.toLocaleString()} / day
                </span>
              </div>
            </div>

            {/* Peak Dispatch Day */}
            <div className="bg-white dark:bg-slate-900/90 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Peak Cartons Day</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate" title={peakCartonsDay.displayDate}>
                {peakCartonsDay.displayDate}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                <span>Peak Load:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {peakCartonsDay.cartons.toLocaleString()} CTNS
                </span>
              </div>
            </div>

            {/* Total Gate Passes Audited */}
            <div className="bg-white dark:bg-slate-900/90 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Audit Pass Registry</span>
                <FileCheck2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-blue-700 dark:text-blue-300">
                {totalGatePasses}
                <span className="text-xs font-semibold text-blue-600/80 dark:text-blue-400/80 ml-1">PASSES</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                <span>Total Audit Rows:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {records.length} logged
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Recharts Canvas */}
          <div className="p-4 sm:p-5">
            <div className="h-72 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {viewType === 'combined' ? (
                  <ComposedChart
                    data={dailyData}
                    margin={{ top: 12, right: 20, left: 10, bottom: 8 }}
                  >
                    <defs>
                      <linearGradient id="cartonsBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.65} />
                      </linearGradient>
                      <linearGradient id="quantityAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />

                    <XAxis
                      dataKey="displayDate"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickFormatter={(val, idx) => {
                        const pt = dailyData[idx];
                        return pt ? `${pt.dayOfWeek} ${pt.displayDate.split(' ')[0]}` : val;
                      }}
                    />

                    {/* Left Axis: Cartons */}
                    <YAxis
                      yAxisId="left"
                      orientation="left"
                      stroke="#10b981"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${val}`}
                      label={{
                        value: 'Cartons (CTNS)',
                        angle: -90,
                        position: 'insideLeft',
                        fill: '#10b981',
                        fontSize: 10,
                        offset: -2
                      }}
                    />

                    {/* Right Axis: Piece Quantity */}
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#8b5cf6"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${val}`)}
                      label={{
                        value: 'Piece Quantity (QTY)',
                        angle: 90,
                        position: 'insideRight',
                        fill: '#8b5cf6',
                        fontSize: 10,
                        offset: 4
                      }}
                    />

                    <Tooltip content={<CustomTooltip />} />

                    <Legend
                      wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
                      formatter={(value) => {
                        if (value === 'totalCartons') return 'Total Cartons (CTNS)';
                        if (value === 'totalQuantity') return 'Piece Quantity (QTY)';
                        return value;
                      }}
                    />

                    {/* Quantity Area Backdrop */}
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="totalQuantity"
                      fill="url(#quantityAreaGrad)"
                      stroke="none"
                    />

                    {/* Cartons Bar */}
                    <Bar
                      yAxisId="left"
                      dataKey="totalCartons"
                      name="totalCartons"
                      fill="url(#cartonsBarGrad)"
                      radius={[5, 5, 0, 0]}
                      barSize={28}
                    />

                    {/* Quantity Line */}
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="totalQuantity"
                      name="totalQuantity"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 1.5, stroke: '#ffffff' }}
                      activeDot={{ r: 6, fill: '#7c3aed', strokeWidth: 2, stroke: '#ffffff' }}
                    />
                  </ComposedChart>
                ) : viewType === 'cartons' ? (
                  <BarChart
                    data={dailyData}
                    margin={{ top: 12, right: 20, left: 10, bottom: 8 }}
                  >
                    <defs>
                      <linearGradient id="cartonsSingleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#059669" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                    <XAxis
                      dataKey="displayDate"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickFormatter={(val, idx) => {
                        const pt = dailyData[idx];
                        return pt ? `${pt.dayOfWeek} ${pt.displayDate}` : val;
                      }}
                    />
                    <YAxis
                      stroke="#10b981"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      label={{
                        value: 'Cartons Dispatched',
                        angle: -90,
                        position: 'insideLeft',
                        fill: '#10b981',
                        fontSize: 10
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="totalCartons"
                      name="totalCartons"
                      fill="url(#cartonsSingleGrad)"
                      radius={[6, 6, 0, 0]}
                      barSize={36}
                    />
                  </BarChart>
                ) : (
                  <AreaChart
                    data={dailyData}
                    margin={{ top: 12, right: 20, left: 10, bottom: 8 }}
                  >
                    <defs>
                      <linearGradient id="quantitySingleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                    <XAxis
                      dataKey="displayDate"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickFormatter={(val, idx) => {
                        const pt = dailyData[idx];
                        return pt ? `${pt.dayOfWeek} ${pt.displayDate}` : val;
                      }}
                    />
                    <YAxis
                      stroke="#8b5cf6"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${val}`)}
                      label={{
                        value: 'Piece Quantity (QTY)',
                        angle: -90,
                        position: 'insideLeft',
                        fill: '#8b5cf6',
                        fontSize: 10
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="totalQuantity"
                      stroke="#7c3aed"
                      strokeWidth={2.5}
                      fill="url(#quantitySingleGrad)"
                      dot={{ r: 4, fill: '#7c3aed', strokeWidth: 1.5, stroke: '#ffffff' }}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Granular Breakdown Drawer Toggle */}
          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 p-3 flex items-center justify-between">
            <button
              onClick={() => setIsBreakdownOpen(!isBreakdownOpen)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{isBreakdownOpen ? 'Hide 7-Day Daily Breakdown Table' : 'Show 7-Day Daily Breakdown Table'}</span>
              {isBreakdownOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Info className="w-3 h-3 text-slate-400" />
              Data feeds live from Audit Database records
            </span>
          </div>

          {/* Granular 7-Day Daily Breakdown Table */}
          {isBreakdownOpen && (
            <div className="border-t border-slate-200 dark:border-slate-800 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Day</th>
                    <th className="py-2.5 px-3 text-center">Gate Passes</th>
                    <th className="py-2.5 px-3 text-center">Vehicles</th>
                    <th className="py-2.5 px-3 text-right">Dispatched Cartons</th>
                    <th className="py-2.5 px-3 text-right">Piece Quantity</th>
                    <th className="py-2.5 px-3 text-right">Share of Week</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {dailyData.map((day) => {
                    const sharePct = total7DaysCartons > 0
                      ? Math.round((day.totalCartons / total7DaysCartons) * 100)
                      : 0;

                    return (
                      <tr
                        key={day.dateKey}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-2 px-3 font-mono font-medium text-slate-900 dark:text-white">
                          {day.displayDate}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-600 dark:text-slate-400">
                          {day.dayOfWeek}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {day.gatePassesCount}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-600 dark:text-slate-400">
                          {day.vehiclesCount}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {day.totalCartons.toLocaleString()} CTNS
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-violet-600 dark:text-violet-400">
                          {day.totalQuantity.toLocaleString()} QTY
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {sharePct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Totals row */}
                  <tr className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t-2 border-slate-200 dark:border-slate-700">
                    <td colSpan={2} className="py-2.5 px-3 uppercase text-slate-900 dark:text-white">
                      7-Day Total
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-blue-600 dark:text-blue-400">
                      {totalGatePasses}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-500">
                      -
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                      {total7DaysCartons.toLocaleString()} CTNS
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-violet-600 dark:text-violet-400 text-sm">
                      {total7DaysQuantity.toLocaleString()} QTY
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      100%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};
