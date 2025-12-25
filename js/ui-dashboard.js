// js/ui-dashboard.js
import { 
    appData, addVerseToState, updateVerseInState, deleteVerseFromState, restoreVerseToState,
    editingVerseId, setEditingVerseId, pendingVerseData, setPendingVerseData 
} from './core.js';
import { saveToStorage } from './storage.js';
import { calculateSRSDates, generateICSFile, findNextLightDay } from './srs-engine.js';
import { getLocalDateISO, showToast } from './utils.js';
import { startFlashcardFromDash } from './flashcard.js';

// --- LOGICA DO NOVO ACCORDION (INPUT SECTION) ---
export function toggleInputSection() {
    const section = document.getElementById('inputSection');
    if(section) section.classList.toggle('collapsed');
}

// --- RADAR & CALENDÁRIO ---
export function updateRadar() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    
    grid.innerHTML = '';

    const startDateEl = document.getElementById('startDate');
    const startDateInput = startDateEl ? startDateEl.value : null;
    const currentPreviewDates = startDateInput ? calculateSRSDates(startDateInput) : [];
    const loadMap = {};

    // Mapeia carga atual
    appData.verses.forEach(v => {
        v.dates.forEach(d => {
            loadMap[d] = (loadMap[d] || 0) + 1;
        });
    });

    // Adiciona carga do preview (se houver input)
    const refEl = document.getElementById('ref');
    const isPreviewActive = refEl && refEl.value.trim() !== "";
    
    if (isPreviewActive) {
        currentPreviewDates.forEach(d => {
            loadMap[d] = (loadMap[d] || 0) + 1;
        });
    }

    const todayStr = getLocalDateISO(new Date());
    const todayLoad = loadMap[todayStr] || 0;
    
    const radarBtn = document.getElementById('btnRadar');
    if (radarBtn) {
        if (todayLoad > 0) {
            radarBtn.classList.add('has-alert');
            radarBtn.title = `Atenção: ${todayLoad} revisões para hoje!`;
        } else {
            radarBtn.classList.remove('has-alert');
        }
    }

    // Renderiza 63 dias
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
                if(window.closeRadarModal) window.closeRadarModal();
                if(window.openDailyReview) window.openDailyReview(dateStr);
            };
            cell.title = `${count} versículos`;
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

