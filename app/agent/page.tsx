import Link from "next/link";
import { ArrowRight, Bot, LockKeyhole, Monitor, ShieldCheck, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { isPrivateWorkspace } from "../lib/workspace";

export const dynamic = "force-dynamic";
export const metadata = {title:"Agent NaviMind – wersja testowa"};

export default function AgentLandingPage() {
  if (isPrivateWorkspace()) redirect("/workspace");
  return <main className="nm-page flex items-center py-16">
    <section className="nm-shell grid items-center gap-10 lg:grid-cols-[1fr_.85fr]">
      <div className="max-w-xl">
        <span className="nm-kicker"><Sparkles size={14}/> NaviMind Agent · Wersja testowa</span>
        <h1 className="nm-display mt-7">Pracuj mądrzej.<br/><span style={{color:"#6753a6"}}>Nie ciężej.</span></h1>
        <p className="nm-lead mt-6">Witaj w NaviMind. Tutaj możesz uruchomić dostępny tryb rozmowy i poznać kierunek rozwoju agenta. Sterowanie komputerem testujemy wyłącznie w dotychczasowym prywatnym Workspace.</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/chat" className="nm-btn-primary"><Bot size={18}/> Wejdź do rozmowy <ArrowRight size={16}/></Link>
          <Link href="/plans" className="nm-btn-secondary">Wybierz swój pakiet <ArrowRight size={16}/></Link>
        </div>
        <p className="mt-6 flex items-start gap-2 text-sm leading-6 text-[#746f7b]"><LockKeyhole className="mt-1 shrink-0 text-[#6753a6]" size={17}/> Nowe łączenie urządzeń i licencje klientów są wyłączone. Sam podgląd nie uzyskuje dostępu do komputera.</p>
      </div>
      <div className="nm-card p-7 sm:p-9">
        <div className="mb-8 flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eeeaf8] text-[#6753a6]"><Bot size={24}/></div><div><h2 className="font-bold">NaviMind Workspace</h2><p className="text-xs text-[#817a89]">Planowany panel agenta</p></div></div><span className="rounded-full bg-[#f1eef8] px-3 py-1 text-xs font-semibold text-[#6f579f]">DEMO</span></div>
        <div className="space-y-4"><div className="flex items-center gap-4 rounded-xl border border-[#ebe8f0] p-4"><ShieldCheck size={21} className="text-[#6753a6]"/><div><h3 className="text-sm font-semibold">Kontrolowane wykonanie</h3><p className="mt-1 text-xs text-[#777081]">Zadania dopiero po autoryzacji</p></div></div><div className="flex items-center gap-4 rounded-xl border border-[#ebe8f0] p-4"><Monitor size={21} className="text-[#6753a6]"/><div><h3 className="text-sm font-semibold">Komputer użytkownika</h3><p className="mt-1 text-xs text-[#777081]">W publicznym podglądzie: niedostępny</p></div></div></div>
        <Link href="/license" className="nm-btn-secondary mt-7 w-full">Jak będzie działać aktywacja <ArrowRight size={16}/></Link>
      </div>
    </section>
  </main>;
}
