"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Step = "home" | "category" | "city" | "results";

type Category = {
  id: string;
  name: string;
  emoji: string;
  group: string;
};

type City = { plate: string; name: string };

type Pro = {
  id: string;
  companyName: string;
  displayName: string;
  city: string;
  categoryId: string;
  rating: number;
  reviews: number;
  sponsored?: boolean;
};

type AppRole = "admin" | "user";
type AccountType = "pro" | "user";
type AppUserMeta = {
  role: AppRole;
  accountType: AccountType;
  displayName?: string;
  proId?: string; // pro doc id
};

const CITIES: City[] = [
  { plate: "01", name: "Adana" },
  { plate: "02", name: "Adıyaman" },
  { plate: "03", name: "Afyonkarahisar" },
  { plate: "04", name: "Ağrı" },
  { plate: "05", name: "Amasya" },
  { plate: "06", name: "Ankara" },
  { plate: "07", name: "Antalya" },
  { plate: "08", name: "Artvin" },
  { plate: "09", name: "Aydın" },
  { plate: "10", name: "Balıkesir" },
  { plate: "11", name: "Bilecik" },
  { plate: "12", name: "Bingöl" },
  { plate: "13", name: "Bitlis" },
  { plate: "14", name: "Bolu" },
  { plate: "15", name: "Burdur" },
  { plate: "16", name: "Bursa" },
  { plate: "17", name: "Çanakkale" },
  { plate: "18", name: "Çankırı" },
  { plate: "19", name: "Çorum" },
  { plate: "20", name: "Denizli" },
  { plate: "21", name: "Diyarbakır" },
  { plate: "22", name: "Edirne" },
  { plate: "23", name: "Elazığ" },
  { plate: "24", name: "Erzincan" },
  { plate: "25", name: "Erzurum" },
  { plate: "26", name: "Eskişehir" },
  { plate: "27", name: "Gaziantep" },
  { plate: "28", name: "Giresun" },
  { plate: "29", name: "Gümüşhane" },
  { plate: "30", name: "Hakkari" },
  { plate: "31", name: "Hatay" },
  { plate: "32", name: "Isparta" },
  { plate: "33", name: "Mersin" },
  { plate: "34", name: "İstanbul" },
  { plate: "35", name: "İzmir" },
  { plate: "36", name: "Kars" },
  { plate: "37", name: "Kastamonu" },
  { plate: "38", name: "Kayseri" },
  { plate: "39", name: "Kırklareli" },
  { plate: "40", name: "Kırşehir" },
  { plate: "41", name: "Kocaeli" },
  { plate: "42", name: "Konya" },
  { plate: "43", name: "Kütahya" },
  { plate: "44", name: "Malatya" },
  { plate: "45", name: "Manisa" },
  { plate: "46", name: "Kahramanmaraş" },
  { plate: "47", name: "Mardin" },
  { plate: "48", name: "Muğla" },
  { plate: "49", name: "Muş" },
  { plate: "50", name: "Nevşehir" },
  { plate: "51", name: "Niğde" },
  { plate: "52", name: "Ordu" },
  { plate: "53", name: "Rize" },
  { plate: "54", name: "Sakarya" },
  { plate: "55", name: "Samsun" },
  { plate: "56", name: "Siirt" },
  { plate: "57", name: "Sinop" },
  { plate: "58", name: "Sivas" },
  { plate: "59", name: "Tekirdağ" },
  { plate: "60", name: "Tokat" },
  { plate: "61", name: "Trabzon" },
  { plate: "62", name: "Tunceli" },
  { plate: "63", name: "Şanlıurfa" },
  { plate: "64", name: "Uşak" },
  { plate: "65", name: "Van" },
  { plate: "66", name: "Yozgat" },
  { plate: "67", name: "Zonguldak" },
  { plate: "68", name: "Aksaray" },
  { plate: "69", name: "Bayburt" },
  { plate: "70", name: "Karaman" },
  { plate: "71", name: "Kırıkkale" },
  { plate: "72", name: "Batman" },
  { plate: "73", name: "Şırnak" },
  { plate: "74", name: "Bartın" },
  { plate: "75", name: "Ardahan" },
  { plate: "76", name: "Iğdır" },
  { plate: "77", name: "Yalova" },
  { plate: "78", name: "Karabük" },
  { plate: "79", name: "Kilis" },
  { plate: "80", name: "Osmaniye" },
  { plate: "81", name: "Düzce" },
];

