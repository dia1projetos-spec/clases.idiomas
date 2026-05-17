import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_EMAIL = "siqueirahenrique32@gmail.com";

document.getElementById('btnLoginAluno').onclick = async ()=>{
  try{ await signInWithEmailAndPassword(auth, alunoEmail.value, alunoSenha.value); }
  catch(e){ alert('Erro: '+e.message); }
};
document.getElementById('btnSairAluno').onclick = ()=>signOut(auth);

onAuthStateChanged(auth, async user=>{
  if(!user){ loginAluno.classList.remove('hidden'); areaAluno.classList.add('hidden'); return; }
  
  // BLOQUEIO: admin não fica aqui
  if(user.email === ADMIN_EMAIL){
    alert('Professor, vá para área admin.');
    await signOut(auth);
    window.location.href = 'admin.html';
    return;
  }

  // VERIFICA SE É ALUNO CADASTRADO
  const snap = await getDoc(doc(db, "alunos", user.uid));
  if(!snap.exists()){
    alert('Você não está cadastrado como aluno.');
    await signOut(auth);
    return;
  }

  loginAluno.classList.add('hidden'); areaAluno.classList.remove('hidden');
  // carrega dados...
});
