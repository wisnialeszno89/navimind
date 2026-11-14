# Jedna specyfikacja dla zapytania i wykonawcy

Format `window-offer/1` jest wspólną granicą NaviMind → lokalny wykonawca.
Wersja obejmuje aktualne pola czytnika: produkt, ilość, gabaryt, listwę
transportową, otwieranie, barwy po stronach, liczbę szyb, Ug, profil odniesienia
i dodatkowe wymagania. Nie jest jeszcze pełnym modelem konstrukcji skrzydeł.

Pliki `contracts/window-offer-v1.schema.json` i przykład muszą być identyczne
w repozytoriach NaviMind oraz wh-ai-parser. Obie strony walidują ten sam schemat
(Ajv / jsonschema); przykład jest sprawdzany przez oba zestawy testów.
Zmiana niezgodna z kontraktem wymaga nowej wersji. Schema jest plikiem lokalnym,
jej `$id` nie służy pobieraniu danych z internetu.

## Wejścia w Workspace

- **Odczytaj zapytanie okienne PL/DE**: wklejenie kompletnego bieżącego tekstu,
  dwa niezależne odczyty modelu, kontrola cytatów, porównanie pozycji i pól.
  Historia rozmowy nie jest źródłem danych dla tego trybu.
- **Dołącz PDF zapytania**: dotychczasowy czytnik PDF zachowuje własny raport
  i dodatkowo eksportuje ten sam format wspólnej specyfikacji.
- **Pobierz specyfikację pozycji**: JSON przypisany do konkretnej odpowiedzi.
  Kolejne wiadomości nie podmieniają starszego wyniku. Zawartość jest w pamięci
  karty do odświeżenia; pobranie nie oznacza wykonania ani potwierdzenia oferty.

Stan każdego pola: `reported` (odczyt modelu), `missing` (brak), `conflict`
(nierozstrzygnięty odczyt) lub `corrected` (udokumentowana korekta).
`reported` NIE oznacza, że wartość jest prawdziwa. Cytaty wskazują źródło całej
pozycji, nie stanowią jeszcze dowodu znaczenia każdego pojedynczego pola.
Rozbieżności i korekty zachowują swoje opisy; korekta przechowuje wartość sprzed
zmiany i cytat użytkownika. W tekście numery stron są null; PDF zachowuje stronę.

Przy tekście cytaty muszą występować dosłownie w wiadomości (po normalizacji
białych znaków). Kontrola liczb sprawdza jawne mm/cm/m i zapis ilości; nieznana
forma zapisu wymaga sprawdzenia zamiast przyjęcia skali. Kontrola nie rozstrzyga
automatycznie, czy dany wymiar dotyczy szkła, skrzydła czy całej konstrukcji.
Niejednoznaczna numeracja lub wspólny błąd obu odczytów nadal wymaga handlowca.

## Konwencja handlowa Adama

Potwierdzona 13.11.2026: samo R/L dla okna → DKR/DKL; samo R/L dla drzwi →
DR/DL, tylko rozwieranie. Jawne DKR/DKL przy drzwiach pozostaje DKR/DKL.
HST/PSK nie są zamieniane na rozwierne. Kierunek otwierania do środka/na zewnątrz
i perspektywa nie są automatycznie dopowiadane. Konwencja nie dobiera liczby
skrzydeł, podziału, systemu ani okuć.

## Bez przepisywania do drugiego JSON

```powershell
python tools/run_pagen_order.py --specification-file .\specyfikacja-okien.json
```

Najpierw powstaje wynik kontroli kompatybilności. `ready_for_form` dotyczy
wyłącznie uzupełnienia formularza. `review` zawiera numery pozycji, pola i powody,
nie zawiera częściowego zlecenia do wykonania. `--execute-live` otwiera formularz
tylko dla kompatybilnej specyfikacji; nadal nie wysyła zapytania.
Flagi nadpisujące kolor/szyby są przy tym wejściu odrzucane. Trzeba poprawić
specyfikację u źródła, żeby wykonawca nie pracował na innych wymaganiach.

