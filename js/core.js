// js/core.js

// --- 1. ESTADO GLOBAL (MODEL) ---
export let appData = {
    verses: [], // { id, ref, text, mnemonic, explanation, startDate, dates: [], lastInteraction: null }
    settings: { planInterval: 1 }, // 1=Diário, 2=Alternado, 3=Leve
    stats: { streak: 0, lastLogin: null } // Controle de Constância
};

// Variáveis de Controle de Interface (Estado Volátil)
export let currentReviewId = { value: null }; // Objeto para manter referência
export let cardStage = { value: 0 }; // -1: Mnemônica, 0: Iniciais, 1: Lacunas
export let isExplanationActive = { value: false }; 
export let editingVerseId = { value: null }; // ID sendo editado
export let pendingVerseData = { value: null }; // Dados aguardando confirmação (conflito)

// --- 2. MANIPULADORES DE ESTADO (SETTERS) ---

// Atualiza o appData completo (usado pelo Storage)
export function setAppData(newData) {
    if (newData.verses) appData.verses = newData.verses;
    if (newData.settings) appData.settings = newData.settings;
    if (newData.stats) appData.stats = newData.stats;
}

// Helpers para atualizar variáveis primitivas exportadas (necessário em ES Modules)
export function setEditingVerseId(id) { editingVerseId.value = id; }
export function setPendingVerseData(data) { pendingVerseData.value = data; }
export function setCurrentReviewId(id) { currentReviewId.value = id; }
export function setCardStage(val) { cardStage.value = val; }
export function setIsExplanationActive(val) { isExplanationActive.value = val; }

// --- 3. CRUD LÓGICO (Manipulação de Array) ---

export function addVerseToState(newVerse) {
    appData.verses.push(newVerse);
}

export function updateVerseInState(updatedVerse) {
    const index = appData.verses.findIndex(v => v.id === updatedVerse.id);
    if (index !== -1) {
        appData.verses[index] = updatedVerse;
    }
}

export function deleteVerseFromState(id) {
    const index = appData.verses.findIndex(v => v.id === id);
    if (index !== -1) {
        const deleted = appData.verses.splice(index, 1);
        return { index, item: deleted[0] }; // Retorna para possibilitar UNDO
    }
    return null;
}

export function restoreVerseToState(index, item) {
    appData.verses.splice(index, 0, item);
}

// --- 4. SANITY CHECK (Validação de Dados) ---
// Retorna true se houve alteração nos dados (sinalizando necessidade de salvar)
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

    if (dataChanged) {
        console.log('[System] Migração de dados (Sanity Check) realizada.');
    }
    
    return dataChanged; // O main.js decidirá se salva
}
