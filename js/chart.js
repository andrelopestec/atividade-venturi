import { fmtBR } from './utils.js';

export function drawChart(cv, pts, c) {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const W = 640, H = 300, L = 64, R = 18, T = 32, B = 50;

  if (cv.width !== W * dpr) {
    cv.width = W * dpr;
    cv.height = H * dpr;
  }

  const x = cv.getContext('2d');
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.clearRect(0, 0, W, H);

  x.fillStyle = '#1a3a6b';
  x.font = 'bold 16px "Source Sans 3",sans-serif';
  x.fillText(c.titulo, L, 18);
  x.font = '15px "Source Sans 3",sans-serif';

  if (pts.length < 2) {
    x.fillStyle = '#8a9ab5';
    x.fillText('Capturem pelo menos 2 leituras para ver o gráfico.', L, H / 2);
    return null;
  }

  const xm = Math.max(...pts.map((p) => p[0])) * 1.1 || 1;
  const ym = Math.max(...pts.map((p) => p[1])) * 1.15 || 1;
  const X = (v) => L + (v / xm) * (W - L - R);
  const Y = (v) => H - B - (v / ym) * (H - T - B);

  x.strokeStyle = '#dde3ed';
  x.lineWidth = 1;
  x.fillStyle = '#3a4a6b';

  for (let k = 0; k <= 5; k++) {
    const yv = (ym * k) / 5;
    const xv = (xm * k) / 5;
    x.beginPath();
    x.moveTo(L, Y(yv));
    x.lineTo(W - R, Y(yv));
    x.stroke();

    x.textAlign = 'right';
    x.fillText(fmtBR(yv, yv < 1 ? 2 : 1), L - 6, Y(yv) + 4);
    x.textAlign = 'center';
    x.fillText(fmtBR(xv, xv < 10 ? 2 : 0), X(xv), H - B + 16);
  }

  x.strokeStyle = '#1a3a6b';
  x.beginPath();
  x.moveTo(L, T - 6);
  x.lineTo(L, H - B);
  x.lineTo(W - R, H - B);
  x.stroke();

  x.textAlign = 'center';
  x.fillStyle = '#1a3a6b';
  x.fillText(c.xl, (L + W - R) / 2, H - 8);

  x.save();
  x.translate(14, (T + H - B) / 2);
  x.rotate(-Math.PI / 2);
  x.fillText(c.yl, 0, 0);
  x.restore();

  let fit = null;
  if (!c.noFit) {
    const sxy = pts.reduce((s, p) => s + p[0] * p[1], 0);
    const sxx = pts.reduce((s, p) => s + p[0] * p[0], 0);
    const k = sxy / sxx;
    const my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    const ssr = pts.reduce((s, p) => s + (p[1] - k * p[0]) ** 2, 0);
    const sst = pts.reduce((s, p) => s + (p[1] - my) ** 2, 0);
    fit = { k, r2: sst > 0 ? 1 - ssr / sst : 1 };

    x.strokeStyle = '#d35400';
    x.setLineDash([6, 4]);
    x.lineWidth = 1.5;
    x.beginPath();
    x.moveTo(X(0), Y(0));
    x.lineTo(X(xm), Y(k * xm));
    x.stroke();
    x.setLineDash([]);
  } else {
    const s = pts.slice().sort((a, b) => a[0] - b[0]);
    x.strokeStyle = 'rgba(37,99,168,.5)';
    x.lineWidth = 1.5;
    x.beginPath();
    s.forEach((p, i) => (i ? x.lineTo(X(p[0]), Y(p[1])) : x.moveTo(X(p[0]), Y(p[1]))));
    x.stroke();
  }

  x.fillStyle = '#2563a8';
  pts.forEach((p) => {
    x.beginPath();
    x.arc(X(p[0]), Y(p[1]), 4.5, 0, Math.PI * 2);
    x.fill();
  });

  return fit;
}