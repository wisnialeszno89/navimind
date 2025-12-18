export default function InformacjePage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8 text-sm leading-relaxed">
      <h1 className="text-2xl font-semibold mb-8">
        Informacje prawne – NaviMind
      </h1>

      {/* ================= REGULAMIN ================= */}

      <h2 className="text-xl font-medium mb-4">
        Regulamin korzystania z NaviMind
      </h2>

      <h3 className="font-medium mt-6 mb-2">1. Informacje ogólne</h3>
      <p>
        NaviMind jest narzędziem do rozmowy, refleksji oraz porządkowania myśli
        z wykorzystaniem sztucznej inteligencji. Aplikacja nie ma na celu
        diagnozowania, leczenia ani zastępowania profesjonalnej pomocy
        medycznej, psychologicznej, prawnej czy finansowej.
      </p>

      <h3 className="font-medium mt-6 mb-2">2. Charakter usługi</h3>
      <ul className="list-disc ml-5">
        <li>Odpowiedzi mają charakter informacyjny i refleksyjny.</li>
        <li>NaviMind nie udziela porad specjalistycznych.</li>
        <li>
          Użytkownik ponosi pełną odpowiedzialność za decyzje podejmowane na
          podstawie uzyskanych informacji.
        </li>
      </ul>

      <h3 className="font-medium mt-6 mb-2">3. Odpowiedzialność użytkownika</h3>
      <p>
        NaviMind nie zastępuje kontaktu z lekarzem, terapeutą, prawnikiem ani
        innym specjalistą. W przypadku zagrożenia zdrowia lub życia użytkownik
        powinien skontaktować się z odpowiednimi służbami.
      </p>

      <h3 className="font-medium mt-6 mb-2">4. Treści wprowadzane przez użytkownika</h3>
      <p>
        Użytkownik ponosi odpowiedzialność za treści, które wprowadza do
        aplikacji. Zabronione jest przesyłanie treści nielegalnych, obraźliwych,
        naruszających prawo lub prawa osób trzecich.
      </p>

      <h3 className="font-medium mt-6 mb-2">5. Pliki i dane</h3>
      <p>
        Użytkownik może przesyłać pliki (np. PDF) wyłącznie w celu ich analizy w
        ramach działania aplikacji. NaviMind nie gwarantuje poprawności ani
        kompletności analizy przesłanych materiałów.
      </p>

      <h3 className="font-medium mt-6 mb-2">6. Ograniczenie odpowiedzialności</h3>
      <p>
        NaviMind nie ponosi odpowiedzialności za skutki decyzji podjętych przez
        użytkownika, błędne interpretacje odpowiedzi ani czasową
        niedostępność usługi.
      </p>

      <h3 className="font-medium mt-6 mb-2">7. Zmiany regulaminu</h3>
      <p>
        Regulamin może być aktualizowany. Aktualna wersja jest zawsze dostępna
        w aplikacji.
      </p>

      {/* ================= PRYWATNOŚĆ ================= */}

      <hr className="my-10 opacity-30" />

      <h2 className="text-xl font-medium mb-4">
        Polityka prywatności NaviMind
      </h2>

      <h3 className="font-medium mt-6 mb-2">1. Zakres danych</h3>
      <p>
        W ramach korzystania z NaviMind mogą być przetwarzane treści rozmów,
        przesyłane pliki oraz dane techniczne niezbędne do działania aplikacji
        (np. identyfikator sesji, licznik użycia, adres IP w logach
        technicznych).
      </p>

      <h3 className="font-medium mt-6 mb-2">2. Brak obowiązku rejestracji</h3>
      <p>
        NaviMind nie wymaga zakładania konta ani podawania danych osobowych,
        takich jak imię, nazwisko czy adres e-mail, chyba że użytkownik
        dobrowolnie poda je w treści rozmowy.
      </p>

      <h3 className="font-medium mt-6 mb-2">3. Cel przetwarzania</h3>
      <p>
        Dane są przetwarzane wyłącznie w celu umożliwienia działania aplikacji,
        generowania odpowiedzi, poprawy jakości usługi oraz zabezpieczenia jej
        przed nadużyciami.
      </p>

      <h3 className="font-medium mt-6 mb-2">4. Udostępnianie danych</h3>
      <p>
        Dane nie są sprzedawane ani udostępniane osobom trzecim, z wyjątkiem
        dostawców technologii niezbędnych do działania aplikacji oraz sytuacji
        wymaganych przepisami prawa.
      </p>

      <h3 className="font-medium mt-6 mb-2">5. Bezpieczeństwo</h3>
      <p>
        Stosowane są środki techniczne i organizacyjne mające na celu ochronę
        danych, jednak żadna usługa internetowa nie daje 100% gwarancji
        bezpieczeństwa.
      </p>

      <h3 className="font-medium mt-6 mb-2">6. Zmiany polityki prywatności</h3>
      <p>
        Polityka prywatności może być aktualizowana. Aktualna wersja jest
        dostępna w aplikacji.
      </p>

      <hr className="my-10 opacity-30" />

      <p className="opacity-60 text-xs">
        Korzystając z NaviMind, akceptujesz powyższe zasady.
      </p>
    </main>
  );
}