// js/flashcard.js
import { 
    appData, currentReviewId, setCurrentReviewId, 
    cardStage, setCardStage, 
    isExplanationActive, setIsExplanationActive 
} from './core.js';
import { saveToStorage } from './storage.js';
import { getAcronym, generateClozeText, getLocalDateISO, showToast } from './utils.js';
import { renderDashboard, updateRadar } from './ui-dashboard.js';
import { calculateSRSDates, findNextLightDay } from './srs-engine.js';

// --- ÍCONES SVG ---
const ICONS = {
    target: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    bulb: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21h6"/><path d="M9 21v-4h6v4"/><path d="M12 3a9 9 0 0 0-9 9c0 4.97 9 13 9 13s9-8.03 9-13a9 9 0 0 0-9-9z"/></svg>`
};

// --- FLASHCARD LOGIC ---

export function openDailyReview(dateStr) {
    let versesToReview = appData.verses.filter(v => v.dates.includes(dateStr));
    
    if (versesToReview.length === 0) return;

    // Embaralha (Interleaving)
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
    
    document.getElementById('explanationContainer').style.display = 'none';

    const hasMnemonic = verse.mnemonic && verse.mnemonic.trim().length > 0;
    setCardStage(hasMnemonic ? -1 : 0);
    setIsExplanationActive(false); 
    
    renderCardContent(verse);
    updateHintButtonUI(); 
}

export function startFlashcardFromDash(id) {
    document.getElementById('reviewModal').style.display = 'flex';
    startFlashcard(id);
}

// Lógica de Renderização com Animação (V1.1.6)
function renderCardContent(verse) {
    const contentEl = document.getElementById('cardTextContent');
    const mnemonicBox = document.getElementById('mnemonicContainer');
    const refEl = document.getElementById('cardRef');
    const explContainer = document.getElementById('explanationContainer');
    const explText = document.getElementById('cardExplanationText');
    const mnemonicText = document.getElementById('cardMnemonicText');

    // Aplica classe de fade-out para suavizar (se houver CSS correspondente)
    // Para simplificar aqui, fazemos a troca direta, mas preparei o terreno.
    
    contentEl.classList.remove('blur-text');
    mnemonicBox.style.display = 'none';
    explContainer.style.display = 'none';
    contentEl.style.display = 'block';

    if (cardStage.value === -1) {
        // --- ESTÁGIO -1: MNEMÔNICA ---
        refEl.style.display = 'none';
        
        if (isExplanationActive.value) {
            // MOSTRA A EXPLICAÇÃO (Substituindo a Mnemônica)
            explContainer.style.display = 'flex'; // Flex para centralizar
            explText.innerText = verse.explanation || "Sem explicação cadastrada.";
            mnemonicBox.style.display = 'none'; 
        } else {
            // MOSTRA A MNEMÔNICA NORMAL
            mnemonicBox.style.display = 'flex';
            explContainer.style.display = 'none';
            mnemonicText.innerText = verse.mnemonic;
        }

        contentEl.innerText = getAcronym(verse.text);
        contentEl.className = 'cloze-text first-letter-mode blur-text'; 
    } 
    else if (cardStage.value === 0) {
        // --- ESTÁGIO 0: ACRÔNIMO ---
        refEl.style.display = 'block';
        contentEl.innerText = getAcronym(verse.text);
        contentEl.className = 'cloze-text first-letter-mode';
    } 
    else if (cardStage.value === 1) {
        // --- ESTÁGIO 1: CLOZE ---
        refEl.style.display = 'block';
        const clozeHTML = generateClozeText(verse.text).replace(/\n/g, '<br>');
        contentEl.innerHTML = `"${clozeHTML}"`;
        contentEl.className = 'cloze-text';
    }
}

// Lógica de Bifurcação (V1.1.6)
function updateHintButtonUI() {
    // Usaremos a área dinâmica se você atualizou o HTML, senão, fallback para o botão antigo
    const btn = document.getElementById('btnHint'); 
    const verse = appData.verses.find(v => v.id === currentReviewId.value);
    const hasExplanation = verse && verse.explanation && verse.explanation.trim().length > 0;
    
    if (cardStage.value === -1) {
        btn.style.display = 'inline-flex';
        
        if (!isExplanationActive.value && hasExplanation) {
            // V1.1.6: Aqui poderíamos injetar dois botões se o HTML permitisse.
            // Mantendo compatível com botão único:
            btn.innerHTML = `${ICONS.bulb} <span>Não entendi a cena (Ver Explicação)</span>`;
        } else {
            btn.innerHTML = `${ICONS.target} <span>Agora entendi (Ver Texto)</span>`;
        }
    } else if (cardStage.value === 0) {
        btn.style.display = 'inline-flex';
        btn.innerHTML = `${ICONS.bulb} <span>Preciso de uma dica</span>`;
    } else {
        btn.style.display = 'none';
    }
}

export function showHintStage() {
    const verse = appData.verses.find(v => v.id === currentReviewId.value);
    if(!verse) return;

    if (cardStage.value === -1) {
        const hasExplanation = verse.explanation && verse.explanation.trim().length > 0;
        
        // Se tem explicação e ela ainda não está ativa -> Ativa Explicação
        if (hasExplanation && !isExplanationActive.value) {
            setIsExplanationActive(true);
            renderCardContent(verse);
            updateHintButtonUI();
            return; 
        }
        
        // Avança para texto
        setCardStage(0); 
        setIsExplanationActive(false);
    } else if (cardStage.value === 0) {
        setCardStage(1); 
    }
    
    registerInteraction(verse); 
    renderCardContent(verse);
    updateHintButtonUI();
}

export function registerInteraction(verse) {
    const todayISO = getLocalDateISO(new Date());
    const wasOverdue = verse.dates.some(d => d < todayISO) && verse.lastInteraction !== todayISO;

    if (verse.lastInteraction !== todayISO) {
        verse.lastInteraction = todayISO;
        saveToStorage();
        if (window.saveVerseToFirestore) window.saveVerseToFirestore(verse);
        
        renderDashboard(); 

        if (wasOverdue) {
            showToast("🚀 Progresso registrado! Item recuperado.", "success");
        }
    }
}

export function handleDifficulty(level) {
    const verseIndex = appData.verses.findIndex(v => v.id === currentReviewId.value);
    if (verseIndex === -1) return;
    const verse = appData.verses[verseIndex];

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
            const recoveryDate = findNextLightDay(tomorrowStr, appData);

            if (!verse.dates.includes(recoveryDate)) {
                verse.dates.push(recoveryDate);
                verse.dates.sort();
                showToast(`Revisão extra agendada. Sem estresse!`, 'success');
            } else {
                showToast('Reforço já estava agendado.', 'warning');
            }
        }
    } else {
        showToast('Ótimo! Segue o plano.', 'success');
    }

    saveToStorage();
    if (window.saveVerseToFirestore) window.saveVerseToFirestore(verse);
    
    updateRadar();
    renderDashboard();
    backToList();
}

export function flipCard() {
    document.getElementById('flashcardInner').classList.toggle('is-flipped');
}

export function backToList() {
    document.getElementById('reviewListContainer').style.display = 'block';
    document.getElementById('flashcardContainer').style.display = 'none';
    document.getElementById('flashcardInner').classList.remove('is-flipped');
}

export function closeReview() {
    document.getElementById('reviewModal').style.display = 'none';
}
