// app.js

// --- 1. GESTÃO DE ESTADO (Model) ---
let appData = {
    verses: [], // { id, ref, text, startDate, dates: [] }
    settings: { planInterval: 1 }, // 1=Diário, 2=Alternado, 3=Leve
    stats: { streak: 0, lastLogin: null } // Controle de Constância
};

// Variáveis Globais de Controle da Revisão
let currentReviewId = null;
let cardStage = 0; // 0: Iniciais (Hard), 1: Lacunas (Medium)

window.onload = function() {
    // --- 0. REGISTRO DO SERVICE WORKER (PWA) ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('SW registrado com sucesso:', reg.scope))
            .catch(err => console.error('Falha ao registrar SW:', err));
    }

    initChangelog();
    loadFromStorage();
    
    // Define data de hoje (DATA LOCAL, NÃO UTC)
    const today = new Date();
    const startDateInput = document.getElementById('startDate');
    if(startDateInput) startDateInput.value = getLocalDateISO(today);
    
    // Listeners para o Painel de Previsão (Reatividade)
    const refInput = document.getElementById('ref');
    
    if(startDateInput) startDateInput.addEventListener('change', updatePreviewPanel);
    if(refInput) refInput.addEventListener('input', updatePreviewPanel);

    // Inicializações de Lógica
    checkStreak();      
    updateTable();
    updateRadar();      
    updatePacingUI();
    renderDashboard(); 
};

function saveToStorage() {
    localStorage.setItem('neuroBibleData', JSON.stringify(appData));
    updateRadar(); // Mantém o radar sincronizado
}

function loadFromStorage() {
    const data = localStorage.getItem('neuroBibleData');
    if (data) {
        const parsed = JSON.parse(data);
        appData = { 
            ...appData, 
            ...parsed,
            settings: parsed.settings || { planInterval: 1 },
            stats: parsed.stats || { streak: 0, lastLogin: null }
        };
    }
}

// --- 2. LÓGICA DE NEUROAPRENDIZAGEM (SRS) ---

function getLocalDateISO(dateObj) {
    if(!dateObj) return '';
    const offset = dateObj.getTimezoneOffset() * 60000;
    const localTime = new Date(dateObj.getTime() - offset);
    return localTime.toISOString().split('T')[0];
}

function calculateSRSDates(startDateStr) {
    if (!startDateStr) return [];
    
    // Ciclo de Retenção: 0 (Hoje), 1, 3, 7, 14, 21, 30, 60 dias
    const intervals = [0, 1, 3, 7, 14, 21, 30, 60];
    
    const dates = [];
    const start = new Date(startDateStr + 'T00:00:00'); 

    intervals.forEach(days => {
        const d = new Date(start);
        d.setDate(d.getDate() + days);
        dates.push(getLocalDateISO(d));
    });
    return dates;
}

// --- 3. LÓGICA DO RADAR & INTERATIVIDADE ---
function updateRadar() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    
    grid.innerHTML = '';

    const startDateEl = document.getElementById('startDate');
    const startDateInput = startDateEl ? startDateEl.value : null;
    
    const currentPreviewDates = startDateInput ? calculateSRSDates(startDateInput) : [];
    const loadMap = {};

    // A. Somar Carga Histórica
    appData.verses.forEach(v => {
        v.dates.forEach(d => {
            loadMap[d] = (loadMap[d] || 0) + 1;
        });
    });

    // B. Somar Carga Preview
    const refEl = document.getElementById('ref');
    const isPreviewActive = refEl && refEl.value.trim() !== "";
    
    if (isPreviewActive) {
        currentPreviewDates.forEach(d => {
            loadMap[d] = (loadMap[d] || 0) + 1;
        });
    }

    // C. Verificação de Carga de HOJE
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

    // D. Renderizar 63 dias
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

// --- PACING, STREAK & PREVIEW ---

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

