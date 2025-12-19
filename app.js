// app.js
// ARQUITETO: Versão Consolidada com Sync Realtime e Exclusão Cloud

// --- 1. GESTÃO DE ESTADO (Model) ---
let appData = {
    verses: [], // { id, ref, text, startDate, dates: [] }
    settings: { planInterval: 1 }, // 1=Diário, 2=Alternado, 3=Leve
    stats: { streak: 0, lastLogin: null } // Controle de Constância
};

window.onload = function() {
    // --- 0. REGISTRO DO SERVICE WORKER (PWA) ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('SW registrado com sucesso:', reg.scope))
            .catch(err => console.error('Falha ao registrar SW:', err));
    }

    if (window.initChangelog) initChangelog();
    loadFromStorage();

    // Define data de hoje no input
    const today = new Date();
    const startDateInput = document.getElementById('startDate');
    if(startDateInput) startDateInput.valueAsDate = today;

    // Listeners para o Painel de Previsão (Reatividade)
    const refInput = document.getElementById('ref');
    if(startDateInput) startDateInput.addEventListener('change', updatePreviewPanel);
    if(refInput) refInput.addEventListener('input', updatePreviewPanel);

    // Inicializações de Lógica
    checkStreak();
    updateTable();
    updateRadar();
    updatePacingUI();
};

// --- GESTÃO DE ARMAZENAMENTO LOCAL (Persistência Offline) ---
function saveToStorage() {
    localStorage.setItem('neuroBibleData', JSON.stringify(appData));
    // updateRadar(); // Removido para evitar redundância, updateRadar é chamado nas ações
}

function loadFromStorage() {
    const data = localStorage.getItem('neuroBibleData');
    if (data) {
        const parsed = JSON.parse(data);
        // Merge para garantir compatibilidade de versões
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
    // Sequência: Hoje (0), Amanhã (1), 3, 7, 14, 21, 30, 60
    const intervals = [0, 1, 3, 7, 14, 21, 30, 60];
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
    const startDateEl = document.getElementById('startDate');
    const startDateInput = startDateEl ? startDateEl.value : null;

    // Só calcula preview se tiver data válida
    const currentPreviewDates = startDateInput ? calculateSRSDates(startDateInput) : [];
    const loadMap = {};

    // A. Somar Carga Histórica
    appData.verses.forEach(v => {
        if(v.dates) {
            v.dates.forEach(d => {
                loadMap[d] = (loadMap[d] || 0) + 1;
            });
        }
    });

    // B. Somar Carga Preview (se houver input)
    const refEl = document.getElementById('ref');
    const isPreviewActive = refEl && refEl.value.trim() !== "";

    if (isPreviewActive) {
        currentPreviewDates.forEach(d => {
            loadMap[d] = (loadMap[d] || 0) + 1;
        });
    }

    // C. Verificação de Carga de HOJE
    const today = new Date();
    const todayStr = formatDateISOSimple(today);
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
    for (let i = 0; i < 63; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const dateStr = formatDateISOSimple(d);
        const count = loadMap[dateStr] || 0;

        const cell = document.createElement('div');
        cell.className = 'day-cell';

        // Interatividade da Célula
        if (count > 0) {
            cell.style.cursor = 'pointer';
            cell.onclick = () => {
                // Se o modal do radar estiver aberto, fecha ele
                if(document.getElementById('radarModal').style.display === 'flex'){
                    closeRadarModal();
                }
                openDailyReview(dateStr);
            };
            cell.title = `${count} versículos para revisar`;
        }

        // Classes de Carga (Heatmap)
        if (count === 0) cell.classList.add('load-0');
        else if (count <= 2) cell.classList.add('load-low');
        else if (count <= 5) cell.classList.add('load-med');
        else cell.classList.add('load-high');

        if (isPreviewActive && currentPreviewDates.includes(dateStr)) {
            cell.classList.add('is-preview');
        }

        const dayLabel = d.getDate().toString().padStart(2, '0');
        // Se for hoje, destaca visualmente
        if (i === 0) cell.style.border = "1px solid #fff";

        cell.innerHTML = `${dayLabel}
**${count > 0 ? count : ''}**`;
        grid.appendChild(cell);
    }
}

// --- 4. FUNÇÕES DE CONSTÂNCIA E RITMO ---
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
            // Reset streak se pulou um dia (exceto se for o primeiro uso)
            if(lastLogin) appData.stats.streak = 1;
            else appData.stats.streak = 1; 
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
    
    // Configs Visuais
    const planConfig = {
        1: { label: "Diário", icon: '🐰' },
        2: { label: "Alternado", icon: '🐢' },
        3: { label: "Modo Leve", icon: '🐌' }
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
        // Ordena para pegar o mais recente
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
        btn.title = "Novo versículo liberado! O tempo de plantar chegou.";
    } else {
        const remaining = interval - diffDays;
        setPacingState(btn, 'blocked');
        btn.title = `Aguarde ${remaining} dia(s). O descanso faz parte do plano.`;
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
    
    // Calcula carga para verificar sobrecarga
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
            const isOverloaded = load >= 5; // Regra de negócio: > 5 é muito
            
            const chipClass = isOverloaded ? 'date-chip is-overloaded' : 'date-chip';
            const titleAttr = isOverloaded ? `Sobrecarga! Dia já tem ${load} revisões.` : `Dia com ${load} revisões.`;

            return `<span class="${chipClass}" title="${titleAttr}">Rev ${index+1}: ${dayName} ${formattedDate}</span>`;
        }).join('');
    }
    updateRadar();
}

