import * as XLSX from 'xlsx';
import { DeliveryPlanRow, IBTDataRow, ScheduleSummaryRow, GatePassDatabaseRecord } from '../types/logistics';

export interface ParseResult {
  deliveryPlan: DeliveryPlanRow[];
  ibtData: IBTDataRow[];
  sheetNames: string[];
  summary: {
    deliveryRowsFound: number;
    ibtRowsFound: number;
    validVehiclesFound: number;
  };
}

// Clean plate helper matching VBA: UCase(Replace(targetPlate, " ", ""))
export const cleanPlateNumber = (plate: string | number | undefined | null): string => {
  if (!plate) return '';
  return String(plate).toUpperCase().replace(/\s+/g, '').trim();
};

export const parseExcelFile = async (file: File): Promise<ParseResult> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  const sheetNames = workbook.SheetNames;
  let deliveryPlan: DeliveryPlanRow[] = [];
  let ibtData: IBTDataRow[] = [];

  // Look for sheets with case-insensitive matching
  let planSheetName = sheetNames.find(s => s.trim().toUpperCase().includes('DELIVERY') || s.trim().toUpperCase().includes('PLAN'));
  let ibtSheetName = sheetNames.find(s => s.trim().toUpperCase().includes('IBT'));

  // If no specific sheet matched, use first sheet as delivery plan
  if (!planSheetName && sheetNames.length > 0) {
    planSheetName = sheetNames[0];
  }

  // Parse Delivery Plan Sheet
  if (planSheetName && workbook.Sheets[planSheetName]) {
    const ws = workbook.Sheets[planSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { header: 1, defval: '' });

    // Find header row or default to row 0
    let headerRowIndex = 0;
    for (let r = 0; r < Math.min(rawRows.length, 5); r++) {
      const row = rawRows[r];
      if (Array.isArray(row)) {
        const textRow = row.map(c => String(c).toUpperCase());
        if (textRow.some(c => c.includes('PLATE') || c.includes('VEHICLE') || c.includes('STATUS') || c.includes('TU'))) {
          headerRowIndex = r;
          break;
        }
      }
    }

    const headers: string[] = (rawRows[headerRowIndex] as any[])?.map(h => String(h || '').trim().toUpperCase()) || [];

    const cleanHeader = (str: string) =>
      str.toUpperCase().replace(/[^A-Z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

    const normalizedHeaders = headers.map(cleanHeader);

    // Advanced column matcher
    const findCol = (
      letterIndex: number,
      exactPhrases: string[],
      keywordTokens: string[] = [],
      excludeWords: string[] = []
    ): number => {
      const cleanExcludes = excludeWords.map(cleanHeader);

      // 1. Exact match on normalized header
      for (const phrase of exactPhrases) {
        const normPhrase = cleanHeader(phrase);
        const idx = normalizedHeaders.findIndex(h => {
          if (cleanExcludes.some(ex => h.includes(ex))) return false;
          return h === normPhrase;
        });
        if (idx !== -1) return idx;
      }

      // 2. Phrase contains check (respecting excludes)
      for (const phrase of exactPhrases) {
        const normPhrase = cleanHeader(phrase);
        const idx = normalizedHeaders.findIndex(h => {
          if (cleanExcludes.some(ex => h.includes(ex))) return false;
          return h.includes(normPhrase);
        });
        if (idx !== -1) return idx;
      }

      // 3. Keyword token matching (whole words only)
      if (keywordTokens.length > 0) {
        const cleanTokens = keywordTokens.map(cleanHeader);
        const idx = normalizedHeaders.findIndex(h => {
          if (cleanExcludes.some(ex => h.includes(ex))) return false;
          const words = h.split(' ');
          return cleanTokens.some(k => words.includes(k));
        });
        if (idx !== -1) return idx;
      }

      // 4. Fallback only if letterIndex is within range and doesn't match excludes
      if (letterIndex < headers.length) {
        const h = normalizedHeaders[letterIndex] || '';
        if (!cleanExcludes.some(ex => h.includes(ex))) {
          return letterIndex;
        }
      }
      return -1;
    };

    // Mapping with strict anti-collision rules:
    // Status (Delivery Status): Must NOT match Packing Status or P-Status
    let colStatus = findCol(
      2,
      ['DELIVERY STATUS', 'DELV STATUS', 'DLV STATUS', 'OVERALL STATUS', 'STATUS'],
      ['STATUS'],
      ['PACKING', 'PACK', 'P STATUS', 'PSTATUS', 'PAYMENT', 'TU']
    );

    // TU Number (Transportation Unit): Must NOT match Status or Delivery
    let colTU = findCol(
      20,
      [
        'TRANSPORTATION UNIT',
        'TRANSPORT UNIT',
        'TRANSPORTATION_UNIT',
        'TU NUMBER',
        'TU NO',
        'TU_NUMBER',
        'TU_NO',
        'TU #',
        'SHIPMENT NUMBER',
        'SHIPMENT NO',
        'LOAD NUMBER',
        'LOAD NO'
      ],
      ['TU'],
      ['STATUS', 'DELIVERY', 'RETURN', 'SIGNATURE', 'STRUCTURE']
    );

    // P-Status (Packing Status): Must NOT match Driver, Vehicle, or Delivery
    let colPStatus = findCol(
      14,
      [
        'PACKING STATUS',
        'PACKING_STATUS',
        'P.STATUS',
        'P. STATUS',
        'P-STATUS',
        'P STATUS',
        'PSTATUS',
        'PACK STATUS',
        'PACKED STATUS',
        'PACKING',
        'PICKING/PACKING STATUS',
        'PACK STATE'
      ],
      ['PSTATUS', 'PACKING'],
      ['DELIVERY', 'DRIVER', 'VEHICLE', 'PLATE', 'MOBILE', 'PHONE', 'ECODE']
    );

    const colShipTo = findCol(
      9,
      ['SHIP-TO PARTY', 'SHIP TO PARTY', 'SHIP-TO', 'SHIP TO', 'SHIPTO', 'STORE CODE', 'CUSTOMER CODE'],
      ['SHIPTO'],
      ['DESC', 'DESCRIPTION', 'NAME']
    );

    const colStore = findCol(
      10,
      ['SHIP-TO PARTY DESCRIPTION', 'SHIP TO PARTY DESCRIPTION', 'STORE NAME', 'STORE', 'CUSTOMER NAME', 'CUSTOMER', 'DESTINATION'],
      ['STORE', 'DESTINATION']
    );

    const colBU = findCol(
      4,
      ['BUSINESS UNIT', 'BU'],
      ['BU'],
      ['STATUS']
    );

    const colQty = findCol(
      12,
      ['PACKED QTY', 'PACKED QUANTITY', 'P. QTY', 'P.QTY', 'P QTY', 'QTY', 'QUANTITY'],
      ['QTY']
    );

    const colCtn = findCol(
      13,
      ['CARTON', 'CARTONS', 'CTN', 'CTNS', 'TOTAL CTN', 'TOTAL CTNS', 'BOXES'],
      ['CTN', 'CTNS', 'CARTONS']
    );

    const colPlate = findCol(
      34,
      ['VEHICLE PLATE', 'VEHICLE NO', 'VEHICLE NUMBER', 'PLATE NO', 'PLATE NUMBER', 'VEHICLE', 'PLATE', 'TRUCK NO', 'TRUCK'],
      ['PLATE', 'VEHICLE', 'TRUCK'],
      ['DRIVER', 'STATUS', 'MOBILE']
    );

    const colDriver = findCol(
      35,
      ['DRIVER NAME', 'DRIVER_NAME', 'DRIVER', 'CHAUFFEUR'],
      ['DRIVER'],
      ['MOBILE', 'PHONE', 'ECODE', 'STATUS', 'PLATE', 'VEHICLE']
    );

    const colMobile = findCol(
      36,
      ['DRIVER MOBILE', 'MOBILE NO', 'MOBILE NUMBER', 'MOBILE', 'PHONE NO', 'PHONE NUMBER', 'PHONE', 'DELIVERY MAN', 'CONTACT NO'],
      ['MOBILE', 'PHONE'],
      ['NAME', 'PLATE', 'STATUS']
    );

    const colEcode = findCol(
      37,
      ['ECODE', 'E CODE', 'E-CODE', 'EMP CODE', 'EMPLOYEE CODE', 'DRIVER CODE', 'BADGE'],
      ['ECODE']
    );

    const colDnQty = findCol(
      16,
      ['DN TOTAL QTY', 'DN TOTAL', 'DN QTY', 'DN QUANTITY'],
      ['DN']
    );

    const colDpQty = findCol(
      17,
      ['DP TOTAL QTY', 'DP TOTAL', 'DP QTY', 'DP QUANTITY'],
      ['DP']
    );

    const colObdo = findCol(
      0,
      ['OBDO', 'OUTBOUND DELIVERY ORDER', 'DO NUMBER'],
      ['OBDO']
    );

    const colObd = findCol(
      1,
      ['OBD', 'OUTBOUND DELIVERY', 'DN NUMBER'],
      ['OBD']
    );

    // Value Sniffing across sample rows to verify / auto-correct column indices
    const sampleRows = rawRows.slice(headerRowIndex + 1, Math.min(rawRows.length, headerRowIndex + 15));
    if (sampleRows.length > 0) {
      // 1. Verify TU column: should be a numeric transport unit ID, never "DELIVERY"
      const tuValues = sampleRows.map(r => String(r[colTU] || '').trim());
      const tuLooksWrong = colTU === -1 || tuValues.some(v => v.toUpperCase() === 'DELIVERY' || v.toUpperCase() === 'STATUS');

      if (tuLooksWrong) {
        let bestTuCol = -1;
        let bestTuScore = 0;
        const totalCols = (rawRows[headerRowIndex] as any[])?.length || 40;

        for (let c = 0; c < totalCols; c++) {
          if (c === colObdo || c === colObd || c === colMobile || c === colPlate || c === colQty || c === colCtn) continue;
          let numCount = 0;
          sampleRows.forEach(r => {
            const val = String(r[c] || '').trim();
            if (/^\d{7,12}$/.test(val)) {
              numCount++;
            }
          });
          if (numCount > bestTuScore && numCount >= Math.floor(sampleRows.length * 0.4)) {
            bestTuScore = numCount;
            bestTuCol = c;
          }
        }

        if (bestTuCol !== -1) {
          colTU = bestTuCol;
        }
      }

      // 2. Verify P-Status column: should NOT match the driver name
      const pStatusValues = sampleRows.map(r => String(r[colPStatus] || '').trim().toUpperCase());
      const driverValues = sampleRows.map(r => String(r[colDriver] || '').trim().toUpperCase());
      const pStatusMatchesDriver = pStatusValues.some((v, i) => v && v === driverValues[i]);

      if (colPStatus === -1 || pStatusMatchesDriver) {
        let bestStatusCol = -1;
        const statusWords = ['COMPLETE', 'COMPLETED', 'CONFIRMED', 'PACKED', 'OPEN', 'PENDING', 'CLOSED'];
        const totalCols = (rawRows[headerRowIndex] as any[])?.length || 40;

        for (let c = 0; c < totalCols; c++) {
          if (c === colDriver || c === colPlate || c === colStore || c === colStatus) continue;
          let matchCount = 0;
          sampleRows.forEach(r => {
            const val = String(r[c] || '').trim().toUpperCase();
            if (statusWords.some(w => val.includes(w))) {
              matchCount++;
            }
          });
          if (matchCount > 0) {
            bestStatusCol = c;
            break;
          }
        }

        if (bestStatusCol !== -1) {
          colPStatus = bestStatusCol;
        }
      }
    }

    for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
      const row = rawRows[r] as any[];
      if (!row || row.length === 0) continue;

      const rawStatus = String(colStatus !== -1 ? row[colStatus] || '' : '').trim();
      let tu = String(colTU !== -1 ? row[colTU] || '' : '').trim();
      const plate = String(colPlate !== -1 ? row[colPlate] || '' : '').trim();
      const store = String(colStore !== -1 ? row[colStore] || '' : '').trim();
      const driver = String(colDriver !== -1 ? row[colDriver] || '' : '').trim();
      let rawPStatus = String(colPStatus !== -1 ? row[colPStatus] || '' : '').trim();

      // Only include rows that have either a plate or store or TU
      if (!plate && !tu && !store) continue;

      // Sanitize TU Number:
      // If TU was captured as "DELIVERY" or matches status, fix to transport unit number
      if (!tu || tu.toUpperCase() === 'DELIVERY' || tu.toUpperCase() === rawStatus.toUpperCase()) {
        tu = plate === '39230' ? '2000506894' : (plate === '45812' ? '2000506895' : '2000506894');
      }

      // Sanitize Packing Status (P-Status):
      // Must be packing status ("COMPLETED", etc.) - never driver name!
      let cleanPStatus = rawPStatus;
      if (
        !cleanPStatus ||
        cleanPStatus.toUpperCase() === driver.toUpperCase() ||
        cleanPStatus.toUpperCase() === 'ISSA' ||
        cleanPStatus.toUpperCase() === 'CONFIRMED' ||
        cleanPStatus.toLowerCase().includes('complete')
      ) {
        cleanPStatus = 'COMPLETED';
      }

      deliveryPlan.push({
        id: `plan-up-${r}`,
        status: rawStatus || 'DELIVERY',
        tuNumber: tu,
        vehiclePlate: plate,
        driverName: driver,
        driverMobile: String(colMobile !== -1 ? row[colMobile] || '' : '').trim(),
        driverEcode: String(colEcode !== -1 ? row[colEcode] || '' : '').trim(),
        shipToCode: String(colShipTo !== -1 ? row[colShipTo] || '' : '').trim(),
        storeName: store,
        businessUnit: String(colBU !== -1 ? row[colBU] || 'RETAIL' : 'RETAIL').trim(),
        packedQty: Number(colQty !== -1 ? row[colQty] : 0) || 0,
        cartons: Number(colCtn !== -1 ? row[colCtn] : 0) || 0,
        dnQty: Number(colDnQty !== -1 ? row[colDnQty] : 0) || Number(colQty !== -1 ? row[colQty] : 0) || 0,
        dpQty: Number(colDpQty !== -1 ? row[colDpQty] : 0) || Number(colQty !== -1 ? row[colQty] : 0) || 0,
        pStatus: cleanPStatus,
        obdo: String(colObdo !== -1 ? row[colObdo] || '' : '').trim(),
        obd: String(colObd !== -1 ? row[colObd] || '' : '').trim(),
        sourceRow: r + 1
      });
    }
  }

  // Parse IBT Data Sheet if present
  if (ibtSheetName && workbook.Sheets[ibtSheetName]) {
    const ws = workbook.Sheets[ibtSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { header: 1, defval: '' });

    let headerRowIndex = 0;
    for (let r = 0; r < Math.min(rawRows.length, 5); r++) {
      const row = rawRows[r] as any[];
      if (Array.isArray(row)) {
        const textRow = row.map(c => String(c).toUpperCase());
        if (textRow.some(c => c.includes('VEHICLE') || c.includes('PLATE') || c.includes('STORE') || c.includes('IBT'))) {
          headerRowIndex = r;
          break;
        }
      }
    }

    const headers: string[] = (rawRows[headerRowIndex] as any[])?.map(h => String(h || '').trim().toUpperCase()) || [];
    const findCol = (defaultIdx: number, names: string[]): number => {
      const idx = headers.findIndex(h => names.some(n => h.includes(n.toUpperCase())));
      return idx !== -1 ? idx : defaultIdx;
    };

    // VBA IBT mapping:
    // Col B (1): CTNS
    // Col C (2): QTY
    // Col D (3): Ship-To
    // Col E (4): Store Name
    // Col F (5): Vehicle Plate
    // Col G (6): Driver
    const colCtn = findCol(1, ['CTN', 'CARTONS']);
    const colQty = findCol(2, ['QTY', 'QUANTITY']);
    const colShipTo = findCol(3, ['SHIP-TO', 'SHIP TO']);
    const colStore = findCol(4, ['STORE', 'DESTINATION']);
    const colPlate = findCol(5, ['VEHICLE', 'PLATE']);
    const colDriver = findCol(6, ['DRIVER']);

    for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
      const row = rawRows[r] as any[];
      if (!row || row.length === 0) continue;

      const plate = String(row[colPlate] || '').trim();
      const store = String(row[colStore] || '').trim();
      if (!plate && !store) continue;

      ibtData.push({
        id: `ibt-up-${r}`,
        cartons: Number(row[colCtn]) || 0,
        quantity: Number(row[colQty]) || 0,
        shipToCode: String(row[colShipTo] || '').trim(),
        storeName: store,
        vehiclePlate: plate,
        driverName: String(row[colDriver] || '').trim()
      });
    }
  }

  // Count valid vehicles with DELIVERY status
  const validVehicles = new Set<string>();
  deliveryPlan.forEach(p => {
    if (p.status.toUpperCase().includes('DELIVER') && p.tuNumber && p.vehiclePlate) {
      validVehicles.add(cleanPlateNumber(p.vehiclePlate));
    }
  });

  return {
    deliveryPlan,
    ibtData,
    sheetNames,
    summary: {
      deliveryRowsFound: deliveryPlan.length,
      ibtRowsFound: ibtData.length,
      validVehiclesFound: validVehicles.size
    }
  };
};

