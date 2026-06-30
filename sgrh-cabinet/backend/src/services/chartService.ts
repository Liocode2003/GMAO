import sharp from 'sharp';
import ExcelJS from 'exceljs';

// ─── Palette (alignée sur reportService.ts) ──────────────────────────────────
const NAVY       = '#1B3A5C';
const NAVY_LIGHT = '#2C5282';
const GREEN      = '#276749';
const RED         = '#9B2335';
const TEXT_MUTED  = '#718096';
const GRID        = '#E2E8F0';

const FONT = "'DejaVu Sans', Arial, Helvetica, sans-serif";

export interface BarSeries {
  label: string;
  value: number;
  color?: string;
}

export interface BarGroup {
  label: string;
  series: BarSeries[]; // ex: [{label:'2026', value:42}, {label:'2025', value:38}]
}

export interface PieSlice {
  label: string;
  value: number;
  color?: string;
}

const DEFAULT_PALETTE = [NAVY, '#D4A017', GREEN, RED, NAVY_LIGHT, '#7C3AED'];

/**
 * Génère un bar chart groupé (N vs N-1, ou N catégories) en SVG.
 */
function buildGroupedBarSvg(groups: BarGroup[], opts: { width?: number; height?: number; title?: string } = {}): string {
  const width  = opts.width  ?? 480;
  const height = opts.height ?? 280;
  const padL = 44, padR = 16, padT = opts.title ? 36 : 16, padB = 48;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const allValues = groups.flatMap(g => g.series.map(s => s.value));
  const maxVal = Math.max(1, ...allValues);
  const niceMax = Math.ceil(maxVal * 1.15 / 5) * 5 || 1;

  const groupCount = groups.length;
  const seriesCount = Math.max(1, ...groups.map(g => g.series.length));
  const groupW = chartW / groupCount;
  const barGap = 6;
  const barW = Math.max(8, (groupW - barGap * (seriesCount + 1)) / seriesCount);

  const yTicks = 5;
  let gridLines = '';
  let yLabels = '';
  for (let i = 0; i <= yTicks; i++) {
    const v = (niceMax / yTicks) * i;
    const y = padT + chartH - (v / niceMax) * chartH;
    gridLines += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${width - padR}" y2="${y.toFixed(1)}" stroke="${GRID}" stroke-width="1"/>`;
    yLabels += `<text x="${padL - 8}" y="${(y + 3).toFixed(1)}" font-size="9" fill="${TEXT_MUTED}" font-family="${FONT}" text-anchor="end">${Math.round(v)}</text>`;
  }

  let bars = '';
  let xLabels = '';
  groups.forEach((g, gi) => {
    const gx = padL + gi * groupW;
    const totalBarsW = barW * g.series.length + barGap * (g.series.length - 1);
    const startX = gx + (groupW - totalBarsW) / 2;
    g.series.forEach((s, si) => {
      const h = (s.value / niceMax) * chartH;
      const x = startX + si * (barW + barGap);
      const y = padT + chartH - h;
      const color = s.color ?? DEFAULT_PALETTE[si % DEFAULT_PALETTE.length];
      bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(0, h).toFixed(1)}" fill="${color}" rx="2"/>`;
      if (s.value > 0) {
        bars += `<text x="${(x + barW / 2).toFixed(1)}" y="${(y - 4).toFixed(1)}" font-size="9" fill="${NAVY}" font-family="${FONT}" font-weight="bold" text-anchor="middle">${s.value}</text>`;
      }
    });
    xLabels += `<text x="${(gx + groupW / 2).toFixed(1)}" y="${height - padB + 16}" font-size="9.5" fill="${TEXT_MUTED}" font-family="${FONT}" text-anchor="middle">${escapeXml(g.label)}</text>`;
  });

  // légende (si plusieurs séries avec labels distincts)
  let legend = '';
  const firstGroupSeries = groups[0]?.series ?? [];
  if (firstGroupSeries.length > 1) {
    const legendY = height - 14;
    let lx = padL;
    firstGroupSeries.forEach((s, si) => {
      const color = s.color ?? DEFAULT_PALETTE[si % DEFAULT_PALETTE.length];
      legend += `<rect x="${lx}" y="${legendY - 8}" width="9" height="9" fill="${color}" rx="1.5"/>`;
      legend += `<text x="${lx + 13}" y="${legendY}" font-size="9" fill="${TEXT_MUTED}" font-family="${FONT}">${escapeXml(s.label)}</text>`;
      lx += 13 + s.label.length * 5.6 + 14;
    });
  }

  const titleSvg = opts.title
    ? `<text x="${width / 2}" y="18" font-size="11" fill="${NAVY}" font-family="${FONT}" font-weight="bold" text-anchor="middle">${escapeXml(opts.title)}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#FFFFFF"/>
  ${titleSvg}
  ${gridLines}
  ${yLabels}
  ${bars}
  ${xLabels}
  ${legend}
  <line x1="${padL}" y1="${padT + chartH}" x2="${width - padR}" y2="${padT + chartH}" stroke="${TEXT_MUTED}" stroke-width="1"/>
</svg>`;
}

