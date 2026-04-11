export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import AppShell from "../components/AppShell";
import { getUserPlan } from "../lib/userPlan";
import { PLAN_LIMITS } from "../lib/plans";
import EmailLogin from "../components/EmailLogin";

function formatPrice(pln: number) {
  return `${pln} zł`;
}

export default async function ProPage() {
  const plan = await getUserPlan();

  const proCheckout = process.env.NEXT_PUBLIC_LEMON_CHECKOUT_PRO_PLN!;
  const proPlusCheckout = process.env.NEXT_PUBLIC_LEMON_CHECKOUT_PROPLUS_PLN!;

  const pro = PLAN_LIMITS.pro;
  const proPlus = PLAN_LIMITS.pro_plus;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-5 py-10">

        {/* HEADER */}
        <div className="mb-12">
          <h1 className="text-3xl font-semibold text-white">
            Nie musisz zaczynać od zera.
          </h1>

          <p className="text-white/70 mt-4 max-w-2xl leading-relaxed">
            NaviMind PRO pamięta Twoje rozmowy, pozwala wracać do ważnych momentów
            i daje spokojną przestrzeń bez ograniczeń wersji demo.
          </p>

          <div className="mt-5 text-sm text-white/60">
            Twój aktualny plan:{" "}
            <span className="text-white/90 font-medium">
              {plan === "free" ? "FREE" : plan === "pro" ? "PRO" : "PRO+"}
            </span>

            {plan !== "free" && (
              <a
                href="https://app.lemonsqueezy.com/my-orders"
                target="_blank"
                className="block mt-2 text-xs text-white/50 underline"
              >
                Zarządzaj subskrypcją / anuluj
              </a>
            )}
          </div>
        </div>

        <EmailLogin />

        {/* EMOTIONAL BRIDGE */}
        <div className="mt-10 max-w-2xl text-white/70 text-sm leading-relaxed space-y-4">
          <p>
            Są rozmowy, do których chce się wracać.
            Takie, które pomagają poukładać myśli wieczorem
            i nie kończą się dokładnie wtedy, kiedy zaczynają mieć sens.
          </p>

          <p>
            Wersja PRO powstała właśnie na ten moment —
            gdy czujesz, że ta przestrzeń naprawdę Ci pomaga
            i chcesz zachować jej ciągłość.
          </p>
        </div>

        {/* CARDS */}
        <div className="grid md:grid-cols-3 gap-4">

          {/* FREE */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-xs text-white/60 mb-2">Plan</div>
            <div className="text-xl font-semibold text-white">FREE</div>

            <div className="mt-2 text-white/60 text-sm">
              Sprawdź, czy NaviMind jest dla Ciebie. Rozmowa działa, ale ma dzienny limit.
            </div>

            <div className="mt-6 text-2xl font-semibold text-white">
              {formatPrice(0)}
            </div>

            <ul className="mt-6 text-sm text-white/70 space-y-2">
              <li>• Chat DEMO</li>
              <li>• Dzienny limit wiadomości</li>
              <li>• Brak historii rozmów</li>
              <li>• Brak PDF i zdjęć</li>
            </ul>
          </div>

          {/* PRO */}
          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-6 relative overflow-hidden nm-pro-glow">

            <div className="absolute top-4 right-4 text-xs px-2 py-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-100">
              Najczęściej wybierane
            </div>

            <div className="text-xs text-yellow-200/80 mb-2">Plan</div>
            <div className="text-xl font-semibold text-white">PRO</div>

            <div className="mt-2 text-white/70 text-sm">
              Pełna, spokojna rozmowa z pamięcią historii i dodatkowymi narzędziami.
            </div>

            <div className="mt-6 text-2xl font-semibold text-white">
              {formatPrice(49)}
              <span className="text-sm text-white/60 font-normal"> / miesiąc</span>
            </div>

            <ul className="mt-6 text-sm text-white/80 space-y-2">
              <li>✅ Historia rozmów</li>
              <li>✅ PDF i analiza dokumentów</li>
              <li>✅ Zdjęcia i analiza obrazu</li>
              <li>✅ Większe limity rozmów</li>
              <li>
                ✅ {pro.monthlyPdf} PDF + {pro.monthlyImages} obrazów
              </li>
            </ul>

            {plan === "free" && (
              <a
                href={proCheckout}
                className="mt-6 inline-flex w-full justify-center rounded-xl bg-yellow-500/90 text-black font-semibold py-3 hover:bg-yellow-500 transition"
              >
                Przejdź do PRO
              </a>
            )}

            {plan === "pro" && (
              <div className="mt-6 text-green-400 text-sm text-center">
                ✓ Masz aktywny plan PRO
              </div>
            )}

            {plan === "pro_plus" && (
              <div className="mt-6 text-white/50 text-sm text-center">
                Masz wyższy plan (PRO+)
              </div>
            )}

          </div>

          {/* PRO+ */}
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/15 p-6 relative overflow-hidden nm-proplus-glow">

            <div className="absolute top-4 right-4 text-xs px-2 py-1 rounded-full border border-yellow-500/40 bg-yellow-500/15 text-yellow-100">
              Największy spokój
            </div>

            <div className="text-xs text-yellow-100/90 mb-2">Plan</div>
            <div className="text-xl font-semibold text-white">PRO+</div>

            <div className="mt-2 text-white/70 text-sm">
              Dla osób, które chcą korzystać regularnie i nie myśleć o limitach.
            </div>

            <div className="mt-6 text-2xl font-semibold text-white">
              {formatPrice(149)}
              <span className="text-sm text-white/60 font-normal"> / miesiąc</span>
            </div>

            <ul className="mt-6 text-sm text-white/85 space-y-2">
              <li>✅ Wszystko z PRO</li>
              <li>🚀 {proPlus.monthlyPdf} PDF + {proPlus.monthlyImages}</li>
              <li>🚀 {proPlus.dailyMessages} wiadomości dziennie</li>
            </ul>

            {plan !== "pro_plus" && (
              <a
                href={proPlusCheckout}
                className="mt-6 inline-flex w-full justify-center rounded-xl bg-yellow-400 text-black font-semibold py-3 hover:bg-yellow-300 transition"
              >
                Wybierz PRO+
              </a>
            )}

            {plan === "pro_plus" && (
              <div className="mt-6 text-green-400 text-sm text-center">
                ✓ Masz aktywny plan PRO+
              </div>
            )}

          </div>

        </div>

      </div>
    </AppShell>
  );
}