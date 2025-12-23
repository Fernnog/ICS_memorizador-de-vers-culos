// js/flashcard.js
// Responsável pela lógica de treino, animações e bifurcação de fluxo.

import { appData, registerInteraction, saveToStorage, getLocalDateISO } from './core.js';
import { calculateSRSDates, findNextLightDay } from './srs-engine.js';
import { ICONS, renderDashboard, updateRadar } from './ui-dashboard.js';
import { generateClozeText, getAcronym } from './utils.js'; // Assumindo utils simples

// Estado Local do Flashcard
let currentReviewId = null;
let cardStage = 0; // -1: Mnemônica, 0: Iniciais, 1: Lacunas
let isExplanationActive = false;

// --- CONTROLES DE ABERTURA ---
export function openDailyReview(dateStr) {
    let versesToReview = appData.verses.filter(v => v.dates.includes(dateStr));
    
    if (versesToReview.length === 0) return;

    // Embaralhamento (Interleaving)
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
        <div class="verse-item" data-id="${v.id}">
            <strong>${v.ref}</strong>
            <span>▶ Treinar</span>
        </div>
    `).join('');

    // Listeners
    listContainer.querySelectorAll('.verse-item').forEach(el => {
        el.addEventListener('click', () => startFlashcard(parseInt(el.dataset.id)));
    });

    modal.style.display = 'flex';
}

export function startFlashcardFromDash(id) {
    const modal = document.getElementById('reviewModal');
    if(modal) modal.style.display = 'flex';
    startFlashcard(id);
}

export function startFlashcard(verseId) {
    currentReviewId = verseId;
    const verse = appData.verses.find(v => v.id === verseId);
    if (!verse) return;

    document.getElementById('reviewListContainer').style.display = 'none';
    document.getElementById('flashcardContainer').style.display = 'block';
    document.getElementById('flashcardInner').classList.remove('is-flipped');
    
    document.getElementById('cardRef').innerText = verse.ref; 
    document.getElementById('cardRefBack').innerText = verse.ref; 
    document.getElementById('cardFullText').innerText = verse.text;
    
    // Reset de Estado
    document.getElementById('explanationContainer').style.display = 'none';
    const hasMnemonic = verse.mnemonic && verse.mnemonic.trim().length > 0;
    
    cardStage = hasMnemonic ? -1 : 0;
    isExplanationActive = false; 
    
    // Renderiza sem fade na primeira carga
    _internalRenderLogic(verse);
    updateHintButtonUI(); 
}

// --- CORE RENDER & FADE ANIMATION ---

// Wrapper com Animação (Suavização Visual)
function renderCardContentWithFade(verse) {
    const contentEl = document.getElementById('cardTextContent');
    const mnemonicBox = document.getElementById('mnemonicContainer');
    const explContainer = document.getElementById('explanationContainer');

    // 1. Fade Out
    contentEl.classList.add('card-content-hidden');
    mnemonicBox.classList.add('card-content-hidden');
    explContainer.classList.add('card-content-hidden');

    // 2. Aguarda transição e troca conteúdo
    setTimeout(() => {
        _internalRenderLogic(verse);
        
        // 3. Fade In
        requestAnimationFrame(() => {
            contentEl.classList.remove('card-content-hidden');
            mnemonicBox.classList.remove('card-content-hidden');
            explContainer.classList.remove('card-content-hidden');
        });
    }, 200); // 200ms deve bater com o CSS transition
}

// Lógica pura de DOM (Separada da animação)
function _internalRenderLogic(verse) {
    const contentEl = document.getElementById('cardTextContent');
    const mnemonicBox = document.getElementById('mnemonicContainer');
    const mnemonicText = document.getElementById('cardMnemonicText');
    const refEl = document.getElementById('cardRef');
    const explContainer = document.getElementById('explanationContainer');
    const explText = document.getElementById('cardExplanationText');

    // Reset Defaults
    contentEl.classList.remove('blur-text');
    mnemonicBox.style.display = 'none';
    explContainer.style.display = 'none';
    contentEl.style.display = 'block';

    if (cardStage === -1) {
        // --- ESTÁGIO -1: MNEMÔNICA ---
        refEl.style.display = 'none';
        
        if (isExplanationActive) {
            // Modo Explicação Ativa
            explContainer.style.display = 'flex'; // Flex para layout correto
            explText.innerText = verse.explanation || "Sem explicação cadastrada.";
            mnemonicBox.style.display = 'none'; 
        } else {
            // Modo Mnemônica Padrão
            mnemonicBox.style.display = 'flex'; 
            explContainer.style.display = 'none';
            mnemonicText.innerText = verse.mnemonic;
        }

        contentEl.innerText = getAcronym(verse.text);
        contentEl.className = 'cloze-text first-letter-mode blur-text'; 
    } 
    else if (cardStage === 0) {
        // --- ESTÁGIO 0: ACRÔNIMO ---
        refEl.style.display = 'block';
        contentEl.innerText = getAcronym(verse.text);
        contentEl.className = 'cloze-text first-letter-mode';
    } 
    else if (cardStage === 1) {
        // --- ESTÁGIO 1: CLOZE ---
        refEl.style.display = 'block';
        const clozeHTML = generateClozeText(verse.text).replace(/\n/g, '<br>');
        contentEl.innerHTML = `"${clozeHTML}"`;
        contentEl.className = 'cloze-text';
    }
}

// --- QUICK SKIP & BIFURCAÇÃO ---

export function updateHintButtonUI() {
    const wrapper = document.getElementById('hintControlsArea');
    const verse = appData.verses.find(v => v.id === currentReviewId);
    
    if (!wrapper || !verse) return;
    
    wrapper.innerHTML = ''; // Limpa botões antigos

    // Cenário: Estágio Mnemônica (-1)
    if (cardStage === -1) {
        const hasExplanation = verse.explanation && verse.explanation.trim().length > 0;
        
        // BIFURCAÇÃO: Se tem explicação e não estou vendo ela
        if (hasExplanation && !isExplanationActive) {
            
            // Botão 1: Lembrei (Pular Explicação) - Ação Rápida
            const btnSkip = document.createElement('button');
            btnSkip.className = 'btn-hint'; // Estilo primário
            btnSkip.innerHTML = `${ICONS.target} <span>Lembrei! (Ver Texto)</span>`;
            btnSkip.onclick = (e) => { e.stopPropagation(); advanceToText(); };
            
            // Botão 2: Esqueci (Ver Explicação) - Link Ghost
            const btnExpl = document.createElement('button');
            btnExpl.className = 'btn-ghost-accent'; // Estilo secundário
            btnExpl.style.marginTop = '8px';
            btnExpl.innerHTML = `🤔 Não entendi a cena? (Ver Explicação)`;
            btnExpl.onclick = (e) => { e.stopPropagation(); activateExplanation(); };

            wrapper.appendChild(btnSkip);
            wrapper.appendChild(btnExpl);

        } else if (isExplanationActive) {
            // Se já estou vendo a explicação -> Único caminho é ver o texto
            const btnNext = document.createElement('button');
            btnNext.className = 'btn-hint';
            btnNext.innerHTML = `${ICONS.target} <span>Agora entendi (Ver Texto)</span>`;
            btnNext.onclick = (e) => { e.stopPropagation(); advanceToText(); };
            wrapper.appendChild(btnNext);

        } else {
            // Sem explicação cadastrada -> Botão padrão
            const btnNext = document.createElement('button');
            btnNext.className = 'btn-hint';
            btnNext.innerHTML = `${ICONS.target} <span>Ver Texto (Iniciais)</span>`;
            btnNext.onclick = (e) => { e.stopPropagation(); advanceToText(); };
            wrapper.appendChild(btnNext);
        }
    } 
    else if (cardStage === 0) {
        // Estágio Iniciais -> Pedir Dica (Cloze)
        const btnHint = document.createElement('button');
        btnHint.className = 'btn-hint';
        btnHint.innerHTML = `${ICONS.bulb} <span>Preciso de uma dica</span>`;
        btnHint.onclick = (e) => { e.stopPropagation(); advanceToCloze(); };
        wrapper.appendChild(btnHint);
    } 
    // Stage 1 não tem botão de dica
}

// --- HELPER ACTIONS ---

function activateExplanation() {
    isExplanationActive = true;
    const verse = appData.verses.find(v => v.id === currentReviewId);
    renderCardContentWithFade(verse);
    updateHintButtonUI();
}

function advanceToText() {
    cardStage = 0; // Vai para Iniciais
    isExplanationActive = false;
    const verse = appData.verses.find(v => v.id === currentReviewId);
    registerInteraction(verse); // Conta como interação
    renderCardContentWithFade(verse);
    updateHintButtonUI();
}

function advanceToCloze() {
    cardStage = 1; // Vai para Cloze
    const verse = appData.verses.find(v => v.id === currentReviewId);
    registerInteraction(verse);
    renderCardContentWithFade(verse);
    updateHintButtonUI();
}

// --- FLIP & FEEDBACK ---

export function flipCard() {
    document.getElementById('flashcardInner').classList.toggle('is-flipped');
}

export function handleDifficulty(level) {
    const verseIndex = appData.verses.findIndex(v => v.id === currentReviewId);
    if (verseIndex === -1) return;
    const verse = appData.verses[verseIndex];

    registerInteraction(verse);

    if (level === 'hard') {
        const todayISO = getLocalDateISO(new Date());
        // Lógica de reset simples ou algoritmo avançado (mantendo simples para exemplo)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = getLocalDateISO(tomorrow);
        
        if (!verse.dates.includes(tomorrowStr)) {
             verse.dates.push(tomorrowStr);
             verse.dates.sort();
             // Assumindo window.showToast global ou importado de core
             if(window.showToast) window.showToast('Revisão extra agendada!', 'warning');
        }
    } else {
        if(window.showToast) window.showToast('Ótimo! Segue o plano.', 'success');
    }

    saveToStorage();
    if (window.saveVerseToFirestore) window.saveVerseToFirestore(verse);
    
    updateRadar();
    renderDashboard();
    backToList();
}

export function backToList() {
    document.getElementById('reviewListContainer').style.display = 'block';
    document.getElementById('flashcardContainer').style.display = 'none';
    document.getElementById('flashcardInner').classList.remove('is-flipped');
}

export function closeReview() {
    document.getElementById('reviewModal').style.display = 'none';
}
