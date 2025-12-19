// firebase.js
// ARQUITETO: Atualizado para suportar Exclusão Real e Sincronização em Tempo Real (onSnapshot)

// 1. CONFIGURAÇÃO
// Verifique se estes dados estão iguais aos do seu Console Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBcwdrOVkKdM9wCNXIH-G-wM7D07vpBJIQ",
    authDomain: "neurobible-5b44f.firebaseapp.com",
    projectId: "neurobible-5b44f",
    storageBucket: "neurobible-5b44f.firebasestorage.app",
    messagingSenderId: "1050657162706",
    appId: "1:1050657162706:web:03d8101b6b6e15d92bf40b",
    measurementId: "G-P92Z7DFW7N"
};

// Inicializa Firebase apenas se não houver instâncias anteriores
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
let unsubscribeVerses = null; // Variável para controlar a escuta em tempo real

// Habilita persistência offline do Firestore (Suporte Offline Híbrido)
db.enablePersistence()
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn('Persistência falhou: Múltiplas abas abertas.');
        } else if (err.code == 'unimplemented') {
            console.warn('Navegador não suporta persistência offline.');
        }
    });

// --- GESTÃO DE AUTENTICAÇÃO ---

// Monitor de Estado (Observer)
auth.onAuthStateChanged(user => {
    const dot = document.getElementById('authStatusDot');
    const btnLogout = document.getElementById('btnLogout');
    const authMsg = document.getElementById('authMessage');
    const emailInput = document.getElementById('authEmail');
    const passInput = document.getElementById('authPassword');

    if (user) {
        // Usuário LOGADO
        console.log('Firebase: Usuário conectado:', user.email);

        // Atualiza UI
        if(dot) dot.style.backgroundColor = '#2ecc71'; // Verde
        if(btnLogout) btnLogout.style.display = 'block';
        if(authMsg) authMsg.innerHTML = `Logado como: ${user.email}`;

        // Limpa campos para segurança visual
        if(emailInput) emailInput.value = '';
        if(passInput) passInput.value = '';

        // Prioridade 3: Inicia Sincronização em Tempo Real
        // Se a função global de atualização existir no app.js, nós a conectamos
        if (window.handleRemoteUpdate) {
            initRealtimeListener(user, window.handleRemoteUpdate);
        } else {
            // Fallback: Apenas carrega uma vez se o app.js não estiver pronto para realtime
             if(window.loadVersesFromFirestore) window.loadVersesFromFirestore(); 
        }

    } else {
        // Usuário DESLOGADO
        console.log('Firebase: Usuário desconectado');
        
        // Para de escutar atualizações para economizar dados
        if (unsubscribeVerses) {
            unsubscribeVerses();
            unsubscribeVerses = null;
        }

        if(dot) dot.style.backgroundColor = '#ccc'; // Cinza
        if(btnLogout) btnLogout.style.display = 'none';
        if(authMsg) authMsg.innerText = "Entre para sincronizar seus versículos.";
    }
});

// Funções de UI (Expostas globalmente para o HTML)
window.handleLogin = function() {
    const email = document.getElementById('authEmail').value;
    const pass = document.getElementById('authPassword').value;

    if(!email || !pass) {
        showToast('Preencha e-mail e senha.', 'error');
        return;
    }

    auth.signInWithEmailAndPassword(email, pass)
        .then((userCredential) => {
            closeAuthModal();
            showToast('Login realizado com sucesso!', 'success');
        })
        .catch((error) => {
            console.error(error);
            let msg = 'Erro no login.';
            if(error.code === 'auth/user-not-found') msg = 'Usuário não encontrado.';
            if(error.code === 'auth/wrong-password') msg = 'Senha incorreta.';
            showToast(msg, 'error');
        });
};

