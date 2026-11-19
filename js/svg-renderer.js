import { $, fmtBR } from './utils.js';
import { profileR } from './physics.js';

const SVG_W = 1000;
const SVG_H = 300;
const CY = 135;
const MG = 40;
const TW = SVG_W - MG * 2;
const SC = TW / 280;
const SVGNS = 'http://www.w3.org/2000/svg';

function buildPath(pts) {
  return 'M' + pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L');
}

function setAttrs(id, attrs) {
  const el = $(id);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
}

export function drawSVG({ Dm, dm, P1r: P1, P2r: P2, Ql, V1, V2, dPr: dP }) {
  const N = 300;
  const oT = [], oB = [], iT = [], iB = [];

  for (let i = 0; i <= N; i++) {
    const mm = (i / N) * 280;
    const px = MG + mm * SC;
    const { ro, ri } = profileR(mm, Dm, dm);
    oT.push({ x: px, y: CY - ro * SC });
    oB.push({ x: px, y: CY + ro * SC });
    iT.push({ x: px, y: CY - ri * SC });
    iB.push({ x: px, y: CY + ri * SC });
  }

  setAttrs('wallTop', { d: buildPath(oT) + 'L' + buildPath(iT.slice().reverse()).slice(1) + 'Z' });
  setAttrs('wallBot', { d: buildPath(oB) + 'L' + buildPath(iB.slice().reverse()).slice(1) + 'Z' });

  const waterD = buildPath(iT) + 'L' + buildPath(iB.slice().reverse()).slice(1) + 'Z';
  setAttrs('waterFill', { d: waterD });
  setAttrs('pressFill', { d: waterD });

  setAttrs('outerTop', { d: buildPath(oT) });
  setAttrs('outerBot', { d: buildPath(oB) });
  setAttrs('innerTop', { d: buildPath(iT) });
  setAttrs('innerBot', { d: buildPath(iB) });

  setAttrs('capTL', { x1: oT[0].x, y1: oT[0].y, x2: iT[0].x, y2: iT[0].y });
  setAttrs('capBL', { x1: oB[0].x, y1: oB[0].y, x2: iB[0].x, y2: iB[0].y });
  setAttrs('capTR', { x1: oT[N].x, y1: oT[N].y, x2: iT[N].x, y2: iT[N].y });
  setAttrs('capBR', { x1: oB[N].x, y1: oB[N].y, x2: iB[N].x, y2: iB[N].y });

  const s1mm = 70 - 0.5 * Dm;
  const s2mm = 103 + 0.5 * Math.min(dm, 7);
  const s1x = MG + s1mm * SC;
  const s2x = MG + s2mm * SC;
  const s1p = profileR(s1mm, Dm, dm);
  const s2p = profileR(s2mm, Dm, dm);
  const sW = 8 * SC;
  const bW = 5 * SC;
  const s1y = CY - s1p.ro * SC;
  const s2y = CY - s2p.ro * SC;
  const sH = Math.min(22 * SC, s1y - 20);

  setAttrs('s1outer', { x: s1x - sW / 2, y: s1y - sH, width: sW, height: sH });
  setAttrs('s1bore', { x: s1x - bW / 2, y: s1y - sH + 1, width: bW, height: sH - 1 });
  setAttrs('s1gusset', { cx: s1x, cy: s1y, rx: 7 * SC, ry: 3 * SC });

  setAttrs('s2outer', { x: s2x - sW / 2, y: s2y - sH, width: sW, height: sH });
  setAttrs('s2bore', { x: s2x - bW / 2, y: s2y - sH + 1, width: bW, height: sH - 1 });
  setAttrs('s2gusset', { cx: s2x, cy: s2y, rx: 5.5 * SC, ry: 2.5 * SC });

  setAttrs('lP1n', { x: s1x, y: Math.max(14, s1y - sH - 6) });
  setAttrs('lP1v', { x: s1x - sW / 2 - 6, y: s1y - sH / 2 + 4, 'text-anchor': 'end' });
  $('lP1v').textContent = fmtBR(P1 / 1e3, 2) + ' kPa';

  setAttrs('lP2n', { x: s2x, y: Math.max(14, s2y - sH - 6) });
  setAttrs('lP2v', { x: s2x + sW / 2 + 6, y: s2y - sH / 2 + 4, 'text-anchor': 'start' });
  $('lP2v').textContent = fmtBR(P2 / 1e3, 2) + ' kPa';

  const dR = (Dm - dm) / 2;
  const aConv = (2 * Math.atan(dR / 33) * 180) / Math.PI;
  const aDiv = (2 * Math.atan(dR / 100) * 180) / Math.PI;
  const dy = CY + profileR(60, Dm, dm).ro * SC + 12;

  let dHtml = '';
  const addDim = (a, b, y, t) => {
    const x1 = MG + a * SC;
    const x2 = MG + b * SC;
    dHtml += `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/><line x1="${x1}" y1="${y - 2}" x2="${x1}" y2="${y + 2}"/><line x1="${x2}" y1="${y - 2}" x2="${x2}" y2="${y + 2}"/>`;
    dHtml += `<text x="${(x1 + x2) / 2}" y="${y - 3}" text-anchor="middle" stroke="none">${t}</text>`;
  };

  addDim(0, 50, dy, '50');
  addDim(50, 70, dy + 10, '20');
  addDim(70, 103, dy, `33 (${fmtBR(aConv, 1)}°)`);
  addDim(103, 110, dy + 10, '7');
  addDim(110, 210, dy, `100 (${fmtBR(aDiv, 1)}°)`);
  addDim(210, 230, dy + 10, '20');
  addDim(230, 280, dy, '50');
  addDim(0, 280, dy + 22, '280 mm');
  $('dims').innerHTML = dHtml;

  let sHtml = '';
  [
    ['Espera', 25],
    ['Entrada', 60],
    ['Conv.', 86],
    ['Garg.', 106.5],
    ['Divergente', 160],
    ['Saída', 220],
    ['Espera', 260],
  ].forEach(([t, mm]) => {
    sHtml += `<text x="${MG + mm * SC}" y="${dy + 34}">${t}</text>`;
  });
  $('sLabels').innerHTML = sHtml;

  const ax1 = MG - 18;
  const ax2 = MG + TW + 18;
  $('cutA').innerHTML = `<circle cx="${ax1}" cy="${CY}" r="8"/><text x="${ax1}" y="${CY + 4}" text-anchor="middle" stroke="none">A</text><circle cx="${ax2}" cy="${CY}" r="8"/><text x="${ax2}" y="${CY + 4}" text-anchor="middle" stroke="none">A</text>`;

  $('flowArrow').innerHTML =
    Ql > 0
      ? `<line x1="${MG + 10}" y1="${CY}" x2="${MG + TW - 10}" y2="${CY}"/><line x1="${MG + TW - 10}" y1="${CY}" x2="${MG + TW - 18}" y2="${CY - 4}" stroke-dasharray="none"/><line x1="${MG + TW - 10}" y1="${CY}" x2="${MG + TW - 18}" y2="${CY + 4}" stroke-dasharray="none"/>`
      : '';

  const hw = 380;
  const hx = (SVG_W - hw) / 2;
  setAttrs('hudBg', { x: hx, y: SVG_H - 32, width: hw, height: 24 });
  setAttrs('hudTxt', { x: SVG_W / 2, y: SVG_H - 16 });
  $('hudTxt').textContent = `Q=${Ql.toFixed(0)} L/h  ΔP(lido)=${fmtBR(dP / 1e3, 2)} kPa  V₁=${fmtBR(V1, 2)}  V₂=${fmtBR(V2, 2)} m/s`;
}

