// --- 1. GESTÃO DE ESTADO (Model) ---
let appData = {
    verses: [], // { id, ref, text, startDate, dates: [] }
    settings: { planInterval: 1 }, // 1=Diário, 2=Alternado, 3=Leve
    stats: { streak: 0, lastLogin: null } // Controle de Constância
};

window.onload = function() {
    initChangelog();
    loadFromStorage();
    
    // Define data de hoje
    const today = new Date();
    document.getElementById('startDate').valueAsDate = today;
    
    // Listeners para o Painel de Previsão (Reatividade - Prioridade 2)
    const dateInput = document.getElementById('startDate');
    const refInput = document.getElementById('ref');
    
    if(dateInput) dateInput.addEventListener('change', updatePreviewPanel);
    if(refInput) refInput.addEventListener('input', updatePreviewPanel);

    // Inicializações de Lógica
    checkStreak();      
    updateTable();
    updateRadar();      
    updatePacingUI();   
};

function saveToStorage() {
    localStorage.setItem('neuroBibleData', JSON.stringify(appData));
    updateRadar(); // Mantém o radar sincronizado
}

function loadFromStorage() {
    const data = localStorage.getItem('neuroBibleData');
    if (data) {
        const parsed = JSON.parse(data);
        // Merge para garantir que usuários antigos recebam os novos campos
        appData = { 
            ...appData, 
            ...parsed,
            settings: parsed.settings || { planInterval: 1 },
            stats: parsed.stats || { streak: 0, lastLogin: null }
        };
    }
}

// --- 2. LÓGICA DE NEUROAPRENDIZAGEM (SRS) ---
function calculateSRSDates(startDateStr) {
    if (!startDateStr) return [];
    // 1, 3, 7, 14, 21, 30, 60 dias
    const intervals = [1, 3, 7, 14, 21, 30, 60];
    const dates = [];
    const start = new Date(startDateStr + 'T00:00:00'); 

    intervals.forEach(days => {
        const d = new Date(start);
        d.setDate(d.getDate() + days);
        dates.push(formatDateISOSimple(d));
    });
    return dates;
}

function formatDateISOSimple(date) {
    return date.toISOString().split('T')[0];
}

