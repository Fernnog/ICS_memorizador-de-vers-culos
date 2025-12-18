# 🧠 NeuroBible: Sistema de Gestão de Memorização & Treino Cognitivo

> **"Não apenas agende. Treine seu cérebro de verdade."**

O **NeuroBible** é uma aplicação web focada em **Neuroaprendizagem** e **Gestão de Carga Cognitiva**.

Diferente de agendas comuns, ele evoluiu para se tornar um treinador ativo. Além de calcular *quando* revisar (usando Repetição Espaçada - SRS), ele gerencia o *como* revisar (Active Recall) e, crucialmente, *quanto* revisar, protegendo o usuário de sobrecargas mentais através de algoritmos inteligentes de redistribuição.

---

## 🎯 O Propósito

A memorização de longo prazo falha quando há **Passividade** (apenas ler) ou **Burnout** (excesso de conteúdo).

O **NeuroBible** resolve isso atuando como um "Personal Trainer" para sua memória:
1.  **Força a recuperação da memória** (Active Recall).
2.  **Agenda nos momentos críticos** (Curva de Esquecimento).
3.  **Previne a exaustão** redistribuindo cargas excessivas automaticamente.

---

## ⚙️ Engenharia de Retenção (Neurociência Aplicada)

O sistema opera sobre quatro pilares científicos:

### 1. O Algoritmo de Repetição Espaçada (SRS)
O sistema projeta **8 etapas estratégicas** de contato para cada versículo ao longo de 60 dias:
* **Intervalos:** 0 (Hoje), 1, 3, 7, 14, 21, 30, 60 dias.
* **Objetivo:** O ciclo inicia imediatamente no "Dia 0" (Plantio/Aprendizado) para feedback visual imediato, seguido por revisões que interceptam a memória logo antes dela desaparecer.

### 2. Recuperação Ativa & Omissão (Cloze Deletion)
Para evitar a leitura passiva, o sistema nunca entrega a resposta de bandeja:
* **Na Agenda (.ics):** O evento oculta palavras-chave aleatórias.
* **No Navegador (Flashcards):** Cartões interativos ocultam partes do texto, forçando o cérebro a preencher as lacunas.

### 3. Gestão de Carga & "Válvula de Escape"
O sistema monitora a saúde mental do usuário:
* **Detecção:** Se um dia acumular mais de 5 revisões, um alerta visual é disparado.
* **Ação:** Com um clique, o sistema busca automaticamente o próximo dia "Leve" (com pouca carga) na agenda futura e move o excesso para lá, garantindo que o estudo nunca se torne um fardo.

### 4. Ritmo Sustentável (Pacing)
Para garantir a constância, o usuário define seu ritmo de entrada:
* **Diário:** Alta intensidade.
* **Alternado:** Equilíbrio (dia sim, dia não).
* **Modo Leve:** Foco em meditação e descanso.

---

## 🚀 Guia de Uso

### Passo 1: Inserção & Previsão
1.  **Dados:** Insira a referência, data e texto.
2.  **Previsão Inteligente:** Antes de salvar, observe o painel "Previsão de Revisões". Se houver dias com borda vermelha, significa que aquela data futura já está cheia.
3.  **Feedback Imediato:** Ao confirmar, o dia de hoje ("Dia 0") acenderá no Radar, confirmando o início do ciclo.

### Passo 2: Treino Diário (Flashcards)
Acesse o ícone do **Radar** e clique no dia atual (ou dias passados coloridos).
* **Interface Imersiva:** Flashcards com design limpo e ícones animados.
* **Mecânica:**
    1.  Leia o texto com lacunas ("...").
    2.  Tente recitar mentalmente.
    3.  Clique no ícone de rotação para virar o cartão e conferir a resposta.
* **Sobrecarga:** Se houver muitos itens, use o botão **"Passar para próximo dia leve"** que aparecerá no topo do modal.

### Passo 3: Gestão de Ritmo
* **Seletor de Planos:** Clique no ícone de "Configuração/Engrenagem" (no botão de ritmo) para alterar seu modo.
* **Bloqueio:** Se tentar adicionar versículos rápido demais (fora do ritmo), o botão de confirmação ficará vermelho temporariamente.
* **Streak:** Acompanhe seu contador "🔥" para manter a disciplina.

### Passo 4: Integração Externa (.ics)
* Clique em **"Confirmar e Gerar Agenda"** para baixar um arquivo de calendário compatível com Google Calendar, Outlook e Apple Calendar.

---

## 🛠️ Ficha Técnica

* **Arquitetura:** Single Page Application (SPA) - Client-side only (Offline-first).
* **Armazenamento:** LocalStorage (Persistência no navegador do usuário).
* **Design System:**
    * **Minimalismo:** Interface focada em conteúdo, botões "Ghost" e ícones SVG.
    * **Dark Mode:** Suporte automático.
    * **Feedback Visual:** Cores semânticas para carga (Verde/Amarelo/Vermelho) e animações CSS suaves.
* **Tecnologias:**
    * HTML5 Semântico.
    * CSS3 (Grid, Flexbox, Keyframe Animations, Variables).
    * JavaScript ES6+ (Manipulação de Datas, JSON, Blobs).

---

## 📂 Estrutura de Arquivos

* `index.html`: Interface principal, estrutura dos Modais (Radar, Review, Planos).
* `style.css`: Estilização visual, animações 3D dos cartões, regras de Dark Mode.
* `app.js`: O cérebro do sistema. Contém a lógica SRS, algoritmo de redistribuição de carga, gestão de estado e geração de .ics.
* `changelog.js`: Registro histórico das versões e melhorias.
* `README.md`: Documentação oficial.

---

> *Desenvolvido com foco em eficiência neurológica e organização pessoal.*