// --- 5. AÇÃO PRINCIPAL: ADICIONAR VERSÍCULO ---
window.processAndGenerate = function() {
    // 1. Verificação de Bloqueio
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

    // Atualiza Local
    appData.verses.push(newVerse);
    saveToStorage();

    // Sincroniza Nuvem (Se disponível)
    if (window.saveVerseToFirestore) {
        window.saveVerseToFirestore(newVerse);
    }

    // UI Updates
    updateTable();
    updateRadar();
    updatePacingUI();
    generateICSFile(newVerse, reviewDates);

    // Reset Inputs
    document.getElementById('ref').value = '';
    document.getElementById('text').value = '';
    updatePreviewPanel();
    
    showToast(`"${ref}" agendado com sucesso!`, 'success');
};

// --- 6. GERADOR ICS (Calendário) ---
function generateICSFile(verseData, dates) {
    const uidBase = verseData.id;
    const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//NeuroBible//SRS Manager//PT',
        'CALSCALE:GREGORIAN'
    ].join('
');

    const clozeText = generateClozeText(verseData.text);
    const rawDescription = 
        `🧠 DESAFIO (Recuperação Ativa)
Complete mentalmente:

"${clozeText}"

` +
        `.
.
.
.
👇 Role para a resposta
.
.
.
` + 
        `📖 RESPOSTA:
${verseData.text}`;
    
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
        ].join('
');

        icsContent += '
' + eventBlock;
    });

    icsContent += '
END:VCALENDAR';

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
    return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/
/g, '\
');
}

// --- 7. SISTEMA DE REVISÃO (Flashcards) ---
function openDailyReview(dateStr) {
    const versesToReview = appData.verses.filter(v => v.dates && v.dates.includes(dateStr));
    
    if (versesToReview.length === 0) return;

    const listContainer = document.getElementById('reviewList');
    const title = document.getElementById('reviewTitle');

    document.getElementById('radarModal').style.display = 'none'; // Garante fechar o radar
    document.getElementById('reviewModal').style.display = 'flex';
    document.getElementById('reviewListContainer').style.display = 'block';
    document.getElementById('flashcardContainer').style.display = 'none';
    document.getElementById('flashcardInner').classList.remove('is-flipped');

    const dateObj = new Date(dateStr + 'T00:00:00');
    title.innerText = `Revisão: ${dateObj.toLocaleDateString('pt-BR')}`;

    listContainer.innerHTML = versesToReview.map(v => `
        <div class="review-item" onclick="startFlashcard(${v.id})">
            <span>${v.ref}</span>
            <span style="font-size:0.8em; color:#666">Toque para revisar</span>
        </div>
    `).join('');
}

window.startFlashcard = function(id) {
    const verse = appData.verses.find(v => v.id === id);
    if(!verse) return;

    document.getElementById('reviewListContainer').style.display = 'none';
    document.getElementById('flashcardContainer').style.display = 'flex';

    document.getElementById('fcFrontText').innerText = verse.ref;
    
    // Gera Cloze (Lacunas) para o verso
    const cloze = generateClozeText(verse.text);
    document.getElementById('fcBackRef').innerText = verse.ref;
    document.getElementById('fcBackText').innerHTML = `
        <p style="color:#e67e22; font-weight:bold; margin-bottom:10px;">Complete:</p>
        <p>${cloze}</p>
        <hr style="margin:15px 0; border:0; border-top:1px solid #eee">
        <p style="color:#27ae60; font-weight:bold;">Resposta:</p>
        <p>${verse.text}</p>
    `;
};

