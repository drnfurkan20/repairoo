"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type AppRole = "admin" | "user";
type AccountType = "pro" | "user";

type AppUserMeta = {
  role: AppRole;
  accountType: AccountType;
  displayName?: string;
  photoURL?: string;
};

export default function HomePage() {
  const router = useRouter();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fbUser, setFbUser] = useState<User | null>(null);
  const [meta, setMeta] = useState<AppUserMeta | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const logoSrc = useMemo(() => "/logo.png", []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setFbUser(u);
      setLoadingMeta(true);

      if (!u) {
        setMeta(null);
        setLoadingMeta(false);
        return;
      }

      try {
        // users/{uid} -> role/accountType
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);

        const data = snap.exists() ? (snap.data() as any) : null;
        const role: AppRole = data?.role === "admin" ? "admin" : "user";
        const accountType: AccountType = data?.accountType === "pro" ? "pro" : "user";

        setMeta({
          role,
          accountType,
          displayName: data?.displayName || u.displayName || "Kullanıcı",
          photoURL: data?.photoURL || u.photoURL || undefined,
        });
      } catch {
        // publish-ready: hata olsa bile user olarak devam
        setMeta({
          role: "user",
          accountType: "user",
          displayName: u.displayName || "Kullanıcı",
          photoURL: u.photoURL || undefined,
        });
      } finally {
        setLoadingMeta(false);
      }
    });

    return () => unsub();
  }, []);

  const isAuthed = !!fbUser;
  const isAdmin = meta?.role === "admin";
  const isPro = meta?.accountType === "pro";

  const closeDrawer = () => setDrawerOpen(false);

  const handleLogout = async () => {
    closeDrawer();
    await signOut(auth);
    router.push("/auth");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* Premium background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-44 -right-52 h-[620px] w-[620px] rounded-full blur-3xl opacity-30 bg-orange-500" />
        <div className="absolute -bottom-60 -left-56 h-[720px] w-[720px] rounded-full blur-3xl opacity-25 bg-orange-600" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.06),transparent_55%),radial-gradient(circle_at_85%_75%,rgba(249,115,22,0.14),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      {/* Top Bar */}
      <header className="relative z-30 mx-auto max-w-6xl px-4 pt-5">
        <div className="rounded-3xl border border-zinc-800/70 bg-zinc-900/30 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3">
            <div className="flex items-center gap-3">
              {/* Hamburger */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="h-10 w-10 rounded-2xl border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 transition flex items-center justify-center"
                aria-label="Menü"
              >
                <span className="block w-5">
                  <span className="block h-[2px] w-5 bg-white/85 rounded-full" />
                  <span className="block h-[2px] w-5 bg-white/60 rounded-full mt-1.5" />
                  <span className="block h-[2px] w-5 bg-white/75 rounded-full mt-1.5" />
                </span>
              </button>

              {/* Logo + Brand */}
              <Link href="/" className="flex items-center gap-3">
                <div className="relative h-10 w-10 rounded-2xl border border-zinc-700/60 bg-zinc-950/50 shadow overflow-hidden">
                  <Image
                    src={logoSrc}
                    alt="Repairoo"
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                    priority
                  />
                  <div className="pointer-events-none absolute -left-10 top-0 h-full w-10 rotate-12 bg-white/20 blur-md animate-shine" />
                </div>

                <div className="leading-tight">
                  <div className="text-lg sm:text-xl font-extrabold tracking-tight">
                    <span className="silver-flow">Repairoo</span>
                  </div>
                  <div className="text-[11px] sm:text-xs text-zinc-300">
                    Usta bulmanın premium yolu
                  </div>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              {!isAuthed ? (
                <>
                  <Link
                    href="/auth"
                    className="hidden sm:inline-flex items-center justify-center rounded-2xl px-4 py-2 border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 text-sm font-semibold transition"
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    href="/discover"
                    className="inline-flex items-center justify-center rounded-2xl px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black text-sm font-extrabold transition shadow-[0_18px_60px_rgba(249,115,22,0.26)]"
                  >
                    Usta Bul
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/discover"
                    className="inline-flex items-center justify-center rounded-2xl px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black text-sm font-extrabold transition shadow-[0_18px_60px_rgba(249,115,22,0.26)]"
                  >
                    Usta Bul
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="hidden sm:inline-flex items-center justify-center rounded-2xl px-4 py-2 border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 text-sm font-semibold transition"
                  >
                    Çıkış
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-20 mx-auto max-w-6xl px-4 pb-24 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hero */}
          <div className="rounded-3xl border border-zinc-800/70 bg-zinc-900/25 backdrop-blur-xl p-7 sm:p-10 shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800/70 bg-zinc-950/40 px-3 py-1 text-xs text-zinc-200">
              <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_18px_rgba(249,115,22,0.75)]" />
              premium deneyim
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight">
              İhtiyacın olan ustayı{" "}
              <span className="text-orange-400">hızla</span> bul.
            </h1>

            <p className="mt-3 text-sm sm:text-base text-zinc-300">
              Mesleği seç, şehri seç, sonuçları gör. Repairoo; hızlı, net ve şık
              bir deneyim sunar.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href="/discover"
                className="inline-flex items-center justify-center rounded-2xl px-5 py-3 bg-orange-500 hover:bg-orange-400 text-black text-sm font-extrabold transition shadow-[0_18px_60px_rgba(249,115,22,0.26)]"
              >
                Usta Bul
              </Link>

              {!isAuthed ? (
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center rounded-2xl px-5 py-3 border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 text-sm font-semibold transition"
                >
                  Google ile Giriş
                </Link>
              ) : (
                <Link
                  href="/messages"
                  className="inline-flex items-center justify-center rounded-2xl px-5 py-3 border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 text-sm font-semibold transition"
                >
                  Mesajlara Git
                </Link>
              )}
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FeatureCard
                title="Premium Arayüz"
                desc="Koyu tema + turuncu vurgu. Gözü yormaz, şık durur."
              />
              <FeatureCard
                title="Hızlı Akış"
                desc="Seç → filtrele → bul. Gereksiz adım yok."
              />
              <FeatureCard
                title="Kolay İletişim"
                desc="Ustaya ulaş, konuş, anlaş; hızlı çözüm."
              />
              <FeatureCard
                title="Güvenli Giriş"
                desc="Google ile tek dokunuş."
              />
            </div>
          </div>

          {/* Right panel */}
          <div className="rounded-3xl border border-zinc-800/70 bg-zinc-900/25 backdrop-blur-xl p-7 sm:p-10 shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg sm:text-xl font-bold">Hızlı Menü</div>
                <div className="mt-1 text-sm text-zinc-300">
                  En sık kullanılan bölümlere hızlı geçiş.
                </div>
              </div>
              <div className="text-xs text-zinc-400">
                {loadingMeta ? "Kontrol ediliyor…" : isAuthed ? "Aktif" : "Misafir"}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <QuickLink href="/discover" title="Usta Bul" subtitle="Meslek & şehir seçerek ara" badge="Önerilen" />
              <QuickLink href="/vip" title="VIP Planları" subtitle="Herkese açık • premium avantajlar" badge="VIP" />
              <QuickLink href="/messages" title="Mesajlar" subtitle="Ustalardan gelen mesajlara ulaş" />

              {isPro && (
                <QuickLink
                  href="/highlight"
                  title="Öne Çıkartma"
                  subtitle="Sadece ustalar • görünürlüğünü artır"
                  badge="Usta"
                />
              )}

              {isAdmin && (
                <QuickLink
                  href="/admin"
                  title="Admin Paneli"
                  subtitle="Sadece admin • yönetim ekranı"
                  badge="Admin"
                />
              )}

              <QuickLink href="/settings" title="Ayarlar" subtitle="Görünüm, hesap, bildirimler" />
            </div>

            <div className="mt-8 rounded-2xl border border-zinc-800/70 bg-zinc-950/40 p-4">
              <div className="text-sm font-semibold">Durum</div>
              <div className="mt-1 text-xs text-zinc-300">
                {isAuthed
                  ? `Hoş geldin, ${meta?.displayName ?? "Kullanıcı"}`
                  : "Misafir modundasın. Giriş yaparsan mesajlar ve profil aktif olur."}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Live Support Button */}
      <Link
        href="/support"
        className="fixed bottom-5 right-5 z-40 group"
        aria-label="Canlı Destek"
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl blur-xl opacity-35 bg-orange-500 group-hover:opacity-55 transition" />
          <div className="relative h-14 w-14 rounded-2xl bg-orange-500 hover:bg-orange-400 text-black shadow-[0_18px_70px_rgba(249,115,22,0.35)] border border-orange-200/30 flex items-center justify-center transition">
            {/* chat icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M7 8h10M7 12h6m-8 9 2.2-3.3A9 9 0 1 1 21 12a9 9 0 0 1-9 9c-1.2 0-2.4-.2-3.5-.6L5 21Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </Link>

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeDrawer}
          />
          <aside className="absolute left-3 top-3 bottom-3 w-[320px] max-w-[88vw] rounded-3xl border border-zinc-800/70 bg-zinc-950/70 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.65)] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 rounded-2xl border border-zinc-700/60 bg-zinc-950/50 shadow overflow-hidden">
                  <Image
                    src={logoSrc}
                    alt="Repairoo"
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="leading-tight">
                  <div className="text-base font-extrabold">
                    <span className="silver-flow">Repairoo</span>
                  </div>
                  <div className="text-[11px] text-zinc-300">Menü</div>
                </div>
              </div>

              <button
                onClick={closeDrawer}
                className="h-10 w-10 rounded-2xl border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 transition flex items-center justify-center"
                aria-label="Kapat"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-800/70 bg-zinc-950/40 p-3">
              <div className="text-sm font-semibold">
                {loadingMeta ? "Yükleniyor…" : isAuthed ? (meta?.displayName ?? "Kullanıcı") : "Misafir"}
              </div>
              <div className="mt-1 text-xs text-zinc-300">
                {isAuthed ? "Hesabın aktif. Menüler kullanıma hazır." : "Giriş yaparak tüm özellikleri aç."}
              </div>
            </div>

            <nav className="mt-4 grid gap-2">
              <DrawerItem href="/discover" title="Usta Bul" desc="Meslek & şehir seçerek ara" onClick={closeDrawer} />
              <DrawerItem href="/vip" title="VIP Planları" desc="Herkese açık" onClick={closeDrawer} />
              <DrawerItem href="/settings" title="Ayarlar" desc="Görünüm, hesap, bildirim" onClick={closeDrawer} />

              <div className="h-px bg-zinc-800/70 my-2" />

              <DrawerItem href="/profile" title="Kullanıcı Profili" desc="Profilini görüntüle" onClick={closeDrawer} />
              <DrawerItem href="/profile/edit" title="Profil Düzenle" desc="Bilgilerini güncelle" onClick={closeDrawer} />
              <DrawerItem href="/messages" title="Mesajlar" desc="Ustalardan gelen mesajlar" onClick={closeDrawer} />

              {isPro && (
                <DrawerItem
                  href="/highlight"
                  title="Öne Çıkartma"
                  desc="Sadece ustalar"
                  badge="Usta"
                  onClick={closeDrawer}
                />
              )}

              {isAdmin && (
                <DrawerItem
                  href="/admin"
                  title="Admin"
                  desc="Sadece admin hesaplar"
                  badge="Admin"
                  onClick={closeDrawer}
                />
              )}

              <div className="h-px bg-zinc-800/70 my-2" />

              <DrawerItem href="/support" title="Canlı Destek" desc="Hızlı yardım" onClick={closeDrawer} />

              {!isAuthed ? (
                <DrawerItem href="/auth" title="Giriş Yap" desc="Google ile giriş" badge="Giriş" onClick={closeDrawer} />
              ) : (
                <button
                  onClick={handleLogout}
                  className="text-left w-full rounded-2xl border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 transition px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">Çıkış Yap</div>
                      <div className="mt-0.5 text-xs text-zinc-300">Hesabından çık</div>
                    </div>
                    <span className="text-xs text-zinc-400">→</span>
                  </div>
                </button>
              )}
            </nav>

            <div className="mt-4 text-[11px] text-zinc-500">
              © {new Date().getFullYear()} Repairoo • Premium deneyim
            </div>
          </aside>
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
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 240% 50%;
          }
        }

        @keyframes shineMove {
          0% {
            transform: translateX(-90px) rotate(12deg);
            opacity: 0;
          }
          12% {
            opacity: 0.35;
          }
          45% {
            opacity: 0.12;
          }
          100% {
            transform: translateX(160px) rotate(12deg);
            opacity: 0;
          }
        }
        .animate-shine {
          animation: shineMove 2.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/35 p-4">
      <div className="text-sm font-bold text-zinc-100">{title}</div>
      <div className="mt-1 text-xs text-zinc-300">{desc}</div>
    </div>
  );
}

function QuickLink({
  href,
  title,
  subtitle,
  badge,
}: {
  href: string;
  title: string;
  subtitle: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/45 transition px-4 py-3"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-0.5 text-xs text-zinc-300">{subtitle}</div>
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="text-[11px] rounded-full border border-orange-300/20 bg-orange-500/15 px-2 py-0.5 text-orange-200">
              {badge}
            </span>
          )}
          <span className="text-xs text-zinc-400">→</span>
        </div>
      </div>
    </Link>
  );
}

function DrawerItem({
  href,
  title,
  desc,
  badge,
  onClick,
}: {
  href: string;
  title: string;
  desc: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="rounded-2xl border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 transition px-4 py-3"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-0.5 text-xs text-zinc-300">{desc}</div>
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="text-[11px] rounded-full border border-orange-300/20 bg-orange-500/15 px-2 py-0.5 text-orange-200">
              {badge}
            </span>
          )}
          <span className="text-xs text-zinc-400">→</span>
        </div>
      </div>
    </Link>
  );
}