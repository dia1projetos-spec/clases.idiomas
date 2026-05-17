import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const ADMIN_EMAIL = "siqueirahenrique32@gmail.com";

// IDs corretos do seu HTML
const btnLogin = document.getElementById('btnLoginA');
const btnSair = document.getElementById('sairA');
const emailInput = document.getElementById('emailA');
const senhaInput = document.getElementById('senhaA');

btnLogin.onclick = async () => {
  try { await signInWithEmailAndPassword(auth, emailInput.value, senhaInput.value); }
  catch(e){ alert('Erro login: '+e.message); }
};
btnSair.onclick = () => signOut(auth);

onAuthStateChanged(auth, async user => {
  if(!user){
    document.getElementById('loginAluno').classList.remove('hidden');
    document.getElementById('painel').classList.add('hidden');
    return;
  }
  // admin não pode ficar aqui
  if(user.email === ADMIN_EMAIL){
    await signOut(auth);
    location.href = 'admin.html';
    return;
  }
  // verifica se está cadastrado
  const snap = await getDoc(doc(db, "alunos", user.uid));
  if(!snap.exists()){
    alert('Aluno não cadastrado.');
    await signOut(auth);
    return;
  }
  document.getElementById('loginAluno').classList.add('hidden');
  document.getElementById('painel').classList.remove('hidden');
  document.getElementById('nomeAluno').textContent = 'Olá, '+snap.data().nome;
  
  // carrega aulas
  onSnapshot(query(collection(db,"aulas"), where("alunos","array-contains", user.uid)), s=>{
    const div = document.getElementById('minhasAulas');
    div.innerHTML = '';
    s.forEach(d=>{ const a=d.data(); div.innerHTML+=`<div style="background:#fff;padding:12px;margin:8px 0;border-radius:8px"><b>${a.titulo}</b><br><iframe width="100%" height="200" src="${a.youtube}"></iframe></div>`; });
  });
});
