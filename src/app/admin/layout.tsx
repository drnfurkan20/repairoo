"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserRole, canOpenAdminPanel } from "@/lib/roleGuard";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/auth");
        return;
      }

      const role = await getUserRole(user.uid);

      if (!canOpenAdminPanel(role)) {
        router.push("/");
        return;
      }

      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  if (loading) return <div className="p-10 text-white">Yükleniyor...</div>;

  return <>{children}</>;
}