// --- 1. GESTÃO DE ESTADO (Model) ---
let appData = {
    verses: [] // Lista de objetos: { id, ref, text, startDate, dates: [] }
};

// Inicialização
window.onload = function() {
    loadFromStorage();
    
    // Define data de hoje no input
    const today = new Date();
    document.getElementById('startDate').valueAsDate = today;
    
    updateTable();
    updateRadar();
};

function saveToStorage() {
    localStorage.setItem('neuroBibleData', JSON.stringify(appData));
    updateRadar(); // Recalcular radar sempre que salvar
}

function loadFromStorage() {
    const data = localStorage.getItem('neuroBibleData');
    if (data) {
        appData = JSON.parse(data);
    }
}

// --- 2. LÓGICA DE NEUROAPRENDIZAGEM (SRS) ---
// Retorna array de strings 'YYYY-MM-DD'
function calculateSRSDates(startDateStr) {
    if (!startDateStr) return [];
    
    // Estratégia Padrão: 1, 3, 7, 14, 21, 30, 60 dias
    const intervals = [1, 3, 7, 14, 21, 30, 60];
    const dates = [];
    const start = new Date(startDateStr + 'T00:00:00'); // Força local time meia noite

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

    // Mapa de carga: { '2023-10-01': 5, '2023-10-02': 2 }
    const loadMap = {};

    // A. Somar Carga do Histórico
    appData.verses.forEach(v => {
        v.dates.forEach(d => {
            loadMap[d] = (loadMap[d] || 0) + 1;
        });
    });

    // B. Somar Carga do Preview (O que o usuário está digitando)
    const isPreviewActive = document.getElementById('ref').value.trim() !== "";
    if (isPreviewActive) {
        currentPreviewDates.forEach(d => {
            loadMap[d] = (loadMap[d] || 0) + 1;
        });
    }

    // C. Renderizar próximos 42 dias (6 semanas)
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const dateStr = formatDateISOSimple(d);
        const count = loadMap[dateStr] || 0;

        const cell = document.createElement('div');
        cell.className = 'day-cell';
        
        // Cores baseadas na carga
        if (count === 0) cell.classList.add('load-0');
        else if (count <= 2) cell.classList.add('load-low');
        else if (count <= 5) cell.classList.add('load-med');
        else cell.classList.add('load-high');

        // Borda azul se for data do novo versículo
        if (isPreviewActive && currentPreviewDates.includes(dateStr)) {
            cell.classList.add('is-preview');
        }

        const dayLabel = `${d.getDate()}/${d.getMonth()+1}`;
        cell.innerHTML = `<span>${dayLabel}</span><strong>${count > 0 ? count : '-'}</strong>`;
        grid.appendChild(cell);
    }
}

// --- 4. AÇÃO PRINCIPAL ---
// Expondo explicitamente ao window para garantir que o onclick do HTML funcione
window.processAndGenerate = function() {
    const ref = document.getElementById('ref').value.trim();
    const text = document.getElementById('text').value.trim();
    const startDate = document.getElementById('startDate').value;

    if (!ref || !startDate) {
        alert("Por favor, preencha a Referência e a Data de Início.");
        return;
    }

    // 1. Calcular Datas Reais
    const reviewDates = calculateSRSDates(startDate);

    // 2. Salvar no Estado
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

    // 3. Gerar ICS
    generateICSFile(newVerse, reviewDates);

    // 4. Limpar Form
    document.getElementById('ref').value = '';
    document.getElementById('text').value = '';
    alert(`Versículo "${ref}" adicionado ao sistema e agenda gerada!`);
    updateRadar(); // Remove o preview azul
};

// --- 5. GERAÇÃO DE ICS (Formato iCal) ---
function generateICSFile(verseData, dates) {
    const uidBase = verseData.id;
    const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    // Cabeçalho ICS
    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//NeuroBible//SRS Manager//PT',
        'CALSCALE:GREGORIAN'
    ].join('\r\n');

    // Gera um VEVENT para cada data calculada
    dates.forEach((dateStr, index) => {
        // Converter YYYY-MM-DD para formato ICS Date (YYYYMMDD)
        const dtStart = dateStr.replace(/-/g, '');
        
        // Data final (dia seguinte, pois é evento de dia inteiro)
        const dEnd = new Date(dateStr + 'T00:00:00');
        dEnd.setDate(dEnd.getDate() + 1);
        const dtEnd = formatDateISOSimple(dEnd).replace(/-/g, '');

        const description = escapeICS(verseData.text);
        const summary = `Memorizar: ${verseData.ref} (Rev ${index+1})`;

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

    // Download
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

// --- 6. FUNÇÕES AUXILIARES E UI ---
function updateTable() {
    const tbody = document.querySelector('#historyTable tbody');
    document.getElementById('countDisplay').innerText = appData.verses.length;
    tbody.innerHTML = '';

    // Mostra os mais recentes primeiro
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

// Expondo ao window para os botões do HTML funcionarem
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

// Também precisamos expor updateRadar para o input "onchange" no HTML
window.updateRadar = updateRadar;
      
