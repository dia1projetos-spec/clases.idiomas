# Plataforma Aulas de Português - Brasil

Estrutura pronta com HTML/CSS/JS separados, cores do Brasil, slider com suas fotos.

## Pastas
/css/style.css, /css/admin.css
/js/app.js, /js/admin.js, /js/aluno.js, /js/firebase-config.js
/assets/img/slide1-4.jpg

## Páginas
- index.html → landing com slider
- admin.html → cadastrar alunos (Firebase Auth + Firestore), criar aulas (YouTube embed), atribuir para alunos, criar provas (múltipla/dissertativa/enquete), biblioteca (Cloudinary)
- aluno.html → login, foto de perfil (Cloudinary), ver aulas, responder provas, biblioteca

## Configurar
1. Firebase: crie projeto, ative Authentication (Email/Senha) e Firestore. Copie config para js/firebase-config.js
2. Firestore regras iniciais (teste):
   rules_version='2'; service cloud.firestore { match /databases/{database}/documents { match /{document=**} { allow read, write: if request.auth != null; } } }
3. Cloudinary: crie upload preset UNSIGNED, coloque cloudName e preset em firebase-config.js
4. Hospede no GitHub → conecte Vercel → deploy. Funciona 100% estático.

## Fluxo Admin
- Login com conta professor criada no Firebase
- Alunos → cadastre (cria no Auth e salva nome em /alunos)
- Aulas → cole link YouTube, selecione alunos
- Provas → adicione questões, selecione alunos
- Biblioteca → envie capa (vai para Cloudinary)

## Aluno
- Entra com email/senha, vê apenas conteúdo atribuído, envia foto, responde e você vê em Admin > Respostas

Tudo responsivo, verde #009C3B, amarelo #FFDF00, azul #002776.
