# Escala-Organistas

Aplicativo web/mobile para gerenciamento de escalas de organistas em congregações religiosas.
Desenvolvido com Ionic React + Capacitor, funciona no navegador e em dispositivos Android.

## Funcionalidades

- **Cadastro de Organistas** — adicione, edite e remova organistas, defina funções (RJM, Coral) e restrições de disponibilidade por dia da semana ou datas específicas.
- **Geração Automática de Escalas** — gera escalas rotativas para 3 meses respeitando restrições e distribuindo os serviços de forma equilibrada.
- **Exportação em PDF** — gera PDF com calendário mensal, recomendações e lista de contatos, pronto para compartilhar.
- **Configurações Flexíveis** — personalize slots de serviço, regras de ensaio, título do documento, cidade e textos de recomendação.
- **Armazenamento Local** — todos os dados ficam no dispositivo (sem servidor), usando Capacitor Preferences.

## Tecnologias

- React 19 + TypeScript
- Ionic React 8
- Capacitor 8 (Android)
- Vite
- jsPDF + jspdf-autotable

## Como executar

```bash
cd escala-organistas
npm install
npm run dev
```

Para build Android:

```bash
npm run build
npx cap sync android
npx cap open android
```
