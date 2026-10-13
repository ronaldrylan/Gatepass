import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  CompanyBranding,
  VehicleGatePassData,
  StoreCheckingPaper,
  ScheduleSummaryRow,
  ScheduleSummaryData,
  ScheduleVehicleGroup
} from '../types/logistics';

export interface TopVehicleData {
  vehiclePlate: string;
  driverName: string;
  tuNumber: string;
  totalCartons: number;
  totalQuantity: number;
  storeCount: number;
  passCount: number;
}

export interface PerformanceSummaryMetrics {
  totalProcessedPasses: number;
  vehicleCount: number;
  totalCartons: number;
  totalQuantity: number;
  totalStoreVisits: number;
  avgCartonsPerVehicle: number;
}

/**
 * Safely adds branding logo or falls back to stylized vector brand mark
 */
const renderBrandLogo = (
  doc: jsPDF,
  branding: CompanyBranding,
  x: number,
  y: number,
  w: number,
  h: number,
  lightMode = false
): boolean => {
  if (branding.customLogoUrl && branding.customLogoUrl.startsWith('data:image')) {
    try {
      let format = 'PNG';
      if (branding.customLogoUrl.includes('image/jpeg') || branding.customLogoUrl.includes('image/jpg')) {
        format = 'JPEG';
      } else if (branding.customLogoUrl.includes('image/webp')) {
        format = 'WEBP';
      }
      doc.addImage(branding.customLogoUrl, format, x, y, w, h, undefined, 'FAST');
      return true;
    } catch {
      // Fallback to text
    }
  }

  // Fallback vector logo
  const circleX = x + 4;
  const circleY = y + h / 2;
  const radius = Math.min(w, h) / 3;

  doc.setFillColor(245, 158, 11); // amber-500
  doc.circle(circleX, circleY, radius, 'F');
  doc.setFillColor(251, 191, 36); // amber-400
  doc.circle(circleX, circleY, radius * 0.6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(lightMode ? 15 : 255, lightMode ? 23 : 255, lightMode ? 42 : 255);
  doc.text(branding.companyName || 'TRILOGI', circleX + radius + 3, y + h / 2 + 1);

  return false;
};

// -------------------------------------------------------------
// 1. FLEET OVERVIEW MANAGEMENT PDF
// -------------------------------------------------------------
export const exportFleetOverviewPDF = (
  branding: CompanyBranding,
  timeframeText: string,
  metrics: PerformanceSummaryMetrics,
  topVehicles: TopVehicleData[]
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();
  const timestampStr = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  // Header Banner / Brand Accents
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFillColor(245, 158, 11); // amber-500 accent stripe
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Company Name & Report Title
  let textStartX = 14;

  if (branding.customLogoUrl && branding.customLogoUrl.startsWith('data:image')) {
    try {
      let format = 'PNG';
      if (branding.customLogoUrl.includes('image/jpeg') || branding.customLogoUrl.includes('image/jpg')) {
        format = 'JPEG';
      } else if (branding.customLogoUrl.includes('image/webp')) {
        format = 'WEBP';
      }
      doc.addImage(branding.customLogoUrl, format, 14, 5, 20, 18, undefined, 'FAST');
      textStartX = 38;
    } catch {
      textStartX = 14;
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(branding.companyName.toUpperCase(), textStartX, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`${branding.companySubtitle || 'Global Logistics Partner'}  |  ${branding.facilityName || 'Logistics Operations'}`, textStartX, 18);
  doc.text(`Report Generated: ${timestampStr}`, textStartX, 23);

  // Right-aligned Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('FLEET DISPATCH PERFORMANCE OVERVIEW', pageWidth - 14, 13, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(251, 191, 36); // amber-400
  doc.text(`Scope: ${timeframeText}`, pageWidth - 14, 19, { align: 'right' });
  doc.setTextColor(203, 213, 225);
  doc.text('Executive Management Logistics Report', pageWidth - 14, 24, { align: 'right' });

  // Section 1: Executive KPI Summary Box
  let currentY = 37;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. EXECUTIVE DISPATCH SUMMARY', 14, currentY);

  currentY += 4;

  const cardWidth = (pageWidth - 28 - 12) / 4;
  const cardHeight = 22;

  const kpis = [
    {
      title: 'PROCESSED PASSES',
      value: `${metrics.totalProcessedPasses} Passes`,
      sub: `${metrics.vehicleCount} Unique Vehicles`
    },
    {
      title: 'TOTAL CARTONS (CTNS)',
      value: `${metrics.totalCartons.toLocaleString()} CTNS`,
      sub: `${metrics.totalQuantity.toLocaleString()} Units Total`
    },
    {
      title: 'AVG CARTONS / VEHICLE',
      value: `${metrics.avgCartonsPerVehicle.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`,
      sub: 'CTNS / Vehicle Payload'
    },
    {
      title: 'TOTAL STORE VISITS',
      value: `${metrics.totalStoreVisits} Drops`,
      sub: `${metrics.totalProcessedPasses > 0 ? (metrics.totalStoreVisits / metrics.totalProcessedPasses).toFixed(1) : '0'} Avg Drops / Route`
    }
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (cardWidth + 4);
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(kpi.title, x + 4, currentY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(kpi.value, x + 4, currentY + 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, x + 4, currentY + 18);
  });

  currentY += cardHeight + 10;

  // Section 2: Vehicle Utilization Ranking (Top-5 High-Capacity Routes)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. VEHICLE UTILIZATION  -  TOP HIGH-CAPACITY ROUTES', 14, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Ranked in descending order by total carton volume (CTNS) processed through the Gate Pass Audit System.', 14, currentY + 4.5);

  currentY += 8;

  const tableBody = topVehicles.length > 0
    ? topVehicles.map((v, index) => {
        const share = metrics.totalCartons > 0
          ? `${Math.round((v.totalCartons / metrics.totalCartons) * 100)}%`
          : '0%';
        return [
          `#${index + 1}`,
          v.vehiclePlate,
          v.tuNumber || 'N/A',
          v.driverName || 'N/A',
          `${v.storeCount} drop(s)`,
          `${v.passCount} pass(es)`,
          v.totalCartons.toLocaleString(),
          v.totalQuantity.toLocaleString(),
          share
        ];
      })
    : [['-', 'No vehicle utilization records available for this period', '-', '-', '-', '-', '0', '0', '0%']];

  autoTable(doc, {
    startY: currentY,
    head: [[
      'Rank',
      'Vehicle Plate',
      'TU Number',
      'Assigned Driver',
      'Store Drops',
      'Passes',
      'Total CTNS',
      'Total QTY',
      'Fleet Share'
    ]],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
      cellPadding: 3
    },
    styles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 3,
      valign: 'middle'
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold', cellWidth: 14 },
      1: { fontStyle: 'bold', cellWidth: 26 },
      2: { fontStyle: 'normal', cellWidth: 24 },
      3: { cellWidth: 36 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'center', cellWidth: 18 },
      6: { halign: 'right', fontStyle: 'bold', cellWidth: 22 },
      7: { halign: 'right', cellWidth: 20 },
      8: { halign: 'center', fontStyle: 'bold', cellWidth: 20 }
    }
  });

  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : currentY + 60;

  // Section 3: Operational Notes & Verification Sign-Off
  if (finalY < pageHeight - 45) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('3. OPERATIONAL AUDIT & MANAGEMENT SIGN-OFF', 14, finalY);

    const signBoxY = finalY + 4;
    const signBoxWidth = (pageWidth - 28 - 12) / 3;
    const signBoxHeight = 26;

    const signOffRoles = [
      { title: 'DISPATCH PLANNER', sub: 'Prepared & Verified By' },
      { title: 'TRANSPORT SUPERVISOR', sub: 'Route & Load Checked' },
      { title: 'LOGISTICS MANAGER', sub: 'Operational Approval' }
    ];

    signOffRoles.forEach((role, idx) => {
      const x = 14 + idx * (signBoxWidth + 6);
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(x, signBoxY, signBoxWidth, signBoxHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text(role.title, x + 4, signBoxY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(role.sub, x + 4, signBoxY + 9);

      // Signature line
      doc.setDrawColor(203, 213, 225);
      doc.line(x + 4, signBoxY + 20, x + signBoxWidth - 4, signBoxY + 20);
      doc.text('Signature & Date', x + 4, signBoxY + 24);
    });
  }

  // Footer on bottom of page
  doc.setDrawColor(226, 232, 240);
  doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`${branding.companyName} Management Logistics Suite  •  Confidential Internal Audit`, 14, pageHeight - 7);
  doc.text('Page 1 of 1', pageWidth - 14, pageHeight - 7, { align: 'right' });

  const fileDate = now.toISOString().slice(0, 10);
  doc.save(`Fleet_Performance_Overview_${fileDate}.pdf`);
};

// -------------------------------------------------------------
// 2. GATE PASS DOCUMENTS PDF EXPORT (SINGLE & BATCH TRIPLICATE)
// -------------------------------------------------------------
export const exportGatePassesPDF = (
  gatePasses: VehicleGatePassData[],
  branding: CompanyBranding,
  copyFilter: 'ALL' | 'SECURITY COPY' | 'OFFICE COPY' | 'DRIVER COPY' = 'ALL'
) => {
  if (!gatePasses || gatePasses.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const copiesToPrint: string[] = copyFilter === 'ALL'
    ? ['SECURITY COPY', 'OFFICE COPY', 'DRIVER COPY']
    : [copyFilter];

  let isFirstPage = true;

  gatePasses.forEach((gp) => {
    copiesToPrint.forEach((copyTitle) => {
      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;

      // Outer Container Box
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2;

      doc.setDrawColor(15, 23, 42); // slate-900 border
      doc.setLineWidth(0.6);
      doc.rect(margin, margin, contentWidth, contentHeight);

      // --- 1. Top Header Block ---
      const headerY = margin + 3;
      const headerHeight = 22;

      // Brand Logo / Name on Left
      renderBrandLogo(doc, branding, margin + 4, headerY + 1, 30, 15, true);

      // Centered Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text('GATE PASS', pageWidth / 2, headerY + 8, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(gp.gatePassNumber, pageWidth / 2, headerY + 14, { align: 'center' });

      // Copy Badge on Right
      const badgeWidth = 42;
      const badgeHeight = 10;
      const badgeX = margin + contentWidth - badgeWidth - 4;
      const badgeY = headerY + 4;

      doc.setFillColor(51, 65, 85); // slate-700
      doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(copyTitle, badgeX + badgeWidth / 2, badgeY + 6.5, { align: 'center' });

      // Divider below header
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.4);
      doc.line(margin, margin + headerHeight, margin + contentWidth, margin + headerHeight);

      // --- 2. Subheader Bar (TO & Timestamp) ---
      const subHeaderY = margin + headerHeight + 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`TO: ${branding.facilityName}`, margin + 4, subHeaderY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`DATE & TIME: ${gp.timestamp}`, margin + contentWidth - 4, subHeaderY, { align: 'right' });

      // Divider below subheader
      const subHeaderBottom = subHeaderY + 3;
      doc.setDrawColor(203, 213, 225);
      doc.line(margin, subHeaderBottom, margin + contentWidth, subHeaderBottom);

      // --- 3. Store Items Table (Minimum 12 rows as per VBA standard, flexible for >12 available entries) ---
      const minRows = 12;
      const rowCount = Math.max(minRows, gp.stores.length);
      const isExpanded = gp.stores.length > 12;

      // Adaptive cell padding and body font size so 13-16 rows comfortably stay on single page
      const cellPad = rowCount <= 12 ? 1.8 : rowCount <= 16 ? 1.15 : rowCount <= 22 ? 0.9 : 0.75;
      const bodyFontSize = rowCount <= 12 ? 7.5 : rowCount <= 16 ? 7.0 : rowCount <= 22 ? 6.5 : 6.0;

      const tableData = Array.from({ length: rowCount }).map((_, idx) => {
        const item = gp.stores[idx];
        return [
          `${idx + 1}`,
          item ? String(item.cartons) : '',
          item ? String(item.quantity) : '',
          item ? `${item.storeName}${item.isIBT ? ' [IBT]' : ''}` : ''
        ];
      });

      // Append Total Row
      tableData.push([
        'Total',
        String(gp.totalCartons),
        String(gp.totalQuantity),
        isExpanded
          ? `${gp.stores.length} Destinations Listed (${gp.stores.length} Entries Rendered)`
          : `${gp.stores.length} Destination(s) Listed`
      ]);

      autoTable(doc, {
        startY: subHeaderBottom + 2,
        margin: { top: margin + 12, bottom: margin + 8, left: margin + 2, right: margin + 2 },
        head: [[isExpanded ? `SI.NO (1-${rowCount})` : 'SI.NO', 'CTNS', 'QTY', 'Store / Area / Customer Name']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [71, 85, 105], // slate-600
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: rowCount <= 16 ? 1.8 : 1.4
        },
        styles: {
          fontSize: bodyFontSize,
          cellPadding: cellPad,
          textColor: [15, 23, 42],
          lineColor: [203, 213, 225],
          lineWidth: 0.2
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 18 },
          1: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
          2: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
          3: { halign: 'center', fontStyle: 'normal' }
        },
        didDrawPage: (hookData) => {
          // Ensure every page in the gate pass has the crisp outer container border
          doc.setDrawColor(15, 23, 42);
          doc.setLineWidth(0.6);
          doc.rect(margin, margin, contentWidth, contentHeight);

          if (hookData.pageNumber > 1) {
            // Draw continuation header
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text(
              `GATE PASS ${gp.gatePassNumber} • ${copyTitle} (Continuation - Page ${hookData.pageNumber})`,
              margin + 4,
              margin + 5
            );
            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.3);
            doc.line(margin, margin + 7.5, margin + contentWidth, margin + 7.5);
          }
        },
        didParseCell: (data) => {
          // Format the Total Row
          if (data.row.index === tableData.length - 1) {
            data.cell.styles.fillColor = [51, 65, 85]; // slate-700
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.halign = 'center';
            if (data.column.index === 1 || data.column.index === 2) {
              data.cell.styles.textColor = [252, 211, 77]; // amber-300
            }
          } else if (data.row.index % 2 === 1) {
            data.cell.styles.fillColor = [248, 250, 252];
          }
        }
      });

      const lastTableY = (doc as any).lastAutoTable.finalY + 3;
      const infoBoxWidth = contentWidth * 0.58;
      const infoBoxHeight = 26;
      const sigWidth = contentWidth - 4;
      const sigHeight = 17;
      const neededHeight = infoBoxHeight + sigHeight + 8;

      let infoBoxY: number;
      let sigY: number;

      // Check if driver info and signature block fit cleanly on the current page
      if (lastTableY + neededHeight <= pageHeight - margin - 2) {
        infoBoxY = lastTableY;
        sigY = Math.max(infoBoxY + infoBoxHeight + 3, pageHeight - margin - sigHeight - 2);
      } else {
        // Flexibly add a new page for multi-page gate pass verification
        doc.addPage();
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.6);
        doc.rect(margin, margin, contentWidth, contentHeight);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `GATE PASS ${gp.gatePassNumber} • ${copyTitle} (Logistics Details & Authorised Clearance)`,
          margin + 4,
          margin + 6
        );
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.line(margin, margin + 8.5, margin + contentWidth, margin + 8.5);

        infoBoxY = margin + 14;
        sigY = Math.max(infoBoxY + infoBoxHeight + 6, pageHeight - margin - sigHeight - 4);
      }

      // --- 4. Vehicle & Logistics Details Grid ---
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.3);
      doc.rect(margin + 2, infoBoxY, infoBoxWidth, infoBoxHeight);

      const infoRows = [
        { label: 'Vehicle :', val: gp.vehiclePlate, bold: true },
        { label: 'Driver :', val: gp.driverName || 'N/A', bold: false },
        { label: 'Delivery Man :', val: gp.driverMobile || 'N/A', bold: false },
        { label: 'E Code :', val: gp.driverEcode || 'N/A', bold: false },
        { label: 'Transportation Unit :', val: gp.tuNumber || 'N/A', bold: true }
      ];

      const rowH = infoBoxHeight / 5;
      infoRows.forEach((row, rIdx) => {
        const ry = infoBoxY + rIdx * rowH;
        if (rIdx > 0) {
          doc.setDrawColor(226, 232, 240);
          doc.line(margin + 2, ry, margin + 2 + infoBoxWidth, ry);
        }

        // Label Column
        doc.setFillColor(241, 245, 249);
        doc.rect(margin + 2, ry, 36, rowH, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(row.label, margin + 4, ry + rowH * 0.7);

        // Value Column (Centered)
        const valColWidth = infoBoxWidth - 36;
        doc.setFont('helvetica', row.bold ? 'bold' : 'normal');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(row.val, margin + 2 + 36 + valColWidth / 2, ry + rowH * 0.7, { align: 'center' });
      });

      // Right Origin Text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(branding.locationFooter || '(From TRILOGI - MEGA DC)', margin + contentWidth - 4, infoBoxY + 8, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Seq Ref: #${gp.gatePassNumber}`, margin + contentWidth - 4, infoBoxY + 14, { align: 'right' });
      doc.text(`Total Payload: ${gp.totalCartons} CTNS / ${gp.totalQuantity} QTY`, margin + contentWidth - 4, infoBoxY + 20, { align: 'right' });

      // --- 5. Signature Footer Strip (Official Yellow Box) ---
      doc.setFillColor(254, 252, 232); // light yellow #FEFCE8
      doc.setDrawColor(148, 163, 184);
      doc.rect(margin + 2, sigY, sigWidth, sigHeight, 'FD');

      const colWidth = sigWidth / 3;
      const sigCols = [
        { label: 'Load By', sub: 'Sign & Date' },
        { label: 'Driver Signature', sub: 'Name / Sign' },
        { label: 'Authorised By', sub: 'Security Clearance' }
      ];

      sigCols.forEach((sig, sIdx) => {
        const sx = margin + 2 + sIdx * colWidth;
        if (sIdx > 0) {
          doc.setDrawColor(203, 213, 225);
          doc.line(sx, sigY, sx, sigY + sigHeight);
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text(sig.label, sx + colWidth / 2, sigY + 5, { align: 'center' });

        // Signature dashed line
        doc.setDrawColor(148, 163, 184);
        doc.line(sx + 6, sigY + 11.5, sx + colWidth - 6, sigY + 11.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text(sig.sub, sx + colWidth / 2, sigY + 14.5, { align: 'center' });
      });
    });
  });

  // Download Output
  const dateStr = new Date().toISOString().slice(0, 10);
  if (gatePasses.length === 1) {
    const singleGp = gatePasses[0];
    const safePlate = singleGp.vehiclePlate.replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`GatePass_${safePlate}_${singleGp.gatePassNumber}.pdf`);
  } else {
    doc.save(`Batch_GatePasses_${dateStr}_(${gatePasses.length}_vehicles).pdf`);
  }
};

