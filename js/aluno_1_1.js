import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, onSnapshot, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig, cloudinaryConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.getElementById('btnLoginA').onclick = ()=>signInWithEmailAndPassword(auth,emailA.value,senhaA.value).catch(e=>alert(e.message));
document.getElementById('sairA').onclick = ()=>signOut(auth);

onAuthStateChanged(auth, async user=>{
  if(!user){loginAluno.classList.remove('hidden');painel.classList.add('hidden');return;}
  loginAluno.classList.add('hidden');painel.classList.remove('hidden');
  const alunoDoc = await getDoc(doc(db,"alunos",user.uid));
  const aluno = alunoDoc.data();
  nomeAluno.textContent = `Olá, ${aluno?.nome || 'Aluno'}!`;
  if(aluno?.foto) fotoPerfil.src = aluno.foto;

  // upload foto
  uploadFoto.onchange = async e=>{
    const file = e.target.files[0];
    const fd = new FormData(); fd.append('file',file); fd.append('upload_preset',cloudinaryConfig.uploadPreset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,{method:'POST',body:fd});
    const data = await res.json();
    await updateDoc(doc(db,"alunos",user.uid),{foto:data.secure_url});
    fotoPerfil.src = data.secure_url;
  };

  // Aulas
  const qAulas = query(collection(db,"aulas"), where("alunos","array-contains",user.uid));
  onSnapshot(qAulas,snap=>{
    minhasAulas.innerHTML='';
    snap.forEach(d=>{const a=d.data(); minhasAulas.innerHTML+=`<div style="background:#fff;padding:14px;margin:10px 0;border-radius:12px"><h4>${a.titulo}</h4><p>${a.desc||''}</p>${a.youtube?`<iframe width="100%" height="220" src="${a.youtube}" frameborder="0" allowfullscreen></iframe>`:''}</div>`});
  });

  // Provas
  const qProvas = query(collection(db,"provas"), where("alunos","array-contains",user.uid));
  onSnapshot(qProvas,snap=>{
    minhasProvas.innerHTML='';
    snap.forEach(d=>{
      const p={id:d.id,...d.data()};
      const div=document.createElement('div');
      div.style="background:#fff;padding:14px;margin:10px 0;border-radius:12px";
      div.innerHTML=`<h4>${p.titulo}</h4>`;
      p.questoes.forEach((q,i)=>{
        if(q.tipo==='dissertativa' || p.tipo==='dissertativa'){
          div.innerHTML+=`<p>${q.texto}</p><textarea id="r${p.id}${i}" style="width:100%"></textarea>`;
        }else{
          const opts = q.opcoes||[];
          div.innerHTML+=`<p>${q.texto}</p>`+opts.map(o=>`<label><input type="radio" name="q${p.id}${i}" value="${o}"> ${o}</label><br>`).join('');
        }
      });
      const btn=document.createElement('button'); btn.textContent='Enviar respostas'; btn.style="margin-top:8px;background:var(--verde);color:#fff;border:none;padding:8px 12px;border-radius:8px";
      btn.onclick=async()=>{
        const respostas = p.questoes.map((q,i)=>{
          if(q.tipo==='dissertativa') return document.getElementById(`r${p.id}${i}`).value;
          const sel=document.querySelector(`input[name="q${p.id}${i}"]:checked`); return sel?sel.value:'';
        });
        await addDoc(collection(db,"respostas"),{alunoId:user.uid,alunoNome:aluno.nome,provaId:p.id,provaTitulo:p.titulo,respostas,criadoEm:serverTimestamp()});
        alert('Enviado!');
      };
      div.appendChild(btn);
      minhasProvas.appendChild(div);
    });
  });

  // Biblioteca
  onSnapshot(collection(db,"biblioteca"),snap=>{
    bibAluno.innerHTML='';
    snap.forEach(d=>{const b=d.data(); bibAluno.innerHTML+=`<div class="item"><img src="${b.capa}"><p>${b.titulo}</p>${b.link?`<a href="${b.link}" target="_blank" style="display:block;padding:8px;background:var(--azul);color:#fff;text-decoration:none">Abrir</a>`:''}</div>`});
  });
});
