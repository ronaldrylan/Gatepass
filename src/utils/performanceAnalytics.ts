import { GatePassDatabaseRecord } from '../types/logistics';

export interface DailyPerformancePoint {
  dateKey: string; // YYYY-MM-DD
  displayDate: string; // e.g. "07 Oct"
  fullDate: string; // DD/MM/YYYY
  dayOfWeek: string; // e.g. "Mon"
  totalCartons: number;
  totalQuantity: number;
  gatePassesCount: number;
  deliveriesCount: number;
  vehiclesCount: number;
  vehiclePlates: string[];
}

export interface SevenDayPerformanceSummary {
  dailyData: DailyPerformancePoint[];
  total7DaysCartons: number;
  total7DaysQuantity: number;
  avgDailyCartons: number;
  avgDailyQuantity: number;
  peakCartonsDay: { displayDate: string; cartons: number };
  peakQuantityDay: { displayDate: string; quantity: number };
  totalGatePasses: number;
  growthRateCartons: number; // percentage comparison between first half and second half
}

/**
 * Normalizes any date string (DD/MM/YYYY, DD/MM/YYYY HH:mm, YYYY-MM-DD, or ISO) to YYYY-MM-DD
 */
export function normalizeDateToKey(dateStr: string): string | null {
  if (!dateStr) return null;
  const str = dateStr.trim();

  // Pattern 1: DD/MM/YYYY (with optional HH:mm or HH:mm:ss)
  const dmyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Pattern 2: YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Fallback: Date parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = (parsed.getMonth() + 1).toString().padStart(2, '0');
    const day = parsed.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return null;
}

/**
 * Processes database records and computes 7-day trend metrics for Recharts
 */
export function compute7DayDeliveryPerformance(
  records: GatePassDatabaseRecord[]
): SevenDayPerformanceSummary {
  const days: DailyPerformancePoint[] = [];
  const now = new Date();

  // Build the last 7 calendar days in chronological order (6 days ago -> today)
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);

    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    const displayDate = d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short'
    });

    const dayOfWeek = d.toLocaleDateString('en-GB', { weekday: 'short' });
    const fullDate = `${day}/${month}/${year}`;

    days.push({
      dateKey,
      displayDate,
      fullDate,
      dayOfWeek,
      totalCartons: 0,
      totalQuantity: 0,
      gatePassesCount: 0,
      deliveriesCount: 0,
      vehiclesCount: 0,
      vehiclePlates: []
    });
  }

  const dayMap = new Map<string, DailyPerformancePoint>();
  days.forEach(d => dayMap.set(d.dateKey, d));

  // GatePass deduplication per day to accurately count unique gate passes & vehicles
  const dayGatePassesMap = new Map<string, Set<string>>();
  const dayVehiclesMap = new Map<string, Set<string>>();

  // Aggregate records into corresponding day
  records.forEach(r => {
    const recordKey = normalizeDateToKey(r.dateTime);
    if (!recordKey) return;

    const targetDay = dayMap.get(recordKey);
    if (targetDay) {
      targetDay.totalCartons += Number(r.cartons) || 0;
      targetDay.totalQuantity += Number(r.quantity) || 0;
      targetDay.deliveriesCount += 1;

      if (!dayGatePassesMap.has(recordKey)) {
        dayGatePassesMap.set(recordKey, new Set());
      }
      if (!dayVehiclesMap.has(recordKey)) {
        dayVehiclesMap.set(recordKey, new Set());
      }

      if (r.gatePassNumber) {
        dayGatePassesMap.get(recordKey)!.add(r.gatePassNumber);
      }
      if (r.vehiclePlate) {
        dayVehiclesMap.get(recordKey)!.add(r.vehiclePlate);
      }
    }
  });

  // Finalize counts
  days.forEach(d => {
    const gpSet = dayGatePassesMap.get(d.dateKey);
    d.gatePassesCount = gpSet ? gpSet.size : 0;

    const vSet = dayVehiclesMap.get(d.dateKey);
    d.vehiclesCount = vSet ? vSet.size : 0;
    d.vehiclePlates = vSet ? Array.from(vSet) : [];
  });

  const total7DaysCartons = days.reduce((sum, d) => sum + d.totalCartons, 0);
  const total7DaysQuantity = days.reduce((sum, d) => sum + d.totalQuantity, 0);
  const avgDailyCartons = Math.round(total7DaysCartons / 7);
  const avgDailyQuantity = Math.round(total7DaysQuantity / 7);

  let peakCartonsDay = { displayDate: days[0]?.displayDate || '-', cartons: 0 };
  let peakQuantityDay = { displayDate: days[0]?.displayDate || '-', quantity: 0 };
  let totalGatePasses = 0;

  days.forEach(d => {
    totalGatePasses += d.gatePassesCount;
    if (d.totalCartons >= peakCartonsDay.cartons) {
      peakCartonsDay = { displayDate: `${d.displayDate} (${d.dayOfWeek})`, cartons: d.totalCartons };
    }
    if (d.totalQuantity >= peakQuantityDay.quantity) {
      peakQuantityDay = { displayDate: `${d.displayDate} (${d.dayOfWeek})`, quantity: d.totalQuantity };
    }
  });

  // Calculate simple growth rate (first 3 days avg vs last 3 days avg)
  const firstHalfCartons = (days[0].totalCartons + days[1].totalCartons + days[2].totalCartons) / 3;
  const secondHalfCartons = (days[4].totalCartons + days[5].totalCartons + days[6].totalCartons) / 3;
  const growthRateCartons = firstHalfCartons > 0
    ? Math.round(((secondHalfCartons - firstHalfCartons) / firstHalfCartons) * 100)
    : 0;

  return {
    dailyData: days,
    total7DaysCartons,
    total7DaysQuantity,
    avgDailyCartons,
    avgDailyQuantity,
    peakCartonsDay,
    peakQuantityDay,
    totalGatePasses,
    growthRateCartons
  };
}

