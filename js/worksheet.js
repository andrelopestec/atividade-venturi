import { $, fmtBR, igual } from './utils.js';
import { NOMES, MISSIONS } from './missions-data.js';
import { drawChart } from './chart.js';

const STORAGE_KEY = 'venturi_atividade_aluno_v1';
const TAB_ORDER = ['t0', 'm1', 'm2', 'm3', 'm4', 't5'];

const fmtV = (k, v) => (k === 'Cd' ? fmtBR(v, 3) : k === 'P1' ? fmtBR(v, 1) : String(v));
const needTxt = (o) =>
  Object.entries(o)
    .map(([k, v]) => `${NOMES[k][0]} = ${fmtV(k, v)}${NOMES[k][1] ? ' ' + NOMES[k][1] : ''}`)
    .join(' · ');
const nextTab = (id) => TAB_ORDER[TAB_ORDER.indexOf(id) + 1] || 't5';

export function initWorksheet({ getState, setSliderValues, onUpdate }) {
  let S = { f: {}, r: {}, lock: {}, d: { m1: {}, m2: {}, m3: {}, m4: {} }, tab: 't0' };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && saved.d) S = Object.assign(S, saved);
  } catch (e) {}

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
    } catch (e) {}
  }

  /* Renderiza HTML das 4 missões */
  for (const id in MISSIONS) {
    const m = MISSIONS[id];
    const sec = $('sec-' + id);
    const opts = m.opcoes
      .map((o, i) => `<label><input type="radio" name="${id}_prev" value="${i}"> ${o}</label>`)
      .join('');
    const th = m.cols.map((c) => `<th>${c[0]}</th>`).join('') + '<th class="no-print"></th>';
    const obs = m.obs
      .map((q, i) => `<label class="q">${i + 1}. ${q}<textarea class="fld after-lock" id="${id}_o${i}" rows="2"></textarea></label>`)
      .join('');
    const ratio = m.ratio
      ? `<div class="q">${m.obs.length + 1}. Quando a vazão dobrou de 120 para 240 L/h, o ΔP ficou multiplicado por quanto?
           <div class="ratio-row"><input class="fld num after-lock" id="${id}_ratio" type="text" placeholder="Ex.: 2"><span class="msg" id="${id}_ratioMsg"></span></div>
         </div>`
      : '';

    sec.innerHTML = `
      <div class="ws-card">
        <h3>${m.titulo}</h3><div class="meta">Conceito: ${m.conceito}</div>
        <p style="margin-top:8px">${m.intro}</p>
        <div class="step"><span>1</span><b>Prever</b></div>
        <p><b>${m.pergunta}</b></p>
        <div class="opts" id="${id}_opts">${opts}</div>
        <label class="q">Por quê? Expliquem a previsão de vocês.<textarea class="fld" id="${id}_porque" rows="2"></textarea></label>
        <div class="btn-row"><button class="btn pri" id="${id}_lockB">Registrar previsão</button><span id="${id}_lockS"></span></div>
        <div class="msg" id="${id}_lockMsg"></div>

        <div class="step" id="${id}_st2"><span>2</span><b>Observar</b></div>
        <div class="locked-note" id="${id}_ln">Registrem a previsão para liberar esta etapa.</div>
        <div class="need">Ajustem o simulador: <b>${needTxt(m.fix)}</b> e <b>${NOMES[m.var][0]}</b> conforme cada linha.
          <div class="btn-row" style="margin-top:6px"><button class="btn sm after-lock" data-fix="${id}">Ajustar os valores fixos</button></div>
        </div>
        <div class="mirror after-lock-box" id="${id}_mir">
          <b>${NOMES[m.var][0]} (${NOMES[m.var][1]})</b>
          <input type="range" class="after-lock" id="${id}_mr" data-src="${NOMES[m.var][2]}">
          <span class="mv" id="${id}_mv"></span>
        </div>
        <div class="tbl-wrap"><table class="dt"><thead><tr>${th}</tr></thead><tbody id="${id}_tb"></tbody></table></div>
        <div class="msg" id="${id}_capMsg"></div>
        <canvas class="chart" id="${id}_ch" width="640" height="300"></canvas>
        <div class="fit" id="${id}_fit"></div>

        <h4>Responda</h4>
        ${obs}${ratio}
        <div class="step" id="${id}_st3"><span>3</span><b>Explicar</b></div>
        <label class="q">${m.exp}<textarea class="fld after-lock" id="${id}_exp" rows="3"></textarea></label>
        <div class="btn-row no-print"><button class="btn" data-go="${nextTab(id)}">Próxima etapa →</button></div>
      </div>`;
  }

  /* Vincula inputs de texto e rádios */
  document.querySelectorAll('.fld').forEach((el) => {
    if (S.f[el.id] != null) el.value = S.f[el.id];
    el.addEventListener('input', () => {
      S.f[el.id] = el.value;
      save();
      refresh();
    });
  });

  document.querySelectorAll('input[type=radio]').forEach((el) => {
    if (S.r[el.name] === el.value) el.checked = true;
    el.addEventListener('change', () => {
      S.r[el.name] = el.value;
      save();
      refresh();
    });
  });

  /* Bloqueio de previsão */
  for (const id in MISSIONS) {
    $(id + '_lockB').addEventListener('click', () => {
      const msg = $(id + '_lockMsg');
      const txt = ($(id + '_porque').value || '').trim();
      if (S.r[id + '_prev'] == null) {
        msg.textContent = 'Escolham uma das opções.';
        msg.className = 'msg err';
        return;
      }
      if (txt.length < 15) {
        msg.textContent = 'Escrevam uma justificativa um pouco maior.';
        msg.className = 'msg err';
        return;
      }
      S.lock[id] = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      msg.textContent = '';
      save();
      refresh();
    });
  }

  /* Captura de leituras */
  function capture(id, i) {
    const m = MISSIONS[id];
    const need = Object.assign({}, m.fix, { [m.var]: m.vals[i] });
    const msg = $(id + '_capMsg');
    const st = getState();

    const erro = Object.entries(need)
      .filter(([k, v]) => !igual(st[k], v))
      .map(([k, v]) => `${NOMES[k][0]} para ${fmtV(k, v)}${NOMES[k][1] ? ' ' + NOMES[k][1] : ''}`);

    if (erro.length) {
      msg.textContent = 'Ajustem no simulador: ' + erro.join(', ') + '.';
      msg.className = 'msg err';
      return;
    }

    S.d[id][i] = {
      Ql: st.Ql, T: st.T, Dm: st.Dm, dm: st.dm,
      V1: st.V1, V2: st.V2, dP: st.dP, dPr: st.dPr,
      P1r: st.P1r, P2r: st.P2r, Qml: st.Qml, Re: st.Re,
      c1: st.c1, c2: st.c2,
    };
    msg.textContent = 'Leitura registrada!';
    msg.className = 'msg ok';
    save();
    refresh();
  }

  function showTab(t) {
    S.tab = t;
    save();
    document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.t === t));
    document.querySelectorAll('.tab-sec').forEach((s) => s.classList.toggle('on', s.id === 'sec-' + t));
  }

  document.addEventListener('click', (e) => {
    const capBtn = e.target.closest('[data-cap]');
    if (capBtn) {
      const [id, i] = capBtn.dataset.cap.split(':');
      capture(id, +i);
    }

    const fixBtn = e.target.closest('[data-fix]');
    if (fixBtn) {
      const m = MISSIONS[fixBtn.dataset.fix];
      const sliderMap = {};
      Object.entries(m.fix).forEach(([k, v]) => {
        sliderMap[NOMES[k][2]] = v;
      });
      setSliderValues(sliderMap);
      onUpdate();
      const msg = $(fixBtn.dataset.fix + '_capMsg');
      msg.textContent = `Valores fixos ajustados. Agora mudem ${NOMES[m.var][0]} conforme cada linha.`;
      msg.className = 'msg ok';
    }

    const goBtn = e.target.closest('[data-go]');
    if (goBtn) {
      showTab(goBtn.dataset.go);
      window.scrollTo({ top: $('tabs').offsetTop - 8, behavior: 'smooth' });
    }
  });

  document.querySelectorAll('.tabs button').forEach((b) => {
    b.addEventListener('click', () => showTab(b.dataset.t));
  });

  function syncMirrors() {
    for (const id in MISSIONS) {
      const r = $(id + '_mr');
      const src = $(r.dataset.src);
      const m = MISSIONS[id];
      r.min = src.min;
      r.max = src.max;
      r.step = src.step;
      r.value = src.value;
      $(id + '_mv').textContent = `${src.value} ${NOMES[m.var][1]}`;
    }
  }

  document.querySelectorAll('.mirror input').forEach((r) => {
    r.addEventListener('input', () => {
      setSliderValues({ [r.dataset.src]: r.value });
      onUpdate();
    });
  });

  function refresh() {
    let total = 0;
    let feito = 0;

    ['nomes', 'turma', 'a1', 'a2', 'a3'].forEach((k) => {
      total++;
      if ((S.f[k] || '').trim()) feito++;
    });

    const live = getState();

    for (const id in MISSIONS) {
      const m = MISSIONS[id];
      const lk = !!S.lock[id];

      document.querySelectorAll(`input[name=${id}_prev]`).forEach((r) => (r.disabled = lk));
      $(id + '_porque').readOnly = lk;
      $(id + '_lockB').style.display = lk ? 'none' : '';
      $(id + '_lockS').innerHTML = lk ? `<span class="badge-ok">Previsão registrada às ${S.lock[id]}</span>` : '';
      $(id + '_ln').style.display = lk ? 'none' : '';
      $(id + '_st2').classList.toggle('lock', !lk);
      $(id + '_st3').classList.toggle('lock', !lk);
      $('sec-' + id).querySelectorAll('.after-lock').forEach((el) => (el.disabled = !lk));

      $(id + '_tb').innerHTML = m.vals
        .map((v, i) => {
          const r = S.d[id][i];
          const atual =
            live &&
            igual(live[m.var], v) &&
            Object.entries(m.fix).every(([k, w]) => igual(live[k], w));
          const cells = r
            ? m.cols.map((c) => `<td>${c[1](r)}</td>`).join('')
            : `<td>${v}</td>` + m.cols.slice(1).map(() => '<td>—</td>').join('');
          return `<tr>${cells.replace('<td>', atual ? '<td class="cur">' : '<td>')}<td class="no-print"><button class="btn sm${atual && lk ? ' pri' : ''}" data-cap="${id}:${i}" ${lk ? '' : 'disabled'}>${r ? '↻' : 'Capturar'}</button></td></tr>`;
        })
        .join('');

      const rows = Object.values(S.d[id]);
      const pts = rows.map((r) => [m.chart.x(r), m.chart.y(r)]);
      const fit = drawChart($(id + '_ch'), pts, m.chart);
      $(id + '_fit').textContent =
        fit && pts.length >= 3
          ? `Reta pela origem: ${m.chart.yl.split(' ')[0]} = ${fmtBR(fit.k, 4)} · x   (R² = ${fmtBR(fit.r2, 4)}; quanto mais perto de 1, mais os pontos formam uma reta)`
          : '';

      if (m.ratio) {
        const a = S.d[id][1];
        const b = S.d[id][3];
        const ms = $(id + '_ratioMsg');
        const u = (S.f[id + '_ratio'] || '').trim();
        ms.textContent =
          u && a && b
            ? `Pelos dados de vocês: ΔP(240) ÷ ΔP(120) = ${fmtBR(b.dP / a.dP, 2)}`
            : u
              ? 'Capturem as linhas de 120 e 240 L/h para conferir.'
              : '';
        ms.className = 'msg ' + (u && a && b ? 'ok' : 'err');
      }

      const qs = [id + '_porque', ...m.obs.map((_, i) => `${id}_o${i}`), id + '_exp'].concat(
        m.ratio ? [id + '_ratio'] : []
      );
      let mt = 1 + m.vals.length + qs.length;
      let mf = (lk ? 1 : 0) + Object.keys(S.d[id]).length + qs.filter((k) => (S.f[k] || '').trim()).length;

      if (id !== 'm4') {
        total += mt;
        feito += mf;
      }
      document.querySelector(`.tabs [data-t=${id}]`).classList.toggle('done', mf === mt);
    }

    ['d1', 'd2', 'd3', 'd4'].forEach((k) => {
      total++;
      if ((S.f[k] || '').trim()) feito++;
    });

    [1, 2, 3].forEach((i) => {
      $('ant' + i).textContent = (S.f['a' + i] || '').trim() || '(sem resposta)';
    });

    document.querySelector('.tabs [data-t=t0]').classList.toggle(
      'done',
      ['nomes', 'a1', 'a2', 'a3'].every((k) => (S.f[k] || '').trim())
    );
    document.querySelector('.tabs [data-t=t5]').classList.toggle(
      'done',
      ['d1', 'd2', 'd3', 'd4'].every((k) => (S.f[k] || '').trim())
    );

    const pc = Math.round((feito / total) * 100);
    $('progTxt').textContent = `Progresso: ${pc}%${pc === 100 ? ' · atividade completa!' : ''}`;
    $('progFill').style.width = pc + '%';
  }

  /* Impressão e reinício */
  function fitAreas() {
    document.querySelectorAll('textarea').forEach((t) => {
      t.style.height = 'auto';
      t.style.height = t.scrollHeight + 4 + 'px';
    });
  }
  window.addEventListener('beforeprint', fitAreas);
  $('bPrint').addEventListener('click', () => {
    fitAreas();
    window.print();
  });
  $('bReset').addEventListener('click', () => {
    if (!confirm('Apagar todas as respostas e leituras desta atividade?')) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    location.reload();
  });

  if (!S.f.data) {
    $('data').value = new Date().toLocaleDateString('sv-SE');
    S.f.data = $('data').value;
  }

  showTab(S.tab || 't0');
  syncMirrors();
  refresh();

  const temDados = (S.f.nomes || '').trim() || Object.keys(S.lock).length;
  if (temDados) {
    const r = $('resume');
    r.style.display = 'block';
    r.innerHTML =
      '<b>Este aparelho já tem uma atividade em andamento</b>' +
      ((S.f.nomes || '').trim() ? ' do grupo: <b></b>' : '') +
      '.<div class="btn-row"><button class="btn pri" id="rCont">Continuar</button><button class="btn" id="rNova">Começar nova atividade</button></div>';
    if ((S.f.nomes || '').trim()) r.querySelector('b:nth-of-type(2)').textContent = S.f.nomes.trim();
    $('rCont').onclick = () => (r.style.display = 'none');
    $('rNova').onclick = () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
      location.reload();
    };
  }

  return {
    onSimUpdate() {
      syncMirrors();
      if (MISSIONS[S.tab]) refresh();
    },
  };
}