// --- 3. LÓGICA DO RADAR & INTERATIVIDADE ---
function updateRadar() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    
    grid.innerHTML = '';

    const startDateInput = document.getElementById('startDate').value;
    const currentPreviewDates = calculateSRSDates(startDateInput);
    const loadMap = {};

    // A. Somar Carga Histórica
    appData.verses.forEach(v => {
        v.dates.forEach(d => {
            loadMap[d] = (loadMap[d] || 0) + 1;
        });
    });

    // B. Somar Carga Preview
    const isPreviewActive = document.getElementById('ref').value.trim() !== "";
    if (isPreviewActive) {
        currentPreviewDates.forEach(d => {
            loadMap[d] = (loadMap[d] || 0) + 1;
        });
    }

    // C. Verificação de Carga de HOJE para Notificação no Botão
    const today = new Date();
    const todayStr = formatDateISOSimple(today);
    const todayLoad = loadMap[todayStr] || 0;
    
    const radarBtn = document.getElementById('btnRadar');
    if (todayLoad > 0) {
        radarBtn.classList.add('has-alert');
        radarBtn.title = `Atenção: ${todayLoad} revisões para hoje!`;
    } else {
        radarBtn.classList.remove('has-alert');
        radarBtn.title = "Abrir Radar de Carga (63 dias)";
    }

    // D. Renderizar 63 dias (9 semanas completas)
    for (let i = 0; i < 63; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const dateStr = formatDateISOSimple(d);
        const count = loadMap[dateStr] || 0;

        const cell = document.createElement('div');
        cell.className = 'day-cell';
        
        // INTERATIVIDADE DO FLASHCARD
        if (count > 0) {
            cell.style.cursor = 'pointer';
            cell.onclick = () => {
                closeRadarModal(); // Fecha o radar para focar na revisão
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

// --- NOVAS FUNÇÕES: PACING, STREAK & PREVIEW ---

function checkStreak() {
    const today = new Date().toISOString().split('T')[0];
    
    if (!appData.stats) appData.stats = { streak: 0, lastLogin: null };
    
    const lastLogin = appData.stats.lastLogin;
    
    if (lastLogin !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastLogin === yesterdayStr) {
            appData.stats.streak++;
        } else {
            appData.stats.streak = 1;
        }
        
        appData.stats.lastLogin = today;
        saveToStorage();
    }
    
    const badge = document.getElementById('streakBadge');
    if(badge) badge.innerText = `🔥 ${appData.stats.streak}`;
}

// Refatoração: Simplificação visual e Injeção de Ícone de Feedback
function updatePacingUI() {
    const btn = document.getElementById('btnPacing');
    if(!btn) return;
    
    const interval = appData.settings?.planInterval || 1;

    // Configuração dos Planos (SVG + Labels)
    const planConfig = {
        1: { 
            label: "Diário", 
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' 
        },
        2: { 
            label: "Alternado", 
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>' 
        },
        3: { 
            label: "Modo Leve", 
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>' 
        }
    };

    const currentConfig = planConfig[interval] || planConfig[1];

    // Atualiza label do modal
    const labelEl = document.getElementById('currentPlanLabel');
    if(labelEl) labelEl.innerText = currentConfig.label;

    // Atualiza Ícone no Header (Feedback Visual)
    const indicatorEl = document.getElementById('activePlanIcon');
    if(indicatorEl) {
        indicatorEl.innerHTML = currentConfig.icon;
        indicatorEl.title = `Modo Atual: ${currentConfig.label}`;
    }

    // Achar data do último verso inserido
    let lastDate = null;
    if (appData.verses.length > 0) {
        const sorted = [...appData.verses].sort((a,b) => new Date(b.startDate) - new Date(a.startDate));
        lastDate = new Date(sorted[0].startDate + 'T00:00:00');
    }

    // Se não há versículos, está liberado
    if (!lastDate) {
        setPacingState(btn, 'ready');
        return;
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= interval) {
        // Liberado
        setPacingState(btn, 'ready');
        btn.title = "Novo versículo liberado! O tempo de plantar chegou.";
    } else {
        // Bloqueado
        const remaining = interval - diffDays;
        setPacingState(btn, 'blocked');
        btn.title = `Aguarde ${remaining} dia(s). O descanso faz parte do plano.`;
    }
}

function setPacingState(btn, state) {
    btn.classList.remove('is-ready', 'is-blocked');
    btn.classList.add(`is-${state}`);
}

// NOVA FUNÇÃO: Lógica do Painel de Previsão e Alerta de Carga - Prioridade 2 e 3
function updatePreviewPanel() {
    const dateInput = document.getElementById('startDate').value;
    const refInput = document.getElementById('ref').value.trim();
    const panel = document.getElementById('previewPanel');
    const container = document.getElementById('previewChips');

    // Só mostra se tiver data e pelo menos 3 caracteres na referência
    if (!dateInput || refInput.length < 3) {
        if(panel) panel.style.display = 'none';
        updateRadar(); // Atualiza radar (limpa preview visual do grid)
        return;
    }

    const futureDates = calculateSRSDates(dateInput);
    
    // Calcula carga atual para verificar sobrecarga (Prioridade 3)
    const currentLoadMap = {};
    appData.verses.forEach(v => {
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
            
            // Verifica Sobrecarga (High Load > 5 itens existentes)
            const load = currentLoadMap[dateStr] || 0;
            const isOverloaded = load >= 5; 
            const chipClass = isOverloaded ? 'date-chip is-overloaded' : 'date-chip';
            const titleAttr = isOverloaded ? `Sobrecarga! Dia já tem ${load} revisões.` : `Dia com ${load} revisões.`;

            // Rev + 1 porque index começa em 0
            return `<span class="${chipClass}" title="${titleAttr}">Rev ${index+1}: ${dayName} ${formattedDate}</span>`;
        }).join('');
    }

    // Mantém o radar principal em sincronia
    updateRadar();
}

// --- UTILITÁRIOS: MODAIS & TOAST ---

window.openPlanModal = function() { 
    document.getElementById('planModal').style.display = 'flex'; 
    updatePacingUI(); 
};

window.closePlanModal = function() { 
    document.getElementById('planModal').style.display = 'none'; 
};

window.selectPlan = function(days) {
    if(!appData.settings) appData.settings = {};
    appData.settings.planInterval = days;
    saveToStorage();
    updatePacingUI();
    closePlanModal();
    showToast(`Plano atualizado. Respeite seu novo ritmo!`, 'success');
};

window.showToast = function(msg, type = 'success') {
    const box = document.getElementById('toastBox');
    if(!box) return;
    
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = type === 'warning' ? `✋ ${msg}` : (type === 'error' ? `🛑 ${msg}` : `✅ ${msg}`);
    
    box.appendChild(el);
    
    setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
    }, 4000);
};

