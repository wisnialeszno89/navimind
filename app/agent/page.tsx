import Link from "next/link";
import { ArrowRight, Bot, LockKeyhole, Monitor, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { isPrivateWorkspace } from "../lib/workspace";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agent NaviMind – wersja testowa" };

/** Protected Workspace remains on its existing private deployment only. */
export default function AgentLandingPage() {
  if (isPrivateWorkspace()) redirect("/workspace");

  return (
    <main className="relative z-10 flex min-h-[75vh] items-center justify-center px-4 py-14 text-slate-100">
      <section className="w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-900/80 p-7 sm:p-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-xs font-bold tracking-widest text-blue-200"><Sparkles size={14}/> NAVIMIND AGENT</div>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">Poznaj NaviMind.</h1>
        <p className="mt-5 text-base leading-8 text-slate-300">NaviMind rozwijamy jako agenta pracującego w aplikacjach i na komputerze. Tutaj możesz wejść do dostępnego trybu rozmowy. Sterowanie komputerem jest obecnie testowane osobno w chronionym Workspace i nie jest udostępniane publicznie.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link href="/chat" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-4 font-semibold text-white hover:bg-blue-400"><Bot size={19}/> Wejdź do rozmowy <ArrowRight size={17}/></Link>
          <Link href="/plans" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-4 font-semibold hover:bg-white/10">Wybierz swój pakiet <ArrowRight size={17}/></Link>
        </div>
        <div className="mt-8 grid gap-4 border-t border-white/10 pt-7 sm:grid-cols-2">
          <div className="flex items-start gap-3 text-sm text-slate-300"><Monitor size={20} className="shrink-0 text-blue-300"/><span>Prywatne testy agenta komputerowego nadal działają tylko w dotychczasowym środowisku Workspace.</span></div>
          <div className="flex items-start gap-3 text-sm text-slate-300"><LockKeyhole size={20} className="shrink-0 text-blue-300"/><span>Zakupy, generowanie licencji i nowe połączenia z komputerami nie są aktywne.</span></div>
        </div>
      </section>
    </main>
  );
}
