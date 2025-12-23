// js/storage.js
import { appData, setAppData } from './core.js';
import { updateRadar } from './ui-dashboard.js'; // Opcional: para atualizar UI ao carregar

export function saveToStorage() {
    try {
        localStorage.setItem('neuroBibleData', JSON.stringify(appData));
        // Se houver função global de sync com Firestore, chama aqui
        // Mas idealmente o main.js ou firebase.js observaria mudanças.
    } catch (e) {
        console.error('[Storage] Erro ao salvar dados locais:', e);
    }
}

export function loadFromStorage() {
    const data = localStorage.getItem('neuroBibleData');
    if (data) {
        try {
            const parsed = JSON.parse(data);
            setAppData({ 
                ...appData, 
                ...parsed,
                settings: parsed.settings || { planInterval: 1 },
                stats: parsed.stats || { streak: 0, lastLogin: null }
            });
            console.log('[Storage] Dados carregados com sucesso.');
            return true;
        } catch (e) {
            console.error('[Storage] Erro ao processar dados salvos:', e);
            return false;
        }
    }
    return false;
}
