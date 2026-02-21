"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { AppRole, getUserRole, canAddAdmin } from "@/lib/roleGuard";

export default function AdminHeader({
  title = "Admin Panel",
  subtitle = "Yönetim & moderasyon",
}: {
  title?: string;
  subtitle?: string;
}) {
  const [role, setRole] = useState<AppRole>("user");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      const r = await getUserRole(u.uid);
      setRole(r);
    });

    return () => unsub();
  }, []);

  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        <p className="text-sm text-white/60">{subtitle}</p>
      </div>

      {canAddAdmin(role) && (
        <Link
          href="/admin/add-admin"
          className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 transition font-semibold text-white"
        >
          + Admin Ekle
        </Link>
      )}
    </div>
  );
}