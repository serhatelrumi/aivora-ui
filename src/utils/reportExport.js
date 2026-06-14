import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  DEPT_LABEL, fmt, fmtHas995, matStr, dtFmt, transferRow, TRANSFER_HEADERS, RENK_LABEL,
} from './reportLabels';
import {
  createTurkishPdf, pdfPatronHeader, pdfSectionTitle, pdfDeptSubtitle, pdfTurkishTable,
} from './pdfTurkish';

const HAS_RATIO = 0.995;

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const pdfHeader = (doc, title, subtitle) => {
  doc.setFontSize(16);
  doc.setTextColor(180, 143, 55);
  doc.text('AIVORA', 14, 18);
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text(title, 14, 28);
  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 14, 35);
  }
  return 40;
};

const pdfTable = (doc, startY, head, body, landscape = false) => {
  autoTable(doc, {
    startY,
    head: [head],
    body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [212, 175, 55], textColor: 20 },
    margin: { left: 14, right: 14 },
    ...(landscape ? {} : {}),
  });
  return doc.lastAutoTable.finalY + 8;
};

const sheetFromAoA = (name, rows) => {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  return { name: name.slice(0, 31), ws };
};

const saveWorkbook = (sheets, filename) => {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, ws }) => XLSX.utils.book_append_sheet(wb, ws, name));
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
};

/* ─── department ─── */
const exportDepartmentPdf = (data, filename, meta) => {
  const doc = new jsPDF();
  let y = pdfHeader(doc, 'Departman Hareket Raporu', `${DEPT_LABEL[data.department] || data.department} · ${data.start_date} — ${data.end_date}`);
  const summary = [
    ['Toplam Giren', fmt(data.total_incoming_grams) + ' gr'],
    ['Toplam Çıkan', fmt(data.total_outgoing_grams) + ' gr'],
    ['Net Gram', fmt(data.net_grams) + ' gr'],
    ['Net HAS', fmtHas995(data.net_has) + ' g'],
  ];
  y = pdfTable(doc, y, ['Metrik', 'Değer'], summary);
  y = pdfTable(doc, y + 4, TRANSFER_HEADERS, (data.incoming_transfers || []).map(transferRow), true);
  doc.addPage();
  pdfTable(doc, 20, TRANSFER_HEADERS, (data.outgoing_transfers || []).map(transferRow), true);
  doc.save(`${filename}.pdf`);
};

const exportDepartmentExcel = (data, filename) => {
  saveWorkbook([
    sheetFromAoA('Ozet', [
      ['Departman', DEPT_LABEL[data.department] || data.department],
      ['Başlangıç', data.start_date],
      ['Bitiş', data.end_date],
      ['Giren gr', data.total_incoming_grams],
      ['Çıkan gr', data.total_outgoing_grams],
      ['Net gr', data.net_grams],
      ['Net HAS (995)', data.net_has != null ? data.net_has / HAS_RATIO : null],
    ]),
    sheetFromAoA('Giren', [TRANSFER_HEADERS, ...(data.incoming_transfers || []).map(transferRow)]),
    sheetFromAoA('Cikan', [TRANSFER_HEADERS, ...(data.outgoing_transfers || []).map(transferRow)]),
  ], filename);
};

/* ─── kasa ─── */
const exportKasaPdf = (data, filename, meta) => {
  const doc = new jsPDF();
  let y = pdfHeader(doc, 'Kasa Günlük Rapor', meta?.date || data.date || data.report_date);
  y = pdfTable(doc, y, ['Metrik', 'Değer'], [
    ['Giren', fmt(data.total_incoming_grams) + ' gr'],
    ['Çıkan', fmt(data.total_outgoing_grams) + ' gr'],
    ['Net', fmt(data.net_grams) + ' gr'],
    ['Net HAS', fmtHas995(data.net_has) + ' g'],
  ]);
  y = pdfTable(doc, y + 4, TRANSFER_HEADERS, (data.incoming_transfers || []).map(transferRow));
  if ((data.outgoing_transfers || []).length > 0) {
    doc.addPage();
    pdfTable(doc, 20, TRANSFER_HEADERS, data.outgoing_transfers.map(transferRow));
  }
  doc.save(`${filename}.pdf`);
};

