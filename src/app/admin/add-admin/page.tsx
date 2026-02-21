"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { AppRole, getUserRole, canAddAdmin } from "@/lib/roleGuard";

type TargetRole = Exclude<AppRole, "user" | "founder">; // admin | headmod | moderator

type SupportLevel = "agent" | "lead";

type FoundUser = {
  uid: string;
  displayName: string;
  email: string;
  role: AppRole;
  supportAgent?: boolean;
  supportLevel?: SupportLevel;
};

function trLower(s: string) {
  return (s || "").toLocaleLowerCase("tr-TR").trim();
}

export default function AddAdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState<AppRole>("user");
  const canUse = useMemo(() => canAddAdmin(myRole), [myRole]);

  // arama
  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState<FoundUser[]>([]);
  const [picked, setPicked] = useState<FoundUser | null>(null);

  // rol atama
  const [targetRole, setTargetRole] = useState<TargetRole>("moderator");
  const [busyRole, setBusyRole] = useState(false);

  // canlı destek
  const [supportAgent, setSupportAgent] = useState(false);
  const [supportLevel, setSupportLevel] = useState<SupportLevel>("agent");
  const [busySupport, setBusySupport] = useState(false);

  // Guard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace("/auth");
        return;
      }

      try {
        const r = await getUserRole(u.uid);
        setMyRole(r);

        if (!canAddAdmin(r)) {
          router.replace("/admin");
          return;
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  const ensureUserDoc = async (uid: string) => {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(
        ref,
        {
          role: "user",
          accountType: "user",
          createdAt: Date.now(),
        },
        { merge: true }
      );
    }
  };

  const mapUser = (uid: string, data: any): FoundUser => {
    const role = (typeof data?.role === "string" ? data.role : "user") as AppRole;
    return {
      uid,
      displayName: String(data?.displayName || data?.username || "Kullanıcı"),
      email: String(data?.email || ""),
      role: role ?? "user",
      supportAgent: !!data?.supportAgent,
      supportLevel: (data?.supportLevel === "lead" ? "lead" : "agent") as SupportLevel,
    };
  };

  // 🔎 emailLower / usernameLower ile arama
  const runSearch = async () => {
    const needle = trLower(searchText);
    if (!needle) return;

    setSearching(true);
    setFound([]);
    setPicked(null);

    try {
      const usersCol = collection(db, "users");

      // 1) emailLower exact
      const qEmail = query(usersCol, where("emailLower", "==", needle), limit(10));
      const sEmail = await getDocs(qEmail);

      // 2) usernameLower exact
      const qUser = query(usersCol, where("usernameLower", "==", needle), limit(10));
      const sUser = await getDocs(qUser);

      // 3) displayNameLower exact (isteğe bağlı, yoksa boş döner)
      const qDisp = query(usersCol, where("displayNameLower", "==", needle), limit(10));
      const sDisp = await getDocs(qDisp);

      // birleştir / uniq uid
      const map = new Map<string, FoundUser>();
      for (const d of [...sEmail.docs, ...sUser.docs, ...sDisp.docs]) {
        map.set(d.id, mapUser(d.id, d.data()));
      }

      const arr = Array.from(map.values());

      setFound(arr);
      if (arr.length === 1) {
        setPicked(arr[0]);
        setSupportAgent(!!arr[0].supportAgent);
        setSupportLevel(arr[0].supportLevel ?? "agent");
      }
    } catch (e: any) {
      console.error("search user error:", e);
      alert("Arama başarısız. users içinde emailLower/usernameLower alanları var mı kontrol et.");
    } finally {
      setSearching(false);
    }
  };

  const pickUser = (u: FoundUser) => {
    setPicked(u);
    setSupportAgent(!!u.supportAgent);
    setSupportLevel(u.supportLevel ?? "agent");
  };

  const assignRole = async () => {
    if (!picked) return alert("Önce kullanıcı seç.");
    if (!canUse) return alert("Yetkin yok.");

    setBusyRole(true);
    try {
      await ensureUserDoc(picked.uid);

      await updateDoc(doc(db, "users", picked.uid), {
        role: targetRole,
        updatedAt: Date.now(),
      });

      alert(`✅ Rol verildi: ${targetRole}`);
      // UI güncelle
      setPicked({ ...picked, role: targetRole });
      setFound((prev) => prev.map((x) => (x.uid === picked.uid ? { ...x, role: targetRole } : x)));
    } catch (e: any) {
      console.error("assignRole error:", e);
      alert(`❌ Rol verilemedi: ${e?.message || "Bilinmeyen hata"}`);
    } finally {
      setBusyRole(false);
    }
  };

  const saveSupport = async () => {
    if (!picked) return alert("Önce kullanıcı seç.");
    if (!canUse) return alert("Yetkin yok.");

    setBusySupport(true);
    try {
      await ensureUserDoc(picked.uid);

      await updateDoc(doc(db, "users", picked.uid), {
        supportAgent: !!supportAgent,
        supportLevel: supportAgent ? supportLevel : null,
        supportUpdatedAt: Date.now(),
      });

      alert(`✅ Canlı destek güncellendi`);
      // UI güncelle
      const updated: FoundUser = {
        ...picked,
        supportAgent,
        supportLevel: supportAgent ? supportLevel : "agent",
      };
      setPicked(updated);
      setFound((prev) => prev.map((x) => (x.uid === picked.uid ? updated : x)));
    } catch (e: any) {
      console.error("saveSupport error:", e);
      alert(`❌ Kaydedilemedi: ${e?.message || "Bilinmeyen hata"}`);
    } finally {
      setBusySupport(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-sm text-zinc-300">Yükleniyor…</div>
      </div>
    );
  }

  if (!canUse) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* Premium background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-44 -right-52 h-[620px] w-[620px] rounded-full blur-3xl opacity-30 bg-orange-500" />
        <div className="absolute -bottom-60 -left-56 h-[720px] w-[720px] rounded-full blur-3xl opacity-25 bg-orange-600" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.06),transparent_55%),radial-gradient(circle_at_85%_75%,rgba(249,115,22,0.14),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <header className="relative z-20 mx-auto max-w-4xl px-4 pt-6">
        <div className="rounded-3xl border border-zinc-800/70 bg-zinc-900/30 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.55)] px-5 py-4 flex items-center justify-between">
          <div>
            <div className="text-lg sm:text-xl font-extrabold tracking-tight">Admin Ekle</div>
            <div className="text-xs text-zinc-300 mt-1">
              Yetkili rol: <span className="text-orange-300 font-semibold">{myRole}</span>
            </div>
          </div>

          <button
            onClick={() => router.replace("/admin")}
            className="inline-flex items-center justify-center rounded-2xl px-4 py-2 border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 text-sm font-semibold transition"
          >
            ← Admin Panele Dön
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-24 pt-8">
        {/* Arama */}
        <div className="rounded-3xl border border-zinc-800/70 bg-zinc-900/25 backdrop-blur-xl p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
          <div className="text-base font-extrabold">Kullanıcı Bul</div>
          <div className="mt-1 text-sm text-zinc-300">
            Email veya kullanıcı adı yaz → kullanıcıyı seç → rol/destek işlemleri yap.
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="ör: kisi@mail.com  veya  furkanduran"
              className="w-full rounded-2xl px-4 py-3 bg-zinc-950/40 border border-zinc-800/70 outline-none focus:border-orange-500/60"
            />
            <button
              onClick={runSearch}
              disabled={searching}
              className="rounded-2xl px-5 py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-black text-sm font-extrabold transition shadow-[0_18px_60px_rgba(249,115,22,0.22)]"
            >
              {searching ? "Aranıyor…" : "Ara"}
            </button>
          </div>

          {/* sonuçlar */}
          <div className="mt-4 grid gap-2">
            {found.length === 0 ? (
              <div className="text-[12px] text-zinc-400">
                Sonuç yoksa: users dokümanlarında <span className="text-zinc-200">emailLower</span> ve{" "}
                <span className="text-zinc-200">usernameLower</span> alanlarını tut.
              </div>
            ) : (
              found.map((u) => (
                <button
                  key={u.uid}
                  onClick={() => pickUser(u)}
                  className={`text-left rounded-2xl border px-4 py-3 transition ${
                    picked?.uid === u.uid
                      ? "border-orange-400/40 bg-orange-500/10"
                      : "border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-extrabold">
                        {u.displayName}{" "}
                        <span className="text-xs font-semibold text-zinc-400">({u.role})</span>
                      </div>
                      <div className="mt-0.5 text-xs text-zinc-300">{u.email || "email yok"}</div>
                      <div className="mt-0.5 text-[11px] text-zinc-500">UID: {u.uid}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      {u.supportAgent && (
                        <span className="text-[11px] rounded-full border border-orange-300/20 bg-orange-500/15 px-2 py-0.5 text-orange-200">
                          Support
                        </span>
                      )}
                      <span className="text-xs text-zinc-400">→</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Seçilen kullanıcı yoksa altı gizli */}
        {picked && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rol Ata */}
            <div className="rounded-3xl border border-zinc-800/70 bg-zinc-900/25 backdrop-blur-xl p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
              <div className="text-base font-extrabold">Rol Ata</div>
              <div className="mt-1 text-sm text-zinc-300">
                Seçili kullanıcı:{" "}
                <span className="text-orange-300 font-semibold">{picked.displayName}</span>
              </div>

              <div className="mt-4">
                <div className="text-xs text-zinc-300 mb-2">Verilecek Rol</div>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as TargetRole)}
                  className="w-full rounded-2xl px-4 py-3 bg-zinc-950/40 border border-zinc-800/70 outline-none focus:border-orange-500/60"
                >
                  <option value="moderator">moderator (Moderatör)</option>
                  <option value="headmod">headmod (Baş Moderatör)</option>
                  <option value="admin">admin (Admin)</option>
                </select>

                <div className="mt-2 text-[11px] text-zinc-400">
                  Not: Admin ekleme yetkisi sadece <span className="text-zinc-200">founder/headmod</span>.
                </div>
              </div>

              <button
                onClick={assignRole}
                disabled={busyRole}
                className="mt-4 w-full inline-flex items-center justify-center rounded-2xl px-4 py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-black text-sm font-extrabold transition shadow-[0_18px_60px_rgba(249,115,22,0.22)]"
              >
                {busyRole ? "Kaydediliyor…" : "Rolü Kaydet →"}
              </button>
            </div>

            {/* Canlı Destek */}
            <div className="rounded-3xl border border-zinc-800/70 bg-zinc-900/25 backdrop-blur-xl p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
              <div className="text-base font-extrabold">Canlı Destek Ekibi</div>
              <div className="mt-1 text-sm text-zinc-300">
                Bu kullanıcıyı destek ekibine al / çıkar.
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-zinc-800/70 bg-zinc-950/40 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold">Support Agent</div>
                  <div className="text-xs text-zinc-300">Canlı destek ekranlarında görünsün</div>
                </div>

                <button
                  onClick={() => setSupportAgent((v) => !v)}
                  className={`h-10 px-4 rounded-2xl border transition text-sm font-extrabold ${
                    supportAgent
                      ? "border-orange-300/30 bg-orange-500/15 text-orange-200"
                      : "border-zinc-800/70 bg-zinc-950/40 text-zinc-200 hover:bg-zinc-900/50"
                  }`}
                >
                  {supportAgent ? "Açık" : "Kapalı"}
                </button>
              </div>

              <div className="mt-4">
                <div className="text-xs text-zinc-300 mb-2">Destek Seviyesi</div>
                <select
                  value={supportLevel}
                  onChange={(e) => setSupportLevel(e.target.value as SupportLevel)}
                  disabled={!supportAgent}
                  className="w-full rounded-2xl px-4 py-3 bg-zinc-950/40 border border-zinc-800/70 outline-none focus:border-orange-500/60 disabled:opacity-60"
                >
                  <option value="agent">agent (Destek)</option>
                  <option value="lead">lead (Takım Lideri)</option>
                </select>
              </div>

              <button
                onClick={saveSupport}
                disabled={busySupport}
                className="mt-4 w-full inline-flex items-center justify-center rounded-2xl px-4 py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-black text-sm font-extrabold transition shadow-[0_18px_60px_rgba(249,115,22,0.22)]"
              >
                {busySupport ? "Kaydediliyor…" : "Destek Ekibini Kaydet →"}
              </button>

              <div className="mt-3 text-[11px] text-zinc-500">
                Güvenlik: Bu alanları Firestore Rules’da sadece founder/headmod güncelleyebilmeli.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}