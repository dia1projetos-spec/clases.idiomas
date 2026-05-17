import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, setDoc, doc, getDocs, onSnapshot, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig, cloudinaryConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');

document.getElementById('btnLogin').onclick = async ()=>{
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  try{ await signInWithEmailAndPassword(auth,email,senha);}catch(e){alert('Erro: '+e.message)}
};
document.getElementById('btnSair').onclick = ()=>signOut(auth);

onAuthStateChanged(auth, async user=>{
  if(user){
    // VERIFICA HIERARQUIA: se o UID está na coleção alunos, é aluno -> bloqueia
    const alunoRef = doc(db,"alunos",user.uid);
    const alunoSnap = await getDoc(alunoRef);
    if(alunoSnap.exists()){
      alert('Acesso negado: você é aluno. Use a área do aluno.');
      await signOut(auth);
      window.location.href = 'aluno.html';
      return;
    }
    // Se não é aluno, considera professor/admin
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
  // ALUNOS
  document.getElementById('addAluno').onclick = async ()=>{
    const nome = alunoNome.value.trim();
    const email = alunoEmail.value.trim();
    const senha = alunoSenha.value.trim();
    if(!nome||!email||!senha) return alert('Preencha tudo');
    try{
      // Cria usuário no Auth (precisa de secondary app em produção; aqui simplificado)
      const cred = await createUserWithEmailAndPassword(auth,email,senha);
      await setDoc(doc(db,"alunos",cred.user.uid),{nome,email,criadoEm:serverTimestamp()});
      alert('Aluno criado!'); alunoNome.value='';alunoEmail.value='';alunoSenha.value='';
    }catch(e){ alert('Erro (se já logado, crie via Firebase Console): '+e.message); }
  };
  onSnapshot(collection(db,"alunos"),snap=>{
    listaAlunos.innerHTML='';
    const alunos=[];
    snap.forEach(d=>{alunos.push({id:d.id,...d.data()}); listaAlunos.innerHTML+=`<li>${d.data().nome} - ${d.data().email}</li>`});
    // preenche checklists
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
    alert('Aula salva'); aulaTitulo.value='';aulaYoutube.value='';aulaDesc.value='';
  };
  onSnapshot(collection(db,"aulas"),snap=>{
    listaAulas.innerHTML='';
    snap.forEach(d=>{ const a=d.data(); listaAulas.innerHTML+=`<div><strong>${a.titulo}</strong><br><small>${a.desc||''}</small><br><iframe width="100%" height="200" src="${a.youtube}" frameborder="0" allowfullscreen></iframe></div>`});
  });

  // PROVAS
  let questoes=[];
  document.getElementById('addQuestao').onclick = ()=>{
    const idx = questoes.length;
    questoes.push({texto:'',tipo:provaTipo.value,opcoes:[]});
    renderQuestoes();
  };
  function renderQuestoes(){
    questoesEl = document.getElementById('questoes');
    questoesEl.innerHTML = questoes.map((q,i)=>`
      <div style="background:#fff;padding:10px;margin:8px 0;border-radius:8px">
        <input placeholder="Pergunta ${i+1}" oninput="window.qs[${i}].texto=this.value" style="width:100%;margin-bottom:6px">
        ${q.tipo!=='dissertativa'?`<input placeholder="Opções separadas por ;" oninput="window.qs[${i}].opcoes=this.value.split(';')">`:''}
      </div>`).join('');
    window.qs = questoes;
  }
  document.getElementById('salvarProva').onclick = async ()=>{
    const titulo = provaTitulo.value;
    const tipo = provaTipo.value;
    const alunos = [...provaAlunos.querySelectorAll('input:checked')].map(i=>i.value);
    await addDoc(collection(db,"provas"),{titulo,tipo,questoes,alunos,criadoEm:serverTimestamp()});
    alert('Prova criada'); questoes=[]; renderQuestoes();
  };

  // BIBLIOTECA
  document.getElementById('salvarBib').onclick = async ()=>{
    const file = bibCapa.files[0];
    const titulo = bibTitulo.value;
    const link = bibLink.value;
    if(!file) return alert('Selecione capa');
    const fd = new FormData();
    fd.append('file',file); fd.append('upload_preset',cloudinaryConfig.uploadPreset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,{method:'POST',body:fd});
    const data = await res.json();
    await addDoc(collection(db,"biblioteca"),{titulo,link,capa:data.secure_url,criadoEm:serverTimestamp()});
    alert('Material salvo');
  };
  onSnapshot(collection(db,"biblioteca"),snap=>{
    gridBib.innerHTML='';
    snap.forEach(d=>{const b=d.data(); gridBib.innerHTML+=`<div class="item"><img src="${b.capa}"><p>${b.titulo}</p></div>`});
  });

  // RESPOSTAS
  onSnapshot(collection(db,"respostas"),snap=>{
    listaRespostas.innerHTML='';
    snap.forEach(d=>{const r=d.data(); listaRespostas.innerHTML+=`<div style="background:#fff;padding:12px;margin:6px 0;border-radius:8px"><strong>${r.alunoNome}</strong> - ${r.provaTitulo}<br><pre>${JSON.stringify(r.respostas,null,2)}</pre></div>`});
  });
}
