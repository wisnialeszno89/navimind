import Link from "next/link";
import { ArrowRight, Bot, Check, CircleHelp, Cpu, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { commercialPlans } from "../lib/commercialPlans";

export const metadata = {title:"Pakiety NaviMind – Personal i Business",description:"Poznaj przyszłe pakiety NaviMind. Cennik demonstracyjny, płatności nieaktywne."};
type Plan=(typeof commercialPlans)[number];

export default function PlansPage(){
  return <main className="nm-page pb-24 pt-16">
    <div className="nm-shell">
      <div className="mx-auto max-w-3xl text-center">
        <span className="nm-kicker"><Sparkles size={14}/> Plan dopasowany do Twojej pracy</span>
        <h1 className="nm-display mt-7">Wybierz swój <span style={{color:"#6753a6"}}>pakiet.</span></h1>
        <p className="nm-lead mx-auto mt-5 max-w-2xl">Proste zasady. Przejrzyste koszty. Narzędzie, które ma pomagać wykonywać zadania — nie tylko o nich rozmawiać.</p>
        <div className="nm-note mx-auto mt-7 max-w-2xl">Wersja demonstracyjna. Pakiety, płatności i aktywacje są obecnie wyłączone. Ceny mogą ulec zmianie przed premierą.</div>
      </div>
      <div className="mt-16 flex flex-wrap items-end justify-between gap-4 border-b border-[#ddd9e7] pb-5"><div><p className="nm-eyebrow">Dla Ciebie</p><h2 className="mt-2 text-3xl font-bold tracking-tight">NaviMind Personal</h2></div><p className="text-sm text-[#787383]">Ceny miesięczne brutto</p></div>
      <div className="mt-7 grid gap-6 md:grid-cols-2">{commercialPlans.filter(p=>p.category==="personal").map(p=><PlanCard plan={p} key={p.id}/>)}</div>
      <div className="mt-20 flex flex-wrap items-end justify-between gap-4 border-b border-[#ddd9e7] pb-5"><div><p className="nm-eyebrow">Dla przedsiębiorców</p><h2 className="mt-2 text-3xl font-bold tracking-tight">NaviMind Business</h2></div><p className="text-sm text-[#787383]">Ceny miesięczne netto + właściwy VAT</p></div>
      <div className="mt-7 grid gap-6 md:grid-cols-2">{commercialPlans.filter(p=>p.category==="business").map(p=><PlanCard plan={p} key={p.id}/>)}</div>
      <div className="mt-20 grid gap-5 md:grid-cols-3">
        <InfoCard icon={<Cpu size={22}/>} title="Inteligencja tam, gdzie potrzebna" text="Znane operacje mogą odbywać się lokalnie, bez kosztu wywołania modelu za każde kliknięcie."/>
        <InfoCard icon={<ShieldCheck size={22}/>} title="Limity pod kontrolą" text="AI wykorzystuje ustalony budżet. Bez niespodziewanych dopłat i bez obietnicy nielimitowanego działania."/>
        <InfoCard icon={<LockKeyhole size={22}/>} title="Aktywacja po zakupie" text="W przyszłości potwierdzona płatność pozwoli na wydanie indywidualnego kodu licencji."/>
      </div>
      <section className="nm-card mx-auto mt-16 max-w-3xl p-8 sm:p-10">
        <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eeeaf8] text-[#6753a6]"><CircleHelp size={22}/></div><h2 className="text-2xl font-bold">Warto wiedzieć</h2></div>
        <div className="mt-7 space-y-5 text-sm leading-7 text-[#625c6b]">
          <p><strong className="text-[#262331]">Czy można korzystać 24/7?</strong> Aplikacja ma być dostępna przez całą dobę, jednak wykorzystanie płatnych modeli AI będzie podlegać limitom pakietu.</p>
          <p><strong className="text-[#262331]">Co po wykorzystaniu AI?</strong> Docelowo dodatkowy budżet albo własny klucz API (BYOK). Bez automatycznych płatności.</p>
          <p><strong className="text-[#262331]">Czy Business zawiera wdrożenie?</strong> Indywidualna konfiguracja procedur firmowych będzie wyceniana osobno.</p>
          <p><strong className="text-[#262331]">Czy mogę już zapłacić?</strong> Nie. Możesz obejrzeć pełny proces wyboru, ale zakup i licencje są wyłączone.</p>
        </div>
      </section>
      <div className="mt-10 flex justify-center"><Link href="/agent" className="nm-btn-secondary"><Bot size={18}/> Wróć do agenta <ArrowRight size={16}/></Link></div>
      <p className="mt-10 text-center text-xs leading-6 text-[#807a89]">Cennik demonstracyjny. Pakiety nie są połączone ze starymi uprawnieniami PRO/PRO+ ani z lokalnym agentem.</p>
    </div>
  </main>;
}

function PlanCard({plan}:{plan:Plan}) {
  return <article className={`nm-card relative flex h-full flex-col overflow-hidden p-7 sm:p-9 ${plan.highlighted?"nm-card-featured":""}`}>
    {plan.highlighted&&<div className="absolute right-0 top-0 rounded-bl-2xl bg-[#6753a6] px-5 py-2 text-xs font-semibold text-white">Polecany</div>}
    <div className="pr-16"><div className="nm-gold-line"/><h3 className="mt-5 text-2xl font-bold tracking-tight">{plan.name}</h3><p className="mt-3 min-h-[48px] text-sm leading-6 text-[#746d7e]">{plan.description}</p></div>
    <div className="mt-6 flex items-baseline gap-2"><strong className="text-5xl font-bold tracking-tight text-[#252130]">{plan.pricePln} zł</strong><span className="text-sm text-[#7c7585]">/ mies.</span></div>
    <p className="mt-2 text-sm text-[#7c7585]">Cena {plan.priceTax} · {plan.seats}</p>
    <div className="mt-6 rounded-xl border border-[#e8e1f2] bg-[#f6f3fb] px-4 py-4 text-sm text-[#4b3d68]">Wliczony budżet AI: <strong>{plan.aiBudgetPln} zł / mies.</strong></div>
    <ul className="my-8 flex-1 space-y-4">{plan.features.map(feature=><li key={feature} className="flex gap-3 text-sm leading-6 text-[#514a5d]"><Check size={17} className="mt-1 shrink-0 text-[#6753a6]"/>{feature}</li>)}</ul>
    <Link href={`/checkout?plan=${plan.id}`} className={plan.highlighted?"nm-btn-primary w-full":"nm-btn-secondary w-full"}>Zobacz plan zakupu <ArrowRight size={17}/></Link>
  </article>;
}
function InfoCard({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){
  return <div className="nm-card p-7"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eeeaf8] text-[#6753a6]">{icon}</div><h3 className="mt-5 text-lg font-bold">{title}</h3><p className="mt-3 text-sm leading-7 text-[#726c7a]">{text}</p></div>;
}
