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

// --- GESTÃO DE ÁUDIO v1.2.2 ---
let currentUtterance = null; 

export function stopAudio() {
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
    }
    resetAudioUI();
}

function resetAudioUI() {
    const btn = document.getElementById('btnAudioToggle');
    const iconSpeaker = document.getElementById('iconSpeaker');
    const iconStop = document.getElementById('iconStop');
    const label = document.getElementById('labelAudio');

    if (btn) {
        btn.classList.remove('is-playing');
        if(iconSpeaker) iconSpeaker.style.display = 'block';
        if(iconStop) iconStop.style.display = 'none';
        if(label) label.innerText = "Ouvir Versículo";
    }
}

export function toggleAudio() {
    // Se já estiver falando, para imediatamente
    if (window.speechSynthesis.speaking) {
        stopAudio();
        return;
    }

    const textElement = document.getElementById('cardFullText');
    if (!textElement) return;
    
    // Limpeza básica: remove espaços excessivos
    const textToRead = textElement.innerText.trim();
    if (!textToRead) return;

    // Configuração da Fala
    currentUtterance = new SpeechSynthesisUtterance(textToRead);
    currentUtterance.lang = 'pt-BR'; // Detecta voz PT-BR do sistema
    currentUtterance.rate = 0.9;     // Levemente mais lento para memorização
    currentUtterance.pitch = 1.0;

    // Eventos de Ciclo de Vida
    currentUtterance.onstart = () => {
        const btn = document.getElementById('btnAudioToggle');
        const iconSpeaker = document.getElementById('iconSpeaker');
        const iconStop = document.getElementById('iconStop');
        const label = document.getElementById('labelAudio');
        
        if(btn) {
            btn.classList.add('is-playing');
            iconSpeaker.style.display = 'none';
            iconStop.style.display = 'block';
            label.innerText = "Parar Leitura";
        }
    };

    currentUtterance.onend = () => {
        resetAudioUI();
    };

    currentUtterance.onerror = (e) => {
        console.warn("Erro TTS:", e);
        resetAudioUI();
    };

    window.speechSynthesis.speak(currentUtterance);
}

// --- ÍCONES SVG ---
const ICONS = {
    target: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    bulb: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21h6"/><path d="M9 21v-4h6v4"/><path d="M12 3a9 9 0 0 0-9 9c0 4.97 9 13 9 13s9-8.03 9-13a9 9 0 0 0-9-9z"/></svg>`,
    next: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>`,
    back: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>`
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
    
    // Reset de Estado
    const hasMnemonic = verse.mnemonic && verse.mnemonic.trim().length > 0;
    setCardStage(hasMnemonic ? -1 : 0); // Se tem mnemônica começa no -1, senão no 0
    setIsExplanationActive(false); 
    
    renderCardContent(verse);
    updateHintButtonUI(); 
    resetAudioUI(); // Garante UI limpa ao abrir novo card
}

// Lógica de Renderização com Animação
function renderCardContent(verse) {
    const contentEl = document.getElementById('cardTextContent');
    const mnemonicBox = document.getElementById('mnemonicContainer');
    const refEl = document.getElementById('cardRef');
    const explContainer = document.getElementById('explanationContainer');
    const explText = document.getElementById('cardExplanationText');
    const mnemonicText = document.getElementById('cardMnemonicText');

    // Reset visual básico
    contentEl.classList.remove('blur-text');
    mnemonicBox.style.display = 'none';
    explContainer.style.display = 'none';
    contentEl.style.display = 'block';

    if (cardStage.value === -1) {
        // --- ESTÁGIO -1: MNEMÔNICA ---
        refEl.style.display = 'none';
        
        if (isExplanationActive.value) {
            // MOSTRA A EXPLICAÇÃO
            explContainer.style.display = 'flex';
            explText.innerText = verse.explanation || "Sem explicação cadastrada.";
            mnemonicBox.style.display = 'none'; 
        } else {
            // MOSTRA A MNEMÔNICA
            mnemonicBox.style.display = 'flex';
            explContainer.style.display = 'none';
            mnemonicText.innerText = verse.mnemonic;
        }

        // Texto borrado (Scaffolding)
        contentEl.innerText = getAcronym(verse.text);
        contentEl.className = 'cloze-text first-letter-mode blur-text'; 
    } 
    else if (cardStage.value === 0) {
        // --- ESTÁGIO 0: ACRÔNIMO (Iniciais) ---
        refEl.style.display = 'block';
        contentEl.innerText = getAcronym(verse.text);
        contentEl.className = 'cloze-text first-letter-mode'; // Remove blur
    } 
    else if (cardStage.value === 1) {
        // --- ESTÁGIO 1: CLOZE (Lacunas) ---
        refEl.style.display = 'block';
        const clozeHTML = generateClozeText(verse.text).replace(/\n/g, '<br>');
        contentEl.innerHTML = `"${clozeHTML}"`;
        contentEl.className = 'cloze-text';
    }
}

