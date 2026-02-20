// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

declare global {
  interface Window {
    __FIREBASE_ENV__?: {
      apiKey?: string;
      authDomain?: string;
      projectId?: string;
      storageBucket?: string;
      messagingSenderId?: string;
      appId?: string;
      measurementId?: string;
    };
  }
}

function readCfg() {
  const w = typeof window !== "undefined" ? window.__FIREBASE_ENV__ : undefined;

  const cfg = {
    apiKey: w?.apiKey ?? process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: w?.authDomain ?? process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: w?.projectId ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: w?.storageBucket ?? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId:
      w?.messagingSenderId ?? process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: w?.appId ?? process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
    measurementId: w?.measurementId ?? process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "",
  };

  const missing = Object.entries(cfg)
    .filter(([k, v]) => ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"].includes(k) && !v)
    .map(([k]) => k);

  if (missing.length) {
    console.error(`[firebase] Missing firebase config keys: ${missing.join(", ")}`);
    return null;
  }

  return cfg;
}

const config = readCfg();

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (config) {
  app = getApps().length ? getApp() : initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

function assertReady<T>(value: T | null, label: string): T {
  if (value) return value;
  throw new Error(`[firebase] ${label} not initialized. (env inject check: layout.tsx)`);
}

export const authInstance = () => assertReady(auth, "auth");
export const dbInstance = () => assertReady(db, "firestore");
export const storageInstance = () => assertReady(storage, "storage");

// Eski importlar bozulmasın:
export const authExport = authInstance();
export const dbExport = dbInstance();
export const storageExport = storageInstance();

// Senin kodun import { auth, db, storage } kullanıyor -> aynen kalsın:
export { authExport as auth, dbExport as db, storageExport as storage };