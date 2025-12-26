// js/changelog.js

// NOTA: Adicionado 'export' para permitir leitura no main.js (DRY)
export const systemChangelog = [
    {
        version: "1.2.1",
        date: "2025-12-26",
        title: "Sincronia & Robustez",
        changes: [
            "💾 <b>Memória Permanente:</b> As configurações de ritmo (Intenso/Equilibrado/Leve) agora são salvas e restauradas da nuvem corretamente. Seus ajustes não serão perdidos ao limpar o cache.",
            "🔥 <b>Streak Real:</b> Correção no contador de dias consecutivos. A contagem agora é enviada para o servidor instantaneamente ao ser atualizada, garantindo precisão entre dispositivos.",
            "☁️ <b>Sync Unificado:</b> Otimização profunda na comunicação com o banco de dados. Agora, perfil, estatísticas e versículos são baixados em um único pacote sincronizado, eliminando falhas de carregamento."
        ]
    },
    {
        version: "1.2.0",
        date: "2025-12-25",
        title: "Profissionalização & UX Limpa",
        changes: [
            "✨ <b>Interface Focada:</b> O formulário de cadastro de versículos agora fica recolhido em um painel 'Accordion', reduzindo a poluição visual e priorizando as revisões do dia.",
            "🎨 <b>Design System Sóbrio:</b> Substituição completa de emojis por ícones vetoriais (SVG) finos e elegantes em todo o sistema (alertas, modos de ritmo e feedbacks).",
            "🛡️ <b>Feedbacks Profissionais:</b> As mensagens de sistema (Toasts) agora utilizam uma linguagem visual mais técnica e consistente.",
            "⚙️ <b>Fluxo de Edição:</b> Ao editar um versículo, o painel de cadastro se expande automaticamente para facilitar o ajuste."
        ]
    },
    {
        version: "1.1.9",
        date: "2025-12-25",
        title: "UX Premium & Sync Robusto",
        changes: [
            "🎨 <b>Visual Refinado:</b> Redesign total das janelas de 'Minha Conta' e 'Ritmo', abandonando o visual padrão por Cards estilizados.",
            "🆔 <b>Identidade de Usuário:</b> Novo painel com avatar visual e destaque para o status de login.",
            "👆 <b>Seleção Tátil:</b> As opções de ritmo agora são botões grandes e interativos que mostram claramente qual plano está ativo.",
            "☁️ <b>Fila Offline:</b> Mecanismo de 'Sync Queue' implementado. Se a internet cair, seus dados são salvos localmente e sobem automaticamente ao reconectar."
        ]
    },
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