// -------------------------------------------------------------
// 3. CHECKING PAPERS / VEHICLE MANIFESTS PDF EXPORT
// -------------------------------------------------------------
export const exportCheckingPapersPDF = (
  manifests: StoreCheckingPaper[],
  branding: CompanyBranding
) => {
  if (!manifests || manifests.length === 0) return;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const dateStr = new Date().toISOString().slice(0, 10);

  let isFirstPage = true;

  manifests.forEach((manifest, mIdx) => {
    if (!isFirstPage) {
      doc.addPage();
    }
    isFirstPage = false;

    const margin = 10;
    const contentWidth = pageWidth - margin * 2;

    // Header Zone
    renderBrandLogo(doc, branding, margin, margin, 28, 12, true);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('VEHICLE MANIFEST & CHECKING PAPER', pageWidth / 2, margin + 6, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Destination: ${manifest.storeName} ${manifest.shipToCode ? `(${manifest.shipToCode})` : ''}`,
      pageWidth / 2,
      margin + 11,
      { align: 'center' }
    );

    // Right Plate Badge & Location index
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`Plate: ${manifest.vehiclePlate}`, pageWidth - margin, margin + 6, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Location ${mIdx + 1} of ${manifests.length}`, pageWidth - margin, margin + 11, { align: 'right' });

    // Subheader Box
    const subY = margin + 15;
    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, subY, contentWidth, 8, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);

    const subCols = [
      `Vehicle: ${manifest.vehiclePlate}`,
      `Driver: ${manifest.driverName || 'N/A'}`,
      `Mobile: ${manifest.driverMobile || 'N/A'}`,
      `TU Number: ${manifest.tuNumber || 'N/A'}`
    ];
    subCols.forEach((text, i) => {
      doc.text(text, margin + 4 + i * (contentWidth / 4), subY + 5.5);
    });

    // Manifest Table
    const tableBody = manifest.rows.map(r => [
      r.obdo,
      r.obd,
      r.shipTo,
      r.shipToDesc,
      String(r.qty),
      String(r.dp),
      String(r.dnp),
      String(r.ctns),
      r.pStatus,
      r.businessUnit,
      r.vehicle,
      r.driver,
      r.mobile,
      r.tu
    ]);

    // Totals row
    tableBody.push([
      'TOTAL',
      '',
      '',
      `${manifest.rows.length} Record(s)`,
      String(manifest.totalQty),
      String(manifest.totalDP),
      String(manifest.totalDNP),
      String(manifest.totalCTNS),
      '',
      '',
      '',
      '',
      '',
      ''
    ]);

    autoTable(doc, {
      startY: subY + 10,
      margin: { left: margin, right: margin },
      head: [[
        'OBDO',
        'OBD',
        'Ship-To',
        'Ship-To Party Description',
        'QTY',
        'DP',
        'DNP',
        'CTNS',
        'P-Status',
        'Business Unit',
        'VEHICLE',
        'DRIVER',
        'Mobile No',
        'TU'
      ]],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [71, 85, 105],
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 1.5
      },
      styles: {
        fontSize: 6.5,
        cellPadding: 1.2,
        textColor: [15, 23, 42],
        lineColor: [203, 213, 225],
        lineWidth: 0.15
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 16 },
        1: { halign: 'center', cellWidth: 16 },
        2: { halign: 'center', cellWidth: 16 },
        3: { halign: 'center', cellWidth: 50 },
        4: { halign: 'center', fontStyle: 'bold', cellWidth: 12 },
        5: { halign: 'center', cellWidth: 12 },
        6: { halign: 'center', cellWidth: 12 },
        7: { halign: 'center', fontStyle: 'bold', cellWidth: 14 },
        8: { halign: 'center', cellWidth: 16 },
        9: { halign: 'center', cellWidth: 20 },
        10: { halign: 'center', cellWidth: 22 },
        11: { halign: 'center', cellWidth: 25 },
        12: { halign: 'center', cellWidth: 20 },
        13: { halign: 'center', cellWidth: 18 }
      },
      didParseCell: (data) => {
        if (data.row.index === tableBody.length - 1) {
          data.cell.styles.fillColor = [51, 65, 85];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.halign = 'center';
        }
      }
    });

    const tableBottom = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 4 : pageHeight - 30;

    // Sign-Off Strip (6 inspection boxes)
    const sigBoxY = Math.min(tableBottom, pageHeight - 24);
    const sigLabels = [
      'Checking',
      'Driver SIGN',
      'Loading Supr SIGN',
      'Loading BAY No',
      'Planner SIGN',
      'TU'
    ];

    const sigColWidth = contentWidth / sigLabels.length;
    doc.setDrawColor(148, 163, 184);

    sigLabels.forEach((label, sIdx) => {
      const sx = margin + sIdx * sigColWidth;
      doc.setFillColor(248, 250, 252);
      doc.rect(sx, sigBoxY, sigColWidth, 14, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(label, sx + 2, sigBoxY + 4);

      doc.setDrawColor(203, 213, 225);
      doc.line(sx + 2, sigBoxY + 11, sx + sigColWidth - 2, sigBoxY + 11);
    });
  });

  if (manifests.length === 1) {
    const safePlate = manifests[0].vehiclePlate.replace(/\W+/g, '_') || 'Vehicle';
    doc.save(`CheckingPaper_${safePlate}.pdf`);
  } else {
    doc.save(`Batch_CheckingPapers_${dateStr}_(${manifests.length}_locations).pdf`);
  }
};

