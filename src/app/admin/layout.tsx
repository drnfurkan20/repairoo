"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { canOpenAdminPanel, getUserRoleForUser } from "@/lib/roleGuard";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          setLoading(false);
          router.replace("/auth");
          return;
        }

        const role = await getUserRoleForUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        });

        if (!canOpenAdminPanel(role)) {
          setLoading(false);
          router.replace("/discover");
          return;
        }

        setLoading(false);
      } catch (e) {
        console.error("AdminLayout guard error:", e);
        setLoading(false);
        router.replace("/discover");
      }
    });

    return () => unsub();
  }, [router]);

  if (loading) return <div className="p-10 text-white">Yükleniyor...</div>;

  return <>{children}</>;
}