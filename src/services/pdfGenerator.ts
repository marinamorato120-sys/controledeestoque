import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StockItem, StockMovement, WarehouseKPIs, WarehouseSettings } from '../types.js';

export interface ReportHeaderOptions {
  title: string;
  subtitle: string;
  companyName: string;
  technicalManager: string;
}

function addReportHeader(doc: jsPDF, options: ReportHeaderOptions) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SISTEMA DE GESTÃO DE ARMAZÉM - WMS', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(options.companyName.toUpperCase(), 14, 19);

  // Date on right
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');
  doc.setFontSize(8);
  doc.text(`Emitido em: ${dateStr}`, pageWidth - 14, 12, { align: 'right' });
  doc.text(`Ambiente Operacional Seguro`, pageWidth - 14, 19, { align: 'right' });

  // Report Title bar
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(options.title, 14, 38);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(options.subtitle, 14, 44);

  // Technical Manager Info Card
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(14, 48, pageWidth - 28, 12, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`Responsável Técnico: `, 18, 56);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(options.technicalManager, 53, 56);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Status: Homologado & Auditado`, pageWidth - 20, 56, { align: 'right' });

  return 66; // Y start for table
}

function addReportFooter(doc: jsPDF, technicalManager: string) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);

    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`WMS Enterprise • Controle de Armazém em Tempo Real`, 14, pageHeight - 13);
    doc.text(`Responsável Técnico: ${technicalManager}`, 14, pageHeight - 8);

    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
  }
}

// 1. Export Stock Position by Location Report
export function generateStockReportPDF(
  stock: StockItem[],
  settings: WarehouseSettings
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const startY = addReportHeader(doc, {
    title: 'RELATÓRIO DE POSIÇÃO DE ESTOQUE POR LOCALIZAÇÃO',
    subtitle: `Inventário de saldos em tempo real por Setor, Corredor, Prateleira e Lote`,
    companyName: settings.companyName,
    technicalManager: settings.technicalManager,
  });

  const totalQty = stock.reduce((sum, item) => sum + item.quantity, 0);

  const tableData = stock.map((s, idx) => [
    (idx + 1).toString(),
    s.sku,
    s.productName,
    s.locationLabel,
    s.sectorId,
    s.aisle,
    `P0${s.shelf}`,
    s.lot,
    s.expiryDate || 'N/A',
    `${s.quantity} ${s.unit}`,
    s.reservedQuantity > 0 ? `${s.reservedQuantity} ${s.unit}` : '-',
    s.status === 'available' ? 'Disponível' : s.status === 'quarantine' ? 'Quarentena' : 'Reservado',
  ]);

  autoTable(doc, {
    startY,
    head: [
      [
        '#',
        'SKU',
        'Produto',
        'Localização',
        'Setor',
        'Corredor',
        'Prat.',
        'Lote',
        'Validade',
        'Saldo Total',
        'Reservado',
        'Situação',
      ],
    ],
    body: tableData,
    foot: [['', '', 'TOTAL GERAL', '', '', '', '', '', '', `${totalQty} un/cx`, '', '']],
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    margin: { left: 14, right: 14 },
  });

  addReportFooter(doc, settings.technicalManager);
  doc.save(`WMS_Relatorio_Estoque_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// 2. Export Movements & Lot Traceability Report
