# Simulador de Tubo Venturi — Atividade Investigativa (POE)

Simulador interativo da **Equação de Bernoulli** e da **Equação da Continuidade** aplicado ao escoamento incompressível em um tubo Venturi (baseado na norma **ABNT NBR ISO 5167-4**), integrado a um roteiro investigativo baseado na metodologia **POE (Prever – Observar – Explicar)**.

Desenvolvido no âmbito do Programa de Pós-Graduação em Mestrado Nacional Profissional em Ensino de Física (**MNPEF — Universidade Estadual de Maringá / UEM**).

- **Autores:** Cobianchi, M. & Pereira, J.R.D.

---

## 🎯 Funcionalidades

- **Simulação Hidráulica e Eletrônica Realista:**
  - Cálculo de densidade ($\rho$) e viscosidade dinâmica ($\mu$) da água em função da temperatura ($5\text{ }^\circ\text{C}$ a $80\text{ }^\circ\text{C}$).
  - Emulação dos sensores diferenciais **MPX4250AP** e da quantização de um conversor analógico-digital (**ADC de 10 bits**, $V_{\text{ref}} = 5\text{ V}$), evidenciando erros de medição em baixas vazões.
  - Verificação automática dos critérios geométricos e de escoamento da norma **ISO 5167-4** (razão $\beta = d/D$ e número de Reynolds $Re$).
- **Diagrama Paramétrico em SVG:**
  - Atualização dinâmica das cotas, ângulos do convergente/divergente e tomadas de pressão $P_1$ e $P_2$.
  - Animação de partículas em câmera lenta com velocidade local proporcional à área da seção transversal ($v(x) = Q / A(x)$).
- **Roteiro Investigativo Integrado (POE):**
  - 4 missões guiadas com travamento de previsão antes da coleta de dados.
  - Tabela de captura automática de leituras e geração dinâmica de gráficos em `<canvas>` com regressão linear pela origem ($R^2$).
  - Persistência automática no navegador via `localStorage` e layout otimizado para exportação/impressão em **PDF**.

---

## 📁 Estrutura do Projeto

O projeto utiliza **HTML5, CSS3 e JavaScript puro (ES Modules)**, sem necessidade de etapas de compilação (*build*), sendo compatível diretamente com o **GitHub Pages**.

```text
simulador-venturi/
├── index.html            # Estrutura principal da interface e do roteiro
├── README.md             # Documentação do repositório
├── css/
│   ├── base.css          # Variáveis de tema, cabeçalho, rodapé e regras de impressão
│   ├── simulator.css     # Controles, leituras dos sensores e diagrama SVG
│   └── worksheet.css     # Abas do roteiro POE, tabelas, gráficos e sliders espelho
└── js/
    ├── main.js           # Ponto de entrada e coordenação entre simulador e roteiro
    ├── physics.js        # Modelos físicos (Kell, CRC, Bernoulli, MPX4250AP e ADC)
    ├── svg-renderer.js   # Renderização paramétrica do tubo e partículas
    ├── chart.js          # Gráficos em Canvas e ajuste linear
    ├── missions-data.js  # Configuração pedagógica das missões
    ├── worksheet.js      # Gerenciamento do estado POE, validações e localStorage
    └── utils.js          # Funções auxiliares de DOM e formatação numérica (pt-BR)
```

---

## 🚀 Como Executar

### 1. No GitHub Pages
1. Faça o upload dos arquivos para um repositório no GitHub.
2. Acesse **Settings → Pages**.
3. Em **Build and deployment**, selecione **Deploy from a branch**, escolha a branch `main` e a pasta `/ (root)`.
4. Salve e aguarde a publicação do link.

### 2. Localmente (Desenvolvimento)
Como o projeto utiliza módulos ES (`<script type="module">`), os navegadores bloqueiam a abertura direta via protocolo `file://` por políticas de CORS. Para testar localmente, inicie qualquer servidor HTTP simples na raiz do projeto:

- **Com Python:**
  ```bash
  python -m http.server 8000
  ```
  Acesse `http://localhost:8000` no navegador.

- **Com VS Code:**
  Instale a extensão **Live Server**, clique com o botão direito em `index.html` e selecione **Open with Live Server**.

---

## 📚 Referências Técnicas
- **ABNT NBR ISO 5167-4:** Medição de vazão de fluidos por meio de dispositivos de pressão diferencial inseridos em condutos forçados de seção transversal circular — Parte 4: Tubos Venturi.
- **Bomba de referência:** AD20P-1230C ($12\text{ V}$, $3,6\text{ W}$, $Q_{\max} = 240\text{ L/h}$).
- **Sensores de pressão:** NXP MPX4250AP ($20\text{ kPa}$ a $250\text{ kPa}$).