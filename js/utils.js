// js/utils.js - Funções Auxiliares Compartilhadas

/**
 * Retorna a data em formato ISO (YYYY-MM-DD) respeitando o fuso horário local.
 * Essencial para que o dia "hoje" seja realmente hoje, e não o horário de Londres (UTC).
 */
export function getLocalDateISO(dateObj) {
    if (!dateObj) return '';
    // Ajusta o offset do fuso horário em milissegundos
    const offset = dateObj.getTimezoneOffset() * 60000;
    const localTime = new Date(dateObj.getTime() - offset);
    return localTime.toISOString().split('T')[0];
}

/**
 * Gera o texto com lacunas (Cloze) para o desafio de memória.
 * Oculta palavras aleatoriamente se tiverem mais de 3 letras.
 */
export function generateClozeText(text) {
    if (!text) return '';
    const words = text.split(' ');
    return words.map(word => {
        // Remove pontuação para analisar o tamanho da palavra
        const cleanWord = word.replace(/[.,;!?]/g, '');
        // 60% de chance de ocultar palavras com mais de 3 letras
        if (cleanWord.length > 3 && Math.random() > 0.6) {
            return "______"; 
        }
        return word;
    }).join(' ');
}

/**
 * Gera o acrônimo (apenas as iniciais) do texto.
 * Mantém a pontuação para ajudar no ritmo da leitura mental.
 */
export function getAcronym(text) {
    if (!text) return '';
    return text.split(' ').map(w => {
        const firstChar = w.charAt(0);
        // Tenta preservar a pontuação final da palavra, se existir
        const punctuation = w.match(/[.,;!?]+$/) ? w.match(/[.,;!?]+$/)[0] : '';
        return firstChar + punctuation; 
    }).join('  ');
}

/**
 * Escapa caracteres especiais para gerar o arquivo de agenda (.ics) corretamente.
 * Evita quebras de linha ou vírgulas que corrompam o calendário.
 */
export function escapeICS(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\')
              .replace(/;/g, '\\;')
              .replace(/,/g, '\\,')
              .replace(/\n/g, '\\n');
}

/**
 * Exibe as notificações flutuantes (Toasts) na tela.
 * Atualizado v1.2.0: Uso de SVGs profissionais em vez de emojis.
 * @param {string} msg - A mensagem a ser exibida.
 * @param {string} type - 'success', 'warning' ou 'error'.
 */
export function showToast(msg, type = 'success') {
    const box = document.getElementById('toastBox');
    if (!box) {
        console.warn('ToastBox não encontrado no DOM.');
        return;
    }
    
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    
    // Define ícones SVG baseados no tipo (Estilo Clean/Outline)
    let iconSvg = '';
    
    if (type === 'success') {
        // Check Icon
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (type === 'warning') {
        // Alert Icon
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    } else if (type === 'error') {
        // X Icon
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    }

    el.innerHTML = `${iconSvg} <span style="margin-left: 8px;">${msg}</span>`;
    
    box.appendChild(el);

    // Animação de entrada e saída
    // (O CSS já cuida da animação de entrada via keyframes)
    setTimeout(() => {
        el.style.opacity = '0'; // Fade out
        setTimeout(() => {
            if (el.parentNode) el.remove(); // Remove do DOM
        }, 300);
    }, 4000);
}
