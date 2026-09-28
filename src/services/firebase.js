// src/services/firebase.js
// Configuración e inicialización de Firebase / Cloud Firestore
// Soporta configuración vía variables de entorno (VITE_FIREBASE_*)
// o configuradas directamente desde la pestaña de administración.

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

const FIREBASE_CONFIG_STORAGE_KEY = 'discipulado_firebase_config_v1';

// Configuración oficial por defecto del proyecto Firebase discipcheck
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBsfgCDT-3PLX6-HWIOnKk3O9abXQyH73k",
  authDomain: "discipcheck.firebaseapp.com",
  projectId: "discipcheck",
  storageBucket: "discipcheck.firebasestorage.app",
  messagingSenderId: "79080930092",
  appId: "1:79080930092:web:bed606509119e2de804a89",
};

// Obtener credenciales desde localStorage, variables de entorno o configuración predeterminada
export function getFirebaseConfig() {
  try {
    const saved = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error al leer configuración de Firebase:', e);
  }

  // Comprobar variables de entorno de Vite
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  if (envConfig.apiKey && envConfig.projectId) {
    return envConfig;
  }

  // Configuración predeterminada lista para producción
  return DEFAULT_FIREBASE_CONFIG;
}

// Guardar configuración manual de Firebase
export function saveFirebaseConfig(config) {
  if (!config) {
    localStorage.removeItem(FIREBASE_CONFIG_STORAGE_KEY);
    return;
  }
  localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(config));
}

// Verificar si Firebase tiene configuración disponible
export function isFirebaseConfigured() {
  const cfg = getFirebaseConfig();
  return Boolean(cfg && cfg.apiKey && cfg.projectId);
}

let firebaseApp = null;
let firestoreDb = null;

// Inicializar o re-inicializar Firebase
export function initFirebase() {
  const config = getFirebaseConfig();
  if (!config) {
    firebaseApp = null;
    firestoreDb = null;
    return null;
  }

  try {
    if (!getApps().length) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApp();
    }
    try {
      firestoreDb = initializeFirestore(firebaseApp, {
        experimentalAutoDetectLongPolling: true,
        ignoreUndefinedProperties: true,
      });
    } catch {
      firestoreDb = getFirestore(firebaseApp);
    }
    return firestoreDb;
  } catch (err) {
    console.error('Error al inicializar Firebase:', err);
    return null;
  }
}

// Obtener instancia de Firestore
export function getDb() {
  if (!firestoreDb) {
    return initFirebase();
  }
  return firestoreDb;
}

// Inicialización temprana
initFirebase();
