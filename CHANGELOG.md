# Histórico de Alterações (Changelog)

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [2.0.0] - 2026-11-19
### Refatoração (Changed)
- Separação do arquivo monolítico (`index.html`) em estrutura modular com **ES Modules** nativos (`css/` e `js/`).
- Isolamento das equações físicas e do modelo eletrônico (MPX4250AP / ADC 10 bits) em `js/physics.js`.
- Desacoplamento da renderização paramétrica do tubo Venturi (ISO 5167-4) e partículas em `js/svg-renderer.js`.
- Separação da lógica pedagógica POE, persistência em `localStorage` e geração de gráficos em `js/worksheet.js` e `js/chart.js`.
- Adição de `README.md` com documentação técnica e instruções de execução.

### Correções (Fixed)
- Ajuste de caminhos relativos (`./css/` e `./js/`) para compatibilidade com subdiretórios do GitHub Pages.
- Remoção de handlers inline (`oninput`) em favor de `addEventListener` no módulo principal (`js/main.js`).