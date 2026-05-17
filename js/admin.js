import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, setDoc, doc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig, cloudinaryConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const ADMIN_EMAIL = "siqueirahenrique32@gmail.com";

document.getElementById('btnLogin').onclick = ()=> signInWithEmailAndPassword(auth, email.value, senha.value).catch(e=>alert(e.message));
document.getElementById('btnSair').onclick = ()=> signOut(auth);

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

  // ALUNOS
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
    s.forEach(d=>{ const a=d.data(); listaAlunos.innerHTML+=`<li>${a.nome}</li>`; h+=`<label><input type="checkbox" value="${d.id}"> ${a.nome}</label><br>`; });
    aulaAlunos.innerHTML=h; provaAlunos.innerHTML=h;
  });

  // AULAS
  salvarAula.onclick = async ()=>{
    await addDoc(collection(db,"aulas"),{
      titulo:aulaTitulo.value,
      youtube:aulaYoutube.value.replace('watch?v=','embed/'),
      desc:aulaDesc.value,
      alunos:[...aulaAlunos.querySelectorAll('input:checked')].map(i=>i.value),
      criadoEm:serverTimestamp()
    });
    alert('Aula criada');
  };
  onSnapshot(collection(db,"aulas"), s=>{ listaAulas.innerHTML=''; s.forEach(d=>{ const a=d.data(); listaAulas.innerHTML+=`<p><b>${a.titulo}</b></p>`; }); });

  // PROVAS
  let qs=[]; window.qs=qs;
  addQuestao.onclick = ()=>{ qs.push({texto:'',tipo:provaTipo.value,opcoes:[]}); questoes.innerHTML = qs.map((q,i)=>`<input placeholder="Pergunta ${i+1}" oninput="qs[${i}].texto=this.value">`).join(''); };
  salvarProva.onclick = async ()=>{
    await addDoc(collection(db,"provas"),{titulo:provaTitulo.value,questoes:qs,alunos:[...provaAlunos.querySelectorAll('input:checked')].map(i=>i.value),criadoEm:serverTimestamp()});
    alert('Prova salva'); qs=[]; questoes.innerHTML='';
  };
}