// -------------------------------------------------------------
// 4. DAILY DELIVERY SCHEDULE SUMMARY PDF EXPORT
// -------------------------------------------------------------
export const exportDeliverySchedulePDF = (
  scheduleData: ScheduleSummaryData,
  branding: CompanyBranding,
  dateFormatted: string
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  // Header Banner
  doc.setFillColor(198, 224, 180); // soft green #C6E0B4
  doc.rect(margin, margin, contentWidth, 12, 'F');
  doc.setDrawColor(142, 169, 219); // soft blue #8EA9DB
  doc.setLineWidth(0.5);
  doc.rect(margin, margin, contentWidth, 12, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(192, 0, 0); // deep red #C00000
  doc.text(`MORNING DELIVERY SCHEDULE  ${dateFormatted}`, pageWidth / 2, margin + 8, { align: 'center' });

  // Subheader Metrics
  const subY = margin + 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${branding.companyName}  |  ${branding.facilityName}`, margin, subY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Total Vehicles: ${scheduleData.vehicleGroups.length}   •   Total Destinations: ${scheduleData.rows.length}   •   Total Cartons: ${scheduleData.grandTotalCtn.toLocaleString()} CTNS   •   Total QTY: ${scheduleData.grandTotalQty.toLocaleString()} Units`,
    pageWidth - margin,
    subY + 4,
    { align: 'right' }
  );

  // Table Body Rows with Group Subtotals
  const tableData: (string | number)[][] = [];
  let seq = 1;

  scheduleData.vehicleGroups.forEach((group: ScheduleVehicleGroup) => {
    group.stores.forEach((store: ScheduleSummaryRow) => {
      tableData.push([
        seq++,
        store.shipTo,
        store.shipToPartyDesc,
        store.businessUnit,
        store.pQty.toLocaleString(),
        store.ctn.toLocaleString(),
        group.vehiclePlate,
        group.driverName
      ]);
    });

    // Group Subtotal Row
    tableData.push([
      '',
      '',
      `Subtotal for ${group.vehiclePlate} (${group.driverName})`,
      `${group.stores.length} Drop(s)`,
      group.subTotalQty.toLocaleString(),
      group.subTotalCtn.toLocaleString(),
      group.vehiclePlate,
      ''
    ]);
  });

  // Grand Total Row
  tableData.push([
    '',
    '',
    'GRAND TOTAL DISPATCH',
    `${scheduleData.rows.length} Destinations`,
    scheduleData.grandTotalQty.toLocaleString(),
    scheduleData.grandTotalCtn.toLocaleString(),
    `${scheduleData.vehicleGroups.length} Vehicles`,
    ''
  ]);

  autoTable(doc, {
    startY: subY + 7,
    margin: { left: margin, right: margin },
    head: [[
      'Seq',
      'Ship-To',
      'Ship-To Party Description',
      'Business U',
      'P. QTY',
      'CTN',
      'VEHICLE',
      'DRIVER'
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [198, 224, 180],
      textColor: [192, 0, 0],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 2
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.5,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.2
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 14 },
      1: { halign: 'center', cellWidth: 24 },
      2: { halign: 'center', cellWidth: 80 },
      3: { halign: 'center', cellWidth: 26 },
      4: { halign: 'center', fontStyle: 'bold', cellWidth: 24 },
      5: { halign: 'center', fontStyle: 'bold', cellWidth: 24 },
      6: { halign: 'center', fontStyle: 'bold', cellWidth: 32 },
      7: { halign: 'center', cellWidth: 50 }
    },
    didParseCell: (data) => {
      // Check if this is the Grand Total row (last row)
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fillColor = [30, 41, 59]; // slate-800
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.halign = 'center';
        if (data.column.index === 4 || data.column.index === 5) {
          data.cell.styles.textColor = [252, 211, 77]; // amber-300
        }
      } else {
        const rawRow = tableData[data.row.index];
        if (rawRow && typeof rawRow[2] === 'string' && rawRow[2].startsWith('Subtotal for')) {
          data.cell.styles.fillColor = [241, 245, 249]; // slate-100
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [15, 23, 42];
          data.cell.styles.halign = 'center';
        }
      }
    }
  });

  const safeDate = dateFormatted.replace(/\//g, '-');
  doc.save(`Morning_Delivery_Schedule_${safeDate}.pdf`);
};

