import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type AppRole = "founder" | "headmod" | "admin" | "moderator" | "user";

export async function getUserRole(uid: string): Promise<AppRole> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return "user";

  const role = snap.data().role as AppRole | undefined;
  return role ?? "user";
}

// Admin panele kimler girebilir?
export function canOpenAdminPanel(role: AppRole) {
  return (
    role === "founder" ||
    role === "headmod" ||
    role === "admin" ||
    role === "moderator"
  );
}

// Admin ekleme kimlere açık?
export function canAddAdmin(role: AppRole) {
  return role === "founder" || role === "headmod";
}