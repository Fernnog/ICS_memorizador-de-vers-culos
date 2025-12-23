// changelog.js
const systemChangelog = [
    {
        version: "1.1.5",
        date: "2025-12-22",
        title: "Edição Completa & Contexto Mnemônico",
        changes: [
            "✏️ <b>Modo de Edição (Finalmente!):</b> Errou a digitação ou quer melhorar uma mnemônica antiga? Agora você pode editar qualquer versículo clicando no ícone de lápis (✎) no histórico. O sistema é inteligente: se você mudar apenas o texto, ele mantém seu agendamento; se mudar a data, ele recalcula o ciclo SRS automaticamente.",
            "🧠 <b>Explicação Lógica (Contexto):</b> Às vezes a cena mnemônica é tão absurda que esquecemos o sentido dela. Adicionamos um campo 'Explicação' no cadastro. No Flashcard, um link '🤔 Não entendi a cena?' revelará esse contexto para salvar sua memória na hora do aperto.",
            "🛡️ <b>Gestão de Estado:</b> Melhorias na interface de cadastro, que agora se transforma em um painel de edição com feedback visual (Highlight) nos campos que estão sendo alterados, evitando confusão entre criar novo e editar existente."
        ]
    },
    {
        version: "1.1.4",
        date: "2025-12-21",
        title: "Polimento, Identidade & Robustez",
        changes: [
            "🎨 <b>Splash Screen (Identidade):</b> O App agora inicia com uma tela de boas-vindas elegante e profissional. Além de reforçar a marca, ela esconde o carregamento técnico dos dados, garantindo que você só veja a interface quando tudo estiver 100% pronto.",
            "✅ <b>Confirmação de Esforço:</b> Acabou a dúvida 'será que contou?'. Ao interagir com um versículo atrasado, o sistema agora exibe uma notificação explícita: '🚀 Progresso registrado! Item recuperado', reforçando seu senso de realização.",
            "🛡️ <b>Sanity Check (Blindagem):</b> Implementamos uma rotina silenciosa de 'faxina de dados'. Ao iniciar, o sistema verifica e corrige automaticamente formatos antigos de versículos, garantindo que atualizações futuras nunca quebrem sua conta."
        ]
    },
    {
        version: "1.1.3",
        date: "2025-12-21",
        title: "Interação Inteligente & Refino Visual",
        changes: [
            "🧠 <b>Smart Interaction (Esforço Conta):</b> O sistema agora é mais justo. Se você interagir com um versículo atrasado (pedir uma dica ou dar feedback), ele é removido imediatamente da lista de pendências. O NeuroBible entende que você trabalhou nele hoje, reduzindo a ansiedade visual.",
            "🎨 <b>Ícones SVG Delicados:</b> Substituímos o antigo emoji de calendário (📅) no painel de 'Atrasados' por um ícone vetorial de relógio minimalista. O alerta continua claro, mas visualmente muito mais leve e integrado ao design.",
            "⚡ <b>Feedback Instantâneo:</b> A atualização do painel de atrasados agora ocorre em tempo real assim que você clica nos botões de ação do Flashcard."
        ]
    },
    {
        version: "1.1.2",
        date: "2025-12-21",
        title: "Sync Total & Gaveta de Histórico",
        changes: [
            "☁️ <b>Sincronização de Ritmo:</b> O seu modo de estudo (Elite, Alternado ou Leve) agora é salvo na nuvem. Se você alterar a configuração no celular, ela será lembrada no computador automaticamente.",
            "🗄️ <b>Gaveta de Histórico:</b> Para limpar a poluição visual, a lista de versículos agora inicia recolhida. Clique no cabeçalho para expandir ou esconder sua coleção.",
            "🔍 <b>Busca Instantânea:</b> Adicionamos uma barra de pesquisa dentro da gaveta. Encontre qualquer referência antiga em milissegundos sem precisar rolar a tela.",
            "⚡ <b>Turbo Loading:</b> O sistema agora usa carregamento paralelo (Promise.all) para baixar seus versículos e configurações simultaneamente ao fazer login."
        ]
    },
    {
        version: "1.1.1",
        date: "2025-12-20",
        title: "Neuro-Ancoragem & Micro-Cenas",
        changes: [
            "🧠 <b>Campo de Mnemônica:</b> Novo campo opcional no cadastro para inserir sua 'Micro-Cena' (ex: Associação Visual da Referência). Transforma dados abstratos em ganchos concretos.",
            "🎭 <b>Estágio de Visualização (Stage -1):</b> O Flashcard ganhou uma nova dimensão. Antes de tentar lembrar o texto (Acrônimo), você agora visualiza a cena mnemônica no 'Palco'.",
            "🤖 <b>Inteligência Híbrida:</b> O sistema detecta automaticamente se o versículo tem mnemônica. Se tiver, apresenta 3 etapas (-1, 0, 1). Se não (ou se for antigo), mantém o fluxo clássico de 2 etapas (0, 1) sem quebrar.",
            "🌫️ <b>Foco Direcionado (Blur):</b> Durante a fase de visualização da mnemônica, o texto bíblico recebe um efeito de desfoque (blur) para impedir a leitura passiva e forçar a evocação mental."
        ]
    },
    {
        version: "1.1.0",
        date: "2025-12-19",
        title: "Neuro-Upgrade: Scaffolding & Metacognição",
        changes: [
            "🧱 <b>Scaffolding Inverso (Andaime Cognitivo):</b> O treino agora possui níveis de dificuldade progressiva dentro do mesmo cartão. 1º Nível: Apenas iniciais (`O S é o m p...`) para esforço máximo. 2º Nível: Botão de Dica libera as lacunas. 3º Nível: Texto completo.",
            "🧠 <b>Feedback Metacognitivo:</b> O sistema parou de adivinhar. Agora VOCÊ decide. Botão <b>'Foi Difícil'</b> reinicia o ciclo SRS imediatamente (reset para Dia 0). Botão <b>'Foi Fácil'</b> mantém a agenda. Isso impede a 'ilusão de competência'.",
            "🔀 <b>Interleaving (Embaralhamento):</b> A lista de revisão do dia agora é apresentada em ordem aleatória, quebrando a dependência sequencial (ex: lembrar de Lucas só porque veio depois de Mateus).",
            "🎨 <b>Nova UI de Treino:</b> Design renovado nos Flashcards com tipografia monoespaçada para o modo de iniciais e controles de dica intuitivos."
        ]
    },
    {
        version: "1.0.9",
        date: "2025-12-19",
        title: "Dashboard Diário & Gestão de Carga",
        changes: [
            "🎯 <b>Painel 'Missão de Hoje':</b> O foco mudou! Agora, ao abrir o app, você vê imediatamente seus versículos pendentes para revisão no topo da tela. Se estiver vazio, você recebe um feedback de 'Tudo em dia!'.",
            "🛡️ <b>Gestão Inteligente de Sobrecarga:</b> O sistema agora prevê o futuro. Ao tentar salvar um versículo, se ele detectar que uma data de revisão cairá em um dia já lotado, ele pausa e oferece buscar automaticamente o próximo dia livre.",
            "🌎 <b>Correção de Fuso Horário:</b> Ajuste crítico na lógica temporal. O sistema abandonou o padrão UTC (Londres) para respeitar estritamente o horário local do seu dispositivo, garantindo que o 'Hoje' seja realmente hoje.",
            "🔧 <b>Performance & Logs:</b> Atualização na inicialização do banco de dados para eliminar avisos antigos (warnings) e garantir compatibilidade futura."
        ]
    },
    {
        version: "1.0.8",
        date: "2025-12-18",
        title: "Cloud Sync & Correções Mobile",
        changes: [
            "☁️ <b>Sincronização na Nuvem:</b> O NeuroBible agora está conectado! Crie sua conta para salvar seus versículos automaticamente no Firebase. Adeus backups manuais.",
            "🔐 <b>Sistema de Login:</b> Substituímos os antigos botões de importar/exportar por um painel de autenticação seguro (E-mail e Senha).",
            "📱 <b>Mobile First:</b> Correção total do layout em celulares. O cabeçalho agora se adapta verticalmente e os formulários não 'vazam' mais da tela em dispositivos menores.",
            "✨ <b>Persistência Híbrida:</b> O sistema mantém seus dados locais se estiver offline e sincroniza assim que a conexão volta."
        ]
    },
    {
        version: "1.0.7",
        date: "2025-12-18",
        title: "Mobile PWA & Modo Offline",
        changes: [
            "📱 <b>Web App Nativo (PWA):</b> Agora você pode instalar o NeuroBible no seu Android/iOS! Adicione à tela inicial para uma experiência de aplicativo completa, sem a barra de endereços do navegador.",
            "📶 <b>Modo Offline:</b> Vai estudar no metrô ou modo avião? Sem problemas. O sistema agora funciona 100% sem internet graças ao novo Service Worker que armazena o app no seu dispositivo.",
            "🎨 <b>Identidade Visual:</b> O cabeçalho foi refinado profissionalmente. O logo agora possui uma moldura 'app-icon' elegante e alinhamento otimizado com o título.",
            "📂 <b>Organização de Assets:</b> Reestruturação interna de pastas de imagem para maior performance e padronização."
        ]
    },
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
