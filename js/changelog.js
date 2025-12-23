// js/changelog.js
const systemChangelog = [
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

// ⚠️ ATENÇÃO: A palavra 'export' é OBRIGATÓRIA aqui embaixo:
export function initChangelog() {
    // Mantém compatibilidade global (opcional, mas bom para debug)
    window.neuroChangelog = systemChangelog;

    const versionEl = document.getElementById('currentVersion');
    if (versionEl && systemChangelog.length > 0) {
        versionEl.innerText = `v${systemChangelog[0].version}`;
    }
}