const exportKasaExcel = (data, filename) => {
  saveWorkbook([
    sheetFromAoA('Ozet', [
      ['Tarih', data.date || data.report_date],
      ['Giren gr', data.total_incoming_grams],
      ['Çıkan gr', data.total_outgoing_grams],
      ['Net gr', data.net_grams],
      ['Net HAS', data.net_has != null ? data.net_has / HAS_RATIO : null],
    ]),
    sheetFromAoA('Giren', [TRANSFER_HEADERS, ...(data.incoming_transfers || []).map(transferRow)]),
    sheetFromAoA('Cikan', [TRANSFER_HEADERS, ...(data.outgoing_transfers || []).map(transferRow)]),
  ], filename);
};

/* ─── pending ─── */
const exportPendingPdf = (data, filename) => {
  const doc = new jsPDF('l');
  let y = pdfHeader(doc, 'Bekleyen Transferler', `Anlık · ${dtFmt(data.generated_at)}`);
  pdfTable(doc, y, [...TRANSFER_HEADERS, 'Bekleme dk'], (data.transfers || []).map(t => [
    ...transferRow(t),
    t.elapsed_minutes != null ? String(t.elapsed_minutes) : '—',
  ]));
  doc.save(`${filename}.pdf`);
};

const exportPendingExcel = (data, filename) => {
  const head = [...TRANSFER_HEADERS, 'Bekleme dk'];
  saveWorkbook([
    sheetFromAoA('Ozet', [['Üretim', dtFmt(data.generated_at)], ['Toplam', data.total_pending]]),
    sheetFromAoA('Bekleyen', [
      head,
      ...(data.transfers || []).map(t => [...transferRow(t), t.elapsed_minutes]),
    ]),
  ], filename);
};

/* ─── end_of_day ─── */
const exportEodPdf = (data, filename) => {
  const doc = new jsPDF();
  let y = pdfHeader(doc, 'Gün Sonu Raporu', data.report_date);
  const s = data.daily_summary || {};
  y = pdfTable(doc, y, ['Metrik', 'Değer'], [
    ['Onaylanan transfer', String(s.total_transfers_confirmed ?? '—')],
    ['Hareket gr', fmt(s.total_grams_moved) + ' gr'],
    ['Hareket HAS', fmtHas995(s.total_has_moved) + ' g'],
  ]);
  const balHead = ['Departman', 'Materyal', 'Ağırlık', 'HAS'];
  const balBody = (data.department_balances || []).map(b => [
    DEPT_LABEL[b.department] || b.department,
    matStr(b.material_type, b.purity, b.color),
    fmt(b.weight_grams) + ' gr',
    fmtHas995(b.has_balance) + (b.has_balance != null ? ' g' : ''),
  ]);
  y = pdfTable(doc, y + 4, balHead, balBody);
  if ((data.transfers || []).length > 0) {
    doc.addPage();
    pdfTable(doc, 20, TRANSFER_HEADERS, data.transfers.map(transferRow));
  }
  doc.save(`${filename}.pdf`);
};

const exportEodExcel = (data, filename) => {
  const s = data.daily_summary || {};
  saveWorkbook([
    sheetFromAoA('Ozet', [
      ['Tarih', data.date || data.report_date],
      ['Onaylanan', s.total_transfers_confirmed],
      ['Hareket gr', s.total_grams_moved],
      ['Hareket HAS 995', s.total_has_moved != null ? s.total_has_moved / HAS_RATIO : null],
    ]),
    sheetFromAoA('Bakiyeler', [
      ['Departman', 'Materyal', 'Ağırlık gr', 'HAS 995'],
      ...(data.department_balances || []).map(b => [
        DEPT_LABEL[b.department] || b.department,
        matStr(b.material_type, b.purity, b.color),
        b.weight_grams,
        b.has_balance != null ? b.has_balance / HAS_RATIO : null,
      ]),
    ]),
    sheetFromAoA('Transferler', [TRANSFER_HEADERS, ...(data.transfers || []).map(transferRow)]),
  ], filename);
};

