// js/ui-dashboard.js
// Responsável por renderizar listas, radar, histórico e modais informativos.

import { appData, saveToStorage, getLocalDateISO } from './core.js';
import { calculateSRSDates } from './srs-engine.js';
import { startFlashcard, startFlashcardFromDash } from './flashcard.js';

// --- Constantes de UI ---
// Exportamos caso outros módulos precisem
export const ICONS = {
    target: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    bulb: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21h6"/><path d="M9 21v-4h6v4"/><path d="M12 3a9 9 0 0 0-9 9c0 4.97 9 13 9 13s9-8.03 9-13a9 9 0 0 0-9-9z"/></svg>`
};

// --- RADAR DE CARGA ---
export function updateRadar() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    
    grid.innerHTML = '';

    // Coleta dados de input (Preview)
    const startDateEl = document.getElementById('startDate');
    const startDateInput = startDateEl ? startDateEl.value : null;
    const currentPreviewDates = startDateInput ? calculateSRSDates(startDateInput) : [];
    
    // Mapa de Carga
    const loadMap = {};
    appData.verses.forEach(v => {
        v.dates.forEach(d => {
            loadMap[d] = (loadMap[d] || 0) + 1;
        });
    });

    const refEl = document.getElementById('ref');
    const isPreviewActive = refEl && refEl.value.trim() !== "";
    
    if (isPreviewActive) {
        currentPreviewDates.forEach(d => {
            loadMap[d] = (loadMap[d] || 0) + 1;
        });
    }

    // Atualiza Botão do Radar no Header
    const todayStr = getLocalDateISO(new Date());
    const todayLoad = loadMap[todayStr] || 0;
    const radarBtn = document.getElementById('btnRadar');
    
    if (radarBtn) {
        if (todayLoad > 0) {
            radarBtn.classList.add('has-alert');
            radarBtn.title = `Atenção: ${todayLoad} revisões para hoje!`;
        } else {
            radarBtn.classList.remove('has-alert');
            radarBtn.title = "Abrir Radar de Carga (63 dias)";
        }
    }

    // Renderiza Grid (63 dias)
    const today = new Date();
    for (let i = 0; i < 63; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const dateStr = getLocalDateISO(d);
        const count = loadMap[dateStr] || 0;

        const cell = document.createElement('div');
        cell.className = 'day-cell';
        
        if (count > 0) {
            cell.style.cursor = 'pointer';
            cell.onclick = () => {
                closeRadarModal();
                // Import dinâmico ou callback global para evitar ciclo se necessário
                // Aqui assumimos que openDailyReview está disponível globalmente ou importado
                if(window.openDailyReview) window.openDailyReview(dateStr);
            };
            cell.title = `${count} versículos para revisar`;
        }
        
        if (count === 0) cell.classList.add('load-0');
        else if (count <= 2) cell.classList.add('load-low');
        else if (count <= 5) cell.classList.add('load-med');
        else cell.classList.add('load-high');

        if (isPreviewActive && currentPreviewDates.includes(dateStr)) {
            cell.classList.add('is-preview');
        }

        const dayLabel = d.getDate().toString().padStart(2, '0');
        cell.innerHTML = `<span>${dayLabel}</span><strong>${count > 0 ? count : ''}</strong>`;
        grid.appendChild(cell);
    }
}

export function openRadarModal() {
    updateRadar();
    const modal = document.getElementById('radarModal');
    if(modal) modal.style.display = 'flex';
}

export function closeRadarModal() {
    const modal = document.getElementById('radarModal');
    if(modal) modal.style.display = 'none';
}

