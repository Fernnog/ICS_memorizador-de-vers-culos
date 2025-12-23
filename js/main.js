// js/main.js - Ponto de Entrada e Glue Code
import { appData, state, initServiceWorker } from './core.js';
import { loadFromStorage, saveToStorage, saveEdit, finalizeSave, deleteVerse, clearAllData } from './storage.js';
import { calculateSRSDates, findNextLightDay, getCurrentLoadMap, getLocalDateISO, generateICSFile } from './srs-engine.js';

// Imports de UI e Flashcard (Arquivos a serem criados conforme plano)
import { 
    updateRadar, updateTable, updatePacingUI, renderDashboard, updatePreviewPanel, 
    checkStreak, initChangelog, showToast, 
    openPlanModal, closePlanModal, selectPlan,
    openRadarModal, closeRadarModal,
    openChangelog, closeChangelog, toggleHistory, filterHistory,
    startEdit, cancelEdit
} from './ui-dashboard.js';

import { 
    openDailyReview, startFlashcard, closeReview, 
    flipCard, backToList, handleDifficulty, showHintStage,
    startFlashcardFromDash
} from './flashcard.js';

// --- INICIALIZAÇÃO ---
window.onload = function() {
    initServiceWorker();
    initChangelog();
    loadFromStorage();
    
    // Configura inputs de data
    const today = new Date();
    const startDateInput = document.getElementById('startDate');
    if(startDateInput) startDateInput.value = getLocalDateISO(today);
    
    // Listeners Reativos
    const refInput = document.getElementById('ref');
    if(startDateInput) startDateInput.addEventListener('change', updatePreviewPanel);
    if(refInput) refInput.addEventListener('input', updatePreviewPanel);

    // Inicializações Lógicas UI
    checkStreak();      
    updateTable();
    updateRadar();      
    updatePacingUI();
    renderDashboard(); 

    // Splash Screen Logic
    const splash = document.getElementById('splashScreen');
    const versionLabel = document.getElementById('splashVersion');
    if(versionLabel && window.neuroChangelog && window.neuroChangelog.length > 0) {
        versionLabel.innerText = `v${window.neuroChangelog[0].version}`;
    }
    setTimeout(() => {
        if(splash) splash.classList.add('hidden');
        setTimeout(() => { if(splash) splash.style.display = 'none'; }, 600);
    }, 1500);

    // Sync Inicial Nuvem (Firebase)
    if (window.loadVersesFromFirestore) {
        setTimeout(() => {
            if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
                window.loadVersesFromFirestore((cloudVerses) => {
                    if (cloudVerses && cloudVerses.length > 0) {
                        setAppData({ ...appData, verses: cloudVerses });
                        saveToStorage(); // Salva local
                        updateTable();
                        updateRadar();
                        renderDashboard();
                        showToast('Dados sincronizados da nuvem!', 'success');
                    }
                });
            }
        }, 2000); 
    }
};

// --- EXPORTAÇÃO PARA O WINDOW (Compatibilidade HTML onclick) ---

// Funções de Processamento Principal
window.processAndGenerate = function() {
    const btn = document.getElementById('btnPacing');
    if (btn && btn.classList.contains('is-blocked')) {
        btn.style.transform = "scale(1.1)";
        setTimeout(() => btn.style.transform = "scale(1)", 200);
        showToast(`Respeite o intervalo do ciclo.`, 'warning');
        return; 
    }

    const ref = document.getElementById('ref').value.trim();
    const text = document.getElementById('text').value.trim();
    const startDate = document.getElementById('startDate').value;

    if (!ref || !startDate) {
        showToast("Preencha Referência e Data.", "error");
        return;
    }

    const reviewDates = calculateSRSDates(startDate);
    const overloadLimit = 5;
    const loadMap = getCurrentLoadMap(); // Importado de srs-engine
    const congestedDates = reviewDates.filter(d => (loadMap[d] || 0) >= overloadLimit);

    if (congestedDates.length > 0) {
        // Salva estado temporário para o modal de conflito
        state.pendingVerseData = { ref, text, startDate, dates: reviewDates };
        
        const modal = document.getElementById('conflictModal');
        const msg = document.getElementById('conflictMsg');
        msg.innerHTML = `Datas congestionadas: <b>${congestedDates.map(d=>d.split('-').reverse().slice(0,2).join('/')).join(', ')}</b>. Deseja otimizar?`;
        modal.style.display = 'flex';
        return;
    }

    const newVerse = finalizeSave(ref, text, startDate, reviewDates);
    generateICSFile(newVerse, reviewDates);
    
    // Limpeza de UI
    document.getElementById('ref').value = '';
    document.getElementById('text').value = '';
    document.getElementById('mnemonic').value = '';
    document.getElementById('explanation').value = '';
    updatePreviewPanel();
    
    showToast(`"${ref}" agendado com sucesso!`, 'success');
};

window.confirmSmartReschedule = function() {
    if(!state.pendingVerseData) return;
    const optimizedDates = state.pendingVerseData.dates.map(dateStr => findNextLightDay(dateStr));
    
    const newVerse = finalizeSave(state.pendingVerseData.ref, state.pendingVerseData.text, state.pendingVerseData.startDate, optimizedDates);
    
    generateICSFile(newVerse, optimizedDates);
    document.getElementById('conflictModal').style.display = 'none';
    state.pendingVerseData = null;
    
    // Limpeza
    document.getElementById('ref').value = '';
    document.getElementById('text').value = '';
    document.getElementById('mnemonic').value = '';
    document.getElementById('explanation').value = '';
    
    showToast('Agenda otimizada com sucesso!', 'success');
};

window.closeConflictModal = function() {
    document.getElementById('conflictModal').style.display = 'none';
    state.pendingVerseData = null;
};

// CRUD Window Mapping
window.saveEdit = function() {
    if(saveEdit()) { // Chama função importada do storage.js
        cancelEdit(); // Chama função importada da UI
        updateTable();
        renderDashboard();
        updateRadar();
        showToast('Versículo atualizado com sucesso!', 'success');
    }
};
window.deleteVerse = deleteVerse;
window.clearData = clearAllData;

// UI & Navegação Window Mapping
window.openPlanModal = openPlanModal;
window.closePlanModal = closePlanModal;
window.selectPlan = selectPlan;
window.showToast = showToast;
window.openRadarModal = openRadarModal;
window.closeRadarModal = closeRadarModal;
window.openChangelog = openChangelog;
window.closeChangelog = closeChangelog;
window.startEdit = startEdit;
window.cancelEdit = cancelEdit;
window.toggleHistory = toggleHistory;
window.filterHistory = filterHistory;
window.updateRadar = updateRadar;

// Flashcard Window Mapping
window.openDailyReview = openDailyReview;
window.startFlashcard = startFlashcard;
window.flipCard = flipCard;
window.backToList = backToList;
window.closeReview = closeReview;
window.handleDifficulty = handleDifficulty;
window.showHintStage = showHintStage;
window.startFlashcardFromDash = startFlashcardFromDash;
