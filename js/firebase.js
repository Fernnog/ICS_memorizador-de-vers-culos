// js/firebase.js - Conexão Nuvem e Autenticação (v1.2.0 - Sync Fix)

// 1. CONFIGURAÇÃO DO FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyBcwdrOVkKdM9wCNXIH-G-wM7D07vpBJIQ",
    authDomain: "neurobible-5b44f.firebaseapp.com",
    projectId: "neurobible-5b44f",
    storageBucket: "neurobible-5b44f.firebasestorage.app",
    messagingSenderId: "1050657162706",
    appId: "1:1050657162706:web:03d8101b6b6e15d92bf40b",
    measurementId: "G-P92Z7DFW7N"
};

// Inicialização segura
let db, auth;
let currentUser = null;

try {
    if (firebase.apps.length === 0) {
        firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    auth = firebase.auth();
    console.log("Firebase inicializado com sucesso.");
} catch (error) {
    console.error("Erro ao inicializar Firebase. Verifique suas chaves de API.", error);
}

// --- GESTÃO DE FILA OFFLINE (SYNC QUEUE) ---

// Adiciona item à fila local quando falha a rede
function addToSyncQueue(action, collection, docId, data) {
    const queue = JSON.parse(localStorage.getItem('neuroBibleSyncQueue') || '[]');
    // Adiciona nova pendência com timestamp
    queue.push({ action, collection, docId, data, timestamp: Date.now() });
    localStorage.setItem('neuroBibleSyncQueue', JSON.stringify(queue));
    
    if (window.showToast) window.showToast("Sem rede. Salvo localmente para sync posterior.", "warning");
}

// Processa a fila (chamado quando volta online ou ao iniciar)
window.processSyncQueue = function() {
    const queue = JSON.parse(localStorage.getItem('neuroBibleSyncQueue') || '[]');
    if (queue.length === 0) return;

    console.log(`[Sync] Processando ${queue.length} itens pendentes...`);
    
    // Limpa a fila do storage para evitar loops, processa a cópia em memória
    localStorage.setItem('neuroBibleSyncQueue', '[]');

    queue.forEach(item => {
        if (item.action === 'set') {
            if (item.collection === 'verses') {
                window.saveVerseToFirestore(item.data, true); // true = isRetry (sem toast)
            } else if (item.collection === 'settings') {
                window.saveSettingsToFirestore(item.data, true);
            }
        } else if (item.action === 'delete') {
            window.handleCloudDeletion(item.docId, true);
        }
    });
};

// Listeners de Rede (Feedback Visual & Gatilhos)
window.addEventListener('online', () => {
    if (window.showToast) window.showToast("Conexão restaurada. Sincronizando...", "success");
    
    // Atualiza indicador visual para Verde se estiver logado
    const dot = document.getElementById('authStatusDot');
    if(dot && currentUser) dot.style.backgroundColor = "#2ecc71"; 

    window.processSyncQueue();
    
    // Tenta puxar dados atualizados ao reconectar
    if(window.loadVersesFromFirestore && window.handleCloudData) {
        window.loadVersesFromFirestore(window.handleCloudData);
    }
});

window.addEventListener('offline', () => {
    if (window.showToast) window.showToast("Você está offline. Alterações salvas localmente.", "warning");
    
    // Atualiza indicador visual para Vermelho
    const dot = document.getElementById('authStatusDot');
    if(dot) dot.style.backgroundColor = "#e74c3c"; 
});


// --- 2. GESTÃO DE AUTENTICAÇÃO (Auth) ---

if (auth) {
    auth.onAuthStateChanged((user) => {
        const loginState = document.getElementById('loginState');
        const userState = document.getElementById('userState');
        const userEmailDisplay = document.getElementById('userEmailDisplay');
        const dot = document.getElementById('authStatusDot');

        if (user) {
            // --- USUÁRIO LOGADO ---
            currentUser = user;
            console.log("Usuário conectado:", user.email);
            
            if(loginState) loginState.style.display = 'none';
            if(userState) userState.style.display = 'block';
            if(userEmailDisplay) userEmailDisplay.innerText = user.email;
            
            // Indicador visual no header (Verde se online)
            if (dot) dot.style.backgroundColor = navigator.onLine ? "#2ecc71" : "#e74c3c";

            // CRÍTICO: Carrega dados e passa para a PONTE no main.js
            if (window.loadVersesFromFirestore) {
                window.loadVersesFromFirestore((data) => {
                   if(window.handleCloudData && data) {
                       window.handleCloudData(data);
                   } else {
                       console.log('Dados baixados, mas UI ainda não pronta.');
                   }
                });
            }
            
            // Tenta processar fila pendente ao logar
            if (window.processSyncQueue) window.processSyncQueue();

        } else {
            // --- USUÁRIO DESLOGADO ---
            currentUser = null;
            console.log("Usuário desconectado.");
            
            if(loginState) loginState.style.display = 'block';
            if(userState) userState.style.display = 'none';
            
            if (dot) dot.style.backgroundColor = "#ccc"; // Cinza
        }
    });
}

window.openAuthModal = function() {
    document.getElementById('authModal').style.display = 'flex';
};

window.closeAuthModal = function() {
    document.getElementById('authModal').style.display = 'none';
};

window.handleLogin = function() {
    const email = document.getElementById('authEmail').value;
    const pass = document.getElementById('authPassword').value;

    if (!email || !pass) return showToast("Preencha e-mail e senha.", "error");

    auth.signInWithEmailAndPassword(email, pass)
        .then((userCredential) => {
            window.showToast("Login realizado!", "success");
            window.closeAuthModal();
        })
        .catch((error) => {
            console.error(error);
            let msg = error.message;
            if (error.code === 'auth/wrong-password') msg = "Senha incorreta.";
            if (error.code === 'auth/user-not-found') msg = "E-mail não cadastrado.";
            window.showToast("Erro: " + msg, "error");
        });
};

window.handleLogout = function() {
    auth.signOut().then(() => {
        window.showToast("Você saiu da conta.", "warning");
        // Opcional: Limpar dados locais ao sair
        // window.clearData(); 
    });
};


// --- 3. INTEGRAÇÃO COM FIRESTORE (Database) ---

// Salvar Versículo (Com Retry/Queue)
window.saveVerseToFirestore = function(verse, isRetry = false) {
    if (!currentUser || !db) return; 

    db.collection('users').doc(currentUser.uid).collection('verses').doc(String(verse.id))
        .set(verse)
        .then(() => {
            console.log("Versículo salvo na nuvem:", verse.ref);
            // Feedback Visual: Apenas se não for retry automático
            if (!isRetry && window.showToast) window.showToast("Salvo na nuvem", "success");
        })
        .catch((err) => {
            console.warn("Falha no save, adicionando à fila:", err);
            // Se falhar e não for retry, joga pra fila
            if (!isRetry) addToSyncQueue('set', 'verses', verse.id, verse);
        });
};

// Salvar Configurações (Com Retry/Queue)
window.saveSettingsToFirestore = function(settings, isRetry = false) {
    if (!currentUser || !db) return;

    db.collection('users').doc(currentUser.uid)
        .set({ settings: settings }, { merge: true })
        .then(() => console.log("Configurações sincronizadas."))
        .catch((err) => {
            console.warn("Falha no settings, adicionando à fila:", err);
            if (!isRetry) addToSyncQueue('set', 'settings', null, settings);
        });
};

// Carregar Dados
window.loadVersesFromFirestore = function(callback) {
    if (!currentUser || !db) return;

    // Carrega Configurações
    db.collection('users').doc(currentUser.uid).get()
        .then((doc) => {
            if (doc.exists && doc.data().settings) {
                if(window.appData) {
                    window.appData.settings = doc.data().settings;
                    if(window.updatePacingUI) window.updatePacingUI();
                }
            }
        });

    // Carrega Versículos
    db.collection('users').doc(currentUser.uid).collection('verses').get()
        .then((querySnapshot) => {
            const cloudVerses = [];
            querySnapshot.forEach((doc) => {
                cloudVerses.push(doc.data());
            });
            // Sempre chama o callback, mesmo vazio, para atualizar estado
            callback(cloudVerses);
        })
        .catch((error) => console.error("Erro ao baixar dados:", error));
};

// Deletar da Nuvem (Com Retry/Queue)
window.handleCloudDeletion = function(id, isRetry = false) {
    if (!currentUser || !db) return;

    db.collection('users').doc(currentUser.uid).collection('verses').doc(String(id))
        .delete()
        .then(() => {
            console.log("Item deletado da nuvem.");
            if (!isRetry && window.showToast) window.showToast("Removido da nuvem", "success");
        })
        .catch((error) => {
            console.error("Erro ao deletar na nuvem:", error);
            if (!isRetry) addToSyncQueue('delete', 'verses', id, null);
        });
};