/* ─── has_vardiya ─── */
const exportHasVardiyaPdf = (data, filename) => {
  const doc = new jsPDF();
  let y = pdfHeader(doc, 'HAS Vardiya Raporu', data.report_date);
  const head = ['Departman', 'HAS Borcu', 'Takoz', 'Net Fark', 'Tolerans', 'Durum'];
  const body = (data.departments || []).map(d => [
    DEPT_LABEL[d.department] || d.department,
    fmt(d.has_borcu) + ' g',
    fmt(d.takoz_karsiligi) + ' g',
    fmt(d.net_fark) + ' g',
    d.tolerance_esigi != null ? fmt(d.tolerance_esigi) + ' g' : '—',
    RENK_LABEL[d.renk] || d.renk,
  ]);
  pdfTable(doc, y, head, body);
  doc.save(`${filename}.pdf`);
};

const exportHasVardiyaExcel = (data, filename) => {
  saveWorkbook([
    sheetFromAoA('HasVardiya', [
      ['Departman', 'HAS Borcu', 'Takoz', 'Net Fark', 'Tolerans', 'Renk', 'Durum'],
      ...(data.departments || []).map(d => [
        DEPT_LABEL[d.department] || d.department,
        d.has_borcu,
        d.takoz_karsiligi,
        d.net_fark,
        d.tolerance_esigi,
        RENK_LABEL[d.renk] || d.renk,
        d.durum,
      ]),
    ]),
  ], filename);
};

const flowExportRow = (line) => [
  matStr(line.material_type, line.purity, line.color),
  line.incoming_grams,
  line.outgoing_grams,
  line.net_grams,
  line.net_has_internal != null ? line.net_has_internal / HAS_RATIO : null,
];

const FLOW_HEAD = ['Materyal', 'Giren', 'Çıkan', 'Net', 'HAS'];

const flowPdfRow = (line) => [
  matStr(line.material_type, line.purity, line.color),
  fmt(line.incoming_grams) + ' gr',
  fmt(line.outgoing_grams) + ' gr',
  fmt(line.net_grams) + ' gr',
  line.net_has_internal != null ? fmt(line.net_has_internal / HAS_RATIO) + ' g' : '—',
];

/* ─── master_summary ─── */
const exportMasterPdf = async (data, filename) => {
  const meta = data.meta || {};
  const doc = await createTurkishPdf('p');
  let y = pdfPatronHeader(
    doc,
    'Patron Özet',
    `${meta.report_date || ''} · ${dtFmt(meta.generated_at)}`,
  );

  const dc = meta.day_close;
  y = pdfSectionTitle(doc, y, 'Özet');
  y = pdfTurkishTable(doc, y, ['Bilgi', 'Değer'], [
    ['Onaylı transfer', String(data.transfers?.confirmed_count ?? '—')],
    ['Gün kapatıldı', dc ? 'Evet' : 'Hayır'],
    ...(dc ? [['Arşivlenen transfer', String(dc.archived_count)]] : []),
    ['Bekleyen', meta.pending_count != null ? String(meta.pending_count) : (meta.pending_note || '—')],
    ['Aktif bölüm', String(meta.active_department_count ?? '—')],
  ]);

  const kasa = data.kasa_snapshot || {};
  y = pdfSectionTitle(doc, y, 'Kasa stoku');
  const kasaRows = [
    ['Has altın (995)', fmt(kasa.has_altin_995_grams) + ' g'],
    ...(kasa.ayarli_stok || []).map(s => [
      matStr(s.material_type, s.purity, s.color),
      fmt(s.weight_grams) + ' gr',
    ]),
  ];
  y = pdfTurkishTable(doc, y, ['Kalem', 'Miktar'], kasaRows);

  const flows = (data.department_flows || []).filter(df => (df.lines || []).length > 0);
  if (flows.length) {
    y = pdfSectionTitle(doc, y, 'Bölüm hareketleri');
    flows.forEach(df => {
      y = pdfDeptSubtitle(doc, y, DEPT_LABEL[df.department] || df.department);
      y = pdfTurkishTable(
        doc,
        y,
        FLOW_HEAD,
        (df.lines || []).map(flowPdfRow),
        { gap: 5 },
      );
    });
  }

  const closures = data.vardiya_closures || [];
  if (closures.length) {
    y = pdfSectionTitle(doc, y, 'Vardiya kapanışları');
    y = pdfTurkishTable(doc, y, ['Bölüm', 'Kalan has', 'Kapanış'], closures.map(c => [
      DEPT_LABEL[c.department] || c.department,
      c.net_fark_has_internal != null ? fmt(c.net_fark_has_internal / HAS_RATIO) + ' g' : '—',
      dtFmt(c.closed_at),
    ]));
  }

  doc.save(`${filename}.pdf`);
};