// --- CONTROLE DOS MODAIS EXISTENTES ---
function openRadarModal() {
    updateRadar();
    document.getElementById('radarModal').style.display = 'flex';
}

function closeRadarModal() {
    document.getElementById('radarModal').style.display = 'none';
}

// --- 4. FUNÇÕES NEURO (Active Recall) ---
function generateClozeText(text) {
    const words = text.split(' ');
    return words.map(word => {
        const cleanWord = word.replace(/[.,;!?]/g, '');
        if (cleanWord.length > 3 && Math.random() > 0.6) {
            return "______"; 
        }
        return word;
    }).join(' ');
}

// --- 5. AÇÃO PRINCIPAL E ICS ---
window.processAndGenerate = function() {
    // 1. Verificação de Bloqueio de Ritmo
    const btn = document.getElementById('btnPacing');
    if (btn && btn.classList.contains('is-blocked')) {
        btn.style.transform = "scale(1.1)";
        setTimeout(() => btn.style.transform = "scale(1)", 200);
        
        const interval = appData.settings?.planInterval || 1;
        showToast(`O descanso é um princípio bíblico. Aguarde o ciclo (${interval} dias).`, 'warning');
        return; 
    }

    const ref = document.getElementById('ref').value.trim();
    const text = document.getElementById('text').value.trim();
    const startDate = document.getElementById('startDate').value;

    if (!ref || !startDate) {
        showToast("Preencha Referência e Data.", "error");
        return;
    }

    const reviewDates = calculateSRSDates(startDate);
    const newVerse = {
        id: Date.now(),
        ref: ref,
        text: text,
        startDate: startDate,
        dates: reviewDates
    };
    appData.verses.push(newVerse);
    saveToStorage();
    updateTable();
    updateRadar();
    updatePacingUI(); // Atualiza bloqueio imediatamente

    generateICSFile(newVerse, reviewDates);

    document.getElementById('ref').value = '';
    document.getElementById('text').value = '';
    
    // Atualiza/Limpa o painel de previsão
    updatePreviewPanel();
    
    showToast(`"${ref}" agendado com sucesso!`, 'success');
};

