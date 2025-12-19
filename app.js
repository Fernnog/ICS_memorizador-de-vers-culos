// --- 1. GESTÃO DE ESTADO (Model) ---
let appData = {
    verses: [], // { id, ref, text, startDate, dates: [] }
    settings: { planInterval: 1 }, // 1=Diário, 2=Alternado, 3=Leve
    stats: { streak: 0, lastLogin: null } // Controle de Constância
};

window.onload = function() {
    // --- 0. REGISTRO DO SERVICE WORKER (PWA) ---
    // Ativa o funcionamento offline e instalação
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
    renderDashboard(); // <--- INICIA O DASHBOARD VISÍVEL
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

// FUNÇÃO CRÍTICA PARA CORRIGIR FUSO HORÁRIO
// Gera 'YYYY-MM-DD' baseado no horário local do usuário, não UTC.
function getLocalDateISO(dateObj) {
    if(!dateObj) return '';
    const offset = dateObj.getTimezoneOffset() * 60000;
    const localTime = new Date(dateObj.getTime() - offset);
    return localTime.toISOString().split('T')[0];
}

function calculateSRSDates(startDateStr) {
    if (!startDateStr) return [];
    
    // ATUALIZAÇÃO v1.0.6: Inclusão do índice '0' para considerar o dia atual (Aprendizado)
    // Sequência: Hoje, Amanhã, 3 dias, 7 dias, etc.
    const intervals = [0, 1, 3, 7, 14, 21, 30, 60];
    
    const dates = [];
    const start = new Date(startDateStr + 'T00:00:00'); // Força interpretação local

    intervals.forEach(days => {
        const d = new Date(start);
        d.setDate(d.getDate() + days);
        dates.push(getLocalDateISO(d)); // Usa a função segura de fuso
    });
    return dates;
}

function formatDateISOSimple(date) {
    return getLocalDateISO(date); // Atualizado para usar função segura
}

// --- 3. LÓGICA DO RADAR & INTERATIVIDADE ---
function updateRadar() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    
    grid.innerHTML = '';

    const startDateEl = document.getElementById('startDate');
    const startDateInput = startDateEl ? startDateEl.value : null;
    
    // Só calcula preview se tiver data válida
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

    // D. Renderizar 63 dias (9 semanas completas)
    const today = new Date();
    for (let i = 0; i < 63; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const dateStr = getLocalDateISO(d);
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
            appData.stats.streak = 1; // Quebrou o streak se perdeu um dia
        }
        // Se for 1º login do dia, apenas atualiza. Se for mesmo dia, não faz nada.
        
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

// NOVA FUNÇÃO: Lógica do Painel de Previsão e Alerta de Carga
function updatePreviewPanel() {
    const dateEl = document.getElementById('startDate');
    const refEl = document.getElementById('ref');
    
    if(!dateEl || !refEl) return;

    const dateInput = dateEl.value;
    const refInput = refEl.value.trim();
    const panel = document.getElementById('previewPanel');
    const container = document.getElementById('previewChips');

    // Só mostra se tiver data e pelo menos 3 caracteres na referência
    if (!dateInput || refInput.length < 3) {
        if(panel) panel.style.display = 'none';
        updateRadar(); // Atualiza radar (limpa preview visual do grid)
        return;
    }

    const futureDates = calculateSRSDates(dateInput);
    
    // Calcula carga atual para verificar sobrecarga
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

let pendingVerseData = null; // Armazena dados temporariamente para resolução de conflito

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

    // --- NOVA LÓGICA DE INTERCEPTAÇÃO DE SOBRECARGA ---
    const overloadLimit = 5; // Limite de itens por dia
    const loadMap = getCurrentLoadMap();
    
    // Verifica se algum dia calculado já excede o limite
    const congestedDates = reviewDates.filter(d => (loadMap[d] || 0) >= overloadLimit);

    if (congestedDates.length > 0) {
        // PAUSA TUDO e abre o Modal de Conflito
        pendingVerseData = { ref, text, startDate, dates: reviewDates };
        
        const modal = document.getElementById('conflictModal');
        const msg = document.getElementById('conflictMsg');
        msg.innerHTML = `As datas: <b>${congestedDates.map(d=>d.split('-').reverse().slice(0,2).join('/')).join(', ')}</b> já estão cheias.<br><br>Deseja buscar automaticamente os próximos dias livres para equilibrar sua agenda?`;
        
        modal.style.display = 'flex';
        return; // Interrompe o salvamento
    }

    // Se não houver conflito, salva direto
    finalizeSave(ref, text, startDate, reviewDates);
};

// Lógica de Salvamento Final (extraída para ser reusável)
function finalizeSave(ref, text, startDate, reviewDates) {
    const newVerse = {
        id: Date.now(),
        ref: ref,
        text: text,
        startDate: startDate,
        dates: reviewDates
    };
    appData.verses.push(newVerse);
    saveToStorage(); // Salva localmente (backup/offline)

    // Conexão com a Nuvem
    if (window.saveVerseToFirestore) {
        window.saveVerseToFirestore(newVerse); 
    }

    updateTable();
    updateRadar();
    updatePacingUI(); // Atualiza bloqueio imediatamente
    renderDashboard(); // Atualiza dashboard se adicionou algo para hoje

    generateICSFile(newVerse, reviewDates);

    document.getElementById('ref').value = '';
    document.getElementById('text').value = '';
    
    // Atualiza/Limpa o painel de previsão
    updatePreviewPanel();
    
    showToast(`"${ref}" agendado com sucesso!`, 'success');
}

// --- LÓGICA DE OTIMIZAÇÃO (Smart Reschedule) ---
window.confirmSmartReschedule = function() {
    if(!pendingVerseData) return;

    const optimizedDates = pendingVerseData.dates.map(dateStr => {
        // Se a data está cheia, procura a próxima livre
        return findNextLightDay(dateStr);
    });

    finalizeSave(pendingVerseData.ref, pendingVerseData.text, pendingVerseData.startDate, optimizedDates);
    
    document.getElementById('conflictModal').style.display = 'none';
    showToast('Agenda otimizada com sucesso!', 'success');
};

window.closeConflictModal = function() {
    document.getElementById('conflictModal').style.display = 'none';
    pendingVerseData = null;
};

// Algoritmo Recursivo para achar dia livre
function findNextLightDay(dateStr) {
    const limit = 5;
    const loadMap = getCurrentLoadMap();
    let current = new Date(dateStr + 'T00:00:00');
    
    // Loop de segurança (tenta até 30 dias para frente)
    for(let i=0; i<30; i++) {
        const iso = getLocalDateISO(current);
        if ((loadMap[iso] || 0) < limit) {
            return iso;
        }
        current.setDate(current.getDate() + 1); // Tenta o dia seguinte
    }
    return dateStr; // Fallback (se tudo estiver cheio, mantém o original)
}

// Auxiliar para pegar mapa de carga
function getCurrentLoadMap() {
    const map = {};
    appData.verses.forEach(v => {
        v.dates.forEach(d => {
            map[d] = (map[d] || 0) + 1;
        });
    });
    return map;
}

// --- GERAÇÃO DE ICS ---
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
        const dtEnd = getLocalDateISO(dEnd).replace(/-/g, '');

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

// --- NOVA LÓGICA: DASHBOARD (Renderiza Missão do Dia) ---
function renderDashboard() {
    const dash = document.getElementById('todayDashboard');
    const list = document.getElementById('todayList');
    const countEl = document.getElementById('todayCount');
    if(!dash || !list) return;

    const todayStr = getLocalDateISO(new Date()); // USA DATA SEGURA
    
    // Filtra versículos que têm revisão HOJE
    const todayVerses = appData.verses.filter(v => v.dates.includes(todayStr));

    // MOSTRAR SEMPRE, MESMO VAZIO (Para validar o layout)
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

// Wrapper para abrir o flashcard direto do dashboard
window.startFlashcardFromDash = function(id) {
    document.getElementById('reviewModal').style.display = 'flex'; // Abre Modal Principal
    startFlashcard(id); // Inicia Card direto
};


// --- 7. CHANGELOG & UTILITÁRIOS ---
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

// --- GESTÃO DE EXCLUSÃO COM UNDO E NUVEM ---

let undoTimer = null;
let verseBackup = null; // Guarda o versículo temporariamente
let verseIndexBackup = -1; // Guarda a posição original

// Nova função de exclusão com "Soft Delete"
window.deleteVerse = function(id) {
    // 1. Se já houver um timer rodando, finaliza o anterior imediatamente
    if (undoTimer) clearTimeout(undoTimer);

    // 2. Encontra e faz backup do item
    const index = appData.verses.findIndex(v => v.id === id);
    if (index === -1) return;

    verseBackup = appData.verses[index];
    verseIndexBackup = index;

    // 3. Remove VISUALMENTE (Soft Delete)
    appData.verses.splice(index, 1);
    updateTable();
    updateRadar();
    updatePacingUI();
    renderDashboard(); // Atualiza painel do dia
    
    // 4. Mostra Toast com botão de Desfazer
    showUndoToast(id);

    // 5. Inicia contagem regressiva para "Hard Delete" (Persistência)
    undoTimer = setTimeout(() => {
        finalizeDeletion(id);
    }, 5000); // 5 segundos para arrepender
};

// Função chamada se o usuário clicar em "Desfazer"
window.handleUndo = function() {
    if (!verseBackup) return;

    // Cancela a exclusão permanente
    clearTimeout(undoTimer);
    undoTimer = null;

    // Restaura os dados
    appData.verses.splice(verseIndexBackup, 0, verseBackup);
    
    // Atualiza UI
    updateTable();
    updateRadar();
    updatePacingUI();
    renderDashboard();
    
    // Limpa backup
    verseBackup = null;
    
    // Feedback
    const box = document.getElementById('toastBox');
    if(box) box.innerHTML = ''; // Limpa o toast de undo
    showToast('Ação desfeita!', 'success');
};

// Função que efetiva a exclusão (Local + Nuvem)
function finalizeDeletion(id) {
    // Agora sim, salvamos o novo estado no LocalStorage
    saveToStorage(); 
    
    // E chamamos o Firebase (que vai decidir se deleta agora ou enfileira)
    if (window.handleCloudDeletion) {
        window.handleCloudDeletion(id);
    }
    
    verseBackup = null; // Limpa backup da memória
    console.log('Exclusão efetivada.');
}

// Toast Customizado para Undo
function showUndoToast(id) {
    const box = document.getElementById('toastBox');
    if(!box) return;
    
    const el = document.createElement('div');
    el.className = `toast warning`;
    el.innerHTML = `
        🗑️ Item excluído. 
        <button onclick="handleUndo()" class="toast-undo-btn">Desfazer</button>
    `;
    
    box.innerHTML = ''; // Garante apenas 1 toast de undo por vez
    box.appendChild(el);
    
    // Remove visualmente o toast após 5s (sincronizado com o timer)
    setTimeout(() => {
        if(el.parentNode) el.remove();
    }, 5000);
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
            renderDashboard();
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
                    renderDashboard(); // Atualiza dashboard com dados da nuvem
                    showToast('Dados sincronizados da nuvem!', 'success');
                }
            });
        }
    }, 2000); 
}
