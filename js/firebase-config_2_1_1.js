// Configuração Firebase - já inserida
export const firebaseConfig = {
  apiKey: "AIzaSyCqzMvKi4E1JAVS2XkfbcrPdITTAzOfd8s",
  authDomain: "clasesportugues-5cb63.firebaseapp.com",
  projectId: "clasesportugues-5cb63",
  storageBucket: "clasesportugues-5cb63.firebasestorage.app",
  messagingSenderId: "976042390703",
  appId: "1:976042390703:web:496132769b561b4c77505a"
};

// CLOUDINARY - IMPORTANTE
// Não use API Secret no frontend! Crie um Upload Preset UNSIGNED no Cloudinary
// Dashboard > Settings > Upload > Add upload preset > Signing Mode: Unsigned
export const cloudinaryConfig = {
  cloudName: "SEU_CLOUD_NAME_AQUI", // ex: "dpxxxxx"
  uploadPreset: "SEU_PRESET_UNSIGNED" // ex: "portugues_brasil"
};

// Suas chaves (guarde, não coloque no código):
// API Key: 763398157364317
// API Secret: qXx6mc-RmTuz6Qr2aZPT5PM2vI8
// (Use apenas no backend, nunca no navegador)
