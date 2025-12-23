// js/ui-dashboard.js - Interface do Usuário e Visualizações
import { getLocalDateISO, showToast } from './utils.js';
import { appData, globalState } from './core.js';
import { calculateSRSDates } from './srs-engine.js';
import { saveToStorage } from './storage.js'; // Para deleteVerse
import { startFlashcard } from './flashcard.js'; // Para startFlashcardFromDash

// --- RADAR & CALENDÁRIO ---

export function updateRadar() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    
    grid.innerHTML = '';

    const startDateEl = document.getElementById('startDate');
    const startDateInput = startDateEl ? startDateEl.value : null;
    const currentPreviewDates = startDateInput ? calculateSRSDates(startDateInput) : [];
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

    const todayStr = getLocalDateISO(new Date());
    const todayLoad = loadMap[todayStr] || 0;
    
    // Update Badge Button Radar
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
                // Como closeRadarModal está no HTML onclick, podemos chamar via window ou lógica local
                const modal = document.getElementById('radarModal');
                if(modal) modal.style.display = 'none';
                openDailyReview(dateStr);
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

function openDailyReview(dateStr) {
    let versesToReview = appData.verses.filter(v => v.dates.includes(dateStr));
    
    if (versesToReview.length === 0) return;

    versesToReview = versesToReview.sort(() => Math.random() - 0.5);

    const modal = document.getElementById('reviewModal');
    const listContainer = document.getElementById('reviewList');
    const title = document.getElementById('reviewTitle');
    
    document.getElementById('reviewListContainer').style.display = 'block';
    document.getElementById('flashcardContainer').style.display = 'none';
    document.getElementById('flashcardInner').classList.remove('is-flipped');
    
    const dateObj = new Date(dateStr + 'T00:00:00');
    title.innerText = `Revisão: ${dateObj.toLocaleDateString('pt-BR')}`;

    // Nota: onclick="startFlashcard(id)" no HTML string requer que startFlashcard esteja no window
    // Isso deve ser tratado no main.js
    listContainer.innerHTML = versesToReview.map(v => `
        <div class="verse-item" onclick="window.startFlashcard(${v.id})">
            <strong>${v.ref}</strong>
            <span>▶ Treinar</span>
        </div>
    `).join('');

    modal.style.display = 'flex';
}

// --- DASHBOARD DO DIA ---

