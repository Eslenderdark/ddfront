import { initializeApp } from 'firebase/app';

export const firebaseConfig = {
  apiKey: "AIzaSyCLUY4O6HhkB8OgbYApPHCYUuOmyNsrH40",
  authDomain: "dungeons-and-dragons-csm.firebaseapp.com",
  projectId: "dungeons-and-dragons-csm",
  storageBucket: "dungeons-and-dragons-csm.firebasestorage.app",
  messagingSenderId: "1009002189407",
  appId: "1:1009002189407:web:480c5c892077d0961fc1ea",
  measurementId: "G-CWY4M20ELM"
};

export const firebaseApp = initializeApp(firebaseConfig);
