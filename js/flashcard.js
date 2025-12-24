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
    
    // --- CORREÇÃO 1: Lógica do Alerta de Sobrecarga ---
    const alertBox = document.getElementById('overloadAlert');
    if (alertBox) {
        // Exibe alerta se houver muitos itens (ex: > 10)
        if (versesToReview.length > 10) {
            alertBox.style.display = 'flex';
        } else {
            alertBox.style.display = 'none';
        }
    }

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
    
    // Reseta display de explicação (garantia)
    document.getElementById('explanationContainer').style.display = 'none';

    const hasMnemonic = verse.mnemonic && verse.mnemonic.trim().length > 0;
    setCardStage(hasMnemonic ? -1 : 0);
    setIsExplanationActive(false); 
    
    renderCardContent(verse);
    updateHintButtonUI(); 
}

export function startFlashcardFromDash(id) {
    document.getElementById('reviewModal').style.display = 'flex';
    // Oculta o alerta se vier direto do dash, pois é apenas 1 item
    const alertBox = document.getElementById('overloadAlert');
    if(alertBox) alertBox.style.display = 'none';
    
    startFlashcard(id);
}

// Lógica de Renderização
function renderCardContent(verse) {
    const contentEl = document.getElementById('cardTextContent');
    const mnemonicBox = document.getElementById('mnemonicContainer');
    const mnemonicText = document.getElementById('cardMnemonicText');
    const refEl = document.getElementById('cardRef');
    const explContainer = document.getElementById('explanationContainer');
    const explText = document.getElementById('cardExplanationText');

    contentEl.classList.remove('blur-text');
    mnemonicBox.style.display = 'none';
    explContainer.style.display = 'none';
    contentEl.style.display = 'block';

    if (cardStage.value === -1) {
        // --- ESTÁGIO -1: MNEMÔNICA ---
        refEl.style.display = 'none';
        
        if (isExplanationActive.value) {
            // MOSTRA A EXPLICAÇÃO
            // --- CORREÇÃO 3: Usar 'block' para manter fluxo de texto correto ---
            explContainer.style.display = 'block'; 
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

function updateHintButtonUI() {
    const btn = document.getElementById('btnHint'); 
    const verse = appData.verses.find(v => v.id === currentReviewId.value);
    const hasExplanation = verse && verse.explanation && verse.explanation.trim().length > 0;
    
    if (cardStage.value === -1) {
        btn.style.display = 'inline-flex';
        
        if (!isExplanationActive.value && hasExplanation) {
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
                
                // Formata data para o usuário
                const d = new Date(recoveryDate + 'T00:00:00');
                const fmtDate = d.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
                showToast(`Revisão extra agendada para ${fmtDate}.`, 'success');
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

// --- CORREÇÃO 2: Função de Reagendamento (Botão de Sobrecarga) ---
export function rescheduleDailyLoad() {
    // Tenta pegar a data do título do modal
    const titleEl = document.getElementById('reviewTitle');
    if (!titleEl) return;
    
    // O texto é "Revisão: DD/MM/AAAA"
    const textParts = titleEl.innerText.split(': ');
    if (textParts.length < 2) return;
    
    const dateText = textParts[1];
    const parts = dateText.split('/'); // [DD, MM, AAAA]
    const currentISODate = `${parts[2]}-${parts[1]}-${parts[0]}`; 

    const versesToMove = appData.verses.filter(v => v.dates.includes(currentISODate));
    
    if (versesToMove.length === 0) {
        showToast("Nenhum item para mover.", "warning");
        return;
    }

    if (confirm(`Deseja mover ${versesToMove.length} revisões de hoje para o próximo dia leve?`)) {
        let movedCount = 0;
        
        versesToMove.forEach(v => {
            // Remove a data do dia atual
            v.dates = v.dates.filter(d => d !== currentISODate);
            
            // Procura vaga a partir de AMANHÃ
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const nextDayISO = getLocalDateISO(tomorrow);
            
            // Usa o srs-engine para achar dia livre
            const newDate = findNextLightDay(nextDayISO, appData);
            
            v.dates.push(newDate);
            v.dates.sort();
            movedCount++;
            
            // Sync nuvem individual
            if (window.saveVerseToFirestore) window.saveVerseToFirestore(v);
        });

        saveToStorage();
        updateRadar();
        
        showToast(`${movedCount} itens reagendados com sucesso!`, 'success');
        closeReview();
    }
}