/**
 * Génère un pie/donut chart en SVG.
 */
function buildPieSvg(slices: PieSlice[], opts: { width?: number; height?: number; title?: string; donut?: boolean } = {}): string {
  const width  = opts.width  ?? 380;
  const height = opts.height ?? 280;
  const cx = 130, cy = height / 2 + (opts.title ? 10 : 0);
  const r  = Math.min(cx - 20, height / 2 - 30);
  const innerR = opts.donut === false ? 0 : r * 0.55;

  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  let angle = -Math.PI / 2;

  const polar = (cxp: number, cyp: number, radius: number, a: number) => [
    cxp + radius * Math.cos(a),
    cyp + radius * Math.sin(a),
  ];

  let paths = '';
  let legend = '';
  const legendX = cx + r + 30;
  let legendY = cy - (slices.length * 18) / 2 + 6;

  slices.forEach((s, i) => {
    const frac = s.value / total;
    const sweep = frac * Math.PI * 2;
    const endAngle = angle + sweep;
    const color = s.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];

    const [x1, y1] = polar(cx, cy, r, angle);
    const [x2, y2] = polar(cx, cy, r, endAngle);
    const [ix1, iy1] = polar(cx, cy, innerR, endAngle);
    const [ix2, iy2] = polar(cx, cy, innerR, angle);
    const largeArc = sweep > Math.PI ? 1 : 0;

    if (frac > 0) {
      paths += `<path d="M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${ix1.toFixed(2)} ${iy1.toFixed(2)} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2.toFixed(2)} ${iy2.toFixed(2)} Z" fill="${color}" stroke="#FFFFFF" stroke-width="1.5"/>`;
    }

    const pct = (frac * 100).toFixed(0);
    legend += `<rect x="${legendX}" y="${(legendY - 8).toFixed(1)}" width="9" height="9" fill="${color}" rx="1.5"/>`;
    legend += `<text x="${legendX + 13}" y="${legendY.toFixed(1)}" font-size="9.5" fill="${NAVY}" font-family="${FONT}">${escapeXml(s.label)} — ${pct}%</text>`;
    legendY += 18;

    angle = endAngle;
  });

  const titleSvg = opts.title
    ? `<text x="${width / 2}" y="18" font-size="11" fill="${NAVY}" font-family="${FONT}" font-weight="bold" text-anchor="middle">${escapeXml(opts.title)}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#FFFFFF"/>
  ${titleSvg}
  ${paths}
  ${legend}
</svg>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function svgToPng(svg: string, scale = 2): Promise<Buffer> {
  return sharp(Buffer.from(svg), { density: 96 * scale }).png().toBuffer();
}

/**
 * Insère un bar chart groupé dans la feuille, ancré à partir de la cellule donnée (0-indexed col/row).
 * Retourne la largeur/hauteur en "pixels Excel" approximatifs pour positionner le contenu suivant.
 */
export async function addGroupedBarChart(
  wb: ExcelJS.Workbook,
  ws: ExcelJS.Worksheet,
  groups: BarGroup[],
  anchorCol: number,
  anchorRow: number,
  opts: { width?: number; height?: number; title?: string } = {},
): Promise<void> {
  if (groups.every(g => g.series.every(s => s.value === 0))) return; // rien à tracer
  const svg = buildGroupedBarSvg(groups, opts);
  const png = await svgToPng(svg);
  const imageId = wb.addImage({ buffer: png as unknown as ExcelJS.Buffer, extension: 'png' });
  const w = opts.width ?? 480;
  const h = opts.height ?? 280;
  ws.addImage(imageId, {
    tl: { col: anchorCol, row: anchorRow },
    ext: { width: w, height: h },
    editAs: 'oneCell',
  });
}

/**
 * Insère un pie/donut chart dans la feuille.
 */
export async function addPieChart(
  wb: ExcelJS.Workbook,
  ws: ExcelJS.Worksheet,
  slices: PieSlice[],
  anchorCol: number,
  anchorRow: number,
  opts: { width?: number; height?: number; title?: string; donut?: boolean } = {},
): Promise<void> {
  if (slices.every(s => s.value === 0)) return; // rien à tracer
  const svg = buildPieSvg(slices, opts);
  const png = await svgToPng(svg);
  const imageId = wb.addImage({ buffer: png as unknown as ExcelJS.Buffer, extension: 'png' });
  const w = opts.width ?? 380;
  const h = opts.height ?? 280;
  ws.addImage(imageId, {
    tl: { col: anchorCol, row: anchorRow },
    ext: { width: w, height: h },
    editAs: 'oneCell',
  });
}
