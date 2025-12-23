// js/srs-engine.js - Motor de Repetição Espaçada e Arquivos
import { getLocalDateISO, generateClozeText, escapeICS, showToast } from './utils.js';
import { appData } from './core.js';
import { saveToStorage } from './storage.js';

// --- CÁLCULOS SRS ---

export function calculateSRSDates(startDateStr) {
    if (!startDateStr) return [];
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

// Algoritmo Recursivo para achar dia livre (Load Management)
export function findNextLightDay(dateStr) {
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
    if (!appData.verses) return map;
    
    appData.verses.forEach(v => {
        v.dates.forEach(d => {
            map[d] = (map[d] || 0) + 1;
        });
    });
    return map;
}

// --- LÓGICA DE INTERAÇÃO ---

export function registerInteraction(verse) {
    const todayISO = getLocalDateISO(new Date());
    const wasOverdue = verse.dates.some(d => d < todayISO) && verse.lastInteraction !== todayISO;

    if (verse.lastInteraction !== todayISO) {
        verse.lastInteraction = todayISO;
        saveToStorage();
        
        // Sync Cloud (Opcional, se existir a função global ou importada)
        if (window.saveVerseToFirestore) window.saveVerseToFirestore(verse);

        if (wasOverdue) {
            showToast("🚀 Progresso registrado! Item recuperado.", "success");
        }
        return true; // Indica que houve atualização
    }
    return false;
}

// --- GERAÇÃO DE ICS (AGENDA) ---

export function generateICSFile(verseData, dates) {
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
