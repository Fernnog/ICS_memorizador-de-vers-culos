# 🧠 NeuroBible: Sistema de Engenharia de Memória & Gestão Cognitiva

> **"A diferença entre ler e reter é a arquitetura do processo."**

O **NeuroBible** transcende a categoria de "agendas de versículos". É uma **Aplicação Progressiva (PWA)** desenhada sob princípios rigorosos de neurociência para transformar dados de curto prazo em sabedoria de longo prazo.

Diferente de métodos passivos, este sistema atua como um "Personal Trainer Cognitivo". Ele calcula matematicamente o momento exato em que seu cérebro está prestes a esquecer uma informação (Curva do Esquecimento) e intervém com desafios ativos, garantindo a consolidação neural com o mínimo de esforço repetitivo.

**Versão Atual:** v1.1.4 — *"Polimento, Identidade & Robustez"*

---

## 🧬 Os 4 Pilares da Neuroaprendizagem

O sistema não se baseia em "decoreba", mas em **Engenharia de Retenção**. A arquitetura do código reflete quatro estágios cognitivos distintos:

### 1. Scaffolding Inverso (O "Andaime" Mental)
O cérebro aprende melhor quando desafiado progressivamente. O NeuroBible implementa um fluxo de três estágios de dificuldade variável dentro de cada Flashcard:
*   **Estágio -1 (Visualização Mnemônica):** Antes do texto, o sistema apresenta sua "Micro-Cena" (gancho visual criado por você). O texto bíblico aparece borrado (*blur*), forçando a evocação da imagem mental.
*   **Estágio 0 (Ancoragem Hard):** O texto é removido, restando apenas as letras iniciais (Acrônimo). O esforço cognitivo aqui é máximo ("Active Recall").
*   **Estágio 1 (Preenchimento / Cloze):** Se falhar, o usuário solicita uma dica e o sistema exibe o texto com lacunas estratégicas.

### 2. Algoritmo de Repetição Espaçada (SRS)
Utilizamos uma variação otimizada do algoritmo *SuperMemo*. O ciclo de revisão é projetado para interceptar a memória pouco antes da queda:
*   **Ciclo de 8 Etapas:** 0 (Plantio), 1, 3, 7, 14, 21, 30, 60 dias.
*   **Correção de Rota:** Se o usuário sinaliza "Foi Difícil", o algoritmo ignora o calendário e reinicia o ciclo imediatamente (Reset para Dia 0), impedindo a ilusão de fluência.

### 3. Gestão de Carga & "Burnout Shield"
Memorização exige energia. O sistema protege o usuário da exaustão mental:
*   **Radar de Carga (63 Dias):** Um mapa de calor permite visualizar "tsunamis" de revisões futuras.
*   **Válvula de Escape:** Se um dia futuro acumular mais de 5 revisões, o sistema bloqueia novos agendamentos e sugere a redistribuição automática para dias "Leves".
*   **Feedback de Recuperação (v1.1.4):** Ao recuperar um item atrasado, o sistema fornece reforço positivo imediato, reduzindo a ansiedade associada a listas pendentes.

### 4. Robustez & Identidade (Polimento v1.1.4)
Um sistema de estudo precisa transmitir paz e confiança:
*   **Splash Screen:** Uma entrada elegante que oculta o carregamento de dados e prepara o ambiente mental para o estudo.
*   **Sanity Check:** Um "sistema imunológico" interno que roda a cada inicialização, corrigindo automaticamente dados legados de versões anteriores para evitar erros invisíveis.

---

## 🚀 Guia de Uso Rápido

### Passo 1: Plantio (Input)
1.  **Mnemônica (Opcional):** Crie uma cena visual absurda para a referência (ex: "Uma baleia engolindo um relógio" para Jonas 1:17).
2.  **Previsão:** O painel inferior mostra o impacto futuro. Se houver dias vermelhos (sobrecarregados), o sistema sugerirá outra data de início.

### Passo 2: O Treino (Flashcards)
Acesse o **Radar** ou o **Dashboard Diário**.
*   Tente recitar olhando apenas a Mnemônica ou as Iniciais.
*   Use o botão "Dica" (💡) apenas se travar.
*   **Julgamento:** Seja honesto. "Difícil" reinicia o ciclo. "Fácil" avança para a próxima etapa.

### Passo 3: Sincronização & Ritmo
*   O sistema opera **Offline-First** (funciona no modo avião). Assim que houver rede, ele sincroniza silenciosamente com o **Firebase Cloud**.
*   Defina seu ritmo no menu superior: "Diário" (Elite), "Alternado" (Equilíbrio) ou "Modo Leve".

---

## 🛠️ Ficha Técnica & Arquitetura

*   **Core:** Single Page Application (SPA) em Vanilla JS (ES6+).
*   **Offline Engine:** Service Workers customizados para cache de assets e shell da aplicação.
*   **Backend:** Google Firebase (Firestore para DB, Auth para identidade).
*   **Design System:** CSS3 Moderno (Variables, Flexbox, Keyframes) com suporte nativo a Dark Mode.
*   **Persistência Híbrida:** LocalStorage (rapidez imediata) + Cloud Firestore (segurança e multi-device).

### Estrutura de Arquivos
*   `index.html`: Orquestração da UI e Splash Screen.
*   `app.js`: Cérebro lógico (SRS, Sanity Checks, Manipulação do DOM).
*   `style.css`: Estilização, animações de feedback e identidade visual.
*   `firebase.js`: Camada de abstração de dados e autenticação.
*   `changelog.js`: Registro histórico e controle de versionamento da UI.
*   `manifest.json` & `service-worker.js`: Configuração PWA instalável.

---

> *"O NeuroBible não guarda o que você quer ler. Ele constrói quem você quer ser."*