const CATEGORIES: Category[] = [
  { id: "elektrik_ariza", name: "Elektrik Arıza", emoji: "⚡", group: "Elektrik & Arıza" },
  { id: "elektrik_tesisat", name: "Elektrik Tesisatı", emoji: "🧰", group: "Elektrik & Arıza" },
  { id: "sigorta_pano", name: "Sigorta / Pano", emoji: "🧯", group: "Elektrik & Arıza" },
  { id: "aydinlatma", name: "Aydınlatma Montaj", emoji: "💡", group: "Elektrik & Arıza" },
  { id: "priz_anahtar", name: "Priz / Anahtar", emoji: "🔌", group: "Elektrik & Arıza" },
  { id: "kacak_akim", name: "Kaçak Akım / Topraklama", emoji: "🛡️", group: "Elektrik & Arıza" },
  { id: "zil_interkom", name: "Zil / Interkom", emoji: "🔔", group: "Elektrik & Arıza" },

  { id: "su_tesisat", name: "Su Tesisatı", emoji: "🚰", group: "Su Tesisat & Arıza" },
  { id: "su_kacak", name: "Su Kaçağı Tespiti", emoji: "🕵️", group: "Su Tesisat & Arıza" },
  { id: "gider_tikanikligi", name: "Gider / Tıkanıklık Açma", emoji: "🌀", group: "Su Tesisat & Arıza" },
  { id: "musluk_batarya", name: "Musluk / Batarya Değişim", emoji: "🔧", group: "Su Tesisat & Arıza" },
  { id: "rezervuar", name: "Rezervuar / Klozet", emoji: "🚽", group: "Su Tesisat & Arıza" },
  { id: "pis_su", name: "Pis Su / Kanal Hattı", emoji: "🧱", group: "Su Tesisat & Arıza" },

  { id: "dogalgaz", name: "Doğalgaz Tesisatı", emoji: "🔥", group: "Doğalgaz • Kombi • Isıtma" },
  { id: "kombi_servis", name: "Kombi Servisi", emoji: "🛠️", group: "Doğalgaz • Kombi • Isıtma" },
  { id: "petek_temizleme", name: "Petek Temizleme", emoji: "♨️", group: "Doğalgaz • Kombi • Isıtma" },
  { id: "petek_montaj", name: "Petek / Radyatör Montaj", emoji: "🧲", group: "Doğalgaz • Kombi • Isıtma" },
  { id: "yerden_isitma", name: "Yerden Isıtma", emoji: "🧯", group: "Doğalgaz • Kombi • Isıtma" },
  { id: "kazan_daire", name: "Kazan Dairesi İşleri", emoji: "🏭", group: "Doğalgaz • Kombi • Isıtma" },

  { id: "klima_montaj", name: "Klima Montaj", emoji: "❄️", group: "Klima & Havalandırma" },
  { id: "klima_ariza", name: "Klima Arıza", emoji: "🧊", group: "Klima & Havalandırma" },
  { id: "havalandirma", name: "Havalandırma", emoji: "🌬️", group: "Klima & Havalandırma" },

  { id: "boya_badana", name: "Boya / Badana", emoji: "🎨", group: "Duvar • Boya • Alçı" },
  { id: "siva", name: "Sıva", emoji: "🧱", group: "Duvar • Boya • Alçı" },
  { id: "alci", name: "Alçı", emoji: "🪣", group: "Duvar • Boya • Alçı" },
  { id: "alcipan", name: "Alçıpan", emoji: "📐", group: "Duvar • Boya • Alçı" },
  { id: "asma_tavan", name: "Asma Tavan", emoji: "🏗️", group: "Duvar • Boya • Alçı" },
  { id: "duvar_kagidi", name: "Duvar Kağıdı", emoji: "🧻", group: "Duvar • Boya • Alçı" },
  { id: "catlak_tamir", name: "Duvar Çatlak Tamiri", emoji: "🩹", group: "Duvar • Boya • Alçı" },

  { id: "fayans", name: "Fayans", emoji: "🧩", group: "Zemin • Fayans • Şap" },
  { id: "seramik", name: "Seramik", emoji: "🧱", group: "Zemin • Fayans • Şap" },
  { id: "granit", name: "Granit / Porselen", emoji: "🪨", group: "Zemin • Fayans • Şap" },
  { id: "sap", name: "Şap", emoji: "🧱", group: "Zemin • Fayans • Şap" },
  { id: "parke", name: "Parke / Laminant", emoji: "🪵", group: "Zemin • Fayans • Şap" },
  { id: "zemin_kaplama", name: "Zemin Kaplama", emoji: "🧱", group: "Zemin • Fayans • Şap" },

  { id: "pimapen", name: "Pimapen", emoji: "🪟", group: "Kapı • Pencere • Cam" },
  { id: "camci", name: "Camcı", emoji: "🪟", group: "Kapı • Pencere • Cam" },
  { id: "kapi_montaj", name: "Kapı Montaj", emoji: "🚪", group: "Kapı • Pencere • Cam" },
  { id: "celik_kapi", name: "Çelik Kapı", emoji: "🛡️", group: "Kapı • Pencere • Cam" },
  { id: "sineklik", name: "Sineklik", emoji: "🦟", group: "Kapı • Pencere • Cam" },
  { id: "panjur", name: "Panjur", emoji: "🧱", group: "Kapı • Pencere • Cam" },

  { id: "marangoz", name: "Marangoz", emoji: "🪚", group: "Mobilya • Marangoz" },
  { id: "mobilya_montaj", name: "Mobilya Montaj", emoji: "🧩", group: "Mobilya • Marangoz" },
  { id: "mutfak_dolap", name: "Mutfak Dolabı", emoji: "🗄️", group: "Mobilya • Marangoz" },
  { id: "banyo_dolap", name: "Banyo Dolabı", emoji: "🚿", group: "Mobilya • Marangoz" },

  { id: "cati", name: "Çatı Ustası", emoji: "🏠", group: "Çatı • İzolasyon • Dış Cephe" },
  { id: "izolasyon", name: "Isı / Su İzolasyonu", emoji: "🧊", group: "Çatı • İzolasyon • Dış Cephe" },
  { id: "mantolama", name: "Mantolama", emoji: "🧥", group: "Çatı • İzolasyon • Dış Cephe" },
  { id: "oluk", name: "Oluk / Yağmur İnişi", emoji: "🌧️", group: "Çatı • İzolasyon • Dış Cephe" },
  { id: "dis_cephe", name: "Dış Cephe Kaplama", emoji: "🏗️", group: "Çatı • İzolasyon • Dış Cephe" },

  { id: "kaynak", name: "Kaynak", emoji: "⚙️", group: "Demir • Kaynak" },
  { id: "demir_dograma", name: "Demir Doğrama", emoji: "🧲", group: "Demir • Kaynak" },
  { id: "korkuluk", name: "Korkuluk / Ferforje", emoji: "🧲", group: "Demir • Kaynak" },
  { id: "kapi_pencere_korkuluk", name: "Balkon / Merdiven Korkuluk", emoji: "🪜", group: "Demir • Kaynak" },

  { id: "kalip", name: "Kalıpçı", emoji: "🧱", group: "İnşaat Ağır İşler" },
  { id: "demirci", name: "İnşaat Demircisi", emoji: "🦾", group: "İnşaat Ağır İşler" },
  { id: "duvar_orucu", name: "Duvar Örme", emoji: "🧱", group: "İnşaat Ağır İşler" },
  { id: "beton", name: "Beton / Şantiye İşleri", emoji: "🏗️", group: "İnşaat Ağır İşler" },
  { id: "karot", name: "Karot / Delme", emoji: "🕳️", group: "İnşaat Ağır İşler" },

  { id: "acil_elektrik", name: "Acil Elektrikçi (7/24)", emoji: "🚨", group: "Acil Arıza (7/24)" },
  { id: "acil_tesisat", name: "Acil Tesisatçı (7/24)", emoji: "🚨", group: "Acil Arıza (7/24)" },
  { id: "acil_kombi", name: "Acil Kombi (7/24)", emoji: "🚨", group: "Acil Arıza (7/24)" },

  { id: "insaat_sonrasi_temizlik", name: "İnşaat Sonrası Temizlik", emoji: "🧽", group: "İnşaat Sonrası Temizlik" },
  { id: "moloz_temizleme", name: "Moloz Temizleme", emoji: "🪣", group: "İnşaat Sonrası Temizlik" },
  { id: "moloz_tasima", name: "Moloz Taşıma", emoji: "🚛", group: "İnşaat Sonrası Temizlik" },
  { id: "kaba_temizlik", name: "Kaba İnşaat Temizliği", emoji: "🧹", group: "İnşaat Sonrası Temizlik" },
  { id: "cam_temizlik", name: "Cam & Cephe Temizliği", emoji: "🪟", group: "İnşaat Sonrası Temizlik" },
];