// --- DASHBOARD RENDER ---
export function renderDashboard() {
    const dash = document.getElementById('todayDashboard');
    const list = document.getElementById('todayList');
    const countEl = document.getElementById('todayCount');
    const overduePanel = document.getElementById('overduePanel');
    const overdueList = document.getElementById('overdueList');
    const overdueCount = document.getElementById('overdueCount');

    if(!dash || !list) return;

    const todayStr = getLocalDateISO(new Date());
    
    // Filtra atrasados
    const overdueVerses = appData.verses.filter(v => {
        const hasPastDate = v.dates.some(d => d < todayStr);
        const interactedToday = v.lastInteraction === todayStr; 
        return hasPastDate && !interactedToday;
    });

    // Filtra revisão de hoje
    const todayVerses = appData.verses.filter(v => v.dates.includes(todayStr));

    dash.style.display = 'block';

    // Renderiza Atrasados
    if (overdueVerses.length > 0 && overduePanel) {
        overduePanel.style.display = 'block';
        if(overdueCount) overdueCount.innerText = overdueVerses.length;
        
        // Ícone SVG de alerta em vermelho
        const overdueIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:5px; vertical-align:text-bottom; color:#c0392b;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

        if(overdueList) {
            overdueList.innerHTML = overdueVerses.map(v => `
                <div class="dash-item" onclick="startFlashcardFromDash(${v.id})" style="border-left: 4px solid #c0392b;">
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

    // Renderiza Hoje
    countEl.innerText = todayVerses.length;
    
    if(todayVerses.length === 0) {
        if(overdueVerses.length === 0) {
            list.innerHTML = `<div class="dash-empty-state">Tudo em dia! Nenhuma revisão pendente.</div>`;
        } else {
             list.innerHTML = `<div class="dash-empty-state">Foque nos atrasados acima!</div>`;
        }
    } else {
        list.innerHTML = todayVerses.map(v => `
            <div class="dash-item" onclick="startFlashcardFromDash(${v.id})">
                <strong>${v.ref}</strong>
                <small style="color:var(--accent)">▶ Treinar</small>
            </div>
        `).join('');
    }
}

// --- CRUD & FORM LOGIC ---

export function processAndGenerate() {
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

    // Verifica congestionamento
    const reviewDates = calculateSRSDates(startDate);
    const overloadLimit = 5;
    const loadMap = getCurrentLoadMap();
    const congestedDates = reviewDates.filter(d => (loadMap[d] || 0) >= overloadLimit);

    if (congestedDates.length > 0) {
        setPendingVerseData({ ref, text, startDate, dates: reviewDates });
        const modal = document.getElementById('conflictModal');
        const msg = document.getElementById('conflictMsg');
        msg.innerHTML = `Datas congestionadas: <b>${congestedDates.map(d=>d.split('-').reverse().slice(0,2).join('/')).join(', ')}</b>. Deseja otimizar?`;
        modal.style.display = 'flex';
        return;
    }

    finalizeSave(ref, text, startDate, reviewDates);
}

function finalizeSave(ref, text, startDate, reviewDates) {
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
    
    addVerseToState(newVerse);
    saveToStorage();

    if (window.saveVerseToFirestore) window.saveVerseToFirestore(newVerse);

    updateTable();
    updateRadar();
    updatePacingUI();
    renderDashboard();
    generateICSFile(newVerse, reviewDates);

    // Limpeza
    document.getElementById('ref').value = '';
    document.getElementById('text').value = '';
    document.getElementById('mnemonic').value = '';
    document.getElementById('explanation').value = '';
    updatePreviewPanel();
    
    showToast(`"${ref}" agendado com sucesso!`, 'success');
}

// EDIT MODE
export function startEdit(id) {
    const verse = appData.verses.find(v => v.id === id);
    if(!verse) return;

    setEditingVerseId(id);

    // FORÇA ABERTURA DO PAINEL DE INPUT
    const inputSection = document.getElementById('inputSection');
    if(inputSection) inputSection.classList.remove('collapsed');

    // Popula formulário
    const formFields = ['ref', 'startDate', 'mnemonic', 'explanation', 'text'];
    formFields.forEach(fieldId => {
        const el = document.getElementById(fieldId);
        if(el) {
            el.value = verse[fieldId] || '';
            el.classList.add('editing-highlight');
        }
    });

    const btnCreate = document.getElementById('btnCreate');
    const btnControls = document.getElementById('editControls');
    if(btnCreate) btnCreate.style.display = 'none';
    if(btnControls) btnControls.style.display = 'flex';

    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Modo de Edição Ativo', 'warning');
    updatePreviewPanel();
}

export function saveEdit() {
    if(!editingVerseId.value) return;
    
    const verseIndex = appData.verses.findIndex(v => v.id === editingVerseId.value);
    if(verseIndex === -1) return;

    const ref = document.getElementById('ref').value.trim();
    const text = document.getElementById('text').value.trim();
    const mnemonic = document.getElementById('mnemonic').value.trim();
    const explanation = document.getElementById('explanation').value.trim();
    const startDate = document.getElementById('startDate').value;

    if (!ref || !startDate) return showToast("Dados incompletos.", "error");

    let dates = appData.verses[verseIndex].dates;
    // Só recalcula SRS se a data de início mudou
    if(startDate !== appData.verses[verseIndex].startDate) {
        dates = calculateSRSDates(startDate);
    }

    const updatedVerse = {
        ...appData.verses[verseIndex],
        ref, text, mnemonic, explanation, startDate, dates
    };
    
    updateVerseInState(updatedVerse);
    saveToStorage();
    if (window.saveVerseToFirestore) window.saveVerseToFirestore(updatedVerse);

    cancelEdit(); 
    updateTable();
    renderDashboard();
    updateRadar();
    showToast('Versículo atualizado!', 'success');
}

export function cancelEdit() {
    setEditingVerseId(null);
    const formFields = ['ref', 'startDate', 'mnemonic', 'explanation', 'text'];
    formFields.forEach(fieldId => {
        const el = document.getElementById(fieldId);
        if(el) {
            el.value = '';
            el.classList.remove('editing-highlight');
        }
    });
    
    const startDateInput = document.getElementById('startDate');
    if(startDateInput) startDateInput.value = getLocalDateISO(new Date());

    const btnCreate = document.getElementById('btnCreate');
    const btnControls = document.getElementById('editControls');
    if(btnCreate) btnCreate.style.display = 'flex';
    if(btnControls) btnControls.style.display = 'none';
    
    updatePreviewPanel();
}

// DELETE & UNDO
let undoTimer = null;
let verseBackup = null;
let verseIndexBackup = -1;

export function deleteVerse(id) {
    if (undoTimer) clearTimeout(undoTimer);
    if (editingVerseId.value === id) cancelEdit();

    const result = deleteVerseFromState(id);
    if(!result) return;
    
    verseBackup = result.item;
    verseIndexBackup = result.index;

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

    restoreVerseToState(verseIndexBackup, verseBackup);
    
    updateTable();
    updateRadar();
    updatePacingUI();
    renderDashboard();
    verseBackup = null;
    
    const box = document.getElementById('toastBox');
    if(box) box.innerHTML = ''; 
    showToast('Ação desfeita!', 'success');
}

function finalizeDeletion(id) {
    saveToStorage(); 
    if (window.handleCloudDeletion) window.handleCloudDeletion(id);
    verseBackup = null;
}

function showUndoToast(id) {
    const box = document.getElementById('toastBox');
    if(!box) return;
    const el = document.createElement('div');
    el.className = `toast warning`;
    // Ícone de Lixeira em SVG
    const trashIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
    
    el.innerHTML = `${trashIcon} Item excluído. <button onclick="handleUndo()" class="toast-undo-btn">Desfazer</button>`;
    box.innerHTML = '';
    box.appendChild(el);
    setTimeout(() => { if(el.parentNode) el.remove(); }, 5000);
}

// --- TABLE & PREVIEW UI ---

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
                <button class="edit-btn" onclick="startEdit(${v.id})">✎</button>
                <button class="delete-btn" onclick="deleteVerse(${v.id})">x</button>
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

    if (!dateInput || (refInput.length < 3 && !editingVerseId.value)) {
        if(panel) panel.style.display = 'none';
        updateRadar();
        return;
    }

    const futureDates = calculateSRSDates(dateInput);
    const currentLoadMap = getCurrentLoadMap();
    
    if(panel) panel.style.display = 'block';
    if(container) {
        container.innerHTML = futureDates.map((dateStr, index) => {
            const d = new Date(dateStr + 'T00:00:00');
            const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' });
            const formattedDate = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            const load = currentLoadMap[dateStr] || 0;
            const isOverloaded = load >= 5; 
            return `<span class="date-chip ${isOverloaded ? 'is-overloaded' : ''}">Rev ${index+1}: ${dayName} ${formattedDate}</span>`;
        }).join('');
    }
    updateRadar();
}

function getCurrentLoadMap() {
    const map = {};
    appData.verses.forEach(v => {
        v.dates.forEach(d => {
            map[d] = (map[d] || 0) + 1;
        });
    });
    return map;
}

// --- HELPERS DE MODAL E SETTINGS ---

export function checkStreak() {
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
    if(badge) {
        // SVG do Fogo (Flame) para manter visual consistente via JS
        const flameIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0 1.1.2 2.2.5 3z"/></svg>`;
        badge.innerHTML = `${flameIcon} ${appData.stats.streak}`;
    }
}

export function updatePacingUI() {
    const btn = document.getElementById('btnPacing');
    if(!btn) return;
    
    const interval = appData.settings?.planInterval || 1;
    // Removidos emojis nos labels
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

    // Seleção visual do Card
    document.querySelectorAll('.plan-card-option').forEach(el => el.classList.remove('is-selected'));
    const activeCard = document.getElementById(`planOption${interval}`);
    if (activeCard) {
        activeCard.classList.add('is-selected');
    }

    // Lógica de Bloqueio do Botão Principal (Pacing)
    let lastDate = null;
    if (appData.verses.length > 0) {
        const sorted = [...appData.verses].sort((a,b) => new Date(b.startDate) - new Date(a.startDate));
        lastDate = new Date(sorted[0].startDate + 'T00:00:00');
    }

    if (!lastDate) {
        setPacingState(btn, 'ready');
        return;
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= interval) {
        setPacingState(btn, 'ready');
        btn.title = "Novo versículo liberado!";
    } else {
        const remaining = interval - diffDays;
        setPacingState(btn, 'blocked');
        btn.title = `Aguarde ${remaining} dia(s).`;
    }
}

function setPacingState(btn, state) {
    btn.classList.remove('is-ready', 'is-blocked');
    btn.classList.add(`is-${state}`);
}

export function openPlanModal() { 
    document.getElementById('planModal').style.display = 'flex'; 
    updatePacingUI(); 
}
export function closePlanModal() { document.getElementById('planModal').style.display = 'none'; }
export function selectPlan(days) {
    appData.settings.planInterval = days;
    saveToStorage();
    if(window.saveSettingsToFirestore) window.saveSettingsToFirestore(appData.settings);
    updatePacingUI();
    closePlanModal();
    showToast(`Plano atualizado!`, 'success');
}

export function openRadarModal() { updateRadar(); document.getElementById('radarModal').style.display = 'flex'; }
export function closeRadarModal() { document.getElementById('radarModal').style.display = 'none'; }

export function toggleHistory() {
    const section = document.getElementById('historySection');
    section.classList.toggle('collapsed');
    const searchBox = document.getElementById('historySearchBox');
    if(searchBox) searchBox.style.display = section.classList.contains('collapsed') ? 'none' : 'block';
}

export function filterHistory() {
    const term = document.getElementById('searchHistory').value.toLowerCase();
    const rows = document.querySelectorAll('#historyTable tbody tr');
    let visibleCount = 0;
    rows.forEach(row => {
        const refText = row.cells[0].innerText.toLowerCase(); 
        if (refText.includes(term)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    const noResult = document.getElementById('noResultsMsg');
    if (noResult) noResult.style.display = (visibleCount === 0 && rows.length > 0) ? 'block' : 'none';
}

export function clearData() {
    if(confirm('Limpar TUDO? (Isso resetará seus planos e streaks)')) {
        appData.verses = [];
        appData.settings = { planInterval: 1 };
        appData.stats = { streak: 0, lastLogin: null };
        saveToStorage();
        updateTable();
        updateRadar();
        updatePacingUI();
        renderDashboard();
        checkStreak(); 
    }
}

export function confirmSmartReschedule() {
    const data = pendingVerseData.value;
    if(!data) return;
    const optimizedDates = data.dates.map(dateStr => findNextLightDay(dateStr, appData));
    finalizeSave(data.ref, data.text, data.startDate, optimizedDates);
    closeConflictModal();
    showToast('Agenda otimizada com sucesso!', 'success');
}

export function closeConflictModal() {
    document.getElementById('conflictModal').style.display = 'none';
    setPendingVerseData(null);
}

// Changelog UI
export function openChangelog() {
    const modal = document.getElementById('changelogModal');
    const body = document.getElementById('changelogBody');
    if (!window.neuroChangelog) return;
    body.innerHTML = window.neuroChangelog.map(log => `
        <div class="changelog-item">
            <span class="changelog-date">${log.date}</span>
            <span class="changelog-title">v${log.version} - ${log.title}</span>
            <ul class="changelog-ul">${log.changes.map(c => `<li>${c}</li>`).join('')}</ul>
        </div>
    `).join('');
    modal.style.display = 'flex';
}

export function closeChangelog() {
    document.getElementById('changelogModal').style.display = 'none';
}
