/* Eletrônica: MPX4250AP alimentado pelos 5 V do Arduino, ADC 10 bits com Vref = 5 V */
export const VS = 5.0;
export const VREF = 5.0;
export const ADC_N = 1024;

function smoothstep(t) {
  return 0.5 * (1 - Math.cos(Math.PI * t));
}

export function profileR(x, Dm, dm) {
  const Ro = Dm / 2 + 3;
  const Rt = dm / 2 + 3;
  const Re = 5;
  const Ri = Dm / 2;
  const Rti = dm / 2;
  const Rei = 4;

  let ro, ri;
  if (x <= 40) {
    ro = Re; ri = Rei;
  } else if (x <= 50) {
    const t = (x - 40) / 10;
    ro = Re + (Ro - Re) * smoothstep(t);
    ri = Rei + (Ri - Rei) * smoothstep(t);
  } else if (x <= 70) {
    ro = Ro; ri = Ri;
  } else if (x <= 103) {
    const t = (x - 70) / 33;
    ro = Ro + (Rt - Ro) * t;
    ri = Ri + (Rti - Ri) * t;
  } else if (x <= 110) {
    ro = Rt; ri = Rti;
  } else if (x <= 210) {
    const t = (x - 110) / 100;
    ro = Rt + (Ro - Rt) * t;
    ri = Rti + (Ri - Rti) * t;
  } else if (x <= 230) {
    ro = Ro; ri = Ri;
  } else if (x <= 240) {
    const t = (x - 230) / 10;
    ro = Ro + (Re - Ro) * smoothstep(t);
    ri = Ri + (Rei - Ri) * smoothstep(t);
  } else {
    ro = Re; ri = Rei;
  }
  return { ro, ri };
}

/* Densidade da água (kg/m³) — Kell (1975), válida de 0 a 150 °C */
export function rho(T) {
  return (
    (999.83952 +
      16.945176 * T -
      7.9870401e-3 * T * T -
      46.170461e-6 * T ** 3 +
      105.56302e-9 * T ** 4 -
      280.54253e-12 * T ** 5) /
    (1 + 16.87985e-3 * T)
  );
}

/* Viscosidade dinâmica da água (Pa·s) — CRC Handbook */
export function mu(T) {
  if (T <= 20) {
    return 0.1 * Math.pow(10, 1301 / (998.333 + 8.1855 * (T - 20) + 0.00585 * (T - 20) ** 2) - 3.30233);
  }
  return 1.002e-3 * Math.pow(10, (1.3272 * (20 - T) - 0.001053 * (T - 20) ** 2) / (T + 105));
}

export const sensorV = (P) => VS * (0.004 * (P / 1e3) - 0.04);
export const adcRead = (V) => Math.max(0, Math.min(ADC_N - 1, Math.floor((V / VREF) * ADC_N)));
export const adcToP = (c) => (((c * VREF) / ADC_N / VS + 0.04) / 0.004) * 1e3;

export function simulateVenturi({ Ql, T, Dm, dm, Cd, P1kPa }) {
  const P1Pa = P1kPa * 1e3;
  const Q = Ql / 3.6e6;
  const D = Dm / 1e3;
  const d = dm / 1e3;
  const A1 = (Math.PI * D * D) / 4;
  const A2 = (Math.PI * d * d) / 4;
  const beta = d / D;

  const V1 = Q / A1;
  const V2 = Q / A2;
  const r = rho(T);
  const m = mu(T);
  const Re = (r * V1 * D) / m;

  const dPof = (q) => ((r * (1 - beta ** 4)) / 2) * (q / (Cd * A2)) ** 2;
  const dP = dPof(Q);
  const dPmax = dPof(240 / 3.6e6);
  const P2 = P1Pa - dP;

  const Vo1 = sensorV(P1Pa);
  const Vo2 = sensorV(P2);
  const c1 = adcRead(Vo1);
  const c2 = adcRead(Vo2);
  const P1r = adcToP(c1);
  const P2r = adcToP(c2);
  const dPr = P1r - P2r;

  const Qm = dPr > 0 ? Cd * A2 * Math.sqrt((2 * dPr) / (r * (1 - beta ** 4))) : 0;
  const Qml = Qm * 3.6e6;

  return {
    Ql, Q, T, Dm, dm, Cd, beta,
    P1: P1kPa, P1Pa, P2,
    V1, V2, Re,
    dP, dPmax, dPr,
    Vo1, Vo2, c1, c2,
    P1r, P2r, Qml,
  };
}