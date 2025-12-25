// js/changelog.js
const systemChangelog = [
    {
        version: "1.1.8",
        date: "2025-12-24",
        title: "Fluidez & Feedback Cognitivo",
        changes: [
            "📍 <b>GPS de Memória:</b> Novos indicadores visuais (bolinhas) no topo do cartão mostram exatamente em qual etapa você está (Cena → Iniciais → Treino).",
            "🌊 <b>Transições Suaves:</b> O texto agora desaparece e reaparece suavemente (fade effect) ao trocar de fase, eliminando a troca brusca e reduzindo o cansaço visual.",
            "✨ <b>Refinamento de UX:</b> Melhorias na estabilidade visual do cartão para evitar saltos de layout durante o estudo."
        ]
    },
    {
        version: "1.1.7",
        date: "2025-12-24",
        title: "Fluxo de Decisão",
        changes: [
            "🔀 <b>Decisão Bifurcada:</b> Agora você escolhe explicitamente entre ver a Explicação (Contexto) ou Avançar (Iniciais) na tela da Mnemônica.",
            "🛡️ <b>Proteção de Treino:</b> O botão de 'Ver Resposta Completa' fica oculto nas etapas iniciais para garantir o esforço cognitivo correto.",
            "✨ <b>UX:</b> Botões de ação mais claros e contextuais."
        ]
    },
    {
        version: "1.1.6",
        date: "2025-12-23",
        title: "Fluidez & Arquitetura",
        changes: [
            "🏗️ <b>Arquitetura Modular:</b> Reconstrução total do sistema para maior estabilidade.",
            "⚡ <b>Fluxo Ágil:</b> Opção de pular a explicação da mnemônica.",
            "🌫️ <b>Transições Suaves:</b> Animações visuais no flashcard."
        ]
    },
    {
        version: "1.1.5",
        date: "2025-12-22",
        title: "Edição Completa",
        changes: ["Modo de edição e correções de layout."]
    }
];

export function initChangelog() {
    window.neuroChangelog = systemChangelog;

    const versionEl = document.getElementById('currentVersion');
    const splashVersion = document.getElementById('splashVersion');
    
    // Atualiza badges de versão na UI
    if (systemChangelog.length > 0) {
        const latest = `v${systemChangelog[0].version}`;
        if (versionEl) versionEl.innerText = latest;
        if (splashVersion) splashVersion.innerText = latest;
    }
}
