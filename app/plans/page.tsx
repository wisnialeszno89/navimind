import Link from "next/link";
import { ArrowRight, Check, CircleHelp, Cpu, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { commercialPlans } from "../lib/commercialPlans";

export const metadata = {
  title: "Pakiety NaviMind – Personal i Business",
  description: "Wstępny cennik NaviMind: automatyzacja komputera dla użytkowników prywatnych i firm.",
};

export default function PlansPage() {
  return (
    <main className="relative z-10 min-h-screen px-4 pb-24 pt-14 text-slate-100 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
            <Sparkles size={14} /> NaviMind desktop agent
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            Twój komputer. <span className="text-blue-400">Więcej możliwości.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Wybierz pakiet agenta, który pomaga wykonywać powtarzalne zadania w aplikacjach.
            Lokalne działania i inteligencja AI w jednym miejscu.
          </p>
          <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-300/5 px-5 py-3 text-sm text-amber-100">
            Wersja przedpremierowa cennika. Pakiety, limity i zakup nie są jeszcze aktywne.
            Poniższe ceny są propozycją, nie ofertą zakupu.
          </div>
        </div>

        <div className="mt-14 flex items-end justify-between gap-4 border-b border-white/10 pb-4">
          <div><p className="text-xs font-semibold uppercase tracking-widest text-blue-300">Dla Ciebie</p>
          <h2 className="mt-1 text-2xl font-semibold">NaviMind Personal</h2></div>
          <span className="hidden text-sm text-slate-400 sm:block">Ceny miesięczne brutto</span>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {commercialPlans.filter((plan) => plan.category === "personal").map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>

        <div className="mt-16 flex items-end justify-between gap-4 border-b border-white/10 pb-4">
          <div><p className="text-xs font-semibold uppercase tracking-widest text-blue-300">Dla firm</p>
          <h2 className="mt-1 text-2xl font-semibold">NaviMind Business</h2></div>
          <span className="hidden text-sm text-slate-400 sm:block">Ceny miesięczne netto, VAT według przepisów</span>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {commercialPlans.filter((plan) => plan.category === "business").map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>

        <section className="mt-16 grid gap-4 md:grid-cols-3">
          <InfoCard icon={<Cpu size={22} />} title="Działanie lokalne" description="Znane czynności mogą być wykonywane lokalnie, bez każdorazowego użycia płatnego modelu." />
          <InfoCard icon={<ShieldCheck size={22} />} title="Kontrola kosztów" description="Każdy pakiet zakłada limit wykorzystania AI. Kosztowne zadania wymagają dodatkowego budżetu." />
          <InfoCard icon={<LockKeyhole size={22} />} title="Twoje decyzje" description="Docelowo wybierzesz pakiet AI lub własny klucz dostawcy. Uprawnienia i płatności dopiero powstaną." />
        </section>

        <section className="mx-auto mt-16 max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-7 sm:p-9">
          <div className="mb-4 flex items-center gap-2 text-blue-300"><CircleHelp size={20} /><h2 className="text-xl font-semibold text-white">Jak działają pakiety?</h2></div>
          <div className="space-y-5 text-sm leading-7 text-slate-300">
            <p><strong className="text-white">Czy agent może być włączony przez całą dobę?</strong> Tak planujemy dostępność aplikacji, ale aktywne wywołania AI wykorzystują przydzielony budżet. Nie oferujemy nieograniczonego AI.</p>
            <p><strong className="text-white">Co po wykorzystaniu AI?</strong> Planowane są doładowania, przejście na wyższy plan lub własny klucz API. Bez automatycznego pobierania dodatkowych pieniędzy.</p>
            <p><strong className="text-white">Czy pakiet Business obejmuje wdrożenie?</strong> Nie. Nauka procesów w konkretnych programach i indywidualne wdrożenia będą wyceniane oddzielnie.</p>
            <p><strong className="text-white">Czy mogę już zapłacić?</strong> Nie. Obecnie można tylko obejrzeć planowany proces wyboru. Żaden przycisk nie uruchamia transakcji.</p>
          </div>
        </section>
        <p className="mx-auto mt-10 max-w-3xl text-center text-xs leading-6 text-slate-500">
          Cennik demonstracyjny. Funkcje, ceny i dostępność podlegają zmianie przed uruchomieniem sprzedaży.
          Pakiety nie są jeszcze powiązane z uprawnieniami obecnej wersji NaviMind PRO / PRO+.
        </p>
      </div>
    </main>
  );
}

type Plan = (typeof commercialPlans)[number];

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <article className={`relative flex h-full flex-col rounded-3xl border p-7 shadow-xl shadow-black/10 sm:p-9 ${plan.highlighted ? "border-blue-400/50 bg-gradient-to-br from-blue-400/10 to-slate-900/80" : "border-white/10 bg-slate-900/60"}`}>
      {plan.highlighted && <span className="absolute right-6 top-6 rounded-full bg-blue-400/20 px-3 py-1 text-xs font-semibold text-blue-200">Polecany</span>}
      <div className="pr-24"><h3 className="text-2xl font-semibold">{plan.name}</h3><p className="mt-3 min-h-[48px] text-sm leading-6 text-slate-300">{plan.description}</p></div>
      <div className="mt-7 flex items-baseline gap-2"><strong className="text-5xl tracking-tight">{plan.pricePln} zł</strong><span className="text-sm text-slate-400">/ mies.</span></div>
      <p className="mt-2 text-sm text-slate-400">Cena {plan.priceTax} · {plan.seats}</p>
      <div className="mt-6 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
        Wliczony budżet AI: <strong className="text-white">{plan.aiBudgetPln} zł / mies.</strong>
      </div>
      <ul className="my-8 flex-1 space-y-4">
        {plan.features.map((feature) => <li className="flex gap-3 text-sm leading-6 text-slate-200" key={feature}><Check size={18} className="mt-1 shrink-0 text-blue-300" />{feature}</li>)}
      </ul>
      <Link href={`/checkout?plan=${plan.id}`} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 ${plan.highlighted ? "bg-blue-500 text-white hover:bg-blue-400" : "bg-white text-slate-900 hover:bg-blue-100"}`}>
        Zobacz kolejny krok <ArrowRight size={17} />
      </Link>
    </article>
  );
}

function InfoCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-6"><div className="mb-3 text-blue-300">{icon}</div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{description}</p></div>;
}
