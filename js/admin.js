import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, setDoc, doc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig, cloudinaryConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const ADMIN_EMAIL = "siqueirahenrique32@gmail.com";

// DECLARA TUDO - era isso que faltava
const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');
const email = document.getElementById('email');
const senha = document.getElementById('senha');
const btnLogin = document.getElementById('btnLogin');
const btnSair = document.getElementById('btnSair');

btnLogin.onclick = () => signInWithEmailAndPassword(auth, email.value, senha.value).catch(e=>alert(e.message));
btnSair.onclick = () => signOut(auth);

onAuthStateChanged(auth, user=>{
  if(!user){ loginScreen.classList.remove('hidden'); dashboard.classList.add('hidden'); return; }
  if(user.email !== ADMIN_EMAIL){ signOut(auth); location.href='aluno.html'; return; }
  loginScreen.classList.add('hidden'); dashboard.classList.remove('hidden'); init();
});

document.querySelectorAll('.tabs button').forEach(b=> b.onclick = ()=>{
  document.querySelectorAll('.tabs button, .tab').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); document.getElementById('tab-'+b.dataset.tab).classList.add('active');
});

function init(){
  const secondary = initializeApp(firebaseConfig, "sec");
  const auth2 = getAuth(secondary);

  const addAluno = document.getElementById('addAluno');
  const alunoNome = document.getElementById('alunoNome');
  const alunoEmail = document.getElementById('alunoEmail');
  const alunoSenha = document.getElementById('alunoSenha');
  const listaAlunos = document.getElementById('listaAlunos');
  const aulaAlunos = document.getElementById('aulaAlunos');
  const provaAlunos = document.getElementById('provaAlunos');

  addAluno.onclick = async ()=>{
    try{
      const cred = await createUserWithEmailAndPassword(auth2, alunoEmail.value, alunoSenha.value);
      await setDoc(doc(db,"alunos",cred.user.uid),{nome:alunoNome.value,email:alunoEmail.value,criadoEm:serverTimestamp()});
      await signOut(auth2);
      alert('Aluno salvo!'); alunoNome.value='';alunoEmail.value='';alunoSenha.value='';
    }catch(e){ alert('Erro: '+e.message); }
  };
  onSnapshot(collection(db,"alunos"), s=>{
    listaAlunos.innerHTML=''; let h='';
    s.forEach(d=>{ const a=d.data(); listaAlunos.innerHTML+=`<li>${a.nome} - ${a.email}</li>`; h+=`<label><input type="checkbox" value="${d.id}"> ${a.nome}</label><br>`; });
    aulaAlunos.innerHTML=h; provaAlunos.innerHTML=h;
  });

  // AULAS
  document.getElementById('salvarAula').onclick = async ()=>{
    await addDoc(collection(db,"aulas"),{
      titulo:document.getElementById('aulaTitulo').value,
      youtube:document.getElementById('aulaYoutube').value.replace('watch?v=','embed/'),
      desc:document.getElementById('aulaDesc').value,
      alunos:[...aulaAlunos.querySelectorAll('input:checked')].map(i=>i.value),
      criadoEm:serverTimestamp()
    });
    alert('Aula criada');
  };
}