// Nova Lógica de Botões Dinâmicos (Bifurcação)
function updateHintButtonUI() {
    const controlsArea = document.getElementById('hintControlsArea');
    const tapIcon = document.getElementById('tapHintIcon'); // Controle de visibilidade do flip
    
    controlsArea.innerHTML = ''; // Limpa botões anteriores
    
    const verse = appData.verses.find(v => v.id === currentReviewId.value);
    if (!verse) return;

    // --- FASE 1: MNEMÔNICA (-1) ---
    if (cardStage.value === -1) {
        // Bloqueia visualização da resposta completa nesta fase
        if(tapIcon) tapIcon.style.display = 'none';

        // Botão A: Contexto (Apenas se houver explicação)
        if (verse.explanation && verse.explanation.trim().length > 0) {
            const btnExpl = document.createElement('button');
            btnExpl.className = 'btn-ghost-accent';
            
            // Alterna texto do botão dependendo do estado
            if (isExplanationActive.value) {
                btnExpl.innerHTML = `${ICONS.back} Voltar para Cena Mnemônica`;
            } else {
                btnExpl.innerHTML = `${ICONS.bulb} Esqueci a cena (Ver Contexto)`;
            }
            
            btnExpl.onclick = (e) => { e.stopPropagation(); toggleExplanation(); };
            controlsArea.appendChild(btnExpl);
        }

        // Botão B: Avançar para Treino
        const btnNext = document.createElement('button');
        btnNext.className = 'btn-hint';
        // Texto muda se o usuário estiver vendo a explicação
        btnNext.innerHTML = isExplanationActive.value 
            ? `${ICONS.next} <span>Entendi! Ir para Iniciais</span>`
            : `${ICONS.next} <span>Lembrei! Ir para Iniciais</span>`;
            
        btnNext.onclick = (e) => { e.stopPropagation(); advanceStage(); };
        controlsArea.appendChild(btnNext);
    } 
    // --- FASE 2: INICIAIS (0) ---
    else if (cardStage.value === 0) {
        // Libera ícone de virar (flip)
        if(tapIcon) tapIcon.style.display = 'flex';

        const btnHint = document.createElement('button');
        btnHint.className = 'btn-hint';
        btnHint.innerHTML = `${ICONS.bulb} <span>Preciso de uma Dica (Lacunas)</span>`;
        btnHint.onclick = (e) => { e.stopPropagation(); advanceStage(); };
        controlsArea.appendChild(btnHint);
    } 
    // --- FASE 3: LACUNAS (1) ---
    else {
        // Apenas ícone de virar disponível
        if(tapIcon) tapIcon.style.display = 'flex';
    }
}

// Alterna apenas a visualização entre Mnemônica e Explicação (Sem avançar estágio)
// CORREÇÃO v1.1.8: Agora salva interação ao visualizar contexto
export function toggleExplanation() {
    const newVal = !isExplanationActive.value;
    setIsExplanationActive(newVal);
    
    const verse = appData.verses.find(v => v.id === currentReviewId.value);
    
    // REGISTRA A INTERAÇÃO (FIX v1.1.8)
    if (verse) {
        registerInteraction(verse);
    }
    
    renderCardContent(verse);
    updateHintButtonUI();
}

// Avança na hierarquia cognitiva (Mnemônica -> Iniciais -> Lacunas)
export function advanceStage() {
    const current = cardStage.value;
    
    if (current === -1) {
        setCardStage(0); // Vai para Iniciais
        setIsExplanationActive(false); // Reseta visualização de explicação
    } else if (current === 0) {
        setCardStage(1); // Vai para Lacunas
    }
    
    const verse = appData.verses.find(v => v.id === currentReviewId.value);
    
    // Registra interação técnica (usuário está ativo)
    registerInteraction(verse);
    
    renderCardContent(verse);
    updateHintButtonUI();
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
        if (window.saveVerseToFirestore) window.saveVerseToFirestore(verse);
        
        renderDashboard(); 

        if (wasOverdue) {
            showToast("🚀 Progresso registrado! Item recuperado.", "success");
        }
    }
}

export function handleDifficulty(level) {
    // CRÍTICO: Para o áudio antes de processar saída
    stopAudio();

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
    // CRÍTICO: Para o áudio se o usuário desvirar o cartão
    stopAudio();
    document.getElementById('flashcardInner').classList.toggle('is-flipped');
}

export function backToList() {
    // CRÍTICO: Para o áudio ao voltar para a lista
    stopAudio();

    document.getElementById('reviewListContainer').style.display = 'block';
    document.getElementById('flashcardContainer').style.display = 'none';
    document.getElementById('flashcardInner').classList.remove('is-flipped');
}

export function closeReview() {
    // CRÍTICO: Para o áudio ao fechar modal
    stopAudio();

    document.getElementById('reviewModal').style.display = 'none';
}
