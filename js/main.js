// js/main.js

// 1. Importações de Módulos (Core & Utils)
import { runSanityCheck, appData, setAppData } from './core.js';
import { loadFromStorage, saveToStorage } from './storage.js';
// ATUALIZADO: Importando systemChangelog para versionamento automático
import { initChangelog, systemChangelog } from './changelog.js'; 
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

// NOVA FUNÇÃO v1.2.2 (Áudio)
window.toggleAudio = flashcardLogic.toggleAudio;

// Funções de Auth (Firebase)
window.openAuthModal = window.openAuthModal || function(){ document.getElementById('authModal').style.display='flex'; };
window.closeAuthModal = window.closeAuthModal || function(){ document.getElementById('authModal').style.display='none'; };

// --- 4. PONTE DE SINCRONIZAÇÃO (CLOUD -> UI) ---
// Esta função é chamada pelo firebase.js ou pelo onload quando dados chegam
// ATUALIZADO v1.2.1: Agora recebe payload completo (verses, settings, stats)
window.handleCloudData = function(payload) {
    // payload agora contém { verses, settings, stats }
    // Se o firebase antigo chamar apenas com array, tratamos isso (compatibilidade)
    const cloudVerses = Array.isArray(payload) ? payload : payload.verses;
    const cloudSettings = payload.settings;
    const cloudStats = payload.stats;

    if (cloudVerses) {
        console.log('[Sync] Recebendo pacote completo da nuvem.');
        
        // 1. Prepara o novo estado mesclando com o atual
        const newState = { 
            ...appData, 
            verses: cloudVerses 
        };

        // 2. Se vieram configurações da nuvem, aplica (prioridade nuvem)
        // Isso corrige o bug do "Perfil Equilibrado" resetar
        if (cloudSettings) {
            newState.settings = cloudSettings;
        }

        // 3. Se vieram stats da nuvem, aplica
        // Isso corrige o bug do "Streak Zerado"
        if (cloudStats) {
            // Lógica de segurança simples: confia na nuvem se local for zero ou menor
            if (!appData.stats || cloudStats.streak > (appData.stats.streak || 0)) {
                newState.stats = cloudStats;
            }
        }
        
        // 4. Atualiza Estado Global na Memória
        setAppData(newState);
        
        // 5. Persiste no LocalStorage (para funcionar offline na próxima vez)
        saveToStorage();
        
        // 6. Força a renderização completa da UI
        uiDashboard.updateTable();
        uiDashboard.updateRadar();
        uiDashboard.updatePacingUI(); // Agora refletirá o Perfil correto
        uiDashboard.checkStreak();   // Agora refletirá o Streak correto
        uiDashboard.renderDashboard();
        
        // Feedback visual discreto
        if(window.showToast) window.showToast("Sincronizado com sucesso!", "success");
    } else {
        console.log('[Sync] Conectado, mas nenhum dado na nuvem.');
    }
};

// --- 5. INICIALIZAÇÃO DO SISTEMA ---

window.onload = function() {
    // ATUALIZADO v1.2.1: Versionamento automático via Changelog
    const currentVersion = systemChangelog.length > 0 ? systemChangelog[0].version : 'Dev';
    console.log(`[System] Inicializando NeuroBible v${currentVersion} Modular...`);

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
            window.loadVersesFromFirestore((cloudPayload) => {
                // CHAMA A PONTE PARA ATUALIZAR A TELA (Payload Completo)
                window.handleCloudData(cloudPayload);
            });
        }

        // Processa Fila de Offline (Sync Queue)
        if (window.processSyncQueue) {
            window.processSyncQueue();
        }

    }, 2000);
};
