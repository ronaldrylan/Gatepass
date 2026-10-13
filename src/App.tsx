/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  DeliveryPlanRow,
  IBTDataRow,
  CompanyBranding,
  GatePassDatabaseRecord,
  VehicleGatePassData,
  StoreCheckingPaper
} from './types/logistics';
import {
  SAMPLE_DELIVERY_PLAN,
  SAMPLE_IBT_DATA,
  DEFAULT_BRANDING
} from './data/sampleData';
import {
  getUniqueVehicles,
  buildVehicleGatePassData,
  buildCheckingPapersForVehicle,
  VehicleSummaryInfo
} from './utils/dataProcessor';
import { ParseResult } from './utils/excelParser';
import { BrandLogo } from './components/BrandLogo';
import { PrintBatchModal, PrintBatchMode } from './components/PrintBatchModal';
import { DailyDataUploadModal } from './components/DailyDataUploadModal';
import { BrandingSettingsModal } from './components/BrandingSettingsModal';
import { UploadCompanyLogoModal } from './components/UploadCompanyLogoModal';
import { DeliveryScheduleReport } from './components/DeliveryScheduleReport';
import { DatabaseAuditView } from './components/DatabaseAuditView';
import { PerformanceOverviewWidget } from './components/PerformanceOverviewWidget';
import {
  Upload,
  Settings,
  Printer,
  FileCheck2,
  AlertTriangle,
  Search,
  CheckSquare,
  Square,
  Truck,
  Layers,
  Calendar,
  Database,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Image as ImageIcon,
  Camera,
  X,
  Download,
  Sun,
  Moon,
  Monitor,
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';
import { exportGatePassesPDF, exportCheckingPapersPDF } from './utils/pdfExport';
import { exportDeliveryPlanToCSV, exportIbtDataToCSV, exportCombinedLogisticsCSV } from './utils/csvExport';
import { generateSampleDatabaseRecords } from './utils/performanceAnalytics';

export type ThemeMode = 'light' | 'dark' | 'system';

export default function App() {
  // --- Theme Mode State (Light / Dark / System) ---
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('gatepass_theme') as ThemeMode | null;
    return saved || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('gatepass_theme', theme);
  }, [theme]);

  // Handle system dark mode changes dynamically
  useEffect(() => {
    if (theme !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mediaQuery.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // --- Persistent State ---
  const [deliveryPlan, setDeliveryPlan] = useState<DeliveryPlanRow[]>(() => {
    const saved = localStorage.getItem('gatepass_delivery_plan');
    if (saved) {
      try {
        const parsed: DeliveryPlanRow[] = JSON.parse(saved);
        return parsed.map(row => {
          let pStatus = row.pStatus;
          let tuNumber = row.tuNumber;
          const driverUpper = (row.driverName || '').toUpperCase();
          const pStatusUpper = (pStatus || '').toUpperCase();
          if (
            !pStatus ||
            pStatusUpper === 'ISSA' ||
            (driverUpper && pStatusUpper === driverUpper) ||
            pStatusUpper === 'CONFIRMED' ||
            pStatusUpper.includes('COMPLETE')
          ) {
            pStatus = 'COMPLETED';
          }
          const tuUpper = (tuNumber || '').toUpperCase();
          const statusUpper = (row.status || '').toUpperCase();
          if (!tuNumber || tuUpper === 'DELIVERY' || (statusUpper && tuUpper === statusUpper)) {
            tuNumber = row.vehiclePlate === '39230' ? '2000506894' : (row.vehiclePlate === '45812' ? '2000506895' : '2000506894');
          }
          return { ...row, pStatus, tuNumber };
        });
      } catch (e) {
        console.error(e);
      }
    }
    return SAMPLE_DELIVERY_PLAN;
  });

  const [ibtData, setIbtData] = useState<IBTDataRow[]>(() => {
    const saved = localStorage.getItem('gatepass_ibt_data');
    return saved ? JSON.parse(saved) : SAMPLE_IBT_DATA;
  });

  const [branding, setBranding] = useState<CompanyBranding>(() => {
    const saved = localStorage.getItem('gatepass_branding');
    return saved ? JSON.parse(saved) : DEFAULT_BRANDING;
  });

  const [databaseRecords, setDatabaseRecords] = useState<GatePassDatabaseRecord[]>(() => {
    const saved = localStorage.getItem('gatepass_db_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return generateSampleDatabaseRecords();
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('gatepass_delivery_plan', JSON.stringify(deliveryPlan));
  }, [deliveryPlan]);

  useEffect(() => {
    localStorage.setItem('gatepass_ibt_data', JSON.stringify(ibtData));
  }, [ibtData]);

  useEffect(() => {
    localStorage.setItem('gatepass_branding', JSON.stringify(branding));
  }, [branding]);

  useEffect(() => {
    localStorage.setItem('gatepass_db_records', JSON.stringify(databaseRecords));
  }, [databaseRecords]);

  // --- UI Navigation State ---
  type TabKey = 'gatepasses' | 'checking-papers' | 'schedule' | 'database' | 'raw-data';
  const [activeTab, setActiveTab] = useState<TabKey>('gatepasses');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [checkingSearchQuery, setCheckingSearchQuery] = useState('');

  // Selected Vehicles for Batch Operations
  const [selectedPlates, setSelectedPlates] = useState<Set<string>>(new Set());

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isBrandingOpen, setIsBrandingOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isCsvMenuOpen, setIsCsvMenuOpen] = useState(false);

  // Print Batch Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printMode, setPrintMode] = useState<PrintBatchMode>('gatepasses');
  const [activeGatePasses, setActiveGatePasses] = useState<VehicleGatePassData[]>([]);
  const [activeCheckingPapers, setActiveCheckingPapers] = useState<StoreCheckingPaper[]>([]);

  // Duplicate Warning Modal
  const [duplicateWarningTarget, setDuplicateWarningTarget] = useState<VehicleSummaryInfo | null>(null);

  // Expanded Vehicle Accordion in table
  const [expandedPlate, setExpandedPlate] = useState<string | null>('39230');

  // Summary vehicles list
  const vehiclesList = useMemo(() => {
    return getUniqueVehicles(deliveryPlan, ibtData, databaseRecords);
  }, [deliveryPlan, ibtData, databaseRecords]);

  // Pre-calculate manifests and associated store names for each vehicle in Checking Papers tab
  const checkingVehiclesWithManifests = useMemo(() => {
    return vehiclesList.map(v => {
      const manifests = buildCheckingPapersForVehicle(v.plateNumber, deliveryPlan);
      const storeNames = manifests.map(m => m.storeName);
      return {
        ...v,
        manifests,
        storeNames
      };
    });
  }, [vehiclesList, deliveryPlan]);

  // Filtered checking papers list by plate number or store name (or driver/tu)
  const filteredCheckingVehicles = useMemo(() => {
    const query = checkingSearchQuery.toLowerCase().trim();
    if (!query) return checkingVehiclesWithManifests;

    return checkingVehiclesWithManifests.filter(v => {
      const plateMatch =
        v.plateNumber.toLowerCase().includes(query) ||
        v.cleanPlate.toLowerCase().includes(query);
      const storeMatch = v.storeNames.some(name => name.toLowerCase().includes(query));
      const driverMatch = v.driverName.toLowerCase().includes(query);
      const tuMatch = v.tuNumber.toLowerCase().includes(query);
      return plateMatch || storeMatch || driverMatch || tuMatch;
    });
  }, [checkingVehiclesWithManifests, checkingSearchQuery]);

  const totalCheckingManifestsCount = useMemo(() => {
    return checkingVehiclesWithManifests.reduce((sum, v) => sum + v.manifests.length, 0);
  }, [checkingVehiclesWithManifests]);

  const filteredCheckingManifestsCount = useMemo(() => {
    return filteredCheckingVehicles.reduce((sum, v) => sum + v.manifests.length, 0);
  }, [filteredCheckingVehicles]);

  // Top destination stores for quick filtering suggestion chips in Checking Papers
  const popularStoreNames = useMemo(() => {
    const counts = new Map<string, number>();
    checkingVehiclesWithManifests.forEach(v => {
      v.storeNames.forEach(name => {
        const cleanName = name.replace(/\s*\(.*?\)\s*/g, '').trim();
        if (cleanName) {
          counts.set(cleanName, (counts.get(cleanName) || 0) + 1);
        }
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
  }, [checkingVehiclesWithManifests]);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return vehiclesList;
    return vehiclesList.filter(
      v =>
        v.plateNumber.toLowerCase().includes(query) ||
        v.driverName.toLowerCase().includes(query) ||
        v.tuNumber.toLowerCase().includes(query)
    );
  }, [vehiclesList, searchQuery]);

  // Checkbox helpers
  const handleToggleSelectPlate = (plate: string) => {
    setSelectedPlates(prev => {
      const next = new Set(prev);
      if (next.has(plate)) {
        next.delete(plate);
      } else {
        next.add(plate);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedPlates.size === filteredVehicles.length) {
      setSelectedPlates(new Set());
    } else {
      setSelectedPlates(new Set(filteredVehicles.map(v => v.plateNumber)));
    }
  };

  // Helper to log gate pass to database
  const recordGatePassInDatabase = (gp: VehicleGatePassData) => {
    const newRecords: GatePassDatabaseRecord[] = gp.stores.map((s, idx) => ({
      id: `db-${Date.now()}-${idx}`,
      gatePassNumber: gp.gatePassNumber,
      dateTime: gp.timestamp,
      tuNumber: gp.tuNumber,
      vehiclePlate: gp.vehiclePlate,
      driverName: gp.driverName,
      driverMobile: gp.driverMobile,
      driverEcode: gp.driverEcode,
      storeName: s.storeName,
      cartons: s.cartons,
      quantity: s.quantity,
      totalStoresCount: gp.stores.length,
      totalCartons: gp.totalCartons,
      totalQuantity: gp.totalQuantity
    }));

    setDatabaseRecords(prev => [...newRecords, ...prev]);

    // Advance sequence number in branding
    setBranding(prev => ({
      ...prev,
      nextSequenceNumber: prev.nextSequenceNumber + 1
    }));
  };

  // --- Actions ---

  // 1. Single Gate Pass Click
  const handleGenerateSingleGatePass = (vehicle: VehicleSummaryInfo, forceIgnoreDuplicate = false) => {
    if (vehicle.hasAlreadyPrinted && !forceIgnoreDuplicate) {
      // Trigger duplicate warning matching VBA prompt
      setDuplicateWarningTarget(vehicle);
      return;
    }

    const passNumber = `${branding.gatePassPrefix}${branding.nextSequenceNumber.toString().padStart(4, '0')}`;
    const gpData = buildVehicleGatePassData(
      vehicle.plateNumber,
      deliveryPlan,
      ibtData,
      passNumber,
      branding,
      databaseRecords
    );

    if (!gpData) return;

    recordGatePassInDatabase(gpData);
    setActiveGatePasses([gpData]);
    setPrintMode('single-gatepass');
    setIsPrintModalOpen(true);
  };

  // 2. Batch Print Selected Gate Passes (User requirement: "printing gatepasses at once , printing multiple gatepasses as a single batch")
  const handleBatchPrintGatePasses = () => {
    const targetPlates = selectedPlates.size > 0
      ? Array.from(selectedPlates)
      : filteredVehicles.map(v => v.plateNumber);

    if (targetPlates.length === 0) return;

    let seqCounter = branding.nextSequenceNumber;
    const batchGps: VehicleGatePassData[] = [];

    targetPlates.forEach(plate => {
      const passNumber = `${branding.gatePassPrefix}${seqCounter.toString().padStart(4, '0')}`;
      const gp = buildVehicleGatePassData(
        plate,
        deliveryPlan,
        ibtData,
        passNumber,
        branding,
        databaseRecords
      );

      if (gp) {
        batchGps.push(gp);
        recordGatePassInDatabase(gp);
        seqCounter += 1;
      }
    });

    if (batchGps.length > 0) {
      setActiveGatePasses(batchGps);
      setPrintMode('gatepasses');
      setIsPrintModalOpen(true);
    }
  };

  // 3. Single Vehicle Checking Papers
  const handlePrintCheckingPaperForVehicle = (plate: string) => {
    const manifests = buildCheckingPapersForVehicle(plate, deliveryPlan);
    if (manifests.length === 0) return;

    setActiveCheckingPapers(manifests);
    setPrintMode('checking-papers');
    setIsPrintModalOpen(true);
  };

  // 4. Batch Checking Papers (User requirement: "priting checking papers multiple store location from the same batch simultaneously.")
  const handleBatchPrintCheckingPapers = (onlyFiltered = false) => {
    let allManifests: StoreCheckingPaper[] = [];

    if (onlyFiltered) {
      filteredCheckingVehicles.forEach(v => {
        allManifests = allManifests.concat(v.manifests);
      });
    } else {
      const targetPlates = selectedPlates.size > 0
        ? Array.from(selectedPlates)
        : (activeTab === 'checking-papers' && checkingSearchQuery.trim()
            ? filteredCheckingVehicles.map(v => v.plateNumber)
            : vehiclesList.map(v => v.plateNumber));

      if (targetPlates.length === 0) return;

      targetPlates.forEach(plate => {
        const manifests = buildCheckingPapersForVehicle(plate, deliveryPlan);
        allManifests = allManifests.concat(manifests);
      });
    }

    if (allManifests.length > 0) {
      setActiveCheckingPapers(allManifests);
      setPrintMode('checking-papers');
      setIsPrintModalOpen(true);
    }
  };

  // Direct PDF Export Handlers
  const handleSaveSingleGatePassPdf = (vehicle: VehicleSummaryInfo) => {
    const nextSeq = branding.nextSequenceNumber;
    const passNumber = `${branding.gatePassPrefix}${nextSeq.toString().padStart(4, '0')}`;
    const gpData = buildVehicleGatePassData(
      vehicle.plateNumber,
      deliveryPlan,
      ibtData,
      passNumber,
      branding,
      databaseRecords
    );

    if (!gpData) return;

    recordGatePassInDatabase(gpData);
    exportGatePassesPDF([gpData], branding, 'ALL');
  };

  const handleBatchSaveGatePassesPdf = () => {
    const targetPlates = selectedPlates.size > 0
      ? Array.from(selectedPlates)
      : filteredVehicles.map(v => v.plateNumber);

    if (targetPlates.length === 0) return;

    let seqCounter = branding.nextSequenceNumber;
    const batchGps: VehicleGatePassData[] = [];

    targetPlates.forEach(plate => {
      const passNumber = `${branding.gatePassPrefix}${seqCounter.toString().padStart(4, '0')}`;
      const gp = buildVehicleGatePassData(
        plate,
        deliveryPlan,
        ibtData,
        passNumber,
        branding,
        databaseRecords
      );

      if (gp) {
        batchGps.push(gp);
        recordGatePassInDatabase(gp);
        seqCounter += 1;
      }
    });

    if (batchGps.length > 0) {
      exportGatePassesPDF(batchGps, branding, 'ALL');
    }
  };

  const handleSaveCheckingPaperForVehiclePdf = (plate: string) => {
    const manifests = buildCheckingPapersForVehicle(plate, deliveryPlan);
    if (manifests.length === 0) return;
    exportCheckingPapersPDF(manifests, branding);
  };

  const handleBatchSaveCheckingPapersPdf = (onlyFiltered = false) => {
    let allManifests: StoreCheckingPaper[] = [];

    if (onlyFiltered) {
      filteredCheckingVehicles.forEach(v => {
        allManifests = allManifests.concat(v.manifests);
      });
    } else {
      const targetPlates = selectedPlates.size > 0
        ? Array.from(selectedPlates)
        : (activeTab === 'checking-papers' && checkingSearchQuery.trim()
            ? filteredCheckingVehicles.map(v => v.plateNumber)
            : vehiclesList.map(v => v.plateNumber));

      if (targetPlates.length === 0) return;

      targetPlates.forEach(plate => {
        const manifests = buildCheckingPapersForVehicle(plate, deliveryPlan);
        allManifests = allManifests.concat(manifests);
      });
    }

    if (allManifests.length > 0) {
      exportCheckingPapersPDF(allManifests, branding);
    }
  };

  // Data upload handler
  const handleDataLoaded = (result: ParseResult, mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      setDeliveryPlan(result.deliveryPlan);
      setIbtData(result.ibtData);
    } else {
      setDeliveryPlan(prev => [...prev, ...result.deliveryPlan]);
      setIbtData(prev => [...prev, ...result.ibtData]);
    }
    setSelectedPlates(new Set());
  };

  // Reset to original sample
  const handleResetSample = () => {
    setDeliveryPlan(SAMPLE_DELIVERY_PLAN);
    setIbtData(SAMPLE_IBT_DATA);
    setBranding(DEFAULT_BRANDING);
    setDatabaseRecords(generateSampleDatabaseRecords());
    setSelectedPlates(new Set());
  };

  // Clear Database audit records
  const handleClearDatabase = () => {
    setDatabaseRecords([]);
  };

  // Stats calculation
  const totalCartonsSum = useMemo(() => {
    return vehiclesList.reduce((acc, v) => acc + v.totalCartons, 0);
  }, [vehiclesList]);

  const totalQuantitySum = useMemo(() => {
    return vehiclesList.reduce((acc, v) => acc + v.totalQuantity, 0);
  }, [vehiclesList]);

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col antialiased selection:bg-blue-100 selection:text-blue-900 transition-colors">
      {/* Top Bar Contract (3 Zones) */}
      <header className="no-print bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-6 py-3 shadow-2xs transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Zone 1: Brand Logo & Title with Clickable Logo Uploader */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLogoModalOpen(true)}
              className="group relative flex items-center p-1 -m-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Click to upload clear company logo"
            >
              <BrandLogo branding={branding} size="sm" showSubtitle={false} />
              <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-0.5 rounded-full shadow-xs opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-2.5 h-2.5" />
              </span>
            </button>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              GatePass Pro
            </span>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs shadow-2xs">
            <button
              onClick={() => setActiveTab('gatepasses')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'gatepasses'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Gate Passes
            </button>
            <button
              onClick={() => setActiveTab('checking-papers')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'checking-papers'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Checking Papers
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'schedule'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Schedule Summary
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'database'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Audit Database</span>
              {databaseRecords.length > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full">
                  {databaseRecords.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('raw-data')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'raw-data'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Data Sheets
            </button>
          </nav>

          {/* Zone 3: Primary Actions & Theme Switcher */}
          <div className="flex items-center gap-2">
            {/* Dark Mode / Light Mode Segmented Toggle */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs shadow-2xs" title="Switch Theme (Light / Dark / System)">
              <button
                onClick={() => setTheme('light')}
                title="Light Mode"
                className={`p-1.5 rounded-md transition-colors ${
                  theme === 'light'
                    ? 'bg-white text-amber-500 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="sr-only">Light Mode</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                title="Dark Mode"
                className={`p-1.5 rounded-md transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-900 text-blue-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="sr-only">Dark Mode</span>
              </button>
              <button
                onClick={() => setTheme('system')}
                title="System Auto Theme"
                className={`p-1.5 rounded-md transition-colors ${
                  theme === 'system'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="sr-only">System Theme</span>
              </button>
            </div>

            <button
              onClick={() => setIsLogoModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap shadow-2xs"
              title="Upload clear company logo image"
            >
              <ImageIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Upload Logo</span>
            </button>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Daily Data
            </button>

            <button
              onClick={() => setIsBrandingOpen(true)}
              title="Branding & Tracking Settings"
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Banner with Facility & Summary Metrics */}
        <div className="no-print bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                  {branding.companyName} Dispatch Center
                </h1>
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-sm">
                  {branding.facilityName}
                </span>
                <button
                  onClick={() => setIsLogoModalOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-200 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 rounded-md transition-colors"
                  title="Upload or change company logo"
                >
                  <ImageIcon className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span>{branding.customLogoUrl ? 'Change Logo' : 'Upload Company Logo'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automated gate pass generation, triplicate copies, multi-store checking papers & schedule summaries.
              </p>
            </div>
          </div>

          {/* Metric Clusters */}
          <div className="flex items-center gap-6 border-l border-slate-200 dark:border-slate-800 pl-6 text-xs">
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-medium uppercase tracking-wider">
                Fleet Ready
              </span>
              <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                {vehiclesList.length} Vehicles
              </span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-medium uppercase tracking-wider">
                Total Cartons
              </span>
              <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                {totalCartonsSum} CTNS
              </span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-medium uppercase tracking-wider">
                Total Quantity
              </span>
              <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                {totalQuantitySum} QTY
              </span>
            </div>
          </div>
        </div>

        {/* TAB 1: FLEET GATE PASSES */}
        {activeTab === 'gatepasses' && (
          <div className="space-y-4">
            {/* Performance Overview Widget (Daily Audit Summary) */}
            <PerformanceOverviewWidget
              records={databaseRecords}
              branding={branding}
              onViewDatabase={() => setActiveTab('database')}
              onSelectVehicle={(plate) => setSearchQuery(plate)}
            />

            {/* Batch Controls & Search Bar */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-2xs transition-colors">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  {selectedPlates.size === filteredVehicles.length && filteredVehicles.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  )}
                  <span>
                    Select All ({filteredVehicles.length})
                  </span>
                </button>

                {selectedPlates.size > 0 && (
                  <span className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 font-medium px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                    {selectedPlates.size} vehicle(s) selected
                  </span>
                )}
              </div>

              {/* Search Box */}
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search vehicle plate, driver, TU..."
                  className="bg-transparent text-xs w-full outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Batch Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleBatchSaveGatePassesPdf}
                  disabled={filteredVehicles.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-300 dark:border-emerald-800 transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download selected or all gate passes as a PDF document"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Save PDF ({selectedPlates.size > 0 ? selectedPlates.size : 'All'})
                </button>

                <button
                  onClick={handleBatchPrintGatePasses}
                  disabled={filteredVehicles.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400 dark:text-white" />
                  Batch Print Gate Passes ({selectedPlates.size > 0 ? selectedPlates.size : 'All'})
                </button>

                <button
                  onClick={() => handleBatchPrintCheckingPapers(false)}
                  disabled={filteredVehicles.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Batch Checking Papers
                </button>
              </div>
            </div>

            {/* Vehicle Fleet Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs transition-colors">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                      <th className="w-10 py-3 px-3 text-center">
                        <span className="sr-only">Select</span>
                      </th>
                      <th className="py-3 px-3">Vehicle Plate</th>
                      <th className="py-3 px-3">Driver Name & Mobile</th>
                      <th className="py-3 px-3">TU Number</th>
                      <th className="py-3 px-3 text-center">Stores / Drops</th>
                      <th className="py-3 px-3 text-right">Total CTNS</th>
                      <th className="py-3 px-3 text-right">Total QTY</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredVehicles.map((vehicle) => {
                      const isSelected = selectedPlates.has(vehicle.plateNumber);
                      const isExpanded = expandedPlate === vehicle.plateNumber;

                      return (
                        <React.Fragment key={vehicle.cleanPlate}>
                          <tr
                            className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                              isSelected ? 'bg-blue-50/40 dark:bg-blue-950/30' : ''
                            }`}
                          >
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => handleToggleSelectPlate(vehicle.plateNumber)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            </td>

                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                                  {vehicle.plateNumber}
                                </span>
                                {vehicle.ibtRowsCount > 0 && (
                                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded">
                                    + {vehicle.ibtRowsCount} IBT
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="font-medium text-slate-800 dark:text-slate-200">
                                {vehicle.driverName || 'N/A'}
                              </div>
                              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                {vehicle.driverMobile || 'No contact'}
                              </div>
                            </td>

                            <td className="py-3 px-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                              {vehicle.tuNumber || 'N/A'}
                            </td>

                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() =>
                                  setExpandedPlate(isExpanded ? null : vehicle.plateNumber)
                                }
                                className="inline-flex items-center gap-1 font-mono font-semibold text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-200 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-2 py-0.5 rounded-md transition-colors"
                              >
                                <span>{vehicle.storesCount} Stores</span>
                                {vehicle.storesCount > 12 && (
                                  <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-1 rounded" title="Entries exceed 12; gate pass paper dynamically flexes to show all rows">
                                    Flexible
                                  </span>
                                )}
                                <ChevronRight
                                  className={`w-3 h-3 transition-transform ${
                                    isExpanded ? 'rotate-90' : ''
                                  }`}
                                />
                              </button>
                            </td>

                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                              {vehicle.totalCartons}
                            </td>

                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                              {vehicle.totalQuantity}
                            </td>

                            <td className="py-3 px-3 text-center">
                              {vehicle.hasAlreadyPrinted ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  Printed
                                </span>
                              ) : (
                                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">
                                  Ready
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleSaveSingleGatePassPdf(vehicle)}
                                  title="Save Gate Pass as PDF directly"
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-md transition-colors"
                                >
                                  <Download className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  <span>PDF</span>
                                </button>

                                <button
                                  onClick={() => handleGenerateSingleGatePass(vehicle)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-md shadow-2xs transition-colors"
                                >
                                  <Printer className="w-3 h-3 text-amber-400 dark:text-white" />
                                  Gate Pass
                                </button>

                                <button
                                  onClick={() =>
                                    handlePrintCheckingPaperForVehicle(vehicle.plateNumber)
                                  }
                                  title="Print Checking Manifests for this Vehicle"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-md transition-colors"
                                >
                                  <FileCheck2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                  Checking Paper
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Stores Preview Drawer */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                              <td colSpan={9} className="p-4 pl-12">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 max-w-4xl shadow-2xs">
                                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2 flex-wrap gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                                        Destination Store Breakdown for Vehicle {vehicle.plateNumber}
                                      </span>
                                      {vehicle.storesCount > 12 && (
                                        <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
                                          Flexible Gate Pass Paper: {vehicle.storesCount} Rows (Automatically expands beyond 12 SI NO)
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                      Driver: {vehicle.driverName} · E-Code: {vehicle.driverEcode}
                                    </span>
                                  </div>

                                  {/* List of aggregated stores */}
                                  <div className="space-y-1">
                                    {buildVehicleGatePassData(
                                      vehicle.plateNumber,
                                      deliveryPlan,
                                      ibtData,
                                      'PREVIEW',
                                      branding,
                                      databaseRecords
                                    )?.stores.map((st, sIdx) => (
                                      <div
                                        key={sIdx}
                                        className="flex items-center justify-between text-xs py-1 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/70 rounded transition-colors"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="w-5 font-mono text-slate-400 dark:text-slate-500 text-[11px]">
                                            {sIdx + 1}.
                                          </span>
                                          <span className="font-medium text-slate-800 dark:text-slate-200">
                                            {st.storeName}
                                          </span>
                                          {st.isIBT && (
                                            <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1 rounded font-bold">
                                              IBT
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-4 font-mono text-slate-700 dark:text-slate-300">
                                          <span>{st.cartons} CTNS</span>
                                          <span>{st.quantity} QTY</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CHECKING PAPERS (BATCH MANIFEST) */}
        {activeTab === 'checking-papers' && (
          <div className="space-y-4">
            {/* Header Banner with Primary Print Action */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-2xs transition-colors">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Store Checking Papers & Vehicle Manifests</span>
                  <span className="text-xs font-mono font-normal text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                    {totalCheckingManifestsCount} total manifests
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Detailed inspection manifests grouped by store destination. Automatically tallies QTY, DP, DNP, CTNS, and provides official inspection sign-off grids.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleBatchSaveCheckingPapersPdf(false)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-lg shadow-2xs transition-colors"
                  title="Download all store location manifests as a PDF document"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Save All Manifests PDF
                </button>

                <button
                  onClick={() => handleBatchPrintCheckingPapers(false)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg shadow-2xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Checking Papers Across All Stores
                </button>
              </div>
            </div>

            {/* Quick Search & Filter Toolbar */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Quick Search Input */}
                <div className="flex-1 min-w-[280px] max-w-lg relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={checkingSearchQuery}
                    onChange={(e) => setCheckingSearchQuery(e.target.value)}
                    placeholder="Quick search by plate number (e.g. 39230) or store name (e.g. Al Quoz)..."
                    className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium"
                  />
                  {checkingSearchQuery && (
                    <button
                      onClick={() => setCheckingSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      title="Clear Quick Search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Filter Result Counter & Filtered Print Button */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <span>
                      Showing <strong className="font-mono text-slate-800 dark:text-slate-200">{filteredCheckingVehicles.length}</strong> of <span className="font-mono">{checkingVehiclesWithManifests.length}</span> vehicles
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span>
                      <strong className="font-mono text-slate-800 dark:text-slate-200">{filteredCheckingManifestsCount}</strong> manifest{filteredCheckingManifestsCount === 1 ? '' : 's'}
                    </span>
                  </div>

                  {checkingSearchQuery && filteredCheckingVehicles.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleBatchSaveCheckingPapersPdf(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-lg shadow-2xs transition-colors"
                        title="Download only manifests matching your quick search filter as PDF"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Save Filtered PDF ({filteredCheckingVehicles.length} veh)</span>
                      </button>

                      <button
                        onClick={() => handleBatchPrintCheckingPapers(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-lg shadow-2xs transition-colors"
                        title="Print only manifests matching your quick search filter"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Print Filtered ({filteredCheckingVehicles.length} veh)</span>
                      </button>
                    </div>
                  )}

                  {checkingSearchQuery && (
                    <button
                      onClick={() => setCheckingSearchQuery('')}
                      className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Store Suggestion Chips for Instant 1-Click Filtering */}
              {popularStoreNames.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-slate-400 dark:text-slate-500 font-medium mr-1">Quick store filters:</span>
                  {popularStoreNames.map(storeName => {
                    const isSelected = checkingSearchQuery.toLowerCase() === storeName.toLowerCase();
                    return (
                      <button
                        key={storeName}
                        onClick={() => {
                          if (isSelected) {
                            setCheckingSearchQuery('');
                          } else {
                            setCheckingSearchQuery(storeName);
                          }
                        }}
                        className={`px-2 py-0.5 rounded-full border text-[11px] transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-2xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        {storeName}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* List by Vehicle or Empty Search State */}
            {filteredCheckingVehicles.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center space-y-3 transition-colors">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Vehicle Manifests Found</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    No manifests matched your search <span className="font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">"{checkingSearchQuery}"</span>. Try searching with a different vehicle plate number, driver name, or destination store.
                  </p>
                </div>
                <button
                  onClick={() => setCheckingSearchQuery('')}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Quick Search</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCheckingVehicles.map(v => {
                  const query = checkingSearchQuery.toLowerCase().trim();
                  const isPlateMatch = query && (v.plateNumber.toLowerCase().includes(query) || v.cleanPlate.toLowerCase().includes(query));
                  const manifests = v.manifests;

                  return (
                    <div
                      key={v.cleanPlate}
                      className={`bg-white dark:bg-slate-900 rounded-xl border p-4 shadow-2xs flex flex-col justify-between space-y-3 transition-all ${
                        isPlateMatch
                          ? 'border-blue-300 dark:border-blue-700 ring-1 ring-blue-200 dark:ring-blue-800'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                              {v.plateNumber}
                            </span>
                            {isPlateMatch && (
                              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-1.5 py-0.2 rounded">
                                Matched Plate
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">
                            {manifests.length} Location Manifest(s)
                          </span>
                        </div>

                        <div className="mt-2 text-xs space-y-1 text-slate-600 dark:text-slate-300">
                          <p>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">Driver:</span> {v.driverName}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">TU:</span> {v.tuNumber}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">Volume:</span>{' '}
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {v.totalCartons} CTNS
                            </span>{' '}
                            · <span className="font-mono text-slate-700 dark:text-slate-300">{v.totalQuantity} QTY</span>
                          </p>
                        </div>

                        {/* Store tags with search match highlighting */}
                        <div className="mt-3 flex flex-wrap gap-1">
                          {manifests.slice(0, 4).map((m, idx) => {
                            const isStoreMatch = query && m.storeName.toLowerCase().includes(query);
                            return (
                              <span
                                key={idx}
                                className={`text-[10px] px-1.5 py-0.5 rounded truncate max-w-[200px] transition-colors ${
                                  isStoreMatch
                                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-bold shadow-2xs'
                                    : 'text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                                }`}
                                title={m.storeName}
                              >
                                {m.storeName}
                              </span>
                            );
                          })}
                          {manifests.length > 4 && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 py-0.5">
                              +{manifests.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handlePrintCheckingPaperForVehicle(v.plateNumber)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>View & Print ({manifests.length})</span>
                        </button>
                        <button
                          onClick={() => handleSaveCheckingPaperForVehiclePdf(v.plateNumber)}
                          title="Save Checking Paper Manifests as PDF"
                          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-lg transition-colors shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Save PDF</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SCHEDULE SUMMARY */}
        {activeTab === 'schedule' && (
          <DeliveryScheduleReport
            deliveryPlan={deliveryPlan}
            ibtData={ibtData}
            branding={branding}
            databaseRecords={databaseRecords}
            onPrintPreview={() => {
              window.print();
            }}
          />
        )}

        {/* TAB 4: AUDIT DATABASE & DUPLICATE REGISTRY */}
        {activeTab === 'database' && (
          <DatabaseAuditView
            records={databaseRecords}
            onClearRecords={handleClearDatabase}
            onSelectVehicle={(plate) => {
              setActiveTab('gatepasses');
              setSearchQuery(plate);
            }}
          />
        )}

        {/* TAB 5: RAW DATA SHEETS VIEWER */}
        {activeTab === 'raw-data' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-2xs transition-colors">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Active Spreadsheet Datasets
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {deliveryPlan.length} rows loaded from FINAL DELIVERY PLAN and {ibtData.length} rows from IBT DATA.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetSample}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Restore Default Sample
                </button>

                {/* Export to CSV Dropdown Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsCsvMenuOpen(prev => !prev)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-300 dark:border-emerald-800 transition-colors shadow-2xs"
                    title="Export datasets to CSV for Excel analysis"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Export to CSV</span>
                    <ChevronDown className={`w-3 h-3 text-emerald-600 dark:text-emerald-400 transition-transform ${isCsvMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isCsvMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setIsCsvMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl z-30 py-1 divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95">
                        <div className="px-3 py-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Download Datasets (Excel CSV)
                          </span>
                        </div>
                        <div className="py-1">
                          <button
                            onClick={() => {
                              exportDeliveryPlanToCSV(deliveryPlan);
                              setIsCsvMenuOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span className="font-medium">Final Delivery Plan</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {deliveryPlan.length} rows
                            </span>
                          </button>

                          <button
                            onClick={() => {
                              exportIbtDataToCSV(ibtData);
                              setIsCsvMenuOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span className="font-medium">IBT Transfers Data</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {ibtData.length} rows
                            </span>
                          </button>
                        </div>
                        <div className="py-1">
                          <button
                            onClick={() => {
                              exportCombinedLogisticsCSV(deliveryPlan, ibtData);
                              setIsCsvMenuOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center justify-between gap-2 font-semibold transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Consolidated Report (All)</span>
                            </div>
                            <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                              {deliveryPlan.length + ibtData.length} total
                            </span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload New Daily File
                </button>
              </div>
            </div>

            {/* Delivery Plan Rows Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs transition-colors">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    FINAL DELIVERY PLAN ({deliveryPlan.length} Rows)
                  </span>
                  <button
                    onClick={() => exportDeliveryPlanToCSV(deliveryPlan)}
                    title="Export Delivery Plan to CSV for Excel"
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-md transition-colors shadow-2xs"
                  >
                    <Download className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Export CSV</span>
                  </button>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Filters: Status Like "DELIVER*" & TU Number != ""
                </span>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">TU Number</th>
                      <th className="py-2 px-3">Vehicle</th>
                      <th className="py-2 px-3">Driver</th>
                      <th className="py-2 px-3">Mobile</th>
                      <th className="py-2 px-3">Ship-To</th>
                      <th className="py-2 px-3">Store Description</th>
                      <th className="py-2 px-3 text-right">Cartons</th>
                      <th className="py-2 px-3 text-right">P. QTY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {deliveryPlan.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-1.5 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {r.status}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 font-mono text-slate-700 dark:text-slate-300">{r.tuNumber}</td>
                        <td className="py-1.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          {r.vehiclePlate}
                        </td>
                        <td className="py-1.5 px-3 font-medium text-slate-800 dark:text-slate-200">{r.driverName}</td>
                        <td className="py-1.5 px-3 font-mono text-slate-500 dark:text-slate-400">{r.driverMobile}</td>
                        <td className="py-1.5 px-3 font-mono text-slate-700 dark:text-slate-300">{r.shipToCode}</td>
                        <td className="py-1.5 px-3 truncate max-w-[220px] text-slate-800 dark:text-slate-200">{r.storeName}</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">{r.cartons}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">{r.packedQty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* IBT Data Rows Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs transition-colors">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    IBT DATA ({ibtData.length} Rows)
                  </span>
                  <button
                    onClick={() => exportIbtDataToCSV(ibtData)}
                    title="Export IBT Data to CSV for Excel"
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-md transition-colors shadow-2xs"
                  >
                    <Download className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Export CSV</span>
                  </button>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Inter-Branch Transfers tagged as "( IBT)"
                </span>
              </div>
              <div className="overflow-x-auto max-h-60">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Vehicle Plate</th>
                      <th className="py-2 px-3">Driver</th>
                      <th className="py-2 px-3">Store Name</th>
                      <th className="py-2 px-3">Ship-To</th>
                      <th className="py-2 px-3 text-right">CTNS</th>
                      <th className="py-2 px-3 text-right">QTY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {ibtData.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-1.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          {r.vehiclePlate}
                        </td>
                        <td className="py-1.5 px-3 font-medium text-slate-800 dark:text-slate-200">{r.driverName}</td>
                        <td className="py-1.5 px-3 text-slate-800 dark:text-slate-200">{r.storeName}</td>
                        <td className="py-1.5 px-3 font-mono text-slate-700 dark:text-slate-300">{r.shipToCode}</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">{r.cartons}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">{r.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* DUPLICATE WARNING MODAL (Faithfully reproducing VBA duplicate check prompt) */}
      {duplicateWarningTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-amber-300 dark:border-amber-600/60 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Duplicate Gate Pass Detected
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Vehicle Plate: {duplicateWarningTarget.plateNumber}
                </p>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                WARNING: A Gate Pass for Vehicle Plate '{duplicateWarningTarget.plateNumber}' was ALREADY generated and saved!
              </p>
              {duplicateWarningTarget.lastPrintedDate && (
                <p className="text-slate-600 dark:text-slate-300">
                  Last Recorded: <span className="font-mono font-semibold">{duplicateWarningTarget.lastPrintedDate}</span>
                </p>
              )}
              {duplicateWarningTarget.lastGatePassNo && (
                <p className="text-slate-600 dark:text-slate-300">
                  Reference: <span className="font-mono font-semibold">{duplicateWarningTarget.lastGatePassNo}</span>
                </p>
              )}
              <p className="pt-1 text-slate-700 dark:text-slate-300">
                Do you still want to proceed with regenerating and printing?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDuplicateWarningTarget(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
              >
                No, Cancel
              </button>
              <button
                onClick={() => {
                  const target = duplicateWarningTarget;
                  setDuplicateWarningTarget(null);
                  handleGenerateSingleGatePass(target, true);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition-colors"
              >
                Yes, Regenerate Gate Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Data Upload Modal */}
      <DailyDataUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onDataLoaded={handleDataLoaded}
        onResetSample={handleResetSample}
      />

      {/* Branding & Sequential Tracking Settings Modal */}
      <BrandingSettingsModal
        isOpen={isBrandingOpen}
        onClose={() => setIsBrandingOpen(false)}
        branding={branding}
        onSave={(newBranding) => setBranding(newBranding)}
      />

      {/* Clear Company Logo Upload Modal */}
      <UploadCompanyLogoModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        branding={branding}
        onSaveLogo={(newBranding) => setBranding(newBranding)}
      />

      {/* Batch Print Preview Modal */}
      <PrintBatchModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        mode={printMode}
        gatePasses={activeGatePasses}
        checkingPapers={activeCheckingPapers}
        branding={branding}
      />
    </div>
  );
}
