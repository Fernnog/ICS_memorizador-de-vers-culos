// --- 1. GESTÃO DE ESTADO (Model) ---
let appData = {
    verses: [] // Lista de objetos: { id, ref, text, startDate, dates: [] }
};

// Inicialização
window.onload = function() {
    initChangelog(); // Inicializa o versionamento
    loadFromStorage();
    
    // Define data de hoje no input se estiver vazio
    const today = new Date();
    document.getElementById('startDate').valueAsDate = today;
    
    updateTable();
    updateRadar();
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
    
    // Estratégia Padrão: 1, 3, 7, 14, 21, 30, 60 dias
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

// --- 3. LÓGICA DO RADAR (Heatmap) ---
function updateRadar() {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    const startDateInput = document.getElementById('startDate').value;
    const currentPreviewDates = calculateSRSDates(startDateInput);

    const loadMap = {};

    // A. Somar Carga do Histórico
    appData.verses.forEach(v => {
        v.dates.forEach(d => {
            loadMap[d] = (loadMap[d] || 0) + 1;
        });
    });

    // B. Somar Carga do Preview
    const isPreviewActive = document.getElementById('ref').value.trim() !== "";
    if (isPreviewActive) {
        currentPreviewDates.forEach(d => {
            loadMap[d] = (loadMap[d] || 0) + 1;
        });
    }

    // C. Renderizar próximos 42 dias
    const today = new Date();
    for (let i = 0; i < 42; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const dateStr = formatDateISOSimple(d);
        const count = loadMap[dateStr] || 0;

        const cell = document.createElement('div');
        cell.className = 'day-cell';
        
        if (count === 0) cell.classList.add('load-0');
        else if (count <= 2) cell.classList.add('load-low');
        else if (count <= 5) cell.classList.add('load-med');
        else cell.classList.add('load-high');

        if (isPreviewActive && currentPreviewDates.includes(dateStr)) {
            cell.classList.add('is-preview');
        }

        const dayLabel = `${d.getDate()}/${d.getMonth()+1}`;
        cell.innerHTML = `<span>${dayLabel}</span><strong>${count > 0 ? count : '-'}</strong>`;
        grid.appendChild(cell);
    }
}

// --- 4. AÇÃO PRINCIPAL E INTEGRAÇÃO NEUROCIÊNCIA ---

// Algoritmo de Omissão (Cloze Deletion) para Recuperação Ativa
function generateClozeText(text) {
    const words = text.split(' ');
    // Oculta aleatoriamente palavras com mais de 3 letras (~40% de chance)
    return words.map(word => {
        const cleanWord = word.replace(/[.,;!?]/g, '');
        if (cleanWord.length > 3 && Math.random() > 0.6) {
            return "______"; // Lacuna visual
        }
        return word;
    }).join(' ');
}

window.processAndGenerate = function() {
    const ref = document.getElementById('ref').value.trim();
    const text = document.getElementById('text').value.trim();
    const startDate = document.getElementById('startDate').value;

    if (!ref || !startDate) {
        alert("Por favor, preencha a Referência e a Data de Início.");
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

    // Gera o ICS com a nova lógica de Recuperação Ativa
    generateICSFile(newVerse, reviewDates);

    document.getElementById('ref').value = '';
    document.getElementById('text').value = '';
    alert(`Versículo "${ref}" adicionado! O arquivo da agenda foi gerado com exercícios de memorização.`);
    updateRadar();
};

// --- 5. GERAÇÃO DE ICS (Com Active Recall) ---
function generateICSFile(verseData, dates) {
    const uidBase = verseData.id;
    const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//NeuroBible//SRS Manager//PT',
        'CALSCALE:GREGORIAN'
    ].join('\r\n');

    // 1. Gera texto com lacunas
    const clozeText = generateClozeText(verseData.text);
    
    // 2. Cria descrição com separação visual (Forçar Scroll)
    // O uso de \n aqui será convertido para \\n pelo escapeICS, criando quebras reais na agenda
    const rawDescription = 
        `🧠 DESAFIO DE MEMÓRIA (Recuperação Ativa)\n` +
        `Tente completar as lacunas mentalmente:\n\n` +
        `"${clozeText}"\n\n` +
        `.\n.\n.\n.\n.\n.\n.\n.\n` + 
        `👇 Role para ver a resposta\n.\n.\n.\n.\n` + 
        `📖 RESPOSTA ORIGINAL:\n${verseData.text}`;

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
    return str.replace(/\\/g, '\\\\')
              .replace(/;/g, '\\;')
              .replace(/,/g, '\\,')
              .replace(/\n/g, '\\n');
}

// --- 6. FUNÇÕES AUXILIARES, UI e CHANGELOG ---
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
    if(confirm('Remover este versículo do histórico de carga?')) {
        appData.verses = appData.verses.filter(v => v.id !== id);
        saveToStorage();
        updateTable();
        updateRadar();
    }
};

window.clearData = function() {
    if(confirm('ATENÇÃO: Isso apagará todo seu histórico. Continuar?')) {
        appData.verses = [];
        saveToStorage();
        updateTable();
        updateRadar();
    }
};

window.exportData = function() {
    const dataStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
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
            const loaded = JSON.parse(e.target.result);
            if (loaded.verses) {
                appData = loaded;
                saveToStorage();
                updateTable();
                updateRadar();
                alert("Backup restaurado com sucesso!");
            }
        } catch (err) {
            alert("Erro ao ler arquivo. Verifique se é um backup válido.");
        }
    };
    reader.readAsText(file);
};

// UI: Changelog
function initChangelog() {
    // Pega a versão mais recente do arquivo changelog.js
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
            <ul class="changelog-ul">
                ${log.changes.map(c => `<li>${c}</li>`).join('')}
            </ul>
        </div>
    `).join('');
    
    modal.style.display = 'flex';
};

window.closeChangelog = function() {
    document.getElementById('changelogModal').style.display = 'none';
};

// Expor updateRadar para o HTML
window.updateRadar = updateRadar;
