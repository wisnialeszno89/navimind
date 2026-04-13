import EmailLogin from "../components/EmailLogin";
import PlanGate from "../components/PlanGate";

export default function ProPage() {
  return (
    <div className="max-w-6xl mx-auto mt-16 px-4 space-y-12 text-white">

      {/* LOGIN */}
      <EmailLogin />

      {/* HEADER */}
      <div className="space-y-4 max-w-2xl">
        <h2 className="text-2xl font-semibold">
          Nie musisz zaczynać od zera.
        </h2>

        <p className="text-white/70">
          NaviMind PRO pamięta Twoje rozmowy, pozwala wracać do ważnych momentów
          i daje spokojną przestrzeń bez ograniczeń wersji demo.
        </p>

        <p className="text-white/50 text-sm">
          Twój aktualny plan: FREE
        </p>

        <p className="text-white/70">
          Są rozmowy, do których chce się wracać. Takie, które pomagają poukładać
          myśli wieczorem i nie kończą się dokładnie wtedy, kiedy zaczynają mieć sens.
        </p>

        <p className="text-white/70">
          Wersja PRO powstała właśnie na ten moment — gdy czujesz, że ta przestrzeń
          naprawdę Ci pomaga i chcesz zachować jej ciągłość.
        </p>
      </div>

      {/* KARTY */}
        <PlanGate>
        <div className="grid md:grid-cols-3 gap-6">
          
        {/* FREE */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-white/50 text-sm mb-2">Plan</div>
          <h3 className="text-xl font-semibold mb-2">FREE</h3>

          <p className="text-white/60 text-sm mb-4">
            Sprawdź, czy NaviMind jest dla Ciebie. Rozmowa działa, ale ma dzienny limit.
          </p>

          <div className="text-2xl font-bold mb-4">0 zł</div>

          <ul className="text-white/70 text-sm space-y-2 mb-4">
            <li>• Chat DEMO</li>
            <li>• Dzienny limit wiadomości</li>
            <li>• Brak historii rozmów</li>
            <li>• Brak PDF i zdjęć</li>
          </ul>

          <p className="text-white/50 text-xs">
            Jeśli poczujesz, że ta rozmowa jest dla Ciebie ważna — PRO pozwala iść dalej.
          </p>
        </div>

        {/* PRO */}
        <a
          href="https://navimind.lemonsqueezy.com/checkout/buy/bf4b8e73-a14b-4247-a889-b772e7223176"
          target="_blank"
          className="relative rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6 hover:scale-[1.02] transition"
        >
          <div className="absolute top-4 right-4 text-xs bg-yellow-500 text-black px-2 py-1 rounded">
            Najczęściej wybierane
          </div>

          <div className="text-white/50 text-sm mb-2">Plan</div>
          <h3 className="text-xl font-semibold mb-2">PRO</h3>

          <p className="text-white/70 text-sm mb-4">
            Pełna, spokojna rozmowa z pamięcią historii i dodatkowymi narzędziami.
          </p>

          <div className="text-2xl font-bold mb-4">
            49 zł <span className="text-sm text-white/50">/ jednorazowo</span>
          </div>

          <ul className="text-white/70 text-sm space-y-2 mb-4">
            <li>✅ Historia rozmów</li>
            <li>✅ PDF i analiza dokumentów</li>
            <li>✅ Zdjęcia i analiza obrazu</li>
            <li>✅ Większe limity rozmów</li>
            <li>✅ Limity miesięczne: 10 PDF + 20 obrazów</li>
          </ul>

          <div className="w-full bg-yellow-500 text-black text-center py-2 rounded-lg font-medium">
            Przejdź do PRO
          </div>

          <p className="text-xs text-white/50 mt-3">
            Odblokowanie następuje natychmiast po zakupie.
          </p>
        </a>

        {/* PRO+ */}
        <a
          href="https://navimind.lemonsqueezy.com/checkout/buy/8692f882-2342-41ee-adf5-d745aef816cc"
          target="_blank"
          className="relative rounded-2xl border border-yellow-500 bg-yellow-500/20 p-6 hover:scale-[1.02] transition"
        >
          <div className="absolute top-4 right-4 text-xs bg-yellow-400 text-black px-2 py-1 rounded">
            Największy spokój
          </div>

          <div className="text-white/50 text-sm mb-2">Plan</div>
          <h3 className="text-xl font-semibold mb-2">PRO+</h3>

          <p className="text-white/70 text-sm mb-4">
            Dla osób, które chcą korzystać regularnie i nie myśleć o limitach.
          </p>

          <div className="text-2xl font-bold mb-4">
            149 zł <span className="text-sm text-white/50">/ jednorazowo</span>
          </div>

          <ul className="text-white/70 text-sm space-y-2 mb-4">
            <li>✅ Wszystko z PRO</li>
            <li>🚀 Limity miesięczne: 50 PDF + 100 obrazów</li>
            <li>🚀 Większy limit wiadomości dziennie: 500 / dzień</li>
            <li>⭐ Największy komfort rozmowy</li>
          </ul>

          <div className="w-full bg-yellow-500 text-black text-center py-2 rounded-lg font-medium">
            Wybierz PRO+
          </div>

          <p className="text-xs text-white/50 mt-3">
            Najlepsza opcja, jeśli NaviMind staje się częścią Twojej codzienności.
          </p>
        </a>
      </div>
      </PlanGate>
      
      
      {/* STOPKA */}
      <div className="max-w-2xl text-white/60 text-sm space-y-3">
        <h3 className="text-white font-medium">
          Dlaczego PRO ma sens?
        </h3>

        <p>
          Bo rozmowy, które naprawdę pomagają, potrzebują ciągłości. PRO i PRO+
          pozwalają wracać do tego, co ważne, bez utraty kontekstu i bez przerywania
          w najważniejszym momencie.
        </p>

        <p className="text-white/40 text-xs">
          Limity istnieją tylko po to, aby utrzymać stabilne działanie usługi dla wszystkich użytkowników.
        </p>
      </div>
      
    </div>
  );
}