Pierwszy most celowo obsługuje wąski, sprawdzalny zakres: prostokątne okno FIX,
ilość i wymiary, dokładna etykieta profilu oraz opcjonalny biały dwustronny.
Różne profile/ustawienia w pozycjach, DKR/DKL bez kompletnej konstrukcji,
inne kolory, naświetla, listwy, szczegółowe szklenie, dodatkowe wymagania i
uwagi ogólne blokują ten adapter. Niczego nie pomija się po cichu. Końcowy
odczyt formularza zachowuje skrót specyfikacji i kolejność identyfikatorów źródłowych.

Brak wybranego szklenia ma status `not_requested`, nie `verified`. Pełna oferta
wymaga rozszerzenia konstrukcji i katalogu, cen oraz kontroli zapisanego szkicu.
Ten most nie jest jeszcze całym agentem Windows/WH.

## Weryfikacja modelu

NaviMind dodaje `scripts/check-enquiry-model.cjs`: trzy sztuczne zapytania
(PL/DE, numerowane pozycje, cm, R/L zależne od produktu, jawne DKR przy drzwiach,
elektrozaczep tylko przy wskazanej pozycji i niejasna ilość). Kontrola wykonuje
rzeczywiste API na Vercel i przerywa build przy błędnych oczekiwanych polach.
Nie używa danych klientów. Sam odczyt ze zgodnym JSON nie wystarcza do zaliczenia.
Lokalnie bez Vercel jest jawnie pomijana. Stan faktycznego wdrożenia należy
sprawdzić w logu, nie wywnioskować z obecności skryptu.

## Zintegrowany test granicy wykonawcy

`node scripts/check-offer-executor-boundary.cjs <katalog-wykonawcy>` porównuje
oba pliki kontraktu bajt po bajcie, eksportuje dwie pozycje przez rzeczywisty
kod TypeScript i przekazuje wynik do walidatora oraz adaptera Python z przypiętej
rewizji wykonawcy. Sprawdza tekst, PDF i blokadę całego zlecenia, jeśli tylko
jedna pozycja ma nieobsługiwane wymaganie. CI uruchamia tę kontrolę razem
z regresjami rozmowy, przeglądarki i odczytu dokumentów. Nie wykonuje działań.

Test `scripts/check-workspace-offer-ui.py` uruchamia produkcyjny Workspace
w Chromium z odpowiedziami API z fixtures. Sprawdza wybór trybu, wysłanie
bieżącego tekstu, dołączenie PDF, faktyczne pobranie JSON oraz zachowanie
pierwotnej specyfikacji przy kolejnej odpowiedzi. Jakość odczytu modelu
sprawdzają osobne bramki na Vercel; test interfejsu nie udaje wywołań modelu.

## Rozmowa i kolejne poprawki wymiarów

Po odczycie tekstu lub PDF Workspace włącza rozmowę o aktualnej specyfikacji.
`/api/workspace/offer-turn` rozróżnia rozmowę, poprawkę, pytanie o istotny brak
oraz odwołanie oczekującej poprawki. Nie wykonuje działań w konfiguratorze.
Obsługiwane są szerokość, wysokość i osobna listwa transportowa; absolutne
wymiary oraz jawne przyrosty/zmniejszenia w mm, cm i m. Numer źródłowy i
kolejność tabeli są osobnymi selektorami. Kilka pozycji bez wskazania zakresu
wymaga doprecyzowania; dodatkowa rozmowa zachowuje oczekujące pytanie.

Dwa niezależne rozstrzygnięcia korekty muszą prowadzić do identycznych pól,
pozycji i wynikowych wartości. Kod sprawdza cytat, jednostki, selektory oraz
zakres liczb i stosuje cały zestaw zmian atomowo. Rozbieżność nie tworzy nowej
wersji. Jawna korekta usuwa wyłącznie audyt danego pola i pozycji; inne
niejasności, wymagania, uwagi i ograniczenia wykonawcy pozostają zachowane.