export function generateMovementsReportPDF(
  movements: StockMovement[],
  settings: WarehouseSettings
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const startY = addReportHeader(doc, {
    title: 'RELATÓRIO DE MOVIMENTAÇÃO DE ESTOQUE & RASTREABILIDADE',
    subtitle: 'Histórico auditado de todas as entradas, saídas, transferências e ajustes com rastreamento de lote',
    companyName: settings.companyName,
    technicalManager: settings.technicalManager,
  });

  const typeLabels: Record<string, string> = {
    INBOUND: 'ENTRADA',
    OUTBOUND: 'SAÍDA',
    TRANSFER: 'TRANSFERÊNCIA',
    ADJUSTMENT: 'AJUSTE',
  };

  const tableData = movements.map((m) => [
    new Date(m.timestamp).toLocaleDateString('pt-BR') + ' ' + new Date(m.timestamp).toLocaleTimeString('pt-BR').slice(0, 5),
    typeLabels[m.type] || m.type,
    m.sku,
    m.productName.length > 28 ? m.productName.slice(0, 25) + '...' : m.productName,
    m.lot,
    m.quantity > 0 ? `+${m.quantity}` : `${m.quantity}`,
    m.fromLocationLabel || m.toLocationLabel || '-',
    m.documentRef || '-',
    m.operatorName,
    m.technicalManager || settings.technicalManager,
  ]);

  autoTable(doc, {
    startY,
    head: [
      [
        'Data / Hora',
        'Operação',
        'SKU',
        'Produto',
        'Lote',
        'Qtd Mov.',
        'Localização',
        'Doc. Ref',
        'Operador',
        'Resp. Técnico',
      ],
    ],
    body: tableData,
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
    margin: { left: 14, right: 14 },
  });

  addReportFooter(doc, settings.technicalManager);
  doc.save(`WMS_Relatorio_Movimentacoes_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// 3. Export Performance & KPIs Report
export function generateKPIsReportPDF(
  kpis: WarehouseKPIs,
  settings: WarehouseSettings
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const startY = addReportHeader(doc, {
    title: 'RELATÓRIO DE DESEMPENHO OPERACIONAL & BOAS PRÁTICAS',
    subtitle: 'Indicadores de Acurácia de Inventário, Tempo Médio de Picking, Capacidade e Eficiência',
    companyName: settings.companyName,
    technicalManager: settings.technicalManager,
  });

  // KPI Metrics Table
  autoTable(doc, {
    startY,
    head: [['Indicador de Desempenho (KPI)', 'Valor Medido', 'Meta / Referência', 'Status Operacional']],
    body: [
      ['Taxa de Acurácia de Inventário', `${kpis.inventoryAccuracy}%`, '≥ 98.0%', kpis.inventoryAccuracy >= 98 ? 'Excelente' : 'Atenção'],
      ['Tempo Médio de Picking / Pedido', `${kpis.avgPickingTimeMinutes} minutos`, '≤ 10.0 min', kpis.avgPickingTimeMinutes <= 10 ? 'Otimizado' : 'Gargalo'],
      ['Volume Movimentado no Período', `${kpis.totalVolumeMovedUnits} unidades (${kpis.totalVolumeMovedM3} m³)`, 'Capacidade normal', 'Operacional'],
      ['Taxa de Ocupação do Armazém', `${kpis.occupancyRate}%`, '60% - 85%', kpis.occupancyRate > 85 ? 'Crítica (>85%)' : 'Adequada'],
      ['Itens com Saldo Crítico / Ruptura', `${kpis.criticalStockCount} itens`, '0 itens', kpis.criticalStockCount > 0 ? 'Alerta de Compras' : 'Estável'],
      ['Ordens de Separação em Aberto', `${kpis.openPickingOrders} ordens`, '≤ 5 ordens', 'Fluxo normal'],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Operational Best Practices and Suggestions
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Recomendações e Boas Práticas Sugeridas:', 14, finalY);

  const sugData = kpis.suggestions.map((s, idx) => [
    (idx + 1).toString(),
    s.title,
    s.description,
    s.actionableStep,
    s.impact === 'high' ? 'Alto' : s.impact === 'medium' ? 'Médio' : 'Baixo',
  ]);

  autoTable(doc, {
    startY: finalY + 4,
    head: [['#', 'Oportunidade de Melhoria', 'Diagnóstico Operacional', 'Ação Prática Recomendada', 'Impacto']],
    body: sugData,
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [71, 85, 105], textColor: 255, fontStyle: 'bold' },
    margin: { left: 14, right: 14 },
  });

  addReportFooter(doc, settings.technicalManager);
  doc.save(`WMS_Relatorio_KPIs_BoasPraticas_${new Date().toISOString().slice(0, 10)}.pdf`);
}
