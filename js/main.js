import { $, fmtBR } from './utils.js';
import { VS, VREF, ADC_N, simulateVenturi } from './physics.js';
import { drawSVG, initParticles } from './svg-renderer.js';
import { initWorksheet } from './worksheet.js';

let currentState = null;
let worksheet = null;

function updateSimulator() {
  const Ql = +$('qS').value;
  const T = +$('tS').value;
  const Dm = +$('dS').value;
  const Cd = +$('cdS').value;
  const P1kPa = +$('p1S').value;

  // Garganta sempre menor que o tubo (β < 1)
  const gS = $('gS');
  const dMax = Math.min(15, Dm - 2);
  gS.max = dMax;
  let dm = +gS.value;
  if (dm > dMax) {
    dm = dMax;
    gS.value = dm;
  }

  $('qV').textContent = Ql;
  $('tV').textContent = T;
  $('dV').textContent = Dm;
  $('gV').textContent = dm;
  $('cdV').textContent = fmtBR(Cd, 3);
  $('p1V').textContent = fmtBR(P1kPa, 1);

  currentState = simulateVenturi({ Ql, T, Dm, dm, Cd, P1kPa });
  const st = currentState;

  // Leituras principais
  $('p1').textContent = fmtBR(st.P1r / 1e3, 2);
  $('p1s').textContent = `S1 · real ${fmtBR(st.P1Pa / 1e3, 2)} kPa`;
  $('p2').textContent = fmtBR(st.P2r / 1e3, 2);

  const p2s = $('p2s');
  if (st.P2 < 20e3) {
    p2s.textContent = '!! abaixo da faixa do sensor (20 kPa)';
    p2s.className = 'rd-sub warn';
  } else {
    p2s.textContent = `S2 · real ${fmtBR(st.P2 / 1e3, 2)} kPa`;
    p2s.className = 'rd-sub';
  }

  $('dp').textContent = fmtBR(st.dPr / 1e3, 2);
  $('dps').textContent = `real ${fmtBR(st.dP / 1e3, 3)} kPa`;
  $('dpB').style.width = `${st.dPmax > 0 ? Math.min(100, (st.dP / st.dPmax) * 100) : 0}%`;

  $('v1').textContent = fmtBR(st.V1, 3);
  $('v2').textContent = fmtBR(st.V2, 3);
  $('qC').textContent = fmtBR(st.Qml, 1);

  const qErr = $('qErr');
  if (Ql > 0) {
    const e = ((st.Qml - Ql) / Ql) * 100;
    qErr.textContent = `real ${Ql} L/h · erro ${e >= 0 ? '+' : ''}${fmtBR(e, 1)} %`;
    qErr.className = 'rd-sub' + (Math.abs(e) > 5 ? ' warn' : '');
  } else {
    qErr.textContent = 'bomba desligada';
    qErr.className = 'rd-sub';
  }

  // Parâmetros hidráulicos avançados (ISO 5167-4)
  $('bV').textContent = fmtBR(st.beta, 3);
  const bOk = st.beta >= 0.4 && st.beta <= 0.75;
  $('bB').style.width = `${Math.min(100, Math.max(0, ((st.beta - 0.1) / 0.8) * 100))}%`;
  $('bB').style.background = bOk ? 'var(--azul2)' : 'var(--verm)';

  const bS = $('bS');
  bS.textContent = bOk ? 'ISO: 0,40–0,75' : '!! FORA DA FAIXA ISO (0,40–0,75)';
  bS.className = 'rd-sub' + (bOk ? '' : ' warn');

  $('rV').textContent = Math.round(st.Re).toLocaleString('pt-BR');
  $('rS').textContent =
    Ql === 0
      ? 'sem escoamento'
      : (st.Re < 2300 ? 'laminar' : st.Re < 4e3 ? 'transição' : 'turbulento') +
        (st.Re < 2e5 ? ' · ISO exige Re ≥ 2×10⁵' : '');
  $('rV').className = 'rd-val rd-val--md ' + (st.Re < 2300 ? 'verde' : st.Re < 4e3 ? 'amarelo' : 'laranja');

  $('cV').textContent = fmtBR(Cd, 3);
  const isoOk = st.Re >= 2e5 && st.Re <= 1e6 && Dm >= 50 && Dm <= 250 && bOk;
  $('cS').textContent = isoOk ? 'ISO: 0,995' : 'fora da faixa ISO · calibrar';

  $('vo1').textContent = `${fmtBR((st.c1 * VREF) / ADC_N, 3)} V`;
  $('vo2').textContent = `${fmtBR((st.c2 * VREF) / ADC_N, 3)} V`;
  $('dv').textContent = fmtBR((st.Vo1 - st.Vo2) * 1e3, 1);
  $('adc').textContent = `${st.c1 - st.c2} passos do ADC (${st.c1} / ${st.c2}) · 1 passo ≈ ${fmtBR(
    VREF / ADC_N / (VS * 0.004),
    3
  )} kPa`;

  // Status da bomba
  const off = Ql === 0;
  const dot = $('dot');
  const sB = $('sB');
  dot.style.background = off ? '#e74c3c' : '#4cff8a';
  dot.style.boxShadow = '0 0 8px ' + (off ? '#e74c3c' : '#4cff8a');
  sB.textContent = off ? 'SISTEMA INATIVO' : 'SISTEMA ATIVO';
  sB.style.color = off ? 'rgba(255,100,100,.9)' : 'rgba(255,255,255,.9)';

  drawSVG(st);
  if (worksheet) worksheet.onSimUpdate();
}

function setSliderValues(values) {
  Object.entries(values).forEach(([sliderId, val]) => {
    const el = $(sliderId);
    if (el) el.value = val;
  });
}

// Eventos dos controles do simulador
['qS', 'tS', 'dS', 'gS', 'cdS', 'p1S'].forEach((id) => {
  $(id).addEventListener('input', updateSimulator);
});

$('bSimReset').addEventListener('click', () => {
  setSliderValues({ qS: 240, tS: 25, dS: 20, gS: 7, cdS: 0.98, p1S: 105 });
  updateSimulator();
});

// Inicialização
updateSimulator();
worksheet = initWorksheet({
  getState: () => currentState,
  setSliderValues,
  onUpdate: updateSimulator,
});
initParticles(() => currentState);