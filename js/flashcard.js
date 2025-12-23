// js/flashcard.js - Lógica de Treino, Animações e UX
import { getAcronym, generateClozeText, getLocalDateISO, showToast } from './utils.js';
import { appData } from './core.js';
import { registerInteraction, findNextLightDay, calculateSRSDates } from './srs-engine.js';
import { updateRadar, renderDashboard, updateTable } from './ui-dashboard.js';
import { saveToStorage } from './storage.js';

// --- ESTADO LOCAL DO FLASHCARD ---
let currentReviewId = null;
let cardStage = 0; // -1: Mnemônica, 0: Iniciais, 1: Lacunas
let isExplanationActive = false; 

const ICONS = {
    target: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    bulb: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21h6"/><path d="M9 21v-4h6v4"/><path d="M12 3a9 9 0 0 0-9 9c0 4.97 9 13 9 13s9-8.03 9-13a9 9 0 0 0-9-9z"/></svg>`
};

// --- CONTROLES PÚBLICOS (Para main.js expor) ---

export function startFlashcard(verseId) {
    currentReviewId = verseId;
    const verse = appData.verses.find(v => v.id === verseId);
    if (!verse) return;

    // UI Setup
    document.getElementById('reviewListContainer').style.display = 'none';
    document.getElementById('flashcardContainer').style.display = 'block';
    document.getElementById('flashcardInner').classList.remove('is-flipped');
    
    // Conteúdo Estático
    document.getElementById('cardRef').innerText = verse.ref; 
    document.getElementById('cardRefBack').innerText = verse.ref; 
    document.getElementById('cardFullText').innerText = verse.text;
    
    // Reseta Estados
    const hasMnemonic = verse.mnemonic && verse.mnemonic.trim().length > 0;
    cardStage = hasMnemonic ? -1 : 0;
    isExplanationActive = false; 
    
    // Renderização Inicial (Sem animação para entrada imediata)
    _renderInternal(verse); 
    updateHintButtonUI(); 
}

export function flipCard() {
    document.getElementById('flashcardInner').classList.toggle('is-flipped');
}

export function backToList() {
    document.getElementById('reviewListContainer').style.display = 'block';
    document.getElementById('flashcardContainer').style.display = 'none';
    document.getElementById('flashcardInner').classList.remove('is-flipped');
}

// --- LÓGICA DE RENDERIZAÇÃO COM ANIMAÇÃO (v1.1.6) ---

function renderCardContentWithFade(verse) {
    const contentEl = document.getElementById('cardTextContent');
    const mnemonicBox = document.getElementById('mnemonicContainer');
    const explContainer = document.getElementById('explanationContainer');
    
    // 1. Fade Out
    contentEl.classList.add('card-content-hidden');
    mnemonicBox.classList.add('card-content-hidden');
    explContainer.classList.add('card-content-hidden');

    setTimeout(() => {
        // 2. Troca de Dados
        _renderInternal(verse);

        // 3. Fade In
        requestAnimationFrame(() => {
            contentEl.classList.remove('card-content-hidden');
            mnemonicBox.classList.remove('card-content-hidden');
            explContainer.classList.remove('card-content-hidden');
        });
    }, 200); // Sincronizado com CSS transition
}

function _renderInternal(verse) {
    const contentEl = document.getElementById('cardTextContent');
    const mnemonicBox = document.getElementById('mnemonicContainer');
    const mnemonicText = document.getElementById('cardMnemonicText');
    const refEl = document.getElementById('cardRef');
    const explContainer = document.getElementById('explanationContainer');
    const explText = document.getElementById('cardExplanationText');

    // Reset Display Básico
    contentEl.classList.remove('blur-text');
    mnemonicBox.style.display = 'none';
    explContainer.style.display = 'none';
    contentEl.style.display = 'block';

    if (cardStage === -1) {
        // --- ESTÁGIO -1: MNEMÔNICA ---
        refEl.style.display = 'none';
        
        if (isExplanationActive) {
            // Sub-estágio: Explicação
            explContainer.style.display = 'block';
            explText.innerText = verse.explanation || "Sem explicação cadastrada.";
            mnemonicBox.style.display = 'none'; 
        } else {
            // Sub-estágio: Mnemônica Pura
            mnemonicBox.style.display = 'flex';
            explContainer.style.display = 'none';
            mnemonicText.innerText = verse.mnemonic;
        }

        contentEl.innerText = getAcronym(verse.text);
        contentEl.className = 'cloze-text first-letter-mode blur-text'; 
    } 
    else if (cardStage === 0) {
        // --- ESTÁGIO 0: ACRÔNIMO (Hard) ---
        refEl.style.display = 'block';
        contentEl.innerText = getAcronym(verse.text);
        contentEl.className = 'cloze-text first-letter-mode';
    } 
    else if (cardStage === 1) {
        // --- ESTÁGIO 1: CLOZE (Medium) ---
        refEl.style.display = 'block';
        const clozeHTML = generateClozeText(verse.text).replace(/\n/g, '<br>');
        contentEl.innerHTML = `"${clozeHTML}"`;
        contentEl.className = 'cloze-text';
    }
}

