// js/storage.js - Persistência e CRUD
import { appData, setAppData, runSanityCheck, state } from './core.js';
import { updateRadar, renderDashboard, updateTable, updatePacingUI, updatePreviewPanel } from './ui-dashboard.js'; 
// Nota: ui-dashboard.js contém funções de UI que serão chamadas após salvar

// --- PERSISTÊNCIA BÁSICA ---
export function saveToStorage() {
    localStorage.setItem('neuroBibleData', JSON.stringify(appData));
    // Atualiza UI globalmente após salvar
    updateRadar();
}

export function loadFromStorage() {
    const data = localStorage.getItem('neuroBibleData');
    if (data) {
        const parsed = JSON.parse(data);
        const mergedData = { 
            ...appData, 
            ...parsed,
            settings: parsed.settings || { planInterval: 1 },
            stats: parsed.stats || { streak: 0, lastLogin: null }
        };
        setAppData(mergedData);
    }
    
    if (runSanityCheck()) {
        console.log('[System] Migração de dados (Sanity Check) realizada.');
        saveToStorage();
    }
}

// --- INTEGRAÇÃO NUVEM (Bridge para firebase.js) ---
function syncWithCloud(verseOrSettings, type = 'verse') {
    if (type === 'verse' && window.saveVerseToFirestore) {
        window.saveVerseToFirestore(verseOrSettings);
    } else if (type === 'settings' && window.saveSettingsToFirestore) {
        window.saveSettingsToFirestore(verseOrSettings);
    } else if (type === 'delete' && window.handleCloudDeletion) {
        window.handleCloudDeletion(verseOrSettings);
    }
}

// --- OPERAÇÕES DE CRUD ---

export function finalizeSave(ref, text, startDate, reviewDates) {
    const mnemonic = document.getElementById('mnemonic').value.trim();
    const explanation = document.getElementById('explanation').value.trim();

    const newVerse = {
        id: Date.now(),
        ref: ref,
        text: text,
        mnemonic: mnemonic,
        explanation: explanation,
        startDate: startDate,
        dates: reviewDates,
        lastInteraction: null 
    };
    
    appData.verses.push(newVerse);
    saveToStorage();
    syncWithCloud(newVerse, 'verse');

    // Atualiza toda a UI
    updateTable();
    updateRadar();
    updatePacingUI();
    renderDashboard();

    return newVerse; // Retorna para gerar ICS se necessário
}

export function saveEdit() {
    if(!state.editingVerseId) return;
    
    const verseIndex = appData.verses.findIndex(v => v.id === state.editingVerseId);
    if(verseIndex === -1) return;

    // Captura dados do DOM
    const ref = document.getElementById('ref').value.trim();
    const text = document.getElementById('text').value.trim();
    const mnemonic = document.getElementById('mnemonic').value.trim();
    const explanation = document.getElementById('explanation').value.trim();
    const startDate = document.getElementById('startDate').value;

    if (!ref || !startDate) {
        window.showToast("Dados incompletos.", "error");
        return;
    }

    // Lógica Inteligente de Data (Importada de srs-engine via lógica condicional)
    let dates = appData.verses[verseIndex].dates;
    // Se mudou a data, precisará recalcular externamente ou aqui. 
    // Para simplificar, assumimos que calculateSRSDates está disponível globalmente ou passado via argumento, 
    // mas idealmente estaria importado de srs-engine.js.
    // *Nota: Na implementação real, importar calculateSRSDates de srs-engine.js*
    
    const updatedVerse = {
        ...appData.verses[verseIndex],
        ref, text, mnemonic, explanation, startDate, dates
    };
    
    // Verificação de mudança de data seria feita aqui com calculateSRSDates

    appData.verses[verseIndex] = updatedVerse;

    saveToStorage();
    syncWithCloud(updatedVerse, 'verse');

    return true; // Sucesso
}

// --- EXCLUSÃO E UNDO ---
let undoTimer = null;
let verseBackup = null;
let verseIndexBackup = -1;

export function deleteVerse(id) {
    if (undoTimer) clearTimeout(undoTimer);
    
    // Cancela edição se estiver ativo
    if (state.editingVerseId === id && window.cancelEdit) window.cancelEdit();

    const index = appData.verses.findIndex(v => v.id === id);
    if (index === -1) return;

    verseBackup = appData.verses[index];
    verseIndexBackup = index;

    appData.verses.splice(index, 1);
    
    // Atualizações de UI
    updateTable();
    updateRadar();
    updatePacingUI();
    renderDashboard();
    
    showUndoToast(id);

    undoTimer = setTimeout(() => {
        finalizeDeletion(id);
    }, 5000);
}

export function handleUndo() {
    if (!verseBackup) return;
    clearTimeout(undoTimer);
    undoTimer = null;

    appData.verses.splice(verseIndexBackup, 0, verseBackup);
    
    updateTable();
    updateRadar();
    updatePacingUI();
    renderDashboard();
    verseBackup = null;
    
    const box = document.getElementById('toastBox');
    if(box) box.innerHTML = ''; 
    window.showToast('Ação desfeita!', 'success');
}

function finalizeDeletion(id) {
    saveToStorage(); 
    syncWithCloud(id, 'delete');
    verseBackup = null;
}

function showUndoToast(id) {
    const box = document.getElementById('toastBox');
    if(!box) return;
    
    const el = document.createElement('div');
    el.className = `toast warning`;
    el.innerHTML = `🗑️ Item excluído. <button id="btnUndoToast" class="toast-undo-btn">Desfazer</button>`;
    
    box.innerHTML = '';
    box.appendChild(el);
    
    // Adiciona listener manualmente pois onclick HTML não veria o módulo
    document.getElementById('btnUndoToast').onclick = handleUndo;

    setTimeout(() => { if(el.parentNode) el.remove(); }, 5000);
}

export function clearAllData() {
    appData.verses = [];
    appData.settings = { planInterval: 1 };
    appData.stats = { streak: 0, lastLogin: null };
    saveToStorage();
    updateTable();
    updateRadar();
    updatePacingUI();
    renderDashboard();
}
