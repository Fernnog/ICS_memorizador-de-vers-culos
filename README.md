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
* **Alcance:** O radar projeta os próximos **63 dias (9 semanas)**.
* **Ação:** O Radar é **clicável**. Ao clicar em um dia, você abre imediatamente o painel de revisão com os Flashcards daquela data.

---

## 🚀 Guia de Uso

### Passo 1: Inserção de Dados
1.  **Referência:** Digite o local do texto (ex: *João 3:16*).
2.  **Data de Início:** Escolha quando começar.
3.  **Texto:** Cole o versículo completo. O sistema processará automaticamente as lacunas para o treino.

### Passo 2: Monitoramento e Treino

A interface foi desenhada para foco total. Utilize os ícones no topo:

* **Ícone de Radar (Activity):** Abre o mapa de calor de 63 dias. Se houver um **ponto vermelho** no ícone, significa que há revisões pendentes para hoje.
* **Ícone de Download:** Faz o backup dos seus dados (`.json`).
* **Ícone de Upload:** Restaura seus dados de outro dispositivo.

**Para Treinar (Modo Flashcards):**
1.  Clique no ícone do **Radar**.
2.  Identifique os dias coloridos.
3.  Clique no dia desejado para abrir os cartões.
4.  Use o **Flashcard 3D**: Tente lembrar o texto oculto e clique no cartão para virá-lo e conferir se acertou.

### Passo 3: Integração com Agenda
* Clique no botão principal **"✅ Confirmar e Gerar Agenda (.ics)"**.
* Importe o arquivo no seu Google Calendar, Outlook ou Apple Calendar.
* Nas datas agendadas, você receberá notificações para reforçar o treino fora da aplicação.

---

## 🛠️ Ficha Técnica

* **Arquitetura:** Single Page Application (SPA) - Client-side only (Offline-first).
* **Design System:** * **Minimalismo:** Interface limpa focada em conteúdo.
    * **Dark Mode:** Suporte automático a temas escuros (`prefers-color-scheme`).
    * **Ícones:** SVG Vetoriais para máxima nitidez em qualquer tela.
* **Linguagens:**
    * **HTML5:** Estrutura semântica e Modais interativos.
    * **CSS3:** Variáveis CSS (`:root`), Grid Layout, Flexbox e Transformações 3D.
    * **JavaScript (ES6+):** Lógica SRS, Regex para geração de lacunas (Cloze Deletion) e manipulação de arquivos Blob.
* **Privacidade:** Nenhum dado é enviado para servidores externos. Tudo reside na sua máquina (LocalStorage).

---

## 📂 Estrutura de Arquivos

* `index.html`: Interface principal, estrutura do novo Header e Modais (Radar, Changelog e Flashcards).
* `style.css`: Estilização visual, regras de Dark Mode e animações 3D.
* `app.js`: O núcleo lógico. Gerencia o banco de dados local, cálculos de 63 dias e geração de arquivos .ics.
* `changelog.js`: Base de dados do histórico de versões.
* `README.md`: Este manual de documentação.

---

> *Desenvolvido com foco em eficiência neurológica e organização pessoal.*
