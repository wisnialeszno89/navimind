import Link from "next/link";
import { ArrowLeft, ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { getCommercialPlan } from "../lib/commercialPlans";

export const metadata = { title: "Wybór pakietu – NaviMind (podgląd)" };

export default function CheckoutPreview({ searchParams }: { searchParams?: { plan?: string } }) {
  // Display-only. No checkout session, payment provider, activation, or entitlement mutation.
  const plan = getCommercialPlan(searchParams?.plan);

  return (
    <main className="relative z-10 flex min-h-[80vh] items-center justify-center px-4 py-16 text-slate-100">
      <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900/90 p-7 shadow-2xl sm:p-10">
        <div className="mb-6 inline-flex rounded-xl border border-blue-400/25 bg-blue-400/10 p-3 text-blue-300"><LockKeyhole size={26}/></div>
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-300">Podgląd ścieżki zakupu</p>
        <h1 className="mt-3 text-3xl font-semibold">Płatności w przygotowaniu</h1>
        <p className="mt-4 leading-7 text-slate-300">Ta strona jest demonstracją przyszłego zakupu. Nie pobieramy płatności, nie zapisujemy zamówienia i nie aktywujemy żadnego pakietu.</p>
        {plan ? (
          <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Wybrany pakiet</p>
            <h2 className="mt-1 text-xl font-semibold">{plan.name}</h2>
            <p className="mt-2 text-2xl font-bold">{plan.pricePln} zł <span className="text-sm font-normal text-slate-400">/ mies. · {plan.priceTax}</span></p>
            <p className="mt-3 text-sm text-slate-300">Zakładany budżet AI: {plan.aiBudgetPln} zł / mies.</p>
          </div>
        ) : <p className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100">Nie wybrano prawidłowego pakietu. Wróć do cennika.</p>}
        <div className="mt-6 flex items-start gap-3 text-sm text-slate-400"><ShieldCheck size={20} className="shrink-0 text-blue-300"/><p>Do czasu podłączenia bramki płatniczej, fakturowania i licencji zakup pozostaje wyłączony. Nie używamy starych linków PRO / PRO+.</p></div>
        <Link href="/license" className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-400/40 bg-blue-400/10 px-5 py-3 font-semibold text-blue-100 hover:bg-blue-400/20">Zobacz, jak będzie działać aktywacja <ArrowRight size={17}/></Link>
        <Link href="/plans" className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3 font-semibold text-white hover:bg-blue-400"><ArrowLeft size={17}/> Wróć do pakietów</Link>
      </section>
    </main>
  );
}
