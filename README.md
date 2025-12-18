# 🧠 NeuroBible: Sistema de Gestão de Memorização & Treino Cognitivo

> **"Não apenas agende. Treine seu cérebro de verdade."**

O **NeuroBible** é uma aplicação web focada em **Neuroaprendizagem** e **Gestão de Carga Cognitiva**.

Diferente de agendas comuns, ele evoluiu para se tornar um treinador ativo. Além de calcular *quando* revisar (usando Repetição Espaçada - SRS), ele gerencia o *como* revisar (Active Recall) e, crucialmente, *quanto* revisar, protegendo o usuário de sobrecargas mentais através de algoritmos inteligentes de redistribuição.

**Versão Atual:** v1.0.7 (Mobile PWA Edition)

---

## 📱 Novidade: NeuroBible Mobile (PWA)

A partir da versão 1.0.7, o NeuroBible é um **Progressive Web App (PWA)** completo.
* **Instalável:** Adicione à tela inicial do seu Android ou iOS para uma experiência de aplicativo nativo (tela cheia, sem barra de navegação).
* **Offline-First:** Graças ao novo *Service Worker*, o aplicativo funciona **100% sem internet**. Você pode revisar seus versículos no metrô, avião ou em áreas sem sinal.

---

## ⚙️ Engenharia de Retenção (Neurociência Aplicada)

O sistema opera sobre cinco pilares científicos e técnicos:

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
* **Ação:** Com um clique, o sistema busca automaticamente o próximo dia "Leve" (com pouca carga) na agenda futura e move o excesso para lá.

### 4. Ritmo Sustentável (Pacing)
Para garantir a constância, o usuário define seu ritmo de entrada:
* **Diário:** Alta intensidade.
* **Alternado:** Equilíbrio (dia sim, dia não).
* **Modo Leve:** Foco em meditação e descanso.

### 5. Arquitetura Offline (Service Worker)
Um "porteiro inteligente" (script em segundo plano) armazena a interface e a lógica no cache do navegador na primeira visita, garantindo acesso instantâneo e resiliência a falhas de rede.

---

## 🚀 Guia de Uso

### Instalação (Mobile)
1.  Acesse a página no Chrome (Android) ou Safari (iOS).
2.  **Android:** Toque no menu (3 pontos) > "Adicionar à tela inicial" ou "Instalar aplicativo".
3.  **iOS:** Toque em Compartilhar > "Adicionar à Tela de Início".
4.  O ícone do NeuroBible aparecerá junto aos seus outros apps.

### Passo 1: Inserção & Previsão
1.  **Dados:** Insira a referência, data e texto.
2.  **Previsão Inteligente:** Antes de salvar, observe o painel "Previsão de Revisões". Se houver dias com borda vermelha, significa que aquela data futura já está cheia.
3.  **Feedback Imediato:** Ao confirmar, o dia de hoje ("Dia 0") acenderá no Radar.

### Passo 2: Treino Diário (Flashcards)
Acesse o ícone do **Radar** e clique no dia atual (ou dias passados coloridos).
* **Interface Imersiva:** Flashcards com design limpo e ícones animados.
* **Mecânica:**
    1.  Leia o texto com lacunas ("...").
    2.  Tente recitar mentalmente.
    3.  Clique no ícone de rotação para virar o cartão e conferir a resposta.

### Passo 3: Gestão de Ritmo
* **Seletor de Planos:** Clique no ícone de "Configuração/Engrenagem" para alterar seu modo.
* **Bloqueio:** Se tentar adicionar versículos rápido demais (fora do ritmo), o botão de confirmação alertará o bloqueio.
* **Streak:** Acompanhe seu contador "🔥" para manter a disciplina.

---

## 🛠️ Ficha Técnica

* **Arquitetura:** Single Page Application (SPA) - PWA Offline-first.
* **Armazenamento:** LocalStorage (Persistência no navegador do usuário).
* **Design System:**
    * **Minimalismo:** Interface focada em conteúdo, botões "Ghost" e ícones SVG.
    * **Dark Mode:** Suporte automático.
    * **Feedback Visual:** Cores semânticas para carga (Verde/Amarelo/Vermelho).
* **Tecnologias:**
    * HTML5 Semântico + Manifest JSON.
    * CSS3 (Grid, Flexbox, Keyframe Animations, Variables).
    * JavaScript ES6+ (Service Workers, Manipulation de Datas, JSON, Blobs).

---

## 📂 Estrutura de Arquivos

* `index.html`: Interface principal, estrutura dos Modais.
* `style.css`: Estilização visual, animações, regras de Dark Mode.
* `app.js`: Lógica Core (SRS, Radar, ICS) e Registro do Service Worker.
* `manifest.json`: Arquivo de identidade para instalação Android/PWA.
* `service-worker.js`: Script de gerenciamento de cache e modo offline.
* `changelog.js`: Registro histórico das versões.
* `images/`: Diretório de assets (`logo.png`, `favicon.ico`).
* `README.md`: Documentação oficial.

---

> *Desenvolvido com foco em eficiência neurológica e organização pessoal.*
