
🧠 NeuroBible: Sistema de Gestão de Memorização & Treino Cognitivo
> "Não apenas agende. Treine seu cérebro de verdade."
> 
O NeuroBible evoluiu. Ele é uma aplicação web focada em Neuroaprendizagem e Gestão de Carga Cognitiva. Além de agendar revisões baseadas em princípios científicos de Repetição Espaçada (SRS), agora ele atua como um treinador ativo, utilizando técnicas de Recuperação Ativa (Active Recall) e Flashcards Interativos para garantir a fixação profunda do conteúdo bíblico.
🎯 O Propósito
A memorização falha quando é passiva (apenas ler) ou desorganizada (sobrecarga). O NeuroBible resolve isso com três pilares:
 * Logística (Quando revisar): Otimiza o tempo usando a Curva do Esquecimento.
 * Carga (Quanto revisar): Evita o "burnout mental" com um Mapa de Calor.
 * Técnica (Como revisar): Força o cérebro a buscar a informação (Recuperação Ativa) em vez de apenas entregá-la.
⚙️ Engenharia de Retenção (Neurociência Aplicada)
1. O Algoritmo de Repetição Espaçada (SRS)
O sistema projeta 7 revisões estratégicas ao longo de 60 dias (Intervalos: 1, 3, 7, 14, 21, 30, 60 dias). Cada data tem um propósito cognitivo, da fixação imediata à memória de longo prazo.
2. Recuperação Ativa & Omissão (Cloze Deletion)
Baseado em estudos de neuroplasticidade, ler passivamente cria uma falsa sensação de fluência.
 * Nos Arquivos de Agenda (.ics): O sistema não envia o versículo pronto. Ele gera um "Desafio de Memória" ocultando palavras-chave aleatórias (ex: "Porque Deus ______ o mundo de tal ______"). A resposta completa fica escondida (exige rolagem de tela), forçando você a testar sua memória antes de consultar.
 * Nos Flashcards: A mesma lógica é aplicada na interface visual do navegador.
3. O Radar de Carga Cognitiva (Heatmap Interativo)
O "Controlador de Tráfego Aéreo" da sua memória.
 * Visualização: Cores indicam a intensidade do dia (🟢 Leve, 🟡 Médio, 🔴 Pesado).
 * Ação (Novo na v1.0.1): O Radar agora é clicável. Ao clicar em um dia colorido, você abre o modo de Revisão com Flashcards para aquele dia específico.
🚀 Guia de Uso
Passo 1: Inserção de Dados
 * Referência: Digite o local do texto (ex: Salmos 23).
 * Data de Início: Escolha quando começar. Observe o Radar para evitar dias vermelhos (sobrecarregados).
 * Texto: Cole o versículo. Ele será processado pelo algoritmo de omissão de palavras.
Passo 2: Treino e Revisão (Duas formas de usar)
A. Via Agenda (Mobile/Desktop)
Clique em "✅ Confirmar e Gerar Agenda (.ics)". Importe o arquivo no seu calendário (Google/Outlook/Apple).
 * No dia da revisão, abra o evento.
 * Tente completar as lacunas mentais do texto.
 * Role a tela para baixo para conferir a resposta.
B. Via Navegador (Flashcards)
Clique diretamente nas células coloridas do Radar de Carga.
 * Uma lista de versículos do dia aparecerá.
 * Selecione um para abrir o Flashcard 3D.
 * Tente lembrar o texto oculto e clique no cartão para virá-lo e ver a resposta.
Passo 3: Gestão e Segurança
 * Backup: Seus dados ficam 100% no seu navegador (LocalStorage). Clique em "⬇ Backup" regularmente para baixar seu arquivo .json.
 * Histórico: Clique no "Badge" de versão (ex: v1.0.1) no topo da página para ver o Changelog e as novidades implementadas.
🛠️ Ficha Técnica
 * Arquitetura: Single Page Application (SPA) - Client-side only.
 * Linguagens:
   * HTML5: Estrutura semântica e Modais.
   * CSS3: Variáveis nativas, Grid Layout, Flexbox e Transformações 3D (para os cartões).
   * JavaScript (ES6+): Lógica SRS, Algoritmo de Omissão de Palavras (Regex), Manipulação de DOM e Geração de Arquivos (Blob).
 * Privacidade: Nenhum dado sai da sua máquina.
📂 Estrutura de Arquivos
 * index.html: A interface do usuário, estrutura dos Modais de Revisão e Changelog.
 * style.css: Estilização visual, incluindo animações de "Flip Card" e layout do Radar.
 * app.js: O "cérebro" do sistema. Contém o cálculo de datas SRS, lógica de Flashcards e gerador de ICS.
 * changelog.js: Arquivo de dados que centraliza o histórico de versões e melhorias do sistema.
 * README.md: Este manual.
> Desenvolvido com foco em eficiência neurológica e organização pessoal.
> 
pessoal.*