function trLower(s: string) {
  return (s || "").toLocaleLowerCase("tr-TR");
}

export default function DiscoverPage() {
  const router = useRouter();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fbUser, setFbUser] = useState<User | null>(null);
  const [meta, setMeta] = useState<AppUserMeta | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [step, setStep] = useState<Step>("home");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("Tümü");

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const [cityQuery, setCityQuery] = useState("");

  const [loadingPros, setLoadingPros] = useState(false);
  const [pros, setPros] = useState<Pro[]>([]);
  const [prosError, setProsError] = useState<string | null>(null);

  // ✅ Discover kendi kendine pro'yu bulsun diye:
  const [myProId, setMyProId] = useState<string | null>(null);
  const logoSrc = useMemo(() => "/logo.png", []);

  // ✅ pro bulucu: ownerUid == uid
  const resolveMyPro = async (uid: string) => {
    try {
      const qy = query(collection(db, "pros"), where("ownerUid", "==", uid), limit(1));
      const snap = await getDocs(qy);
      if (snap.empty) return null;
      return snap.docs[0].id;
    } catch (e) {
      console.error("resolveMyPro error:", e);
      return null;
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setFbUser(u);

      if (!u) {
        setMeta(null);
        setMyProId(null);
        setCheckingAuth(false);
        router.replace("/auth");
        return;
      }

      try {
        // 1) users meta oku
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        const data = snap.exists() ? (snap.data() as any) : null;

        const role: AppRole = data?.role === "admin" ? "admin" : "user";
        const accountType: AccountType = data?.accountType === "pro" ? "pro" : "user";
        const proIdFromUser = typeof data?.proId === "string" ? data.proId : undefined;

        // 2) Eğer proId yoksa ya da accountType pro değilse -> pros'tan ownerUid ile bul
        const proIdAuto = proIdFromUser || (await resolveMyPro(u.uid));

        // 3) State'leri bas
        setMyProId(proIdAuto || null);

        const finalAccountType: AccountType = proIdAuto ? "pro" : accountType;

        setMeta({
          role,
          accountType: finalAccountType,
          displayName: data?.displayName || u.displayName || "Kullanıcı",
          proId: proIdAuto || undefined,
        });

        // 4) İstersen kalıcı yazalım (merge) -> bir kere düzelsin, sonra hep gelsin
        //    (pro bulunduysa ve users'ta yoksa)
        if (proIdAuto && (!data?.proId || data?.accountType !== "pro")) {
          await setDoc(
            doc(db, "users", u.uid),
            { accountType: "pro", proId: proIdAuto },
            { merge: true }
          );
        }
      } catch (e) {
        console.error("meta load error:", e);
        // en azından pro'yu yine dene
        const auto = await resolveMyPro(u.uid);
        setMyProId(auto || null);
        setMeta({
          role: "user",
          accountType: auto ? "pro" : "user",
          displayName: u.displayName || "Kullanıcı",
          proId: auto || undefined,
        });
      } finally {
        setCheckingAuth(false);
      }
    });

    return () => unsub();
  }, [router]);

  const isAuthed = !!fbUser;
  const isAdmin = meta?.role === "admin";
  const isPro = meta?.accountType === "pro";
  const hasProProfile = !!(myProId || meta?.proId);

  const allGroups = useMemo(() => {
    const set = new Set<string>();
    CATEGORIES.forEach((c) => set.add(c.group));
    return ["Tümü", ...Array.from(set)];
  }, []);

  const groupedCategories = useMemo(() => {
    const q = trLower(categoryQuery.trim());

    const filtered = CATEGORIES.filter((c) => {
      const matchesQuery = q ? trLower(c.name).includes(q) : true;
      const matchesGroup = groupFilter === "Tümü" ? true : c.group === groupFilter;
      return matchesQuery && matchesGroup;
    });

    const groups = new Map<string, Category[]>();
    for (const c of filtered) {
      if (!groups.has(c.group)) groups.set(c.group, []);
      groups.get(c.group)!.push(c);
    }
    return Array.from(groups.entries());
  }, [categoryQuery, groupFilter]);

  const filteredCities = useMemo(() => {
    const q = trLower(cityQuery.trim());
    if (!q) return CITIES;

    return CITIES.filter((c) => {
      const byPlate = c.plate.includes(q);
      const byName = trLower(c.name).includes(q);
      return byPlate || byName;
    });
  }, [cityQuery]);

  // ✅ Firestore limit: tek query’de 2x array-contains olmaz.
  // Şehirden çekeriz, mesleği JS’te filtreleriz.
  const fetchPros = async (category: Category, city: City) => {
    setLoadingPros(true);
    setProsError(null);
    setPros([]);

    try {
      const qy = query(
        collection(db, "pros"),
        where("isVisible", "==", true),
        where("cities", "array-contains", city.name)
      );

      const snap = await getDocs(qy);

      const rawList: Pro[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          companyName: data?.companyName || "Şirket",
          displayName: data?.displayName || "Usta",
          city: data?.city || city.name,
          categoryId: category.id,
          rating: typeof data?.rating === "number" ? data.rating : 4.8,
          reviews: typeof data?.reviews === "number" ? data.reviews : 0,
          sponsored: !!data?.isSponsored,
        };
      });

      const filtered = snap.docs
        .map((d, idx) => {
          const data = d.data() as any;
          const professions: string[] = Array.isArray(data?.professions) ? data.professions : [];
          const ok = professions.includes(category.name);
          return ok ? rawList[idx] : null;
        })
        .filter(Boolean) as Pro[];

      const sponsored = filtered.filter((x) => x.sponsored);
      const normal = filtered.filter((x) => !x.sponsored);
      setPros([...sponsored, ...normal]);
    } catch (e: any) {
      console.error("fetchPros error:", e);
      setProsError(e?.message ? `Hata: ${e.message}` : "Ustaları çekerken hata oldu. Tekrar dene.");
    } finally {
      setLoadingPros(false);
    }
  };

  const resetFlow = () => {
    setStep("home");
    setSelectedCategory(null);
    setSelectedCity(null);
    setCategoryQuery("");
    setGroupFilter("Tümü");
    setCityQuery("");
    setPros([]);
    setProsError(null);
    setLoadingPros(false);
  };

  const logout = async () => {
    setDrawerOpen(false);
    await signOut(auth);
    router.push("/auth");
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-sm text-zinc-300">Kontrol ediliyor…</div>
      </div>
    );
  }

  if (!isAuthed) return null;

  const effectiveProId = (meta?.proId || myProId) ?? undefined;

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
            <div className="flex items-center gap-3">
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

              <Link href="/discover" className="flex items-center gap-3">
                <div className="relative h-10 w-10 rounded-2xl border border-zinc-700/60 bg-zinc-950/50 shadow overflow-hidden">
                  <Image src={logoSrc} alt="Repairoo" width={40} height={40} className="h-full w-full object-cover" priority />
                  <div className="pointer-events-none absolute -left-10 top-0 h-full w-10 rotate-12 bg-white/20 blur-md animate-shine" />
                </div>

                <div className="leading-tight">
                  <div className="text-lg sm:text-xl font-extrabold tracking-tight">
                    <span className="silver-flow">Repairoo</span>
                  </div>
                  <div className="text-[11px] sm:text-xs text-zinc-300">Usta Bul</div>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={logout}
                className="inline-flex items-center justify-center rounded-2xl px-4 py-2 border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 text-sm font-semibold transition"
              >
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-20 mx-auto max-w-6xl px-4 pb-24 pt-10">
        <div className="rounded-3xl border border-zinc-800/70 bg-zinc-900/25 backdrop-blur-xl p-6 sm:p-10 shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800/70 bg-zinc-950/40 px-3 py-1 text-xs text-zinc-200">
                <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_18px_rgba(249,115,22,0.75)]" />
                premium akış
              </div>
              <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight">
                {step === "home" && "Hazır mısın? Usta bulalım."}
                {step === "category" && "Hangi ustayı arıyorsun?"}
                {step === "city" && "Hangi şehir?"}
                {step === "results" && "Sonuçlar"}
              </h1>

              <p className="mt-2 text-sm text-zinc-300">Meslek seç → şehir seç → ustaları görüntüle.</p>
            </div>

            <div className="flex gap-2">
              {step !== "home" && (
                <button
                  onClick={resetFlow}
                  className="rounded-2xl px-4 py-2 border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 text-sm font-semibold transition"
                >
                  Baştan
                </button>
              )}
              <Link
                href="/vip"
                className="rounded-2xl px-4 py-2 border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 text-sm font-semibold transition"
              >
                VIP
              </Link>
            </div>
          </div>

          {/* HOME */}
          {step === "home" && (
            <div className="mt-7">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/40 p-6">
                  <div className="text-sm font-semibold">1) Meslek seç</div>
                  <div className="mt-1 text-xs text-zinc-300">Aradığın ustayı seçerek başla.</div>
                  <button
                    onClick={() => setStep("category")}
                    className="mt-4 w-full rounded-2xl px-4 py-3 bg-orange-500 hover:bg-orange-400 text-black text-sm font-extrabold transition shadow-[0_18px_60px_rgba(249,115,22,0.26)]"
                  >
                    Meslek Seç
                  </button>

                  <div className="mt-4 text-xs text-zinc-400">İpucu: Meslek ekranında arama + kategori filtresi var.</div>
                </div>

                <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/40 p-6">
                  <div className="text-sm font-semibold">2) Şehir seç</div>
                  <div className="mt-1 text-xs text-zinc-300">Şehrini seç, uygun ustalar listelensin.</div>

                  <button
                    onClick={() => {
                      if (!selectedCategory) setStep("category");
                      else setStep("city");
                    }}
                    className="mt-4 w-full rounded-2xl px-4 py-3 border border-zinc-800/70 bg-zinc-900/45 hover:bg-zinc-900/60 text-sm font-semibold transition"
                  >
                    {selectedCategory ? "Şehir Seç" : "Önce Meslek Seç"}
                  </button>

                  {selectedCategory && (
                    <div className="mt-4 rounded-2xl border border-zinc-800/70 bg-zinc-950/35 p-4">
                      <div className="text-xs text-zinc-300">Seçilen meslek</div>
                      <div className="mt-1 text-sm font-semibold">
                        {selectedCategory.emoji} {selectedCategory.name}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/35 p-6">
                  <div className="text-sm font-extrabold text-zinc-100">Nasıl Kullanılır?</div>
                  <div className="mt-4 space-y-3 text-xs text-zinc-300">
                    <div>
                      <span className="text-orange-400 font-semibold">1.</span> Mesleği seç.
                    </div>
                    <div>
                      <span className="text-orange-400 font-semibold">2.</span> Şehrini belirle.
                    </div>
                    <div>
                      <span className="text-orange-400 font-semibold">3.</span> Ustayı incele, iletişime geç.
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/35 p-6">
                  <div className="text-sm font-extrabold text-zinc-100">Neden Repairoo?</div>
                  <div className="mt-4 space-y-3 text-xs text-zinc-300">
                    <div>• İnşaat ve arıza odaklı ustalar</div>
                    <div>• Değerlendirme ve yorumlarla güven</div>
                    <div>• Sponsorlu ustalar üstte listelenir</div>
                    <div>• Premium karanlık arayüz</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/35 p-6">
                  <div className="text-sm font-extrabold text-zinc-100">Destek & Güven</div>
                  <div className="mt-4 space-y-3 text-xs text-zinc-300">
                    <div>• Canlı destek butonu sağ altta</div>
                    <div>• Güvenli giriş sistemi</div>
                    <div>• Şeffaf iletişim bilgileri</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-zinc-800/60 pt-6 text-xs text-zinc-400 space-y-2">
                <div className="font-semibold text-zinc-200">Repairoo</div>
                <div>İnşaat ve arıza işleriniz için hızlı usta bulma platformu.</div>

                <div className="mt-3 space-y-1">
                  <div>Email: destek@repairoo.com</div>
                  <div>Telefon: +90 555 000 00 00</div>
                  <div>Adres: İstanbul, Türkiye</div>
                </div>

                <div className="pt-3 text-[11px] text-zinc-500">© {new Date().getFullYear()} Repairoo. Tüm hakları saklıdır.</div>
              </div>
            </div>
          )}

          {/* CATEGORY */}
          {step === "category" && (
            <div className="mt-7">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="lg:col-span-2">
                  <input
                    value={categoryQuery}
                    onChange={(e) => setCategoryQuery(e.target.value)}
                    placeholder="Meslek ara… (örn: elektrik arıza, fayans, kombi)"
                    className="w-full rounded-2xl border border-zinc-800/70 bg-zinc-950/50 px-4 py-3 text-sm outline-none placeholder:text-zinc-500 focus:border-orange-500/60"
                  />
                </div>

                <div>
                  <select
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value)}
                    className="w-full rounded-2xl border border-zinc-800/70 bg-zinc-950/50 px-4 py-3 text-sm outline-none focus:border-orange-500/60"
                  >
                    {allGroups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-zinc-800/70 bg-zinc-950/35 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-zinc-300">
                    Filtre: <span className="text-zinc-100 font-semibold">{groupFilter}</span>
                    {categoryQuery.trim() ? (
                      <>
                        {" "}
                        • Arama: <span className="text-zinc-100 font-semibold">"{categoryQuery.trim()}"</span>
                      </>
                    ) : null}
                  </div>

                  <button
                    onClick={() => {
                      setCategoryQuery("");
                      setGroupFilter("Tümü");
                    }}
                    className="text-xs rounded-full border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/55 transition px-3 py-1"
                  >
                    Filtreleri temizle
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-4">
                {groupedCategories.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/40 p-5 text-sm text-zinc-300">
                    Aradığın kriterlerde meslek bulunamadı.
                  </div>
                ) : (
                  groupedCategories.map(([group, items]) => (
                    <div key={group} className="rounded-2xl border border-zinc-800/70 bg-zinc-950/35 p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-extrabold text-zinc-100">{group}</div>
                        <div className="text-xs text-zinc-400">{items.length} meslek</div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {items.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setSelectedCategory(c);
                              setStep("city");
                            }}
                            className="text-left rounded-2xl border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/55 transition px-4 py-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-semibold">
                                <span className="mr-2">{c.emoji}</span>
                                {c.name}
                              </div>
                              <span className="text-xs text-zinc-400">→</span>
                            </div>
                            <div className="mt-1 text-[11px] text-zinc-400">Şehir seçimine geç</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* CITY */}
          {step === "city" && (
            <div className="mt-7">
              <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/35 p-4">
                <div className="text-xs text-zinc-300">
                  Seçilen meslek:{" "}
                  <span className="text-zinc-100 font-semibold">
                    {selectedCategory ? `${selectedCategory.emoji} ${selectedCategory.name}` : "—"}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <input
                  value={cityQuery}
                  onChange={(e) => setCityQuery(e.target.value)}
                  placeholder="Şehir ara… (plaka: 34 / isim: İstanbul)"
                  className="w-full rounded-2xl border border-zinc-800/70 bg-zinc-950/50 px-4 py-3 text-sm outline-none placeholder:text-zinc-500 focus:border-orange-500/60"
                />
                <div className="mt-2 text-[11px] text-zinc-400">Plaka veya şehir ismi yazabilirsin.</div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[420px] overflow-auto pr-1">
                {filteredCities.length === 0 ? (
                  <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-zinc-800/70 bg-zinc-950/40 p-5 text-sm text-zinc-300">
                    Bu aramada şehir bulunamadı.
                  </div>
                ) : (
                  filteredCities.map((city) => (
                    <button
                      key={city.plate}
                      onClick={async () => {
                        setSelectedCity(city);
                        setStep("results");
                        if (selectedCategory) await fetchPros(selectedCategory, city);
                      }}
                      className="text-left rounded-2xl border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/55 transition px-4 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">
                          <span className="font-extrabold text-orange-300">{city.plate}</span>{" "}
                          <span className="text-zinc-100">{city.name}</span>
                        </div>
                        <span className="text-xs text-zinc-400">→</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* RESULTS */}
          {step === "results" && (
            <div className="mt-7">
              <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/35 p-4">
                <div className="text-sm font-semibold">
                  {selectedCategory?.emoji} {selectedCategory?.name} •{" "}
                  <span className="text-orange-300 font-extrabold">{selectedCity?.plate}</span> {selectedCity?.name}
                </div>
                <div className="mt-1 text-xs text-zinc-300">Sponsorlu ustalar üstte gösterilir.</div>
              </div>

              {prosError && (
                <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {prosError}
                </div>
              )}

              <div className="mt-4 grid gap-3">
                {loadingPros ? (
                  <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/40 p-5 text-sm text-zinc-300">
                    Ustalar yükleniyor…
                  </div>
                ) : pros.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/40 p-5 text-sm text-zinc-300">
                    Bu kriterlerde usta bulunamadı. İlk ustayı eklemek için{" "}
                    <Link href="/pro/create" className="text-orange-300 font-extrabold underline">
                      Sanal Şirket Oluştur
                    </Link>{" "}
                    bölümüne git.
                  </div>
                ) : (
                  pros.map((p) => (
                    <Link
                      key={p.id}
                      href={`/pro/${p.id}`}
                      className="rounded-2xl border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/55 transition p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-extrabold text-zinc-100">{p.companyName}</div>
                            {p.sponsored && (
                              <span className="text-[11px] rounded-full border border-orange-300/20 bg-orange-500/15 px-2 py-0.5 text-orange-200">
                                Sponsorlu
                              </span>
                            )}
                          </div>

                          <div className="mt-1 text-xs text-zinc-300">
                            {p.displayName} • {p.city}
                          </div>

                          <div className="mt-2 text-xs text-zinc-400">
                            ⭐ {p.rating.toFixed(1)} • {p.reviews} değerlendirme
                          </div>
                        </div>
                        <span className="text-xs text-zinc-400">→</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={() => setStep("city")}
                  className="rounded-2xl px-4 py-2 border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 text-sm font-semibold transition"
                >
                  Şehir Değiştir
                </button>
                <button
                  onClick={() => setStep("category")}
                  className="rounded-2xl px-4 py-2 border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 text-sm font-semibold transition"
                >
                  Meslek Değiştir
                </button>
                <button
                  onClick={async () => {
                    if (selectedCategory && selectedCity) await fetchPros(selectedCategory, selectedCity);
                  }}
                  className="rounded-2xl px-4 py-2 border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 text-sm font-semibold transition"
                >
                  Yenile
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Live support */}
      <Link href="/support" className="fixed bottom-5 right-5 z-40 group" aria-label="Canlı Destek">
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl blur-xl opacity-35 bg-orange-500 group-hover:opacity-55 transition" />
          <div className="relative h-14 w-14 rounded-2xl bg-orange-500 hover:bg-orange-400 text-black shadow-[0_18px_70px_rgba(249,115,22,0.35)] border border-orange-200/30 flex items-center justify-center transition">
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-3 top-3 bottom-3 w-[320px] max-w-[88vw] rounded-3xl border border-zinc-800/70 bg-zinc-950/70 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.65)] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 rounded-2xl border border-zinc-700/60 bg-zinc-950/50 shadow overflow-hidden">
                  <Image src={logoSrc} alt="Repairoo" width={40} height={40} className="h-full w-full object-cover" />
                </div>
                <div className="leading-tight">
                  <div className="text-base font-extrabold">
                    <span className="silver-flow">Repairoo</span>
                  </div>
                  <div className="text-[11px] text-zinc-300">{meta?.displayName || "Menü"}</div>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="h-10 w-10 rounded-2xl border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 transition flex items-center justify-center"
                aria-label="Kapat"
              >
                ✕
              </button>
            </div>

            <nav className="mt-4 grid gap-2">
              <DrawerItem href="/profile" title="Kullanıcı Profili" desc="Profilini görüntüle" onClick={() => setDrawerOpen(false)} />
              <DrawerItem href="/messages" title="Mesajlar" desc="Ustalardan gelen mesajlara ulaş" onClick={() => setDrawerOpen(false)} />
              <DrawerItem href="/vip" title="VIP Planları" desc="Herkese açık" onClick={() => setDrawerOpen(false)} />

              {/* ✅ Eğer pro profili VARSA: Sanal Şirket Oluştur gizle, Şirket Profilim göster */}
              {hasProProfile && effectiveProId ? (
                <DrawerItem
                  href={`/pro/${effectiveProId}`}
                  title="Şirket Profilim"
                  desc="Şirket/usta profilini görüntüle"
                  onClick={() => setDrawerOpen(false)}
                />
              ) : (
                <DrawerItem
                  href="/pro/create"
                  title="Sanal Şirket Oluştur"
                  desc="Şirket adı gir, meslek/şehir seç, profili yayınla"
                  onClick={() => setDrawerOpen(false)}
                />
              )}

              {isPro && (
                <DrawerItem
                  href="/highlight"
                  title="Öne Çıkartma"
                  desc="Sadece ustalar"
                  badge="Usta"
                  onClick={() => setDrawerOpen(false)}
                />
              )}

              {isAdmin && (
                <DrawerItem
                  href="/admin"
                  title="Admin"
                  desc="Sadece admin hesaplar"
                  badge="Admin"
                  onClick={() => setDrawerOpen(false)}
                />
              )}

              <DrawerItem href="/settings" title="Ayarlar" desc="Profil ayarları + görünüm" onClick={() => setDrawerOpen(false)} />
              <DrawerItem href="/support" title="Canlı Destek" desc="Hızlı yardım" onClick={() => setDrawerOpen(false)} />

              <div className="h-px bg-zinc-800/70 my-2" />

              <button
                onClick={async () => {
                  setDrawerOpen(false);
                  await signOut(auth);
                  router.push("/auth");
                }}
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
            </nav>
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