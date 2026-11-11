# Przeglądarka NaviMind — pilot

Wymaga prywatnej przestrzeni pracy i lokalnego wykonawcy z gałęzi `feat/windowhub-order-preferences-20261109`, uruchomionego z `--execute-live --browser`. Po Ctrl+F5 i ponownym parowaniu wybierz **Przeglądarka · Chromium NaviMind**. To osobny tryb od tabel i zwykłej rozmowy.

Po wysłaniu polecenia czat pobiera `/browser/observe` bezpośrednio z pętli lokalnej, przekazuje tekst strony i opis kontrolek do `/api/workspace/browser-plan`, otrzymuje jeden walidowany krok i wykonuje go przez istniejący protokół `/execute`. Kod parowania nigdy nie trafia do tego API. Widok po kroku jest ponownie analizowany; do 12 kroków na polecenie. Identyfikatory elementów pochodzą tylko z aktualnego odczytu. Rewizję kontroluje też lokalny moduł przed wykonaniem.

Stop działa przed kolejnym krokiem; nie cofa wykonanego. Zerwane połączenie po rozpoczęciu kroku zachowuje identyfikator do odczytu przez „Sprawdź wynik zadania”, bez automatycznego powtarzania. Błąd planowania po wcześniejszych działaniach nie ukrywa ich ani nie przywraca zlecenia jak niewykonanego. Zmiana strony przed akcją pozwala na maksymalnie dwa ponowne odczyty, bez starego kliknięcia.

Dostępne są nawigacja publiczna http/https, pola tekstowe i liczbowe, listy select, menu, przewijanie i Wstecz. Obecna implementacja odczytuje DOM głównego dokumentu jednej karty, nie analizuje pikseli. Nie przejmuje Firefoksa ani domyślnego profilu Chrome. Zwykłe okno Chromium i sesja pozostają na komputerze użytkownika.

Hasła, kody, końcowe wysyłanie, usuwanie, zakupy, zwroty oraz wypłaty wymagają ręcznej obsługi. Lokalny moduł odrzuca submit i wrażliwe pola/etykiety niezależnie od propozycji modelu. Filtr etykiet nie jest pełnym rozpoznawaniem semantyki każdej strony; pierwsze zadania obserwujemy w fikcyjnym formularzu. Nie ma dowolnego Javascriptu, CSS, skryptów ani współrzędnych z modelu.

Domyślne laboratorium: `Wybierz dokładnie Top Trans, ustaw szerokość 1100 mm, wysokość 1000 mm, kolor antracyt, okucie DKR i pokaż podgląd.` Oczekiwany widok końcowy zawiera PODGLĄD GOTOWY i zgodne dane. Cena i zamówienie nie powstają. Test natywnego adaptera na Windows: `python tools/test_navimind_browser_live.py --execute-live`.

Walidacja serwera i route: `node --test tests/browser-plan.test.cjs`. Testy lokalne sesji, wersji widoku, idempotencji, niewysyłania wartości i blokad: `python -m unittest discover -s tests -p test_navimind_browser.py`. Próbę Chromium na Windows wykonuje się oddzielnie; testy atrap DOM jej nie zastępują.