function updatePacingUI() {
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
    if(indicatorEl) {
        indicatorEl.innerHTML = currentConfig.icon;
        indicatorEl.title = `Modo Atual: ${currentConfig.label}`;
    }

    // Lógica de Bloqueio (Pacing)
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

function updatePreviewPanel() {
    const dateEl = document.getElementById('startDate');
    const refEl = document.getElementById('ref');
    
    if(!dateEl || !refEl) return;

    const dateInput = dateEl.value;
    const refInput = refEl.value.trim();
    const panel = document.getElementById('previewPanel');
    const container = document.getElementById('previewChips');

    if (!dateInput || refInput.length < 3) {
        if(panel) panel.style.display = 'none';
        updateRadar();
        return;
    }

    const futureDates = calculateSRSDates(dateInput);
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
            
            const load = currentLoadMap[dateStr] || 0;
            const isOverloaded = load >= 5; 
            const chipClass = isOverloaded ? 'date-chip is-overloaded' : 'date-chip';
            
            return `<span class="${chipClass}">Rev ${index+1}: ${dayName} ${formattedDate}</span>`;
        }).join('');
    }
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
    showToast(`Plano atualizado!`, 'success');
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

// --- 4. FUNÇÕES NEURO (Active Recall & Cloze) ---
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
let pendingVerseData = null;

window.processAndGenerate = function() {
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

    const reviewDates = calculateSRSDates(startDate);

    // Verificação de Sobrecarga
    const overloadLimit = 5;
    const loadMap = getCurrentLoadMap();
    const congestedDates = reviewDates.filter(d => (loadMap[d] || 0) >= overloadLimit);

    if (congestedDates.length > 0) {
        pendingVerseData = { ref, text, startDate, dates: reviewDates };
        const modal = document.getElementById('conflictModal');
        const msg = document.getElementById('conflictMsg');
        msg.innerHTML = `Datas congestionadas: <b>${congestedDates.map(d=>d.split('-').reverse().slice(0,2).join('/')).join(', ')}</b>. Deseja otimizar?`;
        modal.style.display = 'flex';
        return;
    }

    finalizeSave(ref, text, startDate, reviewDates);
};

function finalizeSave(ref, text, startDate, reviewDates) {
    const newVerse = {
        id: Date.now(),
        ref: ref,
        text: text,
        startDate: startDate,
        dates: reviewDates
    };
    appData.verses.push(newVerse);
    saveToStorage();

    if (window.saveVerseToFirestore) {
        window.saveVerseToFirestore(newVerse); 
    }

    updateTable();
    updateRadar();
    updatePacingUI();
    renderDashboard();

    generateICSFile(newVerse, reviewDates);

    document.getElementById('ref').value = '';
    document.getElementById('text').value = '';
    updatePreviewPanel();
    
    showToast(`"${ref}" agendado com sucesso!`, 'success');
}

window.confirmSmartReschedule = function() {
    if(!pendingVerseData) return;
    const optimizedDates = pendingVerseData.dates.map(dateStr => findNextLightDay(dateStr));
    finalizeSave(pendingVerseData.ref, pendingVerseData.text, pendingVerseData.startDate, optimizedDates);
    document.getElementById('conflictModal').style.display = 'none';
    showToast('Agenda otimizada com sucesso!', 'success');
};

window.closeConflictModal = function() {
    document.getElementById('conflictModal').style.display = 'none';
    pendingVerseData = null;
};

