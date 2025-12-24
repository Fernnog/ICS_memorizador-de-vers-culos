// js/flashcard.js
// Importações mantidas conforme a estrutura modular existente
import { 
    appData, currentReviewId, setCurrentReviewId, 
    cardStage, setCardStage, 
    isExplanationActive, setIsExplanationActive 
} from './core.js';
import { saveToStorage } from './storage.js';
// Importando funções de utils que são usadas na renderização
import { getAcronym, generateClozeText, getLocalDateISO, showToast } from './utils.js'; 
import { renderDashboard, updateRadar } from './ui-dashboard.js';
import { calculateSRSDates, findNextLightDay } from './srs-engine.js';

// --- ÍCONES SVG (Mantidos, podem ser úteis no futuro) ---
const ICONS = {
    target: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    bulb: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21h6"/><path d="M9 21v-4h6v4"/><path d="M12 3a9 9 0 0 0-9 9c0 4.97 9 13 9 13s9-8.03 9-13a9 9 0 0 0-9-9z"/></svg>`,
    next: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>`,
    back: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>`
};

// --- FUNÇÕES DE FLASHCARD ---

export function openDailyReview(dateStr) {
    let versesToReview = appData.verses.filter(v => v.dates.includes(dateStr));
    
    if (versesToReview.length === 0) return;

    versesToReview = versesToReview.sort(() => Math.random() - 0.5);

    const modal = document.getElementById('reviewModal');
    const listContainer = document.getElementById('reviewList');
    const title = document.getElementById('reviewTitle');
    
    document.getElementById('reviewListContainer').style.display = 'block';
    document.getElementById('flashcardContainer').style.display = 'none';
    document.getElementById('flashcardInner').classList.remove('is-flipped');
    
    const dateObj = new Date(dateStr + 'T00:00:00');
    title.innerText = `Revisão: ${dateObj.toLocaleDateString('pt-BR')}`;

    listContainer.innerHTML = versesToReview.map(v => `
        <div class="verse-item" onclick="startFlashcard(${v.id})">
            <strong>${v.ref}</strong>
            <span>▶ Treinar</span>
        </div>
    `).join('');

    modal.style.display = 'flex';
}

export function startFlashcard(verseId) {
    setCurrentReviewId(verseId);
    const verse = appData.verses.find(v => v.id === verseId);
    if (!verse) return;

    document.getElementById('reviewListContainer').style.display = 'none';
    document.getElementById('flashcardContainer').style.display = 'block';
    document.getElementById('flashcardInner').classList.remove('is-flipped');
    
    document.getElementById('cardRef').innerText = verse.ref; 
    document.getElementById('cardRefBack').innerText = verse.ref; 
    document.getElementById('cardFullText').innerText = verse.text;
    
    const hasMnemonic = verse.mnemonic && verse.mnemonic.trim().length > 0;
    setCardStage(hasMnemonic ? -1 : 0); 
    setIsExplanationActive(false); 
    
    renderCardContent(verse);
    updateHintButtonUI(); 
}

// --- LÓGICA DE RENDERIZAÇÃO COM TRANSIÇÃO SUAVE (v1.1.8) ---
function renderCardContent(verse) {
    const contentEl = document.getElementById('cardTextContent');
    const mnemonicBox = document.getElementById('mnemonicContainer');
    const explContainer = document.getElementById('explanationContainer');
    const explText = document.getElementById('cardExplanationText');
    const mnemonicText = document.getElementById('cardMnemonicText');
    const refEl = document.getElementById('cardRef');

    // 1. Atualiza visual dos dots de progresso (instantâneo)
    updateProgressBar(cardStage.value);

    // 2. Seleciona os elementos que contêm o texto a ser animado
    const animatableElements = [contentEl, mnemonicBox, explContainer];

    // 3. Aplica a classe de fading-out para iniciar a animação de saída
    animatableElements.forEach(el => el.classList.add('content-fading-out'));

    // 4. Define um timeout sincronizado com a duração da transição CSS (0.2s)
    setTimeout(() => {
        // --- Lógica de Troca de Conteúdo (similar à v1.1.7) ---
        
        // Reseta displays para garantir que apenas um esteja visível
        contentEl.style.display = 'block'; 
        mnemonicBox.style.display = 'none';
        explContainer.style.display = 'none';
        contentEl.classList.remove('blur-text'); // Remove blur do estado anterior

        if (cardStage.value === -1) { // Estágio Mnemônica
            refEl.style.display = 'none';
            if (isExplanationActive.value) {
                explContainer.style.display = 'flex';
                explText.innerText = verse.explanation || "Sem explicação cadastrada.";
                contentEl.style.display = 'none'; // Esconde o texto principal
            } else {
                mnemonicBox.style.display = 'flex';
                mnemonicText.innerText = verse.mnemonic;
                // Aplica o efeito blur no texto principal (scaffolding)
                contentEl.innerText = getAcronym(verse.text); // Necessário importar getAcronym
                contentEl.className = 'cloze-text first-letter-mode blur-text'; 
            }
        } 
        else if (cardStage.value === 0) { // Estágio Iniciais
            refEl.style.display = 'block';
            contentEl.innerText = getAcronym(verse.text); // Necessário importar getAcronym
            contentEl.className = 'cloze-text first-letter-mode';
        } 
        else if (cardStage.value === 1) { // Estágio Lacunas
            refEl.style.display = 'block';
            const clozeHTML = generateClozeText(verse.text).replace(/\n/g, '<br>'); // Necessário importar generateClozeText
            contentEl.innerHTML = `"${clozeHTML}"`;
            contentEl.className = 'cloze-text';
        }
        // --- Fim da Lógica de Troca ---

        // 5. Remove a classe de fading-out para permitir o fade-in automático via CSS
        // Usamos requestAnimationFrame para garantir que o DOM foi atualizado
        requestAnimationFrame(() => {
            animatableElements.forEach(el => el.classList.remove('content-fading-out'));
        });

    }, 200); // Duração deve ser igual à transição CSS
}