/**
 * Generates high-fidelity historical Audit Database records spanning the last 7 days
 * relative to the current execution date.
 */
export function generateSampleDatabaseRecords(): GatePassDatabaseRecord[] {
  const now = new Date();
  const records: GatePassDatabaseRecord[] = [];
  let seq = 1010;

  const pad = (n: number) => n.toString().padStart(2, '0');

  const fleet = [
    { plate: '39230', driver: 'ISSA', mobile: '058-2323040', ecode: '10000234', tu: '2000506894' },
    { plate: '45812', driver: 'MOHAMMED ALI', mobile: '055-9812401', ecode: '10000582', tu: '2000506895' },
    { plate: '67290', driver: 'RAJESH KUMAR', mobile: '050-1284920', ecode: '10000843', tu: '2000506896' },
    { plate: '12845', driver: 'AHMED HASSAN', mobile: '056-7734120', ecode: '10000912', tu: '2000506897' },
    { plate: '55102', driver: 'TARIQ MEHMOOD', mobile: '054-3329184', ecode: '10000955', tu: '2000506898' },
    { plate: '89431', driver: 'VIKRAM SINGH', mobile: '052-4411223', ecode: '10001004', tu: '2000506899' }
  ];

  const destinations = [
    'SSS, JUMEIRAH CENTRE, DUBAI',
    'SSS-SKYLINE RESIDENCE',
    '1016-NIKE-MERCTO ( IBT)',
    '1037-KIDS SSS-US ( IBT)',
    '1043-SSS, JUMEIRAH CENTRE ( IBT)',
    '2044-DUBAI MARINA MALL ( IBT)',
    '3055-MARINA MALL ABU DHABI ( IBT)',
    'DUBAI MALL FLAGSHIP STORE',
    'MALL OF THE EMIRATES DC',
    'CITY CENTRE MIRDIF - SPORTS',
    'YAS MALL ABU DHABI',
    'AL WAHDA MALL RETAIL'
  ];

  // Daily dispatch profiles for the past 7 days (index 6 = today, index 0 = 6 days ago)
  const dailyProfiles = [
    { dayOffset: 6, vehicles: [0, 4], time: '08:45', cartonsRange: [24, 65], qtyMultiplier: 7 },
    { dayOffset: 5, vehicles: [1, 2, 3], time: '09:15', cartonsRange: [30, 80], qtyMultiplier: 8 },
    { dayOffset: 4, vehicles: [0, 2], time: '08:30', cartonsRange: [28, 70], qtyMultiplier: 7.5 },
    { dayOffset: 3, vehicles: [0, 1, 4, 5], time: '09:00', cartonsRange: [35, 95], qtyMultiplier: 8.2 },
    { dayOffset: 2, vehicles: [1, 2, 3], time: '08:50', cartonsRange: [30, 75], qtyMultiplier: 7.8 },
    { dayOffset: 1, vehicles: [0, 3, 5], time: '09:10', cartonsRange: [32, 85], qtyMultiplier: 8 },
    { dayOffset: 0, vehicles: [0, 1, 2], time: '08:30', cartonsRange: [35, 90], qtyMultiplier: 8.5 }
  ];

  dailyProfiles.forEach(profile => {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - profile.dayOffset);

    const dStr = `${pad(targetDate.getDate())}/${pad(targetDate.getMonth() + 1)}/${targetDate.getFullYear()}`;
    const dateTime = `${dStr} ${profile.time}`;

    profile.vehicles.forEach((vIdx, vOrder) => {
      const v = fleet[vIdx];
      const gpNum = `GP-2026-${seq++}`;

      // 2 to 4 stores per vehicle
      const storeCount = 2 + (vOrder % 3);
      let vehTotalCartons = 0;
      let vehTotalQty = 0;

      const storeItems: { storeName: string; cartons: number; quantity: number }[] = [];

      for (let s = 0; s < storeCount; s++) {
        const destIdx = (vIdx * 2 + s + profile.dayOffset) % destinations.length;
        const storeName = destinations[destIdx];
        const baseCartons = Math.floor(profile.cartonsRange[0] + ((profile.cartonsRange[1] - profile.cartonsRange[0]) / storeCount));
        const cartons = Math.max(12, baseCartons + ((s * 7) % 15));
        const quantity = Math.floor(cartons * profile.qtyMultiplier + ((s * 13) % 25));

        vehTotalCartons += cartons;
        vehTotalQty += quantity;
        storeItems.push({ storeName, cartons, quantity });
      }

      storeItems.forEach((item, itemIdx) => {
        records.push({
          id: `sample-db-${profile.dayOffset}-${vIdx}-${itemIdx}`,
          gatePassNumber: gpNum,
          dateTime,
          tuNumber: v.tu,
          vehiclePlate: v.plate,
          driverName: v.driver,
          driverMobile: v.mobile,
          driverEcode: v.ecode,
          storeName: item.storeName,
          cartons: item.cartons,
          quantity: item.quantity,
          totalStoresCount: storeItems.length,
          totalCartons: vehTotalCartons,
          totalQuantity: vehTotalQty
        });
      });
    });
  });

  return records;
}