function generateICSFile(verseData, dates) {
    const uidBase = verseData.id;
    const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//NeuroBible//SRS Manager//PT',
        'CALSCALE:GREGORIAN'
    ].join('\r\n');

    const clozeText = generateClozeText(verseData.text);
    const rawDescription = 
        `🧠 DESAFIO (Recuperação Ativa)\nComplete mentalmente:\n\n"${clozeText}"\n\n` +
        `.\n.\n.\n.\n👇 Role para a resposta\n.\n.\n.\n` + 
        `📖 RESPOSTA:\n${verseData.text}`;
    
    const description = escapeICS(rawDescription);

    dates.forEach((dateStr, index) => {
        const dtStart = dateStr.replace(/-/g, '');
        const dEnd = new Date(dateStr + 'T00:00:00');
        dEnd.setDate(dEnd.getDate() + 1);
        const dtEnd = formatDateISOSimple(dEnd).replace(/-/g, '');

        const summary = `NeuroBible: ${verseData.ref} (Rev ${index+1})`;

        const eventBlock = [
            'BEGIN:VEVENT',
            `UID:${uidBase}-${index}@neurobible.app`,
            `DTSTAMP:${dtStamp}`,
            `DTSTART;VALUE=DATE:${dtStart}`,
            `DTEND;VALUE=DATE:${dtEnd}`,
            `SUMMARY:${summary}`,
            `DESCRIPTION:${description}`,
            'END:VEVENT'
        ].join('\r\n');
        
        icsContent += '\r\n' + eventBlock;
    });

    icsContent += '\r\nEND:VCALENDAR';

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const safeName = verseData.ref.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `plano_estudo_${safeName}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function escapeICS(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

// --- 6. SISTEMA DE FLASHCARDS / REVIEW ---
function openDailyReview(dateStr) {
    const versesToReview = appData.verses.filter(v => v.dates.includes(dateStr));
    
    if (versesToReview.length === 0) return;

    const modal = document.getElementById('reviewModal');
    const listContainer = document.getElementById('reviewList');
    const title = document.getElementById('reviewTitle');
    
    document.getElementById('reviewListContainer').style.display = 'block';
    document.getElementById('flashcardContainer').style.display = 'none';
    document.getElementById('flashcardInner').classList.remove('is-flipped');
    
    const dateObj = new Date(dateStr + 'T00:00:00');
    title.innerText = `Revisão: ${dateObj.toLocaleDateString('pt-BR')}`;

    listContainer.innerHTML = versesToReview.map(v => `
        <div class="verse-item" onclick="startFlashcard(${v.id})">
            <strong>${v.ref}</strong>
            <span>▶ Treinar</span>
        </div>
    `).join('');

    modal.style.display = 'flex';
}

function startFlashcard(verseId) {
    const verse = appData.verses.find(v => v.id === verseId);
    if (!verse) return;

    document.getElementById('reviewListContainer').style.display = 'none';
    document.getElementById('flashcardContainer').style.display = 'block';
    
    document.getElementById('cardRef').innerText = verse.ref;
    
    const clozeHTML = generateClozeText(verse.text).replace(/\n/g, '<br>');
    document.getElementById('cardCloze').innerHTML = `"${clozeHTML}"`;
    
    document.getElementById('cardFullText').innerText = verse.text;
    document.getElementById('flashcardInner').classList.remove('is-flipped');
}

window.flipCard = function() {
    document.getElementById('flashcardInner').classList.toggle('is-flipped');
};

window.backToList = function() {
    document.getElementById('reviewListContainer').style.display = 'block';
    document.getElementById('flashcardContainer').style.display = 'none';
    document.getElementById('flashcardInner').classList.remove('is-flipped');
};

window.closeReview = function() {
    document.getElementById('reviewModal').style.display = 'none';
};

// --- 7. CHANGELOG & UTILITÁRIOS ---
function updateTable() {
    const tbody = document.querySelector('#historyTable tbody');
    document.getElementById('countDisplay').innerText = appData.verses.length;
    tbody.innerHTML = '';

    [...appData.verses].reverse().forEach(v => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${v.ref}</strong></td>
            <td>${v.startDate.split('-').reverse().join('/')}</td>
            <td><button class="delete-btn" onclick="deleteVerse(${v.id})">x</button></td>
        `;
        tbody.appendChild(tr);
    });
}

window.deleteVerse = function(id) {
    if(confirm('Remover este versículo?')) {
        appData.verses = appData.verses.filter(v => v.id !== id);
        saveToStorage();
        updateTable();
        updateRadar();
        updatePacingUI();
    }
};

window.clearData = function() {
    if(confirm('Limpar TUDO? (Isso resetará seus planos e streaks)')) {
        appData.verses = [];
        appData.settings = { planInterval: 1 };
        appData.stats = { streak: 0, lastLogin: null };
        saveToStorage();
        updateTable();
        updateRadar();
        updatePacingUI();
        checkStreak(); 
    }
};

window.exportData = function() {
    const blob = new Blob([JSON.stringify(appData, null, 2)], { type: "application/json" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup_neurobible_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
};

window.importData = function(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            appData = { 
                ...appData, 
                ...parsed 
            };
            saveToStorage();
            updateTable();
            updateRadar();
            updatePacingUI();
            checkStreak();
            showToast("Backup restaurado com sucesso!", "success");
        } catch (err) { 
            showToast("Erro ao ler arquivo de backup.", "error"); 
        }
    };
    reader.readAsText(file);
};

function initChangelog() {
    const latest = window.neuroChangelog ? window.neuroChangelog[0] : { version: '0.0.0' };
    const versionEl = document.getElementById('currentVersion');
    if(versionEl) versionEl.innerText = `v${latest.version}`;
}

window.openChangelog = function() {
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
};

window.closeChangelog = function() {
    document.getElementById('changelogModal').style.display = 'none';
};

window.updateRadar = updateRadar;