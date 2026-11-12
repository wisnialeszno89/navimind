import Link from "next/link";
import { Bot, CreditCard, ShieldCheck } from "lucide-react";

/**
 * Navigation for the existing protected Workspace.
 * This component does not alter pairing or authorize desktop access.
 */
export default function WorkspaceHeader() {
  return (
    <header className="relative z-20 w-full border-b border-white/10 bg-slate-950/75">
      <nav aria-label="Nawigacja NaviMind Workspace" className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/workspace" className="text-lg font-semibold tracking-tight text-white">Navi<span className="text-blue-400">Mind</span></Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/workspace" className="inline-flex items-center gap-2 rounded-xl border border-blue-400/30 bg-blue-400/10 px-3 py-2 text-sm text-blue-100 hover:bg-blue-400/20"><Bot size={17}/> Agent – testy</Link>
          <Link href="/plans" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/10"><CreditCard size={17}/> Wybierz swój pakiet</Link>
        </div>
      </nav>
      <div className="flex items-center justify-center gap-2 border-t border-white/5 px-4 py-1.5 text-center text-xs text-slate-400">
        <ShieldCheck size={13}/> Prywatny Workspace · istniejący dostęp testowy, nie licencja handlowa
      </div>
    </header>
  );
}
