# Potwierdzenie strony przed zadaniem przeglądarkowym

Polecenie z jednym publicznym URL nie może zakończyć się opisem pozostawionego
laboratorium. Route `browser-plan` porównuje adres ze snapshotem przed wywołaniem
modelu i przygotowuje nawigację do adresu podanego przez użytkownika. Krok nadal
wykonuje sparowany lokalny wykonawca z kontrolą aktualnej rewizji strony.

Po nawigacji nowa obserwacja ma potwierdzić docelową lokalizację. Jeśli potwierdzony
krok wraca na inną stronę, route zwraca review zamiast powtarzania nawigacji lub
zgłoszenia sukcesu. Walidator decyzji dodatkowo blokuje `done` na obcej stronie.

Klient zachowuje adres obserwacji początkowej oraz adresy po krokach. Po osiągnięciu
wskazanej strony zwykła nawigacja w tym samym serwisie pozostaje możliwa. Dla kilku
adresów, gdy żaden nie odpowiada aktualnej stronie, wykonawca prosi o wskazanie
jednego. Zwracany wynik pokazuje aktualnie odczytany adres i tytuł strony.

Porównanie obejmuje protokół, host, port i ścieżkę; dopuszcza alias www i końcowy
ukośnik. Snapshot celowo nie zawiera parametrów query/fragment, więc kontrola nie
potwierdza ich zgodności. Nowy serwis lub nieoczekiwane przekierowanie wymaga
osobnego sprawdzenia. Sama zgodność URL nie dowodzi ukończenia konfiguracji:
model nadal musi sprawdzić treść, dostępne kontrolki i efekt każdej akcji.

Zmiana jest po stronie NaviMind; nie wymaga nowej wersji wykonawcy Windows ani
nowego parowania. Odświeżenie Workspace pobiera widoczne potwierdzenie adresu.
