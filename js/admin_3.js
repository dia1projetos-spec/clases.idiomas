import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, setDoc, doc, getDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig, cloudinaryConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');

const ADMIN_EMAIL = "siqueirahenrique32@gmail.com"; // único que entra no admin

document.getElementById('btnLogin').onclick = async ()=>{
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  try{ await signInWithEmailAndPassword(auth,email,senha);}catch(e){alert('Erro: '+e.message)}
};
document.getElementById('btnSair').onclick = ()=>signOut(auth);

onAuthStateChanged(auth, async user=>{
  if(user){
    // BLOQUEIO DURO: só o email do professor entra
    if(user.email !== ADMIN_EMAIL){
      alert('Acesso negado: esta área é só para o professor.');
      await signOut(auth);
      window.location.href = 'aluno.html';
      return;
    }
    loginScreen.classList.add('hidden');dashboard.classList.remove('hidden');initAdmin();
  }
  else{loginScreen.classList.remove('hidden');dashboard.classList.add('hidden');}
});

// tabs
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.tabs button').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  document.getElementById('tab-'+b.dataset.tab).classList.add('active');
});

async function initAdmin(){
  // app secundário para criar alunos sem deslogar
  const secondaryApp = initializeApp(firebaseConfig, "Secondary");
  const secondaryAuth = getAuth(secondaryApp);

  // ALUNOS
  document.getElementById('addAluno').onclick = async ()=>{
    const nome = alunoNome.value.trim();
    const email = alunoEmail.value.trim();
    const senha = alunoSenha.value.trim();
    if(!nome||!email||!senha) return alert('Preencha tudo');
    try{
      const cred = await createUserWithEmailAndPassword(secondaryAuth,email,senha);
      await setDoc(doc(db,"alunos",cred.user.uid),{nome,email,criadoEm:serverTimestamp()});
      await signOut(secondaryAuth);
      alert('Aluno criado!'); alunoNome.value='';alunoEmail.value='';alunoSenha.value='';
    }catch(e){ alert('Erro: '+e.message); }
  };
  onSnapshot(collection(db,"alunos"),snap=>{
    listaAlunos.innerHTML='';
    const alunos=[];
    snap.forEach(d=>{alunos.push({id:d.id,...d.data()}); listaAlunos.innerHTML+=`<li>${d.data().nome} - ${d.data().email}</li>`});
    aulaAlunos.innerHTML = alunos.map(a=>`<label><input type="checkbox" value="${a.id}"> ${a.nome}</label>`).join('');
    provaAlunos.innerHTML = aulaAlunos.innerHTML;
  });

  // AULAS
  document.getElementById('salvarAula').onclick = async ()=>{
    const titulo = aulaTitulo.value;
    const youtube = aulaYoutube.value.replace('watch?v=','embed/');
    const desc = aulaDesc.value;
    const selecionados = [...aulaAlunos.querySelectorAll('input:checked')].map(i=>i.value);
    await addDoc(collection(db,"aulas"),{titulo,youtube,desc,alunos:selecionados,criadoEm:serverTimestamp()});
    alert('Aula salva');
  };
  onSnapshot(collection(db,"aulas"),snap=>{
    listaAulas.innerHTML='';
    snap.forEach(d=>{ const a=d.data(); listaAulas.innerHTML+=`<div><strong>${a.titulo}</strong><br><iframe width="100%" height="200" src="${a.youtube}" frameborder="0" allowfullscreen></iframe></div>`});
  });

  // PROVAS
  let questoes=[];
  document.getElementById('addQuestao').onclick = ()=>{
    questoes.push({texto:'',tipo:provaTipo.value,opcoes:[]});
    renderQuestoes();
  };
  function renderQuestoes(){
    questoesEl = document.getElementById('questoes');
    questoesEl.innerHTML = questoes.map((q,i)=>`
      <div style="background:#fff;padding:10px;margin:8px 0;border-radius:8px">
        <input placeholder="Pergunta ${i+1}" oninput="window.qs[${i}].texto=this.value" style="width:100%">
        ${q.tipo!=='dissertativa'?`<input placeholder="Opções separadas por ;" oninput="window.qs[${i}].opcoes=this.value.split(';')">`:''}
      </div>`).join('');
    window.qs = questoes;
  }
  document.getElementById('salvarProva').onclick = async ()=>{
    const titulo = provaTitulo.value;
    const alunos = [...provaAlunos.querySelectorAll('input:checked')].map(i=>i.value);
    await addDoc(collection(db,"provas"),{titulo,questoes,alunos,criadoEm:serverTimestamp()});
    alert('Prova criada'); questoes=[]; renderQuestoes();
  };

  // BIBLIOTECA
  document.getElementById('salvarBib').onclick = async ()=>{
    const file = bibCapa.files[0];
    const titulo = bibTitulo.value;
    if(!file) return alert('Selecione capa');
    const fd = new FormData(); fd.append('file',file); fd.append('upload_preset',cloudinaryConfig.uploadPreset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,{method:'POST',body:fd});
    const data = await res.json();
    await addDoc(collection(db,"biblioteca"),{titulo,capa:data.secure_url,criadoEm:serverTimestamp()});
    alert('Material salvo');
  };
  onSnapshot(collection(db,"biblioteca"),snap=>{
    gridBib.innerHTML='';
    snap.forEach(d=>{const b=d.data(); gridBib.innerHTML+=`<div class="item"><img src="${b.capa}"><p>${b.titulo}</p></div>`});
  });

  // RESPOSTAS
  onSnapshot(collection(db,"respostas"),snap=>{
    listaRespostas.innerHTML='';
    snap.forEach(d=>{const r=d.data(); listaRespostas.innerHTML+=`<div style="background:#fff;padding:12px;margin:6px 0"><strong>${r.alunoNome}</strong> - ${r.provaTitulo}</div>`});
  });
}