window.handleSignUp = function() {
    const email = document.getElementById('authEmail').value;
    const pass = document.getElementById('authPassword').value;

    if(!email || !pass) {
        showToast('Preencha e-mail e senha.', 'error');
        return;
    }

    auth.createUserWithEmailAndPassword(email, pass)
        .then((userCredential) => {
            closeAuthModal();
            showToast('Conta criada! Bem-vindo.', 'success');
        })
        .catch((error) => {
            console.error(error);
            let msg = 'Erro ao criar conta.';
            if(error.code === 'auth/email-already-in-use') msg = 'E-mail já cadastrado.';
            if(error.code === 'auth/weak-password') msg = 'Senha muito fraca.';
            showToast(msg, 'error');
        });
};

window.handleLogout = function() {
    if(confirm('Deseja realmente sair?')) {
        auth.signOut().then(() => {
            closeAuthModal();
            showToast('Você saiu da conta.', 'warning');
            // Opcional: Recarregar a página para limpar dados da memória visual
            // location.reload(); 
        });
    }
};

// Controle do Modal
window.openAuthModal = function() {
    document.getElementById('authModal').style.display = 'flex';
};

window.closeAuthModal = function() {
    document.getElementById('authModal').style.display = 'none';
};

// --- LÓGICA FIRESTORE (Prioridades 1 e 3) ---

/**
 * Salva ou Atualiza um versículo no Firestore.
 */
window.saveVerseToFirestore = function(verseData) {
    const user = auth.currentUser;
    if (!user) return; 

    db.collection('users').doc(user.uid).collection('verses').doc(String(verseData.id))
        .set(verseData, { merge: true }) // merge: true é mais seguro para atualizações parciais
        .then(() => {
            console.log('Versículo sincronizado na nuvem.');
        })
        .catch((err) => {
            console.error('Erro ao salvar na nuvem:', err);
        });
};

/**
 * [NOVO] Remove um versículo do Firestore (Prioridade 1).
 * Essa função garante que o item não volte ao recarregar a página.
 */
window.deleteVerseFromFirestore = function(verseId) {
    const user = auth.currentUser;
    if (!user) return;

    const docId = String(verseId); // Garante que o ID seja string

    db.collection('users').doc(user.uid).collection('verses').doc(docId)
        .delete()
        .then(() => {
            console.log(`Versículo ${docId} removido permanentemente da nuvem.`);
        })
        .catch((err) => {
            console.error('Erro ao remover da nuvem:', err);
            showToast('Erro ao excluir do backup online.', 'error');
        });
};

/**
 * [ATUALIZADO] Listener em Tempo Real (Prioridade 3).
 * Substitui o antigo 'loadVersesFromFirestore' por um sistema ativo.
 * @param {Object} user - O objeto de usuário do Firebase
 * @param {Function} callback - Função do app.js que vai receber a lista atualizada
 */
function initRealtimeListener(user, callback) {
    // Se já existe um listener, cancela o anterior para evitar duplicidade
    if (unsubscribeVerses) {
        unsubscribeVerses();
    }

    // Inicia a escuta (.onSnapshot)
    unsubscribeVerses = db.collection('users').doc(user.uid).collection('verses')
        .onSnapshot((querySnapshot) => {
            const cloudVerses = [];
            querySnapshot.forEach((doc) => {
                cloudVerses.push(doc.data());
            });
            
            console.log(`Sincronização Realtime: ${cloudVerses.length} versículos recebidos.`);
            
            // Chama a função do app.js para atualizar a tela
            if (callback) callback(cloudVerses);
        }, (error) => {
            console.error("Erro na sincronização realtime:", error);
            // IMPORTANTE: Erros de permissão cairão aqui se as Regras do Firestore não permitirem leitura
        });
}

// Mantendo compatibilidade com versões anteriores (caso app.js ainda use o método antigo)
window.loadVersesFromFirestore = function(callback) {
    const user = auth.currentUser;
    if (!user) return;
    
    // Redireciona para o novo sistema se houver callback, senão tenta usar o global
    if (callback) {
        initRealtimeListener(user, callback);
    } else if (window.handleRemoteUpdate) {
        initRealtimeListener(user, window.handleRemoteUpdate);
    }
};
