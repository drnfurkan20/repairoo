"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";

/** --- Types --- */
type ProDoc = {
  ownerUid: string;
  companyName: string;
  displayName: string;
  city?: string; // opsiyonel (ana şehir)
  cities: string[];
  professions: string[];
  photoURL?: string;
  isVisible?: boolean;
  isSponsored?: boolean;
  rating?: number;
  reviews?: number;
  createdAt?: any;
  updatedAt?: any;
};

type ReviewDoc = {
  rating: number;
  text?: string;
  userName?: string;
  createdAt?: any;
};

type PortfolioItem = {
  id: string;
  url: string;
  createdAt?: any;
};

function trLower(s: string) {
  return (s || "").toLocaleLowerCase("tr-TR");
}

function chipify(list: string[]) {
  return (list || []).filter(Boolean).slice(0, 200);
}

export default function ProProfilePage() {
  const params = useParams<{ id: string }>();
  const proId = params?.id as string;
  const router = useRouter();

  const [fbUser, setFbUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pro, setPro] = useState<ProDoc | null>(null);

  const [isOwner, setIsOwner] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // editable fields
  const [companyName, setCompanyName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [citiesText, setCitiesText] = useState(""); // "Denizli, İzmir"
  const [profText, setProfText] = useState(""); // "Elektrik Arıza, Elektrik Tesisatı"

  // uploads
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [portfolioUploading, setPortfolioUploading] = useState(false);

  // reviews + portfolio
  const [reviews, setReviews] = useState<ReviewDoc[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [activeTab, setActiveTab] = useState<"portfolio" | "reviews">("portfolio");

  const fileAvatarRef = useRef<HTMLInputElement | null>(null);
  const filePortfolioRef = useRef<HTMLInputElement | null>(null);

  const logoSrc = useMemo(() => "/logo.png", []);

  /** --- Load auth + data --- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setFbUser(u || null);
      if (!u) {
        router.replace("/auth");
        return;
      }
      await loadAll(u);
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proId]);

  const loadAll = async (u: User) => {
    setLoading(true);
    try {
      // pro doc
      const proRef = doc(db, "pros", proId);
      const snap = await getDoc(proRef);
      if (!snap.exists()) {
        setPro(null);
        setLoading(false);
        return;
      }
      const data = snap.data() as any as ProDoc;

      const owner = data?.ownerUid === u.uid;
      setIsOwner(owner);

      setPro(data);
      setCompanyName(data?.companyName || "");
      setDisplayName(data?.displayName || "");
      setCitiesText((data?.cities || []).join(", "));
      setProfText((data?.professions || []).join(", "));

      // portfolio (subcollection)
      const portRef = collection(db, "pros", proId, "portfolio");
      const portQ = query(portRef, orderBy("createdAt", "desc"), limit(80));
      const portSnap = await getDocs(portQ);
      setPortfolio(
        portSnap.docs.map((d) => {
          const x = d.data() as any;
          return { id: d.id, url: x?.url || "", createdAt: x?.createdAt };
        })
      );

      // reviews (subcollection)
      const revRef = collection(db, "pros", proId, "reviews");
      const revQ = query(revRef, orderBy("createdAt", "desc"), limit(80));
      const revSnap = await getDocs(revQ);
      setReviews(
        revSnap.docs.map((d) => {
          const x = d.data() as any;
          return {
            rating: typeof x?.rating === "number" ? x.rating : 5,
            text: x?.text || "",
            userName: x?.userName || "Kullanıcı",
            createdAt: x?.createdAt,
          };
        })
      );
    } catch (e) {
      console.error("pro page load error:", e);
      setPro(null);
    } finally {
      setLoading(false);
    }
  };

  /** --- Helpers --- */
  const parseCommaList = (txt: string) =>
    chipify(
      txt
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
    );

  const canEdit = isOwner; // istersen admin de ekleriz sonra

  /** --- Save edits --- */
  const saveEdits = async () => {
    if (!canEdit) return;
    const nextCities = parseCommaList(citiesText);
    const nextProf = parseCommaList(profText);

    if (!companyName.trim() || !displayName.trim()) {
      alert("Şirket adı ve usta adı boş olamaz.");
      return;
    }
    if (nextCities.length === 0 || nextProf.length === 0) {
      alert("En az 1 şehir ve 1 meslek gir.");
      return;
    }

    try {
      const proRef = doc(db, "pros", proId);
      await updateDoc(proRef, {
        companyName: companyName.trim(),
        displayName: displayName.trim(),
        cities: nextCities,
        professions: nextProf,
        city: nextCities[0], // ana şehir
        updatedAt: serverTimestamp(),
      });
      setEditOpen(false);
      if (fbUser) await loadAll(fbUser);
    } catch (e) {
      console.error("saveEdits error:", e);
      alert("Kaydederken hata oldu. (Rules?)");
    }
  };

  /** --- Upload avatar --- */
  const onPickAvatar = async (file?: File | null) => {
    if (!file || !canEdit) return;
    setAvatarUploading(true);
    try {
      const path = `pros/${proId}/avatar_${Date.now()}.jpg`;
      const r = ref(storage, path);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);

      await updateDoc(doc(db, "pros", proId), {
        photoURL: url,
        updatedAt: serverTimestamp(),
      });

      if (fbUser) await loadAll(fbUser);
    } catch (e) {
      console.error("avatar upload error:", e);
      alert("Fotoğraf yüklenemedi. (Storage/Rules kontrol)");
    } finally {
      setAvatarUploading(false);
    }
  };

  /** --- Upload portfolio images (multi) --- */
  const onPickPortfolio = async (files?: FileList | null) => {
    if (!files || files.length === 0 || !canEdit) return;
    setPortfolioUploading(true);
    try {
      const proPortCol = collection(db, "pros", proId, "portfolio");

      // sırayla yükle (basit + stabil)
      for (const f of Array.from(files)) {
        const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
        const path = `pros/${proId}/portfolio/${Date.now()}_${Math.random().toString(16).slice(2)}.${ext}`;
        const r = ref(storage, path);
        await uploadBytes(r, f);
        const url = await getDownloadURL(r);

        const itemRef = doc(proPortCol);
        await setDoc(itemRef, {
          url,
          createdAt: serverTimestamp(),
        });
      }

      if (fbUser) await loadAll(fbUser);
      setActiveTab("portfolio");
    } catch (e) {
      console.error("portfolio upload error:", e);
      alert("Portföy yüklenemedi. (Storage/Rules kontrol)");
    } finally {
      setPortfolioUploading(false);
      if (filePortfolioRef.current) filePortfolioRef.current.value = "";
    }
  };

  const deletePortfolioItem = async (itemId: string) => {
    if (!canEdit) return;
    const ok = confirm("Bu fotoğrafı silmek istiyor musun?");
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "pros", proId, "portfolio", itemId));
      if (fbUser) await loadAll(fbUser);
    } catch (e) {
      console.error("delete portfolio error:", e);
      alert("Silinemedi. (Rules?)");
    }
  };

  /** --- UI --- */
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-sm text-zinc-300">Yükleniyor…</div>
      </div>
    );
  }

  if (!pro) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-3xl border border-zinc-800/70 bg-zinc-900/30 p-6">
          <div className="text-lg font-extrabold">Profil bulunamadı</div>
          <div className="mt-2 text-sm text-zinc-300">Bu proId için kayıt yok.</div>
          <Link
            href="/discover"
            className="mt-4 inline-flex rounded-2xl px-4 py-2 border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 transition text-sm font-semibold"
          >
            Discover’a dön
          </Link>
        </div>
      </div>
    );
  }

  const cities = pro?.cities || [];
  const profs = pro?.professions || [];
  const rating = typeof pro?.rating === "number" ? pro.rating : 4.8;
  const reviewCount = typeof pro?.reviews === "number" ? pro.reviews : reviews.length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-44 -right-52 h-[620px] w-[620px] rounded-full blur-3xl opacity-30 bg-orange-500" />
        <div className="absolute -bottom-60 -left-56 h-[720px] w-[720px] rounded-full blur-3xl opacity-25 bg-orange-600" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.06),transparent_55%),radial-gradient(circle_at_85%_75%,rgba(249,115,22,0.14),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      {/* Top bar */}
      <header className="relative z-30 mx-auto max-w-6xl px-4 pt-5">
        <div className="rounded-3xl border border-zinc-800/70 bg-zinc-900/30 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3">
            <Link href="/discover" className="flex items-center gap-3">
              <div className="relative h-10 w-10 rounded-2xl border border-zinc-700/60 bg-zinc-950/50 shadow overflow-hidden">
                <Image src={logoSrc} alt="Repairoo" width={40} height={40} className="h-full w-full object-cover" priority />
                <div className="pointer-events-none absolute -left-10 top-0 h-full w-10 rotate-12 bg-white/20 blur-md animate-shine" />
              </div>
              <div className="leading-tight">
                <div className="text-lg sm:text-xl font-extrabold tracking-tight">
                  <span className="silver-flow">Repairoo</span>
                </div>
                <div className="text-[11px] sm:text-xs text-zinc-300">Şirket Profili</div>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  onClick={() => setEditOpen(true)}
                  className="rounded-2xl px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black text-sm font-extrabold transition shadow-[0_18px_60px_rgba(249,115,22,0.26)]"
                >
                  Şirketi Düzenle
                </button>
              )}
              <Link
                href="/discover"
                className="rounded-2xl px-4 py-2 border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 text-sm font-semibold transition"
              >
                Geri
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-20 mx-auto max-w-6xl px-4 pb-24 pt-10">
        {/* Hero card */}
        <div className="rounded-3xl border border-zinc-800/70 bg-zinc-900/25 backdrop-blur-xl p-6 sm:p-10 shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
            {/* Left: Avatar + meta */}
            <div className="w-full lg:w-[360px]">
              <div className="rounded-3xl border border-zinc-800/70 bg-zinc-950/40 p-5">
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 rounded-2xl overflow-hidden border border-zinc-700/60 bg-zinc-950/60">
                    {pro.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={pro.photoURL} alt="Profil" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-zinc-400">
                        Foto yok
                      </div>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => fileAvatarRef.current?.click()}
                        className="absolute bottom-1 right-1 rounded-xl px-2 py-1 text-[11px] font-extrabold bg-black/60 border border-white/10 hover:bg-black/70 transition"
                      >
                        Değiştir
                      </button>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="text-lg font-extrabold truncate">{pro.companyName}</div>
                    <div className="mt-0.5 text-xs text-zinc-300 truncate">{pro.displayName}</div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="text-[11px] rounded-full border border-orange-300/20 bg-orange-500/15 px-2 py-0.5 text-orange-200">
                        ⭐ {rating.toFixed(1)}
                      </span>
                      <span className="text-[11px] rounded-full border border-zinc-700/60 bg-zinc-950/40 px-2 py-0.5 text-zinc-200">
                        {reviewCount} yorum
                      </span>
                      {pro.isSponsored && (
                        <span className="text-[11px] rounded-full border border-orange-300/20 bg-orange-500/15 px-2 py-0.5 text-orange-200">
                          Sponsorlu
                        </span>
                      )}
                      {pro.isVisible ? (
                        <span className="text-[11px] rounded-full border border-emerald-300/20 bg-emerald-500/10 px-2 py-0.5 text-emerald-200">
                          Yayında
                        </span>
                      ) : (
                        <span className="text-[11px] rounded-full border border-red-300/20 bg-red-500/10 px-2 py-0.5 text-red-200">
                          Gizli
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <input
                  ref={fileAvatarRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPickAvatar(e.target.files?.[0])}
                />

                {avatarUploading && (
                  <div className="mt-4 text-xs text-orange-200">Profil fotoğrafı yükleniyor…</div>
                )}

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/35 p-4">
                    <div className="text-xs text-zinc-400">Şehirler</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {cities.length === 0 ? (
                        <span className="text-xs text-zinc-400">—</span>
                      ) : (
                        cities.slice(0, 12).map((c) => (
                          <span
                            key={c}
                            className="text-[11px] rounded-full border border-zinc-700/60 bg-zinc-950/40 px-2 py-0.5 text-zinc-200"
                          >
                            {c}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/35 p-4">
                    <div className="text-xs text-zinc-400">Meslekler</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {profs.length === 0 ? (
                        <span className="text-xs text-zinc-400">—</span>
                      ) : (
                        profs.slice(0, 12).map((p) => (
                          <span
                            key={p}
                            className="text-[11px] rounded-full border border-orange-300/20 bg-orange-500/10 px-2 py-0.5 text-orange-200"
                          >
                            {p}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveTab("portfolio")}
                  className={`rounded-2xl px-4 py-3 border transition text-sm font-semibold ${
                    activeTab === "portfolio"
                      ? "border-orange-300/30 bg-orange-500/15 text-orange-100"
                      : "border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50"
                  }`}
                >
                  Portföy
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`rounded-2xl px-4 py-3 border transition text-sm font-semibold ${
                    activeTab === "reviews"
                      ? "border-orange-300/30 bg-orange-500/15 text-orange-100"
                      : "border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50"
                  }`}
                >
                  Yorumlar
                </button>
              </div>
            </div>

            {/* Right: Content */}
            <div className="flex-1">
              <div className="rounded-3xl border border-zinc-800/70 bg-zinc-950/35 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-extrabold">
                      {activeTab === "portfolio" ? "Yapılan İşler" : "Gelen Değerlendirmeler"}
                    </div>
                    <div className="mt-1 text-xs text-zinc-300">
                      {activeTab === "portfolio"
                        ? "Müşteriye güven veren fotoğraflar = daha çok iş."
                        : "Yorumlarını takip et, itibarını büyüt."}
                    </div>
                  </div>

                  {canEdit && activeTab === "portfolio" && (
                    <>
                      <button
                        onClick={() => filePortfolioRef.current?.click()}
                        className="rounded-2xl px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black text-sm font-extrabold transition shadow-[0_18px_60px_rgba(249,115,22,0.22)]"
                      >
                        Fotoğraf Yükle
                      </button>
                      <input
                        ref={filePortfolioRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => onPickPortfolio(e.target.files)}
                      />
                    </>
                  )}
                </div>

                {portfolioUploading && activeTab === "portfolio" && (
                  <div className="mt-4 text-xs text-orange-200">Portföy yükleniyor…</div>
                )}

                {/* Portfolio grid */}
                {activeTab === "portfolio" && (
                  <div className="mt-5">
                    {portfolio.length === 0 ? (
                      <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/40 p-5 text-sm text-zinc-300">
                        Henüz portföy yok. {canEdit ? "Hemen birkaç iş fotoğrafı yükle." : "Yakında eklenecek."}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {portfolio.map((it) => (
                          <div key={it.id} className="group relative rounded-2xl overflow-hidden border border-zinc-800/70 bg-zinc-950/50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={it.url} alt="İş fotoğrafı" className="h-36 w-full object-cover" />
                            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-[linear-gradient(to_top,rgba(0,0,0,0.75),transparent_65%)]" />
                            {canEdit && (
                              <button
                                onClick={() => deletePortfolioItem(it.id)}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition rounded-xl px-2 py-1 text-[11px] font-extrabold bg-black/60 border border-white/10 hover:bg-black/70"
                              >
                                Sil
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews list */}
                {activeTab === "reviews" && (
                  <div className="mt-5">
                    {reviews.length === 0 ? (
                      <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/40 p-5 text-sm text-zinc-300">
                        Henüz yorum yok.
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {reviews.map((r, idx) => (
                          <div key={idx} className="rounded-2xl border border-zinc-800/70 bg-zinc-950/40 p-4">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-extrabold text-zinc-100">{r.userName || "Kullanıcı"}</div>
                              <div className="text-xs text-orange-200 font-extrabold">⭐ {Number(r.rating || 5).toFixed(1)}</div>
                            </div>
                            {r.text ? (
                              <div className="mt-2 text-sm text-zinc-200 leading-relaxed">{r.text}</div>
                            ) : (
                              <div className="mt-2 text-sm text-zinc-400">Yorum metni yok.</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mini premium note */}
              <div className="mt-4 rounded-3xl border border-zinc-800/70 bg-zinc-950/35 p-5">
                <div className="text-sm font-extrabold">Premium İpucu</div>
                <div className="mt-2 text-xs text-zinc-300">
                  Portföyüne <span className="text-orange-200 font-semibold">3–6 net foto</span> koy. Aynı gün içinde dönüş yapan ustalar daha çok seçiliyor.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Edit modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditOpen(false)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-zinc-800/70 bg-zinc-950/80 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.65)] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-extrabold">Şirketi Düzenle</div>
                <div className="mt-1 text-xs text-zinc-300">Şehir ve meslekleri virgülle ayır. (Örn: Denizli, İzmir)</div>
              </div>
              <button
                onClick={() => setEditOpen(false)}
                className="h-10 w-10 rounded-2xl border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 transition flex items-center justify-center"
                aria-label="Kapat"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/45 p-4">
                <div className="text-xs text-zinc-300">Şirket Adı</div>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-zinc-800/70 bg-zinc-950/50 px-4 py-3 text-sm outline-none placeholder:text-zinc-500 focus:border-orange-500/60"
                  placeholder="Örn: FRKN Elektrik"
                />
              </div>

              <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/45 p-4">
                <div className="text-xs text-zinc-300">Usta / Yetkili Adı</div>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-zinc-800/70 bg-zinc-950/50 px-4 py-3 text-sm outline-none placeholder:text-zinc-500 focus:border-orange-500/60"
                  placeholder="Örn: Furkan Duran"
                />
              </div>

              <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/45 p-4 sm:col-span-2">
                <div className="text-xs text-zinc-300">Şehirler (virgülle)</div>
                <input
                  value={citiesText}
                  onChange={(e) => setCitiesText(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-zinc-800/70 bg-zinc-950/50 px-4 py-3 text-sm outline-none placeholder:text-zinc-500 focus:border-orange-500/60"
                  placeholder="Denizli, İzmir, İstanbul"
                />
              </div>

              <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/45 p-4 sm:col-span-2">
                <div className="text-xs text-zinc-300">Meslekler (virgülle)</div>
                <input
                  value={profText}
                  onChange={(e) => setProfText(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-zinc-800/70 bg-zinc-950/50 px-4 py-3 text-sm outline-none placeholder:text-zinc-500 focus:border-orange-500/60"
                  placeholder="Elektrik Arıza, Elektrik Tesisatı, Sigorta / Pano"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => setEditOpen(false)}
                className="rounded-2xl px-4 py-2 border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 text-sm font-semibold transition"
              >
                Vazgeç
              </button>
              <button
                onClick={saveEdits}
                className="rounded-2xl px-5 py-2 bg-orange-500 hover:bg-orange-400 text-black text-sm font-extrabold transition shadow-[0_18px_60px_rgba(249,115,22,0.22)]"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium text styles */}
      <style jsx global>{`
        .silver-flow {
          background: linear-gradient(
            110deg,
            #6b7280 0%,
            #e5e7eb 20%,
            #9ca3af 40%,
            #f9fafb 50%,
            #9ca3af 60%,
            #e5e7eb 80%,
            #6b7280 100%
          );
          background-size: 240% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: silverFlow 2.8s linear infinite;
          text-shadow: 0 0 24px rgba(255, 255, 255, 0.06);
        }
        @keyframes silverFlow {
          0% { background-position: 0% 50%; }
          100% { background-position: 240% 50%; }
        }
        @keyframes shineMove {
          0% { transform: translateX(-90px) rotate(12deg); opacity: 0; }
          12% { opacity: 0.35; }
          45% { opacity: 0.12; }
          100% { transform: translateX(160px) rotate(12deg); opacity: 0; }
        }
        .animate-shine { animation: shineMove 2.8s ease-in-out infinite; }
      `}</style>
    </div>
  );
}