// changelog.js
const systemChangelog = [
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
