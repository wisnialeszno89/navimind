import Link from "next/link";
import { ArrowLeft, CheckCircle2, Download, KeyRound, LockKeyhole, Monitor, ShieldCheck, ShoppingCart } from "lucide-react";

export const metadata = {
  title: "Aktywacja licencji NaviMind – podgląd",
  description: "Zobacz planowany proces zakupu, wydania licencji i aktywacji NaviMind na komputerze.",
};

const stages = [
  { label: "1. Wybór pakietu", description: "Klient wybierze subskrypcję Personal albo Business.", icon: ShoppingCart },
  { label: "2. Potwierdzona płatność", description: "Dopiero serwerowe potwierdzenie operatora umożliwi wydanie licencji.", icon: CheckCircle2 },
  { label: "3. Wydanie kodu licencji", description: "Indywidualny kod zostanie przypisany do konta i konkretnej subskrypcji.", icon: KeyRound },
  { label: "4. Aktywacja na komputerze", description: "Klient zainstaluje aplikację, zaloguje się i aktywuje uprawnione stanowisko.", icon: Monitor },
];

export default function LicensePreviewPage() {
  return (
    <main className="relative z-10 min-h-screen px-4 py-14 text-slate-100 sm:px-6">
      <section className="mx-auto max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">NaviMind · licencja i komputer</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Jedna licencja. Kontrolowany dostęp.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">Tak będzie wyglądała aktywacja NaviMind po uruchomieniu sprzedaży. Obecnie to wyłącznie interaktywny podgląd ekranów — bez wydawania kodów i połączeń z urządzeniem.</p>
        <div className="mt-7 flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-300/5 p-4 text-sm leading-6 text-amber-100">
          <LockKeyhole className="shrink-0" size={21} />
          <span>Tryb demonstracyjny. Zakup, generowanie kodów, pobieranie instalatora i aktywacja komputera są wyłączone.</span>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {stages.map(({label,description,icon:Icon})=>(
            <article key={label} className="rounded-2xl border border-white/10 bg-slate-900/65 p-6">
              <Icon className="mb-4 text-blue-300" size={25}/>
              <h2 className="text-lg font-semibold">{label}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
            </article>
          ))}
        </div>
        <div className="mt-10 grid gap-6 rounded-3xl border border-white/10 bg-slate-900/80 p-6 lg:grid-cols-2 lg:p-9">
          <div>
            <p className="text-sm font-semibold text-blue-300">Podgląd panelu klienta</p>
            <h2 className="mt-3 text-2xl font-semibold">Moja licencja NaviMind</h2>
            <dl className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between gap-4 border-b border-white/10 pb-3"><dt className="text-slate-400">Status zakupu</dt><dd className="font-semibold text-amber-200">Niedostępny w wersji demo</dd></div>
              <div className="flex justify-between gap-4 border-b border-white/10 pb-3"><dt className="text-slate-400">Licencja</dt><dd className="font-semibold">Nieprzydzielona</dd></div>
              <div className="flex justify-between gap-4 border-b border-white/10 pb-3"><dt className="text-slate-400">Kod aktywacyjny</dt><dd className="font-mono text-slate-500">•••• •••• ••••</dd></div>
              <div className="flex justify-between gap-4 border-b border-white/10 pb-3"><dt className="text-slate-400">Połączone komputery</dt><dd className="font-semibold">0</dd></div>
            </dl>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/25 p-6">
            <div className="flex items-center gap-3 text-white"><Monitor className="text-blue-300"/><h3 className="font-semibold">Aktywuj komputer</h3></div>
            <label htmlFor="inactive-license" className="mt-6 block text-xs font-semibold uppercase tracking-wider text-slate-400">Indywidualny kod po zakupie</label>
            <input id="inactive-license" type="text" disabled aria-describedby="license-lock-notice" placeholder="Kod dostępny po zakupie licencji" className="mt-2 w-full cursor-not-allowed rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-500"/>
            <button type="button" disabled className="mt-4 w-full cursor-not-allowed rounded-xl bg-slate-600 px-4 py-3 font-semibold text-slate-300">Aktywacja niedostępna</button>
            <button type="button" disabled className="mt-3 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm text-slate-500"><Download size={17}/> Instalator – w przygotowaniu</button>
            <p id="license-lock-notice" className="mt-4 text-xs leading-6 text-slate-400">To tylko makieta formularza. Niczego nie wysyła do serwera, nie sprawdza kodu i nie łączy się z komputerem.</p>
          </div>
        </div>
        <div className="mt-8 flex items-start gap-3 rounded-xl border border-blue-400/20 bg-blue-400/5 p-5 text-sm leading-7 text-slate-300">
          <ShieldCheck className="mt-1 shrink-0 text-blue-300" size={21}/>
          <p>Docelowo kod licencji nie będzie hasłem dostępu zdalnego do komputera. Aplikacja lokalna musi osobno uzyskać zgodę użytkownika, potwierdzić uprawnienia i ograniczać wykonywane akcje. Sam zakup nie włącza zdalnego sterowania.</p>
        </div>
        <Link href="/plans" className="mt-10 inline-flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-3 font-semibold text-white hover:bg-blue-400"><ArrowLeft size={17}/> Powrót do pakietów</Link>
      </section>
    </main>
  );
}
