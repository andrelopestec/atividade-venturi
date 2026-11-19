import { fmtBR, regime } from './utils.js';

export const NOMES = {
  Ql: ['Q', 'L/h', 'qS'],
  Dm: ['D', 'mm', 'dS'],
  dm: ['d', 'mm', 'gS'],
  T: ['T', '°C', 'tS'],
  Cd: ['Cd', '', 'cdS'],
  P1: ['P₁', 'kPa', 'p1S'],
};

export const BASE = { Cd: 0.98, P1: 105 };

export const MISSIONS = {
  m1: {
    titulo: 'Missão 1 · O estreitamento',
    conceito: 'Equação da continuidade',
    intro: 'O que acontece com a água quando o tubo fica mais estreito? Nesta missão vocês vão mudar o diâmetro da garganta (d) e manter a vazão fixa.',
    pergunta: 'Se a garganta ficar mais estreita, a água passa por ela…',
    opcoes: ['mais rápido', 'mais devagar', 'com a mesma velocidade'],
    fix: { Ql: 240, Dm: 20, T: 25, ...BASE },
    var: 'dm',
    vals: [15, 12, 9, 7, 6, 5, 4],
    cols: [
      ['d (mm)', (r) => r.dm],
      ['V₁ (m/s)', (r) => fmtBR(r.V1, 3)],
      ['V₂ (m/s)', (r) => fmtBR(r.V2, 3)],
      ['A₂·V₂ (L/h)', (r) => fmtBR(((Math.PI * (r.dm / 1e3) ** 2) / 4) * r.V2 * 3.6e6, 1)],
      ['ΔP real (kPa)', (r) => fmtBR(r.dP / 1e3, 3)],
    ],
    chart: { x: (r) => 1e3 / r.dm ** 4, y: (r) => r.dP / 1e3, xl: '1/d⁴ (×10⁻³ mm⁻⁴)', yl: 'ΔP (kPa)', titulo: 'ΔP × 1/d⁴' },
    obs: [
      'O que aconteceu com a velocidade V₂ quando d diminuiu? Isso confirma a previsão de vocês?',
      'Observem a coluna A₂·V₂. O valor mudou? O que isso significa sobre a quantidade de água que passa por segundo?',
      'O gráfico ΔP × 1/d⁴ parece uma reta? O que isso diz sobre como ΔP depende de d?',
    ],
    exp: 'Expliquem, com as palavras de vocês, por que a água acelera no estreitamento. (Dica: a água não pode "sumir" nem se acumular dentro do tubo.)',
  },
  m2: {
    titulo: 'Missão 2 · Velocidade e pressão',
    conceito: 'Equação de Bernoulli',
    intro: 'Na Missão 1 vocês viram que a água acelera na garganta. E a pressão? Agora a garganta fica fixa em 7 mm e vocês vão mudar a vazão.',
    pergunta: 'Na garganta, onde a água é mais rápida, a pressão será…',
    opcoes: ['maior que na entrada', 'menor que na entrada', 'igual à da entrada'],
    fix: { Dm: 20, dm: 7, T: 25, ...BASE },
    var: 'Ql',
    vals: [60, 120, 180, 240],
    cols: [
      ['Q (L/h)', (r) => r.Ql],
      ['P1 lido (kPa)', (r) => fmtBR(r.P1r / 1e3, 2)],
      ['P2 lido (kPa)', (r) => fmtBR(r.P2r / 1e3, 2)],
      ['ΔP real (kPa)', (r) => fmtBR(r.dP / 1e3, 3)],
      ['Q² (×10³ L²/h²)', (r) => fmtBR(r.Ql ** 2 / 1e3, 1)],
    ],
    chart: { x: (r) => r.Ql ** 2 / 1e3, y: (r) => r.dP / 1e3, xl: 'Q² (×10³ L²/h²)', yl: 'ΔP (kPa)', titulo: 'ΔP × Q²' },
    obs: [
      'Onde a pressão foi menor: na entrada (P1) ou na garganta (P2)? Isso confirma a previsão de vocês?',
      'Observem as partículas no desenho do tubo. Onde elas andam mais rápido? Relacionem com as pressões.',
    ],
    ratio: true,
    exp: 'Expliquem usando a ideia de energia: se a energia por volume (P + ½ρV²) se conserva, por que a pressão cai onde a velocidade aumenta? Voltem ao exemplo da mangueira.',
  },
  m3: {
    titulo: 'Missão 3 · O medidor mente?',
    conceito: 'Medição, resolução e erro',
    intro: 'O medidor calcula a vazão a partir do ΔP lido pelos sensores e pelo Arduino. Ele sempre acerta? Mantenham a garganta em 7 mm e diminuam a vazão aos poucos.',
    pergunta: 'Quando a vazão for bem pequena, o medidor vai ser…',
    opcoes: ['mais preciso', 'menos preciso', 'igualmente preciso'],
    fix: { Dm: 20, dm: 7, T: 25, ...BASE },
    var: 'Ql',
    vals: [240, 180, 120, 90, 60, 30],
    cols: [
      ['Q real (L/h)', (r) => r.Ql],
      ['Q medida (L/h)', (r) => fmtBR(r.Qml, 1)],
      ['Erro (%)', (r) => (r.Qml >= r.Ql ? '+' : '') + fmtBR(((r.Qml - r.Ql) / r.Ql) * 100, 1)],
      ['ΔP lido (kPa)', (r) => fmtBR(r.dPr / 1e3, 2)],
      ['Passos do ADC', (r) => r.c1 - r.c2],
    ],
    chart: { x: (r) => r.Ql, y: (r) => Math.abs(((r.Qml - r.Ql) / r.Ql) * 100), xl: 'Q real (L/h)', yl: '|erro| (%)', titulo: 'Erro × vazão', noFit: true },
    obs: [
      'Em qual vazão o erro foi maior? Isso confirma a previsão de vocês?',
      'Observem a coluna "Passos do ADC". O Arduino só consegue ler a pressão em "degraus" de cerca de 0,24 kPa. Como isso explica o erro nas vazões baixas?',
      'Proponham uma melhoria no equipamento para medir vazões pequenas com mais precisão.',
    ],
    exp: 'Por que não devemos confiar cegamente em um número que aparece numa tela (de um aparelho, de um aplicativo ou de uma IA)? Usem o que viram nesta missão como exemplo.',
  },
  m4: {
    titulo: 'Missão 4 · Água quente ou fria? (opcional)',
    conceito: 'Densidade, viscosidade e número de Reynolds',
    intro: 'A temperatura muda as propriedades da água. Mantenham Q = 240 L/h e d = 7 mm e mudem a temperatura.',
    pergunta: 'Esquentando a água de 5 °C até 80 °C, a diferença de pressão ΔP vai…',
    opcoes: ['aumentar muito', 'diminuir muito', 'mudar muito pouco'],
    fix: { Ql: 240, Dm: 20, dm: 7, ...BASE },
    var: 'T',
    vals: [5, 25, 50, 80],
    cols: [
      ['T (°C)', (r) => r.T],
      ['Reynolds', (r) => Math.round(r.Re).toLocaleString('pt-BR')],
      ['Regime', (r) => regime(r.Re)],
      ['ΔP real (kPa)', (r) => fmtBR(r.dP / 1e3, 3)],
    ],
    chart: { x: (r) => r.T, y: (r) => r.Re / 1e3, xl: 'T (°C)', yl: 'Re (×10³)', titulo: 'Reynolds × temperatura', noFit: true },
    obs: [
      'O número de Reynolds mudou muito ou pouco? E o ΔP? Isso confirma a previsão de vocês?',
      'O ΔP depende da densidade da água e o Reynolds depende da viscosidade ("grossura" do fluido). Qual das duas propriedades muda mais com a temperatura? Como vocês sabem?',
    ],
    exp: 'O mel escorre mais rápido quente ou frio? Relacionem com o que viram sobre a viscosidade da água.',
  },
};