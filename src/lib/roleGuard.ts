import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type AppRole = "founder" | "headmod" | "admin" | "moderator" | "user";

/**
 * Kalıcı founder whitelist:
 * - UI rozet değil, sadece yetki/feature flag.
 * - Localhost + Vercel her yerde aynı çalışır.
 */
const FOUNDER_EMAILS = [
  "SENIN_GMAILIN@gmail.com",
].map((x) => x.toLowerCase());

function normalizeRole(v: any): AppRole {
  const raw = typeof v === "string" ? v.trim().toLowerCase() : "user";
  if (raw === "founder") return "founder";
  if (raw === "headmod") return "headmod";
  if (raw === "admin") return "admin";
  if (raw === "moderator") return "moderator";
  return "user";
}

/**
 * Rolü uid ile okur.
 * - users doc yoksa user döner (istersen burada auto-create de edebiliriz)
 */
export async function getUserRole(uid: string): Promise<AppRole> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return "user";
  return normalizeRole(snap.data()?.role);
}

/**
 * Rolü güvenli şekilde user objesiyle hesaplar (ÖNERİLEN).
 * - Önce founder whitelist
 * - Sonra Firestore role
 * - İsteğe bağlı: founder ise Firestore'a da yazar (kalıcılaştırır)
 */
export async function getUserRoleForUser(params: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
}): Promise<AppRole> {
  const email = (params.email || "").toLowerCase();
  const isFounderByEmail = !!email && FOUNDER_EMAILS.includes(email);

  if (isFounderByEmail) {
    // İstersen DB'ye de yaz (1 kere otursun)
    try {
      await setDoc(
        doc(db, "users", params.uid),
        {
          role: "founder",
          displayName: params.displayName || "Kullanıcı",
          email: params.email || null,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // rules izin vermezse bile sorun değil, whitelist zaten açıyor
    }
    return "founder";
  }

  return await getUserRole(params.uid);
}

// Admin panele kimler girebilir?
export function canOpenAdminPanel(role: AppRole) {
  return role === "founder" || role === "headmod" || role === "admin" || role === "moderator";
}

// Admin ekleme kimlere açık?
export function canAddAdmin(role: AppRole) {
  return role === "founder" || role === "headmod";
}