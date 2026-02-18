"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [logoSrc, setLogoSrc] = useState("/logo.png"); // fallback aşağıda

  useEffect(() => {
    // /logo.png yoksa /repairoo-logo.png dene (uğraştırmasın diye)
    const img = new window.Image();
    img.onload = () => setLogoSrc("/logo.png");
    img.onerror = () => setLogoSrc("/repairoo-logo.png");
    img.src = "/logo.png";

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) router.replace("/discover");
    });
    return () => unsub();
  }, [router]);

  const niceErr = useMemo(() => {
    if (!err) return null;
    if (err.includes("auth/invalid-api-key"))
      return "Giriş ayarlarında bir sorun var. (Uygulama yapılandırması)";
    if (err.includes("auth/unauthorized-domain"))
      return "Bu cihazdan girişe izin verilmiyor. (Domain yetkisi)";
    if (err.includes("auth/popup-closed-by-user"))
      return "Giriş penceresi kapatıldı. Tekrar dener misin?";
    if (err.includes("auth/cancelled-popup-request"))
      return "Birden fazla giriş penceresi açıldı. Tekrar dene.";
    return "Giriş sırasında bir sorun oluştu. Lütfen tekrar dene.";
  }, [err]);

  const loginWithGoogle = async () => {
    setErr(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      router.replace("/discover");
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? "Giriş hatası");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-zinc-950 text-white">
      {/* Premium arka plan */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full blur-3xl opacity-30 bg-orange-500" />
        <div className="absolute -bottom-56 -left-56 h-[620px] w-[620px] rounded-full blur-3xl opacity-25 bg-orange-600" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.06),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(249,115,22,0.12),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-[980px] grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sol: Marka + Sloganlar */}
          <div className="rounded-3xl border border-zinc-800/70 bg-zinc-900/30 backdrop-blur-xl p-7 lg:p-10 shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
            <div className="flex items-center gap-3">
              {/* LOGO */}
              <div className="relative h-11 w-11 rounded-2xl border border-zinc-700/60 bg-zinc-950/50 shadow overflow-hidden">
                <Image
                  src={logoSrc}
                  alt="Repairoo"
                  width={44}
                  height={44}
                  className="h-full w-full object-cover"
                  priority
                />
                {/* premium parıltı */}
                <div className="pointer-events-none absolute -left-10 top-0 h-full w-10 rotate-12 bg-white/20 blur-md animate-shine" />
              </div>

              <div className="leading-tight">
                <div className="text-2xl lg:text-3xl font-extrabold tracking-tight">
                  <span className="silver-flow">Repairoo</span>
                </div>
                <div className="text-xs lg:text-sm text-zinc-300">
                  Usta bulmanın en kolay yolu.
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="text-xl lg:text-2xl font-bold">
                Usta bul, işi hızla çözüp çık.
              </div>
              <div className="mt-2 text-sm lg:text-base text-zinc-300">
                Google ile giriş yap, mesleği seç, şehrini seç… Repairoo seni
                doğru ustaya götürsün.
              </div>

              {/* Değer önerileri */}
              <div className="mt-6 grid grid-cols-1 gap-3">
                <ValueRow
                  title="Hızlı Eşleştirme"
                  desc="İhtiyacına uygun ustayı saniyeler içinde bul."
                />
                <ValueRow
                  title="Şık & Akıcı Deneyim"
                  desc="Premium koyu tema, net arayüz, rahat kullanım."
                />
                <ValueRow
                  title="Kolay İletişim"
                  desc="Ustaya ulaş, konuş, anlaş — uğraştırmadan."
                />
              </div>
            </div>

            {/* ✅ Mini Not yerine yayın-ready yardım kutusu */}
            <div className="mt-8 rounded-2xl border border-zinc-800/70 bg-zinc-950/40 p-4">
              <div className="text-sm font-semibold text-zinc-100">
                Sorun mu var?
              </div>
              <div className="mt-1 text-xs text-zinc-300">
                Giriş ekranı açılmazsa sayfayı yenileyip tekrar dene. Hâlâ
                olmuyorsa destek üzerinden bize yaz.
              </div>
            </div>
          </div>

          {/* Sağ: Giriş Kartı */}
          <div className="rounded-3xl border border-zinc-800/70 bg-zinc-900/30 backdrop-blur-xl p-7 lg:p-10 shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg lg:text-xl font-bold">Giriş</div>
                <div className="mt-1 text-sm text-zinc-300">
                  Devam etmek için Google ile giriş yap.
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-300">
                <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_18px_rgba(249,115,22,0.75)]" />
                premium
              </div>
            </div>

            <button
              onClick={loginWithGoogle}
              disabled={loading}
              className="mt-6 w-full rounded-2xl bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:cursor-not-allowed py-3.5 font-extrabold text-black transition shadow-[0_18px_60px_rgba(249,115,22,0.28)]"
            >
              {loading ? "Giriş yapılıyor..." : "Google ile Giriş Yap"}
            </button>

            {niceErr && (
              <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                {niceErr}
              </div>
            )}

            {/* ✅ “Giriş sonrası” kutusu publish-ready */}
            <div className="mt-6 rounded-2xl border border-zinc-800/70 bg-zinc-950/40 p-4">
              <div className="text-sm font-semibold">Hazırsın ✅</div>
              <div className="mt-1 text-xs text-zinc-300">
                Girişten sonra otomatik olarak <b>Usta Bul</b> ekranına
                yönlendirilirsin.
              </div>
            </div>

            <div className="mt-6 text-xs text-zinc-400">
              Devam ederek şartları kabul etmiş sayılırsın.
            </div>
          </div>
        </div>
      </div>

      {/* Gümüş akış + logo parıltı */}
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
            transform: translateX(-80px) rotate(12deg);
            opacity: 0;
          }
          10% {
            opacity: 0.35;
          }
          45% {
            opacity: 0.15;
          }
          100% {
            transform: translateX(140px) rotate(12deg);
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

function ValueRow({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/35 p-4">
      <div className="text-sm font-bold text-zinc-100">{title}</div>
      <div className="mt-1 text-xs text-zinc-300">{desc}</div>
    </div>
  );
}