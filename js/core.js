// js/core.js - Gestão de Estado Global e Inicialização
import { getLocalDateISO } from './utils.js';
import { loadFromStorage, saveToStorage } from './storage.js'; // Assumindo que storage.js existe conforme plano

// --- 1. ESTADO GLOBAL (Singleton) ---
export let appData = {
    verses: [], 
    settings: { planInterval: 1 }, // 1=Diário, 2=Alternado, 3=Leve
    stats: { streak: 0, lastLogin: null }
};

// Variáveis de Controle de UI que precisam ser acessadas globalmente
export let globalState = {
    editingVerseId: null
};

// --- 2. INICIALIZAÇÃO E MIGRAÇÃO ---

export function initApp() {
    loadFromStorage();
    runSanityCheck();
    checkStreak();
    
    // Inicializa inputs de data com hoje (UX)
    const startDateInput = document.getElementById('startDate');
    if (startDateInput) {
        startDateInput.value = getLocalDateISO(new Date());
    }
}

function runSanityCheck() {
    let dataChanged = false;
    if (!appData.verses) appData.verses = [];

    appData.verses.forEach(v => {
        // Migração v1.1.4: Garante lastInteraction
        if (!v.hasOwnProperty('lastInteraction')) {
            v.lastInteraction = null;
            dataChanged = true;
        }
        // Migração v1.1.5: Garante explanation e mnemonic
        if (!v.hasOwnProperty('explanation')) {
            v.explanation = '';
            dataChanged = true;
        }
        if (!v.hasOwnProperty('mnemonic')) {
            v.mnemonic = ''; // Garante campo para evitar undefined
            dataChanged = true;
        }
    });

    if (dataChanged) {
        console.log('[System] Migração de dados (Sanity Check) realizada.');
        saveToStorage();
    }
}

function checkStreak() {
    const today = getLocalDateISO(new Date());
    if (!appData.stats) appData.stats = { streak: 0, lastLogin: null };
    
    const lastLogin = appData.stats.lastLogin;
    
    if (lastLogin !== today) {
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = getLocalDateISO(yesterdayDate);

        if (lastLogin === yesterdayStr) {
            appData.stats.streak++;
        } else if (lastLogin < yesterdayStr) {
            appData.stats.streak = 1;
        }
        
        appData.stats.lastLogin = today;
        saveToStorage();
    }
    
    const badge = document.getElementById('streakBadge');
    if(badge) badge.innerText = `🔥 ${appData.stats.streak}`;
}
