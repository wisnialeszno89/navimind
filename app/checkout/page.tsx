import Link from "next/link";
import { ArrowLeft, ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { getCommercialPlan } from "../lib/commercialPlans";

export const metadata={title:"Wybór pakietu – NaviMind (podgląd)"};

export default function CheckoutPreview({searchParams}:{searchParams?:{plan?:string}}){
  const plan=getCommercialPlan(searchParams?.plan);
  return <main className="nm-page flex items-center justify-center px-5 py-20">
    <section className="nm-card w-full max-w-xl p-7 sm:p-11">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eeeaf8] text-[#6753a6]"><LockKeyhole size={27}/></div>
      <p className="nm-eyebrow mt-7">Bezpieczny podgląd</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Płatności <span className="text-[#6753a6]">w przygotowaniu.</span></h1>
      <p className="nm-lead mt-5">To demonstracja przyszłego zakupu. Nie pobieramy pieniędzy, nie zapisujemy zamówień i nie aktywujemy żadnych licencji.</p>
      {plan?<div className="mt-8 rounded-2xl border border-[#e7e2ed] bg-[#f8f6fc] p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-[#796c8e]">Wybrany pakiet</p>
        <h2 className="mt-2 text-2xl font-bold">{plan.name}</h2>
        <div className="mt-3 text-3xl font-bold">{plan.pricePln} zł <span className="text-sm font-normal text-[#7b7485]">/ mies. · {plan.priceTax}</span></div>
        <p className="mt-3 text-sm text-[#6c6578]">Planowany budżet AI: {plan.aiBudgetPln} zł / mies.</p>
      </div>:<div className="nm-note mt-7">Nie wybrano poprawnego pakietu. Wróć do cennika.</div>}
      <div className="mt-6 flex items-start gap-3 text-sm leading-7 text-[#696274]"><ShieldCheck size={21} className="mt-1 shrink-0 text-[#6753a6]"/> Zakupy i generowanie licencji pozostają zablokowane do czasu ukończenia i przetestowania systemu.</div>
      <div className="mt-8 flex flex-col gap-3">
        <Link href="/license" className="nm-btn-primary w-full">Zobacz planowaną aktywację <ArrowRight size={17}/></Link>
        <Link href="/plans" className="nm-btn-secondary w-full"><ArrowLeft size={17}/> Wróć do pakietów</Link>
      </div>
    </section>
  </main>;
}
