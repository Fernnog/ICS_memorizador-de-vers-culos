// firebase.js - Conexão Nuvem e Autenticação (Atualizado)

// 1. CONFIGURAÇÃO DO FIREBASE
// ⚠️ IMPORTANTE: Substitua os valores abaixo pelos do seu projeto no Firebase Console
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

// --- 2. GESTÃO DE AUTENTICAÇÃO (Auth) ---

// Monitora o estado do usuário (Logado/Deslogado)
if (auth) {
    auth.onAuthStateChanged((user) => {
        // Elementos de UI para alternância (Prioridade 1)
        const loginState = document.getElementById('loginState');
        const userState = document.getElementById('userState');
        const userEmailDisplay = document.getElementById('userEmailDisplay');
        const dot = document.getElementById('authStatusDot');
        const btnLogout = document.getElementById('btnLogout'); // Mantido para compatibilidade, embora esteja dentro do userState agora

        if (user) {
            // --- USUÁRIO LOGADO ---
            currentUser = user;
            console.log("Usuário conectado:", user.email);
            
            // Atualiza UI: Esconde form, mostra perfil
            if(loginState) loginState.style.display = 'none';
            if(userState) userState.style.display = 'block';
            if(userEmailDisplay) userEmailDisplay.innerText = user.email;
            
            // Indicador visual no header
            if (dot) dot.style.backgroundColor = "#2ecc71"; // Verde

            // Tenta carregar dados assim que logar
            if (window.loadVersesFromFirestore) {
                window.loadVersesFromFirestore((data) => {
                   if(data) console.log('Sincronização pós-login concluída.');
                });
            }
        } else {
            // --- USUÁRIO DESLOGADO ---
            currentUser = null;
            console.log("Usuário desconectado.");
            
            // Atualiza UI: Mostra form, esconde perfil
            if(loginState) loginState.style.display = 'block';
            if(userState) userState.style.display = 'none';
            
            if (dot) dot.style.backgroundColor = "#ccc"; // Cinza
        }
    });
}

// Funções de UI para Login/Cadastro (Chamadas pelo HTML)
window.openAuthModal = function() {
    document.getElementById('authModal').style.display = 'flex';
};

window.closeAuthModal = function() {
    document.getElementById('authModal').style.display = 'none';
};

// Cadastro (Função mantida caso decida reativar no futuro, mas botão foi removido do HTML)
window.handleSignUp = function() {
    const email = document.getElementById('authEmail').value;
    const pass = document.getElementById('authPassword').value;

    if (!email || !pass) return showToast("Preencha e-mail e senha.", "error");

    auth.createUserWithEmailAndPassword(email, pass)
        .then((userCredential) => {
            window.showToast("Conta criada com sucesso!", "success");
            // Não precisa fechar modal forçadamente, o onAuthStateChanged já atualizará a UI
        })
        .catch((error) => {
            console.error(error);
            window.showToast("Erro ao criar conta: " + error.message, "error");
        });
};

window.handleLogin = function() {
    const email = document.getElementById('authEmail').value;
    const pass = document.getElementById('authPassword').value;

    if (!email || !pass) return showToast("Preencha e-mail e senha.", "error");

    auth.signInWithEmailAndPassword(email, pass)
        .then((userCredential) => {
            window.showToast("Login realizado!", "success");
            // Modal pode continuar aberto mostrando o perfil ou fechar, depende da preferência.
            // Aqui optamos por fechar para limpar a tela:
            window.closeAuthModal();
        })
        .catch((error) => {
            console.error(error);
            // Tradução simples de erros comuns
            let msg = error.message;
            if (error.code === 'auth/wrong-password') msg = "Senha incorreta.";
            if (error.code === 'auth/user-not-found') msg = "E-mail não cadastrado.";
            
            window.showToast("Erro: " + msg, "error");
        });
};

window.handleLogout = function() {
    auth.signOut().then(() => {
        window.showToast("Você saiu da conta.", "warning");
        // A UI se atualizará automaticamente via onAuthStateChanged
    });
};

// --- 3. INTEGRAÇÃO COM FIRESTORE (Database) ---

// Salvar Versículo
window.saveVerseToFirestore = function(verse) {
    if (!currentUser || !db) return; // Só salva se estiver logado

    // Coleção: users > UID > verses > ID_do_Versiculo
    db.collection('users').doc(currentUser.uid).collection('verses').doc(String(verse.id))
        .set(verse)
        .then(() => console.log("Versículo salvo na nuvem:", verse.ref))
        .catch((err) => console.error("Erro ao salvar na nuvem:", err));
};

// Salvar Configurações (Ritmo/Plano)
window.saveSettingsToFirestore = function(settings) {
    if (!currentUser || !db) return;

    db.collection('users').doc(currentUser.uid)
        .set({ settings: settings }, { merge: true })
        .then(() => console.log("Configurações sincronizadas."))
        .catch((err) => console.error("Erro ao salvar settings:", err));
};

// Carregar Dados (Sync Inicial)
window.loadVersesFromFirestore = function(callback) {
    if (!currentUser || !db) return;

    // 1. Carrega Settings
    db.collection('users').doc(currentUser.uid).get()
        .then((doc) => {
            if (doc.exists && doc.data().settings) {
                // Atualiza settings globais se existirem
                if(window.appData) {
                    window.appData.settings = doc.data().settings;
                    // Atualiza UI baseada no setting carregado
                    if(window.updatePacingUI) window.updatePacingUI();
                }
            }
        });

    // 2. Carrega Versículos
    db.collection('users').doc(currentUser.uid).collection('verses').get()
        .then((querySnapshot) => {
            const cloudVerses = [];
            querySnapshot.forEach((doc) => {
                cloudVerses.push(doc.data());
            });
            
            if (cloudVerses.length > 0) {
                callback(cloudVerses);
            }
        })
        .catch((error) => console.error("Erro ao baixar dados:", error));
};

// Deletar da Nuvem
window.handleCloudDeletion = function(id) {
    if (!currentUser || !db) return;

    db.collection('users').doc(currentUser.uid).collection('verses').doc(String(id))
        .delete()
        .then(() => console.log("Item deletado da nuvem."))
        .catch((error) => console.error("Erro ao deletar na nuvem:", error));
};