export function initParticles(getState) {
  const g = $('pGroup');
  const parts = [];
  const MAXP = 350;
  let last = performance.now();
  let acc = 0;

  function vAt(mm, sd) {
    const ri = profileR(mm, sd.Dm, sd.dm).ri / 1e3;
    return sd.Q / (Math.PI * ri * ri);
  }

  function spawn() {
    if (parts.length >= MAXP) return;
    const el = document.createElementNS(SVGNS, 'circle');
    el.setAttribute('r', (0.9 + Math.random() * 1.1).toFixed(2));
    el.setAttribute('opacity', (0.35 + Math.random() * 0.35).toFixed(2));
    g.appendChild(el);
    parts.push({ x: 0, f: (Math.random() * 2 - 1) * 0.85, el });
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const sd = getState();

    if (sd && sd.Ql > 0) {
      acc += ((dt * sd.Ql) / 240) * 30;
      while (acc >= 1) {
        acc--;
        spawn();
      }
    }

    const vD = sd ? sd.Q / (Math.PI * (sd.Dm / 2e3) ** 2) : 0;
    const k = vD > 0 ? (10 + (20 * sd.Ql) / 240) / vD : 0;

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (!sd || sd.Ql === 0) {
        p.el.remove();
        parts.splice(i, 1);
        continue;
      }
      p.x += Math.min(600, k * vAt(p.x, sd)) * dt;
      if (p.x >= 280) {
        p.el.remove();
        parts.splice(i, 1);
        continue;
      }
      const ri = profileR(p.x, sd.Dm, sd.dm).ri;
      p.el.setAttribute('cx', (MG + p.x * SC).toFixed(1));
      p.el.setAttribute('cy', (CY + p.f * ri * SC).toFixed(1));
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}