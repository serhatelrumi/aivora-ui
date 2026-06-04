import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const FONT_NAME = 'DejaVu';
const FONT_FILE = 'DejaVuSans.ttf';
const FONT_URL =
  'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf';

const FONT_BOLD = 'DejaVuBold';
const FONT_BOLD_FILE = 'DejaVuSans-Bold.ttf';
const FONT_BOLD_URL =
  'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans-Bold.ttf';

const PAGE_BOTTOM = 275;
const MARGIN = 12;

let fontsPromise = null;

const bufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
};

const fetchFontB64 = (url) =>
  fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error('PDF fontu yüklenemedi.');
      return r.arrayBuffer();
    })
    .then(bufferToBase64);

const loadFonts = () => {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      fetchFontB64(FONT_URL),
      fetchFontB64(FONT_BOLD_URL),
    ]).then(([normal, bold]) => ({ normal, bold }));
  }
  return fontsPromise;
};

const registerFonts = (doc, { normal, bold }) => {
  doc.addFileToVFS(FONT_FILE, normal);
  doc.addFileToVFS(FONT_BOLD_FILE, bold);
  doc.addFont(FONT_FILE, FONT_NAME, 'normal');
  doc.addFont(FONT_BOLD_FILE, FONT_BOLD, 'normal');
};

export const createTurkishPdf = async (orientation = 'p') => {
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  registerFonts(doc, await loadFonts());
  doc.setFont(FONT_NAME, 'normal');
  return doc;
};

export const ensureSpace = (doc, y, needed = 20) => {
  if (y + needed > PAGE_BOTTOM) {
    doc.addPage();
    doc.setFont(FONT_NAME, 'normal');
    return MARGIN + 4;
  }
  return y;
};

/** Ana bölüm başlığı (Özet, Kasa stoku, …) */
export const pdfSectionTitle = (doc, y, text) => {
  const ny = ensureSpace(doc, y, 14);
  doc.setFont(FONT_BOLD, 'normal');
  doc.setFontSize(12);
  doc.setTextColor(35, 35, 35);
  doc.text(text, MARGIN, ny);
  doc.setTextColor(0, 0, 0);
  doc.setFont(FONT_NAME, 'normal');
  return ny + 7;
};

/** Bölüm hareketleri altında departman adı */
export const pdfDeptSubtitle = (doc, y, text) => {
  const ny = ensureSpace(doc, y, 12);
  doc.setFont(FONT_BOLD, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(70, 70, 70);
  doc.text(text, MARGIN + 2, ny);
  doc.setTextColor(0, 0, 0);
  doc.setFont(FONT_NAME, 'normal');
  return ny + 5;
};

export const pdfTurkishTable = (doc, startY, head, body, opts = {}) => {
  const y = ensureSpace(doc, startY, 14);
  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    margin: { left: MARGIN, right: MARGIN },
    styles: {
      font: FONT_NAME,
      fontStyle: 'normal',
      fontSize: opts.fontSize ?? 7,
      cellPadding: opts.cellPadding ?? 1.5,
      overflow: 'linebreak',
    },
    headStyles: {
      font: FONT_BOLD,
      fontStyle: 'normal',
      fillColor: [212, 175, 55],
      textColor: 20,
      fontSize: (opts.fontSize ?? 7) + 0.5,
    },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    tableWidth: opts.tableWidth ?? 'auto',
    ...opts.tableOpts,
  });
  doc.setFont(FONT_NAME, 'normal');
  return doc.lastAutoTable.finalY + (opts.gap ?? 4);
};

export const pdfPatronHeader = (doc, title, subtitle) => {
  doc.setFont(FONT_BOLD, 'normal');
  doc.setFontSize(14);
  doc.setTextColor(180, 143, 55);
  doc.text('AIVORA', MARGIN, 14);
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text(title, MARGIN, 22);
  if (subtitle) {
    doc.setFont(FONT_NAME, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(90, 90, 90);
    doc.text(subtitle, MARGIN, 28);
  }
  doc.setTextColor(0, 0, 0);
  doc.setFont(FONT_NAME, 'normal');
  return 34;
};

export { MARGIN, FONT_NAME, FONT_BOLD };
