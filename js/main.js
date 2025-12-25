// js/main.js

// 1. Importações de Módulos (Core & Utils)
// NOTA: Adicionamos setAppData para atualizar o estado global ao receber dados da nuvem
import { runSanityCheck, appData, setAppData } from './core.js';
import { loadFromStorage, saveToStorage } from './storage.js';
import { initChangelog } from './changelog.js'; 
import { getLocalDateISO, showToast } from './utils.js';

// 2. Importações de Funcionalidades
import * as uiDashboard from './ui-dashboard.js';
import * as flashcardLogic from './flashcard.js';
import * as srsEngine from './srs-engine.js'; 

// --- 3. EXPOSIÇÃO GLOBAL (PONTE PARA O HTML) ---

// Funções de UI e Dashboard
window.openPlanModal = uiDashboard.openPlanModal;
window.closePlanModal = uiDashboard.closePlanModal;
window.selectPlan = uiDashboard.selectPlan;
window.openRadarModal = uiDashboard.openRadarModal;
window.closeRadarModal = uiDashboard.closeRadarModal;
window.updateRadar = uiDashboard.updateRadar; 
window.toggleHistory = uiDashboard.toggleHistory;
window.filterHistory = uiDashboard.filterHistory;
window.openChangelog = uiDashboard.openChangelog;
window.closeChangelog = uiDashboard.closeChangelog;

// NOVA FUNÇÃO v1.2.0: Toggle do Painel de Cadastro
window.toggleInputSection = uiDashboard.toggleInputSection;

// Funções de CRUD e Processamento
window.processAndGenerate = uiDashboard.processAndGenerate; 
window.startEdit = uiDashboard.startEdit;
window.saveEdit = uiDashboard.saveEdit;
window.cancelEdit = uiDashboard.cancelEdit;
window.deleteVerse = uiDashboard.deleteVerse;
window.handleUndo = uiDashboard.handleUndo;
window.clearData = uiDashboard.clearData;
window.confirmSmartReschedule = uiDashboard.confirmSmartReschedule;
window.closeConflictModal = uiDashboard.closeConflictModal;

// Funções de Flashcard (Treino)
window.openDailyReview = flashcardLogic.openDailyReview;
window.startFlashcard = flashcardLogic.startFlashcard;
window.startFlashcardFromDash = flashcardLogic.startFlashcardFromDash;
window.flipCard = flashcardLogic.flipCard;
window.showHintStage = flashcardLogic.showHintStage; // Mantido para compatibilidade
window.handleDifficulty = flashcardLogic.handleDifficulty;
window.backToList = flashcardLogic.backToList;
window.closeReview = flashcardLogic.closeReview;
window.rescheduleDailyLoad = flashcardLogic.rescheduleDailyLoad; 

// Funções de Treino (Fluxo Bifurcado v1.1.7+)
window.toggleExplanation = flashcardLogic.toggleExplanation;
window.advanceStage = flashcardLogic.advanceStage;

// Funções de Auth (Firebase)
window.openAuthModal = window.openAuthModal || function(){ document.getElementById('authModal').style.display='flex'; };
window.closeAuthModal = window.closeAuthModal || function(){ document.getElementById('authModal').style.display='none'; };

// --- 4. PONTE DE SINCRONIZAÇÃO (CLOUD -> UI) ---
// Esta função é chamada pelo firebase.js ou pelo onload quando dados chegam
window.handleCloudData = function(cloudVerses) {
    if (cloudVerses && cloudVerses.length > 0) {
        console.log('[Sync] Recebendo dados da nuvem:', cloudVerses.length, 'itens.');
        
        // 1. Atualiza o Estado Global na Memória
        setAppData({ ...appData, verses: cloudVerses });
        
        // 2. Persiste no LocalStorage (para funcionar offline na próxima vez)
        saveToStorage();
        
        // 3. Força a renderização completa da UI
        uiDashboard.updateTable();
        uiDashboard.updateRadar();
        uiDashboard.updatePacingUI();
        uiDashboard.renderDashboard();
        uiDashboard.checkStreak();
        
        // Feedback visual discreto
        if(window.showToast) window.showToast("Sincronizado com sucesso!", "success");
    } else {
        console.log('[Sync] Conectado, mas nenhum dado na nuvem.');
    }
};

// --- 5. INICIALIZAÇÃO DO SISTEMA ---

window.onload = function() {
    console.log('[System] Inicializando NeuroBible v1.2.0 Modular...');

    // A. Service Worker (PWA)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('[SW] Service Worker registrado:', reg.scope))
            .catch(err => console.error('[SW] Falha ao registrar:', err));
    }

    // B. Carregar Dados Locais
    initChangelog();
    loadFromStorage();
    
    // C. Sanity Check e Correção
    const dataWasFixed = runSanityCheck();
    if (dataWasFixed) {
        saveToStorage(); 
    }

    // D. Inicialização de UI
    const today = new Date();
    const startDateInput = document.getElementById('startDate');
    if(startDateInput) startDateInput.value = getLocalDateISO(today);

    // Listeners Reativos (Inputs)
    const refInput = document.getElementById('ref');
    if(startDateInput) startDateInput.addEventListener('change', uiDashboard.updatePreviewPanel);
    if(refInput) refInput.addEventListener('input', uiDashboard.updatePreviewPanel);

    // Renderização Inicial
    uiDashboard.checkStreak();
    uiDashboard.updateTable();
    uiDashboard.updateRadar();
    uiDashboard.updatePacingUI();
    uiDashboard.renderDashboard();

    // E. Splash Screen
    const splash = document.getElementById('splashScreen');
    const versionLabel = document.getElementById('splashVersion');
    
    if(versionLabel && window.neuroChangelog && window.neuroChangelog.length > 0) {
        versionLabel.innerText = `v${window.neuroChangelog[0].version}`;
    }

    setTimeout(() => {
        if(splash) splash.classList.add('hidden');
        setTimeout(() => { if(splash) splash.style.display = 'none'; }, 600);
    }, 1500);
    
    // F. Sync Inicial com Firebase & Fila Offline
    // Adicionado delay para garantir que auth.currentUser esteja pronto
    setTimeout(() => {
        // Tenta buscar da nuvem se estiver logado
        if (window.loadVersesFromFirestore) {
            window.loadVersesFromFirestore((cloudVerses) => {
                // CHAMA A PONTE PARA ATUALIZAR A TELA
                window.handleCloudData(cloudVerses);
            });
        }

        // Processa Fila de Offline (Sync Queue)
        if (window.processSyncQueue) {
            window.processSyncQueue();
        }

    }, 2000);
};