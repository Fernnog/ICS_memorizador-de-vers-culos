// --- 1. GESTÃO DE ESTADO (Model) ---
let appData = {
    verses: [] // { id, ref, text, startDate, dates: [] }
};

window.onload = function() {
    initChangelog();
    loadFromStorage();
    
    // Define data de hoje
    const today = new Date();
    document.getElementById('startDate').valueAsDate = today;
    
    updateTable();
    updateRadar(); // Calcula carga e notificações ao iniciar
};

function saveToStorage() {
    localStorage.setItem('neuroBibleData', JSON.stringify(appData));
    updateRadar();
}

function loadFromStorage() {
    const data = localStorage.getItem('neuroBibleData');
    if (data) {
        appData = JSON.parse(data);
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
        // Define tooltip dinâmico
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

// --- CONTROLE DOS MODAIS NOVOS ---
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
    const ref = document.getElementById('ref').value.trim();
    const text = document.getElementById('text').value.trim();
    const startDate = document.getElementById('startDate').value;

    if (!ref || !startDate) {
        alert("Preencha Referência e Data.");
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

    generateICSFile(newVerse, reviewDates);

    document.getElementById('ref').value = '';
    document.getElementById('text').value = '';
    alert(`"${ref}" agendado com sucesso!`);
    updateRadar();
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
    }
};

window.clearData = function() {
    if(confirm('Limpar TUDO?')) {
        appData.verses = [];
        saveToStorage();
        updateTable();
        updateRadar();
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
            appData = JSON.parse(e.target.result);
            saveToStorage();
            updateTable();
            updateRadar();
            alert("Restaurado!");
        } catch (err) { alert("Erro no arquivo."); }
    };
    reader.readAsText(file);
};

function initChangelog() {
    const latest = window.neuroChangelog ? window.neuroChangelog[0] : { version: '0.0.0' };
    document.getElementById('currentVersion').innerText = `v${latest.version}`;
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
        