// Algoritmo Recursivo para achar dia livre (Usado também no Smart Recovery)
function findNextLightDay(dateStr) {
    const limit = 5;
    const loadMap = getCurrentLoadMap();
    let current = new Date(dateStr + 'T00:00:00');
    
    for(let i=0; i<30; i++) {
        const iso = getLocalDateISO(current);
        if ((loadMap[iso] || 0) < limit) {
            return iso;
        }
        current.setDate(current.getDate() + 1);
    }
    return dateStr;
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

// --- GERAÇÃO DE ICS ROBUSTA ---
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
    const rawDescription = `🧠 DESAFIO: Complete: "${clozeText}"\n\n👇 RESPOSTA:\n${verseData.text}`;
    const description = escapeICS(rawDescription);

    dates.forEach((dateStr, index) => {
        const dtStart = dateStr.replace(/-/g, '');
        const dEnd = new Date(dateStr + 'T00:00:00');
        dEnd.setDate(dEnd.getDate() + 1);
        const dtEnd = getLocalDateISO(dEnd).replace(/-/g, '');

        const summary = escapeICS(`NeuroBible: ${verseData.ref} (Rev ${index+1})`);

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
    link.download = `plano_${safeName}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Utilitário importante para sanear textos do ICS
function escapeICS(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\')
              .replace(/;/g, '\\;')
              .replace(/,/g, '\\,')
              .replace(/\n/g, '\\n');
}

// --- 6. SISTEMA DE FLASHCARDS AVANÇADO (NEURO UPGRADE) ---

// ATUALIZADO: Abre a revisão diária com Embaralhamento (Interleaving)
function openDailyReview(dateStr) {
    let versesToReview = appData.verses.filter(v => v.dates.includes(dateStr));
    
    if (versesToReview.length === 0) return;

    // NEURO-UPGRADE: Shuffle para evitar sequência viciada
    versesToReview = versesToReview.sort(() => Math.random() - 0.5);

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

// ATUALIZADO: Inicia o card no Estágio 0 (Primeiras Letras)
function startFlashcard(verseId) {
    currentReviewId = verseId;
    const verse = appData.verses.find(v => v.id === verseId);
    if (!verse) return;

    // Reset Visual Completo
    document.getElementById('reviewListContainer').style.display = 'none';
    document.getElementById('flashcardContainer').style.display = 'block';
    document.getElementById('flashcardInner').classList.remove('is-flipped');
    document.getElementById('btnHint').style.display = 'block'; // Mostra botão de dica

    document.getElementById('cardRef').innerText = verse.ref;
    document.getElementById('cardFullText').innerText = verse.text;
    
    // Inicia no modo Hardcore (Acrônimo)
    cardStage = 0; 
    renderCardContent(verse);
}

// NOVO: Renderiza o conteúdo da frente baseado no estágio (Scaffolding)
function renderCardContent(verse) {
    const contentEl = document.getElementById('cardTextContent');
    
    if (cardStage === 0) {
        // Modo Acrônimo (Iniciais)
        const words = verse.text.split(' ');
        const acronym = words.map(w => {
            const firstChar = w.charAt(0);
            const punctuation = w.match(/[.,;!?]+$/) ? w.match(/[.,;!?]+$/)[0] : '';
            return firstChar + punctuation; 
        }).join('  '); // Espaçamento duplo para clareza
        
        contentEl.innerText = acronym;
        contentEl.className = 'cloze-text first-letter-mode';
    } 
    else if (cardStage === 1) {
        // Modo Cloze (Lacunas)
        const clozeHTML = generateClozeText(verse.text).replace(/\n/g, '<br>');
        contentEl.innerHTML = `"${clozeHTML}"`;
        contentEl.className = 'cloze-text'; // Remove monoespaçado
    }
}

// NOVO: Transição de Iniciais -> Lacunas (Botão de Dica)
window.showHintStage = function() {
    if (cardStage === 0) {
        cardStage = 1; // Avança para o nível médio
        const verse = appData.verses.find(v => v.id === currentReviewId);
        if(verse) renderCardContent(verse);
        
        // Esconde o botão de dica (próximo passo é virar)
        document.getElementById('btnHint').style.display = 'none';
    }
};

// Funções de Controle do Card
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

// ATUALIZADO (SMART RECOVERY): Lógica de Feedback Inteligente
window.handleDifficulty = function(level) {
    const verseIndex = appData.verses.findIndex(v => v.id === currentReviewId);
    if (verseIndex === -1) return;
    const verse = appData.verses[verseIndex];

    if (level === 'hard') {
        // --- LÓGICA DE RECUPERAÇÃO TÁTICA ---
        
        // 1. Verifica se estamos no Fim do Ciclo (aprox. 50+ dias desde o início)
        const today = new Date();
        const start = new Date(verse.startDate + 'T00:00:00');
        const diffTime = Math.abs(today - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isEndCycle = diffDays >= 50;

        if (isEndCycle) {
            // Cenário Crítico: Falha no final -> Reinício Completo
            const todayISO = getLocalDateISO(new Date());
            verse.startDate = todayISO; 
            verse.dates = calculateSRSDates(todayISO);
            showToast('Ciclo final falhou. Reiniciando para consolidar.', 'warning');
        } else {
            // Cenário Comum: Falha no meio -> Revisão Extra Inteligente
            // Define amanhã como alvo inicial
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = getLocalDateISO(tomorrow);

            // Usa a função existente para achar um dia sem sobrecarga (Smart Reschedule)
            const recoveryDate = findNextLightDay(tomorrowStr);

            // Adiciona essa data extra na agenda se ela já não existir
            if (!verse.dates.includes(recoveryDate)) {
                verse.dates.push(recoveryDate);
                verse.dates.sort(); // Reordena cronologicamente
                
                // Formata data para feedback visual amigável
                const d = new Date(recoveryDate + 'T00:00:00');
                const fmtDate = d.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
                showToast(`Revisão extra agendada para ${fmtDate}. Sem estresse!`, 'success');
            } else {
                showToast('Reforço já estava agendado. Mantenha o foco!', 'warning');
            }
        }
    } else {
        showToast('Ótimo! Segue o plano.', 'success');
    }

    // Persiste alterações (Local + Cloud)
    saveToStorage();
    if (window.saveVerseToFirestore) window.saveVerseToFirestore(verse);
    
    // Atualiza visualizações
    updateRadar();
    renderDashboard();
    backToList();
};

// --- DASHBOARD (Painel do Dia) ---
function renderDashboard() {
    const dash = document.getElementById('todayDashboard');
    const list = document.getElementById('todayList');
    const countEl = document.getElementById('todayCount');
    if(!dash || !list) return;

    const todayStr = getLocalDateISO(new Date());
    const todayVerses = appData.verses.filter(v => v.dates.includes(todayStr));

    dash.style.display = 'block';
    countEl.innerText = todayVerses.length;
    
    if(todayVerses.length === 0) {
        list.innerHTML = `<div class="dash-empty-state">✨ Tudo em dia! Nenhuma revisão pendente para hoje.</div>`;
    } else {
        list.innerHTML = todayVerses.map(v => `
            <div class="dash-item" onclick="startFlashcardFromDash(${v.id})">
                <strong>${v.ref}</strong>
                <small style="color:var(--accent)">▶ Treinar</small>
            </div>
        `).join('');
    }
}

window.startFlashcardFromDash = function(id) {
    document.getElementById('reviewModal').style.display = 'flex';
    startFlashcard(id);
};

// --- 7. CHANGELOG & GESTÃO DE DADOS ---
function updateTable() {
    const tbody = document.querySelector('#historyTable tbody');
    if(!tbody) return;
    
    const countEl = document.getElementById('countDisplay');
    if(countEl) countEl.innerText = appData.verses.length;
    
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

// Exclusão com Undo e Nuvem
let undoTimer = null;
let verseBackup = null;
let verseIndexBackup = -1;

window.deleteVerse = function(id) {
    if (undoTimer) clearTimeout(undoTimer);

    const index = appData.verses.findIndex(v => v.id === id);
    if (index === -1) return;

    verseBackup = appData.verses[index];
    verseIndexBackup = index;

    appData.verses.splice(index, 1);
    updateTable();
    updateRadar();
    updatePacingUI();
    renderDashboard();
    
    showUndoToast(id);

    undoTimer = setTimeout(() => {
        finalizeDeletion(id);
    }, 5000);
};

window.handleUndo = function() {
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
    showToast('Ação desfeita!', 'success');
};

function finalizeDeletion(id) {
    saveToStorage(); 
    if (window.handleCloudDeletion) {
        window.handleCloudDeletion(id);
    }
    verseBackup = null;
}

function showUndoToast(id) {
    const box = document.getElementById('toastBox');
    if(!box) return;
    
    const el = document.createElement('div');
    el.className = `toast warning`;
    el.innerHTML = `🗑️ Item excluído. <button onclick="handleUndo()" class="toast-undo-btn">Desfazer</button>`;
    
    box.innerHTML = '';
    box.appendChild(el);
    setTimeout(() => { if(el.parentNode) el.remove(); }, 5000);
}

window.clearData = function() {
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
};

function initChangelog() {
    const latest = window.neuroChangelog ? window.neuroChangelog[0] : { version: '1.0.8' };
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

// --- SINCRONIZAÇÃO INICIAL (FIREBASE) ---
if (window.loadVersesFromFirestore) {
    setTimeout(() => {
        if (typeof auth !== 'undefined' && auth.currentUser) {
            window.loadVersesFromFirestore((cloudVerses) => {
                if (cloudVerses && cloudVerses.length > 0) {
                    appData.verses = cloudVerses;
                    saveToStorage();
                    updateTable();
                    updateRadar();
                    renderDashboard();
                    showToast('Dados sincronizados da nuvem!', 'success');
                }
            });
        }
    }, 2000); 
}
