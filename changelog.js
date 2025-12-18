// changelog.js
const systemChangelog = [
    {
        version: "1.0.6",
        date: "2025-12-18",
        title: "Feedback Imediato & Ajuste SRS",
        changes: [
            "📍 <b>Dia Zero (Learning Day):</b> O dia em que você adiciona o versículo agora aparece no Radar e na Agenda. Isso confirma visualmente seu plantio.",
            "🧠 <b>Ciclo Completo:</b> O algoritmo foi ajustado para 8 etapas (0, 1, 3... 60), garantindo contato imediato com o conteúdo."
        ]
    },
    {
        version: "1.0.5",
        date: "2025-12-18",
        title: "Gestão de Sobrecarga & Refino UI",
        changes: [
            "🚨 <b>Válvula de Escape:</b> Dias com mais de 5 revisões agora exibem um alerta inteligente. Com um clique, você transfere o excesso automaticamente para o próximo dia 'Leve' disponível na agenda.",
            "🎨 <b>Flashcards Premium:</b> Adeus emojis! A tela de treino agora usa ícones vetoriais com animações suaves de rotação e tipografia refinada para uma experiência mais imersiva.",
            "👻 <b>Foco Total:</b> O botão de 'Voltar' foi redesenhado no estilo 'Ghost' (transparente e minimalista), reduzindo distrações visuais durante sua memorização."
        ]
    },
    {
        version: "1.0.4",
        date: "2025-12-18",
        title: "Harmonia Visual & Modo Leve",
        changes: [
            "🪶 <b>Modo Leve & Ícones:</b> Renomeamos o 'Modo Zen' para 'Modo Leve' e substituímos os emojis antigos por ícones vetoriais (SVG) de alta definição no seletor de planos.",
            "👁️ <b>Feedback Visual de Ritmo:</b> Adicionamos um indicador discreto no header (canto superior esquerdo do botão) que mostra o ícone do plano atual sem precisar abrir o menu.",
            "✨ <b>Refinamento UI:</b> O badge de 'Dias Seguidos' (Streak) perdeu o fundo preto pesado e ganhou um visual minimalista e elegante, mais integrado ao design do sistema."
        ]
    },
    {
        version: "1.0.3",
        date: "2025-12-18",
        title: "Previsão Inteligente & Refinamento UI",
        changes: [
            "🔮 <b>Painel de Previsão:</b> Chega de adivinhar! Agora, ao digitar a data e referência, você vê instantaneamente quais dias futuros receberão as revisões.",
            "🚨 <b>Alerta de Sobrecarga:</b> O sistema agora detecta dias congestionados no futuro. Se uma data de revisão cair em um dia 'cheio' (borda vermelha), você saberá antes de confirmar.",
            "🎨 <b>UI Minimalista:</b> O botão de 'Ritmo' foi simplificado (borda verde/vermelha) para reduzir ruído visual, e os ícones de ação foram modernizados."
        ]
    },
    {
        version: "1.0.2",
        date: "2025-12-18",
        title: "Redesign Visual & Radar Expandido",
        changes: [
            "🎨 <b>Visual Profissional:</b> Interface totalmente redesenhada. Substituímos botões de texto por ícones SVG minimalistas e limpamos a poluição visual.",
            "📡 <b>Radar de 63 Dias:</b> O mapa de calor agora tem sua própria janela (Modal) e exibe 9 semanas completas, cobrindo todo o ciclo do SRS.",
            "🌘 <b>Dark Mode Automático:</b> O sistema agora respeita a preferência de cor do seu sistema operacional (Claro/Escuro).",
            "🔔 <b>Notificações Inteligentes:</b> O ícone do Radar exibe um ponto de alerta vermelho caso a carga de revisões de hoje esteja alta."
        ]
    },
    {
        version: "1.0.1",
        date: "2025-12-18",
        title: "Flashcards Integrados ao Radar",
        changes: [
            "🃏 <b>Flashcards Interativos:</b> Agora o Radar de Carga é clicável! Clique em qualquer dia colorido para abrir a revisão.",
            "🔄 <b>Animação 3D:</b> Treine sua memória com cartões que viram na tela (Frente: Lacunas / Verso: Resposta).",
            "✨ <b>Modo Foco:</b> A revisão acontece dentro da página, sem precisar sair para o calendário."
        ]
    },
    {
        version: "1.0.0",
        date: "2025-12-18",
        title: "Lançamento Oficial & Neuro-Upgrade",
        changes: [
            "🧠 <b>Recuperação Ativa:</b> Os eventos da agenda (.ics) agora ocultam palavras-chave estrategicamente.",
            "🙈 <b>Omissão & Resposta:</b> O arquivo de agenda separa o desafio da resposta original (role para baixo no evento para ver).",
            "📊 <b>Radar de Carga:</b> Sistema de prevenção de burnout mental."
        ]
    }
];

// Expõe para uso global
window.neuroChangelog = systemChangelog;
