# 🧠 NeuroBible: Sistema de Gestão de Memorização & Treino Cognitivo

> **"Não apenas agende. Treine seu cérebro de verdade."**

O **NeuroBible** é uma aplicação web focada em **Neuroaprendizagem** e **Gestão de Carga Cognitiva**.

Diferente de agendas comuns, ele evoluiu para se tornar um treinador ativo. Além de calcular *quando* revisar (usando Repetição Espaçada - SRS), ele agora gerencia o *como* revisar, utilizando técnicas de **Recuperação Ativa (Active Recall)** e **Flashcards Interativos** para garantir a fixação profunda do conteúdo na memória de longo prazo.

---

## 🎯 O Propósito

A memorização de textos longos frequentemente falha por dois motivos principais:
1.  **Passividade:** Apenas reler o texto cria uma falsa sensação de fluência ("eu já sei isso"), mas não forma conexões neurais fortes.
2.  **Sobrecarga:** Tentar revisar tudo em um único dia gera estresse cognitivo e abandono.

O **NeuroBible** resolve isso atuando como um "Personal Trainer" para sua memória, garantindo a intensidade certa, no momento certo.

---

## ⚙️ Engenharia de Retenção (Neurociência Aplicada)

O sistema opera sobre três pilares científicos:

### 1. O Algoritmo de Repetição Espaçada (SRS)
O sistema projeta 7 revisões estratégicas para cada versículo ao longo de 60 dias, baseadas na **Curva de Esquecimento de Ebbinghaus**:
* **Intervalos:** 1, 3, 7, 14, 21, 30, 60 dias.
* **Objetivo:** Interceptar a memória logo antes dela desaparecer, reforçando o traço mnemônico.

### 2. Recuperação Ativa & Omissão (Cloze Deletion)
Para evitar a leitura passiva, o sistema nunca entrega a resposta de bandeja:
* **Na Agenda (.ics):** O evento criado oculta palavras-chave aleatórias (ex: *"O Senhor é o meu _____, nada me ______"*). A resposta completa fica oculta, acessível apenas ao rolar a tela.
* **No Navegador (Flashcards):** O modo de treino exibe o texto incompleto, forçando seu cérebro a preencher as lacunas antes de virar a carta.

### 3. O Radar de Carga Cognitiva (Heatmap Interativo)
Um mapa visual para planejar sua semana:
* **Visualização:** Cores indicam a carga do dia (🟢 Leve, 🟡 Moderado, 🔴 Pesado).
* **Ação:** O Radar é **clicável**. Ao clicar em um dia, você abre imediatamente o painel de revisão com os Flashcards daquela data.

---

## 🚀 Guia de Uso

### Passo 1: Inserção de Dados
1.  **Referência:** Digite o local do texto (ex: *João 3:16*).
2.  **Data de Início:** Escolha quando começar. Observe o Radar para evitar dias vermelhos.
3.  **Texto:** Cole o versículo completo. O sistema processará automaticamente as lacunas para o treino.

### Passo 2: Treino e Revisão (Modo Híbrido)

Você pode revisar de duas formas:

**A. Via Agenda (Mobile/Desktop)**
* Clique em **"✅ Confirmar e Gerar Agenda (.ics)"**.
* Importe o arquivo no seu Google Calendar, Outlook ou Apple Calendar.
* Nas datas agendadas, abra a notificação e tente completar o texto mentalmente antes de ler a resposta.

**B. Via Navegador (Flashcards)**
* No **Radar de Carga**, clique em qualquer dia colorido (verde, amarelo ou vermelho).
* Uma lista de revisões aparecerá. Selecione um versículo.
* Use o **Flashcard 3D**: Tente lembrar o texto oculto e clique no cartão para virá-lo e conferir se acertou.

### Passo 3: Gestão e Segurança
* **Backup:** Seus dados são salvos localmente no navegador (LocalStorage). Clique em **"⬇ Backup"** regularmente para baixar um arquivo `.json` de segurança.
* **Restaurar:** Use o botão de restauração para carregar seus dados em outro computador ou navegador.

---

## 🛠️ Ficha Técnica

* **Arquitetura:** Single Page Application (SPA) - Client-side only (Offline-first).
* **Linguagens:**
    * **HTML5:** Estrutura semântica e Modais interativos.
    * **CSS3:** Variáveis, Grid Layout, Flexbox e Transformações 3D (`perspective`, `rotateY`) para os cartões.
    * **JavaScript (ES6+):** Lógica SRS, Regex para geração de lacunas (Cloze Deletion) e manipulação de arquivos Blob.
* **Privacidade:** Nenhum dado é enviado para servidores externos. Tudo reside na sua máquina.

---

## 📂 Estrutura de Arquivos

* `index.html`: Interface principal, estrutura do Radar e Modais (Changelog e Flashcards).
* `style.css`: Estilização visual, regras de cores do mapa de calor e animações.
* `app.js`: O núcleo lógico. Gerencia o banco de dados local, cálculos de datas e geração de arquivos .ics.
* `changelog.js`: Base de dados do histórico de versões e novidades do sistema.
* `README.md`: Este manual de documentação.

---

> *Desenvolvido com foco em eficiência neurológica e organização pessoal.*
