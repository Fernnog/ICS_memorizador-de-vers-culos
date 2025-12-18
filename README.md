# 🧠 NeuroBible: Sistema de Gestão de Memorização Bíblica

> **"Não apenas agende. Memorize de verdade."**

O **NeuroBible** é uma aplicação web focada em **Neuroaprendizagem** e **Gestão de Carga Cognitiva**. Diferente de geradores de agenda comuns, ele não trata todos os dias como iguais. Ele utiliza princípios científicos de *Repetição Espaçada (SRS - Spaced Repetition System)* para calcular o momento exato em que seu cérebro precisa revisar um versículo para maximizar a retenção com o mínimo de esforço.

---

## 🎯 O Propósito
A memorização de textos longos ou múltiplos versículos frequentemente falha por dois motivos:
1.  **A Curva do Esquecimento:** Revisamos muito cedo (perda de tempo) ou muito tarde (o conteúdo já foi esquecido).
2.  **Sobrecarga Cognitiva:** Acumulamos revisões excessivas em dias específicos, gerando frustração e abandono do hábito.

O **NeuroBible** resolve isso atuando como um "Controlador de Tráfego Aéreo" para sua memória, garantindo que você revise o conteúdo certo, na hora certa, sem "engarrafar" sua agenda.

---

## ⚙️ Como Funciona a "Engenharia de Retenção"

Esta é a parte vital do sistema. Ao invés de repetir um evento "toda sexta-feira" (o que é ineficiente para o cérebro), o sistema gera uma série de eventos únicos baseados em intervalos expandidos.

### 1. O Algoritmo de Repetição Espaçada (SRS)
O sistema projeta 7 revisões estratégicas para cada versículo ao longo de 60 dias. A lógica segue a **Curva de Esquecimento de Ebbinghaus**:

| Revisão | Intervalo (Dias) | Objetivo Cognitivo |
| :--- | :--- | :--- |
| **1ª Rev** | **Dia +1** | **Fixação Imediata:** Impede que a memória de curto prazo se dissipe após a leitura inicial. |
| **2ª Rev** | **Dia +3** | **Recordação Ativa:** Força o cérebro a buscar a informação quando ela começa a ficar "nebulosa". |
| **3ª Rev** | **Dia +7** | **Consolidação Semanal:** Move a informação para zonas de memória de médio prazo. |
| **4ª Rev** | **Dia +14** | **Teste de Resistência:** Verifica a integridade da memória após uma semana sem contato. |
| **5ª Rev** | **Dia +21** | **Hábito Mental:** O versículo começa a se tornar parte do vocabulário natural. |
| **6ª Rev** | **Dia +30** | **Manutenção Mensal:** Reforço para evitar degradação lenta. |
| **7ª Rev** | **Dia +60** | **Memória de Longo Prazo:** Confirmação final da fixação profunda. |

> **Nota:** Ao gerar o arquivo `.ics`, o sistema cria eventos individuais nessas datas exatas. Isso permite que você mova *apenas* a revisão do Dia +14, por exemplo, sem quebrar a lógica das outras.

### 2. O Radar de Carga Cognitiva (Heatmap)
Antes de você se comprometer com um novo versículo, o sistema analisa o futuro.
* Ele verifica seu **Histórico** (versículos adicionados anteriormente).
* Ele simula o **Novo Versículo** (as 7 datas calculadas acima).
* Ele soma tudo e apresenta um **Mapa de Calor**:

* 🟢 **Verde (Leve):** 1 a 2 revisões no dia. Dia tranquilo.
* 🟡 **Amarelo (Moderado):** 3 a 5 revisões. Requer atenção, mas é gerenciável.
* 🔴 **Vermelho (Pesado):** 6+ revisões. **Alerta de Perigo.** O sistema sugere visualmente que você não inicie um novo ciclo que caia neste dia para evitar estresse mental.

---

## 🚀 Guia de Uso

### Passo 1: Inserção de Dados
1.  **Referência:** Digite o local do texto (ex: *Salmos 23*).
2.  **Data de Início:** Escolha quando quer começar.
    * *Observe o Radar abaixo enquanto muda a data!* Se muitos dias ficarem vermelhos, tente iniciar em outro dia da semana.
3.  **Texto:** Cole o versículo completo. Ele será salvo na descrição do evento da agenda.

### Passo 2: Confirmação e Agenda
1.  Clique em **"Confirmar e Gerar Agenda (.ics)"**.
2.  O sistema fará o download de um arquivo (ex: `plano_estudo_salmos_23.ics`).
3.  Abra este arquivo no seu calendário favorito (Google Calendar, Outlook, Apple Calendar) para importar as datas automaticamente.

### Passo 3: Gestão e Backup (Importante!)
Como esta aplicação roda 100% no seu navegador (sem servidores na nuvem para proteger sua privacidade), seus dados ficam salvos na memória do navegador.
* **Para garantir segurança:** Clique em **"⬇ Backup"** regularmente. Isso baixa um arquivo `.json` com todo seu histórico.
* **Para mudar de computador:** Envie esse arquivo `.json` para a outra máquina e clique em **"⬆ Restaurar"**.

---

## 🛠️ Ficha Técnica

* **Arquitetura:** Single Page Application (SPA) - Client-side only.
* **Linguagens:**
    * **HTML5:** Estrutura semântica.
    * **CSS3:** Variáveis nativas (CSS Variables) para paleta de cores e Grid Layout para o Radar.
    * **JavaScript (ES6+):** Manipulação de datas, lógica de SRS, LocalStorage e geração de Blob (arquivos).
* **Privacidade:** Nenhum dado é enviado para a internet. Tudo acontece localmente na sua máquina.

---

## 📂 Estrutura de Arquivos

* `index.html`: A interface do usuário e estrutura.
* `style.css`: As regras visuais, cores do radar e responsividade.
* `app.js`: O "cérebro" do sistema. Contém o cálculo de datas, gestão de banco de dados local e gerador de arquivos .ics.
* `README.md`: Este manual.

---

> *Desenvolvido com foco em eficiência neurológica e organização pessoal.*