// --- LÓGICA DE CONTROLE (BIFURCAÇÃO v1.1.6) ---

export function showHintStage() {
    const verse = appData.verses.find(v => v.id === currentReviewId);
    if(!verse) return;

    // Lógica antiga de steps lineares mantida como fallback
    if (cardStage === -1) {
        // Se tinha explicação e não estava vendo, mostra explicação
        if (verse.explanation && !isExplanationActive) {
            isExplanationActive = true;
        } else {
            // Se já estava vendo explicação OU não tem, vai para texto
            cardStage = 0; 
            isExplanationActive = false;
        }
    } else if (cardStage === 0) {
        cardStage = 1; 
    }
    
    registerInteraction(verse); 
    renderCardContentWithFade(verse);
    updateHintButtonUI();
}

// Funções específicas da Bifurcação (Quick Skip)
function advanceToText() {
    const verse = appData.verses.find(v => v.id === currentReviewId);
    if(!verse) return;
    
    cardStage = 0; // Pula direto para iniciais
    isExplanationActive = false;
    registerInteraction(verse);
    
    renderCardContentWithFade(verse);
    updateHintButtonUI();
}

function activateExplanation() {
    const verse = appData.verses.find(v => v.id === currentReviewId);
    if(!verse) return;

    isExplanationActive = true;
    renderCardContentWithFade(verse);
    updateHintButtonUI();
}

// Atualização da UI dos Botões (Com suporte a Bifurcação)
export function updateHintButtonUI() {
    const container = document.getElementById('hintControlsArea'); // Novo container genérico
    if (!container) return; // Fallback se HTML não atualizado

    const verse = appData.verses.find(v => v.id === currentReviewId);
    const hasExplanation = verse && verse.explanation && verse.explanation.trim().length > 0;
    
    container.innerHTML = ''; // Limpa

    // 1. Cenário Bifurcação: Estágio -1 COM Explicação e explicação NÃO ativa
    if (cardStage === -1 && hasExplanation && !isExplanationActive) {
        // Botão Principal: Pular
        const btnSkip = document.createElement('button');
        btnSkip.className = 'btn-hint';
        btnSkip.innerHTML = `${ICONS.target} <span>Lembrei! (Ver Texto)</span>`;
        btnSkip.onclick = (e) => { e.stopPropagation(); advanceToText(); };
        
        // Botão Secundário: Ver Explicação
        const btnExpl = document.createElement('button');
        btnExpl.className = 'btn-ghost-accent'; // Nova classe CSS
        btnExpl.innerHTML = `${ICONS.bulb} <span>Esqueci a cena... Ver Explicação</span>`;
        btnExpl.style.marginTop = '10px';
        btnExpl.onclick = (e) => { e.stopPropagation(); activateExplanation(); };

        container.appendChild(btnSkip);
        container.appendChild(btnExpl);
    } 
    // 2. Cenário Padrão
    else {
        const btn = document.createElement('button');
        btn.className = 'btn-hint';
        btn.onclick = (e) => { e.stopPropagation(); showHintStage(); };

        if (cardStage === -1) {
            // Se estou vendo explicação, botão leva ao texto
            if (isExplanationActive) {
                 btn.innerHTML = `${ICONS.target} <span>Agora entendi (Ver Texto)</span>`;
            } else {
                 // Sem explicação cadastrada
                 btn.innerHTML = `${ICONS.target} <span>Ver Texto</span>`;
            }
        } else if (cardStage === 0) {
            btn.innerHTML = `${ICONS.bulb} <span>Preciso de uma dica</span>`;
        } else {
            btn.style.display = 'none';
        }
        
        if (cardStage !== 1) container.appendChild(btn);
    }
}

// --- FEEDBACK DE DIFICULDADE (SRS) ---

export function handleDifficulty(level) {
    const verse = appData.verses.find(v => v.id === currentReviewId);
    if (!verse) return;

    registerInteraction(verse);

    if (level === 'hard') {
        const today = new Date();
        const start = new Date(verse.startDate + 'T00:00:00');
        const diffTime = Math.abs(today - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isEndCycle = diffDays >= 50;

        if (isEndCycle) {
            const todayISO = getLocalDateISO(new Date());
            verse.startDate = todayISO; 
            verse.dates = calculateSRSDates(todayISO);
            showToast('Ciclo final falhou. Reiniciando para consolidar.', 'warning');
        } else {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = getLocalDateISO(tomorrow);
            const recoveryDate = findNextLightDay(tomorrowStr);

            if (!verse.dates.includes(recoveryDate)) {
                verse.dates.push(recoveryDate);
                verse.dates.sort();
                
                const d = new Date(recoveryDate + 'T00:00:00');
                const fmtDate = d.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
                showToast(`Revisão extra agendada para ${fmtDate}. Sem estresse!`, 'success');
            } else {
                showToast('Reforço já estava agendado. Mantenha o foco!', 'warning');
            }
        }
    } else {
        showToast('Ótimo! Segue o plano.', 'success');
    }

    saveToStorage();
    if (window.saveVerseToFirestore) window.saveVerseToFirestore(verse);
    
    // Atualiza todo o sistema
    updateRadar();
    renderDashboard();
    backToList();
}
