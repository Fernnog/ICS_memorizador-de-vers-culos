// js/core.js - Gerenciamento de Estado e Configurações Globais

// --- GESTÃO DE ESTADO (Model) ---
export let appData = {
    verses: [], // { id, ref, text, mnemonic, explanation, startDate, dates: [], lastInteraction: null }
    settings: { planInterval: 1 }, // 1=Diário, 2=Alternado, 3=Leve
    stats: { streak: 0, lastLogin: null } // Controle de Constância
};

// Variáveis de Controle de Fluxo
export const state = {
    currentReviewId: null,
    cardStage: 0, // -1: Mnemônica, 0: Iniciais (Hard), 1: Lacunas (Medium)
    isExplanationActive: false, // Controla se a explicação da cena está visível
    editingVerseId: null, // Controla qual ID está sendo editado
    pendingVerseData: null // Dados temporários para conflito de agenda
};

// --- ÍCONES SVG COMPARTILHADOS ---
export const ICONS = {
    target: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    bulb: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21h6"/><path d="M9 21v-4h6v4"/><path d="M12 3a9 9 0 0 0-9 9c0 4.97 9 13 9 13s9-8.03 9-13a9 9 0 0 0-9-9z"/></svg>`
};

// --- SETTERS PARA ATUALIZAR ESTADO (Helper para imports) ---
export function setAppData(newData) {
    // Mantém a referência do objeto, mas atualiza propriedades
    if (newData.verses) appData.verses = newData.verses;
    if (newData.settings) appData.settings = newData.settings;
    if (newData.stats) appData.stats = newData.stats;
}

// --- SANITY CHECK (Migração de Dados) ---
export function runSanityCheck() {
    let dataChanged = false;
    if (!appData.verses) appData.verses = [];

    appData.verses.forEach(v => {
        // Migração v1.1.4: Garante lastInteraction
        if (!v.hasOwnProperty('lastInteraction')) {
            v.lastInteraction = null;
            dataChanged = true;
        }
        // Migração Edit Mode: Garante explanation
        if (!v.hasOwnProperty('explanation')) {
            v.explanation = '';
            dataChanged = true;
        }
    });

    return dataChanged;
}

// --- REGISTRO DO SERVICE WORKER ---
export function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('[System] SW registrado:', reg.scope))
            .catch(err => console.error('[System] Falha no SW:', err));
    }
}
