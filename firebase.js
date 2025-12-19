// firebase.js

// 1. CONFIGURAÇÃO (Prioridade 2: Preencha com seus dados do Console Firebase)
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

// Habilita persistência offline do Firestore (Prioridade 3 - Suporte Offline Híbrido)
// Ajuste para evitar warnings de depreciação: verifica suporte antes de habilitar
if (firebase.firestore.isSupported) {
    db.enablePersistence({ synchronizeTabs: true })
      .catch((err) => {
          if (err.code == 'failed-precondition') {
              console.warn('Persistência falhou: Múltiplas abas abertas.');
          } else if (err.code == 'unimplemented') {
              console.warn('Navegador não suporta persistência offline.');
          }
      });
}

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
        if(authMsg) authMsg.innerHTML = `Logado como: <strong>${user.email}</strong>`;
        
        // Limpa campos para segurança visual
        if(emailInput) emailInput.value = '';
        if(passInput) passInput.value = '';

        // Sincronização: Processa fila de exclusões pendentes ao conectar
        if (window.processPendingQueue) {
            window.processPendingQueue();
        }
        
    } else {
        // Usuário DESLOGADO
        console.log('Firebase: Usuário desconectado');
        
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
            // Cria documento inicial do usuário se necessário
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
            // Opcional: Limpar dados da tela ou manter cache local
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

// --- LÓGICA FIRESTORE (Prioridade 3 - Preparação) ---

/**
 * Salva ou Atualiza um versículo no Firestore.
 * Deve ser chamado pelo app.js ao criar/editar.
 */
window.saveVerseToFirestore = function(verseData) {
    const user = auth.currentUser;
    if (!user) return; // Se offline/deslogado, app.js mantém apenas no LocalStorage

    db.collection('users').doc(user.uid).collection('verses').doc(String(verseData.id))
      .set(verseData)
      .then(() => {
          console.log('Versículo sincronizado na nuvem.');
      })
      .catch((err) => {
          console.error('Erro ao salvar na nuvem:', err);
      });
};

/**
 * Carrega versículos do Firestore.
 * Pode ser chamado ao logar ou ao iniciar o app.
 */
window.loadVersesFromFirestore = function(callback) {
    const user = auth.currentUser;
    if (!user) return;

    db.collection('users').doc(user.uid).collection('verses')
      .get()
      .then((querySnapshot) => {
          const cloudVerses = [];
          querySnapshot.forEach((doc) => {
              cloudVerses.push(doc.data());
          });
          if (callback) callback(cloudVerses);
      })
      .catch((err) => {
          console.error('Erro ao buscar dados:', err);
          showToast('Erro na sincronização.', 'error');
      });
};

// --- GESTÃO AVANÇADA DE DADOS (CLOUD + OFFLINE) ---

// 1. Tenta apagar na nuvem. Se falhar (offline), agenda para depois.
window.handleCloudDeletion = function(verseId) {
    const user = auth.currentUser;
    if (!user) return; // Se não tem user, é puramente local

    if (navigator.onLine) {
        // Online: Apaga direto
        db.collection('users').doc(user.uid).collection('verses').doc(String(verseId))
          .delete()
          .then(() => console.log(`[Cloud] Versículo ${verseId} excluído.`))
          .catch(err => console.error('[Cloud] Erro ao excluir:', err));
    } else {
        // Offline: Adiciona à fila de pendências
        addToPendingDeletions(verseId);
    }
};

// 2. Adiciona ID à fila no LocalStorage
function addToPendingDeletions(verseId) {
    let pending = JSON.parse(localStorage.getItem('pendingDeletions') || '[]');
    if (!pending.includes(verseId)) {
        pending.push(verseId);
        localStorage.setItem('pendingDeletions', JSON.stringify(pending));
        console.log(`[Offline] Exclusão do ID ${verseId} agendada.`);
    }
}

// 3. Processa a fila quando o app inicia (ou a net volta)
window.processPendingQueue = function() {
    if (!navigator.onLine || !auth.currentUser) return;

    const pending = JSON.parse(localStorage.getItem('pendingDeletions') || '[]');
    if (pending.length === 0) return;

    console.log(`[Sync] Processando ${pending.length} exclusões pendentes...`);

    pending.forEach(id => {
        db.collection('users').doc(auth.currentUser.uid).collection('verses').doc(String(id))
          .delete()
          .then(() => {
              // Remove da lista de pendentes após sucesso
              removeIdFromPending(id);
          })
          .catch(err => console.error('[Sync] Falha ao processar pendente:', err));
    });
};

function removeIdFromPending(id) {
    let pending = JSON.parse(localStorage.getItem('pendingDeletions') || '[]');
    pending = pending.filter(x => x !== id);
    localStorage.setItem('pendingDeletions', JSON.stringify(pending));
}

// Listener para quando a conexão voltar
window.addEventListener('online', window.processPendingQueue);