// --- DASHBOARD DIÁRIO ---
export function renderDashboard() {
    const dash = document.getElementById('todayDashboard');
    const list = document.getElementById('todayList');
    const countEl = document.getElementById('todayCount');
    const overduePanel = document.getElementById('overduePanel');
    const overdueList = document.getElementById('overdueList');
    const overdueCount = document.getElementById('overdueCount');

    if(!dash || !list) return;

    const todayStr = getLocalDateISO(new Date());
    
    // Filtros
    const overdueVerses = appData.verses.filter(v => {
        const hasPastDate = v.dates.some(d => d < todayStr);
        const interactedToday = v.lastInteraction === todayStr; 
        return hasPastDate && !interactedToday;
    });

    const todayVerses = appData.verses.filter(v => v.dates.includes(todayStr));

    dash.style.display = 'block';

    // Renderiza Atrasados
    if (overdueVerses.length > 0 && overduePanel) {
        overduePanel.style.display = 'block';
        if(overdueCount) overdueCount.innerText = overdueVerses.length;
        
        const overdueIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:5px; vertical-align:text-bottom;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

        if(overdueList) {
            overdueList.innerHTML = overdueVerses.map(v => `
                <div class="dash-item overdue-item" data-id="${v.id}" style="border-left: 4px solid #c0392b;">
                    <div style="width:100%">
                        <strong>${v.ref}</strong>
                        <div style="display:flex; align-items:center; margin-top:4px; color:#c0392b; font-size:0.85rem;">
                            ${overdueIcon} 
                            <span style="font-weight:500;">Recuperar</span>
                        </div>
                    </div>
                </div>
            `).join('');
            
            // Adiciona listeners manualmente (Module Safety)
            document.querySelectorAll('.overdue-item').forEach(el => {
                el.addEventListener('click', () => startFlashcardFromDash(parseInt(el.dataset.id)));
            });
        }
    } else if (overduePanel) {
        overduePanel.style.display = 'none';
    }

    // Renderiza Hoje
    countEl.innerText = todayVerses.length;
    
    if(todayVerses.length === 0) {
        if(overdueVerses.length === 0) {
            list.innerHTML = `<div class="dash-empty-state">✨ Tudo em dia! Nenhuma revisão pendente.</div>`;
        } else {
             list.innerHTML = `<div class="dash-empty-state">Foque nos atrasados acima! ☝️</div>`;
        }
    } else {
        list.innerHTML = todayVerses.map(v => `
            <div class="dash-item today-item" data-id="${v.id}">
                <strong>${v.ref}</strong>
                <small style="color:var(--accent)">▶ Treinar</small>
            </div>
        `).join('');

        document.querySelectorAll('.today-item').forEach(el => {
            el.addEventListener('click', () => startFlashcardFromDash(parseInt(el.dataset.id)));
        });
    }
}

// --- HISTÓRICO ---
export function updateTable() {
    const tbody = document.getElementById('historyTableBody');
    if(!tbody) return;
    
    const countEl = document.getElementById('countDisplay');
    if(countEl) countEl.innerText = appData.verses.length;
    
    tbody.innerHTML = '';

    [...appData.verses].reverse().forEach(v => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${v.ref}</strong></td>
            <td>${v.startDate.split('-').reverse().join('/')}</td>
            <td>
                <button class="edit-btn" data-id="${v.id}">✎</button>
                <button class="delete-btn" data-id="${v.id}">x</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Reattach listeners
    // Nota: As funções startEdit e deleteVerse devem ser passadas ou estarem no window
    // Para simplificar neste exemplo modular, assumimos que main.js delega ou usamos window
    tbody.querySelectorAll('.edit-btn').forEach(btn => {
        btn.onclick = () => window.startEdit(parseInt(btn.dataset.id));
    });
    tbody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = () => window.deleteVerse(parseInt(btn.dataset.id));
    });
}

export function toggleHistory() {
    const section = document.getElementById('historySection');
    const searchBox = document.getElementById('historySearchBox');
    
    section.classList.toggle('collapsed');
    
    if (!section.classList.contains('collapsed')) {
        searchBox.style.display = 'block';
        setTimeout(() => document.getElementById('searchHistory').focus(), 100);
    } else {
        searchBox.style.display = 'none';
    }
}

export function filterHistory() {
    const term = document.getElementById('searchHistory').value.toLowerCase();
    const rows = document.querySelectorAll('#historyTable tbody tr');
    let visibleCount = 0;
    const noResult = document.getElementById('noResultsMsg');

    rows.forEach(row => {
        const refText = row.cells[0].innerText.toLowerCase(); 
        if (refText.includes(term)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    if (noResult) noResult.style.display = (visibleCount === 0 && rows.length > 0) ? 'block' : 'none';
}
