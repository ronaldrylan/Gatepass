import { DeliveryPlanRow, IBTDataRow } from '../types/logistics';

/**
 * Escapes a single cell value for CSV formatting according to RFC 4180.
 * Wraps values with quotes if they contain commas, quotes, or newlines.
 */
function escapeCsvCell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts an array of string rows into a CSV string, prefixed with a UTF-8 BOM for Microsoft Excel.
 */
function toCsvString(rows: (string | number | undefined | null)[][]): string {
  const csvContent = rows
    .map(row => row.map(cell => escapeCsvCell(cell)).join(','))
    .join('\r\n');
  // Prepend UTF-8 BOM (\uFEFF) so Excel correctly recognizes UTF-8 characters
  return '\uFEFF' + csvContent;
}

/**
 * Initiates a browser download of a CSV file.
 */
function downloadCsv(filename: string, csvString: string): void {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports Delivery Plan rows to a CSV file.
 */
export function exportDeliveryPlanToCSV(data: DeliveryPlanRow[], filenamePrefix = 'delivery_plan'): void {
  const headers = [
    'Status',
    'TU Number',
    'Vehicle Plate',
    'Driver Name',
    'Driver Mobile',
    'Driver E-Code',
    'Ship-To Code',
    'Store / Destination',
    'Business Unit',
    'Packed QTY',
    'Cartons',
    'DN QTY',
    'DP QTY',
    'Packing Status (P-Status)',
    'OBDO',
    'OBD'
  ];

  const rows = data.map(row => [
    row.status,
    row.tuNumber,
    row.vehiclePlate,
    row.driverName,
    row.driverMobile,
    row.driverEcode,
    row.shipToCode,
    row.storeName,
    row.businessUnit,
    row.packedQty,
    row.cartons,
    row.dnQty ?? '',
    row.dpQty ?? '',
    row.pStatus ?? 'COMPLETED',
    row.obdo ?? '',
    row.obd ?? ''
  ]);

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `${filenamePrefix}_${dateStr}.csv`;
  const csv = toCsvString([headers, ...rows]);
  downloadCsv(filename, csv);
}

/**
 * Exports IBT Data rows to a CSV file.
 */
export function exportIbtDataToCSV(data: IBTDataRow[], filenamePrefix = 'ibt_data'): void {
  const headers = [
    'Vehicle Plate',
    'Driver Name',
    'Ship-To Code',
    'Store Name',
    'Cartons',
    'Quantity'
  ];

  const rows = data.map(row => [
    row.vehiclePlate,
    row.driverName,
    row.shipToCode,
    row.storeName,
    row.cartons,
    row.quantity
  ]);

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `${filenamePrefix}_${dateStr}.csv`;
  const csv = toCsvString([headers, ...rows]);
  downloadCsv(filename, csv);
}

/**
 * Exports both Delivery Plan and IBT datasets as a combined consolidated CSV report.
 */
export function exportCombinedLogisticsCSV(
  deliveryPlan: DeliveryPlanRow[],
  ibtData: IBTDataRow[],
  filenamePrefix = 'logistics_consolidated_data'
): void {
  const headers = [
    'Dataset Type',
    'Vehicle Plate',
    'TU Number',
    'Driver Name',
    'Driver Mobile',
    'Ship-To Code',
    'Store / Destination',
    'Cartons',
    'Quantity',
    'Status',
    'Packing Status',
    'Business Unit',
    'OBDO',
    'OBD'
  ];

  const deliveryRows = deliveryPlan.map(row => [
    'FINAL DELIVERY PLAN',
    row.vehiclePlate,
    row.tuNumber,
    row.driverName,
    row.driverMobile,
    row.shipToCode,
    row.storeName,
    row.cartons,
    row.packedQty,
    row.status,
    row.pStatus ?? 'COMPLETED',
    row.businessUnit,
    row.obdo ?? '',
    row.obd ?? ''
  ]);

  const ibtRows = ibtData.map(row => [
    'IBT DATA',
    row.vehiclePlate,
    '',
    row.driverName,
    '',
    row.shipToCode,
    row.storeName,
    row.cartons,
    row.quantity,
    'IBT TRANSFER',
    'COMPLETED',
    '',
    '',
    ''
  ]);

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `${filenamePrefix}_${dateStr}.csv`;
  const csv = toCsvString([headers, ...deliveryRows, ...ibtRows]);
  downloadCsv(filename, csv);
}