export function renderDashboard() {
    const dash = document.getElementById('todayDashboard');
    const list = document.getElementById('todayList');
    const countEl = document.getElementById('todayCount');
    const overduePanel = document.getElementById('overduePanel');
    const overdueList = document.getElementById('overdueList');
    const overdueCount = document.getElementById('overdueCount');

    if(!dash || !list) return;

    const todayStr = getLocalDateISO(new Date());
    
    const overdueVerses = appData.verses.filter(v => {
        const hasPastDate = v.dates.some(d => d < todayStr);
        const interactedToday = v.lastInteraction === todayStr; 
        return hasPastDate && !interactedToday;
    });

    const todayVerses = appData.verses.filter(v => v.dates.includes(todayStr));

    dash.style.display = 'block';

    if (overdueVerses.length > 0 && overduePanel) {
        overduePanel.style.display = 'block';
        if(overdueCount) overdueCount.innerText = overdueVerses.length;
        
        const overdueIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:5px; vertical-align:text-bottom;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

        if(overdueList) {
            overdueList.innerHTML = overdueVerses.map(v => `
                <div class="dash-item" onclick="window.startFlashcardFromDash(${v.id})" style="border-left: 4px solid #c0392b;">
                    <div style="width:100%">
                        <strong>${v.ref}</strong>
                        <div style="display:flex; align-items:center; margin-top:4px; color:#c0392b; font-size:0.85rem;">
                            ${overdueIcon} 
                            <span style="font-weight:500;">Recuperar</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } else if (overduePanel) {
        overduePanel.style.display = 'none';
    }

    countEl.innerText = todayVerses.length;
    
    if(todayVerses.length === 0) {
        if(overdueVerses.length === 0) {
            list.innerHTML = `<div class="dash-empty-state">✨ Tudo em dia! Nenhuma revisão pendente.</div>`;
        } else {
             list.innerHTML = `<div class="dash-empty-state">Foque nos atrasados acima! ☝️</div>`;
        }
    } else {
        list.innerHTML = todayVerses.map(v => `
            <div class="dash-item" onclick="window.startFlashcardFromDash(${v.id})">
                <strong>${v.ref}</strong>
                <small style="color:var(--accent)">▶ Treinar</small>
            </div>
        `).join('');
    }
}

// --- HISTÓRICO E PREVIEW ---

export function updateTable() {
    const tbody = document.getElementById('historyTableBody');
    if(!tbody) return;
    
    const countEl = document.getElementById('countDisplay');
    if(countEl) countEl.innerText = appData.verses.length;
    
    tbody.innerHTML = '';

    [...appData.verses].reverse().forEach(v => {
        const tr = document.createElement('tr');
        // Botões requerem que funções estejam no window
        tr.innerHTML = `
            <td><strong>${v.ref}</strong></td>
            <td>${v.startDate.split('-').reverse().join('/')}</td>
            <td>
                <button class="edit-btn" onclick="window.startEdit(${v.id})">✎</button>
                <button class="delete-btn" onclick="window.deleteVerse(${v.id})">x</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

export function updatePreviewPanel() {
    const dateEl = document.getElementById('startDate');
    const refEl = document.getElementById('ref');
    
    if(!dateEl || !refEl) return;

    const dateInput = dateEl.value;
    const refInput = refEl.value.trim();
    const panel = document.getElementById('previewPanel');
    const container = document.getElementById('previewChips');

    if (!dateInput || (refInput.length < 3 && !globalState.editingVerseId)) {
        if(panel) panel.style.display = 'none';
        updateRadar();
        return;
    }

    const futureDates = calculateSRSDates(dateInput);
    const currentLoadMap = {};
    appData.verses.forEach(v => {
        if (globalState.editingVerseId && v.id === globalState.editingVerseId) return;
        v.dates.forEach(d => {
            currentLoadMap[d] = (currentLoadMap[d] || 0) + 1;
        });
    });

    if(panel) panel.style.display = 'block';
    
    if(container) {
        container.innerHTML = futureDates.map((dateStr, index) => {
            const d = new Date(dateStr + 'T00:00:00');
            const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' });
            const formattedDate = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            
            const load = currentLoadMap[dateStr] || 0;
            const isOverloaded = load >= 5; 
            const chipClass = isOverloaded ? 'date-chip is-overloaded' : 'date-chip';
            
            return `<span class="${chipClass}">Rev ${index+1}: ${dayName} ${formattedDate}</span>`;
        }).join('');
    }
    updateRadar();
}

export function updatePacingUI() {
    const btn = document.getElementById('btnPacing');
    if(!btn) return;
    
    const interval = appData.settings?.planInterval || 1;
    const planConfig = {
        1: { label: "Diário", icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' },
        2: { label: "Alternado", icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>' },
        3: { label: "Modo Leve", icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>' }
    };

    const currentConfig = planConfig[interval] || planConfig[1];
    const labelEl = document.getElementById('currentPlanLabel');
    if(labelEl) labelEl.innerText = currentConfig.label;

    const indicatorEl = document.getElementById('activePlanIcon');
    if(indicatorEl) indicatorEl.innerHTML = currentConfig.icon;
    
    // ... Lógica de bloqueio (simplificada para o exemplo) ...
    // Se necessário, adicionar lógica de comparação de datas aqui
}

// Wrapper para startFlashcardFromDash (usado no dashboard)
export function startFlashcardFromDash(id) {
    document.getElementById('reviewModal').style.display = 'flex';
    startFlashcard(id);
}