const exportMasterExcel = (data, filename) => {
  const meta = data.meta || {};
  const kasa = data.kasa_snapshot || {};
  const sheets = [
    sheetFromAoA('Kapak', [
      ['Patron Özet Raporu'],
      ['Tarih', meta.report_date],
      ['Üretim', dtFmt(meta.generated_at)],
      ['Onaylı transfer', data.transfers?.confirmed_count],
      ['Gün kapatıldı', meta.day_close ? 'Evet' : 'Hayır'],
      ['Arşivlenen', meta.day_close?.archived_count],
      ['Bekleyen', meta.pending_count ?? meta.pending_note],
      ['Has altın kasa (995)', kasa.has_altin_995_grams],
      ...(meta.pending_note ? [['Not', meta.pending_note]] : []),
    ]),
    sheetFromAoA('Kasa_Ayarli', [
      ['Materyal', 'Stok gr'],
      ...(kasa.ayarli_stok || []).map(s => [
        matStr(s.material_type, s.purity, s.color),
        s.weight_grams,
      ]),
    ]),
    sheetFromAoA('Vardiya_Kapanis', [
      ['Bölüm', 'Kalan has 995', 'Kapanış'],
      ...(data.vardiya_closures || []).map(c => [
        DEPT_LABEL[c.department] || c.department,
        c.net_fark_has_internal != null ? c.net_fark_has_internal / HAS_RATIO : null,
        c.closed_at,
      ]),
    ]),
  ];

  (data.department_flows || []).forEach(df => {
    const key = `Dept_${(df.department || 'x').slice(0, 20)}`;
    sheets.push(sheetFromAoA(key, [
      ['Materyal', 'Giren gr', 'Çıkan gr', 'Net gr', 'HAS 995'],
      ...(df.lines || []).map(flowExportRow),
    ]));
  });

  saveWorkbook(sheets, filename);
};

const HANDLERS = {
  department: { pdf: exportDepartmentPdf, excel: exportDepartmentExcel },
  kasa: { pdf: exportKasaPdf, excel: exportKasaExcel },
  pending: { pdf: exportPendingPdf, excel: exportPendingExcel },
  end_of_day: { pdf: exportEodPdf, excel: exportEodExcel },
  has_vardiya: { pdf: exportHasVardiyaPdf, excel: exportHasVardiyaExcel },
  master_summary: { pdf: exportMasterPdf, excel: exportMasterExcel },
};

export const exportReport = async ({ format, reportType, data, filename, meta }) => {
  if (!data) throw new Error('Önce raporu yükleyin.');
  const h = HANDLERS[reportType];
  if (!h) throw new Error('Bilinmeyen rapor tipi.');
  if (format === 'pdf') await h.pdf(data, filename, meta);
  else if (format === 'excel') h.excel(data, filename, meta);
  else throw new Error('Format pdf veya excel olmalı.');
};
