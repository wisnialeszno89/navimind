import Link from "next/link";
import { ArrowRight, Bot, CheckCircle2, ChevronRight, Command, FileSpreadsheet, Layers3, LockKeyhole, Monitor, MousePointer2, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";
import { isPrivateWorkspace } from "./lib/workspace";

export const metadata = {
  title: "NaviMind – inteligencja, która wykonuje zadania",
  description: "Poznaj NaviMind: agent AI do codziennych zadań na komputerze. Sprawdź aplikację i projektowane pakiety Personal oraz Business.",
};

const skills = [
  { icon: Monitor, title: "Praca na komputerze", detail: "Lokalny wykonawca i obsługa aplikacji w chronionych testach." },
  { icon: FileSpreadsheet, title: "Dokumenty i oferty", detail: "Zadania biurowe, zestawienia i wieloetapowe procesy." },
  { icon: MousePointer2, title: "Przeglądarka", detail: "Rozpoznawanie widoku i wykonywanie kolejnych kroków." },
];

export default function HomePage() {
  const agentHref = isPrivateWorkspace() ? "/workspace" : "/agent";
  return (
    <main className="nm-page">
      <section className="nm-shell grid items-center gap-12 pb-24 pt-20 lg:grid-cols-[1fr_.91fr] lg:pb-32 lg:pt-28">
        <div>
          <div className="nm-kicker"><Sparkles size={14}/> Przyszłość pracy zaczyna się tutaj</div>
          <div className="nm-gold-line mt-9"/>
          <h1 className="nm-display mt-6">Nie tylko myśli.<br/><span style={{color:"#6753a6"}}>Wykonuje.</span></h1>
          <p className="nm-lead mt-7 max-w-xl">Poznaj agenta AI, który pomaga obsługiwać aplikacje, przygotowywać dokumenty i przejmować powtarzalne czynności. Więcej czasu na decyzje, mniej na klikanie.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link className="nm-btn-primary" href={agentHref}><Bot size={19}/> Otwórz agenta <ArrowRight size={17}/></Link>
            <Link className="nm-btn-secondary" href="/plans">Wybierz swój pakiet <ChevronRight size={17}/></Link>
          </div>
          <p className="mt-5 flex max-w-lg items-start gap-2 text-xs leading-6 text-[#736e7d]"><LockKeyhole className="mt-1 shrink-0 text-[#a18cbb]" size={15}/> Trwa etap testów. Sprzedaż licencji i nowe połączenia komputerów nie są jeszcze dostępne.</p>
          <div className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-[#e4e1e9] pt-6 text-sm text-[#686475]">
            <span className="flex items-center gap-2"><CheckCircle2 size={17} color="#6753a6"/> Jasny, prosty interfejs</span>
            <span className="flex items-center gap-2"><ShieldCheck size={17} color="#6753a6"/> Kontrolowane uprawnienia</span>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -left-5 -top-6 h-36 w-36 rounded-full bg-[#e7ddf8] opacity-60 blur-3xl"/>
          <div className="nm-card relative overflow-hidden p-5 shadow-[0_30px_90px_rgba(42,32,89,.12)] sm:p-7">
            <div className="flex items-center justify-between border-b border-[#ebe9f0] pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#252331] text-white"><Command size={23}/></div>
                <div><div className="font-bold tracking-tight">NaviMind Workspace</div><p className="text-xs text-[#777184]">Inteligentne centrum pracy</p></div>
              </div>
              <span className="rounded-full bg-[#f0edfa] px-3 py-1 text-xs font-semibold text-[#6753a6]">PREVIEW</span>
            </div>
            <div className="mt-7">
              <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#9a8aaa]">Twój asystent</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#211d30]">Co dziś zrobimy?</h2>
              <p className="mt-2 text-sm text-[#6a6475]">Zacznij od jednego polecenia.</p>
              <div className="mt-6 rounded-2xl border border-[#e8e4ee] bg-[#fbfaff] p-5">
                <div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eee9f7] text-[#6753a6]"><Bot size={18}/></div><p className="text-sm leading-7 text-[#4c465b]">Przygotuj zestawienie okien z podanych wymiarów i zapisz plik.</p></div>
                <div className="ml-12 mt-4 border-l-2 border-[#c7b7e1] pl-4 text-sm leading-6 text-[#777081]">Planowanie zadania → lokalne wykonanie → weryfikacja wyniku.</div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[#ebe9f0] p-4"><Layers3 size={21} color="#6753a6"/><p className="mt-3 text-sm font-semibold">Zadania i procedury</p><p className="mt-1 text-xs text-[#7e7789]">Praca krok po kroku</p></div>
                <div className="rounded-2xl border border-[#ebe9f0] p-4"><ShieldCheck size={21} color="#b69a62"/><p className="mt-3 text-sm font-semibold">Kontrola dostępu</p><p className="mt-1 text-xs text-[#7e7789]">Licencje w przygotowaniu</p></div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between rounded-xl bg-[#f2eff9] px-4 py-3 text-xs text-[#665784]"><span>Podgląd przyszłej aplikacji</span><span>Platinum Violet • 2026</span></div>
          </div>
        </div>
      </section>
      <section className="border-t border-[#e9e6ed] bg-white/70 py-20">
        <div className="nm-shell">
          <div className="nm-eyebrow">Jeden agent. Wiele możliwości.</div>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4"><h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">Mniej powtarzania. Więcej działania.</h2><Link href="/agent" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6753a6]">Poznaj agenta <ArrowRight size={16}/></Link></div>
          <div className="mt-9 grid gap-5 md:grid-cols-3">{skills.map(({icon:Icon,title,detail})=><div key={title} className="nm-card p-7"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eeeaf8] text-[#6753a6]"><Icon size={23}/></div><h3 className="mt-5 text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-7 text-[#6a6575]">{detail}</p></div>)}</div>
        </div>
      </section>
      <section className="nm-shell py-20 text-center"><div className="nm-eyebrow">NaviMind Personal & Business</div><h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Przestrzeń dla Twojej pracy.</h2><p className="nm-lead mx-auto mt-4 max-w-xl">Zobacz planowane pakiety. Wersja demonstracyjna nie umożliwia zakupu ani aktywacji urządzenia.</p><Link href="/plans" className="nm-btn-primary mt-7">Porównaj pakiety <ArrowRight size={16}/></Link></section>
    </main>
  );
}
