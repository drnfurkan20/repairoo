"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  AppRole,
  getUserRole,
  canOpenAdminPanel,
  canAddAdmin,
} from "@/lib/roleGuard";

export default function AdminPage() {
  const router = useRouter();

  const [fbUser, setFbUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole>("user");
  const [loading, setLoading] = useState(true);

  const canSeeAdminPanel = useMemo(() => canOpenAdminPanel(role), [role]);
  const canSeeAddAdmin = useMemo(() => canAddAdmin(role), [role]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setFbUser(u);

      if (!u) {
        setLoading(false);
        router.replace("/auth");
        return;
      }

      try {
        const r = await getUserRole(u.uid);
        setRole(r);
      } catch (e) {
        console.error("admin role read error:", e);
        setRole("user");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  // Yetkisizse kaç
  useEffect(() => {
    if (!loading && fbUser && !canSeeAdminPanel) {
      router.replace("/");
    }
  }, [loading, fbUser, canSeeAdminPanel, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-sm text-zinc-300">Admin Panel yükleniyor…</div>
      </div>
    );
  }

  if (!fbUser) return null;
  if (!canSeeAdminPanel) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* Premium background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-44 -right-52 h-[620px] w-[620px] rounded-full blur-3xl opacity-30 bg-orange-500" />
        <div className="absolute -bottom-60 -left-56 h-[720px] w-[720px] rounded-full blur-3xl opacity-25 bg-orange-600" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.06),transparent_55%),radial-gradient(circle_at_85%_75%,rgba(249,115,22,0.14),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <header className="relative z-20 mx-auto max-w-6xl px-4 pt-5">
        <div className="rounded-3xl border border-zinc-800/70 bg-zinc-900/30 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.55)] px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-lg sm:text-xl font-extrabold tracking-tight">
              Admin Paneli
            </div>
            <div className="text-xs text-zinc-300 mt-1">
              Sistem yönetimi • rol:{" "}
              <span className="text-orange-300 font-semibold">{role}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* SAĞ ÜST: Admin Ekle (sadece admin + headmod) */}
            {canSeeAddAdmin && (
              <Link
                href="/admin/add-admin"
                className="inline-flex items-center justify-center rounded-2xl px-4 py-2 border border-orange-300/20 bg-orange-500/15 hover:bg-orange-500/20 text-sm font-extrabold text-orange-200 transition"
              >
                + Admin Ekle
              </Link>
            )}

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl px-4 py-2 border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 text-sm font-semibold transition"
            >
              Ana Sayfa
            </Link>

            <Link
              href="/discover"
              className="inline-flex items-center justify-center rounded-2xl px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black text-sm font-extrabold transition shadow-[0_18px_60px_rgba(249,115,22,0.26)]"
            >
              Usta Bul
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-8">
        {/* Üst metrik kartlar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Kullanıcılar" value="—" hint="Yakında canlı veri" />
          <StatCard title="Pro Profiller" value="—" hint="Yakında canlı veri" />
          <StatCard title="Sponsorlar" value="—" hint="Yakında canlı veri" />
        </div>

        {/* Yönetim modülleri */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ModuleCard
            title="Pro / Şirket Yönetimi"
            desc="Profilleri listele, görünürlük/soft delete yönet."
            ctaHref="/admin/pros"
            ctaText="Aç"
          />
          <ModuleCard
            title="VIP & Öne Çıkartma"
            desc="Sponsor paketleri, öne çıkartma süreleri, kontroller."
            ctaHref="/admin/promotions"
            ctaText="Aç"
          />
          <ModuleCard
            title="Mesajlar & Destek"
            desc="Canlı destek, şikayetler, moderasyon akışı."
            ctaHref="/admin/support"
            ctaText="Aç"
          />
          <ModuleCard
            title="Roller & Yetkiler"
            desc="Admin/Mod rol yönetimi (sadece yetkili)."
            ctaHref="/admin/roles"
            ctaText="Aç"
            badge="Hassas"
          />
        </div>

        <div className="mt-6 text-[11px] text-zinc-500">
          Not: Bu sayfa UI kilidi. Asıl güvenlik kurallarını Firestore Rules + (gerekirse)
          server endpoint ile kapatacağız.
        </div>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-800/70 bg-zinc-900/25 backdrop-blur-xl p-5 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
      <div className="text-xs text-zinc-400">{title}</div>
      <div className="mt-2 text-2xl font-extrabold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-zinc-300">{hint}</div>
    </div>
  );
}

function ModuleCard({
  title,
  desc,
  ctaHref,
  ctaText,
  badge,
}: {
  title: string;
  desc: string;
  ctaHref: string;
  ctaText: string;
  badge?: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-800/70 bg-zinc-900/25 backdrop-blur-xl p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-extrabold">{title}</div>
          <div className="mt-1 text-sm text-zinc-300">{desc}</div>
        </div>

        {badge && (
          <span className="text-[11px] rounded-full border border-orange-300/20 bg-orange-500/15 px-2 py-0.5 text-orange-200">
            {badge}
          </span>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="text-xs text-zinc-400">Yönetim modülü</div>
        <Link
          href={ctaHref}
          className="inline-flex items-center justify-center rounded-2xl px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black text-sm font-extrabold transition shadow-[0_18px_60px_rgba(249,115,22,0.22)]"
        >
          {ctaText} →
        </Link>
      </div>
    </div>
  );
}