// Helper para atualizar os dots de progresso (v1.1.8)
function updateProgressBar(stage) {
    const dots = document.querySelectorAll('.progress-dot');
    dots.forEach(dot => {
        const step = parseInt(dot.getAttribute('data-step'));
        dot.className = 'progress-dot'; // Limpa todas as classes
        
        if (step === stage) {
            dot.classList.add('active'); // Destaca o atual
        } else if (step < stage) {
            dot.classList.add('completed'); // Marca os anteriores como concluídos
        }
    });
}

// --- FUNÇÕES DE CONTROLE (Mantidas e Ajustadas) ---

// Alterna a visualização entre Mnemônica e Explicação (sem mudar o estágio)
export function toggleExplanation() {
    const newVal = !isExplanationActive.value;
    setIsExplanationActive(newVal);
    
    const verse = appData.verses.find(v => v.id === currentReviewId.value);
    renderCardContent(verse); // Re-renderiza para mostrar/esconder explicação
    updateHintButtonUI(); // Atualiza botões contextuais
}

// Avança para o próximo estágio lógico do flashcard
export function advanceStage() {
    const current = cardStage.value;
    
    if (current === -1) { // Da Mnemônica para Iniciais
        setCardStage(0);
        setIsExplanationActive(false); // Garante que a explicação não fique visível no próximo estágio
    } else if (current === 0) { // Dos Iniciais para Lacunas
        setCardStage(1);
    }
    // Se já estiver em Lacunas (1), não avança mais no estágio aqui
    
    const verse = appData.verses.find(v => v.id === currentReviewId.value);
    registerInteraction(verse); // Registra o avanço como interação
    
    renderCardContent(verse); // Re-renderiza com o novo estágio
    updateHintButtonUI(); // Atualiza os botões para o novo estágio
}

export function startFlashcardFromDash(id) {
    document.getElementById('reviewModal').style.display = 'flex';
    startFlashcard(id);
}

export function registerInteraction(verse) {
    const todayISO = getLocalDateISO(new Date());
    const wasOverdue = verse.dates.some(d => d < todayISO) && verse.lastInteraction !== todayISO;

    if (verse.lastInteraction !== todayISO) {
        verse.lastInteraction = todayISO;
        saveToStorage();
        // Chama função global se existir (para sync com Firestore)
        if (window.saveVerseToFirestore) window.saveVerseToFirestore(verse); 
        
        // Atualiza o dashboard após registrar interação
        if(renderDashboard) renderDashboard(); 

        if (wasOverdue) {
            showToast("🚀 Progresso registrado! Item recuperado.", "success");
        }
    }
}

export function handleDifficulty(level) {
    const verseIndex = appData.verses.findIndex(v => v.id === currentReviewId.value);
    if (verseIndex === -1) return;
    const verse = appData.verses[verseIndex];

    registerInteraction(verse); // Garante que a interação seja registrada

    // Lógica de SRS baseada na dificuldade (mantida da v1.1.7)
    if (level === 'hard') {
        const today = new Date();
        const start = new Date(verse.startDate + 'T00:00:00');
        const diffTime = Math.abs(today - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isEndCycle = diffDays >= 50;

        if (isEndCycle) { // Se já passou muito tempo, reinicia o ciclo
            const todayISO = getLocalDateISO(new Date());
            verse.startDate = todayISO; 
            verse.dates = calculateSRSDates(todayISO); // Recalcula datas a partir de hoje
            showToast('Ciclo final falhou. Reiniciando para consolidar.', 'warning');
        } else {
            // Adiciona revisão extra no próximo dia leve disponível
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = getLocalDateISO(tomorrow);
            const recoveryDate = findNextLightDay(tomorrowStr, appData); // Usa a função para achar dia livre

            if (!verse.dates.includes(recoveryDate)) {
                verse.dates.push(recoveryDate);
                verse.dates.sort(); // Mantém datas ordenadas
                showToast(`Revisão extra agendada. Sem estresse!`, 'success');
            } else {
                showToast('Reforço já estava agendado.', 'warning');
            }
        }
    } else { // Nível 'easy' avança normalmente no SRS
        showToast('Ótimo! Segue o plano.', 'success');
        // O avanço normal de estágio ocorre ao clicar em 'Fácil' após ver a resposta
        // Precisamos avançar o estágio aqui para refletir o acerto
        if (cardStage.value < 1) { // Só avança se não estiver no último estágio
             advanceStage(); // Avança para o próximo nível cognitivo
        }
    }

    saveToStorage();
    if (window.saveVerseToFirestore) window.saveVerseToFirestore(verse);
    
    // Atualiza UI externa
    updateRadar();
    renderDashboard();
    
    // Voltar para lista após feedback (se não estiver no último estágio)
    // Se o estágio for 1 e clicou "Fácil", encerra o treino
    if (level === 'easy' && cardStage.value === 1) {
        backToList();
    } else if (level === 'hard') {
         backToList(); // Sempre volta após marcar como difícil
    }
}

export function flipCard() {
    document.getElementById('flashcardInner').classList.toggle('is-flipped');
}

export function backToList() {
    document.getElementById('reviewListContainer').style.display = 'block';
    document.getElementById('flashcardContainer').style.display = 'none';
    document.getElementById('flashcardInner').classList.remove('is-flipped');
    setCurrentReviewId(null); // Limpa o ID da revisão atual
}

export function closeReview() {
    document.getElementById('reviewModal').style.display = 'none';
    setCurrentReviewId(null); // Garante que o ID seja limpo ao fechar
}
