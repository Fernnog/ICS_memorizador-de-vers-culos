// js/changelog.js

export const systemChangelog = [
    {
        version: "1.2.2",
        date: "2025-12-27",
        title: "Voz & Dupla Codificação",
        changes: [
            "🔊 <b>Leitura Neural (TTS):</b> Agora o NeuroBible lê os versículos para você! Adicionado o botão 'Ouvir' no verso dos cards para ativar a memória auditiva.",
            "🧠 <b>Dual Coding:</b> Aplicação prática de neurociência. Ler e ouvir ao mesmo tempo cria duas trilhas neurais distintas, aumentando drasticamente a retenção.",
            "🛑 <b>Smart Stop:</b> O sistema de áudio é inteligente e respeita seu foco. A leitura para automaticamente ao virar o cartão, avaliar o desempenho ou fechar a revisão.",
            "📱 <b>Nativo & Offline:</b> Utiliza a voz sintética do próprio dispositivo, garantindo privacidade, zero consumo de dados e funcionamento total sem internet."
        ]
    },
    {
        version: "1.2.1",
        date: "2025-12-26",
        title: "Sincronia & Robustez",
        changes: [
            "💾 <b>Memória Permanente:</b> As configurações de ritmo (Intenso/Equilibrado/Leve) agora são salvas e restauradas da nuvem corretamente.",
            "🔥 <b>Streak Real:</b> Correção no contador de dias consecutivos. A contagem agora é enviada para o servidor instantaneamente ao ser atualizada.",
            "☁️ <b>Sync Unificado:</b> Otimização profunda na comunicação com o banco de dados. Perfil, estatísticas e versículos são baixados em um único pacote sincronizado."
        ]
    },
    {
        version: "1.2.0",
        date: "2025-12-25",
        title: "Profissionalização & UX Limpa",
        changes: [
            "✨ <b>Interface Focada:</b> O formulário de cadastro agora fica recolhido em um painel 'Accordion', reduzindo a poluição visual.",
            "🎨 <b>Design System Sóbrio:</b> Substituição completa de emojis por ícones vetoriais (SVG) finos e elegantes em todo o sistema.",
            "🛡️ <b>Feedbacks Profissionais:</b> Mensagens de sistema (Toasts) com linguagem visual técnica.",
            "⚙️ <b>Fluxo de Edição:</b> O painel de cadastro se expande automaticamente ao editar um versículo."
        ]
    },
    {
        version: "1.1.9",
        date: "2025-12-25",
        title: "UX Premium & Sync Robusto",
        changes: [
            "🎨 <b>Visual Refinado:</b> Redesign total das janelas de 'Minha Conta' e 'Ritmo'.",
            "🆔 <b>Identidade:</b> Novo painel com avatar visual e destaque para status de login.",
            "👆 <b>Seleção Tátil:</b> Opções de ritmo agora são botões grandes e interativos.",
            "☁️ <b>Fila Offline:</b> Mecanismo de 'Sync Queue' implementado para salvar dados sem internet."
        ]
    },
    {
        version: "1.1.8",
        date: "2025-12-25",
        title: "Correções de Nuvem & UI",
        changes: [
            "☁️ <b>Sync Robusto:</b> Interações salvam progresso automaticamente no Firebase.",
            "🎨 <b>Visual Clean:</b> Tela de carregamento mais leve.",
            "⚙️ <b>Validação:</b> Auditoria no salvamento de perfil de ritmo."
        ]
    },
    {
        version: "1.1.7",
        date: "2025-12-24",
        title: "Fluxo de Decisão",
        changes: [
            "🔀 <b>Decisão Bifurcada:</b> Escolha explícita entre ver a Explicação ou Avançar na tela da Mnemônica.",
            "🛡️ <b>Proteção de Treino:</b> Ocultação estratégica da resposta completa nas etapas iniciais.",
            "✨ <b>UX:</b> Botões de ação mais claros e contextuais."
        ]
    },
    {
        version: "1.1.6",
        date: "2025-12-23",
        title: "Fluidez & Arquitetura",
        changes: [
            "🏗️ <b>Arquitetura Modular:</b> Reconstrução total do sistema em módulos ES6.",
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