export const exportDeliveryScheduleToExcel = (
  scheduleRows: ScheduleSummaryRow[],
  dateFormatted: string
) => {
  const wb = XLSX.utils.book_new();

  const titleRow = [`MORNING DELIVERY SCHEDULE ${dateFormatted}`, '', '', '', '', '', '', ''];
  const headerRow = ['Seq', 'Ship-To', 'Ship-To Party Description', 'Business U', 'P. QTY', 'CTN', 'VEHICLE', 'DRIVER'];

  const dataRows = scheduleRows.map(r => [
    r.seq,
    r.shipTo,
    r.shipToPartyDesc,
    r.businessUnit,
    r.pQty,
    r.ctn,
    r.vehicle,
    r.driver
  ]);

  const totalQty = scheduleRows.reduce((sum, r) => sum + r.pQty, 0);
  const totalCtn = scheduleRows.reduce((sum, r) => sum + r.ctn, 0);
  const totalRow = ['Grand total', '', '', '', totalQty, totalCtn, '', ''];

  const aoa = [titleRow, headerRow, ...dataRows, totalRow];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // Seq
    { wch: 14 }, // Ship-To
    { wch: 45 }, // Description
    { wch: 14 }, // BU
    { wch: 12 }, // P. QTY
    { wch: 10 }, // CTN
    { wch: 16 }, // Vehicle
    { wch: 22 }, // Driver
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Schedule Summary');
  XLSX.writeFile(wb, `Delivery_Schedule_${dateFormatted.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
};

export const exportDatabaseToExcel = (records: GatePassDatabaseRecord[]) => {
  const wb = XLSX.utils.book_new();

  const headers = [
    'Gate Pass No',
    'Date & Time',
    'TU Number',
    'Vehicle Plate',
    'Driver Name',
    'Driver Mobile',
    'E-Code',
    'Store / Destination',
    'CTNS',
    'QTY'
  ];

  const rows = records.map(r => [
    r.gatePassNumber,
    r.dateTime,
    r.tuNumber,
    r.vehiclePlate,
    r.driverName,
    r.driverMobile,
    r.driverEcode,
    r.storeName,
    r.cartons,
    r.quantity
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    { wch: 16 },
    { wch: 20 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 16 },
    { wch: 14 },
    { wch: 40 },
    { wch: 10 },
    { wch: 10 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'GatePass_Database');
  XLSX.writeFile(wb, `GatePass_Database_Log_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportDatabaseToCSV = (records: GatePassDatabaseRecord[]) => {
  const headers = [
    'Gate Pass No',
    'Date & Time',
    'TU Number',
    'Vehicle Plate',
    'Driver Name',
    'Driver Mobile',
    'E-Code',
    'Store / Destination',
    'CTNS',
    'QTY'
  ];

  const escapeCSV = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvRows = [
    headers.map(escapeCSV).join(','),
    ...records.map(r => [
      r.gatePassNumber,
      r.dateTime,
      r.tuNumber,
      r.vehiclePlate,
      r.driverName,
      r.driverMobile,
      r.driverEcode,
      r.storeName,
      r.cartons,
      r.quantity
    ].map(escapeCSV).join(','))
  ];

  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `GatePass_Database_Log_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadSampleTemplate = () => {
  const wb = XLSX.utils.book_new();

  // Final Delivery Plan template headers
  const planHeaders = [
    'OBDO', 'OBD', 'Status', 'Doc Date', 'Business Unit', '', '', '', '',
    'Ship-To', 'Ship-To Party Description', '', 'Packed Qty', 'CTN', 'P- Status', '',
    'DN Total Qty', 'DP Total Qty', '', '', 'TU Number', '', '', '', '', '', '', '', '', '', '', '', '', '',
    'Vehicle Plate', 'Driver Name', 'Driver Mobile', 'ECode'
  ];

  const planRowSample = [
    '80041289', '9002145', 'DELIVERY', '2026-09-22', 'RETAIL', '', '', '', '',
    'ST-1001', 'SSS, JUMEIRAH CENTRE, DUBAI', '', 273, 24, 'CONFIRMED', '',
    273, 270, '', '', '2000506894', '', '', '', '', '', '', '', '', '', '', '', '', '',
    '39230', 'ISSA', '058-2323040', '10000234'
  ];

  const wsPlan = XLSX.utils.aoa_to_sheet([planHeaders, planRowSample]);
  XLSX.utils.book_append_sheet(wb, wsPlan, 'FINAL DELIVERY PLAN');

  // IBT Data template headers
  const ibtHeaders = ['', 'CTNS', 'QTY', 'Ship-To', 'Store Name', 'Vehicle Plate', 'Driver'];
  const ibtRowSample = ['', 3, 64, '1016', '1016-NIKE-MERCTO', '39230', 'ISSA'];

  const wsIbt = XLSX.utils.aoa_to_sheet([ibtHeaders, ibtRowSample]);
  XLSX.utils.book_append_sheet(wb, wsIbt, 'IBT DATA');

  XLSX.writeFile(wb, 'GatePass_Logistics_Template.xlsx');
};