window.flipCard = function() {
    document.getElementById('flashcardInner').classList.toggle('is-flipped');
};

window.closeReviewModal = function() {
    document.getElementById('reviewModal').style.display = 'none';
    document.getElementById('flashcardInner').classList.remove('is-flipped');
};

function generateClozeText(text) {
    if(!text) return "";
    const words = text.split(' ');
    return words.map(word => {
        const cleanWord = word.replace(/[.,;!?]/g, '');
        // Oculta palavras com mais de 3 letras aleatoriamente (60% chance)
        if (cleanWord.length > 3 && Math.random() > 0.4) {
            return "______";
        }
        return word;
    }).join(' ');
}

// --- 8. GERENCIAMENTO DE TABELA E EXCLUSÃO (Prioridade 1) ---

window.updateTable = function() {
    const container = document.getElementById('versesList'); // Ajuste conforme seu HTML real (tbody ou div)
    if (!container) return;

    // Se a lista estiver vazia
    if (appData.verses.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#999">Nenhum versículo cadastrado ainda.</div>';
        return;
    }

    // Ordena por data de criação (mais novos primeiro)
    const sortedVerses = [...appData.verses].sort((a,b) => b.id - a.id);

    // Gera HTML da lista/tabela
    container.innerHTML = sortedVerses.map(v => `
        <div class="verse-card">
            <div class="verse-header">
                <strong>${v.ref}</strong>
                <span style="font-size:0.8rem; color:#666">${new Date(v.startDate).toLocaleDateString('pt-BR')}</span>
            </div>
            <div class="verse-body">
                ${v.text ? v.text.substring(0, 50) + (v.text.length > 50 ? '...' : '') : ''}
            </div>
            <div class="verse-actions">
                <button onclick="deleteVerse(${v.id})" class="btn-delete" title="Excluir Permanentemente">🗑️</button>
            </div>
        </div>
    `).join('');
};

/**
 * Função de Exclusão (Atualizada para Firebase - Prioridade 1)
 */
window.deleteVerse = function(id) {
    if (confirm('Tem certeza que deseja excluir? Isso removerá o versículo de todos os seus dispositivos.')) {
        // 1. Remove do Estado Local
        appData.verses = appData.verses.filter(v => v.id !== id);
        
        // 2. Salva Estado Local
        saveToStorage();
        
        // 3. Atualiza UI
        updateTable();
        updateRadar();
        updatePacingUI();
        
        // 4. Remove da Nuvem (Firebase)
        if (window.deleteVerseFromFirestore) {
            window.deleteVerseFromFirestore(id);
        }
        
        showToast('Versículo excluído.', 'warning');
    }
};

// --- 9. SINCRONIZAÇÃO EM TEMPO REAL (Prioridade 3) ---

/**
 * Esta função é chamada pelo firebase.js via onSnapshot
 * sempre que houver mudança no banco de dados.
 */
window.handleRemoteUpdate = function(cloudVerses) {
    console.log("Recebendo atualização da nuvem...", cloudVerses);
    
    // Atualiza o estado local com a verdade da nuvem
    appData.verses = cloudVerses;
    
    // Persiste e Atualiza UI
    saveToStorage();
    updateTable();
    updateRadar();
    updatePacingUI();
    
    // Feedback visual discreto (opcional)
    // showToast('Sincronizado.', 'success'); 
};

// --- 10. UTILITÁRIOS GERAIS (Modais e Toasts) ---

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
    // Ícones simples para feedback visual
    const icon = type === 'warning' ? '🗑️' : (type === 'error' ? '🛑' : '✅');
    el.innerHTML = `${icon} ${msg}`;
    
    box.appendChild(el);

    // Animação de entrada e remoção automática após 3 segundos
    setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
    }, 3000);
};

// Funções auxiliares finais
window.toggleTheme = function() {
    // Placeholder para implementação futura de tema escuro/claro
    alert("Tema escuro em breve!");
};
