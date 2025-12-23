// js/srs-engine.js - Lógica SRS, Datas e Processamento de Texto
import { appData } from './core.js';

// --- DATA & HORA ---
export function getLocalDateISO(dateObj) {
    if(!dateObj) return '';
    const offset = dateObj.getTimezoneOffset() * 60000;
    const localTime = new Date(dateObj.getTime() - offset);
    return localTime.toISOString().split('T')[0];
}

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

// --- ALGORITMO DE OTIMIZAÇÃO (SMART RESCHEDULE) ---
export function getCurrentLoadMap() {
    const map = {};
    appData.verses.forEach(v => {
        v.dates.forEach(d => {
            map[d] = (map[d] || 0) + 1;
        });
    });
    return map;
}

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

// --- PROCESSAMENTO DE TEXTO (NEURO) ---
export function generateClozeText(text) {
    const words = text.split(' ');
    return words.map(word => {
        const cleanWord = word.replace(/[.,;!?]/g, '');
        if (cleanWord.length > 3 && Math.random() > 0.6) {
            return "______"; 
        }
        return word;
    }).join(' ');
}

export function getAcronym(text) {
    return text.split(' ').map(w => {
        const firstChar = w.charAt(0);
        const punctuation = w.match(/[.,;!?]+$/) ? w.match(/[.,;!?]+$/)[0] : '';
        return firstChar + punctuation; 
    }).join('  ');
}

// --- GERAÇÃO DE ARQUIVO ICS ---
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

function escapeICS(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\')
              .replace(/;/g, '\\;')
              .replace(/,/g, '\\,')
              .replace(/\n/g, '\\n');
}
