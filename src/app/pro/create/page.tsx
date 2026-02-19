"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type City = { plate: string; name: string };
type Category = { id: string; name: string; emoji: string; group: string };

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

function normalizeTR(s: string) {
  return s
    .toLowerCase()
    .replaceAll("ı", "i")
    .replaceAll("İ", "i")
    .replaceAll("ş", "s")
    .replaceAll("Ş", "s")
    .replaceAll("ğ", "g")
    .replaceAll("Ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("Ü", "u")
    .replaceAll("ö", "o")
    .replaceAll("Ö", "o")
    .replaceAll("ç", "c")
    .replaceAll("Ç", "c");
}

export default function ProCreatePage() {
  const router = useRouter();

  const [fbUser, setFbUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  const [companyName, setCompanyName] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [profQuery, setProfQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");

  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const logoSrc = useMemo(() => "/logo.png", []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setFbUser(u);
      setChecking(false);
      if (!u) router.replace("/auth");
      else {
        // varsa eski kaydı çekip formu dolduralım (edit gibi)
        try {
          const ref = doc(db, "pros", u.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data() as any;
            setCompanyName(data?.companyName || "");
            setDisplayName(data?.displayName || u.displayName || "");
            setSelectedProfessions(Array.isArray(data?.professions) ? data.professions : []);
            const citiesArr = Array.isArray(data?.cities) ? data.cities : [];
            setSelectedCities(citiesArr.length ? citiesArr : (data?.city ? [data.city] : []));
          } else {
            setDisplayName(u.displayName || "");
          }
        } catch {
          setDisplayName(u.displayName || "");
        }
      }
    });
    return () => unsub();
  }, [router]);

  const filteredProfessions = useMemo(() => {
    const q = normalizeTR(profQuery.trim());
    if (!q) return CATEGORIES;
    return CATEGORIES.filter((c) => normalizeTR(c.name).includes(q) || normalizeTR(c.group).includes(q));
  }, [profQuery]);

  const filteredCities = useMemo(() => {
    const q = normalizeTR(cityQuery.trim());
    if (!q) return CITIES;
    return CITIES.filter((c) => c.plate.includes(q) || normalizeTR(c.name).includes(q));
  }, [cityQuery]);

  const toggleProfession = (name: string) => {
    setSelectedProfessions((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  const toggleCity = (name: string) => {
    setSelectedCities((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  const canSave =
    companyName.trim().length >= 2 &&
    displayName.trim().length >= 2 &&
    selectedProfessions.length >= 1 &&
    selectedCities.length >= 1;

  const save = async () => {
    setErr(null);
    setMsg(null);

    if (!fbUser) return;

    if (!canSave) {
      setErr("Kanka eksik var: şirket adı + usta adı + en az 1 meslek + en az 1 şehir seç.");
      return;
    }

    setSaving(true);
    try {
      const uid = fbUser.uid;

      // Discover şu an city == selectedCity.name ile arıyor.
      // O yüzden "city" alanını ana şehir gibi ilk seçilen şehir yapıyoruz.
      const primaryCity = selectedCities[0];

      // ✅ pros/{uid} yaz
      await setDoc(
        doc(db, "pros", uid),
        {
          ownerUid: uid,
          companyName: companyName.trim(),
          displayName: displayName.trim(),
          city: primaryCity,
          cities: selectedCities,
          professions: selectedProfessions,
          isVisible: true, // listede görünsün
          isSponsored: false, // şimdilik
          rating: 4.8,
          reviews: 0,
          photoURL: fbUser.photoURL || null,
          email: fbUser.email || null,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(), // setDoc overwrite olabilir; aşağıda merge true yaptık mı? burada overwrite değil, ama OK
        },
        { merge: true }
      );

      // ✅ users/{uid} meta update (pro hesabı oldu)
      await updateDoc(doc(db, "users", uid), {
        accountType: "pro",
        updatedAt: serverTimestamp(),
      });

      setMsg("Tamamdır ✅ Şirket profilin kaydedildi. Artık listede görüneceksin.");
      // Discover’a dön
      setTimeout(() => router.replace("/discover"), 600);
    } catch (e: any) {
      console.error(e);
      setErr("Kaydederken patladı kanka. Rules / index / internet kontrol et.");
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-sm text-zinc-300">Kontrol ediliyor…</div>
      </div>
    );
  }

  if (!fbUser) return null;

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
                <Image src={logoSrc} alt="Repairoo" width={40} height={40} className="h-full w-full object-cover" />
                <div className="pointer-events-none absolute -left-10 top-0 h-full w-10 rotate-12 bg-white/20 blur-md animate-shine" />
              </div>

              <div className="leading-tight">
                <div className="text-lg sm:text-xl font-extrabold tracking-tight">
                  <span className="silver-flow">Repairoo</span>
                </div>
                <div className="text-[11px] sm:text-xs text-zinc-300">Sanal Şirket Oluştur</div>
              </div>
            </Link>

            <Link
              href="/discover"
              className="rounded-2xl px-4 py-2 border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/50 text-sm font-semibold transition"
            >
              Geri
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-20 mx-auto max-w-6xl px-4 pb-24 pt-10">
        <div className="rounded-3xl border border-zinc-800/70 bg-zinc-900/25 backdrop-blur-xl p-6 sm:p-10 shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800/70 bg-zinc-950/40 px-3 py-1 text-xs text-zinc-200">
                <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_18px_rgba(249,115,22,0.75)]" />
                yayınlanmaya hazır profil
              </div>
              <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight">
                Şirket / Usta Profilini Oluştur
              </h1>
              <p className="mt-2 text-sm text-zinc-300">
                Şirket adını gir → meslekleri seç → şehirleri seç → listede görün.
              </p>
            </div>

            <button
              onClick={save}
              disabled={!canSave || saving}
              className="rounded-2xl px-5 py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:cursor-not-allowed text-black text-sm font-extrabold transition shadow-[0_18px_60px_rgba(249,115,22,0.26)]"
            >
              {saving ? "Kaydediliyor…" : "Profili Yayınla"}
            </button>
          </div>

          {err && (
            <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {err}
            </div>
          )}
          {msg && (
            <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              {msg}
            </div>
          )}

          {/* Form */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/40 p-5">
              <div className="text-sm font-extrabold">Temel Bilgiler</div>

              <label className="mt-4 block text-xs text-zinc-300">Şirket Adı</label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="örn: Furkan Elektrik Ltd."
                className="mt-2 w-full rounded-2xl border border-zinc-800/70 bg-zinc-950/50 px-4 py-3 text-sm outline-none placeholder:text-zinc-500 focus:border-orange-500/60"
              />

              <label className="mt-4 block text-xs text-zinc-300">Usta / Yetkili Adı</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="örn: Furkan D."
                className="mt-2 w-full rounded-2xl border border-zinc-800/70 bg-zinc-950/50 px-4 py-3 text-sm outline-none placeholder:text-zinc-500 focus:border-orange-500/60"
              />

              <div className="mt-4 rounded-2xl border border-zinc-800/70 bg-zinc-950/35 p-4 text-xs text-zinc-300">
                <div className="font-semibold text-zinc-100">Not</div>
                <div className="mt-1">
                  Profilin <span className="text-orange-300 font-semibold">yayınlanınca</span> Discover’da
                  seçilen meslek/şehir eşleşirse görünür.
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/40 p-5">
              <div className="text-sm font-extrabold">Seçimler</div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-zinc-300">Meslek Ara</div>
                  <input
                    value={profQuery}
                    onChange={(e) => setProfQuery(e.target.value)}
                    placeholder="örn: elektrik, kombi, fayans…"
                    className="mt-2 w-full rounded-2xl border border-zinc-800/70 bg-zinc-950/50 px-4 py-3 text-sm outline-none placeholder:text-zinc-500 focus:border-orange-500/60"
                  />
                </div>
                <div>
                  <div className="text-xs text-zinc-300">Şehir Ara</div>
                  <input
                    value={cityQuery}
                    onChange={(e) => setCityQuery(e.target.value)}
                    placeholder="plaka: 34 / isim: İstanbul"
                    className="mt-2 w-full rounded-2xl border border-zinc-800/70 bg-zinc-950/50 px-4 py-3 text-sm outline-none placeholder:text-zinc-500 focus:border-orange-500/60"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Professions */}
                <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/35 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-zinc-300">Meslekler</div>
                    <div className="text-[11px] text-zinc-400">{selectedProfessions.length} seçili</div>
                  </div>

                  <div className="mt-3 max-h-[260px] overflow-auto pr-1 grid gap-2">
                    {filteredProfessions.map((c) => {
                      const active = selectedProfessions.includes(c.name);
                      return (
                        <button
                          key={c.id}
                          onClick={() => toggleProfession(c.name)}
                          className={[
                            "text-left rounded-2xl border transition px-4 py-3",
                            active
                              ? "border-orange-400/40 bg-orange-500/10"
                              : "border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/55",
                          ].join(" ")}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold">
                                <span className="mr-2">{c.emoji}</span>
                                {c.name}
                              </div>
                              <div className="mt-0.5 text-[11px] text-zinc-400">{c.group}</div>
                            </div>
                            <span className="text-xs text-zinc-400">{active ? "✓" : "+"}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedProfessions.length > 0 && (
                    <button
                      onClick={() => setSelectedProfessions([])}
                      className="mt-3 w-full text-xs rounded-2xl border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/55 transition px-3 py-2"
                    >
                      Meslekleri temizle
                    </button>
                  )}
                </div>

                {/* Cities */}
                <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/35 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-zinc-300">Şehirler</div>
                    <div className="text-[11px] text-zinc-400">{selectedCities.length} seçili</div>
                  </div>

                  <div className="mt-3 max-h-[260px] overflow-auto pr-1 grid gap-2">
                    {filteredCities.map((c) => {
                      const active = selectedCities.includes(c.name);
                      return (
                        <button
                          key={c.plate}
                          onClick={() => toggleCity(c.name)}
                          className={[
                            "text-left rounded-2xl border transition px-4 py-3",
                            active
                              ? "border-orange-400/40 bg-orange-500/10"
                              : "border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/55",
                          ].join(" ")}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold">
                              <span className="font-extrabold text-orange-300">{c.plate}</span>{" "}
                              <span className="text-zinc-100">{c.name}</span>
                            </div>
                            <span className="text-xs text-zinc-400">{active ? "✓" : "+"}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedCities.length > 0 && (
                    <div className="mt-3 rounded-2xl border border-zinc-800/70 bg-zinc-950/40 p-3 text-[11px] text-zinc-300">
                      <div className="font-semibold text-zinc-100">Ana Şehir</div>
                      <div className="mt-1">
                        Discover şu an <span className="text-orange-300 font-semibold">ilk seçtiğin</span>{" "}
                        şehre göre listeliyor: <b>{selectedCities[0]}</b>
                      </div>
                    </div>
                  )}

                  {selectedCities.length > 0 && (
                    <button
                      onClick={() => setSelectedCities([])}
                      className="mt-3 w-full text-xs rounded-2xl border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-900/55 transition px-3 py-2"
                    >
                      Şehirleri temizle
                    </button>
                  )}
                </div>
              </div>

              {/* Preview */}
              <div className="mt-4 rounded-2xl border border-zinc-800/70 bg-zinc-950/35 p-4">
                <div className="text-xs text-zinc-300">Önizleme</div>
                <div className="mt-2 rounded-2xl border border-zinc-800/70 bg-zinc-950/40 p-4">
                  <div className="text-xs text-zinc-400">Şirket</div>
                  <div className="text-sm font-extrabold text-zinc-100">
                    {companyName.trim() || "—"}
                  </div>
                  <div className="mt-2 text-xs text-zinc-400">Usta</div>
                  <div className="text-sm font-extrabold text-zinc-100">
                    {displayName.trim() || "—"}
                  </div>
                  <div className="mt-2 text-xs text-zinc-400">Şehirler</div>
                  <div className="text-xs text-zinc-200">
                    {selectedCities.length ? selectedCities.join(", ") : "—"}
                  </div>
                  <div className="mt-2 text-xs text-zinc-400">Meslekler</div>
                  <div className="text-xs text-zinc-200">
                    {selectedProfessions.length ? selectedProfessions.join(", ") : "—"}
                  </div>
                </div>
              </div>

              <div className="mt-4 text-[11px] text-zinc-400">
                Kaydettikten sonra Discover’da “meslek + şehir” eşleşirse görünürsün.
              </div>
            </div>
          </div>
        </div>
      </main>

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