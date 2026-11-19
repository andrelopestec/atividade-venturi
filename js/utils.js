export const $ = (id) => document.getElementById(id);

export function fmtBR(x, dec) {
  return x.toLocaleString('pt-BR', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

export const igual = (a, b) => Math.abs(a - b) < 1e-6;

export function regime(Re) {
  if (Re < 2300) return 'laminar';
  if (Re < 4000) return 'transição';
  return 'turbulento';
}