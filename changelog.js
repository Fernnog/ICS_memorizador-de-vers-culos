// changelog.js
// Estrutura de dados para gerenciar o histórico de versões
const systemChangelog = [
    {
        version: "1.0.0",
        date: "2025-12-18",
        title: "Lançamento Oficial & Neuro-Upgrade",
        changes: [
            "✨ Implementação do sistema de Changelog visual.",
            "🧠 Integração de Recordação Ativa: Omissão de palavras (Cloze Deletion) nos arquivos .ics gerados.",
            "📅 Formatação aprimorada do evento de calendário para separar desafio cognitivo da resposta."
        ]
    }
    // Para futuras versões, basta adicionar novos objetos aqui no topo.
];

// Expõe para uso global
window.neuroChangelog = systemChangelog;
