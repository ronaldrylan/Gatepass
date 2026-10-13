export interface DeliveryPlanRow {
  id: string;
  status: string; // e.g. "DELIVERY", "DELIVERED"
  tuNumber: string; // Col U
  vehiclePlate: string; // Col AI
  driverName: string; // Col AJ
  driverMobile: string; // Col AK
  driverEcode: string; // Col AL
  shipToCode: string; // Col J
  storeName: string; // Col K: Store / Area / Customer Name
  businessUnit: string; // Col E
  packedQty: number; // Col M
  cartons: number; // Col N
  dnQty?: number; // Col Q
  dpQty?: number; // Col R
  pStatus?: string; // Col O
  obdo?: string; // Col A
  obd?: string; // Col B
  sourceRow?: number;
}

export interface IBTDataRow {
  id: string;
  cartons: number; // Col B
  quantity: number; // Col C
  shipToCode: string; // Col D
  storeName: string; // Col E
  vehiclePlate: string; // Col F
  driverName: string; // Col G
}

export interface StoreAggregate {
  storeName: string;
  cartons: number;
  quantity: number;
  isIBT?: boolean;
}

export interface VehicleGatePassData {
  vehiclePlate: string;
  cleanPlate: string;
  driverName: string;
  driverMobile: string;
  driverEcode: string;
  tuNumber: string;
  stores: StoreAggregate[];
  totalCartons: number;
  totalQuantity: number;
  ibtCount: number;
  gatePassNumber: string;
  timestamp: string;
  hasAlreadyPrinted?: boolean;
  lastPrintedDate?: string;
}

export interface CheckingPaperRow {
  obdo: string;
  obd: string;
  shipTo: string;
  shipToDesc: string;
  qty: number;
  dp: number;
  dnp: number; // max(0, qty - dp)
  ctns: number;
  pStatus: string;
  businessUnit: string;
  vehicle: string;
  driver: string;
  mobile: string;
  tu: string;
}

export interface StoreCheckingPaper {
  storeName: string;
  shipToCode: string;
  vehiclePlate: string;
  driverName: string;
  driverMobile: string;
  tuNumber: string;
  rows: CheckingPaperRow[];
  totalQty: number;
  totalDP: number;
  totalDNP: number;
  totalCTNS: number;
}

export interface ScheduleSummaryRow {
  seq: number;
  shipTo: string;
  shipToPartyDesc: string;
  businessUnit: string;
  pQty: number;
  ctn: number;
  vehicle: string;
  driver: string;
  cleanVehicle: string;
}

export interface ScheduleVehicleGroup {
  cleanVehicle: string;
  vehiclePlate: string;
  driverName: string;
  subTotalQty: number;
  subTotalCtn: number;
  stores: ScheduleSummaryRow[];
}

export interface ScheduleSummaryData {
  rows: ScheduleSummaryRow[];
  vehicleGroups: ScheduleVehicleGroup[];
  grandTotalQty: number;
  grandTotalCtn: number;
}

export interface GatePassDatabaseRecord {
  id: string;
  gatePassNumber: string;
  dateTime: string;
  tuNumber: string;
  vehiclePlate: string;
  driverName: string;
  driverMobile: string;
  driverEcode: string;
  storeName: string;
  cartons: number;
  quantity: number;
  totalStoresCount: number;
  totalCartons: number;
  totalQuantity: number;
}

export interface CompanyBranding {
  companyName: string; // e.g. "Trilogi"
  companySubtitle: string; // e.g. "Global Logistics Partner"
  facilityName: string; // e.g. "MEGA DC SECURITY"
  locationFooter: string; // e.g. "(From TRILOGI - MEGA DC)"
  customLogoUrl: string | null;
  logoType: 'trilogi' | 'custom' | 'minimal';
  logoHeightPx?: number;
  gatePassPrefix: string; // e.g. "GP-2026-"
  nextSequenceNumber: number; // e.g. 1001
  headerNote?: string;
}
