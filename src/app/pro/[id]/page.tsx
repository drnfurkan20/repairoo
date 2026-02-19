"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type ProDoc = {
  ownerUid: string;
  companyName: string;
  displayName?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  about?: string;

  // ✅ Firestore alanları
  professions: string[]; // örn: ["Elektrik Arıza", "Su Tesisatı"]
  cities: string[];      // örn: ["İstanbul", "Kocaeli"]
  isVisible: boolean;

  // sponsor
  isSponsored?: boolean;
  sponsoredUntil?: any;

  // stats (şimdilik)
  rating?: number;
  reviews?: number;

  // medya
  logoUrl?: string;

  createdAt?: any;
  updatedAt?: any;
};

export default function ProProfilePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const proId = params?.id as string;

  const [fbUser, setFbUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [data, setData] = useState<ProDoc | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const logoSrc = useMemo(() => data?.logoUrl || "/logo.png", [data?.logoUrl]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setFbUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setErr(null);
      setNotFound(false);

      try {
        const ref = doc(db, "pros", proId);
        const snap = await getDoc(ref);
        if (!alive) return;

        if (!snap.exists()) {
          setNotFound(true);
          setData(null);
          return;
        }

        setData(snap.data() as ProDoc);
      } catch (e: any) {
        setErr("Profil yüklenemedi. Tekrar dene.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (proId) run();
    return () => {
      alive = false;
    };
  }, [proId]);

  const isOwner = !!fbUser && !!data?.ownerUid && fbUser.uid === data.ownerUid;

  const rating = typeof data?.rating === "number" ? data!.rating : 4.8;
  const reviews = typeof data?.reviews === "number" ? data!.reviews : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-sm text-zinc-300">Yükleniyor…</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-3xl border border-zinc-800/70 bg-zinc-900/30 p-6 text-center">
          <div className="text-xl font-extrabold">Profil bulunamadı</div>
          <div className="mt-2 text-sm text-zinc-300">
            Bu usta/şirket profili yok ya da kaldırılmış olabilir.
          </div>
          <button
            onClick={() => router.push("/discover")}
            className="mt-5 w-full rounded-2xl px-4 py-3 bg-orange-500 hover:bg-orange-400 text-black font-extrabold transition"
          >
            Usta Bul’a dön
          </button>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-3xl border border-red-500/30 bg-red-500/10 p-6">
          <div className="text-lg font-extrabold">Hata</div>
          <div className="mt-2 text-sm text-red-200">{err}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 w-full rounded-2xl px-4 py-3 border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 transition font-semibold"
          >
            Yenile
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-44 -right-52 h-[620px] w-[620px] rounded-full blur-3xl opacity-30 bg-orange-500" />
        <div className="absolute -bottom-60 -left-56 h-[720px] w-[720px] rounded-full blur-3xl opacity-25 bg-orange-600" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.06),transparent_55%),radial-gradient(circle_at_85%_75%,rgba(249,115,22,0.14),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <header className="relative z-20 mx-auto max-w-5xl px-4 pt-6">
        <div className="rounded-3xl border border-zinc-800/70 bg-zinc-900/30 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.55)] px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="rounded-2xl px-4 py-2 border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 transition text-sm font-semibold"
          >
            ← Geri
          </button>

          <Link href="/discover" className="text-sm text-zinc-300 hover:text-white transition">
            Usta Bul
          </Link>
        </div>
      </header>

      <main className="relative z-20 mx-auto max-w-5xl px-4 pb-24 pt-8">
        <div className="rounded-3xl border border-zinc-800/70 bg-zinc-900/25 backdrop-blur-xl p-6 sm:p-10 shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
          {/* Top */}
          <div className="flex flex-col sm:flex-row gap-6 sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 rounded-3xl border border-zinc-700/60 bg-zinc-950/50 shadow overflow-hidden">
                <Image src={logoSrc} alt={data.companyName} width={64} height={64} className="h-full w-full object-cover" />
                <div className="pointer-events-none absolute -left-10 top-0 h-full w-10 rotate-12 bg-white/20 blur-md animate-shine" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {data.companyName}
                  </h1>
                  {data.isSponsored && (
                    <span className="text-[11px] rounded-full border border-orange-300/20 bg-orange-500/15 px-2 py-0.5 text-orange-200">
                      Sponsorlu
                    </span>
                  )}
                  {!data.isVisible && isOwner && (
                    <span className="text-[11px] rounded-full border border-zinc-600/40 bg-zinc-800/30 px-2 py-0.5 text-zinc-200">
                      Gizli
                    </span>
                  )}
                </div>

                <div className="mt-1 text-sm text-zinc-300">
                  {data.displayName ? (
                    <span className="text-zinc-200 font-semibold">{data.displayName}</span>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                  <span className="mx-2 text-zinc-700">•</span>
                  <span className="text-zinc-300">
                    ⭐ {rating.toFixed(1)} <span className="text-zinc-500">({reviews} değerlendirme)</span>
                  </span>
                </div>

                <div className="mt-2 text-xs text-zinc-400">
                  Hizmet şehirleri:{" "}
                  <span className="text-zinc-200 font-semibold">
                    {(data.cities || []).slice(0, 6).join(", ") || "—"}
                  </span>
                  {(data.cities || []).length > 6 ? <span className="text-zinc-500"> …</span> : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
              {data.phone && (
                <a
                  href={`tel:${data.phone}`}
                  className="rounded-2xl px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black text-sm font-extrabold transition"
                >
                  Ara
                </a>
              )}
              {data.whatsapp && (
                <a
                  href={`https://wa.me/${data.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl px-4 py-2 border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 text-sm font-semibold transition"
                >
                  WhatsApp
                </a>
              )}
              <Link
                href={`/messages?to=${proId}`}
                className="rounded-2xl px-4 py-2 border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 text-sm font-semibold transition"
              >
                Mesaj At
              </Link>

              {isOwner && (
                <Link
                  href={`/pro/${proId}/edit`}
                  className="rounded-2xl px-4 py-2 border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 text-sm font-semibold transition"
                >
                  Profili Düzenle
                </Link>
              )}
            </div>
          </div>

          {/* Sections */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-2xl border border-zinc-800/70 bg-zinc-950/35 p-6">
              <div className="text-sm font-extrabold text-zinc-100">Hakkında</div>
              <div className="mt-3 text-sm text-zinc-300 leading-relaxed">
                {data.about?.trim() ? data.about : "Henüz açıklama eklenmemiş."}
              </div>

              <div className="mt-6 h-px bg-zinc-800/60" />

              <div className="mt-6 text-sm font-extrabold text-zinc-100">Hizmetler</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(data.professions || []).length === 0 ? (
                  <div className="text-sm text-zinc-400">Meslek bilgisi yok.</div>
                ) : (
                  data.professions.map((p) => (
                    <span
                      key={p}
                      className="text-[12px] rounded-full border border-zinc-800/70 bg-zinc-950/40 px-3 py-1 text-zinc-200"
                    >
                      {p}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/35 p-6">
              <div className="text-sm font-extrabold text-zinc-100">İletişim</div>

              <div className="mt-4 space-y-3 text-sm">
                <InfoRow label="Telefon" value={data.phone || "—"} />
                <InfoRow label="E-posta" value={data.email || "—"} />
                <InfoRow label="Web" value={data.website || "—"} />
              </div>

              <div className="mt-6 h-px bg-zinc-800/60" />

              <div className="mt-6 text-sm font-extrabold text-zinc-100">Durum</div>
              <div className="mt-3 text-sm text-zinc-300">
                {data.isVisible ? (
                  <span className="text-zinc-200">Yayında</span>
                ) : (
                  <span className="text-zinc-400">Gizli</span>
                )}
              </div>

              <div className="mt-6">
                <Link
                  href="/highlight"
                  className="w-full inline-flex items-center justify-center rounded-2xl px-4 py-3 border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 text-sm font-semibold transition"
                >
                  Öne Çıkartma (Sponsorluk)
                </Link>
                <div className="mt-2 text-[11px] text-zinc-500">
                  Sponsorlu profiller listede üstte görünür.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-zinc-400">{label}</div>
      <div className="text-zinc-200 font-semibold text-right break-words">{value}</div>
    </div>
  );
}