Kontrakt v1 zachowuje ostatnią korektę danego pola wraz z jego pierwotną
wartością źródłową i najnowszym cytatem. Każda odpowiedź z poprawką przechowuje
pełną wersję specyfikacji; poprzednie można pobrać lub wybrać przyciskiem
„Pracuj nad tą wersją”. Historia wersji oraz pytanie są w pamięci karty, nie
przetrwają odświeżenia. Należy pobrać potrzebne wersje przed zamknięciem karty.
Nie rozszerzono schematu ani nie wprowadzono niezgodnej historii korekt do v1.

Zmiany ilości, kolorów, konstrukcji, profilu, wyposażenia i cen nie są jeszcze
stosowane tym endpointem. Polecenie mieszające obsługiwane i nieobsługiwane
zmiany ma wyjaśnić ograniczenie zamiast zastosować tylko część. Odczyt nowego
pełnego źródła nadal wymaga trybu „Odczytaj zapytanie okienne PL/DE” lub PDF.

Regresje obejmują rzeczywisty model na wygenerowanych danych, interfejs
Chromium z fixtures API oraz przekazanie dwukrotnie poprawionego eksportu
TypeScript do przypiętego walidatora i adaptera Python. Nie potwierdzają
fizycznej zmiany już otwartego formularza ani gotowej wycenionej oferty.

Dodatkowa kontrola sterowania przeglądarką odrzuca błędny wpis, jeśli bieżące
polecenie ma jeden jawny absolutny wymiar szerokości/wysokości z jednostką,
a docelowe pole jest jednoznacznie opisane w mm. Model otrzymuje jedną próbę
naprawy przeliczenia przed wykonaniem. Kontrola nie przenosi wymiaru starego
celu na późniejsze polecenie zachowania ręcznych zmian; nie interpretuje
przyrostu jako wymiaru absolutnego ani kilku różnych wymiarów jako jednego.

## Rozszerzenie handlowe: window-offer/2

Wersja 2 dodaje typowane korekty ilości, koloru wewnętrznego i zewnętrznego
oraz otwierania. Każde pole ma osobny typ wartości korekty: ilość jest liczbą
całkowitą 1–10000, kolory tekstem pełnego oznaczenia, a otwieranie kodem.
Oba repozytoria przechowują identyczny schemat i przykład v2. Walidatory
czytają nadal v1; istniejących plików kontraktu v1 nie zmieniono. Nowy odczyt
PDF/tekstu nadal eksportuje v1. Pierwsza zastosowana korekta handlowa
przełącza specyfikację na v2; kolejne korekty wymiarów zachowują tę wersję.

Ilość obsługuje wartość docelową i jawne dodanie/odjęcie sztuk, także małe
liczebniki słowne PL/DE. Wymiary pozostają niezmienione. Kolor wymaga strony:
wewnątrz, zewnątrz albo obie strony; krótkie dopowiedzenie rozstrzyga to samo
oczekujące żądanie. Proste aliasy białego, antracytu i mahoniu mają wspólne
nazwy; kodów RAL, oklein, struktur i wykończenia nie dobiera się automatycznie.
Pełne oznaczenia są zachowywane, a kod RAL może mieć ujednolicony odstęp.

Samo R/L jest normalizowane osobno dla każdej wskazanej pozycji: okno
DKR/DKL, drzwi DR/DL. Jawny kod DKR przy drzwiach pozostaje DKR. Zmiana
konstrukcji HST/PSK lub zastąpienie złożonego opisu otwierania samym kodem
zatrzymuje całe polecenie do weryfikacji. Po zmianie koloru/otwierania
wymagania źródłowe pozostają zachowane; jeśli pozycja ma dodatkowe wymagania,
powstaje uwaga do sprawdzenia ich zgodności z nowym ustawieniem.

Wykonawca v2 nadal ma ten sam zakres PAGEN. Ilość poprawionego FIX może
przejść do uzupełnienia formularza; antracyt, inne nieobsługiwane barwy,
DKR/DKL i pozostałe nieobsługiwane konstrukcje blokują całe zlecenie.
Rozszerzenie rozumienia i korekt nie oznacza rozszerzenia katalogu narzędzia.
Zaktualizuj lokalnego wykonawcę z gałęzi fix/window-enquiry-completeness-20261113
przed przekazaniem mu pliku v2. Starszy wykonawca odrzuci go przed działaniem.
