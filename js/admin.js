import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, setDoc, doc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig, cloudinaryConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_EMAIL = "siqueirahenrique32@gmail.com";

const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');

document.getElementById('btnLogin').onclick = async ()=>{
  try{ await signInWithEmailAndPassword(auth, email.value, senha.value); }
  catch(e){ alert('Login falhou: '+e.message); }
};
document.getElementById('btnSair').onclick = ()=>signOut(auth);

onAuthStateChanged(auth, async user=>{
  if(!user){ loginScreen.classList.remove('hidden'); dashboard.classList.add('hidden'); return; }
  
  // BLOQUEIO: só admin entra aqui
  if(user.email !== ADMIN_EMAIL){
    alert('Acesso negado. Você é aluno.');
    await signOut(auth);
    window.location.href = 'aluno.html';
    return;
  }
  loginScreen.classList.add('hidden'); dashboard.classList.remove('hidden');
  initAdmin();
});

function initAdmin(){
  const secondaryApp = initializeApp(firebaseConfig, "Secondary");
  const secondaryAuth = getAuth(secondaryApp);

  // CADASTRO ALUNO - AGORA SALVA DE VERDADE
  document.getElementById('addAluno').onclick = async ()=>{
    const nome = document.getElementById('alunoNome').value.trim();
    const email = document.getElementById('alunoEmail').value.trim();
    const senha = document.getElementById('alunoSenha').value.trim();
    if(!nome||!email||!senha) return alert('Preencha tudo');
    
    try{
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, senha);
      // SALVA NO FIRESTORE COM UID
      await setDoc(doc(db, "alunos", cred.user.uid), {
        nome, email, criadoEm: serverTimestamp()
      });
      await signOut(secondaryAuth);
      alert('✅ Aluno salvo no Firebase!');
      document.getElementById('alunoNome').value='';
      document.getElementById('alunoEmail').value='';
      document.getElementById('alunoSenha').value='';
    }catch(e){
      alert('ERRO: '+e.code+'\n'+e.message);
      console.error(e);
    }
  };

  // LISTA ALUNOS - LÊ DO FIRESTORE
  onSnapshot(collection(db,"alunos"), snap=>{
    const lista = document.getElementById('listaAlunos');
    const aulaAlunos = document.getElementById('aulaAlunos');
    const provaAlunos = document.getElementById('provaAlunos');
    lista.innerHTML=''; let html='';
    snap.forEach(d=>{
      const a = d.data();
      lista.innerHTML += `<li>${a.nome} - ${a.email}</li>`;
      html += `<label><input type="checkbox" value="${d.id}"> ${a.nome}</label><br>`;
    });
    aulaAlunos.innerHTML = html; provaAlunos.innerHTML = html;
  });

  // resto das funções (aulas, provas, biblioteca) continua igual...
}
