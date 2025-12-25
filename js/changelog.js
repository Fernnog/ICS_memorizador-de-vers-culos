// js/changelog.js
const systemChangelog = [
    {
        version: "1.1.8",
        date: "2025-12-25",
        title: "Correções de Nuvem & UI",
        changes: [
            "☁️ <b>Sync Robusto:</b> Interações com botões de contexto agora salvam progresso automaticamente no Firebase.",
            "🎨 <b>Visual Clean:</b> Remoção da versão na tela de carregamento para maior leveza.",
            "⚙️ <b>Validação:</b> Salvamento de perfil de ritmo auditado."
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
    if (versionEl && systemChangelog.length > 0) {
        versionEl.innerText = `v${systemChangelog[0].version}`;
    }
}
